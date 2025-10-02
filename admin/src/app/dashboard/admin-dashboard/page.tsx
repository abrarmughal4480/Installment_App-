"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layouts/Header";
import OverviewSection from "@/components/admin-sections/OverviewSection";
import ManagersSection from "@/components/admin-sections/ManagersSection";
import InstallmentsSection from "@/components/admin-sections/InstallmentsSection";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { apiService } from "@/services/apiService";
import { useToast } from "@/contexts/ToastContext";

function AdminDashboardContent() {
  const [activeTab, setActiveTab] = useState("overview");
  const [managers, setManagers] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showSuccess, showError } = useToast();

  const colors = {
    background: '#F1F5F9',
    cardBackground: '#FFFFFF',
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#1E40AF',
    success: '#10B981',
    successLight: '#34D399',
    warning: '#F59E0B',
    warningLight: '#FBBF24',
    danger: '#EF4444',
    dangerLight: '#F87171',
    text: '#0F172A',
    lightText: '#64748B',
    inputBackground: '#F8FAFC',
    border: '#E2E8F0',
    focusBorder: '#3B82F6',
    shadow: 'rgba(15, 23, 42, 0.08)',
    gradientStart: '#3B82F6',
    gradientEnd: '#1E40AF',
    glass: 'rgba(255, 255, 255, 0.95)'
  };

  // Authentication check
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('authToken');
      const userData = localStorage.getItem('user');
      
      if (!token || !userData) {
        router.push('/');
        return;
      }

      try {
        const user = JSON.parse(userData);
        if (user.type !== 'admin') {
          router.push('/');
          return;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
        router.push('/');
        return;
      }
      
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  // Handle tab persistence on page refresh
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['overview', 'managers', 'installments'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Handle tab change with URL update
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({}, '', url.toString());
  };


  const handleAddManager = () => {
    // Handle add manager functionality
    console.log("Add manager clicked");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR'
    }).format(amount);
  };

  const openChangePasswordModal = () => {
    setShowChangePasswordModal(true);
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
  };

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

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <Header onAddManager={handleAddManager} activeTab={activeTab} onTabChange={handleTabChange} onOpenChangePassword={openChangePasswordModal} />

      {/* Main Content */}
      <div className="p-8">
        {activeTab === 'overview' && (
          <OverviewSection 
            colors={colors} 
            formatCurrency={formatCurrency} 
          />
        )}

        {activeTab === 'managers' && (
          <ManagersSection colors={colors} />
        )}

        {activeTab === 'installments' && (
          <InstallmentsSection 
            colors={colors} 
            formatCurrency={formatCurrency} 
          />
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={closeChangePasswordModal}
        onSubmit={handleChangePassword}
      />
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminDashboardContent />
    </Suspense>
  );
}
