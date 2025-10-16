import User from '../models/User.js';

// Middleware to check if user has view permissions
export const requireViewPermission = async (req, res, next) => {
  try {
    console.log('🔒 PERMISSION MIDDLEWARE HIT - requireViewPermission');
    console.log('👤 User ID:', req.user.userId);
    console.log('📧 User Email:', req.user.email);
    
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Main admin bypasses all permission checks
    if (user.isMainAdmin()) {
      console.log('✅ MAIN ADMIN - Bypassing permission checks');
      req.userPermissions = {
        canViewData: true,
        canAddData: true,
        isMainAdmin: true
      };
      return next();
    }

    console.log('🔍 User permissions:', {
      canViewData: user.canViewData(),
      canAddData: user.canAddData(),
      isMainAdmin: user.isMainAdmin(),
      permissions: user.permissions
    });

    // Check if user can view data
    if (!user.canViewData()) {
      console.log('🚫 ACCESS DENIED - User does not have view permission');
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view this data.'
      });
    }

    console.log('✅ ACCESS GRANTED - User has view permission');

    // Add user permissions to request for use in controllers
    req.userPermissions = {
      canViewData: user.canViewData(),
      canAddData: user.canAddData(),
      isMainAdmin: user.isMainAdmin()
    };

    next();
  } catch (error) {
    console.error('❌ Permission check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to check if user has add permissions
export const requireAddPermission = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Main admin bypasses all permission checks
    if (user.isMainAdmin()) {
      console.log('✅ MAIN ADMIN - Bypassing add permission checks');
      req.userPermissions = {
        canViewData: true,
        canAddData: true,
        isMainAdmin: true
      };
      return next();
    }

    // Check if user can add data
    if (!user.canAddData()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to add data.'
      });
    }

    // Add user permissions to request for use in controllers
    req.userPermissions = {
      canViewData: user.canViewData(),
      canAddData: user.canAddData(),
      isMainAdmin: user.isMainAdmin()
    };

    next();
  } catch (error) {
    console.error('Permission check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Middleware to check if user is main admin
export const requireMainAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is main admin
    if (!user.isMainAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only main admin can perform this action.'
      });
    }

    // Main admin has all permissions
    req.userPermissions = {
      canViewData: true,
      canAddData: true,
      isMainAdmin: true
    };

    next();
  } catch (error) {
    console.error('Main admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
