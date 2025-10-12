import express from 'express';
import {
  checkEmailExists,
  sendOTP,
  verifyOTP,
  register,
  login,
  logout,
  getProfile,
  changePassword,
  checkAddAdminPermission,
  addAdmin,
  getAdmins,
  deleteAdmin,
  updateAdminName
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
router.post('/change-password', authenticateToken, changePassword); // Change password
router.get('/check-add-admin-permission', authenticateToken, checkAddAdminPermission); // Check if user can add admins
router.post('/add-admin', authenticateToken, addAdmin); // Add new admin
router.get('/admins', authenticateToken, getAdmins); // Get all admins
router.delete('/admins/:id', authenticateToken, deleteAdmin); // Delete admin
router.put('/admins/:id/name', authenticateToken, updateAdminName);
export default router;
