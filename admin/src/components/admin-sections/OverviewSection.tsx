"use client";

import { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';

interface OverviewSectionProps {
  colors: any;
  formatCurrency: (amount: number) => string;
}

interface DashboardStats {
  totalManagers: number;
  totalInstallments: number;
  totalProductsSold: number;
  pendingPayments: number;
  completedPayments: number;
  totalRevenue: number;
  recentActivities: Array<{
    action: string;
    user: string;
    time: string;
    amount: number;
    status: string;
  }>;
}

export default function OverviewSection({ colors, formatCurrency }: OverviewSectionProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalManagers: 0,
    totalInstallments: 0,
    totalProductsSold: 0,
    pendingPayments: 0,
    completedPayments: 0,
    totalRevenue: 0,
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const StatCard = ({ title, value, icon, color, trend }: any) => (
    <div 
      className="p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
      style={{ 
        backgroundColor: colors.cardBackground,
        boxShadow: `0 10px 25px -5px ${colors.shadow}, 0 4px 6px -1px ${colors.shadow}`
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p 
            className="text-sm font-semibold uppercase tracking-wide" 
            style={{ color: colors.lightText }}
          >
            {title}
          </p>
          <p 
            className="text-3xl font-bold mt-2" 
            style={{ 
              color: colors.text,
              letterSpacing: '-0.5px'
            }}
          >
            {value}
          </p>
          {trend && (
            <div className="flex items-center mt-2">
              <span 
                className="text-sm font-medium px-2 py-1 rounded-full"
                style={{ 
                  backgroundColor: trend > 0 ? `${colors.success}20` : `${colors.danger}20`,
                  color: trend > 0 ? colors.success : colors.danger
                }}
              >
                {trend > 0 ? '↗' : '↘'} {trend > 0 ? '+' : ''}{trend}%
              </span>
              <span 
                className="text-xs ml-2" 
                style={{ color: colors.lightText }}
              >
                from last month
              </span>
            </div>
          )}
        </div>
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ 
            background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
            boxShadow: `0 4px 12px ${color}30`
          }}
        >
          <span className="text-3xl">{icon}</span>
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getDashboardStats();
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('An error occurred while fetching data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const addSampleData = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.addSampleData();
      
      if (response.success) {
        // Refresh dashboard data after adding sample data
        await fetchDashboardStats();
      } else {
        setError(response.message || 'Failed to add sample data');
      }
    } catch (err) {
      setError('An error occurred while adding sample data');
      console.error('Add sample data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className="p-8 rounded-3xl shadow-xl animate-pulse"
              style={{ backgroundColor: colors.cardBackground }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
              </div>
            </div>
          ))}
        </div>
        <div 
          className="p-8 rounded-3xl shadow-xl animate-pulse"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-gray-100">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="p-8 rounded-3xl shadow-xl text-center"
        style={{ backgroundColor: colors.cardBackground }}
      >
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={fetchDashboardStats}
              className="px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: colors.primary }}
            >
              Try Again
            </button>
            <button
              onClick={addSampleData}
              className="px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: colors.success }}
            >
              Add Sample Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show sample data button if no data exists
  if (!isLoading && stats.totalInstallments === 0) {
    return (
      <div className="space-y-6">
        <div 
          className="p-8 rounded-3xl shadow-xl text-center"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>No Data Available</h3>
            <p className="text-gray-600 mb-4">The dashboard is empty. Add some sample data to get started.</p>
            <button
              onClick={addSampleData}
              className="px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: colors.primary }}
            >
              Add Sample Data
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Products Sold"
          value={stats.totalProductsSold}
          icon="📦"
          color={colors.primary}
          trend={12}
        />
        <StatCard
          title="Total Installments"
          value={stats.totalInstallments}
          icon="💳"
          color={colors.success}
          trend={8}
        />
        <StatCard
          title="Pending Payments"
          value={stats.pendingPayments}
          icon="⏳"
          color={colors.warning}
          trend={-5}
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon="💰"
          color={colors.success}
          trend={15}
        />
      </div>

      {/* Recent Activity */}
      <div 
        className="p-8 rounded-3xl shadow-xl"
        style={{ 
          backgroundColor: colors.cardBackground,
          boxShadow: `0 10px 25px -5px ${colors.shadow}, 0 4px 6px -1px ${colors.shadow}`
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 
            className="text-2xl font-bold" 
            style={{ 
              color: colors.text,
              letterSpacing: '-0.3px'
            }}
          >
            Recent Activity
          </h2>
          <div 
            className="w-12 h-1 rounded-full"
            style={{ 
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryLight} 100%)`
            }}
          />
        </div>
        <div className="space-y-4">
          {stats.recentActivities.length > 0 ? stats.recentActivities.map((activity, index) => {
            const getActivityIcon = (action: string, status: string) => {
              if (action.includes('Payment received') || status === 'paid') return '💰';
              if (action.includes('Installment created') || status === 'pending') return '💳';
              return '📝';
            };
            
            const getActivityColor = (action: string, status: string) => {
              if (action.includes('Payment received') || status === 'paid') return colors.success;
              if (action.includes('Installment created') || status === 'pending') return colors.primary;
              return colors.warning;
            };
            
            return (
            <div 
              key={index} 
              className="flex items-center justify-between p-4 rounded-2xl hover:shadow-md transition-all duration-200"
              style={{ 
                backgroundColor: colors.inputBackground,
                border: `1px solid ${colors.border}`
              }}
            >
              <div className="flex items-center space-x-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ 
                    backgroundColor: `${getActivityColor(activity.action, activity.status)}20`,
                    color: getActivityColor(activity.action, activity.status)
                  }}
                >
                  <span className="text-lg">{getActivityIcon(activity.action, activity.status)}</span>
                </div>
                <div>
                  <p 
                    className="font-semibold text-lg" 
                    style={{ color: colors.text }}
                  >
                    {activity.action}
                  </p>
                  <p 
                    className="text-sm font-medium" 
                    style={{ color: colors.lightText }}
                  >
                    by {activity.user} • {formatCurrency(activity.amount)}
                  </p>
                </div>
              </div>
              <span 
                className="text-sm font-medium px-3 py-1 rounded-full"
                style={{ 
                  backgroundColor: `${colors.primary}10`,
                  color: colors.primary
                }}
              >
                {activity.time}
              </span>
            </div>
            );
          }) : (
            <div className="text-center py-8">
              <p style={{ color: colors.lightText }}>No recent activities found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
