import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
  try {
    // 1. Extract token from headers
    let token = null;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.headers.token) {
      token = req.headers.token;
    }

    // 2. Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized - token missing",
      });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.userId) {
      return res.status(400).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // 4. Get user from DB (without password)
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 5. Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);

    let message = "Authorization failed";
    if (error.name === "JsonWebTokenError") {
      message = "Invalid token";
    } else if (error.name === "TokenExpiredError") {
      message = "Token expired";
    }

    return res.status(401).json({
      success: false,
      message,
    });
  }
};
