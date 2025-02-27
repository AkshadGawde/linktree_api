import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Referral from "../models/Referral.js";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import crypto from "crypto";

// ✅ Forgot Password - Generate Reset Token & Send Email
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ error: "User not found" });

    // Generate a secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 min expiry
    await user.save();

    // Email Transporter Setup
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send Password Reset Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${process.env.FRONTEND_URL}/reset-password?token=${resetToken}">here</a> to reset your password. This link expires in 15 minutes.</p>`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Password reset email sent!" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Server error, please try again later." });
  }
};

// ✅ Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Ensure token is not expired
    });

    if (!user)
      return res.status(400).json({ error: "Invalid or expired token" });

    // Hash new password
    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ message: "Password reset successful!" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ error: "Server error, please try again later." });
  }
};

// ✅ User Registration with Referral Tracking
export const register = async (req, res) => {
  try {
    const { username, email, password, referralCode } = req.body;

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ error: "Email already in use" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    let referredBy = null;
    let referrer = null;

    // Validate referral code
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      if (!referrer)
        return res.status(400).json({ error: "Invalid referral code" });
      referredBy = referrer._id;
    }

    // Generate a unique referral code
    const userReferralCode = uuidv4();

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      referralCode: userReferralCode,
      referredBy,
    });

    await newUser.save();

    // ✅ Store referral info if referredBy is present
    if (referrer) {
      console.log("Referral Tracking Triggered: ", {
        referrerId: referrer._id,
        referredUserId: newUser._id,
      });

      await Referral.create({
        referrerId: referrer._id,
        referredUserId: newUser._id,
        status: "successful",
      });

      // ✅ Update referrer's totalReferrals count
      await User.findByIdAndUpdate(referrer._id, {
        $inc: { totalReferrals: 1 },
      });

      console.log("Referral Successfully Saved in DB");
    }

    res.status(201).json({
      message: "User registered successfully",
      referralCode: newUser.referralCode,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "Duplicate entry: username or email already exists" });
    }
    res.status(500).json({ error: "Server error, please try again later." });
  }
};

// ✅ User Login with JWT Token
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error, please try again later." });
  }
};

// ✅ Get User Profile (Protected Route)
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    res.status(500).json({ error: "Server error, please try again later." });
  }
};
