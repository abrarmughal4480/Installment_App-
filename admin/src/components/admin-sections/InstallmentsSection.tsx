"use client";

import { useState, useEffect } from 'react';
import apiService from '@/services/apiService';

interface InstallmentsSectionProps {
  colors: any;
  formatCurrency: (amount: number) => string;
}

interface Installment {
  id: string;
  recordId: string;
  installmentNumber: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  productName: string;
  productDescription: string;
  totalAmount: number;
  advanceAmount: number;
  amount: number;
  actualPaidAmount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: string;
  notes?: string;
  paidBy?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  // Add fields for full installment plan data
  installmentCount?: number;
  totalPaidInstallments?: number;
  totalUnpaidInstallments?: number;
}

export default function InstallmentsSection({ colors, formatCurrency }: InstallmentsSectionProps) {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    overdue: 0,
    currentMonth: 0,
    nextMonth: 0
  });
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchInstallments();
  }, []);

  const fetchInstallments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getAllInstallments();
      
      if (response.success) {
        setInstallments(response.installments || []);
        setStats({
          total: response.total || 0,
          overdue: response.overdue || 0,
          currentMonth: response.currentMonth || 0,
          nextMonth: response.nextMonth || 0
        });
      } else {
        setError(response.message || 'Failed to fetch installments');
      }
    } catch (err) {
      setError('Failed to fetch installments');
      console.error('Error fetching installments:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return {
          bg: `${colors.success}20`,
          text: colors.success
        };
      case 'pending':
        return {
          bg: `${colors.warning}20`,
          text: colors.warning
        };
      case 'overdue':
        return {
          bg: `${colors.danger}20`,
          text: colors.danger
        };
      default:
        return {
          bg: `${colors.lightText}20`,
          text: colors.lightText
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleViewInstallment = (installment: Installment) => {
    setSelectedInstallment(installment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedInstallment(null);
    setIsModalOpen(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
          Installments
        </h2>
        
        <div 
          className="p-6 rounded-2xl shadow-lg"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
          Installments
        </h2>
        
        <div 
          className="p-6 rounded-2xl shadow-lg text-center"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-lg font-medium">Error Loading Installments</p>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
            <button
              onClick={fetchInstallments}
              className="mt-4 px-4 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: colors.primary }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (installments.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
          Installments
        </h2>
        
        <div 
          className="p-6 rounded-2xl shadow-lg text-center"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <div className="text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No Installments Found</p>
            <p className="text-sm text-gray-600 mt-1">No installment records found in the system.</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
            Current & Next Month Installments
          </h2>
          <div className="flex space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.danger }}></div>
              <span className="text-sm" style={{ color: colors.lightText }}>
                Overdue: {stats.overdue}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.warning }}></div>
              <span className="text-sm" style={{ color: colors.lightText }}>
                Current Month: {stats.currentMonth}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primaryLight }}></div>
              <span className="text-sm" style={{ color: colors.lightText }}>
                Next Month: {stats.nextMonth}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors.primary }}></div>
              <span className="text-sm" style={{ color: colors.lightText }}>
                Total: {stats.total}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={fetchInstallments}
          className="px-4 py-2 rounded-lg text-white font-medium flex items-center space-x-2"
          style={{ backgroundColor: colors.primary }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>
      
      <div 
        className="p-6 rounded-2xl shadow-lg"
        style={{ backgroundColor: colors.cardBackground }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: colors.text }}>
                  Customer
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: colors.text }}>
                  Amount
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: colors.text }}>
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: colors.text }}>
                  Due Date
                </th>
                <th className="text-left py-3 px-4 font-semibold" style={{ color: colors.text }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {installments.map((installment) => {
                const statusColors = getStatusColor(installment.status);
                return (
                  <tr key={installment.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td className="py-3 px-4 font-medium" style={{ color: colors.text }}>
                      {installment.customerName}
                    </td>
                    <td className="py-3 px-4" style={{ color: colors.text }}>
                      {formatCurrency(installment.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span 
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: 
                            installment.status === 'paid' ? `${colors.success}20` :
                            installment.status === 'pending' ? `${colors.warning}20` :
                            `${colors.danger}20`,
                          color: 
                            installment.status === 'paid' ? colors.success :
                            installment.status === 'pending' ? colors.warning :
                            colors.danger
                        }}
                      >
                        {installment.status.charAt(0).toUpperCase() + installment.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4" style={{ color: colors.text }}>
                      {formatDate(installment.dueDate)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewInstallment(installment)}
                          className="px-3 py-1 rounded text-sm"
                          style={{ 
                            backgroundColor: `${colors.primary}20`, 
                            color: colors.primary 
                          }}
                        >
                          View
                        </button>
                        <button 
                          className="px-3 py-1 rounded text-sm"
                          style={{ 
                            backgroundColor: `${colors.warning}20`, 
                            color: colors.warning 
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Installment Progress Modal */}
      {isModalOpen && selectedInstallment && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={handleCloseModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div 
              className="px-6 py-4 border-b flex-shrink-0"
              style={{ borderColor: colors.border }}
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold" style={{ color: colors.text }}>
                  Installment Progress
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - Scrollable */}
            <div 
              className="flex-1 overflow-y-auto p-6"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: `${colors.border} transparent`,
                scrollbarGutter: 'stable'
              }}
            >
              {/* Customer Info */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
                  Customer Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm" style={{ color: colors.lightText }}>Name</p>
                    <p className="font-medium" style={{ color: colors.text }}>
                      {selectedInstallment.customerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: colors.lightText }}>Email</p>
                    <p className="font-medium" style={{ color: colors.text }}>
                      {selectedInstallment.customerEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: colors.lightText }}>Phone</p>
                    <p className="font-medium" style={{ color: colors.text }}>
                      {selectedInstallment.customerPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: colors.lightText }}>Customer ID</p>
                    <p className="font-medium" style={{ color: colors.text }}>
                      {selectedInstallment.customerId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2" style={{ color: colors.text }}>
                  Product Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm" style={{ color: colors.lightText }}>Product</p>
                    <p className="font-medium" style={{ color: colors.text }}>
                      {selectedInstallment.productName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: colors.lightText }}>Total Amount</p>
                    <p className="font-medium" style={{ color: colors.text }}>
                      {formatCurrency(selectedInstallment.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: colors.lightText }}>Advance Amount</p>
                    <p className="font-medium" style={{ color: colors.text }}>
                      {formatCurrency(selectedInstallment.advanceAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: colors.lightText }}>Monthly Installment</p>
                    <p className="font-medium" style={{ color: colors.text }}>
                      {formatCurrency(selectedInstallment.amount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress Summary */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                  Payment Progress
                </h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div 
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: `${colors.success}10` }}
                  >
                    <p className="text-2xl font-bold" style={{ color: colors.success }}>
                      {selectedInstallment.totalPaidInstallments || 0}
                    </p>
                    <p className="text-sm" style={{ color: colors.lightText }}>Paid</p>
                  </div>
                  <div 
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: `${colors.warning}10` }}
                  >
                    <p className="text-2xl font-bold" style={{ color: colors.warning }}>
                      {selectedInstallment.totalUnpaidInstallments || 0}
                    </p>
                    <p className="text-sm" style={{ color: colors.lightText }}>Remaining</p>
                  </div>
                  <div 
                    className="p-4 rounded-lg text-center"
                    style={{ backgroundColor: `${colors.primary}10` }}
                  >
                    <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                      {selectedInstallment.installmentCount || 0}
                    </p>
                    <p className="text-sm" style={{ color: colors.lightText }}>Total</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all duration-300"
                    style={{ 
                      backgroundColor: colors.primary,
                      width: `${selectedInstallment.installmentCount ? ((selectedInstallment.totalPaidInstallments || 0) / selectedInstallment.installmentCount) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <p className="text-sm text-center mt-2" style={{ color: colors.lightText }}>
                  {selectedInstallment.installmentCount ? Math.round(((selectedInstallment.totalPaidInstallments || 0) / selectedInstallment.installmentCount) * 100) : 0}% Complete
                </p>
              </div>

              {/* Current Installment Details */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                  Current Installment Details
                </h4>
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: colors.inputBackground }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm" style={{ color: colors.lightText }}>Installment #</p>
                      <p className="font-medium" style={{ color: colors.text }}>
                        #{selectedInstallment.installmentNumber}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: colors.lightText }}>Amount</p>
                      <p className="font-medium" style={{ color: colors.text }}>
                        {formatCurrency(selectedInstallment.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: colors.lightText }}>Due Date</p>
                      <p className="font-medium" style={{ color: colors.text }}>
                        {formatDate(selectedInstallment.dueDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: colors.lightText }}>Status</p>
                      <span 
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: 
                            selectedInstallment.status === 'paid' ? `${colors.success}20` :
                            selectedInstallment.status === 'pending' ? `${colors.warning}20` :
                            `${colors.danger}20`,
                          color: 
                            selectedInstallment.status === 'paid' ? colors.success :
                            selectedInstallment.status === 'pending' ? colors.warning :
                            colors.danger
                        }}
                      >
                        {selectedInstallment.status.charAt(0).toUpperCase() + selectedInstallment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {selectedInstallment.actualPaidAmount > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
                    Payment History
                  </h4>
                  <div 
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: colors.inputBackground }}
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm" style={{ color: colors.lightText }}>Amount Paid</p>
                        <p className="font-medium" style={{ color: colors.text }}>
                          {formatCurrency(selectedInstallment.actualPaidAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm" style={{ color: colors.lightText }}>Payment Method</p>
                        <p className="font-medium" style={{ color: colors.text }}>
                          {selectedInstallment.paymentMethod || 'N/A'}
                        </p>
                      </div>
                      {selectedInstallment.paidDate && (
                        <div>
                          <p className="text-sm" style={{ color: colors.lightText }}>Paid Date</p>
                          <p className="font-medium" style={{ color: colors.text }}>
                            {formatDate(selectedInstallment.paidDate)}
                          </p>
                        </div>
                      )}
                      {selectedInstallment.notes && (
                        <div>
                          <p className="text-sm" style={{ color: colors.lightText }}>Notes</p>
                          <p className="font-medium" style={{ color: colors.text }}>
                            {selectedInstallment.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div 
              className="px-6 py-4 border-t flex justify-end space-x-3 flex-shrink-0"
              style={{ borderColor: colors.border }}
            >
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg font-medium"
                style={{ 
                  backgroundColor: colors.border,
                  color: colors.text
                }}
              >
                Close
              </button>
              {selectedInstallment.status === 'pending' && (
                <button
                  className="px-4 py-2 rounded-lg font-medium text-white"
                  style={{ backgroundColor: colors.success }}
                >
                  Mark as Paid
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
