import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    maxlength: 20
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  type: {
    type: String,
    enum: ['customer', 'admin', 'manager', 'investor'],
    default: 'customer'
  },
  tempPassword: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Investor-specific fields
  investmentAmount: {
    type: Number,
    required: function() {
      return this.type === 'investor';
    },
    min: 0
  },
  joinDate: {
    type: Date,
    default: Date.now
  },
  monthlyProfit: {
    type: Number,
    required: function() {
      return this.type === 'investor';
    },
    min: 0,
    default: 0
  },
  // Profit history tracking
  profitHistory: [{
    month: {
      type: String, // Format: "YYYY-MM" (e.g., "2024-01")
      required: true
    },
    profit: {
      type: Number,
      required: true,
      min: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Current month profit (for quick access)
  currentMonthProfit: {
    type: Number,
    min: 0,
    default: 0
  },
  // Previous month profit (for quick access)
  previousMonthProfit: {
    type: Number,
    min: 0,
    default: 0
  },
  lastLogin: {
    type: Date
  },
  previousLogin: {
    type: Date
  },
  // Admin permissions (only for admin type users)
  permissions: {
    canViewData: {
      type: Boolean,
      default: false
    },
    canAddData: {
      type: Boolean,
      default: false
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    grantedAt: {
      type: Date
    }
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


// Pre-save middleware to update updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for better query performance
userSchema.index({ type: 1 });
userSchema.index({ isActive: 1 });

// Virtual for user's full name (if needed)
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Method to get user without sensitive data
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to get active users
userSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true });
};

// Static method to get users by type
userSchema.statics.findByType = function(type) {
  return this.find({ type, isActive: true });
};

// Static method to find investors
userSchema.statics.findInvestors = function() {
  return this.find({ type: 'investor', isActive: true });
};

// Static method to find active investors
userSchema.statics.findActiveInvestors = function() {
  return this.find({ type: 'investor', isActive: true });
};

// Method to add monthly profit for investors
userSchema.methods.addMonthlyProfit = function(profit, month) {
  if (this.type !== 'investor') {
    throw new Error('Only investors can have monthly profits');
  }
  
  const monthStr = month || new Date().toISOString().slice(0, 7); // YYYY-MM format
  
  // Check if profit for this month already exists
  const existingProfit = this.profitHistory.find(p => p.month === monthStr);
  if (existingProfit) {
    existingProfit.profit = profit;
  } else {
    this.profitHistory.push({ month: monthStr, profit });
  }
  
  // Update current and previous month profits
  this.updateCurrentAndPreviousMonthProfits();
  
  // Also update the monthlyProfit field for backward compatibility
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  if (monthStr === currentMonth) {
    this.monthlyProfit = profit;
  }
  
  return this.save();
};

// Method to update current and previous month profits
userSchema.methods.updateCurrentAndPreviousMonthProfits = function() {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
  
  const currentProfit = this.profitHistory.find(p => p.month === currentMonth);
  const previousProfit = this.profitHistory.find(p => p.month === previousMonth);
  
  this.currentMonthProfit = currentProfit ? currentProfit.profit : 0;
  this.previousMonthProfit = previousProfit ? previousProfit.profit : 0;
  
  // Also update monthlyProfit field for backward compatibility
  this.monthlyProfit = this.currentMonthProfit;
};

// Method to get profit history for investors
userSchema.methods.getProfitHistory = function(limit = 12) {
  if (this.type !== 'investor') {
    return [];
  }
  
  return this.profitHistory
    .sort((a, b) => b.month.localeCompare(a.month))
    .slice(0, limit);
};

// Method to check if user is main admin
userSchema.methods.isMainAdmin = function() {
  return this.type === 'admin' && this.email === 'installmentadmin@app.com';
};

// Method to check if user has view permissions
userSchema.methods.canViewData = function() {
  // Main admin always has permissions
  if (this.isMainAdmin()) {
    return true;
  }
  
  // For admin users, check if they have been granted view permissions
  if (this.type === 'admin') {
    return this.permissions?.canViewData === true;
  }
  
  // Investors and managers don't need special permissions for their own data
  return true;
};

// Method to check if user has add permissions
userSchema.methods.canAddData = function() {
  // Main admin always has permissions
  if (this.isMainAdmin()) {
    return true;
  }
  
  // For admin users, check if they have been granted add permissions
  if (this.type === 'admin') {
    return this.permissions?.canAddData === true;
  }
  
  // Investors and managers don't need special permissions for basic operations
  return true;
};

// Method to grant permissions to admin
userSchema.methods.grantPermissions = function(grantedBy, canViewData = true, canAddData = true) {
  if (this.type !== 'admin') {
    throw new Error('Only admin users can have permissions granted');
  }
  
  this.permissions = {
    canViewData,
    canAddData,
    grantedBy,
    grantedAt: new Date()
  };
  
  return this.save();
};

// Method to revoke permissions
userSchema.methods.revokePermissions = function() {
  this.permissions = {
    canViewData: false,
    canAddData: false,
    grantedBy: null,
    grantedAt: null
  };
  
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
