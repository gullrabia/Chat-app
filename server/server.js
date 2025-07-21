import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";

import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import { Server } from "socket.io";
import messageRouter from "./routes/messageRoutes.js";

const app = express();
const server = http.createServer(app);

//  Initialize Socket.io
export const io = new Server(server, {
  cors: { origin: "*" },
});

//  Store online users
export const userSocketMap = {}; // { userId: socketId }

//  Socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;

  //  Broadcast online users
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  //  Handle real-time message
  socket.on("sendMessage", (message) => {
    const receiverId = message.receiverId;
    const receiverSocketId = userSocketMap[receiverId];

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", message);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

//  Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());

//  Routes
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect to MongoDB and Start Server
await connectDB();


if (process.env.NODE_ENV !== "production"){
  
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log("Server is running on PORT:" + PORT));

}
// for vercel

export default server;