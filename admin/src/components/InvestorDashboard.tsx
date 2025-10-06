import React, { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';
import { useToast } from '@/contexts/ToastContext';

interface InvestorDashboardProps {
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

interface ProfitHistoryItem {
  month: string;
  profit: number;
  createdAt: string;
}

interface InvestorData {
  id: string;
  name: string;
  email: string;
  phone: string;
  investmentAmount: number;
  currentMonthProfit: number;
  previousMonthProfit: number;
  totalProfitEarned: number;
  profitPercentage: string;
  profitGrowth: string;
  profitHistory: ProfitHistoryItem[];
  joinedDate: string;
  lastLogin: string;
  previousLogin: string;
}

const InvestorDashboard: React.FC<InvestorDashboardProps> = ({ colors }) => {
  const [investorData, setInvestorData] = useState<InvestorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  useEffect(() => {
    fetchInvestorDashboard();
  }, []);

  const fetchInvestorDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getInvestorDashboard();
      
      if (response.success) {
        setInvestorData(response.data.investor);
      } else {
        setError(response.message || 'Failed to fetch dashboard data');
      }
    } catch (err: any) {
      console.error('Error fetching investor dashboard:', err);
      setError(err.message || 'Failed to fetch dashboard data');
      showError('Error', err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rs. ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-PK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'N/A';
    
    // Remove any spaces, dashes, or other characters
    let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Remove leading 0 if present
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    
    // Add +92 if not already present
    if (!cleanPhone.startsWith('+92')) {
      cleanPhone = '+92' + cleanPhone;
    }
    
    // Format as +92 XXX XXX XXXX
    // Handle different Pakistani number lengths
    if (cleanPhone.startsWith('+92')) {
      const numberPart = cleanPhone.slice(3); // Remove +92
      
      if (numberPart.length === 10) {
        // Standard Pakistani mobile: +92 XXX XXX XXXX
        return `+92 ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6)}`;
      } else if (numberPart.length === 11) {
        // Some numbers might have 11 digits: +92 XXXX XXX XXXX
        return `+92 ${numberPart.slice(0, 4)} ${numberPart.slice(4, 7)} ${numberPart.slice(7)}`;
      }
    }
    
    // For other cases, just return the clean phone
    return cleanPhone;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Cards Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="flex justify-between items-center">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !investorData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-4">{error || 'No investor data found'}</p>
          <button
            onClick={fetchInvestorDashboard}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Investor Dashboard</h1>
          <p className="text-gray-600">Welcome back, {investorData.name}</p>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Investment */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Investment</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(investorData.investmentAmount)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Current Month Profit */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month Profit</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(investorData.currentMonthProfit)}</p>
                <p className="text-xs text-gray-500">
                  {parseFloat(investorData.profitGrowth) > 0 ? '+' : ''}{investorData.profitGrowth}% from last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>

          {/* Previous Month Profit */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Month Profit</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(investorData.previousMonthProfit)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Profit Earned */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Profit Earned</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(investorData.totalProfitEarned)}</p>
                <p className="text-xs text-gray-500">{investorData.profitPercentage}% return</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Profit History Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Profit History Table */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Profit History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-gray-700">Month</th>
                    <th className="text-right py-2 font-medium text-gray-700">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {investorData.profitHistory.length > 0 ? (
                    investorData.profitHistory.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 text-gray-600">{formatMonth(item.month)}</td>
                        <td className="py-2 text-right font-medium text-green-600">{formatCurrency(item.profit)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-4 text-center text-gray-500">No profit history available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium text-gray-800">{investorData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium text-gray-800">{investorData.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium text-gray-800">{formatPhoneNumber(investorData.phone)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Joined:</span>
                <span className="font-medium text-gray-800">{formatDate(investorData.joinedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Login:</span>
                <span className="font-medium text-gray-800">
                  {investorData.lastLogin ? formatDateTime(investorData.lastLogin) : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{investorData.profitPercentage}%</div>
              <div className="text-sm text-gray-600">Total Return</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {investorData.profitHistory.length}
              </div>
              <div className="text-sm text-gray-600">Months Active</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {investorData.profitHistory.length > 0 
                  ? formatCurrency(investorData.totalProfitEarned / investorData.profitHistory.length)
                  : formatCurrency(0)
                }
              </div>
              <div className="text-sm text-gray-600">Average Monthly Profit</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard;
