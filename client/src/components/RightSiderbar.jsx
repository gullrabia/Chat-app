
import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets.js";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";

const RightSidebar = () => {
  const { selectedUser, messages } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);
  const [msgImages, setMsgImages] = useState([]);

  useEffect(() => {
    if (messages && Array.isArray(messages)) {
      const images = messages
        .filter((msg) => msg?.image)
        .map((msg) => msg.image);
      setMsgImages(images);
    }
  }, [messages]);

  if (!selectedUser) return null;

  return (
    <div
      className={`b-[#818582]/10 text-white w-full relative overflow-y-scroll ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >
      <div className="pt-16 flex flex-col items-center gap-2 text-sx font-light mx-auto">
        <img
          src={selectedUser?.profilePic || assets.avatar_icon}
          alt=""
          className="w-20 aspect-square rounded-full"
        />
        <h1 className="px-10 text-xl font-medium mx-auto flex items-center gap-2">
          {onlineUsers.includes(selectedUser._id) && (
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
          )}
          {selectedUser.fullName}
        </h1>

        <p className="px-10 mx-auto">{selectedUser.bio}</p>
      </div>

      <hr className="border-[#ffffff50] my-4" />

      <div className="px-5 text-xs">
        <p>Media</p>
        <div className="mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80">
          {msgImages.map((url, index) => (
            <div
              key={index}
              onClick={() => window.open(url)}
              className="rounded cursor-pointer"
            >
              <img src={url} alt="" className="h-full rounded-md" />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => logout()}
        className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white text-sm font-light py-2 px-20 rounded-full"
      >
        Logout
      </button>
    </div>
  );
};

export default RightSidebar;
