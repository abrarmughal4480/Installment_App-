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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 translate-y-0">
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-blue-50">
          <div className="relative p-4">
            <div className="flex justify-between items-center">
              <div className="flex-1 text-center">
                <h2 className="text-xl font-bold text-gray-800">
                  {isEditMode ? 'Edit Payment' : 'Record Payment'}
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

        {/* Modal Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Installment Info */}
            {installment && (
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Installment #{installment.installmentNumber}</span>
                    <span>{formatDate(installment.dueDate)}</span>
                  </div>
                  <div className="mt-1 font-semibold text-gray-800">
                    Amount: {formatCurrency(installment.amount)}
                  </div>
                  {isEditMode && installment.actualPaidAmount && (
                    <div className="mt-1 text-green-600">
                      Paid: {formatCurrency(installment.actualPaidAmount)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Amount */}
            <div>
              <label htmlFor="paymentAmount" className="block text-sm font-medium text-black mb-1">
                Payment Amount
              </label>
              <input
                type="number"
                id="paymentAmount"
                value={paymentAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black border-gray-300"
                placeholder="Enter amount"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-black mb-1">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black border-gray-300"
              >
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Notes */}
            <div>
              <label htmlFor="paymentNotes" className="block text-sm font-medium text-black mb-1">
                Notes (Optional)
              </label>
              <textarea
                id="paymentNotes"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black border-gray-300"
                placeholder="Add any notes about this payment"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 text-black bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200 mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 text-white rounded-full transition-colors duration-200 flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {isEditMode ? 'Updating...' : 'Recording...'}
                  </>
                ) : (
                  isEditMode ? 'Update Payment' : 'Record Payment'
                )}
              </button>
            </div>
            
            {/* Mark as Unpaid Option (only in edit mode) */}
            {isEditMode && onMarkUnpaid && installment && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    onMarkUnpaid(installment.installmentNumber);
                  }}
                  disabled={isLoading}
                  className="w-full px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors duration-200 text-sm"
                >
                  Mark as Unpaid
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
