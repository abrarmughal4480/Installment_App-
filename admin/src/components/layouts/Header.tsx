"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface HeaderProps {
  onAddManager: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenChangePassword: () => void;
}

export default function Header({ onAddManager, activeTab, onTabChange, onOpenChangePassword }: HeaderProps) {
  const router = useRouter();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);

  const colors = {
    background: '#F1F5F9',
    cardBackground: '#FFFFFF',
    primary: '#3B82F6',
    primaryLight: '#60A5FA',
    primaryDark: '#1E40AF',
    success: '#10B981',
    warning: '#F59E0B',
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

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'managers', label: 'Managers', icon: 'people' },
    { id: 'installments', label: 'Installments', icon: 'credit_card' }
  ];

  // Load user data
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileDropdown) {
        const target = event.target as Element;
        if (!target.closest('.profile-dropdown')) {
          setShowProfileDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileDropdown]);

  const handleLogout = () => {
    // Clear auth token and redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    router.push('/');
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleChangePassword = () => {
    setShowProfileDropdown(false);
    onOpenChangePassword();
  };

  return (
    <div 
      className="px-8 py-4 shadow-lg"
      style={{ 
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`,
        boxShadow: `0 4px 12px ${colors.shadow}`,
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px'
      }}
    >
      <div className="flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ 
              backgroundColor: colors.primary,
            }}
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 
            className="text-xl font-bold text-white"
            style={{ 
              letterSpacing: '-0.3px'
            }}
          >
            Apna Bussiness 12
          </h1>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center space-x-8">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="px-3 py-2 rounded-md text-sm transition-all duration-300 relative group"
              style={{
                color: 'white',
                fontWeight: activeTab === item.id ? 'bold' : 'medium'
              }}
            >
              {item.label}
              {/* Active underline */}
              {activeTab === item.id && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #FFFFFF 0%, #60A5FA 50%, #FFFFFF 100%)',
                    height: '2px',
                    borderRadius: '1px'
                  }}
                />
              )}
              {/* Hover underline */}
              {activeTab !== item.id && (
                <div 
                  className="absolute bottom-0 left-1/2 h-0.5 bg-white rounded-full transform -translate-x-1/2 transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:w-full w-0"
                  style={{
                    background: 'linear-gradient(90deg, #FFFFFF 0%, #60A5FA 50%, #FFFFFF 100%)',
                    height: '2px',
                    borderRadius: '1px'
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Search Bar and Profile */}
        <div className="flex items-center space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="px-4 py-2 pl-10 pr-4 rounded-lg text-sm text-white focus:outline-none focus:ring-2 transition-all duration-200"
              style={{ 
                width: '200px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#FFFFFF'
              }}
            />
            <svg 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              style={{ color: 'rgba(255, 255, 255, 0.6)' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Profile Icon with Dropdown */}
          <div className="relative profile-dropdown">
            <button 
              onClick={toggleProfileDropdown}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-white hover:bg-opacity-30"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              }}
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-4 w-64 bg-white rounded-lg shadow-lg border z-50">
                {/* User Info Header */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.name || 'Admin User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.email || 'admin@example.com'}
                      </p>
                      <p className="text-xs text-blue-600 font-medium">
                        {user?.type === 'admin' ? 'Administrator' : 'User'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dropdown Options */}
                <div className="py-1">
                  <button
                    onClick={handleChangePassword}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Change Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-3"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}