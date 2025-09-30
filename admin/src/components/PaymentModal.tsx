'use client';

import React, { useState, useEffect } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (paymentData: any) => void;
  onMarkUnpaid?: (installmentNumber: number) => void;
  installment: any;
  isLoading?: boolean;
  isEditMode?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  onMarkUnpaid,
  installment, 
  isLoading = false,
  isEditMode = false
}) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [distributionInfo, setDistributionInfo] = useState<{
    difference: number;
    remainingCount: number;
    amountPerInstallment: number;
    isExcess: boolean;
    message: string;
  } | null>(null);
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
    glass: 'rgba(255, 255, 255, 0.95)'
  };

  const paymentMethods = [
    { id: 'cash', name: 'Cash' },
    { id: 'bank_transfer', name: 'Bank Transfer' },
    { id: 'wallet', name: 'Mobile Wallet' },
    { id: 'cheque', name: 'Cheque' },
    { id: 'other', name: 'Other' },
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

  // Initialize form when installment changes
  useEffect(() => {
    if (installment && isOpen) {
      if (isEditMode) {
        // For edit mode, use the actual paid amount and existing payment details
        setPaymentAmount(installment.actualPaidAmount?.toString() || installment.amount?.toString() || '');
        setPaymentMethod(installment.paymentMethod || 'cash');
        setPaymentNotes(installment.notes || '');
      } else {
        // For new payment mode, use the installment amount
        setPaymentAmount(installment.amount?.toString() || '');
        setPaymentMethod('cash');
        setPaymentNotes('');
      }
      setDistributionInfo(null);
    }
  }, [installment, isOpen, isEditMode]);

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const roundUp = (amount: number) => Math.ceil(amount);

  const calculateDistribution = (amount: number) => {
    if (!installment || !installment.installments) return null;
    
    const originalAmount = installment.amount;
    const difference = amount - originalAmount;
    
    if (difference === 0) return null;
    
    // Find remaining unpaid installments
    const remainingInstallments = installment.installments.filter((inst: any) => 
      inst.status === 'pending' && inst.installmentNumber > installment.installmentNumber
    );
    
    if (remainingInstallments.length === 0) return null;
    
    const amountPerInstallment = difference / remainingInstallments.length;
    const roundedAmountPerInstallment = roundUp(Math.abs(amountPerInstallment));
    
    return {
      difference,
      remainingCount: remainingInstallments.length,
      amountPerInstallment: roundedAmountPerInstallment,
      isExcess: difference > 0,
      message: difference > 0 
        ? `Excess of ${formatCurrency(Math.abs(difference))} will be distributed across ${remainingInstallments.length} remaining installments (${formatCurrency(roundedAmountPerInstallment)} each)`
        : `Shortfall of ${formatCurrency(Math.abs(difference))} will be distributed across ${remainingInstallments.length} remaining installments (${formatCurrency(roundedAmountPerInstallment)} each)`
    };
  };

  const handleAmountChange = (amount: string) => {
    setPaymentAmount(amount);
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      const distInfo = calculateDistribution(numAmount);
      setDistributionInfo(distInfo);
    } else {
      setDistributionInfo(null);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    // Prevent any form submission that might cause page reload
    if (e) {
      e.preventDefault();
    }
    
    if (!paymentAmount) {
      // Use a more user-friendly error display instead of alert
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      // Use a more user-friendly error display instead of alert
      return;
    }

    const paymentData = {
      installmentNumber: installment.installmentNumber,
      paymentMethod: paymentMethod,
      notes: paymentNotes,
      customAmount: amount
    };

    onSubmit(paymentData);
  };

  const handleClose = () => {
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentNotes('');
    setDistributionInfo(null);
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
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden transform transition-all duration-300 ${
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
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-lg">{isEditMode ? '✏️' : '💳'}</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {isEditMode ? 'Edit Payment' : 'Record Payment'}
                  </h2>
                  <p className="text-white/90 text-sm">
                    {isEditMode ? 'Update payment details' : 'Record payment for installment'}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleClose}
                className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-full"
                disabled={isLoading}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* Installment Info */}
          {installment && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <span className="text-blue-600 text-lg mr-2">📋</span>
                <h3 className="text-lg font-semibold text-blue-800">Installment Details</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Number:</span>
                  <span className="ml-2 font-semibold text-gray-800">#{installment.installmentNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">Due Date:</span>
                  <span className="ml-2 font-semibold text-gray-800">{formatDate(installment.dueDate)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Original Amount:</span>
                  <span className="ml-2 font-bold text-blue-600 text-lg">{formatCurrency(installment.amount)}</span>
                </div>
                {isEditMode && installment.actualPaidAmount && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Currently Paid:</span>
                    <span className="ml-2 font-bold text-green-600 text-lg">{formatCurrency(installment.actualPaidAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="mr-2">💵</span>
              {isEditMode ? 'Updated Payment Amount' : 'Payment Amount'} *
            </label>
            <input
              type="number"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={paymentAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Enter amount"
              style={{ color: colors.text }}
            />
            <p className="text-gray-500 text-xs mt-2">
              {isEditMode 
                ? 'Update the payment amount. Any changes will be reflected in the installment records and distributed across remaining installments.'
                : 'You can pay more or less than the original amount. Any difference will be automatically distributed across remaining installments.'
              }
            </p>
            
            {/* Distribution Info Display */}
            {distributionInfo && (
              <div className={`mt-3 p-4 rounded-lg border ${
                distributionInfo.isExcess 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center mb-2">
                  <span className={`text-lg mr-2 ${
                    distributionInfo.isExcess ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {distributionInfo.isExcess ? '📈' : '📉'}
                  </span>
                  <span className={`font-semibold ${
                    distributionInfo.isExcess ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {distributionInfo.isExcess ? 'Excess Payment' : 'Shortfall Payment'}
                  </span>
                </div>
                <p className={`text-sm ${
                  distributionInfo.isExcess ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {distributionInfo.message}
                </p>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <span className="mr-2">💳</span>
              Payment Method *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    paymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center">
                    <span className={`text-sm font-medium ${
                      paymentMethod === method.id ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {method.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <span className="mr-2">📝</span>
              Notes (Optional)
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="Add any notes about this payment"
              rows={3}
              style={{ color: colors.text }}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-between items-center">
            {/* Mark as Unpaid Button (only in edit mode) */}
            {isEditMode && onMarkUnpaid && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to mark this installment as unpaid? This will redistribute the paid amount across remaining installments.')) {
                    onMarkUnpaid(installment.installmentNumber);
                  }
                }}
                disabled={isLoading}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Mark as Unpaid
              </button>
            )}
            
            {/* Action Buttons */}
            <div className="flex gap-3 ml-auto">
              <button
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`px-6 py-2 rounded-lg text-white font-medium transition-colors duration-200 flex items-center gap-2 ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                    {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isEditMode ? 'Updating...' : 'Recording...'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {isEditMode ? 'Update Payment' : 'Record Payment'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
