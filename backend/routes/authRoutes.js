const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Temporary store for OTPs (In a real startup, we'd use a database like Redis for this)
global.otpStore = {}; 

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// ==========================================
// BREVO ROUTE: POST /api/auth/send-otp
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

    // 3. Package the email data for Brevo
    const emailData = {
      sender: { name: "CampusHub", email: process.env.EMAIL_USER }, // Ensure this email is verified in Brevo
      to: [{ email: email }],
      subject: 'Your CampusHub Verification Code',
      textContent: `Welcome to CampusHub! \n\nYour 6-digit OTP for registration is: ${otp}\n\nThis code will expire in 5 minutes.`
    };

    // 4. Send HTTP request to Brevo (Bypasses Render's Port 465 block!)
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Backend] Brevo Error:", errorData);
      return res.status(500).json({ message: "Failed to send email via Brevo. Check backend terminal." });
    }

    console.log(`[Backend] OTP sent successfully via Brevo to: ${email}`);
    res.status(200).json({ message: "OTP sent successfully! Check your inbox." });

  } catch (error) {
    console.error("[Backend] OTP Catch Error:", error);
    res.status(500).json({ message: "Server error while sending OTP." });
  }
});

// ==========================================
// EXISTING ROUTE: POST /api/auth/register
// ==========================================
router.post('/register', async (req, res) => {
  const { name, email, password, role, otp } = req.body; 
  
  console.log(`[Backend] Registration attempt for: ${email}`);

  try {
    // --- OTP VERIFICATION BLOCK ---
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
      const isEduEmail = 
        email.endsWith('.edu') || 
        email.endsWith('.ac.in') || 
        email.endsWith('@rccinstitute.org') || 
        email.endsWith('@rccinstitute.org.in');
        
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