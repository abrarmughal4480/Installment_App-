import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../services/apiService';
import TokenService from '../services/tokenService';
import { useToast } from '../contexts/ToastContext';



export default function ManagerDashboard() {
  const router = useRouter();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [user, setUser] = useState<any>(null);
  const [installments, setInstallments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');
  const [lastTap, setLastTap] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const [createLastTap, setCreateLastTap] = useState(0);
  const [isCreateDragging, setIsCreateDragging] = useState(false);
  const [createDragValue, setCreateDragValue] = useState(0);
  const insets = useSafeAreaInsets();

  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;

  
  const dragTranslateY = useRef(new Animated.Value(0)).current;
  const dragOpacity = useRef(new Animated.Value(1)).current;
  
  
  const createDragTranslateY = useRef(new Animated.Value(0)).current;
  const createDragOpacity = useRef(new Animated.Value(1)).current;
  
  
  const modalSlideY = useRef(new Animated.Value(200)).current; 
  const modalOpacity = useRef(new Animated.Value(0)).current;
  
  
  const createModalSlideY = useRef(new Animated.Value(200)).current;
  const createModalOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      const dotsAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(dot1Opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dot1Opacity, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dot2Opacity, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(dot3Opacity, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );

      dotsAnimation.start();

      return () => {
        dotsAnimation.stop();
      };
    }
  }, [isLoading]);

  
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
  }, []);

  useEffect(() => {
    if (user) {
      loadInstallments();
    }
  }, [user]);

  
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        loadInstallments(false); 
      }, 5000); 

      return () => clearInterval(interval);
    }
  }, [user]);

  
  useEffect(() => {
    if (!showProfileModal) {
      
      dragTranslateY.setValue(0);
      dragOpacity.setValue(1);
      modalSlideY.setValue(200);
      modalOpacity.setValue(0);
      setIsDragging(false);
      setDragValue(0);
      setLastTap(0);
    }
  }, [showProfileModal]);

  
  useEffect(() => {
    if (!showCreateModal) {
      
      createDragTranslateY.setValue(0);
      createDragOpacity.setValue(1);
      createModalSlideY.setValue(200);
      createModalOpacity.setValue(0);
      setIsCreateDragging(false);
      setCreateDragValue(0);
      setCreateLastTap(0);
    }
  }, [showCreateModal]);

  
  useEffect(() => {
    if (showProfileModal) {
      
      setTimeout(() => {
        
        Animated.parallel([
          Animated.timing(modalSlideY, {
            toValue: 0,
            duration: 200, 
            useNativeDriver: true,
          }),
          Animated.timing(modalOpacity, {
            toValue: 1,
            duration: 200, 
            useNativeDriver: true,
          }),
        ]).start();
      }, 10); 
    }
  }, [showProfileModal]);

  
  useEffect(() => {
    if (showCreateModal) {
      
      setTimeout(() => {
        
        Animated.parallel([
          Animated.timing(createModalSlideY, {
            toValue: 0,
            duration: 200, 
            useNativeDriver: true,
          }),
          Animated.timing(createModalOpacity, {
            toValue: 1,
            duration: 200, 
            useNativeDriver: true,
          }),
        ]).start();
      }, 10); 
    }
  }, [showCreateModal]);

  const loadUserData = async () => {
    try {
      const token = await TokenService.getToken();
      
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

  const loadInstallments = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }
      
      const response = await apiService.getInstallments('', true);
      
      if (response.success) {
        setInstallments(response.installments || []);
      } else {
        
        if (showLoader) {
          showError('Failed to load installment data');
        }
      }
    } catch (error) {
      if (showLoader) {
        showError('Failed to load installment data');
      }
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInstallments(false); 
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
      setShowProfileModal(false);
    } else {
      setLastTap(now);
    }
  };

  
  const handleCreateDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (createLastTap && (now - createLastTap) < DOUBLE_TAP_DELAY) {
      setShowCreateModal(false);
    } else {
      setCreateLastTap(now);
    }
  };

  
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragMove = (event: any) => {
    const { translationY } = event.nativeEvent;
    
    
    if (translationY >= 0 && translationY <= 500) {
      
      dragTranslateY.setValue(translationY);
      setDragValue(translationY);
      
      
      const opacity = Math.max(0.2, 1 - (translationY / 500));
      dragOpacity.setValue(opacity);
    }
  };

  const handleDragEnd = (event: any) => {
    const { translationY, velocityY } = event.nativeEvent;
    
    setIsDragging(false);
    setDragValue(0);
    
    
    if (translationY > 150 || velocityY > 800) {
      
      Animated.parallel([
        Animated.timing(dragTranslateY, {
          toValue: 600, 
          duration: 200, 
          useNativeDriver: true,
        }),
        Animated.timing(dragOpacity, {
          toValue: 0,
          duration: 200, 
          useNativeDriver: true,
        }),
        
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        
        setShowProfileModal(false);
        
      });
      
      
      setTimeout(() => {
        if (!showProfileModal) {
          modalOpacity.setValue(0);
        }
      }, 300);
    } else {
      
      Animated.parallel([
        Animated.spring(dragTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 120,
          friction: 9,
          overshootClamping: true,
        }),
        Animated.spring(dragOpacity, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 9,
          overshootClamping: true,
        }),
      ]).start();
    }
  };

  
  const handleCreateDragStart = () => {
    setIsCreateDragging(true);
  };

  const handleCreateDragMove = (event: any) => {
    const { translationY } = event.nativeEvent;
    
    
    if (translationY >= 0 && translationY <= 500) {
      
      createDragTranslateY.setValue(translationY);
      setCreateDragValue(translationY);
      
      
      const opacity = Math.max(0.2, 1 - (translationY / 500));
      createDragOpacity.setValue(opacity);
    }
  };

  const handleCreateDragEnd = (event: any) => {
    const { translationY, velocityY } = event.nativeEvent;
    
    setIsCreateDragging(false);
    setCreateDragValue(0);
    
    
    if (translationY > 150 || velocityY > 800) {
      
      Animated.parallel([
        Animated.timing(createDragTranslateY, {
          toValue: 600, 
          duration: 200, 
          useNativeDriver: true,
        }),
        Animated.timing(createDragOpacity, {
          toValue: 0,
          duration: 200, 
          useNativeDriver: true,
        }),
        
        Animated.timing(createModalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        
        setShowCreateModal(false);
        
      });
      
      
      setTimeout(() => {
        if (!showCreateModal) {
          createModalOpacity.setValue(0);
        }
      }, 300);
    } else {
      
      Animated.parallel([
        Animated.spring(createDragTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 120,
          friction: 9,
          overshootClamping: true,
        }),
        Animated.spring(createDragOpacity, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 9,
          overshootClamping: true,
        }),
      ]).start();
    }
  };

  
  const filteredInstallments = useMemo(() => {
    if (filter === 'all') return installments;
    
    return installments.filter(installment => {
      switch (filter) {
        case 'active':
          return installment.status === 'active';
        case 'overdue':
          return installment.status === 'overdue';
        case 'completed':
          return installment.status === 'completed';
        default:
          return true;
      }
    });
  }, [installments, filter]);

  
  const filterCounts = useMemo(() => {
    const all = installments.length;
    const active = installments.filter(i => i.status === 'active').length;
    const overdue = installments.filter(i => i.status === 'overdue').length;
    const completed = installments.filter(i => i.status === 'completed').length;
    
    return { all, active, overdue, completed };
  }, [installments]);

  
  const stats = {
    totalInstallments: installments.length,
    activeInstallments: installments.filter(i => i.status === 'active').length,
    completedInstallments: installments.filter(i => i.status === 'completed').length,
    overdueInstallments: installments.filter(i => i.status === 'overdue').length,
    totalRevenue: installments.reduce((sum, i) => sum + (i.totalAmount || 0), 0),
    collectedRevenue: installments.reduce((sum, i) => {
      
      const advanceAmount = i.advanceAmount || 0;
      const paidFromInstallments = (i.installments || []).reduce((installmentSum: number, installment: any) => {
        return installmentSum + (installment.actualPaidAmount || 0);
      }, 0);
      return sum + advanceAmount + paidFromInstallments;
    }, 0),
    pendingRevenue: installments.reduce((sum, i) => {
      const totalAmount = i.totalAmount || 0;
      const advanceAmount = i.advanceAmount || 0;
      const paidFromInstallments = (i.installments || []).reduce((installmentSum: number, installment: any) => {
        return installmentSum + (installment.actualPaidAmount || 0);
      }, 0);
      const collected = advanceAmount + paidFromInstallments;
      return sum + (totalAmount - collected);
    }, 0),
  };

  
  const handleLogout = async () => {
    try {
      await TokenService.removeToken();
      await apiService.logout();
      setUser(null);
      showSuccess('Logged out successfully');
      router.push('/');
    } catch (error) {
      
      setUser(null);
      showSuccess('Logged out successfully');
      router.push('/');
    }
  };

  const handleInstallmentPress = (installment: any) => {
    
    router.push({
      pathname: '/installmentDetails',
      params: { 
        installmentId: installment.id,
        customerId: installment.customerId,
        customerName: installment.customerName,
        productName: installment.productName,
        totalAmount: installment.totalAmount,
        installmentCount: installment.installmentCount,
        monthlyInstallment: installment.monthlyInstallment
      }
    });
  };

  const handleEditInstallment = (installment: any) => {

    
    const remainingInstallments = installment.remainingInstallmentCount || 0;
    const remainingAmount = installment.remainingAmount || 0;
    const newMonthlyInstallment = installment.newMonthlyInstallment || 0;
    const totalInstallments = installment.installmentCount || 0;
    const totalPaidInstallments = installment.totalPaidInstallments || 0;

    
    router.push({
      pathname: '/createInstallment',
      params: {
        editMode: 'true',
        installmentId: installment.id,
        customerId: installment.customerId,
        customerName: installment.customerName,
        customerEmail: installment.customerEmail,
        customerPhone: installment.customerPhone,
        customerAddress: installment.customerAddress,
        productName: installment.productName,
        productDescription: installment.productDescription,
        totalAmount: remainingAmount.toString(),
        advanceAmount: '0', 
        installmentCount: remainingInstallments.toString(),
        installmentUnit: installment.installmentUnit,
        monthlyInstallment: newMonthlyInstallment.toString(),
        dueDay: installment.dueDay || '15',
        originalTotalInstallments: totalInstallments.toString(),
        paidInstallments: totalPaidInstallments.toString(),
        remainingAmount: remainingAmount.toString()
      }
    });
  };

  const handleDeleteInstallment = async (installment: any) => {
    try {
      const response = await apiService.deleteInstallment(installment.id);
      
      if (response.success) {
        showSuccess('Installment deleted successfully');
        
        loadInstallments(false);
      } else {
        showError(response.message || 'Failed to delete installment');
      }
    } catch (error) {
      showError('Failed to delete installment. Please try again.');
    }
  };

  
  const shimmerOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isLoading) {
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
  }, [isLoading]);

  
  const SkeletonCard = () => {

    return (
      <View style={[styles.skeletonCard, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonInfo}>
            <Animated.View style={[styles.skeletonLine, styles.skeletonTitle, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonLine, styles.skeletonSubtitle, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
          </View>
          <Animated.View style={[styles.skeletonBadge, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
        </View>
        
        <View style={styles.skeletonDetails}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonCol}>
              <Animated.View style={[styles.skeletonLine, styles.skeletonLabel, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
              <Animated.View style={[styles.skeletonLine, styles.skeletonValue, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
            </View>
            <View style={styles.skeletonCol}>
              <Animated.View style={[styles.skeletonLine, styles.skeletonLabel, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
              <Animated.View style={[styles.skeletonLine, styles.skeletonValue, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
            </View>
          </View>
          
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonCol}>
              <Animated.View style={[styles.skeletonLine, styles.skeletonLabel, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
              <Animated.View style={[styles.skeletonLine, styles.skeletonValue, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
            </View>
            <View style={styles.skeletonCol}>
              <Animated.View style={[styles.skeletonLine, styles.skeletonLabel, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
              <Animated.View style={[styles.skeletonLine, styles.skeletonValue, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
            </View>
          </View>
          
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonCol}>
              <Animated.View style={[styles.skeletonLine, styles.skeletonLabel, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
              <Animated.View style={[styles.skeletonLine, styles.skeletonValue, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
            </View>
            <View style={styles.skeletonCol}>
              <Animated.View style={[styles.skeletonLine, styles.skeletonLabel, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
              <Animated.View style={[styles.skeletonLine, styles.skeletonValue, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          <View>
            {isLoading ? (
              <>
                <Animated.View style={[styles.skeletonLine, styles.skeletonHeaderTitle, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
                <Animated.View style={[styles.skeletonLine, styles.skeletonHeaderSubtitle, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
              </>
            ) : (
              <>
                <Text style={styles.modernHeaderTitle}>Manager Dashboard</Text>
                <Text style={styles.modernHeaderSubtitle}>
                  Welcome back, {user?.name}
                </Text>
              </>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerIcon}
              onPress={() => setShowProfileModal(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="person" size={24} color="#FFFFFF" />
            </TouchableOpacity>
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

        {/* Revenue Summary */}
        <View style={[styles.revenueCard, { backgroundColor: colors.cardBackground }]}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.revenueGradient}
          >
            {isLoading ? (
              <>
                <Animated.View style={[styles.skeletonLine, styles.skeletonRevenueTitle, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
                <View style={styles.revenueStats}>
                  <View style={styles.revenueItem}>
                    <Animated.View style={[styles.skeletonLine, styles.skeletonRevenueLabel, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
                    <Animated.View style={[styles.skeletonLine, styles.skeletonRevenueValue, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
                  </View>
                  <View style={styles.revenueRow}>
                    <View style={styles.revenueItem}>
                      <Animated.View style={[styles.skeletonLine, styles.skeletonRevenueLabel, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
                      <Animated.View style={[styles.skeletonLine, styles.skeletonRevenueValue, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
                    </View>
                    <View style={styles.revenueItem}>
                      <Animated.View style={[styles.skeletonLine, styles.skeletonRevenueLabel, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
                      <Animated.View style={[styles.skeletonLine, styles.skeletonRevenueValue, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.revenueTitle}>Revenue Overview</Text>
                <View style={styles.revenueStats}>
                  <View style={styles.revenueItem}>
                    <Text style={styles.revenueLabel}>Total</Text>
                    <Text style={styles.revenueValue}>{formatCurrency(stats.totalRevenue)}</Text>
                  </View>
                  <View style={styles.revenueRow}>
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>Collected</Text>
                      <Text style={[styles.revenueValue, { color: '#4ECDC4' }]}>
                        {formatCurrency(stats.collectedRevenue)}
                      </Text>
                    </View>
                    <View style={styles.revenueItem}>
                      <Text style={styles.revenueLabel}>Pending</Text>
                      <Text style={[styles.revenueValue, { color: '#FF6B6B' }]}>
                        {formatCurrency(stats.pendingRevenue)}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </LinearGradient>
        </View>

        {/* Modern Filter Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.modernFilterScrollView}
          contentContainerStyle={styles.modernFilterContainer}
        >
          {(['all', 'active', 'overdue', 'completed'] as const).map(seg => {
            const isActive = filter === seg;
            const count = filterCounts[seg];
            const color =
              seg === 'active' ? colors.primary :
              seg === 'overdue' ? colors.danger :
              seg === 'completed' ? colors.success :
              colors.lightText;
            
            return (
              <TouchableOpacity
                key={seg}
                onPress={() => {
                  
                  setFilter(seg);
                }}
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
                  {seg[0].toUpperCase() + seg.slice(1)}{count > 0 ? ` (${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Installment List */}
        <View style={styles.installmentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Installment Management
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : filteredInstallments.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
              <Ionicons name="receipt-outline" size={48} color={colors.lightText} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {installments.length === 0 ? 'No Installments Yet' : 'No Installments Found'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.lightText }]}>
                {installments.length === 0 
                  ? 'Start by creating your first installment plan.'
                  : 'Try adjusting your filters to see more installments.'
                }
              </Text>
            </View>
          ) : (
            filteredInstallments.map((installment) => (
            <TouchableOpacity 
              key={installment.id} 
              style={[styles.installmentCard, { backgroundColor: colors.cardBackground }]}
              onPress={() => handleInstallmentPress(installment)}
              activeOpacity={0.7}
            >
              <View style={styles.installmentHeader}>
                <View style={styles.installmentInfo}>
                  <Text style={[styles.installmentCustomerName, { color: colors.text }]}>
                    {installment.customerName}
                  </Text>
                  <Text style={[styles.installmentId, { color: colors.lightText }]}>
                    Installment #{installment.installmentNumber} - ID: {installment.customerId}
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: 
                      installment.status === 'completed' ? colors.success :
                      installment.status === 'overdue' ? colors.danger :
                      colors.warning
                    }
                  ]}>
                    <Text style={styles.statusText}>
                      {installment.status.toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.editButton, { backgroundColor: colors.primary }]}
                    onPress={(e) => {
                      e.stopPropagation(); 
                      handleEditInstallment(installment);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.deleteButton, { backgroundColor: colors.danger }]}
                    onPress={(e) => {
                      e.stopPropagation(); 
                      handleDeleteInstallment(installment);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.installmentDetails}>
                <View style={styles.installmentRow}>
                  <View style={styles.installmentCol}>
                    <Text style={[styles.installmentLabel, { color: colors.lightText }]}>Product</Text>
                    <Text style={[styles.installmentValue, { color: colors.text }]}>
                      {installment.productName}
                    </Text>
                  </View>
                  <View style={styles.installmentCol}>
                    <Text style={[styles.installmentLabel, { color: colors.lightText }]}>Amount</Text>
                    <Text style={[styles.installmentValue, { color: colors.primary }]}>
                      {formatCurrency(installment.amount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.installmentRow}>
                  <View style={styles.installmentCol}>
                    <Text style={[styles.installmentLabel, { color: colors.lightText }]}>Due Date</Text>
                    <Text style={[styles.installmentValue, { color: colors.text }]}>
                      {new Date(installment.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.installmentCol}>
                    <Text style={[styles.installmentLabel, { color: colors.lightText }]}>Total Amount</Text>
                    <Text style={[styles.installmentValue, { color: colors.text }]}>
                      {formatCurrency(installment.totalAmount)}
                    </Text>
                  </View>
                </View>

                <View style={styles.installmentRow}>
                  <View style={styles.installmentCol}>
                    <Text style={[styles.installmentLabel, { color: colors.lightText }]}>Progress</Text>
                    <Text style={[styles.installmentValue, { color: colors.primary }]}>
                      {installment.totalPaidInstallments || 0}/{installment.installmentCount} paid
                    </Text>
                  </View>
                  <View style={styles.installmentCol}>
                    <Text style={[styles.installmentLabel, { color: colors.lightText }]}>Remaining</Text>
                    <Text style={[styles.installmentValue, { color: colors.warning }]}>
                      {installment.totalUnpaidInstallments || 0} installments
                    </Text>
                  </View>
                </View>

                {installment.paidDate && (
                  <View style={styles.installmentPaidInfo}>
                    <Text style={[styles.installmentPaidLabel, { color: colors.success }]}>
                      Paid on: {new Date(installment.paidDate).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Profile Modal */}
      {showProfileModal && (
        <Animated.View style={[
          styles.modalOverlay,
          {
            opacity: modalOpacity,
            transform: [{ translateY: modalSlideY }],
          }
        ]}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowProfileModal(false);
              
              modalOpacity.setValue(0);
            }}
          />
          <PanGestureHandler
            onGestureEvent={handleDragMove}
            onHandlerStateChange={({ nativeEvent }) => {
              if (nativeEvent.state === State.BEGAN) {
                handleDragStart();
              } else if (nativeEvent.state === State.END) {
                handleDragEnd({ nativeEvent });
              }
            }}
          >
            <Animated.View style={[
              styles.profileModal, 
              { 
                backgroundColor: isDragging ? 'rgba(255, 255, 255, 0.95)' : colors.cardBackground,
                paddingBottom: Math.max(insets.bottom, 10) + 10, 
                transform: [
                  { translateY: dragTranslateY }
                ],
                opacity: dragOpacity,
                elevation: isDragging ? 25 : 20,
                shadowOpacity: isDragging ? 0.4 : 0.25,
              }
            ]}>
              {/* Drag Handle */}
              <TouchableOpacity 
                style={styles.dragHandleContainer}
                onPress={handleDoubleTap}
                activeOpacity={1}
              >
                <View style={[
                  styles.dragHandle, 
                  { 
                    backgroundColor: isDragging ? 
                      (dragValue > 150 ? colors.danger : colors.primary) : 
                      colors.lightText,
                    opacity: isDragging ? 1 : 0.3,
                    transform: [{ scaleY: isDragging ? 1.2 : 1 }],
                  }
                ]} />
                {isDragging && (
                  <Animated.Text 
                    style={[
                      styles.dragHint, 
                      { 
                        color: dragValue > 150 ? colors.danger : colors.primary,
                        opacity: dragOpacity,
                      }
                    ]}
                  >
                    {dragValue > 150 ? 'Release to close' : 'Drag down to close'}
                  </Animated.Text>
                )}
              </TouchableOpacity>
            
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>{user?.name}</Text>
                <Text style={[styles.profileEmail, { color: colors.lightText }]}>{user?.email}</Text>
                <View style={[styles.roleBadge, { backgroundColor: colors.success }]}>
                  <Text style={styles.roleText}>Manager</Text>
                </View>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.profileActions}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.background }]}
                onPress={() => setShowProfileModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="settings" size={20} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.text }]}>Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.danger }]}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out" size={20} color="#FFFFFF" />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      )}

      {/* Create Installment Modal */}
      {showCreateModal && (
        <Animated.View style={[
          styles.modalOverlay,
          {
            opacity: createModalOpacity,
            transform: [{ translateY: createModalSlideY }],
          }
        ]}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => {
              setShowCreateModal(false);
              
              createModalOpacity.setValue(0);
            }}
          />
          <PanGestureHandler
            onGestureEvent={handleCreateDragMove}
            onHandlerStateChange={({ nativeEvent }) => {
              if (nativeEvent.state === State.BEGAN) {
                handleCreateDragStart();
              } else if (nativeEvent.state === State.END) {
                handleCreateDragEnd({ nativeEvent });
              }
            }}
          >
            <Animated.View style={[
              styles.createModal, 
              { 
                backgroundColor: isCreateDragging ? 'rgba(255, 255, 255, 0.95)' : colors.cardBackground,
                paddingBottom: Math.max(insets.bottom, 10) + 10, 
                transform: [
                  { translateY: createDragTranslateY }
                ],
                opacity: createDragOpacity,
                elevation: isCreateDragging ? 25 : 20,
                shadowOpacity: isCreateDragging ? 0.4 : 0.25,
              }
            ]}>
              {/* Drag Handle */}
              <TouchableOpacity 
                style={styles.dragHandleContainer}
                onPress={handleCreateDoubleTap}
                activeOpacity={1}
              >
                <View style={[
                  styles.dragHandle, 
                  { 
                    backgroundColor: isCreateDragging ? 
                      (createDragValue > 150 ? colors.danger : colors.primary) : 
                      colors.lightText,
                    opacity: isCreateDragging ? 1 : 0.3,
                    transform: [{ scaleY: isCreateDragging ? 1.2 : 1 }],
                  }
                ]} />
                {isCreateDragging && (
                  <Animated.Text 
                    style={[
                      styles.dragHint, 
                      { 
                        color: createDragValue > 150 ? colors.danger : colors.primary,
                        opacity: createDragOpacity,
                      }
                    ]}
                  >
                    {createDragValue > 150 ? 'Release to close' : 'Drag down to close'}
                  </Animated.Text>
                )}
              </TouchableOpacity>
              
              <View style={styles.createModalHeader}>
                <Text style={[styles.createModalTitle, { color: colors.text }]}>
                  Create Installment
                </Text>
              </View>
              
              <ScrollView style={styles.createModalContent} showsVerticalScrollIndicator={false}>
                <Text style={[styles.createModalSubtitle, { color: colors.lightText }]}>
                  This will create a new installment for an existing customer or create a new customer if they don&apos;t exist.
                </Text>
                
                <TouchableOpacity
                  style={[styles.createButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setShowCreateModal(false);
                    
                    setTimeout(() => {
                      router.push('/createInstallment' as any);
                    }, 300);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.createButtonText}>Create New Installment</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      )}
      </View>
    </GestureHandlerRootView>
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
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6366F1',
    marginHorizontal: 4,
  },
  dot1: {},
  dot2: {},
  dot3: {},
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  loadingSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 24,
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  logoutButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  
  profileLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  scrollView: { flex: 1, marginTop: -10 },

  
  modernFilterScrollView: {
    marginTop: 24,
  },
  modernFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 0,
    paddingRight: 20, 
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
    flexShrink: 0, 
  },
  modernFilterText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  
  revenueCard: {
    marginTop: 20,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  revenueGradient: {
    padding: 24,
  },
  revenueTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  revenueStats: {
    flexDirection: 'column',
    gap: 16,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  revenueItem: {
    flex: 1,
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  
  installmentSection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  installmentCard: {
    marginBottom: 16,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  installmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  installmentInfo: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  installmentCustomerName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  installmentId: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  installmentDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  installmentRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  installmentCol: {
    flex: 1,
    marginRight: 16,
  },
  installmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  installmentValue: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  installmentPaidInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    alignItems: 'center',
  },
  installmentPaidLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },

  
  skeletonCard: {
    marginBottom: 16,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
  skeletonDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  skeletonRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  skeletonCol: {
    flex: 1,
    marginRight: 16,
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

  
  skeletonRevenueTitle: {
    height: 24,
    width: '60%',
    marginBottom: 20,
  },
  skeletonRevenueLabel: {
    height: 14,
    width: '50%',
    marginBottom: 8,
  },
  skeletonRevenueValue: {
    height: 20,
    width: '70%',
  },

  
  skeletonHeaderTitle: {
    height: 28,
    width: '70%',
    marginBottom: 8,
  },
  skeletonHeaderSubtitle: {
    height: 16,
    width: '50%',
  },

  
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  modalBackdrop: {
    flex: 1,
  },
  profileModal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    marginTop: 20, 
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 20,
    minHeight: 32, 
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
  dragHint: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
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

  
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  profileActions: {
    paddingHorizontal: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  
  emptyState: {
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptySubtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
  },

  
  createModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    maxHeight: '80%',
  },
  createModalHeader: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  createModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  createModalContent: {
    padding: 24,
  },
  createModalSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
