import mongoose from 'mongoose';

const installmentSchema = new mongoose.Schema({
  customerId: {
    type: String,
    required: true
  },
  // Customer Information
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  customerAddress: {
    type: String,
    default: ''
  },
  // Product Information
  productName: {
    type: String,
    required: true
  },
  productDescription: {
    type: String,
    default: ''
  },
  // Financial Information
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  advanceAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  installmentCount: {
    type: Number,
    required: true
  },
  installmentUnit: {
    type: String,
    enum: ['days', 'weeks', 'months'],
    required: true
  },
  monthlyInstallment: {
    type: Number,
    required: true,
    min: 0
  },
  startDate: {
    type: Date,
    required: true
  },
  dueDay: {
    type: Number,
    required: true,
    min: 1,
    max: 31
  },
  // Array of individual installments
  installments: [{
    installmentNumber: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    actualPaidAmount: {
      type: Number,
      min: 0
    },
    dueDate: {
      type: Date,
      required: true
    },
    paidDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'bank_transfer', 'wallet', 'cheque', 'other'],
      default: 'cash'
    },
    notes: {
      type: String,
      trim: true
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Update status based on dates for each installment in the array
installmentSchema.pre('save', function(next) {
  const now = new Date();
  
  this.installments.forEach(installment => {
    if (installment.paidDate) {
      installment.status = 'paid';
    } else if (installment.dueDate < now) {
      installment.status = 'overdue';
    } else {
      installment.status = 'pending';
    }
  });
  
  next();
});

// Index for better query performance
installmentSchema.index({ customerId: 1 });
installmentSchema.index({ customerName: 1 });
installmentSchema.index({ customerEmail: 1 });
installmentSchema.index({ status: 1 });
installmentSchema.index({ dueDate: 1 });
installmentSchema.index({ createdBy: 1 });

const Installment = mongoose.model('Installment', installmentSchema);

export default Installment;
