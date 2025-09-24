import express from 'express';
import {
  checkEmailExists,
  sendOTP,
  verifyOTP,
  register,
  login,
  logout,
  getProfile
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/check-email', checkEmailExists); // Check if email exists (admin login step 1)
router.post('/send-otp', sendOTP);           // Step 1: Send OTP (name + email)
router.post('/verify-otp', verifyOTP);       // Step 2: Verify OTP only
router.post('/register', register);          // Step 3: Complete registration (password + create user)
router.post('/login', login);                // Login for both admin and customer
router.post('/logout', logout);              // Logout

// Protected routes
router.get('/profile', authenticateToken, getProfile); // Get user profile

export default router;
