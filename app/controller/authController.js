const bcrypt = require("bcrypt");
const User = require("../model/userModel");
const generateTokens = require("../helper/generatetoken");

class AuthController {
  //Register
  async register(req, res) {
    try {
      const { name, email, password, role } = req.body;

      // Prevent role assignment by non-superadmin
      if (role && role !== "employee") {
        return res
          .status(403)
          .json({ message: "Only Super Admin can assign roles" });
      }
      //existing user cheking
      const existingUser = await User.findOne({ email });
      if (existingUser)
        return res.status(400).json({ message: "User already exists" });
      //hased password
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({ name, email, password: hashedPassword });
      res.status(201).json({ message: "User registered", user });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
  //Login

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });

      if (!user) return res.status(404).json({ message: "User not found" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(401).json({ message: "Invalid credentials" });

      const { accessToken, refreshToken } = generateTokens(user);
      // Store refreshToken in DB
      user.refreshToken = refreshToken;
      await user.save();
      res
        .cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        .json({ message: "Login sucessfull", token: accessToken });
    } catch (error) {}
  }
  //=======================RefreshToken=================
  async refresh(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken; // from cookie

      const user = await User.findOne({ refreshToken });
      if (!user)
        return res.status(403).json({ message: "Invalid refresh token" });

      // Verify token validity
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
          if (err)
            return res
              .status(403)
              .json({ message: "Invalid or expired refresh token" });

          // Issue new access token
          const accessToken = jwt.sign(
            { id: decoded.id, role: decoded.role },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: "15m" }
          );

          res.json({ accessToken });
        }
      );
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async logout(req, res) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) return res.status(204).send(); // no content

      // Delete refresh token from DB
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }

      res.clearCookie("refreshToken", { httpOnly: true, secure: false });
      return res.json({ message: "Logged out successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
}

module.exports = new AuthController();
