'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddInstallmentModal from '@/components/AddInstallmentModal';
import PaymentModal from '@/components/PaymentModal';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import EditManagerModal from '@/components/EditManagerModal';
import AddManagerModal from '@/components/AddManagerModal';
import { apiService } from '@/services/apiService';
import { useToast } from '@/contexts/ToastContext';
import PDFGenerator from '@/components/PDFGenerator';

const ManagerDashboard = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
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
  const [activeSection, setActiveSection] = useState<'installments' | 'managers'>('installments');
  const [showEditDropdown, setShowEditDropdown] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [editType, setEditType] = useState<'name' | 'email' | 'password'>('name');
  const [managers, setManagers] = useState<any[]>([]);
  const [managersCount, setManagersCount] = useState(0);
  const [installmentsCount, setInstallmentsCount] = useState(0);
  const [userRole, setUserRole] = useState<string>('admin'); // Default to admin
  const [userName, setUserName] = useState<string>('User'); // Default user name
  const [isUserDataLoading, setIsUserDataLoading] = useState<boolean>(true); // Loading state for user data
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMarkUnpaidModal, setShowMarkUnpaidModal] = useState(false);
  const [installmentToDelete, setInstallmentToDelete] = useState<any>(null);
  const [installmentToMarkUnpaid, setInstallmentToMarkUnpaid] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [selectedPDFInstallment, setSelectedPDFInstallment] = useState<any>(null);
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  // Authentication check
  useEffect(() => {
    const checkAuthentication = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        // No token or user data, redirect to login
        router.push('/');
        return;
      }
      
      try {
        const user = JSON.parse(userData);
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data and redirect
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        router.push('/');
      }
    };

    checkAuthentication();
  }, [router]);

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

  // Section toggle functionality
  const handleSectionToggle = (section: 'installments' | 'managers') => {
    // Only allow managers section for admin users
    if (section === 'managers' && userRole !== 'admin') {
      return;
    }
    setActiveSection(section);
  };

  // Edit dropdown functionality
  const toggleEditDropdown = (managerId: string) => {
    setShowEditDropdown(showEditDropdown === managerId ? null : managerId);
  };

  // Table drag scroll functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const target = e.currentTarget as HTMLElement;
    setStartX(e.pageX - target.offsetLeft);
    setScrollLeft(target.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const x = e.pageX - target.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    target.scrollLeft = scrollLeft - walk;
  };

  // Edit modal functionality
  const openEditModal = (manager: any, type: 'name' | 'email' | 'password') => {
    setSelectedManager(manager);
    setEditType(type);
    setShowEditModal(true);
    setShowEditDropdown(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedManager(null);
  };

  const handleEditManager = async (data: any) => {
    if (!selectedManager) return;

    try {
      console.log('Editing manager:', selectedManager.id, 'Type:', editType, 'Data:', data);
      
      // Prepare the request body
      const requestBody = {
        ...data,
        editType: editType
      };

      // Make API call to update manager
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      const response = await fetch(`${apiUrl}/api/dashboard/managers/${selectedManager.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update manager');
      }

      if (result.success) {
        showSuccess('Manager Updated!', result.message);
        
        // Refresh managers list
        await fetchManagers();
        
        closeEditModal();
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (err: any) {
      console.error('Error updating manager:', err);
      showError('Update Failed', err.message || 'Failed to update manager');
    }
  };

  // Add Manager modal functionality
  const openAddManagerModal = () => {
    setShowAddManagerModal(true);
  };

  const closeAddManagerModal = () => {
    setShowAddManagerModal(false);
  };

  const handleAddManager = async (data: any) => {
    try {
      const response = await apiService.addManager(data);
      
      if (response.success) {
        showSuccess('Manager Added!', response.message || 'Manager has been added successfully');
        closeAddManagerModal();
        
        // Refresh the managers list from backend
        await fetchManagers();
      } else {
        showError('Add Failed', response.message || 'Failed to add manager');
      }
    } catch (err: any) {
      console.error('Error adding manager:', err);
      showError('Add Failed', err.message || 'Failed to add manager');
    }
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
  const openLogoutModal = () => {
    setShowLogoutModal(true);
  };

  const closeLogoutModal = () => {
    setShowLogoutModal(false);
  };

  // Prevent scrolling when logout modal is open
  useEffect(() => {
    if (showLogoutModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showLogoutModal]);

  // PDF Generator functionality
  const openPDFModal = (installment: any) => {
    setSelectedPDFInstallment(installment);
    setShowPDFModal(true);
  };

  const closePDFModal = () => {
    setShowPDFModal(false);
    setSelectedPDFInstallment(null);
  };

  const confirmLogout = async () => {
    try {
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      // Show success message
      showSuccess('Logged Out!', 'You have been logged out successfully');
      
      // Close modal
      closeLogoutModal();
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (error) {
      console.error('Logout error:', error);
      showError('Logout Failed', 'Error logging out');
    }
  };

  const openDetailsModal = (installmentId: string) => {
    setSelectedInstallment(installmentId);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedInstallment(null);
    setSuccessMessage(''); // Clear success message when modal is closed
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
      
      // Use recordId from the installment data
      const installmentId = selectedPaymentInstallment.recordId || selectedPaymentInstallment.id;
      
      console.log('Processing payment:', { installmentId, paymentData, isEditMode });
      
      const response = isEditMode 
        ? await apiService.updatePayment(installmentId, paymentData)
        : await apiService.payInstallment(installmentId, paymentData);
      
      if (response.success) {
        // Create a more user-friendly success message
        showSuccess(isEditMode ? 'Payment Updated!' : 'Payment Recorded!', `Rs. ${response.installment?.actualPaidAmount?.toLocaleString() || paymentData.customAmount?.toLocaleString()} recorded`);
        closePaymentModal();
        
        // Refresh the installments list silently
        await refreshInstallments();
      } else {
        showError(isEditMode ? 'Update Failed' : 'Payment Failed', response.message || 'Operation failed');
      }
    } catch (err: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'recording'} payment:`, err);
      showError(isEditMode ? 'Update Failed' : 'Payment Failed', err.message || 'Operation failed');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const openMarkUnpaidModal = (installment: any) => {
    setInstallmentToMarkUnpaid(installment);
    setShowMarkUnpaidModal(true);
  };

  const closeMarkUnpaidModal = () => {
    setShowMarkUnpaidModal(false);
    setInstallmentToMarkUnpaid(null);
  };

  const confirmMarkUnpaid = async () => {
    if (!installmentToMarkUnpaid) return;
    
    try {
      setIsRecordingPayment(true);
      
      // Use recordId from the installment data
      const installmentId = installmentToMarkUnpaid.recordId || installmentToMarkUnpaid.id;
      const installmentNumber = installmentToMarkUnpaid.installmentNumber;
      
      console.log('Marking unpaid:', { installmentId, installmentNumber });
      
      const response = await apiService.markInstallmentUnpaid(
        installmentId,
        installmentNumber
      );
      
      if (response.success) {
        showSuccess('Marked Unpaid!', `Installment #${installmentNumber} marked as unpaid`);
        setSuccessMessage(`Installment #${installmentNumber} has been marked as unpaid successfully!`);
        closeMarkUnpaidModal();
        
        // Refresh the installments list silently
        await refreshInstallments();
      } else {
        showError('Mark Unpaid Failed', response.message || 'Failed to mark installment as unpaid');
      }
    } catch (err: any) {
      console.error('Error marking installment as unpaid:', err);
      showError('Mark Unpaid Failed', err.message || 'Failed to mark installment as unpaid');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  // Fetch only managers count
  const fetchManagersCount = async () => {
    try {
      const response = await apiService.getManagers();
      if (response.success) {
        setManagersCount(response.managers?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching managers count:', err);
    }
  };

  // Fetch managers from API
  const fetchManagers = async () => {
    try {
      console.log('Fetching managers from backend...');
      const response = await apiService.getManagers();
      console.log('Managers response:', response);
      
      if (response.success) {
        // Transform the data to match the expected format
        const transformedManagers = (response.managers || []).map((manager: any) => ({
          id: manager._id || manager.id,
          name: manager.name,
          email: manager.email,
          phone: manager.phone || '+92 300 XXXXXXX',
          status: manager.isActive ? 'active' : 'inactive',
          createdDate: manager.createdAt || manager.createdDate,
          lastLogin: manager.lastLogin
        }));
        console.log('Transformed managers:', transformedManagers);
        setManagers(transformedManagers);
        setManagersCount(transformedManagers.length);
      } else {
        console.error('Failed to fetch managers:', response.message);
        showError('Failed to Load Managers', response.message || 'Unable to fetch managers data');
      }
    } catch (err) {
      console.error('Error fetching managers:', err);
      showError('Failed to Load Managers', 'Please check your connection and try again');
    }
  };

  // Fetch only installments count
  const fetchInstallmentsCount = async () => {
    try {
      const result = await apiService.getAllInstallments();
      if (result.success) {
        setInstallmentsCount(result.installments?.length || 0);
      }
    } catch (err) {
      console.error('Error fetching installments count:', err);
    }
  };

  // Fetch installments from API (with loading state)
  const fetchInstallments = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      // Use apiService for consistent token handling
      const result = await apiService.getAllInstallments();

      if (result.success) {
        // Sort installments by creation date (latest first)
        const sortedInstallments = (result.installments || []).sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        });
        setInstallments(sortedInstallments);
        setInstallmentsCount(sortedInstallments.length);
        console.log('Fetched installments:', sortedInstallments.length);
      } else {
        showError('Failed to Load Installments', result.message || 'Unable to fetch installments data');
      }
    } catch (err: any) {
      console.error('Error fetching installments:', err);
      showError('Failed to Load Installments', err.message || 'Please check your connection and try again');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Silent refresh installments (no loading state)
  const refreshInstallments = async () => {
    await fetchInstallments(false);
  };

  // Detect user role and name from localStorage
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserRole(user.type || 'admin');
        setUserName(user.name || user.email || 'User'); // Use name, fallback to email, then 'User'
      } catch (error) {
        console.error('Error parsing user data:', error);
        setUserRole('admin'); // Default to admin
        setUserName('User'); // Default user name
      }
    }
    // Set loading to false after user data is processed
    setIsUserDataLoading(false);
  }, []);

  // Load data based on active tab on component mount
  useEffect(() => {
    if (activeSection === 'installments') {
      fetchInstallments();
      // Only fetch managers count if user is admin
      if (userRole === 'admin') {
        fetchManagersCount();
      }
    } else if (activeSection === 'managers' && userRole === 'admin') {
      fetchManagers();
      fetchInstallmentsCount(); // Only fetch installments count
    }
  }, [userRole]);

  // Load data when tab changes
  useEffect(() => {
    if (activeSection === 'installments') {
      fetchInstallments();
    } else if (activeSection === 'managers' && userRole === 'admin') {
      fetchManagers();
    }
  }, [activeSection, userRole]);

  // Force manager users to stay on installments section
  useEffect(() => {
    if (userRole === 'manager' && activeSection === 'managers') {
      setActiveSection('installments');
    }
  }, [userRole, activeSection]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActionsDropdown) {
        const target = event.target as Element;
        if (!target.closest('.actions-dropdown')) {
          setShowActionsDropdown(false);
        }
      }
      if (showEditDropdown) {
        const target = event.target as Element;
        // Check if click is on dropdown button or dropdown content
        if (!target.closest('[data-manager-button]') && !target.closest('.edit-dropdown-portal')) {
          setShowEditDropdown(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsDropdown, showEditDropdown]);

  // Disable background scrolling when modals are open
  useEffect(() => {
    const isModalOpen = showDetailsModal || showAddInstallmentModal || showPaymentModal || 
                       showChangePasswordModal || showEditModal || showAddManagerModal ||
                       showDeleteModal || showMarkUnpaidModal || showPDFModal;
    
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showDetailsModal, showAddInstallmentModal, showPaymentModal, showChangePasswordModal, showEditModal, showAddManagerModal, showDeleteModal, showMarkUnpaidModal, showPDFModal]);

  const handleAddInstallment = async (data: any) => {
    try {
      const response = await apiService.createInstallment(data);
      
      if (response.success) {
        showSuccess(
          isEditMode ? 'Installment Updated!' : 'Installment Created!',
          `${data.name} plan ${isEditMode ? 'updated' : 'created'}`
        );
        // Refresh the installments list silently
        await refreshInstallments();
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
  const openDeleteModal = (installment: any) => {
    setInstallmentToDelete(installment);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setInstallmentToDelete(null);
  };

  const confirmDeleteInstallment = async () => {
    if (!installmentToDelete) return;
    
    try {
      // Use recordId if available, otherwise use id
      const installmentId = installmentToDelete.recordId || installmentToDelete.id;
      
      // Debug: Log the ID being sent
      console.log('Delete installment ID:', installmentId);
      console.log('Installment data:', installmentToDelete);
      
      const response = await apiService.deleteInstallment(installmentId);
      
      if (response.success) {
        showSuccess('Deleted!', `${installmentToDelete.customerName} plan deleted`);
        // Refresh the installments list silently
        await refreshInstallments();
        closeDeleteModal();
      } else {
        showError('Delete Failed', response.message || 'Operation failed');
      }
    } catch (err: any) {
      console.error('Error deleting installment:', err);
      showError('Delete Failed', err.message || 'Operation failed');
    }
  };


  // Show loading screen while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render anything (redirect will happen)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <div className="flex-1 flex justify-center">
            {isUserDataLoading ? (
              <div className="animate-pulse">
                <div className="h-9 bg-gray-300 rounded-lg w-64"></div>
              </div>
            ) : (
              <h1 className="text-3xl font-bold text-gray-800">
                {userRole === 'admin' ? 'Admin Dashboard' : 'Manager Dashboard'}
              </h1>
            )}
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
              onClick={openLogoutModal}
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
               {isUserDataLoading ? (
                 <div className="animate-pulse">
                   <div className="h-6 bg-gray-300 rounded w-32"></div>
                 </div>
               ) : (
                 <h2 className="text-xl font-bold text-gray-800">{userName}</h2>
               )}
               
               <div className="space-y-2">
                 {isUserDataLoading ? (
                   <>
                     <div className="animate-pulse">
                       <div className="h-4 bg-gray-300 rounded w-48 mb-2"></div>
                     </div>
                     <div className="animate-pulse">
                       <div className="h-4 bg-gray-300 rounded w-44"></div>
                     </div>
                   </>
                 ) : (
                   <>
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
                   </>
                 )}
               </div>
             </div>
           </div>

           {/* Right Side - Empty space for now */}
           <div className="flex-1"></div>
         </div>

         {/* Full Width Installments Table */}
         <div className="mt-8 mx-4">
           <div className="flex justify-end items-center mb-4">
             {/* Only show Add button for admin users */}
             {userRole === 'admin' && (
               <button 
                 onClick={activeSection === 'installments' ? openAddInstallmentModal : openAddManagerModal}
                 className="px-4 py-2 text-white font-medium rounded-full transition-colors duration-200 flex items-center gap-2 hover:bg-green-400" 
                 style={{ backgroundColor: '#10B981' }}
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                 </svg>
                 {activeSection === 'installments' ? 'Add Installment' : 'Add Manager'}
               </button>
             )}
           </div>
           
           <div 
             className="overflow-x-auto bg-white rounded-lg shadow-sm border custom-scrollbar" 
             style={{ 
               overflowY: 'visible', 
               cursor: isDragging ? 'grabbing' : 'default',
               userSelect: 'none'
             }}
             onMouseDown={handleMouseDown}
             onMouseLeave={handleMouseLeave}
             onMouseUp={handleMouseUp}
             onMouseMove={handleMouseMove}
           >
             <table className="w-full text-sm">
               <thead>
                 <tr className="border-b bg-gray-50">
                   <th colSpan={11} className="text-left py-4 px-4 font-semibold text-gray-800 text-lg">
                     <div className="flex items-center gap-6">
                       <span
                         onClick={() => handleSectionToggle('installments')}
                         className={`cursor-pointer transition-colors duration-200 ${
                           activeSection === 'installments' 
                             ? 'text-blue-600 font-bold' 
                             : 'text-gray-600 hover:text-blue-600'
                         }`}
                       >
                         Installments ({installmentsCount})
                       </span>
                       {userRole === 'admin' && (
                         <>
                           <span className="text-gray-400 mx-4">|</span>
                           <span
                             onClick={() => handleSectionToggle('managers')}
                             className={`cursor-pointer transition-colors duration-200 ${
                               activeSection === 'managers' 
                                 ? 'text-blue-600 font-bold' 
                                 : 'text-gray-600 hover:text-blue-600'
                             }`}
                           >
                             Managers ({managersCount})
                           </span>
                         </>
                       )}
                     </div>
                   </th>
                 </tr>
                 <tr className="border-b">
                   {activeSection === 'installments' ? (
                     <>
                       <th className="text-left py-3 px-4 font-medium text-gray-700">Customer ID</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700">Customer Name</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700">Manager</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700">Total Amount</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700">Installment #</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700">Payment Method</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                     </>
                   ) : (
                     <>
                       <th className="text-left py-3 px-4 font-medium text-gray-700 w-1/6">Name</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700 w-1/6">Email</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700 w-1/6">Phone</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700 w-1/6">Created Date</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700 w-1/6">Last Login</th>
                       <th className="text-left py-3 px-4 font-medium text-gray-700 w-1/6">Actions</th>
                     </>
                   )}
                 </tr>
               </thead>
               <tbody>
                 {activeSection === 'installments' ? (
                   loading ? (
                     <tr>
                       <td colSpan={11} className="text-center py-12">
                         <div className="flex items-center justify-center gap-3">
                           <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                           </svg>
                           <span className="text-gray-600">Loading installments...</span>
                         </div>
                       </td>
                     </tr>
                   ) : installments.length === 0 ? (
                     <tr>
                       <td colSpan={11} className="text-center py-12">
                         <div className="text-gray-500">
                           <p className="text-lg font-medium text-gray-900 mb-2">No installment is created yet</p>
                           <h4 className="text-sm font-medium text-gray-600">Installment Management</h4>
                         </div>
                       </td>
                     </tr>
                   ) : (
                   installments.map((installment: any, index: number) => (
                     <tr key={installment.id || index} className="border-b">
                       <td className="py-3 px-4 text-gray-600">{installment.customerId}</td>
                       <td className="py-3 px-4 text-gray-800">{installment.customerName}</td>
                       <td className="py-3 px-4 text-gray-800">{installment.productName}</td>
                       <td className="py-3 px-4 text-gray-600">{installment.managerName || '-'}</td>
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
                             onClick={() => openDetailsModal(installment.id)}
                       className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                     >
                       View Details
                     </button>
                           {installment.status !== 'completed' && userRole === 'admin' && (
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
                           {/* Only show Edit and Delete buttons for admin users */}
                           {userRole === 'admin' && (
                             <>
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
                                 onClick={() => openDeleteModal(installment)}
                                 className="text-red-600 hover:text-red-800 hover:underline transition-colors duration-200"
                                 title="Delete Installment"
                               >
                                 Delete
                               </button>
                             </>
                           )}
                           <span className="text-gray-400">|</span>
                           <button 
                             onClick={() => openPDFModal(installment)}
                             className="text-purple-600 hover:text-purple-800 hover:underline transition-colors duration-200"
                             title="Generate PDF for Customer"
                           >
                             PDF
                           </button>
                         </div>
                   </td>
                 </tr>
                   ))
                   )
                 ) : (
                   loading ? (
                     <tr>
                       <td colSpan={6} className="text-center py-12">
                         <div className="flex items-center justify-center gap-3">
                           <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                           </svg>
                           <span className="text-gray-600">Loading managers...</span>
                         </div>
                       </td>
                     </tr>
                   ) : managers.length === 0 ? (
                     <tr>
                       <td colSpan={6} className="text-center py-12">
                         <div className="text-gray-500">
                           <p className="text-lg font-medium text-gray-900 mb-2">No manager is created yet</p>
                           <h4 className="text-sm font-medium text-gray-600">Manager Management</h4>
                         </div>
                       </td>
                     </tr>
                   ) : (
                     managers.map((manager: any, index: number) => (
                       <tr key={manager.id || index} className="border-b">
                         <td className="py-3 px-4 text-gray-800 w-1/6">{manager.name}</td>
                         <td className="py-3 px-4 text-gray-800 w-1/6">{manager.email}</td>
                         <td className="py-3 px-4 text-gray-600 w-1/6">{manager.phone}</td>
                         <td className="py-3 px-4 text-gray-600 w-1/6">
                           {manager.createdDate ? new Date(manager.createdDate).toLocaleDateString() : '-'}
                         </td>
                         <td className="py-3 px-4 text-gray-600 w-1/6">
                           {manager.lastLogin ? new Date(manager.lastLogin).toLocaleString('en-PK', {
                             day: 'numeric',
                             month: 'short',
                             year: 'numeric',
                             hour: '2-digit',
                             minute: '2-digit',
                             hour12: true
                           }) : '-'}
                         </td>
                         <td className="py-3 px-4 w-1/6">
                           <div className="flex items-center gap-2">
                             <div className="relative edit-dropdown">
                               <button 
                                 onClick={() => {
                                   console.log('Edit button clicked for manager:', manager.id);
                                   console.log('Current showEditDropdown:', showEditDropdown);
                                   const newValue = showEditDropdown === manager.id.toString() ? null : manager.id.toString();
                                   console.log('Setting showEditDropdown to:', newValue);
                                   setShowEditDropdown(newValue);
                                 }}
                                 data-manager-button={manager.id}
                                 className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1"
                                 style={{ 
                                   backgroundColor: '#3B82F620', 
                                   color: '#3B82F6' 
                                 }}
                               >
                                 Edit
                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                 </svg>
                               </button>

                             </div>
                             <button 
                               onClick={() => console.log('Delete Manager clicked')}
                               className="px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium hover:opacity-80 transition-opacity"
                               style={{ 
                                 backgroundColor: '#EF444420', 
                                 color: '#EF4444' 
                               }}
                             >
                               Delete
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))
                   )
                 )}
               </tbody>
             </table>
           </div>
         </div>
       </main>

       {/* Installment Details Modal */}
       {showDetailsModal && selectedInstallment && (() => {
         const installment = installments.find(inst => inst.id === selectedInstallment);
         if (!installment) return null;
         
         console.log('Selected installment data:', installment);
         console.log('Advance amount:', installment.advanceAmount);
         
         return (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all duration-300 scale-100 translate-y-0 overflow-hidden">
             {/* Header - Fixed */}
             <div className="relative overflow-hidden rounded-t-2xl bg-blue-50 flex-shrink-0">
               <div className="relative p-4">
                 <div className="flex justify-between items-center">
                   <div className="flex-1 text-center">
                     <h2 className="text-xl font-bold text-gray-800">Installment Details</h2>
                   </div>
                   <button 
                     onClick={closeDetailsModal}
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
              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-green-600 text-sm">{successMessage}</p>
                    <button 
                      onClick={() => setSuccessMessage('')}
                      className="ml-auto text-green-600 hover:text-green-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
              <div className="space-y-6">
                 {/* Customer & Product Info Side by Side */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {/* Customer Info */}
                   <div>
                     <h3 className="text-lg font-semibold text-gray-800 mb-3">Customer Information</h3>
                     <div className="space-y-3">
                       <div>
                         <p className="text-sm text-gray-600">Customer ID</p>
                         <p className="text-base font-medium text-gray-800">{installment.customerId}</p>
                       </div>
                       <div>
                         <p className="text-sm text-gray-600">Customer Name</p>
                         <p className="text-base font-medium text-gray-800">{installment.customerName}</p>
                       </div>
                       <div>
                         <p className="text-sm text-gray-600">Email</p>
                         <p className="text-base font-medium text-gray-800">{installment.customerEmail}</p>
                       </div>
                       <div>
                         <p className="text-sm text-gray-600">Phone</p>
                         <p className="text-base font-medium text-gray-800">{installment.customerPhone}</p>
                       </div>
                     </div>
                   </div>

                   {/* Product Info */}
                   <div>
                     <h3 className="text-lg font-semibold text-gray-800 mb-3">Product Information</h3>
                     <div className="space-y-3">
                       <div>
                         <p className="text-sm text-gray-600">Product Name</p>
                         <p className="text-base font-medium text-gray-800">{installment.productName}</p>
                       </div>
                       <div>
                         <p className="text-sm text-gray-600">Total Amount</p>
                         <p className="text-base font-medium text-gray-800">Rs. {installment.totalAmount?.toLocaleString()}</p>
                       </div>
                       <div>
                         <p className="text-sm text-gray-600">Payment Details</p>
                         <div className="grid grid-cols-3 items-center">
                           <div className="text-center">
                             <p className="text-base font-medium text-gray-800">Rs. {installment.amount?.toLocaleString() || '0'}</p>
                             <p className="text-xs text-gray-600">Monthly</p>
                           </div>
                           <div className="text-center">
                             <span className="text-gray-400">|</span>
                           </div>
                           <div className="text-center">
                             <p className="text-base font-medium text-gray-800">Rs. {installment.advanceAmount?.toLocaleString() || installment.advanceAmount || '0'}</p>
                             <p className="text-xs text-gray-600">Advance</p>
                           </div>
                         </div>
                       </div>
                       <div>
                         <p className="text-sm text-gray-600">Payment Status</p>
                         <div className="grid grid-cols-3 items-center">
                           <div className="text-center">
                             <p className="text-base font-medium text-green-600">Rs. {(() => {
                               const paidAmount = installment.actualPaidAmount || 0;
                               return paidAmount.toLocaleString();
                             })()}</p>
                             <p className="text-xs text-green-600">Paid</p>
                           </div>
                           <div className="text-center">
                             <span className="text-gray-400">|</span>
                           </div>
                           <div className="text-center">
                             <p className="text-base font-medium text-red-600">Rs. {(() => {
                               const totalAmount = installment.totalAmount || 0;
                               const advanceAmount = installment.advanceAmount || 0;
                               const paidAmount = installment.actualPaidAmount || 0;
                               const remaining = totalAmount - advanceAmount - paidAmount;
                               return remaining.toLocaleString();
                             })()}</p>
                             <p className="text-xs text-red-600">Remaining</p>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>

                 {/* Installment Schedule Table */}
                 <div>
                   <h3 className="text-lg font-semibold text-gray-800 mb-3">Installment Schedule</h3>
                   <div className="overflow-x-auto">
                     <table className="w-full text-sm">
                       <thead>
                         <tr className="border-b border-gray-200">
                           <th className="text-left py-2 px-2 font-medium text-gray-700">#</th>
                           <th className="text-left py-2 px-2 font-medium text-gray-700">Amount</th>
                           <th className="text-left py-2 px-2 font-medium text-gray-700">Due Date</th>
                           <th className="text-left py-2 px-2 font-medium text-gray-700">Status</th>
                           <th className="text-left py-2 px-2 font-medium text-gray-700">Paid Date</th>
                           <th className="text-left py-2 px-2 font-medium text-gray-700">Method</th>
                           {userRole === 'admin' && (
                             <th className="text-left py-2 px-2 font-medium text-gray-700">Actions</th>
                           )}
                         </tr>
                       </thead>
                       <tbody>
                         {(() => {
                           // Backend sends individual installment, not full schedule
                           // Show only current installment for now
                           const currentInstallment = {
                             installmentNumber: installment.installmentNumber,
                             amount: installment.amount,
                             dueDate: installment.dueDate,
                             status: installment.status,
                             paidDate: installment.paidDate,
                             paymentMethod: installment.paymentMethod,
                             actualPaidAmount: installment.actualPaidAmount,
                             notes: installment.notes
                           };
                           
                           return [currentInstallment].map((inst: any, index: number) => (
                             <tr key={index} className="border-b border-gray-100">
                               <td className="py-2 px-2 text-gray-600">{inst.installmentNumber}</td>
                               <td className="py-2 px-2 text-gray-800">Rs. {inst.amount?.toLocaleString()}</td>
                               <td className="py-2 px-2 text-gray-600">{new Date(inst.dueDate).toLocaleDateString()}</td>
                               <td className="py-2 px-2">
                                 <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                   inst.status === 'paid' ? 'bg-green-100 text-green-800' :
                                   inst.status === 'overdue' ? 'bg-red-100 text-red-800' :
                                   inst.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                   inst.status === 'completed' ? 'bg-green-100 text-green-800' :
                                   'bg-gray-100 text-gray-800'
                                 }`}>
                                   {inst.status ? inst.status.charAt(0).toUpperCase() + inst.status.slice(1) : 'Pending'}
                                 </span>
                               </td>
                               <td className="py-2 px-2 text-gray-600">
                                 {inst.paidDate ? new Date(inst.paidDate).toLocaleDateString() : '-'}
                               </td>
                               <td className="py-2 px-2 text-gray-600">
                                 {inst.paymentMethod ? inst.paymentMethod.charAt(0).toUpperCase() + inst.paymentMethod.slice(1) : '-'}
                               </td>
                               {userRole === 'admin' && (
                                 <td className="py-2 px-2">
                                   <div className="flex items-center gap-1 text-xs">
                                     {(inst.status === 'paid' || inst.status === 'completed') && (
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
                                     {inst.status !== 'paid' && inst.status !== 'completed' && (
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
                               )}
                             </tr>
                           ));
                         })()}
                       </tbody>
                     </table>
                   </div>
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
        onMarkUnpaid={() => {
          closePaymentModal();
          openMarkUnpaidModal(selectedPaymentInstallment);
        }}
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

      {/* Edit Manager Modal */}
      <EditManagerModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        onSubmit={handleEditManager}
        manager={selectedManager}
        editType={editType}
        colors={{
          primary: '#3B82F6',
          success: '#10B981',
          danger: '#EF4444',
          text: '#0F172A',
          lightText: '#64748B',
          cardBackground: '#FFFFFF',
          border: '#E2E8F0'
        }}
      />

      {/* Add Manager Modal */}
      <AddManagerModal
        isOpen={showAddManagerModal}
        onClose={closeAddManagerModal}
        onSubmit={handleAddManager}
        colors={{
          primary: '#3B82F6',
          success: '#10B981',
          danger: '#EF4444',
          text: '#0F172A',
          lightText: '#64748B',
          cardBackground: '#FFFFFF',
          border: '#E2E8F0'
        }}
      />

      {/* Portal Dropdown - Outside Table */}
      {(() => {
        console.log('Checking dropdown condition:', showEditDropdown);
        return showEditDropdown;
      })() && (
        <div 
          className="fixed w-40 sm:w-48 rounded-lg shadow-xl border-2 bg-white edit-dropdown-portal"
          style={{ 
            zIndex: 999999,
            backgroundColor: '#ffffff',
            background: '#ffffff',
            opacity: 1,
            top: `${(() => {
              try {
                const button = document.querySelector(`[data-manager-button="${showEditDropdown}"]`);
                if (button) {
                  const rect = button.getBoundingClientRect();
                  return rect.bottom + 8;
                }
                return 100;
              } catch (e) {
                return 100;
              }
            })()}px`,
            left: `${(() => {
              try {
                const button = document.querySelector(`[data-manager-button="${showEditDropdown}"]`);
                if (button) {
                  const rect = button.getBoundingClientRect();
                  return rect.right - 160;
                }
                return 100;
              } catch (e) {
                return 100;
              }
            })()}px`
          }}
        >
          <div className="py-1">
            <button
              onClick={() => {
                console.log('Edit Info clicked', showEditDropdown);
                const manager = managers.find(m => m.id.toString() === showEditDropdown);
                console.log('Found manager:', manager);
                if (manager) {
                  openEditModal(manager, 'name');
                  setShowEditDropdown(null);
                }
              }}
              className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Edit Info
            </button>
            <button
              onClick={() => {
                const manager = managers.find(m => m.id.toString() === showEditDropdown);
                if (manager) {
                  openEditModal(manager, 'email');
                  setShowEditDropdown(null);
                }
              }}
              className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Edit Email
            </button>
            <button
              onClick={() => {
                const manager = managers.find(m => m.id.toString() === showEditDropdown);
                if (manager) {
                  openEditModal(manager, 'password');
                  setShowEditDropdown(null);
                }
              }}
              className="w-full text-left px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Reset Password
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && installmentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 translate-y-0">
            {/* Header */}
            <div className="relative overflow-hidden rounded-t-2xl bg-red-50 flex-shrink-0">
              <div className="relative p-6">
                <div className="flex justify-between items-center">
                  <div className="flex-1 text-center">
                    <h2 className="text-xl font-bold text-gray-800">Delete Installment</h2>
                  </div>
                  <button 
                    onClick={closeDeleteModal}
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
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Are you sure?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  You are about to delete the installment plan for <strong>{installmentToDelete.customerName}</strong>. 
                  This action cannot be undone.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 ml-4">
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteInstallment}
                  className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-full font-medium transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Unpaid Confirmation Modal */}
      
      {showMarkUnpaidModal && installmentToMarkUnpaid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 translate-y-0">
            {/* Header */}
            <div className="relative overflow-hidden rounded-t-2xl bg-yellow-50 flex-shrink-0">
              <div className="relative p-6">
                <div className="flex justify-between items-center">
                  <div className="flex-1 text-center">
                    <h2 className="text-xl font-bold text-gray-800">Mark as Unpaid</h2>
                  </div>
                  <button 
                    onClick={closeMarkUnpaidModal}
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
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Mark as Unpaid?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  You are about to mark installment #{installmentToMarkUnpaid.installmentNumber} as unpaid for <strong>{installmentToMarkUnpaid.customerName}</strong>. 
                  This will reverse the payment status.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 ml-4">
                <button
                  onClick={() => {
                    closeMarkUnpaidModal();
                    openPaymentModal(installmentToMarkUnpaid, true);
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmMarkUnpaid}
                  disabled={isRecordingPayment}
                  className="flex-1 px-4 py-2 text-white bg-yellow-600 hover:bg-yellow-700 rounded-full font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRecordingPayment ? 'Processing...' : 'Mark as Unpaid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
       
        {/* Logout Confirmation Modal */}
        {showLogoutModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Confirm Logout</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Are you sure you want to logout? You will need to login again to access the dashboard.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 ml-4">
                <button
                  onClick={closeLogoutModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
        {/* PDF Generator Modal */}
        <PDFGenerator
          installment={selectedPDFInstallment}
          isOpen={showPDFModal}
          onClose={closePDFModal}
        />
      </div>
    );
  };

export default ManagerDashboard;
