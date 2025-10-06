import React, { useState, useEffect } from 'react';

interface ViewLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
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

const ViewLoanModal: React.FC<ViewLoanModalProps> = ({
  isOpen,
  onClose,
  loan,
  colors
}) => {
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

  if (!isOpen || !loan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-100 translate-y-0 overflow-hidden">
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-blue-50 flex-shrink-0">
          <div className="relative p-4">
            <div className="flex justify-between items-center">
              <div className="flex-1 text-center">
                <h2 className="text-xl font-bold text-gray-800">Loan Details</h2>
                <p className="text-sm text-gray-600 mt-1">Loan ID: {loan.loanId || 'N/A'}</p>
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
          <div className="space-y-6">
            {/* Basic Loan Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Debtor Name</p>
                  <p className="text-base font-medium text-gray-800">{loan.investorName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Loan Amount</p>
                  <p className="text-base font-medium text-gray-800">Rs. {loan.loanAmount?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Interest Rate</p>
                  <p className="text-base font-medium text-gray-800">{loan.interestRate}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-base font-medium text-gray-800">{loan.duration} months</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    loan.status === 'active' ? 'bg-green-100 text-green-800' :
                    loan.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                    loan.status === 'defaulted' ? 'bg-red-100 text-red-800' :
                    loan.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {loan.status?.charAt(0).toUpperCase() + loan.status?.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created Date</p>
                  <p className="text-base font-medium text-gray-800">
                    {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Financial Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Monthly Payment</p>
                    <p className="text-lg font-bold text-green-600">
                      Rs. {loan.monthlyPayment ? (Math.round(loan.monthlyPayment) + 1).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-lg font-bold text-blue-600">
                      Rs. {loan.totalAmount ? (Math.round(loan.totalAmount) + 1).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Interest Amount</p>
                    <p className="text-lg font-bold text-orange-600">
                      Rs. {loan.totalAmount && loan.loanAmount ? (Math.round(loan.totalAmount - loan.loanAmount) + 1).toLocaleString() : 'N/A'}
                    </p>
                  </div>
              </div>
            </div>

            {/* Payment Progress */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Progress</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Paid Amount</span>
                  <span className="text-base font-medium text-gray-800">Rs. {loan.paidAmount ? (Math.round(loan.paidAmount) + 1).toLocaleString() : '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Remaining Amount</span>
                  <span className="text-base font-medium text-gray-800">Rs. {loan.remainingAmount ? (Math.round(loan.remainingAmount) + 1).toLocaleString() : 'N/A'}</span>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium text-gray-800">
                      {loan.totalAmount ? Math.round((loan.paidAmount / loan.totalAmount) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${loan.totalAmount ? (loan.paidAmount / loan.totalAmount) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {loan.paymentHistory && loan.paymentHistory.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment History</h3>
                <div className="space-y-3">
                  {loan.paymentHistory.map((payment: any, index: number) => (
                    <div key={index} className="bg-white rounded-lg p-3 flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Rs. {payment.amount?.toLocaleString()}</p>
                        <p className="text-xs text-gray-600">
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      {payment.notes && (
                        <p className="text-xs text-gray-500 max-w-xs truncate">{payment.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {loan.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Notes</h3>
                <p className="text-sm text-gray-700">{loan.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewLoanModal;
