
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import emailService from '../services/emailService.js';

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map();

// OTP cache storage (in production, use Redis)
const otpCache = new Map();

// Helper function to check rate limiting
const checkRateLimit = (key, maxAttempts, windowMs) => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }
  
  const attempts = rateLimitStore.get(key);
  // Remove old attempts outside the window
  const validAttempts = attempts.filter(timestamp => timestamp > windowStart);
  rateLimitStore.set(key, validAttempts);
  
  return {
    allowed: validAttempts.length < maxAttempts,
    remainingAttempts: Math.max(0, maxAttempts - validAttempts.length),
    remainingTime: validAttempts.length > 0 ? Math.ceil((validAttempts[0] + windowMs - now) / 1000) : 0
  };
};

// Helper function to record attempt
const recordAttempt = (key) => {
  const now = Date.now();
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }
  const attempts = rateLimitStore.get(key);
  attempts.push(now);
  rateLimitStore.set(key, attempts);
};

// Check if email exists (for admin login)
export const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please enter your email address to continue'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address (e.g., yourname@example.com)'
      });
    }

    // Check if staff user exists (admin, manager, or investor)
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      type: { $in: ['admin', 'manager', 'investor'] },
      isActive: true
    });

    if (user) {
      res.status(200).json({
        success: true,
        message: 'Great! We found your account. Please enter your password to continue.'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Sorry, we couldn\'t find a staff account with this email. Please check your email or contact support.'
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Oops! Something went wrong. Please try again in a moment.'
    });
  }
};

// Step 1: Send OTP (Name + Email)
export const sendOTP = async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validation
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both your name and email address to get started'
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address (e.g., yourname@example.com)'
      });
    }

    // Check if user already exists (permanent user)
    const existingUser = await User.findOne({ 
      email: email.toLowerCase()
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please try logging in instead or use a different email address.'
      });
    }

    // Rate limiting: 3 OTP requests per 5 minutes per email
    const rateLimitKey = `otp_${email.toLowerCase()}`;
    const rateLimit = checkRateLimit(rateLimitKey, 3, 5 * 60 * 1000); // 5 minutes

    if (!rateLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: 'You\'ve requested too many codes recently. Please wait a moment before requesting another one.',
        remainingTime: rateLimit.remainingTime
      });
    }

    // Generate OTP
    const otp = emailService.generateOTP();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Log OTP for debugging

    // Store OTP in cache (not database)
    otpCache.set(email.toLowerCase(), {
      name: name.trim(),
      email: email.toLowerCase(),
      otp,
      otpExpires,
      createdAt: Date.now()
    });

    // Send OTP email
    try {
      await emailService.sendOTP(email, otp, name);
      
      // Record the attempt
      recordAttempt(rateLimitKey);
      
      res.status(200).json({
        success: true,
        message: 'Perfect! We\'ve sent a verification code to your email. Please check your inbox.'
      });
    } catch (emailError) {
      res.status(500).json({
        success: false,
        message: 'We\'re having trouble sending the verification code. Please try again in a moment.'
      });
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Oops! Something went wrong. Please try again in a moment.'
    });
  }
};

// Step 2: Verify OTP (Only verification, no user creation)
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both your email and the verification code'
      });
    }

    // Get OTP from cache
    const otpData = otpCache.get(email.toLowerCase());

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'We couldn\'t find a verification code for this email. Please start the registration process again.'
      });
    }

    // Check if OTP is expired
    if (otpData.otpExpires < Date.now()) {
      // Remove expired OTP from cache
      otpCache.delete(email.toLowerCase());
      return res.status(400).json({
        success: false,
        message: 'Your verification code has expired. Please request a new one.'
      });
    }

    // Check if OTP matches
    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'The verification code you entered is incorrect. Please check the code and try again.'
      });
    }

    // Log successful OTP verification

    // OTP is valid - just return success, don't create user yet
    res.status(200).json({
      success: true,
      message: 'Great! Your email has been verified. Now you can create your secure password.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Step 3: Complete Registration (Password + Account Creation)
export const register = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    // Validation
    if (!email || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and password are required'
      });
    }

    // Password validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    if (password.length > 12) {
      return res.status(400).json({
        success: false,
        message: 'Password must not exceed 12 characters'
      });
    }

    if (!/[a-z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one lowercase letter'
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one uppercase letter'
      });
    }

    if (!/[0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one number'
      });
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least one symbol'
      });
    }

    // Get OTP data from cache and verify
    const otpData = otpCache.get(email.toLowerCase());

    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'No pending registration found for this email. Please start the registration process again.'
      });
    }

    // Verify OTP again for security
    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check the code and try again.'
      });
    }

    // Log successful final OTP verification

    // Check if OTP is expired
    if (otpData.otpExpires < Date.now()) {
      // Remove expired OTP from cache
      otpCache.delete(email.toLowerCase());
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create permanent user
    const user = new User({
      name: otpData.name,
      email: otpData.email,
      password: hashedPassword,
      type: 'admin',
      lastLogin: new Date()
    });
    
    await user.save();

    // Remove OTP from cache after successful registration
    otpCache.delete(email.toLowerCase());

    // Generate JWT token (unlimited validity)
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        type: user.type
      },
      process.env.JWT_SECRET || 'your-secret-key'
      // No expiration - unlimited validity
    );

    // Send welcome email (optional, don't block registration if it fails)
    try {
      await emailService.sendWelcomeEmail(user.email, user.name);
    } catch (emailError) {
      // Don't fail registration if welcome email fails
    }

    // Return user data (without sensitive information)
    const userResponse = user.toJSON();

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      user: userResponse,
      token
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Login (existing functionality)
export const login = async (req, res) => {
  try {
    const { email, password, customerId, type } = req.body;

    let user;
    
    if (type === 'admin') {
      // Admin login
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required for admin login'
        });
      }

      user = await User.findOne({ 
        email: email.toLowerCase(), 
        type: 'admin',
        isActive: true
      });
    } else if (type === 'manager') {
      // Manager login
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required for manager login'
        });
      }

      user = await User.findOne({ 
        email: email.toLowerCase(), 
        type: 'manager',
        isActive: true
      });
    } else if (type === 'investor') {
      // Investor login - check User collection with investor type
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required for investor login'
        });
      }

      user = await User.findOne({ 
        email: email.toLowerCase(), 
        type: 'investor',
        isActive: true
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid investor credentials'
        });
      }

      // Verify password for investor
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid investor credentials'
        });
      }

      // Update login times for investor
      if (user.lastLogin) {
        user.previousLogin = user.lastLogin;
      }
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token for investor
      const token = jwt.sign(
        { 
          userId: user._id, 
          email: user.email, 
          type: 'investor'
        },
        process.env.JWT_SECRET || 'your-secret-key'
      );

      // Return investor data (without sensitive information)
      const investorResponse = user.toJSON();

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: investorResponse,
        token
      });
    } else {
      // Invalid user type
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Please use admin, manager, or investor login.'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: type === 'admin' 
          ? 'Invalid admin credentials' 
          : type === 'manager'
          ? 'Invalid manager credentials'
          : 'User not found'
      });
    }

    // For admin and manager login, verify password
    if (type === 'admin' || type === 'manager') {
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: type === 'admin' ? 'Invalid admin credentials' : 'Invalid manager credentials'
        });
      }
    }

    // Update login times - save current lastLogin as previousLogin, then update lastLogin
    if (user.lastLogin) {
      user.previousLogin = user.lastLogin;
    }
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token (unlimited validity)
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        type: user.type
      },
      process.env.JWT_SECRET || 'your-secret-key'
      // No expiration - unlimited validity
    );

    // Return user data (without sensitive information)
    const userResponse = user.toJSON();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      token
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get user from database (all types now use User model)
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Return user data (without sensitive information)
    const userResponse = user.toJSON();

    res.status(200).json({
      success: true,
      user: userResponse
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout (optional)
export const logout = async (req, res) => {
  try {
    // In a stateless JWT system, logout is handled client-side
    // You could implement token blacklisting here if needed
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change Password
export const changePassword = async (req, res) => {
  try {
    console.log('🔐 Change password request received:', {
      body: req.body,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : 'no body',
      headers: req.headers['content-type'],
      method: req.method,
      userId: req.user?.userId
    });

    // Check if body exists
    if (!req.body) {
      console.log('❌ Request body is undefined');
      return res.status(400).json({
        success: false,
        message: 'Request body is missing. Please ensure Content-Type is application/json.'
      });
    }

    // Safe destructuring with defaults
    const currentPassword = req.body?.currentPassword;
    const newPassword = req.body?.newPassword;
    const userId = req.user?.userId;

    console.log('🔐 Parsed values:', {
      userId,
      hasCurrentPassword: !!currentPassword,
      hasNewPassword: !!newPassword
    });

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    if (newPassword.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'New password must not exceed 50 characters'
      });
    }

    // Find user (all types now use User model)
    const user = await User.findById(userId);
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has password field
    if (!user.password) {
      console.log('❌ User password field not found');
      return res.status(400).json({
        success: false,
        message: 'User password not found. Please contact administrator.'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      console.log('❌ Current password is incorrect');
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Check if new password is different from current password
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedNewPassword;
    user.updatedAt = new Date();
    await user.save();

    console.log('✅ Password changed successfully for user:', userId);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Cleanup expired OTP records from cache
export const cleanupExpiredOTP = async () => {
  try {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Clean expired OTPs from cache
    for (const [email, otpData] of otpCache.entries()) {
      if (otpData.otpExpires < now) {
        otpCache.delete(email);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
    }
  } catch (error) {
  }
};

// Check if user has permission to add admins
export const checkAddAdminPermission = async (req, res) => {
  try {
    const user = req.user;
    
    // Check if user is admin and has the specific email
    const hasPermission = user.type === 'admin' && user.email === 'installmentadmin@app.com';
    
    res.json({
      success: true,
      hasPermission: hasPermission,
      message: hasPermission ? 'User has permission to add admins' : 'User does not have permission to add admins'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Add new admin
export const addAdmin = async (req, res) => {
  try {
    const user = req.user;
    const { email, name, password } = req.body;
    
    // Check if user has permission to add admins
    if (user.type !== 'admin' || user.email !== 'installmentadmin@app.com') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to add admins'
      });
    }
    
    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Validate password
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }
    
    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create new admin user with permissions
    const newAdmin = new User({
      name: name || email.split('@')[0], // Use provided name or email prefix as default
      email: email.toLowerCase(),
      password: hashedPassword,
      type: 'admin',
      isActive: true,
      permissions: {
        canViewData: true,
        canAddData: true,
        grantedBy: user._id,
        grantedAt: new Date()
      }
    });
    
    await newAdmin.save();
    
    res.status(201).json({
      success: true,
      message: 'Admin created successfully.',
      adminId: newAdmin._id
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
    });
  }
};

// Get all admins (only for main admin)
export const getAdmins = async (req, res) => {
  try {
    // Check if user is the main admin
    if (req.user.type !== 'admin' || req.user.email !== 'installmentadmin@app.com') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only main admin can view admins.' 
      });
    }

    const admins = await User.find({ type: 'admin' })
      .select('-password -otp -otpExpires')
      .sort({ createdAt: -1 });


    res.json({
      success: true,
      admins: admins
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch admins' 
    });
  }
};

// Delete admin (only for main admin)
export const deleteAdmin = async (req, res) => {
  try {
    // Check if user is the main admin
    if (req.user.type !== 'admin' || req.user.email !== 'installmentadmin@app.com') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only main admin can delete admins.' 
      });
    }

    const { id } = req.params;

    // Find the admin to delete
    const adminToDelete = await User.findById(id);
    if (!adminToDelete) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    // Prevent deleting the main admin
    if (adminToDelete.email === 'installmentadmin@app.com') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete the main admin account' 
      });
    }

    // Delete the admin
    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete admin' 
    });
  }
};

// Reset admin password (only for main admin)
export const resetAdminPassword = async (req, res) => {
  try {
    // Check if user is the main admin
    if (req.user.type !== 'admin' || req.user.email !== 'installmentadmin@app.com') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only main admin can reset admin passwords.' 
      });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    // Validate password
    if (!newPassword || !newPassword.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password is required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Find the admin to update
    const adminToUpdate = await User.findById(id);
    if (!adminToUpdate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    // Prevent resetting main admin password
    if (adminToUpdate.email === 'installmentadmin@app.com') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot reset main admin password' 
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    adminToUpdate.password = hashedPassword;
    adminToUpdate.updatedAt = new Date();
    await adminToUpdate.save();

    res.json({
      success: true,
      message: 'Admin password reset successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset admin password' 
    });
  }
};

// Update admin name (only for main admin)
export const updateAdminName = async (req, res) => {
  try {
    // Check if user is the main admin
    if (req.user.type !== 'admin' || req.user.email !== 'installmentadmin@app.com') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only main admin can update admin names.' 
      });
    }

    const { id } = req.params;
    const { name } = req.body;

    // Validate name
    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name is required' 
      });
    }

    // Find the admin to update
    const adminToUpdate = await User.findById(id);
    if (!adminToUpdate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    // Update the admin name
    adminToUpdate.name = name.trim();
    await adminToUpdate.save();

    res.json({
      success: true,
      message: 'Admin name updated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update admin name' 
    });
  }
};

// Grant/revoke admin permissions (only for main admin)
export const updateAdminPermissions = async (req, res) => {
  try {
    // Check if user is the main admin
    if (req.user.type !== 'admin' || req.user.email !== 'installmentadmin@app.com') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Only main admin can manage permissions.' 
      });
    }

    const { id } = req.params;
    const { canViewData, canAddData } = req.body;

    // Find the admin to update
    const adminToUpdate = await User.findById(id);
    if (!adminToUpdate) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    // Prevent modifying main admin permissions
    if (adminToUpdate.email === 'installmentadmin@app.com') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot modify main admin permissions' 
      });
    }

    // Grant or revoke permissions
    if (canViewData || canAddData) {
      await adminToUpdate.grantPermissions(req.user.userId, canViewData, canAddData);
      res.json({
        success: true,
        message: 'Admin permissions granted successfully'
      });
    } else {
      await adminToUpdate.revokePermissions();
      res.json({
        success: true,
        message: 'Admin permissions revoked successfully'
      });
    }
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update admin permissions' 
    });
  }
};

// Get current user's permissions
export const getMyPermissions = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Main admin has all permissions
    if (user.isMainAdmin()) {
      return res.json({
        success: true,
        permissions: {
          canViewData: true,
          canAddData: true,
          isMainAdmin: true
        }
      });
    }

    // Return admin permissions
    res.json({
      success: true,
      permissions: {
        canViewData: user.canViewData(),
        canAddData: user.canAddData(),
        isMainAdmin: false,
        grantedBy: user.permissions?.grantedBy,
        grantedAt: user.permissions?.grantedAt
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get permissions' 
    });
  }
};