const express = require('express');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer'); // NEW: Added for sending emails
const User = require('../models/User');
const router = express.Router();

// Temporary store for OTPs (In a real startup, we'd use a database like Redis for this)
global.otpStore = {}; 

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ==========================================
// NEW ROUTE: POST /api/auth/send-otp
// ==========================================
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // 1. Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Save the OTP globally so the /register route can verify it later
    // It will expire in 5 minutes
    global.otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    // 3. Configure Gmail Transporter using your .env credentials
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // 4. Draft the email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your CampusHub Verification Code',
      text: `Welcome to CampusHub! \n\nYour 6-digit OTP for registration is: ${otp}\n\nThis code will expire in 5 minutes.`
    };

    // 5. Send it!
    await transporter.sendMail(mailOptions);
    console.log(`[Backend] OTP sent successfully to: ${email}`);
    res.status(200).json({ message: "OTP sent successfully! Check your inbox." });

  } catch (error) {
    console.error("[Backend] OTP Error:", error);
    res.status(500).json({ message: "Failed to send email. Check your backend terminal for details!" });
  }
});

// ==========================================
// UPDATED ROUTE: POST /api/auth/register
// ==========================================
router.post('/register', async (req, res) => {
  // NEW: Added 'otp' to the destructured body
  const { name, email, password, role, otp } = req.body; 
  
  console.log(`[Backend] Registration attempt for: ${email}`);

  try {
    // --- NEW: OTP VERIFICATION BLOCK ---
    const storedOtpData = global.otpStore[email];
    
    if (!storedOtpData) {
      return res.status(400).json({ message: "Please request an OTP first." });
    }
    if (Date.now() > storedOtpData.expires) {
      delete global.otpStore[email]; // Clean up expired OTP
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }
    if (storedOtpData.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP. Please try again." });
    }
    
    // If OTP is correct, delete it from memory so it can't be reused
    delete global.otpStore[email];
    // -----------------------------------

    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log(`[Backend] Registration failed: User ${email} already exists`);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate Student Email
    if (role === 'Student') {
      const isEduEmail = email.endsWith('.edu') || email.endsWith('.ac.in');
      if (!isEduEmail) {
        return res.status(400).json({ message: 'Students must use a valid institute email ID.' });
      }
    }

    const user = await User.create({ name, email, password, role });
    
    console.log(`[Backend] Registration SUCCESS for: ${email}`);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error(`[Backend] Registration Error:`, error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

// ==========================================
// EXISTING ROUTE: POST /api/auth/login
// ==========================================
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log(`[Backend] Login attempt for: ${email}`); 

  try {
    // 1. Check if user exists
    const user = await User.findOne({ email });

    // 2. If user exists AND password matches
    if (user && (await user.matchPassword(password))) {
      console.log(`[Backend] Login SUCCESS for: ${email}`);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      // 3. If wrong email or password
      console.log(`[Backend] Login FAILED for: ${email} (Invalid credentials)`);
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error(`[Backend] Login Error:`, error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
});

module.exports = router;