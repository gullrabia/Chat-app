import { useContext, useEffect, useState, createContext } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios, authUser } = useContext(AuthContext);

  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages || {});
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load messages.");
    }
  };

  const sendMessage = async (messageData) => {
    try {
      if (!selectedUser?._id) {
        toast.error("No user selected to send message.");
        return;
      }

      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );

      if (data.success) {
        setMessages((prev) => [...(prev || []), data.newMessage]);

        // Emit socket event to receiver
        if (socket && authUser) {
          socket.emit("sendMessage", {
            ...data.newMessage,
            receiverId: selectedUser._id,
          });
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error?.response?.data?.message || "Failed to send message");
    }
  };

  const subscribeToMessages = () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (!newMessage || !newMessage.senderId) return;

      if (selectedUser && newMessage.senderId === selectedUser._id) {
        // Mark message as seen
        newMessage.seen = true;
        setMessages((prev) => [...(prev || []), newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        // Count unseen messages
        setUnseenMessages((prev = {}) => ({
          ...prev,
          [newMessage.senderId]: prev[newMessage.senderId]
            ? prev[newMessage.senderId] + 1
            : 1,
        }));
      }
    });
  };

  const unsubscribeFromMessages = () => {
    if (socket) socket.off("newMessage");
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, selectedUser]);

  return (
    <ChatContext.Provider
      value={{
        getUsers,
        users,
        getMessages,
        messages,
        sendMessage,
        selectedUser,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        setMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
