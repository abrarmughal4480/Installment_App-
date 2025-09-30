'use client';

import React, { useState, useEffect } from 'react';

interface AddInstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  editData?: any; // Data for edit mode
  isEditMode?: boolean; // Flag to indicate edit mode
}

const AddInstallmentModal: React.FC<AddInstallmentModalProps> = ({ isOpen, onClose, onSubmit, editData, isEditMode = false }) => {
  const [formData, setFormData] = useState({
    customerId: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    productName: '',
    productDescription: '',
    totalAmount: '',
    advanceAmount: '',
    installmentCount: '',
    installmentUnit: 'months',
    monthlyInstallment: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isVisible, setIsVisible] = useState(false);

  const colors = {
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    success: '#10B981',
    successLight: '#34D399',
    warning: '#F59E0B',
    warningLight: '#FBBF24',
    danger: '#EF4444',
    dangerLight: '#F87171',
    text: '#1E293B',
    lightText: '#64748B',
    inputBackground: '#F8FAFC',
    border: '#E2E8F0',
    focusBorder: '#6366F1',
    shadow: 'rgba(0, 0, 0, 0.1)',
    gradientStart: '#6366F1',
    gradientEnd: '#4F46E5',
    glass: 'rgba(255, 255, 255, 0.95)',
    stepActive: '#6366F1',
    stepInactive: '#CBD5E1'
  };

  const steps = [
    { id: 1, title: 'Customer Info', icon: '👤' },
    { id: 2, title: 'Product Details', icon: '📦' },
    { id: 3, title: 'Installment Plan', icon: '💰' }
  ];

  // Animation effects
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Effect to populate form data when in edit mode
  useEffect(() => {
    if (isEditMode && editData && isOpen) {
      // Calculate remaining amount (total - advance - paid installments)
      const paidFromInstallments = editData.installments?.reduce((sum: number, inst: any) => {
        return sum + (inst.actualPaidAmount || 0);
      }, 0) || 0;
      const remainingAmount = editData.totalAmount - editData.advanceAmount - paidFromInstallments;
      
      // Count remaining unpaid installments
      const remainingInstallmentCount = editData.installments?.filter((inst: any) => inst.status !== 'paid').length || 0;
      
      // Calculate new monthly installment for remaining installments
      const newMonthlyInstallment = remainingInstallmentCount > 0 ? Math.ceil(remainingAmount / remainingInstallmentCount) : 0;

      setFormData({
        customerId: editData.customerId || '',
        name: editData.customerName || '',
        email: editData.customerEmail || '',
        phone: editData.customerPhone || '',
        address: editData.customerAddress || '',
        productName: editData.productName || '',
        productDescription: editData.productDescription || '',
        totalAmount: formatNumberWithCommas(remainingAmount),
        advanceAmount: '0',
        installmentCount: remainingInstallmentCount.toString(),
        installmentUnit: editData.installmentUnit || 'months',
        monthlyInstallment: formatNumberWithCommas(newMonthlyInstallment),
        startDate: new Date().toISOString().split('T')[0],
        dueDate: editData.dueDay?.toString() || '1',
      });
    }
  }, [isEditMode, editData, isOpen]);

  const formatNumberWithCommas = (num: number | string): string => {
    const number = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(number)) return '';
    return Math.round(number).toLocaleString('en-IN');
  };

  const removeCommas = (str: string): string => {
    return str.replace(/,/g, '');
  };

  const calculateMonthlyInstallment = () => {
    const total = Number(removeCommas(formData.totalAmount));
    const advance = Number(removeCommas(formData.advanceAmount)) || 0;
    const count = Number(formData.installmentCount);
    
    if (total > 0 && count > 0) {
      const remainingAmount = total - advance;
      const monthly = Math.ceil(remainingAmount / count); 
      setFormData(prev => ({
        ...prev,
        monthlyInstallment: formatNumberWithCommas(monthly)
      }));
    }
  };

  React.useEffect(() => {
    calculateMonthlyInstallment();
  }, [formData.totalAmount, formData.installmentCount, formData.advanceAmount]);

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.customerId.trim()) newErrors.customerId = 'Customer ID is required';
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) newErrors.phone = 'Invalid phone format';
    } else if (step === 2) {
      if (!formData.productName.trim()) newErrors.productName = 'Product name is required';
    } else if (step === 3) {
      if (!formData.totalAmount.trim()) newErrors.totalAmount = 'Total amount is required';
      else {
        const totalAmount = Number(removeCommas(formData.totalAmount));
        if (isNaN(totalAmount) || totalAmount <= 0) {
          newErrors.totalAmount = 'Enter a valid amount';
        }
      }

      if (formData.advanceAmount.trim()) {
        const advanceAmount = Number(removeCommas(formData.advanceAmount));
        if (isNaN(advanceAmount) || advanceAmount < 0) {
          newErrors.advanceAmount = 'Enter a valid advance amount';
        }
      }

      if (!formData.installmentCount.trim()) newErrors.installmentCount = 'Installment count is required';
      else if (isNaN(Number(formData.installmentCount)) || Number(formData.installmentCount) <= 0) {
        newErrors.installmentCount = 'Enter a valid count';
      }

      if (!formData.monthlyInstallment.trim()) newErrors.monthlyInstallment = 'Monthly installment is required';
      else {
        const monthlyAmount = Number(removeCommas(formData.monthlyInstallment));
        if (isNaN(monthlyAmount) || monthlyAmount <= 0) {
          newErrors.monthlyInstallment = 'Enter a valid amount';
        }
      }

      if (!formData.startDate.trim()) newErrors.startDate = 'Start date is required';

      if (!formData.dueDate.trim()) newErrors.dueDate = 'Due day is required';
      else {
        const dueDay = Number(formData.dueDate);
        if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
          newErrors.dueDate = 'Enter a valid day (1-31)';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    return validateStep(1) && validateStep(2) && validateStep(3);
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const customerData = {
        customerId: formData.customerId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || '',
        productName: formData.productName,
        productDescription: formData.productDescription || '',
        totalAmount: Number(removeCommas(formData.totalAmount)),
        advanceAmount: Number(removeCommas(formData.advanceAmount)) || 0,
        installmentCount: Number(formData.installmentCount),
        installmentUnit: formData.installmentUnit,
        monthlyInstallment: Number(removeCommas(formData.monthlyInstallment)),
        startDate: formData.startDate,
        dueDate: formData.dueDate,
        ...(isEditMode && { installmentId: editData.id })
      };

      onSubmit(customerData);
      handleClose();
    } catch (error) {
      console.error('Error creating installment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      customerId: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      productName: '',
      productDescription: '',
      totalAmount: '',
      advanceAmount: '',
      installmentCount: '',
      installmentUnit: 'months',
      monthlyInstallment: '',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
    });
    setErrors({});
    setCurrentStep(1);
    setIsVisible(false);
    setTimeout(() => onClose(), 200);
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
        }`}
        style={{ backgroundColor: colors.cardBackground }}
      >
        {/* Enhanced Header */}
        <div 
          className="relative overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, ${colors.gradientStart} 0%, ${colors.gradientEnd} 100%)`
          }}
        >
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{isEditMode ? 'Edit Installment Plan' : 'Create Installment Plan'}</h2>
                <p className="text-white/90 text-sm">{isEditMode ? 'Update the installment plan for your customer' : 'Set up a new installment plan for your customer'}</p>
              </div>
              <button 
                onClick={handleClose}
                className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-full"
                disabled={isSubmitting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-3 sm:p-6 overflow-y-auto max-h-[calc(95vh-120px)] modal-scrollbar">
          {/* Customer Information Form */}
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Customer ID *</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.customerId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.customerId}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                  placeholder="Enter customer ID"
                  style={{ color: colors.text }}
                />
                {errors.customerId && (
                  <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter customer name"
                  style={{ color: colors.text }}
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  style={{ color: colors.text }}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                <input
                  type="tel"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                  style={{ color: colors.text }}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter address (optional)"
                  style={{ color: colors.text }}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.productName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.productName}
                  onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                  placeholder="Enter product name"
                  style={{ color: colors.text }}
                />
                {errors.productName && (
                  <p className="text-red-500 text-xs mt-1">{errors.productName}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.productDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, productDescription: e.target.value }))}
                  placeholder="Enter product description (optional)"
                  style={{ color: colors.text }}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Installment Information */}
          <div className="mb-6 bg-white rounded-lg shadow-sm border p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Installment Information</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount *</label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.totalAmount}
                  onChange={(e) => {
                    const numericValue = removeCommas(e.target.value);
                    if (numericValue === '' || !isNaN(Number(numericValue))) {
                      setFormData(prev => ({ 
                        ...prev, 
                        totalAmount: numericValue === '' ? '' : formatNumberWithCommas(numericValue)
                      }));
                    }
                  }}
                  placeholder="Enter total amount (e.g., 8,00,000)"
                  style={{ color: colors.text }}
                />
                {errors.totalAmount && (
                  <p className="text-red-500 text-xs mt-1">{errors.totalAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Advance Amount</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.advanceAmount}
                  onChange={(e) => {
                    const numericValue = removeCommas(e.target.value);
                    if (numericValue === '' || !isNaN(Number(numericValue))) {
                      setFormData(prev => ({ 
                        ...prev, 
                        advanceAmount: numericValue === '' ? '' : formatNumberWithCommas(numericValue)
                      }));
                    }
                  }}
                  placeholder="Enter advance amount (optional) (e.g., 1,00,000)"
                  style={{ color: colors.text }}
                />
                {errors.advanceAmount && (
                  <p className="text-red-500 text-xs mt-1">{errors.advanceAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Installment Count *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.installmentCount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.installmentCount}
                    onChange={(e) => setFormData(prev => ({ ...prev, installmentCount: e.target.value }))}
                    placeholder="Enter number"
                    style={{ color: colors.text }}
                  />
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.installmentUnit}
                    onChange={(e) => setFormData(prev => ({ ...prev, installmentUnit: e.target.value }))}
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
                {errors.installmentCount && (
                  <p className="text-red-500 text-xs mt-1">{errors.installmentCount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.installmentUnit === 'days' ? 'Daily' : 
                   formData.installmentUnit === 'weeks' ? 'Weekly' : 'Monthly'} Installment *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.monthlyInstallment ? 'border-red-500' : 'border-gray-300'
                    }`}
                    value={formData.monthlyInstallment}
                    onChange={(e) => {
                      const numericValue = removeCommas(e.target.value);
                      if (numericValue === '' || !isNaN(Number(numericValue))) {
                        setFormData(prev => ({ 
                          ...prev, 
                          monthlyInstallment: numericValue === '' ? '' : formatNumberWithCommas(numericValue)
                        }));
                      }
                    }}
                    placeholder="Auto calculated (e.g., 25,000)"
                    style={{ color: colors.text }}
                  />
                  <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg flex items-center">
                    <span className="text-sm font-medium text-blue-600">
                      {formData.installmentUnit === 'days' ? 'Rs/day' : 
                       formData.installmentUnit === 'weeks' ? 'Rs/week' : 'Rs/month'}
                    </span>
                  </div>
                </div>
                {errors.monthlyInstallment && (
                  <p className="text-red-500 text-xs mt-1">{errors.monthlyInstallment}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                <input
                  type="date"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
                {errors.startDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Day *</label>
                <input
                  type="number"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.dueDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={formData.dueDate}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    if (numericValue === '' || (Number(numericValue) >= 1 && Number(numericValue) <= 31)) {
                      setFormData(prev => ({ ...prev, dueDate: numericValue }));
                    }
                  }}
                  placeholder="Enter day of month (1-31)"
                  style={{ color: colors.text }}
                  min="1"
                  max="31"
                />
                {errors.dueDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Day of each month when installments should be collected (e.g., 10 for 10th of every month)
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-lg text-white font-medium transition-colors duration-200 flex items-center gap-2 ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
                  {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  {isEditMode ? 'Update Installment' : 'Create Installment'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddInstallmentModal;

