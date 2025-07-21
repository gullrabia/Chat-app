import jwt from "jsonwebtoken";

// Function to generate an token

export const generateToken = (userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET);
  return token;
};
