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
    managerId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isVisible, setIsVisible] = useState(false);
  const [managers, setManagers] = useState<any[]>([]);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [managerSearch, setManagerSearch] = useState('');
  const [managerError, setManagerError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

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
      fetchManagers();
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fetch managers
  const fetchManagers = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/dashboard/managers`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const result = await response.json();
      if (result.success) {
        setManagers(result.managers || []);
      }
    } catch (err) {
      console.error('Error fetching managers:', err);
    }
  };

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
        managerId: editData.managerId || '',
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
    const step1Valid = validateStep(1);
    const step2Valid = validateStep(2);
    const step3Valid = validateStep(3);
    
    // Validate manager selection
    if (!formData.managerId) {
      setManagerError('Please select a manager');
      return false;
    } else {
      setManagerError('');
    }
    
    // Additional comprehensive validation
    const newErrors: Record<string, string> = {};
    
    // Customer ID validation
    if (!formData.customerId.trim()) {
      newErrors.customerId = 'Customer ID is required';
    }
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone format';
    } else if (formData.phone.replace(/[^0-9]/g, '').length < 10) {
      newErrors.phone = 'Phone must have at least 10 digits';
    }
    
    // Product name validation
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required';
    } else if (formData.productName.trim().length < 2) {
      newErrors.productName = 'Product name must be at least 2 characters';
    }
    
    // Total amount validation
    if (!formData.totalAmount.trim()) {
      newErrors.totalAmount = 'Total amount is required';
    } else {
      const totalAmount = Number(removeCommas(formData.totalAmount));
      if (isNaN(totalAmount) || totalAmount <= 0) {
        newErrors.totalAmount = 'Enter a valid amount';
      } else if (totalAmount < 1000) {
        newErrors.totalAmount = 'Amount must be at least Rs. 1,000';
      }
    }
    
    // Advance amount validation
    if (formData.advanceAmount.trim()) {
      const advanceAmount = Number(removeCommas(formData.advanceAmount));
      const totalAmount = Number(removeCommas(formData.totalAmount));
      if (isNaN(advanceAmount) || advanceAmount < 0) {
        newErrors.advanceAmount = 'Enter a valid advance amount';
      } else if (advanceAmount >= totalAmount) {
        newErrors.advanceAmount = 'Advance amount must be less than total amount';
      }
    }
    
    // Installment count validation
    if (!formData.installmentCount.trim()) {
      newErrors.installmentCount = 'Installment count is required';
    } else {
      const count = Number(formData.installmentCount);
      if (isNaN(count) || count <= 0) {
        newErrors.installmentCount = 'Enter a valid count';
      } else if (count < 1) {
        newErrors.installmentCount = 'At least 1 installment required';
      } else if (count > 60) {
        newErrors.installmentCount = 'Maximum 60 installments allowed';
      }
    }
    
    // Monthly installment validation
    if (!formData.monthlyInstallment.trim()) {
      newErrors.monthlyInstallment = 'Monthly installment is required';
    } else {
      const monthlyAmount = Number(removeCommas(formData.monthlyInstallment));
      if (isNaN(monthlyAmount) || monthlyAmount <= 0) {
        newErrors.monthlyInstallment = 'Enter a valid amount';
      } else if (monthlyAmount < 100) {
        newErrors.monthlyInstallment = 'Minimum installment amount is Rs. 100';
      }
    }
    
    // Start date validation
    if (!formData.startDate.trim()) {
      newErrors.startDate = 'Start date is required';
    } else {
      const startDate = new Date(formData.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (startDate < today) {
        newErrors.startDate = 'Start date cannot be in the past';
      }
    }
    
    // Due date validation
    if (!formData.dueDate.trim()) {
      newErrors.dueDate = 'Due day is required';
    } else {
      const dueDay = Number(formData.dueDate);
      if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
        newErrors.dueDate = 'Enter a valid day (1-31)';
      }
    }
    
    // Manager validation
    if (!formData.managerId) {
      newErrors.manager = 'Manager selection is required';
    }
    
    setErrors(newErrors);
    
    // Return true only if all validations pass
    return Object.keys(newErrors).length === 0 && step1Valid && step2Valid && step3Valid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Check if form is ready to save
  const isFormReady = () => {
    return (
      formData.customerId.trim() &&
      formData.name.trim() &&
      formData.email.trim() &&
      formData.phone.trim() &&
      formData.productName.trim() &&
      formData.totalAmount.trim() &&
      formData.installmentCount.trim() &&
      formData.monthlyInstallment.trim() &&
      formData.startDate.trim() &&
      formData.dueDate.trim() &&
      formData.managerId &&
      !Object.keys(errors).length &&
      !managerError
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Show error message to user
      alert('Please fill all required fields correctly before saving.');
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
        managerId: formData.managerId,
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
      managerId: '',
    });
    setErrors({});
    setCurrentStep(1);
    setIsVisible(false);
    setShowManagerDropdown(false);
    setManagerSearch('');
    setManagerError('');
    setSelectedIndex(-1);
    setTimeout(() => onClose(), 200);
  };

  // Filter managers based on search
  const filteredManagers = managers.filter(manager =>
    manager.name.toLowerCase().includes(managerSearch.toLowerCase())
  );

  // Get selected manager name
  const selectedManager = managers.find(m => m._id === formData.managerId);
  const selectedManagerName = selectedManager ? selectedManager.name : '';

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showManagerDropdown) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredManagers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : filteredManagers.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredManagers.length) {
          const manager = filteredManagers[selectedIndex];
          setFormData(prev => ({ ...prev, managerId: manager._id }));
          setManagerSearch('');
          setShowManagerDropdown(false);
          setSelectedIndex(-1);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowManagerDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showManagerDropdown) {
        const target = event.target as Element;
        if (!target.closest('.manager-dropdown')) {
          setShowManagerDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showManagerDropdown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-100 translate-y-0 overflow-hidden">
        {/* Header - Fixed */}
        <div className="relative overflow-hidden rounded-t-2xl bg-blue-50 flex-shrink-0">
          <div className="relative p-4">
            <div className="flex justify-between items-center">
              <div className="flex-1 text-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {isEditMode ? 'Edit Installment' : 'Add Installment'}
                </h2>
              </div>
              <button 
                onClick={handleClose}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 p-2 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customerId" className="block text-sm font-medium text-black mb-1">
                    Customer ID
                  </label>
                  <input
                    type="text"
                    id="customerId"
                    value={formData.customerId}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                      errors.customerId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter customer ID"
                  />
                  {errors.customerId && (
                    <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                      errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter customer name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-black mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter phone number"
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-black mb-1">
                    Address
                  </label>
                  <textarea
                    id="address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address (optional)"
                    rows={2}
                  />
                </div>

                <div>
                  <label htmlFor="manager" className="block text-sm font-medium text-black mb-1">
                    Manager
                  </label>
                  <div className="relative manager-dropdown">
                    <input
                      type="text"
                      id="manager"
                      value={showManagerDropdown ? managerSearch : selectedManagerName}
                      onChange={(e) => {
                        setManagerSearch(e.target.value);
                        setShowManagerDropdown(true);
                        setSelectedIndex(-1);
                      }}
                      onFocus={() => setShowManagerDropdown(true)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="Select manager"
                    />
                    <button
                      type="button"
                      onClick={() => setShowManagerDropdown(!showManagerDropdown)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showManagerDropdown && (
                      <div className="absolute z-10 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {filteredManagers.length > 0 ? (
                          filteredManagers.map((manager, index) => (
                            <button
                              key={manager._id}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, managerId: manager._id }));
                                setManagerSearch('');
                                setShowManagerDropdown(false);
                                setSelectedIndex(-1);
                              }}
                              className={`w-full text-left px-3 py-2 text-black ${
                                index === selectedIndex 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'hover:bg-gray-100'
                              }`}
                            >
                              {manager.name}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-gray-500 text-sm">No managers found</div>
                        )}
                      </div>
                    )}
                  </div>
                  {managerError && (
                    <p className="text-red-500 text-xs mt-1">{managerError}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="productName" className="block text-sm font-medium text-black mb-1">
                    Product Name
                  </label>
                  <input
                    type="text"
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                      errors.productName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter product name"
                  />
                  {errors.productName && (
                    <p className="text-red-500 text-xs mt-1">{errors.productName}</p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="productDescription" className="block text-sm font-medium text-black mb-1">
                    Product Description
                  </label>
                  <textarea
                    id="productDescription"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    value={formData.productDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, productDescription: e.target.value }))}
                    placeholder="Enter product description (optional)"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Installment Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Installment Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="totalAmount" className="block text-sm font-medium text-black mb-1">
                    Total Amount
                  </label>
                  <input
                    type="text"
                    id="totalAmount"
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                      errors.totalAmount ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter total amount"
                  />
                  {errors.totalAmount && (
                    <p className="text-red-500 text-xs mt-1">{errors.totalAmount}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="advanceAmount" className="block text-sm font-medium text-black mb-1">
                    Advance Amount
                  </label>
                  <input
                    type="text"
                    id="advanceAmount"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Enter advance amount (optional)"
                  />
                  {errors.advanceAmount && (
                    <p className="text-red-500 text-xs mt-1">{errors.advanceAmount}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="installmentCount" className="block text-sm font-medium text-black mb-1">
                    Installment Count
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      id="installmentCount"
                      value={formData.installmentCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, installmentCount: e.target.value }))}
                      className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                        errors.installmentCount ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter number"
                    />
                    <select
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
                  <label htmlFor="monthlyInstallment" className="block text-sm font-medium text-black mb-1">
                    {formData.installmentUnit === 'days' ? 'Daily' : 
                     formData.installmentUnit === 'weeks' ? 'Weekly' : 'Monthly'} Installment
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="monthlyInstallment"
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
                      className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                        errors.monthlyInstallment ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Auto calculated"
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
                  <label htmlFor="startDate" className="block text-sm font-medium text-black mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                      errors.startDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.startDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-black mb-1">
                    Due Day
                  </label>
                  <input
                    type="number"
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={(e) => {
                      const numericValue = e.target.value.replace(/[^0-9]/g, '');
                      if (numericValue === '' || (Number(numericValue) >= 1 && Number(numericValue) <= 31)) {
                        setFormData(prev => ({ ...prev, dueDate: numericValue }));
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                      errors.dueDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter day of month (1-31)"
                    min="1"
                    max="31"
                  />
                  {errors.dueDate && (
                    <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 text-black bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isFormReady()}
                className={`px-6 py-2 text-white rounded-full transition-colors duration-200 flex items-center justify-center gap-2 ${
                  !isFormReady() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                style={{ 
                  backgroundColor: '#3B82F6',
                  opacity: isSubmitting ? 0.7 : (!isFormReady() ? 0.5 : 1)
                }}
                title={!isFormReady() ? 'Please fill all required fields' : ''}
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
                    {!isFormReady() && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    )}
                    {isEditMode ? 'Update Installment' : 'Create Installment'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddInstallmentModal;

