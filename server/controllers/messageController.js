import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
// Get all users except the loggout in user

export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } })
      .select("-password")
      .lean();

    // count number of messages not seen
    const unseenMessages = {};

    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });

      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });
    await Promise.all(promises);
    res.json({ success: true, users: filteredUsers, unseenMessages });
  } catch (error) {
    console.log(error.message);

    res.json({ success: false, message: error.message });
  }
};

// get all message for selected user

export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;

    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },

        { senderId: selectedUserId, receiverId: myId },
      ],
    }).sort({ created: 1 });

    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);

    res.json({ success: false, message: error.message });
  }
};

// api to mark message as seen using message id

export const markMessagesAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);

    res.json({ success: false, message: error.message });
  }
};
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({
        success: false,
        message: "Text or image is required",
      });
    }

    let imageUrl = "";

    // Handle image upload if image is sent
    if (image) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          folder: "chat-app",
        });
        imageUrl = uploadResponse.secure_url || "";
      } catch (uploadErr) {
        return res.status(500).json({
          success: false,
          message: "Image upload failed",
        });
      }
    }

    // Save the message
    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      newMessage: newMessage,
    });
  } catch (error) {
    console.error("Send Message Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while sending message",
    });
  }
};
