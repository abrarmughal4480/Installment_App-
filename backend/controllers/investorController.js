import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// Get all investors (admin only)
export const getInvestors = async (req, res) => {
  try {
    const userType = req.user?.type;
    
    // Only admin can view all investors, but main admin bypasses this check
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can view all investors.'
      });
    }
    
    const investors = await User.find({ type: 'investor' }).select('-password').sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: investors,
      count: investors.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investors',
      error: error.message
    });
  }
};

// Add new investor
export const addInvestor = async (req, res) => {
  try {
    const { name, email, phone, password, investmentAmount, monthlyProfit, joinDate } = req.body;

    // Validation
    if (!name || !email || !phone || !password || investmentAmount === undefined || investmentAmount === null) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if investor already exists
    const existingInvestor = await User.findOne({ email, type: 'investor' });
    if (existingInvestor) {
      return res.status(400).json({
        success: false,
        message: 'Investor with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new investor
    const newInvestor = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      type: 'investor',
      investmentAmount,
      monthlyProfit: monthlyProfit || 0, // Use provided value or default to 0
      joinDate: joinDate ? new Date(joinDate) : new Date(),
      isActive: true
    });

    await newInvestor.save();

    // Return investor without password
    const investorResponse = newInvestor.toJSON();

    res.status(201).json({
      success: true,
      message: 'Investor added successfully',
      data: investorResponse
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add investor',
      error: error.message
    });
  }
};

// Update investor
export const updateInvestor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle password hashing if password is provided
    if (updateData.password) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(updateData.password, saltRounds);
    }

    const updatedInvestor = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedInvestor) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Investor updated successfully',
      data: updatedInvestor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update investor',
      error: error.message
    });
  }
};

// Delete investor
export const deleteInvestor = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedInvestor = await User.findByIdAndDelete(id);

    if (!deletedInvestor) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Investor deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete investor',
      error: error.message
    });
  }
};

// Get investor dashboard data
export const getInvestorDashboard = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const investor = await User.findById(userId).select('-password');
    
    if (!investor || investor.type !== 'investor') {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    // Update current and previous month profits
    investor.updateCurrentAndPreviousMonthProfits();
    await investor.save();

    // Get profit history (last 12 months)
    const profitHistory = investor.getProfitHistory(12);

    // Calculate total profit earned
    const totalProfitEarned = investor.profitHistory.reduce((sum, p) => sum + p.profit, 0);

    // Calculate profit percentage
    const profitPercentage = investor.investmentAmount > 0 
      ? ((totalProfitEarned / investor.investmentAmount) * 100).toFixed(2)
      : 0;

    // Calculate profit growth (current vs previous month)
    const profitGrowth = investor.previousMonthProfit > 0 
      ? (((investor.currentMonthProfit - investor.previousMonthProfit) / investor.previousMonthProfit) * 100).toFixed(2)
      : investor.currentMonthProfit > 0 ? 100 : 0;

    const dashboardData = {
      investor: {
        id: investor._id,
        name: investor.name,
        email: investor.email,
        phone: investor.phone,
        investmentAmount: investor.investmentAmount,
        currentMonthProfit: investor.currentMonthProfit,
        previousMonthProfit: investor.previousMonthProfit,
        totalProfitEarned,
        profitPercentage,
        profitGrowth,
        profitHistory,
        joinedDate: investor.createdAt,
        lastLogin: investor.lastLogin,
        previousLogin: investor.previousLogin
      }
    };

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investor dashboard',
      error: error.message
    });
  }
};

// Update monthly profit for investor
export const updateMonthlyProfit = async (req, res) => {
  try {
    const { investorId, profit, month } = req.body;
    const userId = req.user?.userId;
    const userType = req.user?.type;

    // Only admin can update investor profits
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update investor profits'
      });
    }

    if (!investorId || profit === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Investor ID and profit amount are required'
      });
    }

    const investor = await User.findById(investorId);
    
    if (!investor || investor.type !== 'investor') {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    // Add or update monthly profit
    await investor.addMonthlyProfit(profit, month);

    // Get updated investor data
    const updatedInvestor = await User.findById(investorId).select('-password');

    res.status(200).json({
      success: true,
      message: 'Monthly profit updated successfully',
      data: {
        investor: updatedInvestor.toJSON(),
        profitHistory: updatedInvestor.getProfitHistory(12)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update monthly profit',
      error: error.message
    });
  }
};

// Get investor profit history
export const getInvestorProfitHistory = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { limit = 12 } = req.query;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const investor = await User.findById(userId).select('-password');
    
    if (!investor || investor.type !== 'investor') {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    const profitHistory = investor.getProfitHistory(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        profitHistory,
        totalMonths: investor.profitHistory.length,
        totalProfit: investor.profitHistory.reduce((sum, p) => sum + p.profit, 0)
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profit history',
      error: error.message
    });
  }
};

// Update investor profit history (for bulk import of old records)
export const updateInvestorProfitHistory = async (req, res) => {
  try {
    const { investorId, profitHistory } = req.body;

    // Validation
    if (!investorId || !profitHistory || !Array.isArray(profitHistory)) {
      return res.status(400).json({
        success: false,
        message: 'Investor ID and profit history array are required'
      });
    }

    // Validate profit history records
    for (const record of profitHistory) {
      if (!record.month || record.profit === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each profit record must have month and profit fields'
        });
      }

      if (!/^\d{4}-\d{2}$/.test(record.month)) {
        return res.status(400).json({
          success: false,
          message: 'Month must be in YYYY-MM format'
        });
      }

      if (isNaN(Number(record.profit)) || Number(record.profit) < 0) {
        return res.status(400).json({
          success: false,
          message: 'Profit amount must be a non-negative number'
        });
      }
    }

    const investor = await User.findById(investorId);

    if (!investor || investor.type !== 'investor') {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    // Replace profit history with new data
    investor.profitHistory = profitHistory.map(record => ({
      month: record.month,
      profit: Number(record.profit),
      createdAt: new Date()
    }));

    // Update current and previous month profits based on new history
    investor.updateCurrentAndPreviousMonthProfits();

    // Set monthly profit to current month profit
    investor.monthlyProfit = investor.currentMonthProfit;

    await investor.save();

    res.status(200).json({
      success: true,
      message: 'Profit history updated successfully',
      data: {
        investorId: investor._id,
        investorName: investor.name,
        profitHistoryCount: investor.profitHistory.length,
        totalProfit: investor.profitHistory.reduce((sum, p) => sum + p.profit, 0),
        currentMonthProfit: investor.currentMonthProfit,
        previousMonthProfit: investor.previousMonthProfit
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profit history',
      error: error.message
    });
  }
};

// Get investor by ID
export const getInvestorById = async (req, res) => {
  try {
    const { id } = req.params;

    const investor = await User.findById(id).select('-password');

    if (!investor) {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: investor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investor',
      error: error.message
    });
  }
};

// Distribute profits among investors
export const distributeProfits = async (req, res) => {
  try {
    const { totalProfit, totalExpenses, netProfit, distribution } = req.body;
    const userType = req.user?.type;

    // Only admin can distribute profits
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can distribute profits.'
      });
    }

    // Validation
    if (!totalProfit || !totalExpenses || !netProfit || !distribution || !Array.isArray(distribution)) {
      return res.status(400).json({
        success: false,
        message: 'All distribution data is required'
      });
    }

    if (netProfit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Net profit must be greater than zero'
      });
    }

    // Update each investor's profit history
    const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
    const updatePromises = distribution.map(async (investorData) => {
      const investor = await User.findById(investorData._id);
      if (investor) {
        // Round profit amount to 2 decimal places
        const roundedProfit = Math.round((investorData.profitAmount || 0) * 100) / 100;
        
        // Check if profit already exists for this month
        const existingProfitIndex = investor.profitHistory.findIndex(
          profit => profit.month === currentMonth
        );

        if (existingProfitIndex >= 0) {
          // Update existing profit
          investor.profitHistory[existingProfitIndex].profit = roundedProfit;
          investor.profitHistory[existingProfitIndex].updatedAt = new Date();
        } else {
          // Add new profit entry
          investor.profitHistory.push({
            month: currentMonth,
            profit: roundedProfit,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        // Update monthly profit field
        investor.monthlyProfit = roundedProfit;
        
        await investor.save();
        return {
          investorId: investor._id,
          investorName: investor.name,
          profitAmount: roundedProfit,
          status: 'success'
        };
      } else {
        return {
          investorId: investorData._id,
          investorName: investorData.name,
          profitAmount: Math.round((investorData.profitAmount || 0) * 100) / 100,
          status: 'failed',
          error: 'Investor not found'
        };
      }
    });

    const results = await Promise.all(updatePromises);
    const successCount = results.filter(r => r.status === 'success').length;
    const failedCount = results.filter(r => r.status === 'failed').length;

    res.status(200).json({
      success: true,
      message: `Profits distributed successfully. ${successCount} investors updated, ${failedCount} failed.`,
      data: {
        totalProfit,
        totalExpenses,
        netProfit,
        distributionResults: results,
        month: currentMonth
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to distribute profits',
      error: error.message
    });
  }
};

// Save current month profit with custom balance entries
export const saveCurrentMonthProfit = async (req, res) => {
  try {
    const { investorId, expenseAmount, balanceEntries } = req.body;
    const userType = req.user?.type;

    // Only admin can save profit data
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can save profit data.'
      });
    }

    // Validation
    if (!investorId) {
      return res.status(400).json({
        success: false,
        message: 'Investor ID is required'
      });
    }

    const investor = await User.findById(investorId);
    if (!investor || investor.type !== 'investor') {
      return res.status(404).json({
        success: false,
        message: 'Investor not found'
      });
    }

    // Get current month
    const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM

    // Find existing profit entry for current month
    const existingProfitIndex = investor.profitHistory.findIndex(
      profit => profit.month === currentMonth
    );

    // Prepare balance entries data
    const processedBalanceEntries = (balanceEntries || []).map(entry => ({
      heading: entry.heading,
      value: parseFloat(entry.value) || 0,
      type: entry.type
    }));

    if (existingProfitIndex >= 0) {
      // Update existing profit entry
      investor.profitHistory[existingProfitIndex].expenseAmount = parseFloat(expenseAmount) || 0;
      investor.profitHistory[existingProfitIndex].balanceEntries = processedBalanceEntries;
      investor.profitHistory[existingProfitIndex].updatedAt = new Date();
    } else {
      // Create new profit entry with current month profit
      const currentMonthProfit = investor.monthlyProfit || 0;
      investor.profitHistory.push({
        month: currentMonth,
        profit: currentMonthProfit,
        expenseAmount: parseFloat(expenseAmount) || 0,
        balanceEntries: processedBalanceEntries,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await investor.save();

    res.status(200).json({
      success: true,
      message: 'Current month profit data saved successfully',
      data: {
        investorId: investor._id,
        investorName: investor.name,
        month: currentMonth,
        expenseAmount: parseFloat(expenseAmount) || 0,
        balanceEntries: processedBalanceEntries
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to save current month profit data',
      error: error.message
    });
  }
};
