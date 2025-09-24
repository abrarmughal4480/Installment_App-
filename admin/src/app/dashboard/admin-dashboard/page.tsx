"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layouts/Header";
import OverviewSection from "@/components/admin-sections/OverviewSection";
import ManagersSection from "@/components/admin-sections/ManagersSection";
import InstallmentsSection from "@/components/admin-sections/InstallmentsSection";
import ReportsSection from "@/components/admin-sections/ReportsSection";
import SettingsSection from "@/components/admin-sections/SettingsSection";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [managers, setManagers] = useState([]);
  const [installments, setInstallments] = useState([]);
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // Handle tab persistence on page refresh
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && ['overview', 'managers', 'installments', 'reports', 'settings'].includes(tabFromUrl)) {
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



  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <Header onAddManager={handleAddManager} activeTab={activeTab} onTabChange={handleTabChange} />

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

        {activeTab === 'reports' && (
          <ReportsSection colors={colors} />
        )}

        {activeTab === 'settings' && (
          <SettingsSection colors={colors} />
        )}
      </div>
    </div>
  );
}
