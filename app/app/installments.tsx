import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, Installment } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';



export default function InstallmentsPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const insets = useSafeAreaInsets();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  
  const [isCustomerView, setIsCustomerView] = useState(false);


  
  const userData = isCustomerView ? {
    name: customer?.customerName || params.customerName as string || 'Customer',
    phone: customer?.customerPhone || params.customerPhone as string || 'N/A',
    address: customer?.customerAddress || params.customerAddress as string || 'N/A',
    email: customer?.customerEmail || params.customerEmail as string || 'N/A'
  } : user ? {
    name: user.name,
    phone: user.phone,
    address: user.address,
    email: user.email
  } : {
    name: 'Guest User',
    phone: 'N/A',
    address: 'N/A',
    email: 'N/A'
  };

  
  const latestCustomerInfo = useMemo(() => {
    if (isCustomerView || installments.length === 0) return null;
    
    
    const sortedInstallments = [...installments].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    const latestInstallment = sortedInstallments[0];
    return {
      name: latestInstallment?.customerName || 'N/A',
      phone: latestInstallment?.customerPhone || 'N/A',
      address: latestInstallment?.customerAddress || 'N/A',
      email: latestInstallment?.customerEmail || 'N/A'
    };
  }, [installments, isCustomerView]);

  
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
    checkViewTypeAndLoad();
  }, []);

  
  useEffect(() => {
    const interval = setInterval(() => {
      if (isCustomerView) {
        
        const savedCustomerId = AsyncStorage.getItem('customerId').then(customerId => {
          if (customerId) {
            loadCustomerDataFromAPI(customerId, false);
          }
        });
      } else {
        
        loadInstallments(false);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [isCustomerView]);

  const checkViewTypeAndLoad = async () => {
    try {
      
      
      if (params.customerId && params.customerName) {
        setIsCustomerView(true);
        loadCustomerInstallments();
        return;
      }

      const savedCustomerId = await AsyncStorage.getItem('customerId');
      
      if (savedCustomerId) {
        
        await loadCustomerDataFromAPI(savedCustomerId);
      } else {
        
        setIsCustomerView(false);
        loadUserData();
      }
    } catch (error) {
      
      setIsCustomerView(false);
      loadUserData();
    }
  };

  const loadCustomerDataFromAPI = async (customerId: string, showLoader: boolean = true) => {
    try {
      if (showLoader) setIsLoading(true);
      const response = await apiService.getCustomerInstallments(customerId);
      
      if (response.success) {
        setIsCustomerView(true);
        setInstallments(response.installments || []);
        setCustomer({
          customerId: response.customer?.customerId,
          customerName: response.customer?.customerName,
          customerEmail: response.customer?.customerEmail,
          customerPhone: response.customer?.customerPhone,
          customerAddress: response.customer?.customerAddress
        });
      } else {
        
        showError('Customer ID not found. Please login again with your Customer ID');
        setTimeout(() => {
          router.replace('/');
        }, 2000);
      }
    } catch (error) {
      showError('Please check your internet connection and try again.');
      setTimeout(() => {
        router.replace('/');
      }, 2000);
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && !isCustomerView) {
      loadInstallments();
    }
  }, [user]);

  const loadCustomerInstallments = async () => {
    try {
      setIsLoading(true);
      
      
      const installmentsData = params.installments ? JSON.parse(params.installments as string) : [];
      setInstallments(installmentsData);
      
      
      setCustomer({
        customerId: params.customerId,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        customerPhone: params.customerPhone,
        customerAddress: params.customerAddress
      });
      
    } catch (error) {
      showError('Failed to load customer installments');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      
      const response = await apiService.getProfile();
      if (response.success && response.user) {
        setUser(response.user);
      } else {
        showError('Please login again');
        router.push('/');
      }
    } catch (error) {
      showError('Please login again');
      router.push('/');
    }
  };

  const loadInstallments = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setIsLoading(true);
      
      if (!user) {
        showError('User not authenticated');
        router.push('/');
        return;
      }

      const response = await apiService.getInstallments(user.customerId, user.type === 'admin');
      
      if (response.success) {
        setInstallments(response.installments);
      } else {
        showError('Failed to load installments');
      }
    } catch (error) {
      showError('Failed to load installments');
    } finally {
      if (showLoader) setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    if (isCustomerView) {
      
      const savedCustomerId = await AsyncStorage.getItem('customerId');
      if (savedCustomerId) {
        await loadCustomerDataFromAPI(savedCustomerId, false);
      }
    } else {
      
      await loadInstallments(false);
    }
    setRefreshing(false);
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

  
  const getNextDueDate = (installment: Installment) => {
    
    if (installment.nextUnpaid && installment.nextUnpaid.dueDate) {
      return installment.nextUnpaid.dueDate;
    }
    
    
    if (installment.installments && installment.installments.length > 0) {
      const unpaidInstallment = installment.installments.find(inst => inst.status === 'pending');
      if (unpaidInstallment) {
        return unpaidInstallment.dueDate;
      }
    }
    
    return null;
  };
  const percent = (paid: number, total: number) =>
    total <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((paid / total) * 100)));

  const filtered = useMemo(() => {
    let filteredInstallments = installments;
    
    
    if (filter !== 'all') {
      filteredInstallments = installments.filter(i => i.status === filter);
    }
    
    
    return filteredInstallments.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [installments, filter]);

  
  const totals = useMemo(() => {
    const totalPlans = installments.length;
    const active = installments.filter(i => i.status === 'active').length;
    const overdue = installments.filter(i => i.status === 'overdue').length;
    const completed = installments.filter(i => i.status === 'completed').length;

    const totalAmount = installments.reduce((s, i) => s + roundUp(i.totalAmount || 0), 0);
    const paidAmount = installments.reduce((s, i) => s + roundUp(i.totalPaidAmount || 0), 0);
    const remainingAmount = totalAmount - paidAmount;

    const completion = percent(paidAmount, totalAmount);

    return {
      totalPlans, active, overdue, completed,
      totalAmount, paidAmount, remainingAmount, completion
    };
  }, [installments]);

  const getStatusColor = (status: Installment['status']) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'overdue': return colors.danger;
      case 'active': return colors.primary;
      default: return colors.lightText;
    }
  };


  const handleCardPress = (installment: Installment) => {
    
    router.push({
      pathname: '/paymentHistory',
      params: { installment: JSON.stringify(installment) }
    });
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
            <View style={styles.headerLeft}>
              <View style={styles.skeletonHeaderText}>
                <View style={[styles.skeletonLine, { width: 200, height: 28, marginBottom: 8 }]} />
                <View style={[styles.skeletonLine, { width: 150, height: 16 }]} />
              </View>
            </View>
            <View style={[styles.skeletonCircle, { width: 50, height: 50 }]} />
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

          {/* Skeleton Filter Pills */}
          <View style={styles.modernFilterContainer}>
            {[1, 2, 3, 4].map((_, index) => (
              <View key={index} style={[styles.skeletonFilterPill]} />
            ))}
          </View>

          {/* Skeleton Installment Cards */}
          {[1, 2, 3].map((_, index) => (
            <View key={index} style={[styles.modernItemCard, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.modernItemHeader}>
                <View style={styles.itemTitleContainer}>
                  <View style={[styles.skeletonLine, { width: 150, height: 18, marginBottom: 4 }]} />
                  <View style={[styles.skeletonLine, { width: 100, height: 13 }]} />
                </View>
                <View style={[styles.skeletonCircle, { width: 36, height: 36 }]} />
              </View>

              <View style={styles.modernItemContent}>
                {/* Paid amount skeleton */}
                <View style={styles.paidRow}>
                  <View style={[styles.skeletonLine, { width: 40, height: 12 }]} />
                  <View style={[styles.skeletonLine, { width: 100, height: 18 }]} />
                </View>

                {/* Remaining and Monthly skeleton */}
                <View style={styles.modernItemRow}>
                  <View style={styles.modernItemCol}>
                    <View style={[styles.skeletonLine, { width: 60, height: 12, marginBottom: 4 }]} />
                    <View style={[styles.skeletonLine, { width: 80, height: 16 }]} />
                  </View>
                  <View style={styles.modernItemCol}>
                    <View style={[styles.skeletonLine, { width: 50, height: 12, marginBottom: 4 }]} />
                    <View style={[styles.skeletonLine, { width: 70, height: 16 }]} />
                  </View>
                </View>

                {/* Progress skeleton */}
                <View style={styles.modernProgressContainer}>
                  <View style={styles.progressHeader}>
                    <View style={[styles.skeletonLine, { width: 50, height: 14 }]} />
                    <View style={[styles.skeletonLine, { width: 30, height: 16 }]} />
                  </View>
                  <View style={[styles.skeletonProgressBar, { backgroundColor: colors.border }]}>
                    <View style={[styles.skeletonProgressFill, { width: '40%' }]} />
                  </View>
                </View>

                {/* Due date skeleton */}
                <View style={styles.modernItemFooter}>
                  <View style={styles.dueDateRow}>
                    <View style={[styles.skeletonLine, { width: 60, height: 12 }]} />
                    <View style={[styles.skeletonLine, { width: 80, height: 16 }]} />
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
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
          <View style={styles.headerLeft}>
            {isCustomerView && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.replace('/')}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <View style={styles.headerTextContainer}>
              <Text style={styles.modernHeaderTitle}>
                Installments
              </Text>
              <Text style={styles.modernHeaderSubtitle}>
                {isCustomerView ? 'Customer payment plans' : 
                 latestCustomerInfo ? 'Customer payment plans' : 'Track all your payment plans'}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => setShowProfileModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="person" size={24} color="#FFFFFF" />
          </TouchableOpacity>
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

        {/* Modern Financial Summary Card */}
        <View style={[styles.modernSummaryCard, { backgroundColor: colors.cardBackground }]}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.summaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.summaryTitle}>Financial Overview</Text>
            <View style={styles.summaryContainer}>
              <View style={styles.totalAmountRow}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totals.totalAmount)}</Text>
              </View>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Remaining</Text>
                  <Text style={[styles.summaryValue, { 
                    color: '#FF6B6B',
                    textShadowColor: 'rgba(0, 0, 0, 0.4)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }]}>{formatCurrency(totals.remainingAmount)}</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Paid</Text>
                  <Text style={[styles.summaryValue, { 
                    color: '#4ECDC4',
                    textShadowColor: 'rgba(0, 0, 0, 0.4)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 2,
                  }]}>{formatCurrency(totals.paidAmount)}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.modernProgressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Overall Progress</Text>
                <Text style={styles.progressPercentage}>{totals.completion}%</Text>
              </View>
              <View style={styles.modernProgressBar}>
                <View
                  style={[
                    styles.modernProgressFill,
                    { width: `${totals.completion}%` }
                  ]}
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Modern Filter Pills */}
        <View style={styles.modernFilterContainer}>
          {(['all', 'active', 'overdue', 'completed'] as const).map(seg => {
            const isActive = filter === seg;
            const color =
              seg === 'active' ? colors.primary :
              seg === 'overdue' ? colors.danger :
              seg === 'completed' ? colors.success :
              colors.lightText;
            
            return (
              <TouchableOpacity
                key={seg}
                onPress={() => setFilter(seg)}
                style={[
                  styles.modernFilterPill,
                  isActive && { backgroundColor: color, borderColor: color }
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.modernFilterText,
                    isActive ? { color: '#FFFFFF' } : { color: color }
                  ]}
                >
                  {seg[0].toUpperCase() + seg.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Modern Installment Cards */}
        {filtered.length === 0 ? (
          <View style={styles.modernEmptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIconText}>No Data</Text>
            </View>
            <Text style={[styles.modernEmptyText, { color: colors.lightText }]}>
              No installments found
            </Text>
            <Text style={[styles.modernEmptySubtext, { color: colors.lightText }]}>
              Try adjusting your filters
            </Text>
          </View>
        ) : (
          filtered.map((i) => (
            <TouchableOpacity 
              key={i.id} 
              style={[styles.modernItemCard, { backgroundColor: colors.cardBackground }]}
              onPress={() => handleCardPress(i)}
              activeOpacity={0.7}
            >
              <View style={styles.modernItemHeader}>
                <View style={styles.itemTitleContainer}>
                  <Text numberOfLines={1} style={[styles.modernItemTitle, { color: colors.text }]}>
                    {i.productName}
                  </Text>
                  <View style={styles.itemSubtitleContainer}>
                    <Text style={[styles.modernItemSubtitle, { color: colors.lightText }]}>
                      {(i.totalPaidInstallments || 0)}/{(i.totalUnpaidInstallments || 0) + (i.totalPaidInstallments || 0)} installments
                    </Text>
                  </View>
                </View>
                <View style={styles.historyIconContainer}>
                  <Ionicons name="time" size={20} color={colors.primary} />
                </View>
              </View>

              <View style={styles.modernItemContent}>
                {/* Paid amount - Full width */}
                <View style={styles.paidRow}>
                  <Text style={[styles.modernItemLabel, { color: colors.lightText }]}>Paid</Text>
                  <Text style={[styles.modernItemValue, { color: colors.success, fontSize: 18 }]}>
                    {formatCurrency(roundUp(i.totalPaidAmount || 0))}
                  </Text>
                </View>

                {/* Remaining and Monthly - Two columns */}
                <View style={styles.modernItemRow}>
                  <View style={styles.modernItemCol}>
                    <Text style={[styles.modernItemLabel, { color: colors.lightText }]}>Remaining</Text>
                    <Text style={[styles.modernItemValue, { color: colors.danger }]}>
                      {formatCurrency(roundUp((i.totalAmount || 0) - (i.totalPaidAmount || 0)))}
                    </Text>
                  </View>
                  <View style={styles.modernItemCol}>
                    <Text style={[styles.modernItemLabel, { color: colors.lightText }]}>Monthly</Text>
                    <Text style={[styles.modernItemValue, { color: colors.primary }]}>
                      {formatCurrency(roundUp(i.monthlyInstallment || 0))}
                    </Text>
                  </View>
                </View>

                <View style={styles.modernProgressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={[styles.progressLabel, { color: colors.lightText }]}>Progress</Text>
                    <Text style={[styles.progressPercentage, { color: colors.text }]}>
                      {percent(roundUp(i.totalPaidAmount || 0), roundUp(i.totalAmount || 0))}%
                    </Text>
                  </View>
                  <View style={[styles.modernProgressBar, { backgroundColor: colors.border }]}>
                    <View
                      style={[
                        styles.modernProgressFill,
                        {
                          width: `${percent(roundUp(i.totalPaidAmount || 0), roundUp(i.totalAmount || 0))}%`,
                          backgroundColor: getStatusColor(i.status)
                        }
                      ]}
                    />
                  </View>
                </View>

                {i.status !== 'completed' && (
                  <View style={styles.modernItemFooter}>
                    <View style={styles.dueDateRow}>
                      <Text style={[styles.dueDateLabel, { color: colors.lightText }]}>Next Due: </Text>
                      <Text
                        style={[
                          styles.dueDateValue,
                          { color: i.status === 'overdue' ? colors.danger : colors.text }
                        ]}
                      >
                        {formatDate(getNextDueDate(i))}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Profile Modal */}
      {showProfileModal && (
        <View style={[styles.modalOverlay, { 
          top: -insets.top - 50,
          bottom: -insets.bottom - 20,
        }]}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowProfileModal(false)}
          >
            <View 
              style={[styles.profileModal, { backgroundColor: colors.cardBackground }]}
              onStartShouldSetResponder={() => true}
              onResponderGrant={() => {}}
            >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Profile Information</Text>
              <TouchableOpacity 
                onPress={() => setShowProfileModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.lightText} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.profileContent}>
              <View style={styles.profileItem}>
                <Ionicons name="person" size={20} color={colors.primary} />
                <View style={styles.profileItemContent}>
                  <Text style={[styles.profileLabel, { color: colors.lightText }]}>Name</Text>
                  <Text style={[styles.profileValue, { color: colors.text }]}>
                    {isCustomerView ? userData.name : (latestCustomerInfo?.name || userData.name)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.profileItem}>
                <Ionicons name="call" size={20} color={colors.primary} />
                <View style={styles.profileItemContent}>
                  <Text style={[styles.profileLabel, { color: colors.lightText }]}>Phone</Text>
                  <Text style={[styles.profileValue, { color: colors.text }]}>
                    {isCustomerView ? userData.phone : (latestCustomerInfo?.phone || userData.phone)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.profileItem}>
                <Ionicons name="mail" size={20} color={colors.primary} />
                <View style={styles.profileItemContent}>
                  <Text style={[styles.profileLabel, { color: colors.lightText }]}>Email</Text>
                  <Text style={[styles.profileValue, { color: colors.text }]}>
                    {isCustomerView ? userData.email : (latestCustomerInfo?.email || userData.email)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.profileItem}>
                <Ionicons name="location" size={20} color={colors.primary} />
                <View style={styles.profileItemContent}>
                  <Text style={[styles.profileLabel, { color: colors.lightText }]}>Address</Text>
                  <Text style={[styles.profileValue, { color: colors.text }]}>
                    {isCustomerView ? userData.address : (latestCustomerInfo?.address || userData.address)}
                  </Text>
                </View>
              </View>
            </View>
            </View>
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    fontSize: 28, 
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
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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

  
  modernFilterContainer: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 8,
    justifyContent: 'space-between',
  },
  modernFilterPill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  modernFilterText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  
  modernItemCard: {
    marginTop: 16,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  modernItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
  },
  itemTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  modernItemTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 4,
    letterSpacing: -0.3
  },
  itemSubtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modernItemSubtitle: { 
    fontSize: 13, 
    fontWeight: '500',
    letterSpacing: 0.2
  },

  modernItemContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  paidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
  },
  modernItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modernItemCol: {
    flex: 1,
    alignItems: 'center',
  },
  modernItemLabel: { 
    fontSize: 12, 
    fontWeight: '600', 
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  modernItemValue: { 
    fontSize: 16, 
    fontWeight: '800',
    letterSpacing: -0.3
  },

  modernItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dueDateContainer: {
    flex: 1,
  },
  dueDateLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  dueDateValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3
  },

  
  modernEmptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.5
  },
  modernEmptyText: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3
  },
  modernEmptySubtext: { 
    fontSize: 16, 
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2
  },

  
  modalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  profileModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
  },
  profileContent: {
    padding: 20,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileItemContent: {
    marginLeft: 16,
    flex: 1,
  },
  profileLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  profileValue: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },

  
  historyIconContainer: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
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
  skeletonHeaderText: {
    flex: 1,
  },
  skeletonFilterPill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    minHeight: 40,
    flex: 1,
    marginHorizontal: 4,
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
