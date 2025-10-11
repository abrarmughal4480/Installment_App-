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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import TokenService from '../services/tokenService';

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
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentDueDate, setPaymentDueDate] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [distributionInfo, setDistributionInfo] = useState<{
    difference: number;
    remainingCount: number;
    amountPerInstallment: number;
    isExcess: boolean;
    message: string;
  } | null>(null);

  // Edit payment modal state
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState('cash');
  const [editPaymentNotes, setEditPaymentNotes] = useState('');
  const [editPaymentDueDate, setEditPaymentDueDate] = useState('');
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  
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

  
  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: 'cash' },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: 'card' },
    { id: 'wallet', name: 'Mobile Wallet', icon: 'phone-portrait' },
    { id: 'cheque', name: 'Cheque', icon: 'document-text' },
    { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
  ];

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
    setPaymentAmount(installment.amount.toString());
    setPaymentMethod('cash');
    setPaymentNotes('');
    // Format due date to YYYY-MM-DD format
    let dueDate = '';
    if (installment.dueDate) {
      console.log('Payment Modal - Original due date:', installment.dueDate);
      try {
        const date = new Date(installment.dueDate);
        if (!isNaN(date.getTime())) {
          dueDate = date.toISOString().split('T')[0];
          console.log('Payment Modal - Formatted due date:', dueDate);
        } else {
          // If it's already in YYYY-MM-DD format, use it directly
          dueDate = installment.dueDate;
          console.log('Payment Modal - Using original due date:', dueDate);
        }
      } catch (error) {
        console.log('Payment Modal - Date formatting error:', error);
        dueDate = installment.dueDate;
      }
    }
    setPaymentDueDate(dueDate);
    setDistributionInfo(null);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInstallment(null);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentNotes('');
    setPaymentDueDate('');
    setDistributionInfo(null);
    setIsRecordingPayment(false);
  };

  const openEditPaymentModal = (installment: any) => {
    setEditingPayment(installment);
    setEditPaymentAmount((installment.actualPaidAmount || installment.amount).toString());
    setEditPaymentMethod(installment.paymentMethod || 'cash');
    setEditPaymentNotes(installment.paymentNotes || '');
    // Format due date to YYYY-MM-DD format
    let dueDate = '';
    if (installment.dueDate) {
      console.log('Edit Payment Modal - Original due date:', installment.dueDate);
      try {
        const date = new Date(installment.dueDate);
        if (!isNaN(date.getTime())) {
          dueDate = date.toISOString().split('T')[0];
          console.log('Edit Payment Modal - Formatted due date:', dueDate);
        } else {
          // If it's already in YYYY-MM-DD format, use it directly
          dueDate = installment.dueDate;
          console.log('Edit Payment Modal - Using original due date:', dueDate);
        }
      } catch (error) {
        console.log('Edit Payment Modal - Date formatting error:', error);
        dueDate = installment.dueDate;
      }
    }
    setEditPaymentDueDate(dueDate);
    setShowEditPaymentModal(true);
  };

  const closeEditPaymentModal = () => {
    setShowEditPaymentModal(false);
    setEditingPayment(null);
    setEditPaymentAmount('');
    setEditPaymentMethod('cash');
    setEditPaymentNotes('');
    setEditPaymentDueDate('');
    setIsUpdatingPayment(false);
  };

  const calculateDistribution = (amount: number) => {
    if (!selectedInstallment || !installmentPlan) return null;
    
    const originalAmount = selectedInstallment.amount;
    const difference = amount - originalAmount;
    
    if (difference === 0) return null;
    
    
    const remainingInstallments = installmentPlan.installments.filter((inst: any) => 
      inst.status === 'pending' && inst.installmentNumber > selectedInstallment.installmentNumber
    );
    
    if (remainingInstallments.length === 0) return null;
    
    const amountPerInstallment = difference / remainingInstallments.length;
    const roundedAmountPerInstallment = roundUp(Math.abs(amountPerInstallment));
    
    return {
      difference,
      remainingCount: remainingInstallments.length,
      amountPerInstallment: roundedAmountPerInstallment,
      isExcess: difference > 0,
      message: difference > 0 
        ? `Excess of ${formatCurrency(Math.abs(difference))} will be distributed across ${remainingInstallments.length} remaining installments (${formatCurrency(roundedAmountPerInstallment)} each)`
        : `Shortfall of ${formatCurrency(Math.abs(difference))} will be distributed across ${remainingInstallments.length} remaining installments (${formatCurrency(roundedAmountPerInstallment)} each)`
    };
  };

  const handleAmountChange = (amount: string) => {
    setPaymentAmount(amount);
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      const distInfo = calculateDistribution(numAmount);
      setDistributionInfo(distInfo);
    } else {
      setDistributionInfo(null);
    }
  };

  const handlePayment = async () => {
    if (!selectedInstallment || !paymentAmount) {
      showError('Please enter payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (!paymentDueDate) {
      showError('Please enter due date');
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(paymentDueDate)) {
      showError('Please enter due date in YYYY-MM-DD format');
      return;
    }

    try {
      setIsRecordingPayment(true);
      const response = await apiService.payInstallment(
        params.installmentId as string,
        {
          installmentNumber: selectedInstallment.installmentNumber,
          paymentMethod: paymentMethod,
          notes: paymentNotes,
          customAmount: amount,
          dueDate: paymentDueDate
        }
      );

      if (response.success) {
        let alertMessage = `Payment of ${formatCurrency(amount)} via ${paymentMethods.find(pm => pm.id === paymentMethod)?.name} has been recorded successfully.`;
        
        
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

  const handleEditPayment = async () => {
    if (!editingPayment || !editPaymentAmount) {
      showError('Please enter payment amount');
      return;
    }

    const amount = parseFloat(editPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showError('Please enter a valid amount');
      return;
    }

    if (!editPaymentDueDate) {
      showError('Please enter due date');
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(editPaymentDueDate)) {
      showError('Please enter due date in YYYY-MM-DD format');
      return;
    }

    try {
      setIsUpdatingPayment(true);
      const response = await apiService.updatePayment(
        params.installmentId as string,
        {
          installmentNumber: editingPayment.installmentNumber,
          paymentMethod: editPaymentMethod,
          notes: editPaymentNotes,
          customAmount: amount,
          dueDate: editPaymentDueDate
        }
      );

      if (response.success) {
        showSuccess(`Payment updated successfully to ${formatCurrency(amount)} via ${paymentMethods.find(pm => pm.id === editPaymentMethod)?.name}`);
        closeEditPaymentModal();
        loadInstallmentDetails(); 
      } else {
        showError(response.message || 'Failed to update payment');
      }
    } catch (error) {
      showError('Failed to update payment. Please try again.');
    } finally {
      setIsUpdatingPayment(false);
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
                          onPress={() => openEditPaymentModal(installment)}
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
        <Modal
          visible={showPaymentModal}
          animationType="slide"
          transparent={true}
          onRequestClose={closePaymentModal}
        >
          <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
            {/* Modal Header - Fixed */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Ionicons name="card" size={24} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Record Payment
                </Text>
              </View>
              <TouchableOpacity onPress={closePaymentModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.lightText} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {selectedInstallment && (
                <View style={[styles.installmentInfo, { backgroundColor: colors.primary + '10' }]}>
                  <View style={styles.installmentInfoHeader}>
                    <Ionicons name="receipt" size={20} color={colors.primary} />
                    <Text style={[styles.installmentInfoTitle, { color: colors.primary }]}>
                      Installment Details
                    </Text>
                  </View>
                  <View style={styles.installmentInfoRow}>
                    <Text style={[styles.installmentInfoLabel, { color: colors.text }]}>Number:</Text>
                    <Text style={[styles.installmentInfoValue, { color: colors.text }]}>
                      #{selectedInstallment.installmentNumber}
                    </Text>
                  </View>
                  <View style={styles.installmentInfoRow}>
                    <Text style={[styles.installmentInfoLabel, { color: colors.lightText }]}>Due Date:</Text>
                    <Text style={[styles.installmentInfoValue, { color: colors.lightText }]}>
                      {formatDate(selectedInstallment.dueDate)}
                    </Text>
                  </View>
                  <View style={styles.installmentInfoRow}>
                    <Text style={[styles.installmentInfoLabel, { color: colors.lightText }]}>Original Amount:</Text>
                    <Text style={[styles.installmentInfoValue, { color: colors.primary, fontWeight: '700' }]}>
                      {formatCurrency(selectedInstallment.amount)}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.modalContent}>
                {/* Payment Amount */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Ionicons name="cash" size={18} color={colors.primary} />
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Amount *</Text>
                  </View>
                  <TextInput
                    style={[styles.textInput, { 
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.background
                    }]}
                    value={paymentAmount}
                    onChangeText={handleAmountChange}
                    placeholder="Enter amount"
                    placeholderTextColor={colors.lightText}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.inputHint, { color: colors.lightText }]}>
                    You can pay more or less than the original amount. Any difference will be automatically distributed across remaining installments.
                  </Text>
                  
                  {/* Distribution Info Display */}
                  {distributionInfo && (
                    <View style={[styles.distributionInfo, { 
                      backgroundColor: distributionInfo.isExcess ? colors.success + '10' : colors.warning + '10',
                      borderColor: distributionInfo.isExcess ? colors.success : colors.warning
                    }]}>
                      <View style={styles.distributionHeader}>
                        <Ionicons 
                          name={distributionInfo.isExcess ? 'trending-up' : 'trending-down'} 
                          size={16} 
                          color={distributionInfo.isExcess ? colors.success : colors.warning} 
                        />
                        <Text style={[styles.distributionTitle, { 
                          color: distributionInfo.isExcess ? colors.success : colors.warning 
                        }]}>
                          {distributionInfo.isExcess ? 'Excess Payment' : 'Shortfall Payment'}
                        </Text>
                      </View>
                      <Text style={[styles.distributionMessage, { color: colors.text }]}>
                        {distributionInfo.message}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Payment Method */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Ionicons name="card" size={18} color={colors.primary} />
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Method *</Text>
                  </View>
                  <View style={styles.paymentMethodGrid}>
                    {paymentMethods.map((method) => (
                      <TouchableOpacity
                        key={method.id}
                        style={[
                          styles.paymentMethodOption,
                          { 
                            backgroundColor: paymentMethod === method.id ? colors.primary + '20' : colors.background,
                            borderColor: paymentMethod === method.id ? colors.primary : colors.border
                          }
                        ]}
                        onPress={() => setPaymentMethod(method.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={method.icon as any} 
                          size={20} 
                          color={paymentMethod === method.id ? colors.primary : colors.lightText} 
                        />
                        <Text style={[
                          styles.paymentMethodText,
                          { color: paymentMethod === method.id ? colors.primary : colors.text }
                        ]}>
                          {method.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Due Date */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Ionicons name="calendar" size={18} color={colors.primary} />
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Due Date *</Text>
                  </View>
                  <TextInput
                    style={[styles.textInput, { 
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.background
                    }]}
                    value={paymentDueDate}
                    onChangeText={setPaymentDueDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.lightText}
                  />
                  <Text style={[styles.inputHint, { color: colors.lightText }]}>
                    Enter the due date for this installment in YYYY-MM-DD format.
                  </Text>
                </View>

                {/* Payment Notes */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Ionicons name="document-text" size={18} color={colors.primary} />
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Notes (Optional)</Text>
                  </View>
                  <TextInput
                    style={[styles.textInput, styles.textArea, { 
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.background
                    }]}
                    value={paymentNotes}
                    onChangeText={setPaymentNotes}
                    placeholder="Add any notes about this payment"
                    placeholderTextColor={colors.lightText}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Record Payment Button - Inside scrollable content */}
                <View style={styles.recordPaymentContainer}>
                  <TouchableOpacity
                    style={[
                      styles.recordPaymentButton, 
                      { 
                        backgroundColor: isRecordingPayment ? colors.lightText : colors.primary,
                        opacity: isRecordingPayment ? 0.7 : 1
                      }
                    ]}
                    onPress={handlePayment}
                    activeOpacity={0.8}
                    disabled={isRecordingPayment}
                  >
                    {isRecordingPayment ? (
                      <>
                        <Ionicons name="hourglass" size={20} color="#FFFFFF" />
                        <Text style={styles.recordPaymentButtonText}>Recording...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        <Text style={styles.recordPaymentButtonText}>Record Payment</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
        </Modal>
      )}

      {/* Edit Payment Modal - Only for admin users */}
      {showEditPaymentModal && user?.type === 'admin' && (
        <Modal
          visible={showEditPaymentModal}
          animationType="slide"
          transparent={true}
          onRequestClose={closeEditPaymentModal}
        >
          <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
            {/* Modal Header - Fixed */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Ionicons name="create" size={24} color={colors.warning} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Edit Payment
                </Text>
              </View>
              <TouchableOpacity onPress={closeEditPaymentModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.lightText} />
              </TouchableOpacity>
            </View>

            {/* Scrollable Content */}
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {editingPayment && (
                <View style={[styles.installmentInfo, { backgroundColor: colors.warning + '10' }]}>
                  <View style={styles.installmentInfoHeader}>
                    <Ionicons name="receipt" size={20} color={colors.warning} />
                    <Text style={[styles.installmentInfoTitle, { color: colors.warning }]}>
                      Payment Details
                    </Text>
                  </View>
                  <View style={styles.installmentInfoRow}>
                    <Text style={[styles.installmentInfoLabel, { color: colors.text }]}>Installment:</Text>
                    <Text style={[styles.installmentInfoValue, { color: colors.text }]}>
                      #{editingPayment.installmentNumber}
                    </Text>
                  </View>
                  <View style={styles.installmentInfoRow}>
                    <Text style={[styles.installmentInfoLabel, { color: colors.lightText }]}>Paid Date:</Text>
                    <Text style={[styles.installmentInfoValue, { color: colors.lightText }]}>
                      {formatDate(editingPayment.paidDate)}
                    </Text>
                  </View>
                  <View style={styles.installmentInfoRow}>
                    <Text style={[styles.installmentInfoLabel, { color: colors.lightText }]}>Current Amount:</Text>
                    <Text style={[styles.installmentInfoValue, { color: colors.success, fontWeight: '700' }]}>
                      {formatCurrency(editingPayment.actualPaidAmount || editingPayment.amount)}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.modalContent}>
                {/* Payment Amount */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Ionicons name="cash" size={18} color={colors.warning} />
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Amount *</Text>
                  </View>
                  <TextInput
                    style={[styles.textInput, { 
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.background
                    }]}
                    value={editPaymentAmount}
                    onChangeText={setEditPaymentAmount}
                    placeholder="Enter amount"
                    placeholderTextColor={colors.lightText}
                    keyboardType="numeric"
                  />
                  <Text style={[styles.inputHint, { color: colors.lightText }]}>
                    Update the payment amount for this installment.
                  </Text>
                </View>

                {/* Payment Method */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Ionicons name="card" size={18} color={colors.warning} />
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Method *</Text>
                  </View>
                  <View style={styles.paymentMethodGrid}>
                    {paymentMethods.map((method) => (
                      <TouchableOpacity
                        key={method.id}
                        style={[
                          styles.paymentMethodOption,
                          { 
                            backgroundColor: editPaymentMethod === method.id ? colors.warning + '20' : colors.background,
                            borderColor: editPaymentMethod === method.id ? colors.warning : colors.border
                          }
                        ]}
                        onPress={() => setEditPaymentMethod(method.id)}
                        activeOpacity={0.7}
                      >
                        <Ionicons 
                          name={method.icon as any} 
                          size={20} 
                          color={editPaymentMethod === method.id ? colors.warning : colors.lightText} 
                        />
                        <Text style={[
                          styles.paymentMethodText,
                          { color: editPaymentMethod === method.id ? colors.warning : colors.text }
                        ]}>
                          {method.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Due Date */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Ionicons name="calendar" size={18} color={colors.warning} />
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Due Date *</Text>
                  </View>
                  <TextInput
                    style={[styles.textInput, { 
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.background
                    }]}
                    value={editPaymentDueDate}
                    onChangeText={setEditPaymentDueDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.lightText}
                  />
                  <Text style={[styles.inputHint, { color: colors.lightText }]}>
                    Enter the due date for this installment in YYYY-MM-DD format.
                  </Text>
                </View>

                {/* Payment Notes */}
                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Ionicons name="document-text" size={18} color={colors.warning} />
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Notes (Optional)</Text>
                  </View>
                  <TextInput
                    style={[styles.textInput, styles.textArea, { 
                      borderColor: colors.border,
                      color: colors.text,
                      backgroundColor: colors.background
                    }]}
                    value={editPaymentNotes}
                    onChangeText={setEditPaymentNotes}
                    placeholder="Add any notes about this payment"
                    placeholderTextColor={colors.lightText}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Update Payment Button - Inside scrollable content */}
                <View style={styles.recordPaymentContainer}>
                  <TouchableOpacity
                    style={[
                      styles.recordPaymentButton, 
                      { 
                        backgroundColor: isUpdatingPayment ? colors.lightText : colors.warning,
                        opacity: isUpdatingPayment ? 0.7 : 1
                      }
                    ]}
                    onPress={handleEditPayment}
                    activeOpacity={0.8}
                    disabled={isUpdatingPayment}
                  >
                    {isUpdatingPayment ? (
                      <>
                        <Ionicons name="hourglass" size={20} color="#FFFFFF" />
                        <Text style={styles.recordPaymentButtonText}>Updating...</Text>
                      </>
                    ) : (
                      <>
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                        <Text style={styles.recordPaymentButtonText}>Update Payment</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
        </Modal>
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
    maxHeight: '85%',
    flex: 1,
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
    marginBottom: 0,
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
