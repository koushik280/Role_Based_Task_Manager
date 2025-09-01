const jwt = require("jsonwebtoken");
const User = require("../model/userModel");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Access token required" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) return res.status(401).json({ message: "Invalid or inactive user" });

    req.user = user; // attach logged in user
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token expired or invalid" });
  }
};

module.exports = authMiddleware;
