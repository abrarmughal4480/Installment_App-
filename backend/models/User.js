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
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  type: {
    type: String,
    enum: ['customer', 'admin', 'manager'],
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
  lastLogin: {
    type: Date
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

const User = mongoose.model('User', userSchema);

export default User;
