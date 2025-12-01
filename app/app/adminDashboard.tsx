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
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiService } from '../services/apiService';
import TokenService from '../services/tokenService';
import { useToast } from '../contexts/ToastContext';
import { usePermissions } from '../contexts/PermissionContext';
import { Linking } from 'react-native';
import PDFGenerator from '../components/PDFGenerator';
// @ts-ignore
import ManagersSection from '../components/ManagersSection';
// @ts-ignore
import InvestorsSection from '../components/InvestorsSection';
// @ts-ignore
import LoansSection from '../components/LoansSection';
// @ts-ignore
import AdminsSection from '../components/AdminsSection';
// @ts-ignore  
import BottomNavBar from '../components/BottomNavBar';
import ConfirmationModal from '../components/ConfirmationModal';
// @ts-ignore
import InvestorDashboard from '../components/InvestorDashboard';



export default function AdminDashboard() {
  const router = useRouter();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const { hasViewPermission, hasAddPermission, isMainAdmin, isLoading: permissionsLoading, refreshPermissions, permissions } = usePermissions();
  const [user, setUser] = useState<any>(null);
  const [installments, setInstallments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastPermissionRefresh, setLastPermissionRefresh] = useState<number>(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'completed'>('all');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const installmentSectionRef = useRef<View>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const [createLastTap, setCreateLastTap] = useState(0);
  const [isCreateDragging, setIsCreateDragging] = useState(false);
  const [createDragValue, setCreateDragValue] = useState(0);
  const [installmentHeaderY, setInstallmentHeaderY] = useState(0);
  const [currentView, setCurrentView] = useState<'installments' | 'managers' | 'investors' | 'loans' | 'admins'>('installments');
  const [selectedManagerFilter, setSelectedManagerFilter] = useState<string | null>(null);
  
  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: '',
    confirmColor: '',
    icon: '',
    iconColor: '',
    onConfirm: () => {},
    onCancel: () => {},
  });
  
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
  
  const changePasswordModalSlideY = useRef(new Animated.Value(200)).current;
  const changePasswordModalOpacity = useRef(new Animated.Value(0)).current;
  const [isChangePasswordDragging, setIsChangePasswordDragging] = useState(false);
  const [changePasswordDragValue, setChangePasswordDragValue] = useState(0);
  const [changePasswordLastTap, setChangePasswordLastTap] = useState(0);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
    if (user && !permissionsLoading && hasViewPermission()) {
      console.log('🔄 Loading installments after user and permissions confirmed');
      loadInstallments();
    } else if (user && !permissionsLoading && !hasViewPermission()) {
      console.log('❌ No view permission - cannot load installments');
      console.log('🔍 Permission debug info:', {
        user: user?.email,
        permissionsLoading,
        hasViewPermission: hasViewPermission(),
        permissions: permissions
      });
      showError('You do not have permission to view this data');
    } else {
      console.log('⏳ Waiting for user or permissions to load:', {
        user: user?.email,
        permissionsLoading,
        hasViewPermission: hasViewPermission()
      });
    }
  }, [user, permissionsLoading, permissions]);

  
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
    if (!showChangePasswordModal) {
      changePasswordModalSlideY.setValue(200);
      changePasswordModalOpacity.setValue(0);
      setIsChangePasswordDragging(false);
      setChangePasswordDragValue(0);
      setChangePasswordLastTap(0);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [showChangePasswordModal]);

  
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

  useEffect(() => {
    if (showChangePasswordModal) {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(changePasswordModalSlideY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(changePasswordModalOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }, 10);
    }
  }, [showChangePasswordModal]);

  const loadUserData = async () => {
    try {
      const token = await TokenService.getToken();
      
      if (!token) {
        console.log('❌ No token found, redirecting to login');
        await clearUserData();
        router.replace('/');
        return;
      }
      
      const response = await apiService.getProfile();
      if (response.success && response.user) {
        setUser(response.user);
        console.log('✅ User authenticated:', response.user.type);
      } else {
        console.log('❌ Profile fetch failed, clearing data and redirecting');
        await clearUserData();
        router.replace('/');
      }
    } catch (error) {
      console.log('❌ Authentication error:', error);
      await clearUserData();
      router.replace('/');
    }
  };

  const clearUserData = async () => {
    try {
      await TokenService.removeToken();
      await apiService.logout();
      setUser(null);
      setInstallments([]);
      setIsLoading(false);
      setRefreshing(false);
      setShowProfileModal(false);
      setShowCreateModal(false);
      console.log('🧹 User data cleared');
    } catch (error) {
      console.log('Error clearing user data:', error);
    }
  };

  const loadInstallments = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }
      
      const token = await TokenService.getToken();
      if (!token) {
        console.log('❌ No token found during installment load, redirecting');
        await clearUserData();
        router.replace('/');
        return;
      }
      
      console.log('🔄 Loading installments for user type:', user?.type);
      const isAdmin = user?.type === 'admin';
      const response = await apiService.getInstallments('', isAdmin);
      console.log('📡 Installments API response:', response);
      
      if (response.success) {
        console.log('✅ Installments loaded successfully:', response.installments?.length || 0, 'installments');
        setInstallments(response.installments || []);
      } else {
        console.log('❌ Failed to load installments:', response);
        if ((response as any).message?.includes('unauthorized') || (response as any).message?.includes('token')) {
          console.log('❌ Unauthorized access, clearing data');
          await clearUserData();
          router.replace('/');
          return;
        }
        
        // Check if it's a permission denied error (403)
        if ((response as any).message?.includes('Access denied') || (response as any).message?.includes('permission')) {
          const now = Date.now();
          // Only refresh permissions once every 5 seconds to prevent excessive refreshing
          if (now - lastPermissionRefresh > 5000) {
            console.log('🔒 Permission denied - refreshing permissions');
            setLastPermissionRefresh(now);
            // Refresh permissions when access is denied
            if (refreshPermissions) {
              await refreshPermissions();
            }
          } else {
            console.log('🔒 Permission denied - skipping refresh (too recent)');
          }
        }
        
        if (showLoader) {
          showError('Failed to load installment data');
        }
      }
    } catch (error) {
      console.log('❌ Installment load error:', error);
      if ((error as any).message?.includes('401') || (error as any).message?.includes('unauthorized')) {
        await clearUserData();
        router.replace('/');
        return;
      }
      
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

  // Function to measure installment header position
  const handleInstallmentHeaderLayout = (event: any) => {
    const { y } = event.nativeEvent.layout;
    setInstallmentHeaderY(y);
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

  const handleChangePasswordDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (changePasswordLastTap && (now - changePasswordLastTap) < DOUBLE_TAP_DELAY) {
      setShowChangePasswordModal(false);
    } else {
      setChangePasswordLastTap(now);
    }
  };

  const handleChangePasswordDragStart = () => {
    setIsChangePasswordDragging(true);
  };

  const handleChangePasswordDragMove = (event: any) => {
    const { translationY } = event.nativeEvent;
    
    if (translationY >= 0 && translationY <= 500) {
      changePasswordModalSlideY.setValue(translationY);
      setChangePasswordDragValue(translationY);
      
      const opacity = Math.max(0.2, 1 - (translationY / 500));
      changePasswordModalOpacity.setValue(opacity);
    }
  };

  const handleChangePasswordDragEnd = (event: any) => {
    const { translationY, velocityY } = event.nativeEvent;
    
    setIsChangePasswordDragging(false);
    setChangePasswordDragValue(0);
    
    if (translationY > 150 || velocityY > 800) {
      Animated.parallel([
        Animated.timing(changePasswordModalSlideY, {
          toValue: 600,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(changePasswordModalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowChangePasswordModal(false);
      });
    } else {
      Animated.parallel([
        Animated.spring(changePasswordModalSlideY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 120,
          friction: 9,
          overshootClamping: true,
        }),
        Animated.spring(changePasswordModalOpacity, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 9,
          overshootClamping: true,
        }),
      ]).start();
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
    let filtered = installments;
    
    // Apply manager filter (only for admin users)
    if (selectedManagerFilter && user?.type === 'admin') {
      console.log('🔍 Filtering by manager:', selectedManagerFilter);
      console.log('📊 Before filtering:', filtered.length, 'installments');
      
      filtered = filtered.filter(installment => {
        const managerMatch = installment.manager?._id === selectedManagerFilter;
        const createdByMatch = installment.createdBy?._id === selectedManagerFilter;
        const matches = managerMatch || createdByMatch;
        
        if (matches) {
          console.log('✅ Match found:', {
            customerName: installment.customerName,
            managerId: installment.manager?._id,
            createdById: installment.createdBy?._id
          });
        }
        
        return matches;
      });
      
      console.log('📊 After filtering:', filtered.length, 'installments');
    }
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(installment => {
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
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(installment => 
        installment.customerName?.toLowerCase().includes(query) ||
        installment.customerId?.toLowerCase().includes(query) ||
        installment.productName?.toLowerCase().includes(query) ||
        installment.customerEmail?.toLowerCase().includes(query) ||
        installment.customerPhone?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [installments, filter, searchQuery, selectedManagerFilter, user?.type]);

  
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
      await clearUserData();
      showSuccess('Logged out successfully');
      router.replace('/');
    } catch (error) {
      console.log('Logout error:', error);
      await clearUserData();
      showSuccess('Logged out successfully');
      router.replace('/');
    }
  };

  const handleChangePassword = async () => {
    try {
      // Validation
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        showError('All fields are required');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        showError('New password must be at least 6 characters long');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        showError('New password and confirm password do not match');
        return;
      }

      const response = await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.success) {
        showSuccess('Password changed successfully');
        setShowChangePasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        showError(response.message || 'Failed to change password');
      }
    } catch (error: any) {
      console.log('Change password error:', error);
      showError(error.message || 'Failed to change password. Please try again.');
    }
  };

  const handleManagerClick = (managerId: string) => {
    console.log('🔍 Manager clicked:', managerId);
    console.log('📊 Available installments:', installments.length);
    console.log('📋 Sample installment structure:', installments[0]);
    setSelectedManagerFilter(managerId);
    setCurrentView('installments');
    showInfo('Showing installments for selected manager');
  };

  const clearManagerFilter = () => {
    setSelectedManagerFilter(null);
    showInfo('Showing all installments');
  };

  const handleViewChange = (view: 'installments' | 'managers' | 'investors' | 'loans' | 'admins') => {
    setCurrentView(view);
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
    const advanceAmount = installment.advanceAmount || 0;

    
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
        advanceAmount: advanceAmount.toString(), 
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
    setConfirmationModal({
      visible: true,
      title: 'Delete Installment',
      message: `Are you sure you want to delete installment #${installment.installmentNumber} for ${installment.customerName}? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmColor: colors.danger,
      icon: 'trash',
      iconColor: colors.danger,
      onConfirm: async () => {
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
      },
      onCancel: () => {
        // Do nothing on cancel for delete
      },
    });
  };

  const handleShareInstallment = async (installment: any) => {
    const pdfGenerator = new PDFGenerator({ showSuccess, showError, showInfo });
    await pdfGenerator.generateInstallmentPDF(installment);
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
                <Text style={styles.modernHeaderTitle}>
                  {user?.type === 'admin' ? 'Admin Dashboard' : 
                   user?.type === 'manager' ? 'Manager Dashboard' : 
                   user?.type === 'investor' ? 'Investor Dashboard' : 
                   'Dashboard'}
                </Text>
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
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={{
          paddingLeft: Math.max(insets.left, 20),
          paddingRight: Math.max(insets.right, 20),
          paddingBottom: user?.type === 'admin' ? insets.bottom + 100 : insets.bottom + 20,
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >

        {/* Revenue Summary - Only show for installments */}
        {currentView === 'installments' && (
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
                      <Text style={styles.revenueValue}>
                        {hasViewPermission() ? formatCurrency(stats.totalRevenue) : '****'}
                      </Text>
                    </View>
                    <View style={styles.revenueRow}>
                      <View style={styles.revenueItem}>
                        <Text style={styles.revenueLabel}>Collected</Text>
                        <Text style={[styles.revenueValue, { color: '#4ECDC4' }]}>
                          {hasViewPermission() ? formatCurrency(stats.collectedRevenue) : '****'}
                        </Text>
                      </View>
                      <View style={styles.revenueItem}>
                        <Text style={styles.revenueLabel}>Pending</Text>
                        <Text style={[styles.revenueValue, { color: '#FF6B6B' }]}>
                          {hasViewPermission() ? formatCurrency(stats.pendingRevenue) : '****'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </LinearGradient>
          </View>
        )}

        {/* No Access Message for Admins without permissions */}
        {user?.type === 'admin' && !hasViewPermission() && !permissionsLoading && (
          <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
            <Ionicons name="lock-closed" size={48} color={colors.lightText} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Access Restricted
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.lightText }]}>
              You don't have permission to view data. Please contact the main admin to request access.
            </Text>
          </View>
        )}

        {/* Content Area - Always show installment section for managers and admins with permissions */}
        {((user?.type === 'manager') || (user?.type === 'admin' && hasViewPermission() && currentView === 'installments')) ? (
          <>
            {/* Modern Filter Pills - Only for admins */}
            {user?.type === 'admin' && (
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
            )}

        {/* Installment List */}
        <View ref={installmentSectionRef} style={styles.installmentSection} onLayout={handleInstallmentHeaderLayout}>
          <View style={styles.sectionHeader}>
            {!showSearchBar ? (
              <View style={styles.sectionTitleContainer}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {user?.type === 'manager' ? 'Customer Installments' : 'Installment Management'}
                </Text>
              </View>
            ) : (
              <View style={[
                styles.searchInputWrapper, 
                { 
                  borderColor: isSearchFocused ? '#3B82F6' : '#D1D5DB',
                  borderWidth: isSearchFocused ? 2 : 1,
                  marginTop: -14,
                }
              ]}>
                <TextInput
                  style={[styles.searchInput, { color: '#374151' }]}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search installments..."
                  placeholderTextColor="#9CA3AF"
                  autoFocus={true}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.clearSearchButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
            )}
            <View style={styles.headerActions}>
              {/* Search Icon */}
              <TouchableOpacity
                style={[styles.searchButton, { backgroundColor: colors.success }]}
                onPress={() => {
                  if (!showSearchBar) {
                    // Opening search bar - scroll to top
                    setShowSearchBar(true);
                    setTimeout(() => {
                      // Calculate scroll position dynamically and subtract 14px
                      const scrollPosition = installmentHeaderY - 24;
                      scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: true });
                    }, 100);
                  } else {
                    setShowSearchBar(false);
                    setSearchQuery('');
                    setIsSearchFocused(false);
                  }
                }}
                activeOpacity={0.8}
              >
                  <Ionicons name="search" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              {/* Only show Add button for admin users with add permission */}
              {user?.type === 'admin' && hasAddPermission() && (
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowCreateModal(true)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* Manager Filter Chip */}
          {selectedManagerFilter && user?.type === 'admin' && (
            <View style={styles.filterChipContainer}>
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.primary }]}
                onPress={clearManagerFilter}
                activeOpacity={0.7}
              >
                <Text style={styles.filterChipText}>Manager Filter Active</Text>
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
          
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
                  ? (user?.type === 'manager' 
                      ? 'No customer installments available yet.' 
                      : 'Start by creating your first installment plan.')
                  : 'Try adjusting your filters to see more installments.'
                }
              </Text>
            </View>
          ) : (
            filteredInstallments.map((installment, index) => (
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
                    Installment #{filteredInstallments.length - index}
                  </Text>
                  <Text style={[styles.installmentId, { color: colors.lightText }]}>
                    ID: {installment.customerId}
                  </Text>
                  <Text style={[styles.installmentId, { color: colors.lightText }]}>
                    Phone: {installment.customerPhone ? `+92 300 ${installment.customerPhone.slice(-7)}` : '+92 300 0000000'}
                  </Text>
                  {installment.reference && installment.reference !== '.' && installment.reference.trim() !== '' ? (
                    <Text style={[styles.installmentId, { color: colors.lightText }]}>
                      Reference: {installment.reference}
                    </Text>
                  ) : null}
                  {user?.type === 'admin' && installment.manager ? (
                    <Text style={[styles.installmentId, { color: colors.lightText }]}>
                      Manager: {installment.manager.name}
                    </Text>
                  ) : null}
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
                  
                  {/* Share button for all users */}
                  <TouchableOpacity
                    style={[styles.cardActionButton, { backgroundColor: colors.success }]}
                    onPress={(e) => {
                      e.stopPropagation(); 
                      handleShareInstallment(installment);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Admin action buttons on new line - Only for admin users with add permission */}
              {user?.type === 'admin' && hasAddPermission() && (
                <View style={styles.adminActionsRow}>
                  <TouchableOpacity
                    style={[styles.cardActionButton, { backgroundColor: colors.primary }]}
                    onPress={(e) => {
                      e.stopPropagation(); 
                      handleEditInstallment(installment);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.cardActionButton, { backgroundColor: colors.danger }]}
                    onPress={(e) => {
                      e.stopPropagation(); 
                      handleDeleteInstallment(installment);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}

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
                      {formatCurrency(installment.remainingAmount || 0)}
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
          </>
        ) : currentView === 'managers' ? (
          /* Managers Section - Only for Admin with view permission */
          user?.type === 'admin' && hasViewPermission() && (
            <ManagersSection colors={colors} onManagerClick={handleManagerClick} isActive={currentView === 'managers'} />
          )
        ) : currentView === 'investors' ? (
          /* Investors Section - Only for Admin with view permission */
          user?.type === 'admin' && hasViewPermission() && (
            <InvestorsSection colors={colors} isActive={currentView === 'investors'} />
          )
        ) : currentView === 'admins' ? (
          /* Admins Section - Only for main admin */
          user?.type === 'admin' && isMainAdmin() && (
            <AdminsSection colors={colors} user={user} isActive={currentView === 'admins'} />
          )
        ) : (
          /* Loans Section - Only for Admin with view permission */
          user?.type === 'admin' && hasViewPermission() && (
            <LoansSection colors={colors} isActive={currentView === 'loans'} />
          )
        )}
      </ScrollView>

      {/* Bottom Navigation Bar - Only for Admin with view permission */}
      {user?.type === 'admin' && hasViewPermission() && (
        <BottomNavBar 
          colors={colors}
          currentView={currentView}
          onViewChange={handleViewChange}
          user={user}
        />
      )}

      {/* Profile Modal */}
      <Modal
        visible={showProfileModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProfileModal(false)}
        statusBarTranslucent
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}
        >
          <TouchableOpacity 
            style={[styles.profileModal, { backgroundColor: colors.cardBackground }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandle, { backgroundColor: colors.lightText }]} />
            </View>
            
            {/* Profile Header */}
            <View style={styles.profileHeader}>
              <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text }]}>{user?.name}</Text>
                <Text style={[styles.profileEmail, { color: colors.lightText }]}>{user?.email}</Text>
                <View style={[
                  styles.roleBadge, 
                  { backgroundColor: 
                    user?.type === 'admin' ? colors.primary :
                    user?.type === 'manager' ? colors.success :
                    user?.type === 'investor' ? colors.warning :
                    colors.lightText
                  }
                ]}>
                  <Text style={styles.roleText}>
                    {user?.type === 'admin' ? 'Admin' : 
                     user?.type === 'manager' ? 'Manager' : 
                     user?.type === 'investor' ? 'Investor' : 
                     'User'}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.profileActions}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => {
                  setShowProfileModal(false);
                  setTimeout(() => {
                    setShowChangePasswordModal(true);
                  }, 300);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
                <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>Change Password</Text>
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Create Installment Modal - Only for admin users */}
      <Modal
        visible={showCreateModal && user?.type === 'admin'}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
        statusBarTranslucent
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        >
          <TouchableOpacity 
            style={[styles.createModal, { backgroundColor: colors.cardBackground }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandle, { backgroundColor: colors.lightText }]} />
            </View>
            
            {/* Header */}
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={showChangePasswordModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowChangePasswordModal(false)}
        statusBarTranslucent
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowChangePasswordModal(false)}
        >
          <TouchableOpacity 
            style={[styles.createModal, { backgroundColor: colors.cardBackground }]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandleContainer}>
              <View style={[styles.dragHandle, { backgroundColor: colors.lightText }]} />
            </View>
            
            {/* Header */}
            <View style={styles.createModalHeader}>
                <Text style={[styles.createModalTitle, { color: colors.text }]}>
                  Change Password
                </Text>
              </View>
              
              <ScrollView style={styles.createModalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Current Password
                  </Text>
                  <View style={[styles.passwordInputContainer, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  }]}>
                    <TextInput
                      style={[styles.passwordInput, { color: colors.text }]}
                      value={passwordData.currentPassword}
                      onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                      placeholder="Enter current password"
                      placeholderTextColor={colors.lightText}
                      secureTextEntry={!showCurrentPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={showCurrentPassword ? "eye-off" : "eye"} 
                        size={20} 
                        color={colors.lightText} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    New Password
                  </Text>
                  <View style={[styles.passwordInputContainer, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  }]}>
                    <TextInput
                      style={[styles.passwordInput, { color: colors.text }]}
                      value={passwordData.newPassword}
                      onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                      placeholder="Enter new password"
                      placeholderTextColor={colors.lightText}
                      secureTextEntry={!showNewPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={showNewPassword ? "eye-off" : "eye"} 
                        size={20} 
                        color={colors.lightText} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Confirm New Password
                  </Text>
                  <View style={[styles.passwordInputContainer, { 
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                  }]}>
                    <TextInput
                      style={[styles.passwordInput, { color: colors.text }]}
                      value={passwordData.confirmPassword}
                      onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                      placeholder="Confirm new password"
                      placeholderTextColor={colors.lightText}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={showConfirmPassword ? "eye-off" : "eye"} 
                        size={20} 
                        color={colors.lightText} 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[styles.cancelButton, { backgroundColor: colors.border }]}
                    onPress={() => setShowChangePasswordModal(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                    onPress={handleChangePassword}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Change Password</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmationModal.visible}
        onClose={() => setConfirmationModal(prev => ({ ...prev, visible: false }))}
        onConfirm={confirmationModal.onConfirm}
        onCancel={confirmationModal.onCancel}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        confirmColor={confirmationModal.confirmColor}
        icon={confirmationModal.icon}
        iconColor={confirmationModal.iconColor}
        colors={colors}
      />


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
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  addButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    flexShrink: 0,
  },
  searchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    flexShrink: 0,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    flex: 1,
    marginRight: 8,
    borderColor: '#D1D5DB',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    paddingVertical: 4,
    color: '#374151',
  },
  clearSearchButton: {
    marginLeft: 8,
    padding: 2,
    borderRadius: 10,
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
    alignItems: 'flex-start',
    padding: 12,
    paddingBottom: 8,
    gap: 8,
  },
  installmentInfo: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    flexShrink: 0,
  },
  cardActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    flexShrink: 0,
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
  shareButton: {
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
    marginBottom: 1,
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
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  installmentRow: {
    flexDirection: 'row',
    marginBottom: 8,
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
    paddingBottom: 24,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Placeholder Section Styles
  placeholderSection: {
    marginTop: 24,
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  placeholderSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  filterChipContainer: {
    marginTop: 4,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 4,
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingTop: 20,
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
