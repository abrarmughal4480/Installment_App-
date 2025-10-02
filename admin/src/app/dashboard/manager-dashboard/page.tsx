'use client';

import React, { useState, useEffect } from 'react';
import AddInstallmentModal from '@/components/AddInstallmentModal';
import PaymentModal from '@/components/PaymentModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { apiService } from '@/services/apiService';
import { useToast } from '@/contexts/ToastContext';

const ManagerDashboard = () => {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<string | null>(null);
  const [showAddInstallmentModal, setShowAddInstallmentModal] = useState(false);
  const [installments, setInstallments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentInstallment, setSelectedPaymentInstallment] = useState<any>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editInstallmentData, setEditInstallmentData] = useState<any>(null);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  // Actions dropdown functionality
  const toggleActionsDropdown = () => {
    setShowActionsDropdown(!showActionsDropdown);
  };

  const closeActionsDropdown = () => {
    setShowActionsDropdown(false);
  };

  const openChangePasswordModal = () => {
    setShowChangePasswordModal(true);
    setShowActionsDropdown(false);
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
  };

  // Change password functionality
  const handleChangePassword = async (passwordData: any) => {
    try {
      const response = await apiService.changePassword(passwordData);
      
      if (response.success) {
        showSuccess('Password Changed!', 'Your password has been updated successfully');
        closeChangePasswordModal();
      } else {
        showError('Password Change Failed', response.message || 'Failed to change password');
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      showError('Password Change Failed', 'An error occurred while changing password');
    }
  };

  // Logout functionality
  const handleLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Show success message
      showSuccess('Logged Out!', 'You logged out');
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      console.error('Logout error:', error);
      showError('Logout Failed', 'Error logging out');
    }
  };

  const openDetailsModal = (installment: string) => {
    setSelectedInstallment(installment);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedInstallment(null);
  };

  const openAddInstallmentModal = () => {
    setShowAddInstallmentModal(true);
  };

  const closeAddInstallmentModal = () => {
    setShowAddInstallmentModal(false);
    setIsEditMode(false);
    setEditInstallmentData(null);
  };

  // Payment modal functions
  const openPaymentModal = (installment: any, editMode: boolean = false) => {
    setSelectedPaymentInstallment(installment);
    setIsEditMode(editMode);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedPaymentInstallment(null);
    setIsEditMode(false);
  };

  const handlePayment = async (paymentData: any) => {
    try {
      setIsRecordingPayment(true);
      
      const response = isEditMode 
        ? await apiService.updatePayment(selectedPaymentInstallment.id, paymentData)
        : await apiService.payInstallment(selectedPaymentInstallment.id, paymentData);
      
      if (response.success) {
        // Create a more user-friendly success message
        showSuccess(isEditMode ? 'Payment Updated!' : 'Payment Recorded!', `Rs. ${response.installment.actualPaidAmount?.toLocaleString()} recorded`);
        closePaymentModal();
        
        // Refresh the installments list silently
        await fetchInstallments();
      } else {
        showError(isEditMode ? 'Update Failed' : 'Payment Failed', 'Operation failed');
      }
    } catch (err: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'recording'} payment:`, err);
      showError(isEditMode ? 'Update Failed' : 'Payment Failed', 'Operation failed');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleMarkUnpaid = async (installmentNumber: number) => {
    try {
      setIsRecordingPayment(true);
      
      const response = await apiService.markInstallmentUnpaid(
        selectedPaymentInstallment.id,
        installmentNumber
      );
      
      if (response.success) {
        showSuccess('Marked Unpaid!', `Installment #${installmentNumber} unpaid`);
        closePaymentModal();
        
        // Refresh the installments list silently
        await fetchInstallments();
      } else {
        showError('Mark Failed', 'Operation failed');
      }
    } catch (err: any) {
      console.error('Error marking installment as unpaid:', err);
      showError('Mark Failed', 'Operation failed');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Fetch installments from API
  const fetchInstallments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getInstallments();
      if (response.success) {
        // Sort installments by creation date (latest first)
        const sortedInstallments = (response.installments || []).sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        setInstallments(sortedInstallments);
      } else {
        showError('Failed to Load Installments', 'Unable to fetch installments data');
      }
    } catch (err) {
      console.error('Error fetching installments:', err);
      showError('Failed to Load Installments', 'Please check your connection and try again');
    } finally {
      setLoading(false);
    }
  };

  // Load installments on component mount
  useEffect(() => {
    fetchInstallments();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActionsDropdown) {
        const target = event.target as Element;
        if (!target.closest('.actions-dropdown')) {
          setShowActionsDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsDropdown]);

  const handleAddInstallment = async (data: any) => {
    try {
      const response = await apiService.createInstallment(data);
      
      if (response.success) {
        showSuccess(
          isEditMode ? 'Installment Updated!' : 'Installment Created!',
          `${data.name} plan ${isEditMode ? 'updated' : 'created'}`
        );
        // Refresh the installments list
        await fetchInstallments();
        closeAddInstallmentModal();
      } else {
        showError(
          isEditMode ? 'Update Failed' : 'Creation Failed',
          'Operation failed'
        );
      }
    } catch (err: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} installment:`, err);
      showError(
        isEditMode ? 'Update Failed' : 'Creation Failed',
        'Operation failed'
      );
    }
  };

  // Edit installment functionality - open modal with edit data
  const handleEditInstallment = (installment: any) => {
    setEditInstallmentData(installment);
    setIsEditMode(true);
    setShowAddInstallmentModal(true);
  };

  // Delete installment functionality
  const handleDeleteInstallment = async (installment: any) => {
    if (window.confirm(`Are you sure you want to delete the installment plan for ${installment.customerName}? This action cannot be undone.`)) {
      try {
        const response = await apiService.deleteInstallment(installment.id);
        
        if (response.success) {
          showSuccess('Deleted!', `${installment.customerName} plan deleted`);
          // Refresh the installments list
          await fetchInstallments();
        } else {
          showError('Delete Failed', 'Operation failed');
        }
      } catch (err: any) {
        console.error('Error deleting installment:', err);
        showError('Delete Failed', 'Operation failed');
      }
    }
  };


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="flex-1 flex justify-center">
            <h1 className="text-3xl font-bold text-gray-800">
              Manager Dashboard
            </h1>
          </div>
          <div className="flex-1 flex justify-end items-center gap-2">
            {/* Actions Button */}
            <div className="relative actions-dropdown">
              <button 
                onClick={toggleActionsDropdown}
                className="px-3 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 flex items-center gap-2"
                title="Actions"
              >
                <span className="text-sm font-medium">Actions</span>
                <svg className={`w-4 h-4 transition-transform duration-200 ${showActionsDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Actions Dropdown */}
              {showActionsDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border" style={{ zIndex: 9999 }}>
                  <div className="py-1">
                    <button
                      onClick={openChangePasswordModal}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Change Password
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
              title="Logout"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
               </svg>
             </button>
          </div>
        </div>
       </header>

       {/* Main Content */}
       <main className="px-6 py-8">

         <div className="flex gap-6">
           {/* Left Side - Profile Section */}
           <div className="w-80 p-6">
             <div className="space-y-4">
               <p className="text-gray-500 text-sm">Welcome Back</p>
               <h2 className="text-xl font-bold text-gray-800">Muhammad Abrar</h2>
               
               <div className="space-y-2">
                 <p className="text-sm text-gray-800 whitespace-nowrap">
                   Current Login: {new Date().toLocaleString('en-PK', {
                     day: 'numeric',
                     month: 'long',
                     year: 'numeric',
                     hour: '2-digit',
                     minute: '2-digit',
                     hour12: true
                   })}
                 </p>
                 <p className="text-sm text-gray-800 whitespace-nowrap">
                   Last Login: {new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString('en-PK', {
                     day: 'numeric',
                     month: 'long',
                     year: 'numeric',
                     hour: '2-digit',
                     minute: '2-digit',
                     hour12: true
                   })}
                 </p>
               </div>
             </div>
           </div>

           {/* Right Side - Empty space for now */}
           <div className="flex-1"></div>
         </div>

         {/* Full Width Installments Table */}
         <div className="mt-8 mx-4">
           <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-semibold text-gray-800">
               Installments ({installments.length})
             </h3>
             <button 
               onClick={openAddInstallmentModal}
               className="px-4 py-2 text-white font-medium rounded-full transition-colors duration-200 flex items-center gap-2 hover:bg-green-400" 
               style={{ backgroundColor: '#10B981' }}
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
               </svg>
               Add Installment
             </button>
           </div>
           
           {loading ? (
             <div className="flex justify-center items-center py-12">
               <div className="flex items-center gap-3">
                 <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
                 <span className="text-gray-600">Loading installments...</span>
               </div>
             </div>
           ) : installments.length === 0 ? (
             <div className="text-center py-12">
               <div className="text-gray-500 mb-4">
                 <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                 </svg>
                 <h3 className="text-lg font-medium text-gray-900 mb-2">No installments found</h3>
                 <p className="text-gray-500 mb-4">Start by creating your first installment plan</p>
                 <button 
                   onClick={openAddInstallmentModal}
                   className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
                 >
                   Create Installment
                 </button>
               </div>
             </div>
           ) : (
           <div className="overflow-x-auto bg-white rounded-lg shadow-sm border custom-scrollbar">
             <table className="w-full text-sm">
               <thead>
                 <tr className="border-b">
                   <th className="text-left py-3 px-4 font-medium text-gray-700">Customer ID</th>
                   <th className="text-left py-3 px-4 font-medium text-gray-700">Customer Name</th>
                   <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                   <th className="text-left py-3 px-4 font-medium text-gray-700">Total Amount</th>
                   <th className="text-left py-3 px-4 font-medium text-gray-700">Installment #</th>
                   <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                   <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
                   <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                   <th className="text-left py-3 px-4 font-medium text-gray-700">Payment Method</th>
                   <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                 </tr>
               </thead>
               <tbody>
                   {installments.map((installment, index) => (
                     <tr key={installment.id || index} className="border-b">
                       <td className="py-3 px-4 text-gray-600">{installment.customerId}</td>
                       <td className="py-3 px-4 text-gray-800">{installment.customerName}</td>
                       <td className="py-3 px-4 text-gray-800">{installment.productName}</td>
                       <td className="py-3 px-4 text-gray-800">Rs. {installment.totalAmount?.toLocaleString()}</td>
                       <td className="py-3 px-4 text-gray-600">
                         {installment.installmentNumber}/{installment.installmentCount}
                   </td>
                       <td className="py-3 px-4 text-gray-800">Rs. {installment.amount?.toLocaleString()}</td>
                       <td className="py-3 px-4 text-gray-600">
                         {installment.dueDate ? new Date(installment.dueDate).toLocaleDateString() : '-'}
                   </td>
                   <td className="py-3 px-4">
                         <span className={`px-2 py-1 rounded-full text-xs ${
                           installment.status === 'completed' ? 'bg-green-100 text-green-800' :
                           installment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                           'bg-yellow-100 text-yellow-800'
                         }`}>
                           {installment.status?.charAt(0).toUpperCase() + installment.status?.slice(1)}
                         </span>
                   </td>
                       <td className="py-3 px-4 text-gray-600">
                         {installment.paymentMethod ? installment.paymentMethod.charAt(0).toUpperCase() + installment.paymentMethod.slice(1) : '-'}
                   </td>
                   <td className="py-3 px-4">
                         <div className="flex items-center gap-1 text-xs">
                     <button 
                             onClick={() => openDetailsModal(installment.customerId)}
                       className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                     >
                       View Details
                     </button>
                           {installment.status !== 'completed' && (
                     <>
                       <span className="text-gray-400">|</span>
                     <button 
                               onClick={() => openPaymentModal(installment)}
                               className="text-green-600 hover:text-green-800 hover:underline transition-colors duration-200"
                     >
                               Pay
                     </button>
                           </>
                           )}
                           <span className="text-gray-400">|</span>
                           <button 
                             onClick={() => handleEditInstallment(installment)}
                             className="text-yellow-600 hover:text-yellow-800 hover:underline transition-colors duration-200"
                             title="Edit Installment"
                           >
                             Edit
                           </button>
                           <span className="text-gray-400">|</span>
                     <button 
                             onClick={() => handleDeleteInstallment(installment)}
                             className="text-red-600 hover:text-red-800 hover:underline transition-colors duration-200"
                             title="Delete Installment"
                     >
                             Delete
                     </button>
                         </div>
                   </td>
                 </tr>
                   ))}
               </tbody>
             </table>
           </div>
           )}
         </div>
       </main>

       {/* Installment Details Modal */}
       {showDetailsModal && selectedInstallment && (() => {
         const installment = installments.find(inst => inst.customerId === selectedInstallment);
         if (!installment) return null;
         
         return (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden transform transition-all duration-300 scale-100 translate-y-0" style={{ backgroundColor: '#FFFFFF' }}>
             {/* Enhanced Header */}
             <div 
               className="relative overflow-hidden"
               style={{ 
                 background: `linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)`
               }}
             >
               <div className="absolute inset-0 bg-black opacity-10"></div>
               <div className="relative p-6">
                 <div className="flex justify-between items-center">
                   <div>
                     <h2 className="text-2xl font-bold text-white mb-2">Installment Details</h2>
                     <p className="text-white/90 text-sm">View detailed installment information</p>
                   </div>
                   <button 
                     onClick={closeDetailsModal}
                     className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-full"
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
               {/* Customer & Product Information Side by Side */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                 {/* Customer Information - Left */}
                 <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                   <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h3>
                   <div className="space-y-3 sm:space-y-4">
                     <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                       <p className="text-xs sm:text-sm text-gray-600">Customer ID</p>
                         <p className="text-sm sm:text-base font-semibold text-gray-800 break-all">{installment.customerId}</p>
                     </div>
                     <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                       <p className="text-xs sm:text-sm text-gray-600">Customer Name</p>
                         <p className="text-sm sm:text-base font-semibold text-gray-800">{installment.customerName}</p>
                     </div>
                     <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                       <p className="text-xs sm:text-sm text-gray-600">Email</p>
                         <p className="text-sm sm:text-base font-semibold text-gray-800 break-all">{installment.customerEmail}</p>
                     </div>
                     <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                       <p className="text-xs sm:text-sm text-gray-600">Phone</p>
                         <p className="text-sm sm:text-base font-semibold text-gray-800">{installment.customerPhone}</p>
                     </div>
                     <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                       <p className="text-xs sm:text-sm text-gray-600">Address</p>
                         <p className="text-sm sm:text-base font-semibold text-gray-800">{installment.customerAddress || 'Not provided'}</p>
                     </div>
                   </div>
                 </div>

                 {/* Product Information - Right */}
                 <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                   <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Information</h3>
                   <div className="space-y-3 sm:space-y-4">
                     <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                       <p className="text-xs sm:text-sm text-gray-600">Product Name</p>
                         <p className="text-sm sm:text-base font-semibold text-gray-800">{installment.productName}</p>
                     </div>
                     <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                       <p className="text-xs sm:text-sm text-gray-600">Total Amount</p>
                         <p className="text-sm sm:text-base font-semibold text-gray-800">Rs. {installment.totalAmount?.toLocaleString()}</p>
                     </div>
                     <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                       <p className="text-xs sm:text-sm text-gray-600">Advance Amount</p>
                         <p className="text-sm sm:text-base font-semibold text-gray-800">Rs. {installment.advanceAmount?.toLocaleString()}</p>
                     </div>
                     <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                       <p className="text-xs sm:text-sm text-gray-600">Monthly Installment</p>
                         <p className="text-sm sm:text-base font-semibold text-gray-800">Rs. {installment.monthlyInstallment?.toLocaleString()}</p>
                     </div>
                     <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                       <p className="text-xs sm:text-sm text-gray-600">Description</p>
                         <p className="text-sm sm:text-base font-semibold text-gray-800">{installment.productDescription || 'No description provided'}</p>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Installment Schedule */}
               <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
                 <h3 className="text-lg font-semibold text-gray-800 mb-4">Installment Schedule</h3>
                 <div className="overflow-x-auto custom-scrollbar">
                   <table className="w-full text-xs sm:text-sm">
                     <thead>
                       <tr className="border-b border-gray-200">
                         <th className="text-left py-2 px-1 sm:px-2 font-medium text-gray-700">#</th>
                         <th className="text-left py-2 px-1 sm:px-2 font-medium text-gray-700">Amount</th>
                         <th className="text-left py-2 px-1 sm:px-2 font-medium text-gray-700">Due Date</th>
                         <th className="text-left py-2 px-1 sm:px-2 font-medium text-gray-700">Status</th>
                         <th className="text-left py-2 px-1 sm:px-2 font-medium text-gray-700 hidden sm:table-cell">Paid Date</th>
                         <th className="text-left py-2 px-1 sm:px-2 font-medium text-gray-700 hidden sm:table-cell">Method</th>
                           <th className="text-left py-2 px-1 sm:px-2 font-medium text-gray-700">Actions</th>
                       </tr>
                     </thead>
                     <tbody>
                         {installment.installments?.map((inst: any, index: number) => (
                         <tr key={index} className="border-b border-gray-100">
                             <td className="py-2 px-1 sm:px-2 text-gray-600">{inst.installmentNumber}</td>
                             <td className="py-2 px-1 sm:px-2 text-gray-800">Rs. {inst.amount?.toLocaleString()}</td>
                             <td className="py-2 px-1 sm:px-2 text-gray-600 text-xs sm:text-sm">{new Date(inst.dueDate).toLocaleDateString()}</td>
                           <td className="py-2 px-1 sm:px-2">
                             <span className={`px-1 sm:px-2 py-1 rounded-full text-xs ${
                                 inst.status === 'paid' ? 'bg-green-100 text-green-800' :
                                 inst.status === 'overdue' ? 'bg-red-100 text-red-800' :
                               'bg-yellow-100 text-yellow-800'
                             }`}>
                                 {inst.status?.charAt(0).toUpperCase() + inst.status?.slice(1)}
                             </span>
                           </td>
                           <td className="py-2 px-1 sm:px-2 text-gray-600 text-xs sm:text-sm hidden sm:table-cell">
                               {inst.paidDate ? new Date(inst.paidDate).toLocaleDateString() : '-'}
                           </td>
                           <td className="py-2 px-1 sm:px-2 text-gray-600 text-xs sm:text-sm hidden sm:table-cell">
                               {inst.paymentMethod ? inst.paymentMethod.replace('_', ' ').toUpperCase() : '-'}
                             </td>
                             <td className="py-2 px-1 sm:px-2">
                               <div className="flex items-center gap-1 text-xs">
                                 {inst.status === 'paid' && (
                                   <button 
                                     onClick={() => {
                                       closeDetailsModal();
                                       openPaymentModal({...installment, ...inst}, true);
                                     }}
                                     className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                                     title="Edit Payment"
                                   >
                                     Edit
                                   </button>
                                 )}
                                 {inst.status !== 'paid' && (
                                   <button 
                                     onClick={() => {
                                       closeDetailsModal();
                                       openPaymentModal({...installment, ...inst}, false);
                                     }}
                                     className="text-green-600 hover:text-green-800 hover:underline transition-colors duration-200"
                                     title="Record Payment"
                                   >
                                     Pay
                                   </button>
                                 )}
                               </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>

             </div>
           </div>
        </div>
         );
       })()}

      {/* Add Installment Modal */}
      <AddInstallmentModal
        isOpen={showAddInstallmentModal}
        onClose={closeAddInstallmentModal}
        onSubmit={handleAddInstallment}
        editData={editInstallmentData}
        isEditMode={isEditMode}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={closePaymentModal}
        onSubmit={handlePayment}
        onMarkUnpaid={handleMarkUnpaid}
        installment={selectedPaymentInstallment}
        isLoading={isRecordingPayment}
        isEditMode={isEditMode}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={closeChangePasswordModal}
        onSubmit={handleChangePassword}
      />
       
    </div>
  );
};

export default ManagerDashboard;
