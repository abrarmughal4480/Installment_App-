import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiService, Installment } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';

interface PaymentHistory {
  installmentNumber: number;
  amount: number;
  actualPaidAmount?: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  paymentMethod?: 'cash' | 'bank_transfer' | 'wallet' | 'cheque' | 'other';
  notes?: string;
  paidBy?: string;
}

export default function PaymentHistoryPage() {
  const router = useRouter();
  const { installment: installmentString } = useLocalSearchParams();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [installment, setInstallment] = useState<Installment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();

  
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

  useEffect(() => {
    loadInstallmentData();
  }, []);

  
  useEffect(() => {
    const interval = setInterval(() => {
      loadInstallmentData(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadInstallmentData = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setIsLoading(true);
      
      
      const installmentData = JSON.parse(installmentString as string);
      
      
      if (installmentData.id) {
        const response = await apiService.getInstallment(installmentData.id);
        if (response.success) {
          setInstallment(response.installment);
        } else {
          showError('Failed to load installment details');
          router.back();
        }
      } else {
        
        setInstallment(installmentData);
      }
    } catch (error) {
      showError('Failed to load installment details');
      router.back();
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  
  const roundUp = (amount: number) => Math.ceil(amount);

  const getPaymentMethodIcon = (method: PaymentHistory['paymentMethod']) => {
    switch (method) {
      case 'bank_transfer': return 'business';
      case 'wallet': return 'phone-portrait';
      case 'cash': return 'cash';
      case 'cheque': return 'document-text';
      case 'other': return 'ellipsis-horizontal';
      default: return 'card';
    }
  };

  const getPaymentMethodName = (method: PaymentHistory['paymentMethod']) => {
    switch (method) {
      case 'bank_transfer': return 'Bank Transfer';
      case 'wallet': return 'Mobile Wallet';
      case 'cash': return 'Cash';
      case 'cheque': return 'Cheque';
      case 'other': return 'Other';
      default: return 'Unknown';
    }
  };

  const getPaymentStatusColor = (status: PaymentHistory['status']) => {
    switch (status) {
      case 'paid': return colors.success;
      case 'pending': return colors.warning;
      case 'overdue': return colors.danger;
      default: return colors.lightText;
    }
  };

  const getPaymentHistory = (installment: Installment | null): PaymentHistory[] => {
    if (!installment || !installment.installments) return [];
    
    return installment.installments
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  };

  const paymentHistory = getPaymentHistory(installment);
  const paidInstallments = paymentHistory
    .filter(payment => payment.status === 'paid')
    .reduce((sum, payment) => {
      const amount = payment.actualPaidAmount || payment.amount;
      return sum + roundUp(amount);
    }, 0);
  const advanceAmount = roundUp(installment?.advanceAmount || 0);
  const totalPaid = advanceAmount + paidInstallments;
  const totalRemaining = roundUp((installment?.totalAmount || 0) - totalPaid);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInstallmentData(false);
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        
        {/* Skeleton Header */}
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          style={[
            styles.modernHeader,
            {
              paddingTop: insets.top + 20,
              paddingLeft: Math.max(insets.left, 20),
              paddingRight: Math.max(insets.right, 20),
            }
          ]}
        >
          <View style={styles.headerContent}>
            <View style={[styles.skeletonCircle, { width: 40, height: 40, marginRight: 16 }]} />
            <View style={styles.headerTextContainer}>
              <View style={[styles.skeletonLine, { width: 150, height: 24, marginBottom: 4 }]} />
              <View style={[styles.skeletonLine, { width: 100, height: 16 }]} />
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{
            paddingLeft: Math.max(insets.left, 20),
            paddingRight: Math.max(insets.right, 20),
            paddingBottom: insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Skeleton Summary Card */}
          <View style={[styles.modernSummaryCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.summaryGradient}>
              <View style={[styles.skeletonLine, { width: 180, height: 20, marginBottom: 20 }]} />
              <View style={styles.summaryContainer}>
                <View style={styles.totalAmountRow}>
                  <View style={[styles.skeletonLine, { width: 100, height: 12, marginBottom: 6 }]} />
                  <View style={[styles.skeletonLine, { width: 120, height: 18 }]} />
                </View>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <View style={[styles.skeletonLine, { width: 60, height: 12, marginBottom: 6 }]} />
                    <View style={[styles.skeletonLine, { width: 80, height: 18 }]} />
                  </View>
                  <View style={styles.summaryItem}>
                    <View style={[styles.skeletonLine, { width: 60, height: 12, marginBottom: 6 }]} />
                    <View style={[styles.skeletonLine, { width: 80, height: 18 }]} />
                  </View>
                </View>
              </View>
              <View style={styles.modernProgressContainer}>
                <View style={styles.progressHeader}>
                  <View style={[styles.skeletonLine, { width: 100, height: 14 }]} />
                  <View style={[styles.skeletonLine, { width: 40, height: 16 }]} />
                </View>
                <View style={[styles.skeletonProgressBar, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                  <View style={[styles.skeletonProgressFill, { width: '60%' }]} />
                </View>
              </View>
            </View>
          </View>

          {/* Skeleton Statistics Card */}
          <View style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.skeletonLine, { width: 150, height: 18, marginBottom: 16 }]} />
            <View style={styles.statsGrid}>
              {[1, 2, 3, 4].map((_, index) => (
                <View key={index} style={styles.statItem}>
                  <View style={[styles.skeletonLine, { width: 30, height: 24, marginBottom: 4 }]} />
                  <View style={[styles.skeletonLine, { width: 50, height: 12 }]} />
                </View>
              ))}
            </View>
          </View>

          {/* Skeleton Payment History */}
          <View style={styles.historySection}>
            <View style={[styles.skeletonLine, { width: 200, height: 20, marginBottom: 16 }]} />
            {[1, 2, 3, 4].map((_, index) => (
              <View key={index} style={[styles.paymentItem, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.paymentItemLeft}>
                  <View style={[styles.skeletonCircle, { width: 40, height: 40, marginRight: 12 }]} />
                  <View style={styles.paymentDetails}>
                    <View style={[styles.skeletonLine, { width: 120, height: 16, marginBottom: 2 }]} />
                    <View style={[styles.skeletonLine, { width: 100, height: 14, marginBottom: 2 }]} />
                    <View style={[styles.skeletonLine, { width: 80, height: 12 }]} />
                  </View>
                </View>
                <View style={styles.paymentItemRight}>
                  <View style={[styles.skeletonLine, { width: 80, height: 16, marginBottom: 4 }]} />
                  <View style={[styles.skeletonLine, { width: 60, height: 20 }]} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!installment) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 100 }]}>
          <Text style={[styles.loadingText, { color: colors.text }]}>No installment data found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        style={[
          styles.modernHeader,
          {
            paddingTop: insets.top + 20,
            paddingLeft: Math.max(insets.left, 20),
            paddingRight: Math.max(insets.right, 20),
          }
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.modernHeaderTitle}>Payment History</Text>
            <Text style={styles.modernHeaderSubtitle}>
              {installment.productName}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingLeft: Math.max(insets.left, 20),
          paddingRight: Math.max(insets.right, 20),
          paddingBottom: insets.bottom + 20,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Installment Summary Card - Matching Financial Overview Design */}
        <View style={[styles.modernSummaryCard, { backgroundColor: colors.cardBackground }]}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.summaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.summaryTitle}>Installment Summary</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.totalAmountRow}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValue}>{formatCurrency(roundUp(installment.totalAmount))}</Text>
              </View>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Remaining</Text>
                  <Text style={[styles.summaryValue, { 
                    color: '#FF6B6B',
                    textShadowColor: 'rgba(0, 0, 0, 0.4)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }]}>{formatCurrency(totalRemaining)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Paid</Text>
                  <Text style={[styles.summaryValue, { 
                    color: '#4ECDC4',
                    textShadowColor: 'rgba(0, 0, 0, 0.4)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }]}>{formatCurrency(totalPaid)}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.modernProgressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Overall Progress</Text>
                <Text style={styles.progressPercentage}>
                  {Math.round((totalPaid / installment.totalAmount) * 100)}%
                </Text>
              </View>
              <View style={styles.modernProgressBar}>
                <View
                  style={[
                    styles.modernProgressFill,
                    { width: `${(totalPaid / installment.totalAmount) * 100}%` }
                  ]}
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Payment Statistics */}
        <View style={[styles.statsCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>Payment Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.success }]}>
                {paymentHistory.filter(p => p.status === 'paid').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.lightText }]}>Paid</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.warning }]}>
                {paymentHistory.filter(p => p.status === 'pending').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.lightText }]}>Pending</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.danger }]}>
                {paymentHistory.filter(p => p.status === 'overdue').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.lightText }]}>Overdue</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {paymentHistory.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.lightText }]}>Total</Text>
            </View>
          </View>
        </View>

        {/* Payment History List */}
        <View style={styles.historySection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Payment History ({paymentHistory.length} payments)
          </Text>
          
          {paymentHistory.length === 0 ? (
            <View style={styles.noHistoryContainer}>
              <Ionicons name="receipt-outline" size={48} color={colors.lightText} />
              <Text style={[styles.noHistoryText, { color: colors.lightText }]}>
                No payment history found
              </Text>
            </View>
          ) : (
            paymentHistory.map((payment, index) => (
              <View key={payment.installmentNumber} style={[styles.paymentItem, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.paymentItemLeft}>
                  <View style={[styles.paymentIconContainer, { backgroundColor: getPaymentStatusColor(payment.status) + '20' }]}>
                    <Ionicons 
                      name={getPaymentMethodIcon(payment.paymentMethod)} 
                      size={20} 
                      color={getPaymentStatusColor(payment.status)} 
                    />
                  </View>
                  <View style={styles.paymentDetails}>
                    <Text style={[styles.paymentMethod, { color: colors.text }]}>
                      Installment #{payment.installmentNumber}
                    </Text>
                    <Text style={[styles.paymentDate, { color: colors.lightText }]}>
                      Due: {formatDate(payment.dueDate)}
                    </Text>
                    {payment.paidDate && (
                      <Text style={[styles.paymentReference, { color: colors.lightText }]}>
                        Paid: {formatDate(payment.paidDate)}
                      </Text>
                    )}
                    {payment.notes && (
                      <Text style={[styles.paymentReference, { color: colors.lightText }]}>
                        {payment.notes}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.paymentItemRight}>
                  <Text style={[styles.paymentAmount, { color: payment.status === 'paid' ? colors.success : colors.text }]}>
                    {formatCurrency(roundUp(payment.actualPaidAmount || payment.amount))}
                  </Text>
                  <View style={[styles.paymentStatusBadge, { backgroundColor: getPaymentStatusColor(payment.status) + '20' }]}>
                    <Text style={[styles.paymentStatusText, { color: getPaymentStatusColor(payment.status) }]}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  
  modernHeader: {
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  modernHeaderTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5
  },
  modernHeaderSubtitle: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.2
  },
  headerSpacer: {
    width: 40,
  },

  scrollView: { flex: 1, marginTop: -10 },

  
  modernSummaryCard: {
    marginTop: 20,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: 24,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: -0.3
  },
  summaryContainer: {
    marginBottom: 24,
  },
  totalAmountRow: {
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  
  modernProgressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modernProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  modernProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },

  
  statsCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.5
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },

  
  historySection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3
  },

  
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  paymentItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentMethod: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  paymentDate: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  paymentReference: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
  },
  paymentItemRight: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  
  noHistoryContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  noHistoryText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    textAlign: 'center',
  },

  
  skeletonLine: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonCircle: {
    backgroundColor: '#E5E7EB',
    borderRadius: 25,
  },
  skeletonProgressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  skeletonProgressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
});
