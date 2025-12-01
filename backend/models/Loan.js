import mongoose from 'mongoose';

const loanSchema = new mongoose.Schema({
  loanId: {
    type: String,
    unique: true,
    sparse: true // This allows multiple null values
  },
  investorName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  loanAmount: {
    type: Number,
    required: true,
    min: 0
  },
  interestRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100 // Maximum 100% interest rate
  },
  duration: {
    type: Number,
    required: true,
    min: 1 // Minimum 1 month
  },
  monthlyPayment: {
    type: Number,
    required: false, // Will be calculated in pre-save middleware
    min: 0
  },
  totalAmount: {
    type: Number,
    required: false, // Will be calculated in pre-save middleware
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'defaulted', 'cancelled'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: false // Will be calculated in pre-save middleware
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingAmount: {
    type: Number,
    required: false, // Will be calculated in pre-save middleware
    min: 0
  },
  paymentHistory: [{
    paymentDate: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'cheque', 'online'],
      default: 'cash'
    },
    notes: {
      type: String,
      maxlength: 500
    }
  }],
  additionalAmountHistory: [{
    addedDate: {
      type: Date,
      default: Date.now
    },
    additionalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      maxlength: 500
    }
  }],
  notes: {
    type: String,
    maxlength: 1000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Will be set in controller
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save middleware to update updatedAt and calculate totals
loanSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Generate unique loanId if not provided
  if (!this.loanId) {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
    const random = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3 random chars
    this.loanId = `LN${timestamp}${random}`;
  }
  
  // Calculate total amount (loan amount + interest)
  const interestAmount = (this.loanAmount * this.interestRate * this.duration) / 100;
  this.totalAmount = this.loanAmount + interestAmount;
  
  // Calculate monthly payment
  this.monthlyPayment = this.totalAmount / this.duration;
  
  // Calculate remaining amount
  this.remainingAmount = this.totalAmount - (this.paidAmount || 0);
  
  // Set end date based on duration
  if (this.startDate && this.duration) {
    const endDate = new Date(this.startDate);
    endDate.setMonth(endDate.getMonth() + this.duration);
    this.endDate = endDate;
  } else if (this.duration) {
    // If no startDate, use current date
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + this.duration);
    this.endDate = endDate;
  }
  
  next();
});

// Index for better query performance
loanSchema.index({ investorName: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ createdAt: -1 });
loanSchema.index({ loanId: 1 }, { sparse: true });

// Virtual for loan progress percentage
loanSchema.virtual('progressPercentage').get(function() {
  if (this.totalAmount === 0) return 0;
  return Math.round((this.paidAmount / this.totalAmount) * 100);
});

// Virtual for days remaining
loanSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const endDate = new Date(this.endDate);
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
});

// Method to add payment
loanSchema.methods.addPayment = function(amount, paymentMethod = 'cash', notes = '') {
  this.paymentHistory.push({
    paymentDate: new Date(),
    amount,
    paymentMethod,
    notes
  });
  
  this.paidAmount += amount;
  this.remainingAmount = this.totalAmount - this.paidAmount;
  
  // Update status if fully paid
  if (this.remainingAmount <= 0) {
    this.status = 'completed';
  }
  
  return this.save();
};

// Method to get loan summary
loanSchema.methods.getSummary = function() {
  return {
    loanAmount: this.loanAmount,
    totalAmount: this.totalAmount,
    paidAmount: this.paidAmount,
    remainingAmount: this.remainingAmount,
    monthlyPayment: this.monthlyPayment,
    progressPercentage: this.progressPercentage,
    status: this.status,
    daysRemaining: this.daysRemaining
  };
};

// Static method to find active loans
loanSchema.statics.findActiveLoans = function() {
  return this.find({ status: 'active' }).populate('investorId', 'name email phone');
};

// Static method to find loans by investor
loanSchema.statics.findByInvestor = function(investorId) {
  return this.find({ investorId }).populate('investorId', 'name email phone');
};

// Static method to get loan statistics
loanSchema.statics.getLoanStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$loanAmount' },
        totalPaid: { $sum: '$paidAmount' },
        totalRemaining: { $sum: '$remainingAmount' }
      }
    }
  ]);
};

const Loan = mongoose.model('Loan', loanSchema);

export default Loan;
