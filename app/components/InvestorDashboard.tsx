import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';

interface InvestorDashboardProps {
  colors: {
    primary: string;
    success: string;
    danger: string;
    warning: string;
    text: string;
    lightText: string;
    cardBackground: string;
    border: string;
    background: string;
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();
  
  // Skeleton animation
  const shimmerOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    fetchInvestorDashboard();
  }, []);

  // Skeleton shimmer animation
  useEffect(() => {
    if (loading) {
      const shimmerAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerOpacity, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerOpacity, {
            toValue: 0.3,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      shimmerAnimation.start();
      return () => shimmerAnimation.stop();
    }
  }, [loading]);

  const fetchInvestorDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getInvestorDashboard();
      
      if (response.success && response.data?.investor) {
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInvestorDashboard();
    setRefreshing(false);
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

  const calculateMonthsActive = () => {
    if (!investorData || !investorData.profitHistory || investorData.profitHistory.length === 0) {
      return 0;
    }

    // Find the earliest profit date
    const sortedHistory = [...investorData.profitHistory].sort((a, b) => {
      const dateA = new Date(a.month + '-01');
      const dateB = new Date(b.month + '-01');
      return dateA.getTime() - dateB.getTime();
    });

    const firstProfitDate = new Date(sortedHistory[0].month + '-01');
    const today = new Date();
    
    // Calculate difference in months
    const yearsDiff = today.getFullYear() - firstProfitDate.getFullYear();
    const monthsDiff = today.getMonth() - firstProfitDate.getMonth();
    
    // Total months active (including current month if profit exists)
    const totalMonths = yearsDiff * 12 + monthsDiff + 1; // +1 to include the first month
    
    return Math.max(1, totalMonths); // At least 1 month
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
    if (cleanPhone.startsWith('+92')) {
      const numberPart = cleanPhone.slice(3);
      
      if (numberPart.length === 10) {
        return `+92 ${numberPart.slice(0, 3)} ${numberPart.slice(3, 6)} ${numberPart.slice(6)}`;
      } else if (numberPart.length === 11) {
        return `+92 ${numberPart.slice(0, 4)} ${numberPart.slice(4, 7)} ${numberPart.slice(7)}`;
      }
    }
    
    return cleanPhone;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        {/* Skeleton Cards */}
        <View style={styles.statsGrid}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.skeletonCard}>
              <View style={styles.skeletonHeader}>
                <View style={styles.skeletonInfo}>
                  <Animated.View style={[styles.skeletonLine, styles.skeletonTitle, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
                  <Animated.View style={[styles.skeletonLine, styles.skeletonSubtitle, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
                </View>
                <Animated.View style={[styles.skeletonBadge, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
              </View>
            </View>
          ))}
        </View>

        {/* Skeleton History Card */}
        <View style={styles.skeletonCard}>
          <Animated.View style={[styles.skeletonLine, styles.skeletonTitle, { backgroundColor: colors.border, opacity: shimmerOpacity, marginBottom: 16 }]} />
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonHistoryItem}>
              <View>
                <Animated.View style={[styles.skeletonLine, styles.skeletonLabel, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
                <Animated.View style={[styles.skeletonLine, styles.skeletonValue, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
              </View>
              <Animated.View style={[styles.skeletonLine, styles.skeletonValue, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
            </View>
          ))}
        </View>

        {/* Skeleton Account Card */}
        <View style={styles.skeletonCard}>
          <Animated.View style={[styles.skeletonLine, styles.skeletonTitle, { backgroundColor: colors.border, opacity: shimmerOpacity, marginBottom: 16 }]} />
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.skeletonInfoRow}>
              <Animated.View style={[styles.skeletonLine, styles.skeletonLabel, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
              <Animated.View style={[styles.skeletonLine, styles.skeletonValue, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
            </View>
          ))}
        </View>

        {/* Skeleton Performance Card */}
        <View style={styles.skeletonCard}>
          <Animated.View style={[styles.skeletonLine, styles.skeletonTitle, { backgroundColor: colors.border, opacity: shimmerOpacity, marginBottom: 16 }]} />
          {[1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonPerformanceItem}>
              <Animated.View style={[styles.skeletonLine, styles.skeletonLabel, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
              <Animated.View style={[styles.skeletonLine, styles.skeletonValue, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (error || !investorData) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Ionicons name="warning" size={48} color={colors.danger} />
        <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to Load Dashboard</Text>
        <Text style={[styles.errorMessage, { color: colors.lightText }]}>
          {error || 'No investor data found'}
        </Text>
        <TouchableOpacity
          style={[styles.retryButton, { backgroundColor: colors.primary }]}
          onPress={fetchInvestorDashboard}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Financial Overview Cards */}
      <View style={styles.statsGrid}>
        {/* Total Investment */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View>
              <Text style={styles.statLabel}>Total Investment</Text>
              <Text style={styles.statValue}>
                {formatCurrency(investorData.investmentAmount)}
              </Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="wallet" size={16} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Current Month Profit */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View>
              <Text style={styles.statLabel}>This Month Profit</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {formatCurrency(investorData.currentMonthProfit)}
              </Text>
              <Text style={styles.statSubtext}>
                {parseFloat(investorData.profitGrowth) > 0 ? '+' : ''}{investorData.profitGrowth}% from last month
              </Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: colors.success + '15' }]}>
              <Ionicons name="trending-up" size={16} color={colors.success} />
            </View>
          </View>
        </View>

        {/* Previous Month Profit */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View>
              <Text style={styles.statLabel}>Last Month Profit</Text>
              <Text style={[styles.statValue, { color: colors.warning }]}>
                {formatCurrency(investorData.previousMonthProfit)}
              </Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: colors.warning + '15' }]}>
              <Ionicons name="calendar" size={16} color={colors.warning} />
            </View>
          </View>
        </View>

        {/* Total Profit Earned */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <View>
              <Text style={styles.statLabel}>Total Profit Earned</Text>
              <Text style={[styles.statValue, { color: colors.danger }]}>
                {formatCurrency(investorData.totalProfitEarned)}
              </Text>
              <Text style={styles.statSubtext}>
                {investorData.profitPercentage}% return
              </Text>
            </View>
            <View style={[styles.statIcon, { backgroundColor: colors.danger + '15' }]}>
              <Ionicons name="trophy" size={16} color={colors.danger} />
            </View>
          </View>
        </View>
      </View>

      {/* Profit History */}
      <View style={[styles.historyCard, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Profit History</Text>
        {investorData.profitHistory.length > 0 ? (
          <ScrollView 
            style={styles.historyList}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {[...investorData.profitHistory]
              .sort((a, b) => {
                const dateA = new Date(a.month + '-01');
                const dateB = new Date(b.month + '-01');
                return dateB.getTime() - dateA.getTime(); // Sort descending (newest first)
              })
              .map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyMonth, { color: colors.text }]}>
                    {formatMonth(item.month)}
                  </Text>
                  <Text style={[styles.historyDate, { color: colors.lightText }]}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
                <Text style={[styles.historyProfit, { color: colors.success }]}>
                  {formatCurrency(item.profit)}
                </Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyHistory}>
            <Ionicons name="receipt-outline" size={32} color={colors.lightText} />
            <Text style={[styles.emptyHistoryText, { color: colors.lightText }]}>
              No profit history available
            </Text>
          </View>
        )}
      </View>

      {/* Account Information */}
      <View style={[styles.accountCard, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Account Information</Text>
        <View style={styles.accountInfo}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.lightText }]}>Name:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{investorData.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.lightText }]}>Email:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{investorData.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.lightText }]}>Phone:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {formatPhoneNumber(investorData.phone)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.lightText }]}>Joined:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {formatDate(investorData.joinedDate)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.lightText }]}>Last Login:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {investorData.lastLogin ? formatDateTime(investorData.lastLogin) : 'Never'}
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Summary */}
      <View style={[styles.performanceCard, { backgroundColor: colors.cardBackground }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Performance Summary</Text>
        <View style={styles.performanceGrid}>
          <View style={styles.performanceItem}>
            <Text style={[styles.performanceValue, { color: colors.primary }]}>
              {investorData.profitPercentage}%
            </Text>
            <Text style={[styles.performanceLabel, { color: colors.lightText }]}>Total Return</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={[styles.performanceValue, { color: colors.success }]}>
              {calculateMonthsActive()}
            </Text>
            <Text style={[styles.performanceLabel, { color: colors.lightText }]}>Months Active</Text>
          </View>
          <View style={styles.performanceItem}>
            <Text style={[styles.performanceValue, { color: colors.danger }]}>
              {investorData.profitHistory.length > 0 
                ? formatCurrency(investorData.totalProfitEarned / investorData.profitHistory.length)
                : formatCurrency(0)
              }
            </Text>
            <Text style={[styles.performanceLabel, { color: colors.lightText }]}>Avg Monthly Profit</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  headerCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerGradient: {
    padding: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statsGrid: {
    flexDirection: 'column',
    marginBottom: 20,
  },
  statCard: {
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 0,
  },
  statSubtext: {
    fontSize: 11,
    fontWeight: '500',
  },
  historyCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    maxHeight: 300,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  historyList: {
    gap: 12,
    maxHeight: 200,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  historyInfo: {
    flex: 1,
  },
  historyMonth: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
  },
  historyProfit: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyHistoryText: {
    fontSize: 16,
    marginTop: 8,
  },
  accountCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  accountInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  performanceCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  performanceGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  performanceValue: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  performanceLabel: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  // Skeleton styles matching admin dashboard
  skeletonCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  skeletonInfo: {
    flex: 1,
  },
  skeletonLine: {
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTitle: {
    height: 20,
    width: '70%',
  },
  skeletonSubtitle: {
    height: 14,
    width: '50%',
  },
  skeletonBadge: {
    height: 24,
    width: 60,
    borderRadius: 12,
  },
  skeletonHistoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  skeletonInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  skeletonPerformanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  skeletonLabel: {
    height: 12,
    width: '60%',
    marginBottom: 4,
  },
  skeletonValue: {
    height: 14,
    width: '80%',
  },
});

export default InvestorDashboard;
