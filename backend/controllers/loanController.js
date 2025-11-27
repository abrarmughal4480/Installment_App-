import Loan from '../models/Loan.js';
import User from '../models/User.js';

// Get all loans (admin only)
export const getLoans = async (req, res) => {
  try {
    const userType = req.user?.type;
    
    // Only admin can view all loans
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can view all loans.'
      });
    }
    
    const loans = await Loan.find()
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: loans,
      count: loans.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loans',
      error: error.message
    });
  }
};

// Get loans by debtor name
export const getLoansByInvestor = async (req, res) => {
  try {
    const { investorId } = req.params; // This is actually debtor name
    const userType = req.user?.type;
    const userId = req.user?.id;
    
    // Check if user is admin or the debtor themselves
    if (userType !== 'admin' && userId !== investorId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own loans.'
      });
    }
    
    const loans = await Loan.find({ investorName: investorId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: loans,
      count: loans.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch investor loans',
      error: error.message
    });
  }
};

// Add new loan
export const addLoan = async (req, res) => {
  try {
    const { investorName, loanAmount, interestRate, duration, notes, startDate } = req.body;
    const createdBy = req.user?.id;
    const userType = req.user?.type;
    
    // Only admin can add loans
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can add loans.'
      });
    }
    
    // Validation
    if (!investorName || isNaN(loanAmount) || isNaN(interestRate) || isNaN(duration)) {
      return res.status(400).json({
        success: false,
        message: 'Debtor name, loan amount, interest rate, and duration are required'
      });
    }
    
    // Create new loan with debtor name (no need to check if debtor exists)
    const newLoan = new Loan({
      investorName: investorName.trim(),
      loanAmount: parseFloat(loanAmount),
      interestRate: parseFloat(interestRate),
      duration: parseInt(duration),
      notes: notes || '',
      createdBy,
      startDate: startDate ? new Date(startDate) : new Date(),
      paidAmount: 0
    });
    
    await newLoan.save();
    
    // Populate the loan data
    await newLoan.populate('createdBy', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Loan added successfully',
      data: newLoan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add loan',
      error: error.message
    });
  }
};

// Update loan
export const updateLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const { loanAmount, interestRate, duration, status, notes, startDate, paidAmount } = req.body;
    const userType = req.user?.type;
    
    // Only admin can update loans
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can update loans.'
      });
    }
    
    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    // Update loan fields
    if (loanAmount !== undefined) loan.loanAmount = parseFloat(loanAmount);
    if (interestRate !== undefined) loan.interestRate = parseFloat(interestRate);
    if (duration !== undefined) loan.duration = parseInt(duration);
    if (status !== undefined) loan.status = status;
    if (notes !== undefined) loan.notes = notes;
    if (startDate !== undefined) loan.startDate = new Date(startDate);
    if (paidAmount !== undefined) loan.paidAmount = parseFloat(paidAmount);
    
    await loan.save();
    
    // Populate the loan data
    await loan.populate('createdBy', 'name email');
    
    res.status(200).json({
      success: true,
      message: 'Loan updated successfully',
      data: loan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update loan',
      error: error.message
    });
  }
};

// Add payment to loan
export const addLoanPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, notes } = req.body;
    const userType = req.user?.type;
    
    // Only admin can add payments
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can add payments.'
      });
    }
    
    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    if (loan.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add payment to completed loan'
      });
    }
    
    // Add payment
    await loan.addPayment(
      parseFloat(amount),
      paymentMethod || 'cash',
      notes || ''
    );
    
    // Populate the loan data
    await loan.populate('createdBy', 'name email');
    
    res.status(200).json({
      success: true,
      message: 'Payment added successfully',
      data: loan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add payment',
      error: error.message
    });
  }
};

// Delete loan
export const deleteLoan = async (req, res) => {
  try {
    const { id } = req.params;
    const userType = req.user?.type;
    
    // Only admin can delete loans
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can delete loans.'
      });
    }
    
    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    await Loan.findByIdAndDelete(id);
    
    res.status(200).json({
      success: true,
      message: 'Loan deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete loan',
      error: error.message
    });
  }
};

// Get loan by ID
export const getLoanById = async (req, res) => {
  try {
    const { id } = req.params;
    const userType = req.user?.type;
    const userId = req.user?.id;
    
    const loan = await Loan.findById(id)
      .populate('createdBy', 'name email');
    
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }
    
    // Check if user is admin (for now, we'll allow all authenticated users to view loans)
    // TODO: Implement proper investor name to user ID mapping if needed
    
    res.status(200).json({
      success: true,
      data: loan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan',
      error: error.message
    });
  }
};

// Get loan statistics
export const getLoanStats = async (req, res) => {
  try {
    const userType = req.user?.type;
    
    // Only admin can view loan statistics
    if (userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only admin can view loan statistics.'
      });
    }
    
    const stats = await Loan.getLoanStats();
    
    // Calculate additional statistics
    const totalLoans = await Loan.countDocuments();
    const activeLoans = await Loan.countDocuments({ status: 'active' });
    const completedLoans = await Loan.countDocuments({ status: 'completed' });
    const defaultedLoans = await Loan.countDocuments({ status: 'defaulted' });
    
    const totalLoanAmount = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: '$loanAmount' } } }
    ]);
    
    const totalPaidAmount = await Loan.aggregate([
      { $group: { _id: null, total: { $sum: '$paidAmount' } } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalLoans,
        activeLoans,
        completedLoans,
        defaultedLoans,
        totalLoanAmount: totalLoanAmount[0]?.total || 0,
        totalPaidAmount: totalPaidAmount[0]?.total || 0,
        statusBreakdown: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan statistics',
      error: error.message
    });
  }
};

