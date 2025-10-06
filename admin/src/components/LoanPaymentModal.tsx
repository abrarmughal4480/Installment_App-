import React, { useState, useEffect } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentData: any) => void;
  loan: any;
  colors: {
    primary: string;
    success: string;
    danger: string;
    text: string;
    lightText: string;
    cardBackground: string;
    border: string;
  };
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loan,
  colors
}) => {
  const [formData, setFormData] = useState({
    amount: '',
    notes: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: '',
        notes: ''
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Payment amount must be greater than 0';
    } else if (parseFloat(formData.amount) > (loan.remainingAmount || 0)) {
      newErrors.amount = 'Payment amount cannot exceed remaining amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const paymentData = {
        amount: parseFloat(formData.amount),
        notes: formData.notes.trim()
      };
      
      await onSubmit(paymentData);
      
      // Reset form after successful submission
      setFormData({
        amount: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error submitting payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !loan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col transform transition-all duration-300 scale-100 translate-y-0 overflow-hidden">
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-green-50 flex-shrink-0">
          <div className="relative p-4">
            <div className="flex justify-between items-center">
              <div className="flex-1 text-center">
                <h2 className="text-xl font-bold text-gray-800">Add Payment</h2>
                <p className="text-sm text-gray-600 mt-1">{loan.investorName} - Loan ID: {loan.loanId || 'N/A'}</p>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 p-2 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Loan Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Loan Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Amount</p>
                <p className="font-medium text-gray-800">Rs. {loan.totalAmount ? (Math.round(loan.totalAmount) + 1).toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Paid Amount</p>
                <p className="font-medium text-gray-800">Rs. {loan.paidAmount ? (Math.round(loan.paidAmount) + 1).toLocaleString() : '0'}</p>
              </div>
              <div>
                <p className="text-gray-600">Remaining</p>
                <p className="font-medium text-red-600">Rs. {loan.remainingAmount ? (Math.round(loan.remainingAmount) + 1).toLocaleString() : 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Monthly Payment</p>
                <p className="font-medium text-gray-800">Rs. {loan.monthlyPayment ? (Math.round(loan.monthlyPayment) + 1).toLocaleString() : 'N/A'}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Payment Amount (Rs.) *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="Enter payment amount"
                min="0"
                max={loan.remainingAmount || undefined}
                step="0.01"
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Maximum: Rs. {loan.remainingAmount ? (Math.round(loan.remainingAmount) + 1).toLocaleString() : 'N/A'}
              </p>
            </div>

            {/* Payment Notes */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Payment Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any notes about this payment..."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black border-gray-300 resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.notes.length}/500 characters
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Quick Amounts
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, amount: (Math.round(loan.monthlyPayment || 0) + 1).toString() }))}
                  className="px-3 py-2 text-sm text-black bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Monthly Payment
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, amount: (Math.round(loan.remainingAmount || 0) + 1).toString() }))}
                  className="px-3 py-2 text-sm text-black bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                >
                  Full Payment
                </button>
              </div>
            </div>

            {/* Required Fields Note */}
            <div className="text-center pt-2">
              <p className="text-sm text-red-600 font-medium">Fields marked with * are required</p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-full font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: colors.success }}
              >
                {isSubmitting ? 'Processing...' : 'Add Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;