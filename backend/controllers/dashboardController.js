import Installment from '../models/Installment.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    // Get all installment records
    const installmentRecords = await Installment.find()
      .populate('createdBy', 'name email')
      .lean();
    
    // Calculate statistics from nested installments
    let totalInstallments = 0;
    let pendingPayments = 0;
    let completedPayments = 0;
    let totalRevenue = 0;
    const totalProductsSold = installmentRecords.length; // Number of installment plans created
    const recentActivities = [];
    
    installmentRecords.forEach((record, index) => {
      if (record.installments && Array.isArray(record.installments)) {
        totalInstallments += record.installments.length;
        
        record.installments.forEach(installment => {
          if (installment.status === 'paid') {
            completedPayments++;
            totalRevenue += Number(installment.actualPaidAmount || installment.amount || 0);
            
            // Add to recent activities
            recentActivities.push({
              action: 'Payment received',
              user: record.customerName || 'Unknown User',
              time: getTimeAgo(installment.paidDate || record.createdAt),
              amount: Number(installment.actualPaidAmount || installment.amount || 0),
              status: 'paid',
              productName: record.productName
            });
          } else if (installment.status === 'pending') {
            pendingPayments++;
          }
        });
      }
    });
    
    console.log('Calculated stats:', {
      totalProductsSold,
      totalInstallments,
      pendingPayments,
      completedPayments,
      totalRevenue
    });
    
    // Get total managers count
    const totalManagers = await User.countDocuments({ 
      type: 'admin' 
    }) || 0;
    
    // Sort recent activities by date and limit to 10
    recentActivities.sort((a, b) => new Date(b.time) - new Date(a.time));
    const formattedActivities = recentActivities.slice(0, 10);
    
    // Return calculated data
    const stats = {
      totalManagers: Number(totalManagers),
      totalInstallments: Number(totalInstallments),
      totalProductsSold: Number(totalProductsSold),
      pendingPayments: Number(pendingPayments),
      completedPayments: Number(completedPayments),
      totalRevenue: Number(totalRevenue),
      recentActivities: formattedActivities
    };
    
    console.log('Final dashboard stats being sent:', JSON.stringify(stats, null, 2));
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Dashboard stats error:', error);
    
    // Return default values on error
    res.json({
      success: true,
      data: {
        totalManagers: 0,
        totalInstallments: 0,
        totalProductsSold: 0,
        pendingPayments: 0,
        completedPayments: 0,
        totalRevenue: 0,
        recentActivities: []
      }
    });
  }
};

// Get all managers (admin only)
export const getManagers = async (req, res) => {
  try {
    const userType = req.user?.type;
    
    // Only admin can view all managers
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can view all managers.'
      });
    }
    
    const managers = await User.find({ type: 'manager' })
      .select('name email phone type tempPassword isActive createdAt lastLogin')
      .sort({ createdAt: -1 })
      .lean();

    console.log('Found managers:', managers.length);

    res.json({
      success: true,
      managers: managers
    });

  } catch (error) {
    console.error('Get managers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch managers',
      error: error.message
    });
  }
};

// Delete manager
export const deleteManager = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Manager ID is required'
      });
    }

    // Check if manager exists
    const manager = await User.findById(id);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    // Check if manager is admin or manager type
    if (!['admin', 'manager'].includes(manager.type)) {
      return res.status(400).json({
        success: false,
        message: 'Can only delete admin or manager accounts'
      });
    }

    // Delete the manager
    await User.findByIdAndDelete(id);

    console.log('🗑️ Manager deleted:', {
      id: id,
      name: manager.name,
      email: manager.email,
      type: manager.type,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Manager deleted successfully'
    });

  } catch (error) {
    console.error('Delete manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete manager',
      error: error.message
    });
  }
};

// Update manager
export const updateManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, editType } = req.body;

    // Validate ID
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Manager ID is required'
      });
    }

    // Check if manager exists
    const manager = await User.findById(id);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found'
      });
    }

    // Check if manager is admin or manager type
    if (!['admin', 'manager'].includes(manager.type)) {
      return res.status(400).json({
        success: false,
        message: 'Can only update admin or manager accounts'
      });
    }

    let updateData = {};
    let newPassword = null;

    if (editType === 'name') {
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Name must be at least 2 characters long'
        });
      }
      updateData.name = name.trim();
      
      // Also update phone if provided
      if (req.body.phone !== undefined) {
        updateData.phone = req.body.phone.trim();
      }
    }

    if (editType === 'email') {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      // Check if email already exists
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      updateData.email = email.toLowerCase();
      
      // Generate new password for email change
      newPassword = emailService.generateOTP().substring(0, 8); // Use first 8 digits as password
      const bcrypt = await import('bcryptjs');
      updateData.password = await bcrypt.default.hash(newPassword, 12);
      updateData.tempPassword = true;
    }

    if (editType === 'password') {
      if (!password || password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }

      const bcrypt = await import('bcryptjs');
      updateData.password = await bcrypt.default.hash(password, 12);
      updateData.tempPassword = true;
      newPassword = password;
    }

    // Update manager
    const updatedManager = await User.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );

    // Send email notification if password was changed
    if (newPassword && (editType === 'email' || editType === 'password')) {
      try {
        await emailService.sendPasswordResetEmail(
          updatedManager.email,
          updatedManager.name,
          newPassword,
          editType === 'email' ? 'email_changed' : 'password_reset'
        );
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the update if email fails
      }
    }

    res.json({
      success: true,
      message: `Manager ${editType} updated successfully`,
      data: {
        id: updatedManager._id,
        name: updatedManager.name,
        email: updatedManager.email,
        type: updatedManager.type
      }
    });

  } catch (error) {
    console.error('Update manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update manager',
      error: error.message
    });
  }
};

// Add new manager
export const addManager = async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    // Validate input
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Generate secure temporary password (8-12 characters)
    const generateSecurePassword = () => {
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const digits = '0123456789';
      const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      
      const allChars = lowercase + uppercase + digits + symbols;
      const length = Math.floor(Math.random() * 5) + 8; // 8-12 characters
      
      let password = '';
      
      // Ensure at least one character from each category
      password += lowercase[Math.floor(Math.random() * lowercase.length)];
      password += uppercase[Math.floor(Math.random() * uppercase.length)];
      password += digits[Math.floor(Math.random() * digits.length)];
      password += symbols[Math.floor(Math.random() * symbols.length)];
      
      // Fill remaining length with random characters
      for (let i = 4; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      // Shuffle the password
      return password.split('').sort(() => Math.random() - 0.5).join('');
    };
    
    const tempPassword = generateSecurePassword();
    
    console.log('🔑 Generated secure temporary password for', email, ':', tempPassword);
    
    // Hash the password
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create new manager
    const newManager = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      password: hashedPassword,
      type: 'manager',
      tempPassword: true,
      isActive: true
    });

    await newManager.save();

    // Send email with temporary password using emailService
    try {
      // HTML escape function for special characters
      const htmlEscape = (str) => {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      };

      const managerWelcomeTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Manager Account Created</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #3B82F6, #1E40AF); padding: 40px; text-align: center; color: white; }
            .content { padding: 40px; }
            .title { font-size: 28px; font-weight: 800; color: #1f2937; margin-bottom: 16px; }
            .message { color: #6b7280; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
            .credentials { background: #f8fafc; border: 2px solid #e5e7eb; border-radius: 16px; padding: 30px; margin: 30px 0; }
            .credential-item { margin-bottom: 15px; }
            .label { font-weight: 600; color: #374151; }
            .value { color: #1f2937; font-family: 'Courier New', monospace; }
            .password { background: #E2E8F0; padding: 8px 12px; border-radius: 8px; font-size: 18px; font-weight: 700; color: #1f2937; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 16px; margin: 20px 0; color: #92400e; }
            .footer { background: #f9fafb; padding: 30px; text-align: center; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to Installments App!</h1>
              <p>Manager Account Created Successfully</p>
            </div>
            <div class="content">
              <h2 class="title">Hello ${name}!</h2>
              <p class="message">Your manager account has been created successfully. Here are your login credentials:</p>
              
              <div class="credentials">
                <div class="credential-item">
                  <div class="label">Email Address:</div>
                  <div class="value">${email}</div>
                </div>
                <div class="credential-item">
                  <div class="label">Temporary Password:</div>
                  <div class="password">${htmlEscape(tempPassword)}</div>
                </div>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important:</strong> Please change your password after your first login for security reasons.
              </div>
              
              <p class="message">You can now access the admin dashboard and manage installments.</p>
            </div>
            <div class="footer">
              <p>Best regards,<br>Installments App Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: `"Installments App" <abrarmughal4481@gmail.com>`,
        to: email,
        subject: '🎉 Manager Account Created - Installments App',
        html: managerWelcomeTemplate,
        text: `
Installments App - Manager Account Created

Hello ${name}!

Your manager account has been created successfully.

Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

Important: Please change your password after your first login for security reasons.

You can now access the admin dashboard and manage installments.

Best regards,
Installments App Team
        `
      };

      // Use the existing transporter from emailService
      const nodemailer = await import('nodemailer');
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'abrarmughal4481@gmail.com',
          pass: 'pmvhrmrndipyddbv'
        }
      });

      await transporter.sendMail(mailOptions);
      console.log('✅ Manager welcome email sent to:', email);
      console.log('📧 Email details:', {
        to: email,
        name: name,
        tempPassword: tempPassword,
        timestamp: new Date().toISOString()
      });
    } catch (emailError) {
      console.error('❌ Failed to send email:', emailError.message);
      console.log('📧 Email sending failed. Manager created with password:', tempPassword);
      // Don't fail the request if email fails
    }

    console.log('New manager created:', { name, email, type: 'manager' });

    res.json({
      success: true,
      message: 'Manager added successfully',
      data: {
        id: newManager._id,
        name: newManager.name,
        email: newManager.email,
        phone: newManager.phone,
        type: newManager.type
      }
    });

  } catch (error) {
    console.error('Add manager error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add manager',
      error: error.message
    });
  }
};

// Add sample data for testing
export const addSampleData = async (req, res) => {
  try {
    // Check if data already exists
    const existingInstallments = await Installment.countDocuments();
    if (existingInstallments > 0) {
      return res.json({
        success: true,
        message: 'Sample data already exists',
        data: { installments: existingInstallments }
      });
    }

    // Create sample installment records with nested installments
    const sampleRecords = [
      {
        customerId: 'CUST001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '03001234567',
        productName: 'Samsung Galaxy A54',
        totalAmount: 120000,
        advanceAmount: 20000,
        installmentCount: 6,
        installmentUnit: 'months',
        monthlyInstallment: 16667,
        startDate: new Date(),
        dueDay: 15,
        installments: [
          {
            installmentNumber: 1,
            amount: 16667,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'paid',
            paymentMethod: 'cash',
            actualPaidAmount: 16667,
            paidDate: new Date(Date.now() - 2 * 60 * 60 * 1000)
          },
          {
            installmentNumber: 2,
            amount: 16667,
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            status: 'pending',
            paymentMethod: 'cash'
          },
          {
            installmentNumber: 3,
            amount: 16667,
            dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            status: 'pending',
            paymentMethod: 'cash'
          }
        ],
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        customerId: 'CUST002',
        customerName: 'Sarah Khan',
        customerEmail: 'sarah@example.com',
        customerPhone: '03001234568',
        productName: 'iPhone 14',
        totalAmount: 200000,
        advanceAmount: 50000,
        installmentCount: 4,
        installmentUnit: 'months',
        monthlyInstallment: 37500,
        startDate: new Date(),
        dueDay: 20,
        installments: [
          {
            installmentNumber: 1,
            amount: 37500,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            status: 'paid',
            paymentMethod: 'bank',
            actualPaidAmount: 37500,
            paidDate: new Date(Date.now() - 4 * 60 * 60 * 1000)
          },
          {
            installmentNumber: 2,
            amount: 37500,
            dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            status: 'pending',
            paymentMethod: 'bank'
          }
        ],
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
      }
    ];

    await Installment.insertMany(sampleRecords);

    res.json({
      success: true,
      message: 'Sample data added successfully',
      data: { records: sampleRecords.length }
    });

  } catch (error) {
    console.error('Add sample data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add sample data',
      error: error.message
    });
  }
};

// Get current month, next month, and overdue installments for admin dashboard
export const getAllInstallments = async (req, res) => {
  try {
    // Get user information from request (set by auth middleware)
    const user = req.user;
    
    // Get current date and calculate date ranges
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Start of current month
    const startOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    // End of current month
    const endOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    // Start of next month
    const startOfNextMonth = new Date(currentYear, currentMonth + 1, 1);
    // End of next month
    const endOfNextMonth = new Date(currentYear, currentMonth + 2, 0, 23, 59, 59, 999);
    
    // Build query based on user role
    let query = {};
    
    // If user is manager, only show installments assigned to them
    if (user && user.type === 'manager') {
      query.managerId = user.userId;
    } else if (user && user.type === 'admin') {
      // Admin can see all installments
    } else if (user && user.type === 'investor') {
      // Investors can see all installments (same as admin for now)
    }
    
    // Get installment records based on role
    const installmentRecords = await Installment.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Manual populate managerId for all records
    for (const record of installmentRecords) {
      if (record.managerId) {
        const manager = await User.findById(record.managerId);
        if (manager) {
          record.managerId = manager;
        }
      }
    }

    // Process each installment record to filter relevant installments
    const filteredInstallments = [];
    
    for (const record of installmentRecords) {
      for (const installment of record.installments) {
        const dueDate = new Date(installment.dueDate);
        const isOverdue = dueDate < now && installment.status === 'pending';
        const isCurrentMonth = dueDate >= startOfCurrentMonth && dueDate <= endOfCurrentMonth;
        const isNextMonth = dueDate >= startOfNextMonth && dueDate <= endOfNextMonth;
        
        // Include if overdue OR current month OR next month
        if (isOverdue || isCurrentMonth || isNextMonth) {
          // Update status to overdue if past due date
          let status = installment.status;
          if (dueDate < now && installment.status === 'pending') {
            status = 'overdue';
          }
          
          // Calculate paid and unpaid installments for this record
          const totalPaidInstallments = record.installments.filter(inst => inst.status === 'paid').length;
          const totalUnpaidInstallments = record.installments.filter(inst => inst.status !== 'paid').length;
          
          filteredInstallments.push({
            id: `${record._id}-${installment.installmentNumber}`,
            recordId: record._id,
            installmentNumber: installment.installmentNumber,
            customerId: record.customerId,
            customerName: record.customerName,
            customerEmail: record.customerEmail,
            customerPhone: record.customerPhone,
            productName: record.productName,
            productDescription: record.productDescription,
            totalAmount: record.totalAmount,
            advanceAmount: record.advanceAmount,
            amount: installment.amount,
            actualPaidAmount: installment.actualPaidAmount || 0,
            dueDate: installment.dueDate,
            paidDate: installment.paidDate,
            status: status,
            paymentMethod: installment.paymentMethod,
            notes: installment.notes,
            paidBy: installment.paidBy,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            createdBy: record.createdBy,
            managerName: record.managerId ? record.managerId.name : null,
            // Debug: Log manager info
            _debugManager: {
              managerId: record.managerId,
              managerName: record.managerId ? record.managerId.name : 'null',
              managerType: typeof record.managerId
            },
            isOverdue: isOverdue,
            isCurrentMonth: isCurrentMonth,
            isNextMonth: isNextMonth,
            installmentCount: record.installmentCount,
            totalPaidInstallments: totalPaidInstallments,
            totalUnpaidInstallments: totalUnpaidInstallments
          });
        }
      }
    }

    // Sort by due date (oldest first) and overdue first
    filteredInstallments.sort((a, b) => {
      // Overdue items first
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      
      // Then by due date
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
    
    res.json({
      success: true,
      installments: filteredInstallments,
      total: filteredInstallments.length,
      overdue: filteredInstallments.filter(i => i.isOverdue).length,
      currentMonth: filteredInstallments.filter(i => i.isCurrentMonth).length,
      nextMonth: filteredInstallments.filter(i => i.isNextMonth).length
    });
  } catch (error) {
    console.error('Error fetching installments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch installments'
    });
  }
};

// Helper function to get time ago
function getTimeAgo(date) {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}
