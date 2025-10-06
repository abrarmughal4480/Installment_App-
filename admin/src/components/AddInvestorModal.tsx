import React, { useState, useEffect } from 'react';

interface AddInvestorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  investor?: any; // Optional investor data for edit mode
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

const AddInvestorModal: React.FC<AddInvestorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  investor,
  colors
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    investmentAmount: '',
    password: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

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

  // Populate form when editing
  useEffect(() => {
    if (investor) {
      setFormData({
        name: investor.name || '',
        email: investor.email || '',
        phone: investor.phone || '',
        investmentAmount: investor.investmentAmount?.toString() || '',
        password: ''
      });
    } else {
      // Reset form for add mode
      setFormData({
        name: '',
        email: '',
        phone: '',
        investmentAmount: '',
        password: ''
      });
    }
  }, [investor, isOpen]);

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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    if (!formData.investmentAmount.trim()) {
      newErrors.investmentAmount = 'Investment amount is required';
    } else if (isNaN(Number(formData.investmentAmount)) || Number(formData.investmentAmount) <= 0) {
      newErrors.investmentAmount = 'Investment amount must be a positive number';
    }

    // Password is only required for add mode, not edit mode
    if (!investor && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.trim() && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const submitData = {
        ...formData,
        investmentAmount: Number(formData.investmentAmount)
      };
      
      // Only include password if it's provided (for add mode or password change)
      if (formData.password.trim()) {
        submitData.password = formData.password;
      }
      
      onSubmit(submitData);
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
                <h2 className="text-xl font-bold text-gray-800">{investor ? 'Edit Investor' : 'Add New Investor'}</h2>
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

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter investor's full name"
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter investor's email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter investor's phone number"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Investment Amount */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Investment Amount (Rs.) *
              </label>
              <input
                type="number"
                name="investmentAmount"
                value={formData.investmentAmount}
                onChange={handleChange}
                autoComplete="off"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                  errors.investmentAmount ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter investment amount"
                min="0"
                step="1000"
              />
              {errors.investmentAmount && (
                <p className="text-red-500 text-xs mt-1">{errors.investmentAmount}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Password {investor ? '(Leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter password for investor login"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Required Fields Note */}
            <div className="text-center pt-2">
              <p className="text-sm text-red-600 font-medium">All fields marked with * are required</p>
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
                className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-full font-medium transition-colors duration-200"
                style={{ backgroundColor: colors.primary }}
              >
                {investor ? 'Update Investor' : 'Add Investor'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddInvestorModal;
