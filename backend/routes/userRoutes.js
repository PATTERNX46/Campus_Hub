const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// --- NEW: INLINE OTP DATABASE MODEL ---
// This creates a temporary storage for OTPs that automatically deletes them after 10 minutes
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  createdAt: { type: Date, expires: '10m', default: Date.now } // Auto-deletes after 10 mins
});
// Check if model exists to prevent crashes during nodemon restarts
const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);

// --- NEW: POST /api/users/send-otp ---
// Public Route: Generates and emails the OTP
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists. Please login.' });

    // 2. Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save OTP to database (overwrite if they requested a new one)
    await OTP.findOneAndDelete({ email });
    await OTP.create({ email, otp });

    // 4. Configure Nodemailer with your Team Gmail App Password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 5. Send the email
    const mailOptions = {
      from: `"CampusHub Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'CampusHub - Your Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa; border-radius: 8px; max-width: 500px; margin: auto;">
          <h2 style="color: #e74c3c;">CampusHub Registration</h2>
          <p style="color: #333; font-size: 16px;">Hello!</p>
          <p style="color: #333; font-size: 16px;">Your email verification code is:</p>
          <div style="background: #fff; padding: 15px; text-align: center; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #2d3436; border: 1px solid #ddd;">
            ${otp}
          </div>
          <p style="color: #888; font-size: 14px; margin-top: 20px;">This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent successfully to your email!' });

  } catch (error) {
    console.error("OTP Error:", error);
    res.status(500).json({ message: 'Failed to send OTP. Check email credentials.', error: error.message });
  }
});

// POST /api/users/register
// Public Route: Register a new user (Now requires OTP!)
router.post('/register', async (req, res) => {
  const { name, email, password, role, adminSecret, otp } = req.body;

  try {
    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // 2. THE SECURITY GATE: Check Admin Secret Key
    if (role === 'Admin') {
      if (adminSecret !== process.env.ADMIN_SECRET_KEY) {
        return res.status(403).json({ message: 'Invalid Admin Secret Key. Access Denied.' });
      }
    }

    // 3. THE NEW OTP GATE: Verify the email code
    if (!otp) {
      return res.status(400).json({ message: 'OTP verification code is required.' });
    }

    const validOtp = await OTP.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP code.' });
    }

    // 4. Hash password and create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'Student' // Default to Student
    });

    // 5. Clean up the used OTP from the database
    await OTP.findOneAndDelete({ email });

    // 6. Send back user data and token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// POST /api/users/login
// Public Route: Authenticate user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ email });
    
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' })
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});

// GET /api/users/profile
// Protected route: Requires a valid token
router.get('/profile', protect, async (req, res) => {
  try {
    // req.user is populated by our authMiddleware
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isInstituteVerified: user.isInstituteVerified,
        joinedAt: user.createdAt
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;