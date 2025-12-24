import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal';
import AddInvestorModal from './AddInvestorModal';
import PDFGenerator from './PDFGenerator';
import ProfitHistoryModal from './ProfitHistoryModal';
import InvestorDetailsModal from './InvestorDetailsModal';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { InteractionManager } from 'react-native';

interface Investor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  isActive: boolean;
  investmentAmount: number;
  monthlyProfit: number;
  totalProfit?: number;
  joinDate?: string;
  createdAt: string;
  lastLogin?: string;
  profitHistory?: Array<{
    month: string;
    profit: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

interface InvestorsSectionProps {
  colors: any;
  isActive?: boolean;
}

export default function InvestorsSection({ colors, isActive = true }: InvestorsSectionProps) {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Add investor modal state
  const [showAddInvestorModal, setShowAddInvestorModal] = useState(false);

  // Profit distribution modal state
  const [showProfitDistributionModal, setShowProfitDistributionModal] = useState(false);

  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);

  // Individual edit modals
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [showEditEmailModal, setShowEditEmailModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showUpdateProfitModal, setShowUpdateProfitModal] = useState(false);

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showEditDatePicker, setShowEditDatePicker] = useState(false);

  // Form input states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    newEmail: '',
    newPassword: '',
    confirmPassword: '',
    investmentAmount: '',
    monthlyProfit: '',
    joinDate: new Date(),
  });

  // Profit distribution form data
  const [profitFormData, setProfitFormData] = useState({
    totalProfit: '',
    totalExpenses: '',
  });

  // Profit distribution calculated data
  const [calculatedDistribution, setCalculatedDistribution] = useState<any[]>([]);

  // Profit distribution loading state
  const [isDistributingProfits, setIsDistributingProfits] = useState(false);

  // Update investor loading state
  const [isUpdatingInvestor, setIsUpdatingInvestor] = useState(false);

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    visible: false,
    title: '',
    message: '',
    confirmText: '',
    confirmColor: '',
    icon: '',
    iconColor: '',
    onConfirm: () => { },
  });

  // Investor details modal state
  const [showInvestorDetailsModal, setShowInvestorDetailsModal] = useState(false);
  const [selectedInvestorDetails, setSelectedInvestorDetails] = useState<Investor | null>(null);

  // Profit history modal state
  const [showProfitHistoryModal, setShowProfitHistoryModal] = useState(false);
  const [selectedInvestorForProfitHistory, setSelectedInvestorForProfitHistory] = useState<Investor | null>(null);

  // Share options modal state
  const [showShareOptionsModal, setShowShareOptionsModal] = useState(false);
  const [selectedInvestorForShare, setSelectedInvestorForShare] = useState<Investor | null>(null);

  // Balance profit modal state
  const [showBalanceProfitModal, setShowBalanceProfitModal] = useState(false);
  const receiptViewRef = useRef<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptReady, setReceiptReady] = useState(false);
  const [balanceEntries, setBalanceEntries] = useState<Array<{
    heading: string;
    value: string;
    type: 'earning' | 'deduction';
  }>>([{ heading: '', value: '', type: 'deduction' }]);

  // Drag functionality for investor details modal
  const [isDetailsDragging, setIsDetailsDragging] = useState(false);
  const [detailsDragValue, setDetailsDragValue] = useState(0);
  const [detailsLastTap, setDetailsLastTap] = useState(0);
  const detailsDragTranslateY = useRef(new Animated.Value(0)).current;
  const detailsDragOpacity = useRef(new Animated.Value(1)).current;
  const detailsModalSlideY = useRef(new Animated.Value(200)).current;
  const detailsModalOpacity = useRef(new Animated.Value(0)).current;

  // Shimmer animation
  const shimmerOpacity = useRef(new Animated.Value(0.3)).current;

  // Totals for receipt (profit + custom entries)
  const receiptTotals = useMemo(() => {
    const profit = Number(selectedInvestorForShare?.monthlyProfit || 0);
    const entries = balanceEntries.filter(
      e => e.heading.trim() !== '' && e.value.trim() !== '' && !isNaN(parseFloat(e.value))
    );
    const earningsExtra = entries
      .filter(e => e.type === 'earning')
      .reduce((sum, e) => sum + (parseFloat(e.value) || 0), 0);
    const deductions = entries
      .filter(e => e.type === 'deduction')
      .reduce((sum, e) => sum + (parseFloat(e.value) || 0), 0);
    const earningsTotal = profit + earningsExtra;
    const net = earningsTotal - deductions;
    return { profit, earningsExtra, deductions, earningsTotal, net };
  }, [selectedInvestorForShare, balanceEntries]);

  useEffect(() => {
    // Only load investors when section is active
    if (isActive) {
      loadInvestors();
    }
  }, [isActive]);

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

  // Reset drag values when modal closes
  useEffect(() => {
    if (!showInvestorDetailsModal) {
      detailsDragTranslateY.setValue(0);
      detailsDragOpacity.setValue(1);
      detailsModalSlideY.setValue(200);
      detailsModalOpacity.setValue(0);
      setIsDetailsDragging(false);
      setDetailsDragValue(0);
      setDetailsLastTap(0);
    }
  }, [showInvestorDetailsModal]);

  // Animate modal when it opens
  useEffect(() => {
    if (showInvestorDetailsModal) {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(detailsModalSlideY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(detailsModalOpacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }, 10);
    }
  }, [showInvestorDetailsModal]);

  // Auto-capture and share when receipt modal is shown
  useEffect(() => {
    const run = async () => {
      if (!showReceiptModal || !receiptReady) return;
      // Wait a tick for the receipt modal to fully render
      await new Promise(r => setTimeout(r, 200));
      try {
        if (!receiptViewRef.current) return;
        await new Promise<void>((resolve) => {
          InteractionManager.runAfterInteractions(() => resolve());
        });
        const uri = await receiptViewRef.current.capture();
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: 'Share Profit Receipt',
          });
        } else {
          showInfo('Sharing is not available on this device.');
        }
      } catch (e) {
        console.log('Receipt capture/share error:', e);
        showError('Failed to generate PNG');
      } finally {
        setShowReceiptModal(false);
        setShowBalanceProfitModal(false);
        setSelectedInvestorForShare(null);
        setBalanceEntries([{ heading: '', value: '', type: 'deduction' }]);
        setReceiptReady(false);
      }
    };
    run();
  }, [showReceiptModal, receiptReady]);

  const loadInvestors = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }

      console.log('🔄 Loading investors...');
      const response = await apiService.getInvestors();
      console.log('📡 Investors API response:', response);

      if (response.success) {
        console.log('✅ Investors loaded successfully:', response.data?.length || 0, 'investors');
        console.log('📊 Sample investor data:', response.data?.[0]);
        setInvestors(response.data || []);
      } else {
        console.log('❌ Failed to load investors:', response);
        if (showLoader) {
          showError(response.message || 'Failed to load investors');
        }
      }
    } catch (error) {
      console.log('❌ Investor load error:', error);
      if (showLoader) {
        showError('Failed to load investors. Please try again.');
      }
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInvestors(false);
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateForInput = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleEditDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEditDatePicker(false);
    }
    if (selectedDate) {
      setFormData(prev => ({ ...prev, joinDate: selectedDate }));
    }
  };

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  const calculateTotalProfit = (investor: Investor) => {
    console.log('🔍 Calculating total profit for:', investor.name, {
      totalProfit: investor.totalProfit,
      profitHistory: investor.profitHistory,
      profitHistoryLength: investor.profitHistory?.length
    });

    if (investor.totalProfit !== undefined) {
      console.log('Using backend totalProfit:', investor.totalProfit);
      return investor.totalProfit;
    }

    if (investor.profitHistory && investor.profitHistory.length > 0) {
      const calculated = investor.profitHistory.reduce((total, profit) => total + profit.profit, 0);
      console.log('Calculated from profitHistory:', calculated);
      return calculated;
    }

    console.log('No profit data found, returning 0');
    return 0;
  };

  const filteredInvestors = useMemo(() => {
    if (!searchQuery.trim()) {
      return investors;
    }

    const query = searchQuery.toLowerCase().trim();
    return investors.filter(investor =>
      investor.name?.toLowerCase().includes(query) ||
      investor.email?.toLowerCase().includes(query) ||
      investor.phone?.toLowerCase().includes(query)
    );
  }, [investors, searchQuery]);

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
        </View>
      </View>
    );
  };

  const handleEditInvestor = async (investor: Investor, editType: 'name' | 'email' | 'password' | 'profit') => {
    setSelectedInvestor(investor);

    setFormData({
      name: investor.name || '',
      phone: investor.phone || '',
      email: investor.email || '',
      newEmail: '',
      newPassword: '',
      confirmPassword: '',
      investmentAmount: investor.investmentAmount?.toString() || '',
      monthlyProfit: investor.monthlyProfit?.toString() || '',
      joinDate: investor.joinDate ? new Date(investor.joinDate) : new Date(investor.createdAt),
    });

    if (editType === 'name') {
      setShowEditInfoModal(true);
    } else if (editType === 'email') {
      setShowEditEmailModal(true);
    } else if (editType === 'password') {
      setShowResetPasswordModal(true);
    } else if (editType === 'profit') {
      setShowUpdateProfitModal(true);
    }
  };

  const toggleEditModal = (investor: Investor) => {
    setSelectedInvestor(investor);
    setFormData({
      name: investor.name || '',
      phone: investor.phone || '',
      email: investor.email || '',
      newEmail: '',
      newPassword: '',
      confirmPassword: '',
      investmentAmount: investor.investmentAmount?.toString() || '',
      monthlyProfit: investor.monthlyProfit?.toString() || '',
      joinDate: investor.joinDate ? new Date(investor.joinDate) : new Date(investor.createdAt),
    });
    setShowEditModal(true);
  };

  const handleUpdateInvestor = async () => {
    if (!selectedInvestor) return;

    if (isUpdatingInvestor) {
      return;
    }

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.investmentAmount.trim()) {
      showError('Please fill in all required fields');
      return;
    }

    setIsUpdatingInvestor(true);
    try {
      const updateData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        investmentAmount: parseFloat(formData.investmentAmount),
        joinDate: formData.joinDate.toISOString(),
      };

      if (formData.newPassword.trim()) {
        updateData.password = formData.newPassword.trim();
      }

      const response = await apiService.updateInvestor(selectedInvestor._id, updateData);

      if (response.success) {
        showSuccess('Investor updated successfully');
        setShowEditModal(false);
        loadInvestors(false);
      } else {
        showError(response.message || 'Failed to update investor');
      }
    } catch (error) {
      console.log('Update investor error:', error);
      showError('Failed to update investor. Please try again.');
    } finally {
      setIsUpdatingInvestor(false);
    }
  };

  const handleDeleteInvestor = async (investor: Investor) => {
    setConfirmationModal({
      visible: true,
      title: 'Delete Investor',
      message: `Are you sure you want to delete "${investor.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmColor: colors.danger,
      icon: 'trash',
      iconColor: colors.danger,
      onConfirm: async () => {
        try {
          const response = await apiService.deleteInvestor(investor._id);

          if (response.success) {
            showSuccess('Investor deleted successfully');
            loadInvestors(false);
          } else {
            showError(response.message || 'Failed to delete investor');
          }
        } catch (error) {
          showError('Failed to delete investor. Please try again.');
        }
      },
    });
  };

  const handleShareInvestor = (investor: Investor) => {
    setSelectedInvestorForShare(investor);
    setShowShareOptionsModal(true);
  };

  const handleShareOption = async (option: 'current' | 'history') => {
    if (!selectedInvestorForShare) return;

    setShowShareOptionsModal(false);

    if (option === 'current') {
      setShowBalanceProfitModal(true);
    } else {
      const pdfGenerator = new PDFGenerator({ showSuccess, showError, showInfo });
      await pdfGenerator.generateInvestorPDF(selectedInvestorForShare);
      setSelectedInvestorForShare(null);
    }
  };

  const handleAddBalanceEntry = () => {
    setBalanceEntries([...balanceEntries, { heading: '', value: '', type: 'deduction' }]);
  };

  const handleRemoveBalanceEntry = (index: number) => {
    if (balanceEntries.length > 1) {
      const newEntries = balanceEntries.filter((_, i) => i !== index);
      setBalanceEntries(newEntries);
    }
  };

  const handleBalanceEntryChange = (index: number, field: 'heading' | 'value' | 'type', value: any) => {
    const newEntries = [...balanceEntries];
    newEntries[index][field] = value;
    setBalanceEntries(newEntries);
  };

  const handleGenerateCurrentMonthPDF = async () => {
    if (!selectedInvestorForShare) return;

    const validEntries = balanceEntries.filter(entry =>
      entry.heading.trim() !== '' && entry.value.trim() !== '' && !isNaN(parseFloat(entry.value))
    );

    try {
      if (validEntries.length > 0) {
        await apiService.saveCurrentMonthProfit({
          investorId: selectedInvestorForShare._id,
          expenseAmount: 0,
          balanceEntries: validEntries
        });
      }
      
      // Open receipt-only modal; auto-capture via effect when layout is ready
      setReceiptReady(false);
      setShowReceiptModal(true);
    } catch (error) {
      console.log('Error preparing receipt:', error);
      showError('Failed to prepare receipt');
    }
  };

  const calculateDistribution = (profit: string, expenses: string) => {
    const totalProfit = parseFloat(profit) || 0;
    const totalExpenses = parseFloat(expenses) || 0;

    console.log('Calculating distribution - Profit:', totalProfit, 'Expenses:', totalExpenses);

    if (totalProfit > 0 && totalExpenses >= 0) {
      const netProfit = totalProfit - totalExpenses;
      console.log('Net Profit:', netProfit);

      if (netProfit > 0) {
        const totalInvestment = investors.reduce((sum, investor) =>
          sum + (investor.investmentAmount || 0), 0);

        console.log('Total Investment:', totalInvestment, 'Investors count:', investors.length);

        if (totalInvestment > 0) {
          const profitRate = netProfit / totalInvestment;
          console.log('Profit Rate:', profitRate);

          const distribution = investors.map(investor => {
            const investorInvestment = investor.investmentAmount || 0;
            const investorProfit = profitRate * investorInvestment;

            const roundedProfit = Math.round(investorProfit * 100) / 100;
            const ratio = investorInvestment / totalInvestment;

            console.log(`${investor.name}: Investment=${investorInvestment}, Profit Rate=${profitRate.toFixed(4)}, Profit=${roundedProfit.toFixed(2)}`);

            return {
              ...investor,
              ratio: ratio,
              profitAmount: roundedProfit,
              formattedProfit: roundedProfit.toFixed(2)
            };
          });

          console.log('Distribution calculated:', distribution.length, 'investors');
          setCalculatedDistribution(distribution);
        } else {
          console.log('Total investment is 0');
          setCalculatedDistribution([]);
        }
      } else {
        console.log('Net profit is 0 or negative');
        setCalculatedDistribution([]);
      }
    } else {
      console.log('Invalid profit or expenses values');
      setCalculatedDistribution([]);
    }
  };

  const handleProfitDistribution = async () => {
    if (calculatedDistribution.length === 0) {
      showError('Please enter valid profit and expense amounts');
      return;
    }

    if (isDistributingProfits) {
      return;
    }

    const totalProfit = parseFloat(profitFormData.totalProfit);
    const totalExpenses = parseFloat(profitFormData.totalExpenses);
    const netProfit = totalProfit - totalExpenses;

    if (netProfit <= 0) {
      showError('Net profit must be greater than zero');
      return;
    }

    setIsDistributingProfits(true);
    try {
      const response = await apiService.distributeProfits({
        totalProfit,
        totalExpenses,
        netProfit,
        distribution: calculatedDistribution.map(investor => ({
          _id: investor._id,
          name: investor.name,
          investmentAmount: investor.investmentAmount,
          profitAmount: investor.profitAmount,
          ratio: investor.ratio
        }))
      });

      if (response.success) {
        showSuccess(response.message || 'Profits distributed successfully!');
        setShowProfitDistributionModal(false);
        setProfitFormData({ totalProfit: '', totalExpenses: '' });
        setCalculatedDistribution([]);
        // Refresh investors list to show updated profit data
        loadInvestors(false);
      } else {
        showError(response.message || 'Failed to distribute profits');
      }
    } catch (error) {
      console.error('Profit distribution error:', error);
      showError('Failed to distribute profits. Please try again.');
    } finally {
      setIsDistributingProfits(false);
    }
  };

  const handleInvestorDetails = (investor: Investor) => {
    setSelectedInvestorDetails(investor);
    setShowInvestorDetailsModal(true);
  };

  // Drag functionality for investor details modal
  const handleDetailsDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (detailsLastTap && (now - detailsLastTap) < DOUBLE_TAP_DELAY) {
      setShowInvestorDetailsModal(false);
    } else {
      setDetailsLastTap(now);
    }
  };

  const handleDetailsDragStart = () => {
    setIsDetailsDragging(true);
  };

  const handleDetailsDragMove = (event: any) => {
    const { translationY } = event.nativeEvent;

    if (translationY >= 0 && translationY <= 500) {
      detailsDragTranslateY.setValue(translationY);
      setDetailsDragValue(translationY);

      const opacity = Math.max(0.2, 1 - (translationY / 500));
      detailsDragOpacity.setValue(opacity);
    }
  };

  const handleDetailsDragEnd = (event: any) => {
    const { translationY, velocityY } = event.nativeEvent;

    setIsDetailsDragging(false);
    setDetailsDragValue(0);

    if (translationY > 150 || velocityY > 800) {
      Animated.parallel([
        Animated.timing(detailsDragTranslateY, {
          toValue: 600,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(detailsDragOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(detailsModalOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowInvestorDetailsModal(false);
      });

      setTimeout(() => {
        if (!showInvestorDetailsModal) {
          detailsModalOpacity.setValue(0);
        }
      }, 300);
    } else {
      Animated.parallel([
        Animated.spring(detailsDragTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 120,
          friction: 9,
          overshootClamping: true,
        }),
        Animated.spring(detailsDragOpacity, {
          toValue: 1,
          useNativeDriver: true,
          tension: 120,
          friction: 9,
          overshootClamping: true,
        }),
      ]).start();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.investorSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Investors
          </Text>
        </View>
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      </View>
    );
  }

  return (
    <View style={styles.investorSection}>
      <View style={styles.sectionHeader}>
        {!showSearchBar ? (
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Investors ({filteredInvestors.length})
          </Text>
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
              placeholder="Search investors..."
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
                setShowSearchBar(true);
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
          {/* Profit Icon */}
          <TouchableOpacity
            style={[styles.profitButton, { backgroundColor: colors.warning }]}
            onPress={() => setShowProfitDistributionModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="trending-up" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          {/* Add Investor Icon */}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddInvestorModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Total Investment Summary Card */}
      {investors.length > 0 && (
        <View style={[styles.totalInvestmentCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.totalInvestmentContent}>
            <View style={[styles.totalInvestmentIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="wallet" size={24} color={colors.primary} />
            </View>
            <View style={styles.totalInvestmentInfo}>
              <Text style={[styles.totalInvestmentLabel, { color: colors.lightText }]}>
                Total Investment
              </Text>
              <Text style={[styles.totalInvestmentValue, { color: colors.primary }]}>
                {formatCurrency(investors.reduce((sum, investor) => sum + (investor.investmentAmount || 0), 0))}
              </Text>
            </View>
          </View>
        </View>
      )}

      {filteredInvestors.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
          <Ionicons name="trending-up-outline" size={48} color={colors.lightText} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {investors.length === 0 ? 'No Investors Yet' : 'No Investors Found'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.lightText }]}>
            {investors.length === 0
              ? 'No investors have been added yet.'
              : 'Try adjusting your search to see more investors.'
            }
          </Text>
        </View>
      ) : (
        filteredInvestors.map((investor, index) => (
          <View key={investor._id}>
            <TouchableOpacity
              style={[styles.investorCard, { backgroundColor: colors.cardBackground }]}
              onPress={() => handleInvestorDetails(investor)}
              activeOpacity={0.7}
            >
              <View style={styles.investorHeader}>
                <View style={styles.investorInfo}>
                  <Text style={[styles.investorName, { color: colors.text }]}>
                    {investor.name}
                  </Text>
                  <Text style={[styles.investorId, { color: colors.lightText }]}>
                    Investor #{filteredInvestors.length - index}
                  </Text>
                  <Text style={[styles.investorId, { color: colors.lightText }]}>
                    Email: {investor.email}
                  </Text>
                  <Text style={[styles.investorId, { color: colors.lightText }]}>
                    Phone: {investor.phone || 'Not provided'}
                  </Text>
                </View>
                <View style={styles.headerActions}>
                  {/* Share button */}
                  <TouchableOpacity
                    style={[styles.cardActionButton, { backgroundColor: colors.success }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleShareInvestor(investor);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="share" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                  {/* Edit button */}
                  <TouchableOpacity
                    style={[styles.cardActionButton, { backgroundColor: colors.primary }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleEditModal(investor);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="create" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                  {/* Delete button */}
                  <TouchableOpacity
                    style={[styles.cardActionButton, { backgroundColor: colors.danger }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteInvestor(investor);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="trash" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                  {/* Profit History button */}
                  <TouchableOpacity
                    style={[styles.cardActionButton, { backgroundColor: colors.warning }]}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedInvestorForProfitHistory(investor);
                      setShowProfitHistoryModal(true);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="time-outline" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.investorDetails}>
                <View style={styles.investorRow}>
                  <View style={styles.investorCol}>
                    <Text style={[styles.investorLabel, { color: colors.lightText }]}>Investment</Text>
                    <Text style={[styles.investorValue, { color: colors.success }]}>
                      {formatCurrency(investor.investmentAmount || 0)}
                    </Text>
                  </View>
                  <View style={styles.investorCol}>
                    <Text style={[styles.investorLabel, { color: colors.lightText }]}>Monthly Profit</Text>
                    <Text style={[styles.investorValue, { color: colors.warning }]}>
                      {formatCurrency(investor.monthlyProfit || 0)}
                    </Text>
                  </View>
                </View>
                <View style={styles.investorRow}>
                  <View style={styles.investorCol}>
                    <Text style={[styles.investorLabel, { color: colors.lightText }]}>Total Profit</Text>
                    <Text style={[styles.investorValue, { color: colors.primary }]}>
                      {formatCurrency(calculateTotalProfit(investor))}
                    </Text>
                  </View>
                  <View style={styles.investorCol}>
                    <Text style={[styles.investorLabel, { color: colors.lightText }]}>Joined</Text>
                    <Text style={[styles.investorValue, { color: colors.text }]}>
                      {formatDate(investor.joinDate || investor.createdAt)}
                    </Text>
                  </View>
                </View>
                <View style={styles.investorRow}>
                  <View style={styles.investorCol}>
                    <Text style={[styles.investorLabel, { color: colors.lightText }]}>Last Login</Text>
                    <Text style={[styles.investorValue, { color: colors.text }]}>
                      {formatDate(investor.lastLogin || '')}
                    </Text>
                  </View>
                  <View style={styles.investorCol}>
                    {/* Empty column for spacing */}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={confirmationModal.visible}
        onClose={() => setConfirmationModal(prev => ({ ...prev, visible: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText={confirmationModal.confirmText}
        confirmColor={confirmationModal.confirmColor}
        icon={confirmationModal.icon}
        iconColor={confirmationModal.iconColor}
        colors={colors}
      />

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContainer, { backgroundColor: colors.cardBackground }]}>
            {/* Header with gradient */}
            <View style={[styles.modalHeader, { backgroundColor: colors.primary + '10' }]}>
              <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                  <Ionicons name="person" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Edit Investor
                  </Text>
                  <Text style={[styles.modalInvestorName, { color: colors.lightText }]}>
                    {selectedInvestor?.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowEditModal(false)}
                style={[styles.closeButton, { backgroundColor: colors.border }]}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Edit Form */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <View style={styles.inputField}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Full Name *
                  </Text>
                  <TextInput
                    style={[styles.textInput, {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    placeholder="Enter full name"
                    placeholderTextColor={colors.lightText}
                  />
                </View>

                <View style={styles.inputField}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Email Address *
                  </Text>
                  <TextInput
                    style={[styles.textInput, {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    value={formData.email}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                    placeholder="Enter email address"
                    placeholderTextColor={colors.lightText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputField}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Phone Number *
                  </Text>
                  <TextInput
                    style={[styles.textInput, {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    value={formData.phone}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                    placeholder="Enter phone number"
                    placeholderTextColor={colors.lightText}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputField}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Investment Amount (Rs.) *
                  </Text>
                  <TextInput
                    style={[styles.textInput, {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    value={formData.investmentAmount}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, investmentAmount: text }))}
                    placeholder="Enter investment amount"
                    placeholderTextColor={colors.lightText}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputField}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Join Date
                  </Text>
                  <TouchableOpacity
                    style={[styles.textInput, {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }]}
                    onPress={() => setShowEditDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>
                      {formatDateForInput(formData.joinDate)}
                    </Text>
                    <Ionicons name="calendar" size={20} color={colors.lightText} />
                  </TouchableOpacity>
                  {showEditDatePicker && (
                    <DateTimePicker
                      value={formData.joinDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleEditDateChange}
                      maximumDate={new Date()}
                    />
                  )}
                  {Platform.OS === 'ios' && showEditDatePicker && (
                    <TouchableOpacity
                      style={[styles.datePickerDoneButton, { backgroundColor: colors.primary }]}
                      onPress={() => setShowEditDatePicker(false)}
                    >
                      <Text style={styles.datePickerDoneText}>Done</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputField}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Password (Leave blank to keep current)
                  </Text>
                  <View style={[styles.textInput, {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }]}>
                    <TextInput
                      style={[styles.textInput, {
                        color: colors.text,
                        flex: 1
                      }]}
                      value={formData.newPassword}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, newPassword: text }))}
                      placeholder="Enter password for investor login"
                      placeholderTextColor={colors.lightText}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off" : "eye"}
                        size={20}
                        color={colors.lightText}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.requiredNote, { color: colors.lightText }]}>
                  All fields marked with * are required
                </Text>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.editModalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowEditModal(false);
                  setIsUpdatingInvestor(false);
                }}
                activeOpacity={0.7}
                disabled={isUpdatingInvestor}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  {
                    backgroundColor: colors.primary,
                    opacity: isUpdatingInvestor ? 0.5 : 1
                  }
                ]}
                onPress={handleUpdateInvestor}
                activeOpacity={0.7}
                disabled={isUpdatingInvestor}
              >
                {isUpdatingInvestor ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Updating...</Text>
                  </View>
                ) : (
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Update Investor</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal (auto-captures and shares) */}
      <Modal
        visible={showReceiptModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowReceiptModal(false)}
        statusBarTranslucent
      >
        <View style={styles.whiteOverlay}>
          <View style={[styles.receiptContainer, { backgroundColor: '#FFFFFF' }]}>
            <View style={[styles.modalHeader, { paddingBottom: 12 }]}>
              <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: '#111827' }]}>
                  <Ionicons name="receipt-outline" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.modalTitle, { color: '#111827' }]}>Profit Receipt</Text>
                  <Text style={[styles.modalSubtitle, { color: '#6B7280' }]}>Auto sharing...</Text>
                </View>
              </View>
            </View>

            <ScrollView style={{ paddingHorizontal: 20, maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              <ViewShot
                ref={receiptViewRef}
                options={{ format: 'png', quality: 1, fileName: 'profit-receipt', result: 'tmpfile' }}
                style={[styles.thermalReceiptPreview, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }]}
                onLayout={() => setReceiptReady(true)}
              >
                {/* Header with Gradient Background */}
                <View style={[styles.thermalHeaderContainer, { backgroundColor: '#0F1724' }]}>
                  <View style={styles.thermalHeaderContent}>
                    {/* Left: Logo and Company Info */}
                    <View style={styles.thermalHeaderLeft}>
                      <View>
                        <Text style={styles.thermalHeaderCompanyName}>Apna Business 12</Text>
                        <Text style={styles.thermalHeaderSubtitle}>Profit Receipt</Text>
                      </View>
                    </View>
                    
                    {/* Right: Statement Details */}
                    <View style={styles.thermalHeaderRight}>
                      <Text style={styles.thermalHeaderStatementNo}>Statement</Text>
                      <Text style={styles.thermalHeaderDate}>{new Date().toLocaleDateString('en-GB')}</Text>
                    </View>
                  </View>
                </View>

                {/* Customer Details */}
                <View style={styles.thermalDetailsSection}>
                  <View style={styles.thermalDetailRow}>
                    <Text style={[styles.thermalDetailLabel, { color: '#6B7280' }]}>Investor:</Text>
                    <Text style={[styles.thermalDetailValue, { color: '#111827' }]}>{selectedInvestorForShare?.name || '-'}</Text>
                  </View>
                  <View style={styles.thermalDetailRow}>
                    <Text style={[styles.thermalDetailLabel, { color: '#6B7280' }]}>Investment:</Text>
                    <Text style={[styles.thermalDetailValue, { color: '#111827' }]}>{formatCurrency(selectedInvestorForShare?.investmentAmount || 0)}</Text>
                  </View>
                  <View style={styles.thermalDetailRow}>
                    <Text style={[styles.thermalDetailLabel, { color: '#6B7280' }]}>Month:</Text>
                    <Text style={[styles.thermalDetailValue, { color: '#111827' }]}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
                  </View>
                </View>

                {/* Divider Line */}
                <View style={[styles.dividerLine, { backgroundColor: '#E5E7EB' }]} />

                {/* Prayer Line */}
                <Text style={[styles.thermalPrayerText, { color: '#6B7280' }]}>صلّوا على الحبيب! صلى الله تعالى على محمّد</Text>

                {/* Divider Line */}
                <View style={[styles.dividerLine, { backgroundColor: '#E5E7EB' }]} />

                {/* Merged Table */}
                <View style={[styles.thermalTable, { borderColor: '#E5E7EB' }]}>
                  <View style={[styles.thermalTableHeader, { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }]}>
                    <Text style={[styles.thermalThDesc, { color: '#111827' }]}>Description</Text>
                    <Text style={[styles.thermalThAmt, { color: '#111827' }]}>Amount</Text>
                  </View>
                  
                  <View style={[styles.thermalTableRow, { borderColor: '#E5E7EB' }]}>
                    <Text style={[styles.thermalTdDesc, { color: '#111827' }]}>Profit</Text>
                    <Text style={[styles.thermalTdAmt, { color: '#059669' }]}>{(Number(selectedInvestorForShare?.monthlyProfit || 0)).toLocaleString()}</Text>
                  </View>
                  
                  {balanceEntries
                    .filter(e => e.heading.trim() !== '' && e.value.trim() !== '' && !isNaN(parseFloat(e.value)))
                    .map((entry, idx) => (
                      <View key={idx} style={[styles.thermalTableRow, { borderColor: '#E5E7EB' }]}>
                        <Text style={[styles.thermalTdDesc, { color: '#111827' }]}>
                          {entry.heading}
                          {entry.type === 'deduction' ? ' (−)' : ' (+)'}
                        </Text>
                        <Text style={[styles.thermalTdAmt, { color: entry.type === 'earning' ? '#059669' : '#DC2626' }]}>
                          {entry.type === 'earning' ? '+' : '−'}{(parseFloat(entry.value)).toLocaleString()}
                        </Text>
                      </View>
                    ))}

                  
                </View>

                {/* Divider Line */}
                <View style={[styles.dividerLine, { backgroundColor: '#E5E7EB' }]} />

                {/* Net Amount Summary */}
                <View style={styles.thermalNetSummary}>
                  <Text style={[styles.thermalNetLabel, { color: '#111827' }]}>NET AMOUNT</Text>
                  <Text style={[styles.thermalNetValue, { color: (receiptTotals.net || 0) >= 0 ? '#059669' : '#DC2626' }]}>
                    {formatCurrency(receiptTotals.net || 0)}
                  </Text>
                </View>

                {/* Divider Line */}
                <View style={[styles.dividerLine, { backgroundColor: '#E5E7EB' }]} />

                {/* Disclaimer */}
                <View style={styles.thermalDisclaimerSection}>
                  <Text style={[styles.thermalDisclaimerText, { color: '#6B7280' }]}>
                    Note: If any error or omission is found in writing or calculation, please consider this receipt corrected accordingly.
                  </Text>
                </View>

                {/* Divider Line */}
                <View style={[styles.dividerLine, { backgroundColor: '#E5E7EB' }]} />

                {/* Thank You */}
                <View style={styles.thermalReceiptFooter}>
                  <Text style={[styles.thermalThanks, { color: '#111827' }]}>Thank You!</Text>
                  <Text style={[styles.thermalFooterNote, { color: '#9CA3AF' }]}>Your trust is our success</Text>
                </View>
              </ViewShot>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Investor Modal */}
      <AddInvestorModal
        visible={showAddInvestorModal}
        onClose={() => setShowAddInvestorModal(false)}
        onSuccess={() => loadInvestors(false)}
        colors={colors}
      />

      {/* Profit Distribution Modal */}
      <Modal
        visible={showProfitDistributionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowProfitDistributionModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.profitModalContainer, { backgroundColor: colors.cardBackground }]}>
            {/* Header */}
            <View style={[styles.profitModalHeader, { backgroundColor: colors.success + '10' }]}>
              <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.success }]}>
                  <Ionicons name="trending-up" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Profit Distribution
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.lightText }]}>
                    Calculate and distribute profits among investors
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowProfitDistributionModal(false);
                  setProfitFormData({ totalProfit: '', totalExpenses: '' });
                  setCalculatedDistribution([]);
                  setIsDistributingProfits(false);
                }}
                style={[styles.closeButton, { backgroundColor: colors.border }]}
                disabled={isDistributingProfits}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView style={styles.profitModalContent} showsVerticalScrollIndicator={false}>
              {/* Input Fields */}
              <View style={styles.profitInputContainer}>
                <View style={styles.profitInputField}>
                  <Text style={[styles.profitLabel, { color: colors.text }]}>
                    Total Profit (Rs.) *
                  </Text>
                  <TextInput
                    style={[styles.profitInput, {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    value={profitFormData.totalProfit}
                    onChangeText={(text) => {
                      setProfitFormData(prev => ({ ...prev, totalProfit: text }));
                      calculateDistribution(text, profitFormData.totalExpenses);
                    }}
                    placeholder="Enter total profit amount"
                    placeholderTextColor={colors.lightText}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.profitInputField}>
                  <Text style={[styles.profitLabel, { color: colors.text }]}>
                    Total Expenses (Rs.) *
                  </Text>
                  <TextInput
                    style={[styles.profitInput, {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      color: colors.text
                    }]}
                    value={profitFormData.totalExpenses}
                    onChangeText={(text) => {
                      setProfitFormData(prev => ({ ...prev, totalExpenses: text }));
                      calculateDistribution(profitFormData.totalProfit, text);
                    }}
                    placeholder="Enter total expenses amount"
                    placeholderTextColor={colors.lightText}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Summary */}
              {profitFormData.totalProfit && profitFormData.totalExpenses &&
                (parseFloat(profitFormData.totalProfit) - parseFloat(profitFormData.totalExpenses)) > 0 && (
                  <View style={[styles.profitSummary, { backgroundColor: colors.border + '20' }]}>
                    <Text style={[styles.summaryTitle, { color: colors.text }]}>
                      Distribution Summary
                    </Text>
                    <View style={styles.summaryRow}>
                      <View style={styles.summaryCol}>
                        <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Total Investment</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>
                          Rs. {investors.reduce((sum, investor) => sum + (investor.investmentAmount || 0), 0).toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.summaryCol}>
                        <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Net Profit</Text>
                        <Text style={[styles.summaryValue, { color: colors.success }]}>
                          Rs. {(parseFloat(profitFormData.totalProfit) - parseFloat(profitFormData.totalExpenses)).toLocaleString()}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

              {/* Distribution Preview */}
              {calculatedDistribution.length > 0 && (
                <View style={[styles.distributionPreview, { backgroundColor: colors.border + '20' }]}>
                  <Text style={[styles.summaryTitle, { color: colors.text }]}>
                    Profit Distribution Preview
                  </Text>
                  {calculatedDistribution.map((investor, index) => (
                    <View key={investor._id || index} style={styles.distributionRow}>
                      <View style={styles.distributionInfo}>
                        <Text style={[styles.distributionName, { color: colors.text }]}>
                          {investor.name}
                        </Text>
                        <Text style={[styles.distributionDetails, { color: colors.lightText }]}>
                          Investment: Rs. {(investor.investmentAmount || 0).toLocaleString()}
                        </Text>
                      </View>
                      <Text style={[styles.distributionAmount, { color: colors.success }]}>
                        Rs. {(investor.profitAmount || 0).toFixed(2)}
                      </Text>
                    </View>
                  ))}

                  {/* Total Distributed Amount */}
                  <View style={[styles.distributionTotalRow, { borderTopColor: colors.text, backgroundColor: colors.border + '30' }]}>
                    <Text style={[styles.distributionTotalLabel, { color: colors.text }]}>
                      Total Distributed
                    </Text>
                    <Text style={[styles.distributionTotalAmount, { color: colors.success }]}>
                      Rs. {calculatedDistribution.reduce((sum, inv) => sum + (inv.profitAmount || 0), 0).toFixed(2)}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.profitModalFooter}>
              <TouchableOpacity
                style={[styles.profitCancelButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowProfitDistributionModal(false);
                  setProfitFormData({ totalProfit: '', totalExpenses: '' });
                  setCalculatedDistribution([]);
                  setIsDistributingProfits(false);
                }}
                activeOpacity={0.7}
                disabled={isDistributingProfits}
              >
                <Text style={[styles.profitButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.profitSubmitButton,
                  {
                    backgroundColor: colors.success,
                    opacity: (calculatedDistribution.length === 0 || isDistributingProfits) ? 0.5 : 1
                  }
                ]}
                onPress={handleProfitDistribution}
                activeOpacity={0.7}
                disabled={calculatedDistribution.length === 0 || isDistributingProfits}
              >
                {isDistributingProfits ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={[styles.profitButtonText, { color: '#FFFFFF' }]}>Distributing...</Text>
                  </View>
                ) : (
                  <Text style={[styles.profitButtonText, { color: '#FFFFFF' }]}>Distribute Profits</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profit History Modal */}
      <ProfitHistoryModal
        visible={showProfitHistoryModal}
        onClose={() => {
          setShowProfitHistoryModal(false);
          setSelectedInvestorForProfitHistory(null);
        }}
        investorId={selectedInvestorForProfitHistory?._id || ''}
        investorName={selectedInvestorForProfitHistory?.name || ''}
        profitHistory={selectedInvestorForProfitHistory?.profitHistory}
        onSuccess={() => loadInvestors(false)}
        colors={colors}
      />

      {/* Investor Details Modal */}
      <InvestorDetailsModal
        visible={showInvestorDetailsModal}
        onClose={() => setShowInvestorDetailsModal(false)}
        investor={selectedInvestorDetails}
        colors={colors}
        formatCurrency={formatCurrency}
        calculateTotalProfit={calculateTotalProfit}
      />

      {/* Share Options Modal */}
      <Modal
        visible={showShareOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowShareOptionsModal(false);
          setSelectedInvestorForShare(null);
        }}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.shareOptionsContainer, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="share-social" size={20} color={colors.primary} />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Share Statement</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.lightText }]}>
                    Choose what to share
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.lightBackground }]}
                onPress={() => {
                  setShowShareOptionsModal(false);
                  setSelectedInvestorForShare(null);
                }}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.shareOptions}>
              <TouchableOpacity
                style={[styles.shareOption, { borderBottomColor: colors.border }]}
                onPress={() => handleShareOption('current')}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionIcon, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="calendar-outline" size={22} color={colors.success} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>Current Month Profit</Text>
                    <Text style={[styles.optionSubtitle, { color: colors.lightText }]}>
                      Share profit statement for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.lightText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.shareOption, { borderBottomColor: 'transparent' }]}
                onPress={() => handleShareOption('history')}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionIcon, { backgroundColor: colors.primary + '20' }]}>
                    <Ionicons name="document-text-outline" size={22} color={colors.primary} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>Complete History</Text>
                    <Text style={[styles.optionSubtitle, { color: colors.lightText }]}>
                      Share complete profit history and investment details
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.lightText} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalFooter}>
              <Text style={[styles.footerText, { color: colors.lightText }]}>
                Tap an option to generate and share PDF
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Balance Profit Modal */}
      <Modal
        visible={showBalanceProfitModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowBalanceProfitModal(false);
          setBalanceEntries([{ heading: '', value: '', type: 'deduction' }]);
        }}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.balanceProfitContainer, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="calculator-outline" size={20} color={colors.success} />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Balance the Profit</Text>
                  <Text style={[styles.modalSubtitle, { color: colors.lightText }]}>
                    Add custom earnings or deductions
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.lightBackground }]}
                onPress={() => {
                  setShowBalanceProfitModal(false);
                  setBalanceEntries([{ heading: '', value: '', type: 'deduction' }]);
                }}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.balanceModalContent} showsVerticalScrollIndicator={false}>


              {balanceEntries.map((entry, index) => (
                <View key={index} style={[styles.balanceEntryCard, { backgroundColor: colors.lightBackground }]}>
                  <View style={styles.balanceEntryHeader}>
                    <Text style={[styles.balanceEntryTitle, { color: colors.text }]}>
                      Entry {index + 1}
                    </Text>
                    {balanceEntries.length > 1 && (
                      <TouchableOpacity
                        onPress={() => handleRemoveBalanceEntry(index)}
                        style={[styles.removeEntryButton, { backgroundColor: colors.danger + '20' }]}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.balanceInputField}>
                    <Text style={[styles.balanceLabel, { color: colors.text }]}>Heading</Text>
                    <TextInput
                      style={[styles.balanceInput, {
                        backgroundColor: colors.cardBackground,
                        color: colors.text,
                        borderColor: colors.border
                      }]}
                      placeholder="e.g., Office Rent, Bonus"
                      placeholderTextColor={colors.lightText}
                      value={entry.heading}
                      onChangeText={(text) => handleBalanceEntryChange(index, 'heading', text)}
                    />
                  </View>

                  <View style={styles.balanceInputField}>
                    <Text style={[styles.balanceLabel, { color: colors.text }]}>Amount (PKR)</Text>
                    <TextInput
                      style={[styles.balanceInput, {
                        backgroundColor: colors.cardBackground,
                        color: colors.text,
                        borderColor: colors.border
                      }]}
                      placeholder="0"
                      placeholderTextColor={colors.lightText}
                      keyboardType="numeric"
                      value={entry.value}
                      onChangeText={(text) => handleBalanceEntryChange(index, 'value', text)}
                    />
                  </View>

                  <View style={styles.balanceTypeContainer}>
                    <Text style={[styles.balanceLabel, { color: colors.text }]}>Type</Text>
                    <View style={styles.balanceTypeOptions}>
                      <TouchableOpacity
                        style={[
                          styles.balanceTypeOption,
                          { borderColor: colors.border },
                          entry.type === 'earning' && {
                            backgroundColor: colors.success + '20',
                            borderColor: colors.success
                          }
                        ]}
                        onPress={() => handleBalanceEntryChange(index, 'type', 'earning')}
                      >
                        <View style={[
                          styles.radioOuter,
                          { borderColor: entry.type === 'earning' ? colors.success : colors.border }
                        ]}>
                          {entry.type === 'earning' && (
                            <View style={[styles.radioInner, { backgroundColor: colors.success }]} />
                          )}
                        </View>
                        <Ionicons
                          name="trending-up"
                          size={18}
                          color={entry.type === 'earning' ? colors.success : colors.lightText}
                        />
                        <Text style={[
                          styles.balanceTypeText,
                          { color: entry.type === 'earning' ? colors.success : colors.lightText }
                        ]}>
                          Earning
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.balanceTypeOption,
                          { borderColor: colors.border },
                          entry.type === 'deduction' && {
                            backgroundColor: colors.danger + '20',
                            borderColor: colors.danger
                          }
                        ]}
                        onPress={() => handleBalanceEntryChange(index, 'type', 'deduction')}
                      >
                        <View style={[
                          styles.radioOuter,
                          { borderColor: entry.type === 'deduction' ? colors.danger : colors.border }
                        ]}>
                          {entry.type === 'deduction' && (
                            <View style={[styles.radioInner, { backgroundColor: colors.danger }]} />
                          )}
                        </View>
                        <Ionicons
                          name="trending-down"
                          size={18}
                          color={entry.type === 'deduction' ? colors.danger : colors.lightText}
                        />
                        <Text style={[
                          styles.balanceTypeText,
                          { color: entry.type === 'deduction' ? colors.danger : colors.lightText }
                        ]}>
                          Deduction
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.addEntryButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                onPress={handleAddBalanceEntry}
              >
                <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                <Text style={[styles.addEntryText, { color: colors.primary }]}>Add Another Entry</Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.balanceModalFooter}>
              <TouchableOpacity
                style={[styles.profitCancelButton, { backgroundColor: colors.lightBackground, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => {
                  setShowBalanceProfitModal(false);
                  setBalanceEntries([{ heading: '', value: '', type: 'deduction' }]);
                }}
              >
                <Text style={[styles.profitButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.profitSubmitButton, { backgroundColor: colors.success }]}
                onPress={handleGenerateCurrentMonthPDF}
              >
                <Text style={[styles.profitButtonText, { color: '#FFFFFF' }]}>Generate PNG</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  investorSection: {
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
  searchButton: {
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
  profitButton: {
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
  investorCard: {
    marginBottom: 16,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  investorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
    gap: 4,
  },
  investorInfo: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  investorName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  investorId: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: 1,
  },
  cardActionButton: {
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
  investorDetails: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  investorRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  investorCol: {
    flex: 1,
    marginRight: 16,
  },
  investorLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  investorValue: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
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

  // Total Investment Card Styles
  totalInvestmentCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  totalInvestmentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalInvestmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  totalInvestmentInfo: {
    flex: 1,
  },
  totalInvestmentLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalInvestmentValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  // Skeleton Styles
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
    padding: 12,
    paddingBottom: 8,
  },
  skeletonInfo: {
    flex: 1,
  },
  skeletonLine: {
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTitle: {
    height: 18,
    width: '70%',
  },
  skeletonSubtitle: {
    height: 13,
    width: '50%',
  },
  skeletonBadge: {
    height: 24,
    width: 60,
    borderRadius: 12,
  },
  skeletonDetails: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  skeletonRow: {
    flexDirection: 'row',
    marginBottom: 8,
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

  // Edit Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  whiteOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  editModalContainer: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  modalInvestorName: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editOptions: {
    paddingHorizontal: 20,
  },
  editOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  optionSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.7,
    lineHeight: 18,
  },
  modalFooter: {
    padding: 20,
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
    textAlign: 'center',
  },

  // Profit Distribution Modal Styles
  profitModalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  receiptContainer: {
    width: '100%',
    maxWidth: '100%',
    maxHeight: '95%',
    borderRadius: 0,
    overflow: 'hidden',
    elevation: 0,
  },
  profitModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.8,
    marginTop: 2,
  },
  profitModalContent: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  profitInputContainer: {
    marginBottom: 20,
  },
  profitInputField: {
    marginBottom: 16,
  },
  profitLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  profitInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  profitSummary: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryCol: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  distributionPreview: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  distributionInfo: {
    flex: 1,
  },
  distributionName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    letterSpacing: -0.1,
  },
  distributionDetails: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  distributionAmount: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  distributionTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 8,
    borderTopWidth: 2,
    borderRadius: 8,
  },
  distributionTotalLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  distributionTotalAmount: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  netSummary: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  netValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  profitModalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    gap: 12,
  },
  profitCancelButton: {
    flex: 0.4,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profitSubmitButton: {
    flex: 0.6,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.1,
  },

  inputContainer: {
    marginBottom: 20,
  },
  inputField: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: 400,
  },
  editModalFooter: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    gap: 8,
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  submitButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  requiredNote: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },

  eyeButton: {
    padding: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerDoneButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  datePickerDoneText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },

  shareOptionsContainer: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  shareOptions: {
    paddingHorizontal: 20,
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },

  balanceProfitContainer: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  balanceModalContent: {
    paddingHorizontal: 20,
    maxHeight: 450,
  },
  balanceEntryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  balanceEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceEntryTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  removeEntryButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceInputField: {
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  balanceInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  balanceTypeContainer: {
    marginTop: 4,
  },
  balanceTypeOptions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  balanceTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 6,
  },
  balanceTypeText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  addEntryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addEntryText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  balanceModalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  receiptPreview: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 0,
    padding: 16,
    width: '100%',
  },
  thermalReceiptPreview: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 0,
    padding: 14,
    width: 300,
    alignSelf: 'center',
  },
  
  // Thermal Receipt Styles
  thermalHeaderContainer: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: -12,
    marginTop: -12,
    marginBottom: 0,
  },
  thermalHeaderContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thermalHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thermalHeaderCompanyName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  thermalHeaderSubtitle: {
    fontSize: 10,
    color: '#E5E7EB',
    marginTop: 2,
    fontWeight: '500',
  },
  thermalHeaderRight: {
    alignItems: 'flex-end',
  },
  thermalHeaderStatementNo: {
    fontSize: 11,
    color: '#E5E7EB',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  thermalHeaderDate: {
    fontSize: 10,
    color: '#E5E7EB',
    marginTop: 3,
  },
  
  thermalLogoSection: {
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
  },
  thermalLogo: {
    fontSize: 32,
    marginBottom: 4,
  },
  thermalBusinessName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  
  dividerLine: {
    height: 1,
    marginVertical: 6,
  },
  
  thermalReceiptTitleSection: {
    alignItems: 'center',
    marginVertical: 4,
  },
  thermalReceiptTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  thermalReceiptDate: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  
  thermalDetailsSection: {
    marginVertical: 4,
    marginTop: 10,
  },
  thermalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  thermalDetailLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  thermalDetailValue: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  
  thermalPrayerText: {
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 4,
    lineHeight: 18,
    fontFamily: 'Scheherazade New',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  
  thermalTable: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  thermalTableHeader: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    gap: 8,
  },
  thermalThDesc: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  thermalThAmt: {
    flex: 0.45,
    textAlign: 'right',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  
  thermalTableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    gap: 8,
  },
  thermalTableRowSeparator: {
    height: 2,
    borderBottomWidth: 2,
  },
  thermalTdDesc: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
  },
  thermalTdAmt: {
    flex: 0.45,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
  },
  
  thermalNetSummary: {
    marginVertical: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thermalNetLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  thermalNetValue: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  
  thermalDisclaimerSection: {
    marginVertical: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 0,
  },
  thermalDisclaimerText: {
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 12,
  },
  
  thermalReceiptFooter: {
    alignItems: 'center',
    marginVertical: 4,
    paddingVertical: 4,
  },
  thermalThanks: {
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  thermalFooterNote: {
    fontSize: 9,
    fontWeight: '500',
    marginTop: 1,
    textAlign: 'center',
  },
  
  receiptHeader: {
    marginBottom: 10,
    alignItems: 'center',
  },
  receiptTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  receiptSub: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8,
    marginTop: 2,
  },
  receiptDetails: {
    marginBottom: 10,
  },
  sallaText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailsLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  table: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    gap: 2,
    backgroundColor: '#F9FAFB',
    borderBottomColor: '#E5E7EB',
  },
  thDesc: {
    flex: 1.2,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  thAmt: {
    flex: 0.6,
    textAlign: 'right',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
  },
  tdDesc: {
    flex: 1.2,
    fontSize: 13,
    fontWeight: '600',
  },
  tdAmt: {
    flex: 0.6,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '700',
  },
  receiptFooter: {
    marginTop: 10,
    alignItems: 'center',
  },
  receiptNote: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.8,
    textAlign: 'center',
  },
  receiptThanks: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  appName: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  disclaimerSection: {
    marginVertical: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 0,
    backgroundColor: '#FEF3C7',
  },
  disclaimerText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
});