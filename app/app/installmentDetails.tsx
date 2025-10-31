import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  RefreshControl,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import TokenService from '../services/tokenService';
import PaymentModal from '../components/PaymentModal';

export default function InstallmentDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  const [installmentPlan, setInstallmentPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shimmerOpacity = useRef(new Animated.Value(0.3)).current;

  
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
    loadUserData();
    loadInstallmentDetails();
  }, []);

  const loadUserData = async () => {
    try {
      const response = await apiService.getProfile();
      if (response.success && response.user) {
        setUser(response.user);
      }
    } catch (error) {
      console.log('Failed to load user data');
    }
  };

  useEffect(() => {
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerOpacity, {
          toValue: 1,
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
  }, []);

  const loadInstallmentDetails = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getInstallment(params.installmentId as string);
      
      if (response.success) {
        setInstallmentPlan(response.installment);
      } else {
        showError('Failed to load installment details');
        router.back();
      }
    } catch (error) {
      showError('Failed to load installment details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInstallmentDetails();
    setRefreshing(false);
  };

  const openPaymentModal = (installment: any) => {
    setSelectedInstallment(installment);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInstallment(null);
    setIsRecordingPayment(false);
  };


  const handlePayment = async (paymentData: any) => {
    if (!paymentData.customAmount) {
      showError('Please enter payment amount');
      return;
    }

    const amount = parseFloat(paymentData.customAmount);
    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (!paymentData.paidDate) {
      showError('Please enter paid date');
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(paymentData.paidDate)) {
      showError('Please enter paid date in YYYY-MM-DD format');
      return;
    }

    try {
      setIsRecordingPayment(true);
      const response = await apiService.payInstallment(
        params.installmentId as string,
        paymentData
      );

      if (response.success) {
        const paymentMethods = [
          { id: 'cash', name: 'Cash', icon: 'cash' },
          { id: 'bank_transfer', name: 'Bank Transfer', icon: 'card' },
          { id: 'wallet', name: 'Mobile Wallet', icon: 'phone-portrait' },
          { id: 'cheque', name: 'Cheque', icon: 'document-text' },
          { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
        ];
        
        let alertMessage = `Payment of ${formatCurrency(amount)} via ${paymentMethods.find(pm => pm.id === paymentData.paymentMethod)?.name} has been recorded successfully.`;
        
        if (response.distribution) {
          alertMessage += `\n\n${response.distribution.message}`;
        }
        
        showSuccess(alertMessage);
        closePaymentModal();
        loadInstallmentDetails(); 
      } else {
        showError(response.message || 'Failed to record payment');
      }
    } catch (error) {
      showError('Failed to record payment. Please try again.');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleMarkUnpaid = async (installmentData: any) => {
    if (!installmentData.installmentNumber || !installmentData.installmentId) {
      showError('Invalid installment data');
      return;
    }

    try {
      setIsRecordingPayment(true);
      const response = await apiService.markInstallmentUnpaid(
        installmentData.installmentId,
        installmentData.installmentNumber
      );

      if (response.success) {
        showSuccess(response.message);
        closePaymentModal();
        await loadInstallmentDetails(); // Refresh the data
      } else {
        showError(response.message || 'Failed to mark installment as unpaid');
      }
    } catch (error) {
      console.error('Error marking installment as unpaid:', error);
      showError('Failed to mark installment as unpaid. Please try again.');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleEditPayment = async (paymentData: any) => {
    if (!paymentData.customAmount) {
      showError('Please enter payment amount');
      return;
    }

    const amount = parseFloat(paymentData.customAmount);
    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (!paymentData.paidDate) {
      showError('Please enter paid date');
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(paymentData.paidDate)) {
      showError('Please enter paid date in YYYY-MM-DD format');
      return;
    }

    try {
      setIsRecordingPayment(true);
      const response = await apiService.updatePayment(
        params.installmentId as string,
        {
          installmentNumber: paymentData.installmentNumber,
          paymentMethod: paymentData.paymentMethod,
          notes: paymentData.notes,
          customAmount: amount,
          paidDate: paymentData.paidDate
        }
      );

      if (response.success) {
        const paymentMethods = [
          { id: 'cash', name: 'Cash', icon: 'cash' },
          { id: 'bank_transfer', name: 'Bank Transfer', icon: 'card' },
          { id: 'wallet', name: 'Mobile Wallet', icon: 'phone-portrait' },
          { id: 'cheque', name: 'Cheque', icon: 'document-text' },
          { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
        ];
        showSuccess(`Payment updated successfully to ${formatCurrency(amount)} via ${paymentMethods.find(pm => pm.id === paymentData.paymentMethod)?.name}`);
        closePaymentModal();
        loadInstallmentDetails(); 
      } else {
        showError(response.message || 'Failed to update payment');
      }
    } catch (error) {
      showError('Failed to update payment. Please try again.');
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  
  const roundUp = (amount: number) => Math.ceil(amount);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return colors.success;
      case 'overdue': return colors.danger;
      case 'pending': return colors.warning;
      default: return colors.lightText;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Paid';
      case 'overdue': return 'Overdue';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  
  const SkeletonLine = ({ width, height, style }: { width: number | string; height: number; style?: any }) => (
    <Animated.View
      style={[
        styles.skeletonLine,
        {
          width,
          height,
          opacity: shimmerOpacity,
          ...style,
        },
      ]}
    />
  );

  const SkeletonCircle = ({ size, style }: { size: number; style?: any }) => (
    <Animated.View
      style={[
        styles.skeletonCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: shimmerOpacity,
          ...style,
        },
      ]}
    />
  );

  const SkeletonCard = () => (
    <View style={[styles.skeletonCard, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.skeletonCardHeader}>
        <SkeletonCircle size={40} style={{ marginRight: 12 }} />
        <View style={styles.skeletonCardContent}>
          <SkeletonLine width={120} height={16} style={{ marginBottom: 8 }} />
          <SkeletonLine width={80} height={14} style={{ marginBottom: 4 }} />
          <SkeletonLine width={100} height={12} />
        </View>
        <View style={styles.skeletonCardRight}>
          <SkeletonLine width={60} height={16} style={{ marginBottom: 8 }} />
          <SkeletonLine width={50} height={20} style={{ borderRadius: 10 }} />
        </View>
      </View>
    </View>
  );

  const renderAllPayments = () => {
    if (!installmentPlan?.installments) return null;

    const allInstallments = installmentPlan.installments;
    const now = new Date();
    
    return (
      <View style={styles.historySection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          All Payments ({allInstallments.length} installments)
        </Text>
        
        {allInstallments.length === 0 ? (
          <View style={styles.noHistoryContainer}>
            <Ionicons name="receipt-outline" size={48} color={colors.lightText} />
            <Text style={[styles.noHistoryText, { color: colors.lightText }]}>
              No installments found
            </Text>
          </View>
        ) : (
          allInstallments.map((installment: any, index: number) => {
            const isOverdue = new Date(installment.dueDate) < now && installment.status !== 'paid';
            const isUpcoming = new Date(installment.dueDate) > now && installment.status === 'pending';
            
            return (
              <View key={index} style={[styles.paymentItem, { backgroundColor: colors.cardBackground }]}>
                <View style={styles.paymentItemLeft}>
                  <View style={[
                    styles.paymentIconContainer, 
                    { 
                      backgroundColor: installment.status === 'paid' ? colors.success + '20' :
                                     isOverdue ? colors.danger + '20' :
                                     isUpcoming ? colors.warning + '20' : colors.lightText + '20'
                    }
                  ]}>
                    <Ionicons 
                      name={installment.status === 'paid' ? 'checkmark-circle' : 
                            isOverdue ? 'warning' : 
                            isUpcoming ? 'time' : 'calendar'} 
                      size={20} 
                      color={installment.status === 'paid' ? colors.success :
                             isOverdue ? colors.danger :
                             isUpcoming ? colors.warning : colors.lightText} 
                    />
                  </View>
                  <View style={styles.paymentDetails}>
                    <Text style={[styles.paymentMethod, { color: colors.text }]}>
                      Installment #{installment.installmentNumber}
                    </Text>
                    <Text style={[styles.paymentDate, { color: colors.lightText }]}>
                      Due: {formatDate(installment.dueDate)}
                    </Text>
                    {installment.status === 'paid' && installment.paidDate && (
                      <Text style={[styles.paymentReference, { color: colors.success }]}>
                        Paid: {formatDate(installment.paidDate)}
                      </Text>
                    )}
                    {isOverdue && (
                      <Text style={[styles.paymentReference, { color: colors.danger }]}>
                        Overdue Payment
                      </Text>
                    )}
                    {isUpcoming && (
                      <Text style={[styles.paymentReference, { color: colors.warning }]}>
                        Upcoming Payment
                      </Text>
                    )}
                    {installment.paymentMethod && installment.status === 'paid' && (
                      <Text style={[styles.paymentReference, { color: colors.lightText }]}>
                        {installment.paymentMethod.replace('_', ' ').toUpperCase()}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.paymentItemRight}>
                  <Text style={[styles.paymentAmount, { 
                    color: installment.status === 'paid' ? colors.success :
                           isOverdue ? colors.danger :
                           isUpcoming ? colors.warning : colors.primary
                  }]}>
                    {(() => {
                      const displayAmount = installment.status === 'paid' ? (installment.actualPaidAmount || installment.amount) : installment.amount;
                      const roundedAmount = roundUp(displayAmount);
                      return formatCurrency(roundedAmount);
                    })()}
                  </Text>
                  {installment.status === 'paid' ? (
                    <View style={styles.paidInstallmentActions}>
                      <View style={[
                        styles.paymentStatusBadge, 
                        { backgroundColor: getStatusColor(installment.status) + '20' }
                      ]}>
                        <Text style={[styles.paymentStatusText, { color: getStatusColor(installment.status) }]}>
                          {getStatusText(installment.status)}
                        </Text>
                      </View>
                      {user?.type === 'admin' && (
                        <TouchableOpacity
                          style={[styles.editButton, { backgroundColor: colors.warning }]}
                          onPress={() => openPaymentModal(installment)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="create" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    user?.type === 'admin' && (
                      <TouchableOpacity
                        style={[styles.payButton, { backgroundColor: colors.primary }]}
                        onPress={() => openPaymentModal(installment)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="card" size={16} color="#FFFFFF" />
                        <Text style={styles.payButtonText}>Pay</Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>
    );
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
            <SkeletonCircle size={40} style={{ marginRight: 16 }} />
            <View style={styles.headerTextContainer}>
              <SkeletonLine width={150} height={24} style={{ marginBottom: 4 }} />
              <SkeletonLine width={100} height={16} />
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
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              style={styles.summaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <SkeletonLine width={180} height={20} style={{ marginBottom: 20 }} />
              <View style={styles.summaryContainer}>
                <View style={styles.totalAmountRow}>
                  <SkeletonLine width={100} height={12} style={{ marginBottom: 6 }} />
                  <SkeletonLine width={120} height={18} />
                </View>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <SkeletonLine width={40} height={12} style={{ marginBottom: 6 }} />
                    <SkeletonLine width={80} height={18} />
                  </View>
                  <View style={styles.summaryItem}>
                    <SkeletonLine width={80} height={12} style={{ marginBottom: 6 }} />
                    <SkeletonLine width={90} height={18} />
                  </View>
                </View>
              </View>
              
              <View style={styles.modernProgressContainer}>
                <View style={styles.progressHeader}>
                  <SkeletonLine width={100} height={14} />
                  <SkeletonLine width={40} height={16} />
                </View>
                <View style={styles.modernProgressBar}>
                  <SkeletonLine width="60%" height={8} style={{ borderRadius: 4 }} />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Skeleton Section Title */}
          <View style={styles.historySection}>
            <SkeletonLine width={200} height={20} style={{ marginBottom: 16 }} />
            
            {/* Skeleton Payment Cards */}
            {[1, 2, 3, 4, 5].map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (!installmentPlan) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.text }]}>Installment not found</Text>
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
            <Text style={styles.modernHeaderTitle}>Payment Details</Text>
            <Text style={styles.modernHeaderSubtitle}>
              {params.customerName} - {params.productName}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
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
                  <Text style={styles.summaryValue}>{formatCurrency(Number(params.totalAmount))}</Text>
                </View>
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Paid</Text>
                    <Text style={[styles.summaryValue, { 
                      color: '#34D399',
                      textShadowColor: 'rgba(0, 0, 0, 0.4)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }]}>
                      {(() => {
                        const advanceAmount = installmentPlan?.advanceAmount || 0;
                        const paidInstallments = installmentPlan?.installments?.filter((inst: any) => inst.status === 'paid') || [];
                        const paidAmount = paidInstallments.reduce((sum: number, inst: any) => {
                          const amount = inst.actualPaidAmount || inst.amount;
                          const roundedAmount = roundUp(amount);
                          return sum + roundedAmount;
                        }, 0);
                        const totalPaid = roundUp(advanceAmount + paidAmount);
                        return formatCurrency(totalPaid);
                      })()}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Monthly Payment</Text>
                    <Text style={[styles.summaryValue, { 
                      color: '#4ECDC4',
                      textShadowColor: 'rgba(0, 0, 0, 0.4)',
                      textShadowOffset: { width: 0, height: 1 },
                      textShadowRadius: 2,
                    }]}>{formatCurrency(Number(params.monthlyInstallment))}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.modernProgressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Overall Progress</Text>
                  <Text style={styles.progressPercentage}>
                    {(() => {
                      if (!installmentPlan) return '0%';
                      const advanceAmount = installmentPlan.advanceAmount || 0;
                      const paidInstallments = installmentPlan.installments?.filter((inst: any) => inst.status === 'paid') || [];
                      const paidAmount = paidInstallments.reduce((sum: number, inst: any) => {
                        const amount = inst.actualPaidAmount || inst.amount;
                        return sum + roundUp(amount);
                      }, 0);
                      const totalPaid = roundUp(advanceAmount + paidAmount);
                      const totalAmount = Number(params.totalAmount);
                      const percentage = Math.round((totalPaid / totalAmount) * 100);
                      return `${percentage}%`;
                    })()}
                  </Text>
                </View>
                <View style={styles.modernProgressBar}>
                  <View
                    style={[
                      styles.modernProgressFill,
                      { width: `${(() => {
                        if (!installmentPlan) return '0';
                        const advanceAmount = installmentPlan.advanceAmount || 0;
                        const paidInstallments = installmentPlan.installments?.filter((inst: any) => inst.status === 'paid') || [];
                        const paidAmount = paidInstallments.reduce((sum: number, inst: any) => {
                          const amount = inst.actualPaidAmount || inst.amount;
                          return sum + roundUp(amount);
                        }, 0);
                        const totalPaid = roundUp(advanceAmount + paidAmount);
                        const totalAmount = Number(params.totalAmount);
                        return ((totalPaid / totalAmount) * 100).toString();
                      })()}%` as any }
                    ]}
                  />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Combined Payment History & Schedule */}
          {renderAllPayments()}
        </ScrollView>
      </Animated.View>

      {/* Payment Modal - Only for admin users */}
      {showPaymentModal && user?.type === 'admin' && (
        <PaymentModal
          visible={showPaymentModal}
          onClose={closePaymentModal}
          selectedInstallment={selectedInstallment}
          installmentPlan={installmentPlan}
          onPayment={handlePayment}
          onMarkUnpaid={handleMarkUnpaid}
          onUpdatePayment={handleEditPayment}
          isRecording={isRecordingPayment}
          colors={colors}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          roundUp={roundUp}
          mode={selectedInstallment?.status === 'paid' ? 'edit' : 'record'}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
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

  content: {
    flex: 1,
    marginTop: -10,
  },
  scrollView: { flex: 1, marginTop: -10 },

  
  modernSummaryCard: {
    marginTop: 40,
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
    justifyContent: 'space-around',
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

  
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  paidInstallmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  installmentInfo: {
    margin: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  installmentInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  installmentInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  installmentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  installmentInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  installmentInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 50,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  paymentMethodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    minWidth: '45%',
    justifyContent: 'center',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  recordPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordPaymentButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  recordPaymentContainer: {
    marginTop: 20,
    marginBottom: 20,
    gap: 12,
  },

  
  distributionInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  distributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  distributionMessage: {
    fontSize: 12,
    lineHeight: 16,
  },

  // Date Picker Styles
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 50,
  },
  datePickerText: {
    fontSize: 16,
    fontWeight: '500',
  },

  
  skeletonLine: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  skeletonCircle: {
    backgroundColor: '#E5E7EB',
  },
  skeletonCard: {
    padding: 20,
    marginBottom: 12,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  skeletonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonCardContent: {
    flex: 1,
    marginRight: 12,
  },
  skeletonCardRight: {
    alignItems: 'flex-end',
  },
});
