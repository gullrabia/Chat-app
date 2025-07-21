
import React, { useContext, useEffect, useState, useRef } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages = [],
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
  } = useContext(ChatContext);

  const { authUser, onlineUsers = [] } = useContext(AuthContext);

  const scrollEnd = useRef();
  const [input, setInput] = useState("");

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    await sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Select a valid image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      await sendMessage({ image: reader.result });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!window.socket || !authUser) return;

    window.socket.on("newMessage", (newMsg) => {
      if (
        newMsg.senderId === selectedUser?._id ||
        newMsg.receiverId === selectedUser?._id
      ) {
        getMessages(selectedUser._id);
      }
    });

    return () => {
      window.socket.off("newMessage");
    };
  }, [selectedUser, authUser]);

  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return selectedUser ? (
    <div className="h-full overflow-scroll relative backdrop:blur-lg">
      {/* Header */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-stone-500">
        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          alt=""
          className="w-8 rounded-full"
        />
        <p className="flex-1 text-lg text-white flex items-center gap-2">
          {selectedUser.fullName}
          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500" />
          )}
        </p>
        <img
          src={assets.arrow_icon}
          alt=""
          className="md:hidden max-w-7 cursor-pointer"
          onClick={() => setSelectedUser(null)}
        />
        <img src={assets.help_icon} className="max-md:hidden max-w-5" alt="" />
      </div>

      {/* Chat area */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-32">
        {(messages || []).map((msg, index) => {
          if (!msg || typeof msg !== "object") return null;

          const isSender = msg?.senderId === authUser?._id;

          return (
            <div
              key={msg._id || index}
              className={`flex items-end gap-2 mb-4 ${
                isSender ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <img
                src={
                  isSender
                    ? authUser?.profilePic || assets.avatar_icon
                    : selectedUser?.profilePic || assets.avatar_icon
                }
                alt=""
                className="w-7 h-7 rounded-full object-cover"
              />

              {msg.image ? (
                <img
                  src={msg.image}
                  alt=""
                  className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden"
                />
              ) : (
                <p
                  className={`p-2 text-sm max-w-[250px] break-words rounded-lg text-white ${
                    isSender
                      ? "bg-blue-500/30 rounded-br-none"
                      : "bg-gray-700/30 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </p>
              )}
              <p className="text-xs text-gray-500">
                {formatMessageTime(msg.createdAt)}
              </p>
            </div>
          );
        })}
        <div ref={scrollEnd}></div>

        {/* Bottom input area */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 bg-[#1a1a1a]">
          <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage(e)}
              type="text"
              placeholder="Send a message"
              className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400 bg-transparent"
            />
            <input
              onChange={handleSendImage}
              type="file"
              id="image"
              accept="image/png, image/jpeg"
              hidden
            />
            <label htmlFor="image">
              <img
                src={assets.gallery_icon}
                alt=""
                className="w-5 mr-2 cursor-pointer"
              />
            </label>
          </div>
          <img
            onClick={handleSendMessage}
            src={assets.send_button}
            alt=""
            className="w-7 cursor-pointer"
          />
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
      <img src={assets.logo_icon} className="max-w-16" alt="Chat logo" />
      <p className="text-lg font-medium text-white">Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatContainer;
