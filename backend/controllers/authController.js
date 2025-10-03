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

    // Check if admin user exists
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      type: 'admin',
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
        message: 'Sorry, we couldn\'t find an admin account with this email. Please check your email or contact support.'
      });
    }

  } catch (error) {
    console.error('Check email error:', error);
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
    console.log(`🔐 OTP Generated for ${email}: ${otp} (Expires in 10 minutes)`);

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
      console.error('Email sending error:', emailError);
      res.status(500).json({
        success: false,
        message: 'We\'re having trouble sending the verification code. Please try again in a moment.'
      });
    }

  } catch (error) {
    console.error('Send OTP error:', error);
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
      console.log(`❌ OTP Verification Failed for ${email}: Expected ${otpData.otp}, Got ${otp}`);
      return res.status(400).json({
        success: false,
        message: 'The verification code you entered is incorrect. Please check the code and try again.'
      });
    }

    // Log successful OTP verification
    console.log(`✅ OTP Verified Successfully for ${email}: ${otp}`);

    // OTP is valid - just return success, don't create user yet
    res.status(200).json({
      success: true,
      message: 'Great! Your email has been verified. Now you can create your secure password.'
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
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
      console.log(`❌ Final OTP Verification Failed for ${email}: Expected ${otpData.otp}, Got ${otp}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check the code and try again.'
      });
    }

    // Log successful final OTP verification
    console.log(`✅ Final OTP Verification Successful for ${email}: ${otp}`);

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
      console.error('Welcome email error:', emailError);
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
    console.error('Registration error:', error);
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
    } else {
      // Invalid user type
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Please use admin or manager login.'
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

    // Update last login
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
    console.error('Login error:', error);
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
    console.error('Get profile error:', error);
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
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change Password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.userId;

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

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
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

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.'
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
      console.log(`🧹 Cleaned up ${cleanedCount} expired OTP records from cache`);
    }
  } catch (error) {
    console.error('Cleanup expired OTP error:', error);
  }
};
