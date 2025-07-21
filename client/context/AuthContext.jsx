import { createContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/auth/check", {
        headers: {
          Authorization: `Bearer ${token || localStorage.getItem("token")}`,
        },
      });
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      console.error("Auth check error:", error);
      toast.error(error.response?.data?.message || error.message);
      // Clear invalid token
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
      }
    }
  }, [token]);

  // Handle login/registration
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        setToken(data.token);
        localStorage.setItem("token", data.token);
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`;
        connectSocket(data.userData);
        toast.success(data.message);
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      return false;
    }
  };

  // Handle logout
  const logout = useCallback(async () => {
    try {
      await axios.post(
        "/api/auth/logout",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      setToken(null);
      setAuthUser(null);
      setOnlineUsers([]);
      delete axios.defaults.headers.common["Authorization"];
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      toast.success("Logged out successfully");
    }
  }, [token, socket]);

  // Update user profile

  const updateProfile = useCallback(
    async (updatedData) => {
      try {
        const currentToken = token || localStorage.getItem("token");

        if (!currentToken) {
          throw new Error("Authentication required. Please login again.");
        }

        jwtDecode(currentToken); // throws if invalid

        axios.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${currentToken}`;

        const { data } = await axios.put(
          "/api/auth/update-profile",
          updatedData,
          {
            headers: {
              Authorization: `Bearer ${currentToken}`,
              "Content-Type": "application/json", // Accepting raw JSON (not FormData)
            },
          }
        );

        if (data.success) {
          setAuthUser((prev) => ({ ...prev, ...data.updatedUser }));
          return data.updatedUser;
        }

        throw new Error(data.message || "Failed to update profile");
      } catch (error) {
        console.error("Update profile error:", error);

        if (error.response?.status === 401) {
          logout();
          throw new Error("Session expired. Please login again.");
        }

        throw new Error(error.response?.data?.message || error.message);
      }
    },
    [token, logout]
  );

  // Connect to socket.io
  const connectSocket = useCallback(
    (userData) => {
      if (!userData?._id) return;

      // Disconnect existing socket if exists
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }

      try {
        const newSocket = io(backendUrl, {
          query: {
            userId: userData._id,
          },
          auth: {
            token: token || localStorage.getItem("token"),
          },
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          transports: ["websocket"],
        });

        newSocket.on("connect", () => {
          console.log("Socket connected");
          setSocket(newSocket);
        });

        newSocket.on("disconnect", () => {
          console.log("Socket disconnected");
        });

        newSocket.on("getOnlineUsers", (userIds) => {
          setOnlineUsers(userIds);
        });

        newSocket.on("connect_error", (err) => {
          console.error("Socket connection error:", err);
          if (err.message.includes("invalid token")) {
            logout();
          }
        });
      } catch (err) {
        console.error("Socket initialization error:", err);
      }
    },
    [socket, token, logout]
  );

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          // Verify token is valid before using it
          jwtDecode(storedToken);
          axios.defaults.headers.common[
            "Authorization"
          ] = `Bearer ${storedToken}`;
          await checkAuth();
        } catch (error) {
          console.error("Invalid token:", error);
          localStorage.removeItem("token");
          setToken(null);
          setAuthUser(null);
        }
      }
    };

    initializeAuth();
  }, [checkAuth]);

  // Clean up socket on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    token,
    login,
    logout,
    updateProfile,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
