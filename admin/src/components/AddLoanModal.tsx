import React, { useState, useEffect } from 'react';

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  investor?: any; // Optional investor data for pre-selecting
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

const AddLoanModal: React.FC<AddLoanModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  investor,
  colors
}) => {
  const [formData, setFormData] = useState({
    investorName: investor?.name || '',
    loanAmount: '',
    interestRate: '0',
    duration: '',
    notes: ''
  });

  const [calculatedValues, setCalculatedValues] = useState({
    monthlyPayment: 0,
    totalAmount: 0,
    interestAmount: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate loan details when form data changes
  useEffect(() => {
    const loanAmount = parseFloat(formData.loanAmount) || 0;
    const interestRate = parseFloat(formData.interestRate) || 0;
    const duration = parseInt(formData.duration) || 0;

    if (loanAmount > 0 && interestRate >= 0 && duration > 0) {
      const interestAmount = (loanAmount * interestRate * duration) / 100;
      const totalAmount = loanAmount + interestAmount;
      const monthlyPayment = totalAmount / duration;

      setCalculatedValues({
        monthlyPayment,
        totalAmount,
        interestAmount
      });
    } else {
      setCalculatedValues({
        monthlyPayment: 0,
        totalAmount: 0,
        interestAmount: 0
      });
    }
  }, [formData.loanAmount, formData.interestRate, formData.duration]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        investorName: investor?.name || '',
        loanAmount: '',
        interestRate: '',
        duration: '',
        notes: ''
      });
      setErrors({});
    }
  }, [isOpen, investor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
    const newErrors: Record<string, string> = {};

    if (!formData.investorName || formData.investorName.trim() === '') {
      newErrors.investorName = 'Please enter debtor name';
    }

    if (!formData.loanAmount || parseFloat(formData.loanAmount) <= 0) {
      newErrors.loanAmount = 'Loan amount must be greater than 0';
    }

    if (!formData.interestRate || parseFloat(formData.interestRate) < 0) {
      newErrors.interestRate = 'Interest rate must be 0 or greater';
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      newErrors.duration = 'Duration must be at least 1 month';
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
      const submitData = {
        ...formData,
        loanAmount: parseFloat(formData.loanAmount),
        interestRate: parseFloat(formData.interestRate),
        duration: parseInt(formData.duration)
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Error submitting loan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col transform transition-all duration-300 scale-100 translate-y-0 overflow-hidden">
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-blue-50 flex-shrink-0">
          <div className="relative p-4">
            <div className="flex justify-between items-center">
              <div className="flex-1 text-center">
                <h2 className="text-xl font-bold text-gray-800">Add New Loan</h2>
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
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {/* Investor Name */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Debtor Name *
              </label>
              <input
                type="text"
                name="investorName"
                value={formData.investorName}
                onChange={handleInputChange}
                placeholder="Enter debtor name"
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                  errors.investorName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.investorName && (
                <p className="text-red-500 text-xs mt-1">{errors.investorName}</p>
              )}
            </div>

            {/* Loan Amount and Interest Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Loan Amount (Rs.) *
                </label>
                <input
                  type="number"
                  name="loanAmount"
                  value={formData.loanAmount}
                  onChange={handleInputChange}
                  placeholder="Enter loan amount"
                  min="0"
                  step="0.01"
                  autoComplete="off"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                    errors.loanAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.loanAmount && (
                  <p className="text-red-500 text-xs mt-1">{errors.loanAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Interest Rate (%) *
                </label>
                <input
                  type="number"
                  name="interestRate"
                  value={formData.interestRate}
                  onChange={handleInputChange}
                  placeholder="Enter interest rate"
                  min="0"
                  max="100"
                  step="0.01"
                  autoComplete="off"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                    errors.interestRate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.interestRate && (
                  <p className="text-red-500 text-xs mt-1">{errors.interestRate}</p>
                )}
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Duration (Months) *
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                placeholder="Enter duration in months"
                min="1"
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                  errors.duration ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.duration && (
                <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
              )}
            </div>

            {/* Calculated Values */}
            {(calculatedValues.totalAmount > 0) && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  Loan Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Interest Amount</p>
                    <p className="text-lg font-semibold text-red-600">
                      Rs. {calculatedValues.interestAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-lg font-semibold text-gray-800">
                      Rs. {calculatedValues.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Monthly Payment</p>
                    <p className="text-lg font-semibold text-green-600">
                      Rs. {calculatedValues.monthlyPayment.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Notes (Optional)
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any additional notes..."
                rows={3}
                maxLength={1000}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black border-gray-300 resize-none"
              />
              <p className="text-xs mt-1 text-gray-500">
                {formData.notes.length}/1000 characters
              </p>
            </div>

            {/* Required Fields Note */}
            <div className="text-center pt-2">
              <p className="text-sm text-red-600 font-medium">All fields marked with * are required</p>
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
                className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-full font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: colors.primary }}
              >
                {isSubmitting ? 'Creating Loan...' : 'Add Loan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddLoanModal;
