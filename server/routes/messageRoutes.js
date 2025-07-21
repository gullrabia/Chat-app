import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
  getMessages,
  getUsersForSidebar,
  markMessagesAsSeen,
  sendMessage, //  Make sure this exists in your controller
} from "../controllers/messageController.js";

const messageRouter = express.Router();

//  Add this route to fix your error
messageRouter.post("/send/:id", protectRoute, sendMessage);

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessagesAsSeen);

export default messageRouter;
