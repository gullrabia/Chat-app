import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedImg, setSelectedImg] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authUser) {
      setName(authUser.fullName || "");
      setBio(authUser.bio || "");
    }
  }, [authUser]);

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });
  };

  const fetchBase64FromURL = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return await convertToBase64(blob);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Image must be less than 2MB");
        return;
      }
      setSelectedImg(file);
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      let profilePic = "";

      if (selectedImg) {
        profilePic = await convertToBase64(selectedImg);
      } else if (authUser?.profilePic) {
        profilePic = authUser.profilePic;
      } else {
        profilePic = await fetchBase64FromURL(assets.avatar_icon);
      }

      const updatedData = {
        fullName: name.trim(),
        bio: bio.trim(),
        profilePic,
      };

      console.log("Sending to backend:", updatedData);

      await updateProfile(updatedData);
      toast.success("Profile updated successfully!");
      navigate("/");
    } catch (err) {
      console.error("Profile update failed:", err);
      setError(err?.response?.data?.message || "Failed to update profile");
      toast.error(err?.response?.data?.message || "Profile update failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading user data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-no-repeat flex items-center justify-center">
      <div className="w-5/6 max-w-2xl backdrop-blur-md text-gray-300 border border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg overflow-hidden">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 p-10 flex-1"
        >
          <h3 className="text-lg font-semibold">Profile Details</h3>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          <label
            htmlFor="avatar"
            className="flex items-center gap-3 cursor-pointer"
          >
            <input
              type="file"
              id="avatar"
              accept="image/png, image/jpg, image/jpeg"
              hidden
              onChange={handleImageChange}
            />
            <img
              src={
                selectedImg
                  ? URL.createObjectURL(selectedImg)
                  : authUser?.profilePic || assets.avatar_icon
              }
              alt="Profile Preview"
              className="w-12 h-12 rounded-full object-cover"
            />
            <span>Upload Profile Image</span>
          </label>

          <input
            type="text"
            required
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <textarea
            required
            placeholder="Write your profile bio"
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          <button
            type="submit"
            disabled={isLoading}
            className={`py-3 bg-gradient-to-r from-purple-400 to-violet-600 text-white rounded-md hover:opacity-90 ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </form>

        <img
          src={
            selectedImg
              ? URL.createObjectURL(selectedImg)
              : authUser?.profilePic || assets.logo_icon
          }
          alt="Current Profile"
          className="max-w-44 aspect-square rounded-full mx-10 max-sm:mt-10 object-cover"
        />
      </div>
    </div>
  );
};

export default ProfilePage;
