import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';
import { useToast } from '@/contexts/ToastContext';

interface UpdateProfitModalProps {
  isOpen: boolean;
  onClose: () => void;
  investor: any;
  onSuccess?: () => void;
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

const UpdateProfitModal: React.FC<UpdateProfitModalProps> = ({
  isOpen,
  onClose,
  investor,
  onSuccess,
  colors
}) => {
  const [formData, setFormData] = useState({
    profit: '',
    month: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Set current month as default
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM format
      setFormData({
        profit: '',
        month: currentMonth
      });
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!formData.profit.trim()) {
      newErrors.profit = 'Profit amount is required';
    } else if (isNaN(Number(formData.profit)) || Number(formData.profit) < 0) {
      newErrors.profit = 'Profit amount must be a non-negative number';
    }

    if (!formData.month.trim()) {
      newErrors.month = 'Month is required';
    } else if (!/^\d{4}-\d{2}$/.test(formData.month)) {
      newErrors.month = 'Month must be in YYYY-MM format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        setLoading(true);
        
        const response = await apiService.updateInvestorProfit(
          investor._id,
          Number(formData.profit),
          formData.month
        );
        
        if (response.success) {
          showSuccess('Profit Updated!', `Monthly profit updated for ${investor.name}`);
          onClose();
          // Call the success callback to refresh the investors list
          if (onSuccess) {
            onSuccess();
          }
        } else {
          showError('Update Failed', response.message || 'Failed to update profit');
        }
      } catch (err: any) {
        console.error('Error updating profit:', err);
        showError('Update Failed', err.message || 'Failed to update profit');
      } finally {
        setLoading(false);
      }
    }
  };

  const formatMonth = (monthString: string) => {
    if (!monthString) return '';
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col transform transition-all duration-300 scale-100 translate-y-0 overflow-hidden">
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-green-50 flex-shrink-0">
          <div className="relative p-4">
            <div className="flex justify-between items-center">
              <div className="flex-1 text-center">
                <h2 className="text-xl font-bold text-gray-800">Update Monthly Profit</h2>
                <p className="text-sm text-gray-600 mt-1">{investor?.name}</p>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Month Selection */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Month *
              </label>
              <input
                type="month"
                name="month"
                value={formData.month}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black ${
                  errors.month ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.month && (
                <p className="text-red-500 text-xs mt-1">{errors.month}</p>
              )}
              {formData.month && (
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {formatMonth(formData.month)}
                </p>
              )}
            </div>

            {/* Profit Amount */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Profit Amount (Rs.) *
              </label>
              <input
                type="number"
                name="profit"
                value={formData.profit}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black ${
                  errors.profit ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter profit amount"
                min="0"
                step="100"
              />
              {errors.profit && (
                <p className="text-red-500 text-xs mt-1">{errors.profit}</p>
              )}
            </div>

            {/* Investor Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Investor Information</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Investment Amount:</span>
                  <span className="font-medium">Rs. {investor?.investmentAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Month Profit:</span>
                  <span className="font-medium text-green-600">Rs. {investor?.currentMonthProfit?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Profit Earned:</span>
                  <span className="font-medium text-purple-600">
                    Rs. {investor?.profitHistory?.reduce((sum: number, p: any) => sum + p.profit, 0)?.toLocaleString() || '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
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
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-full font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: colors.success }}
              >
                {loading ? 'Updating...' : 'Update Profit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfitModal;
