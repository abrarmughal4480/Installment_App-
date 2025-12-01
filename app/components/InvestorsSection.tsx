import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Animated,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal';
import AddInvestorModal from './AddInvestorModal';
import PDFGenerator from './PDFGenerator';
import ProfitHistoryModal from './ProfitHistoryModal';
import InvestorDetailsModal from './InvestorDetailsModal';

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
  });

  // Investor details modal state
  const [showInvestorDetailsModal, setShowInvestorDetailsModal] = useState(false);
  const [selectedInvestorDetails, setSelectedInvestorDetails] = useState<Investor | null>(null);
  
  // Profit history modal state
  const [showProfitHistoryModal, setShowProfitHistoryModal] = useState(false);
  const [selectedInvestorForProfitHistory, setSelectedInvestorForProfitHistory] = useState<Investor | null>(null);
  
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

  // Calculate total profit from profit history
  const calculateTotalProfit = (investor: Investor) => {
    console.log('🔍 Calculating total profit for:', investor.name, {
      totalProfit: investor.totalProfit,
      profitHistory: investor.profitHistory,
      profitHistoryLength: investor.profitHistory?.length
    });
    
    if (investor.totalProfit !== undefined) {
      console.log('✅ Using backend totalProfit:', investor.totalProfit);
      return investor.totalProfit;
    }
    
    if (investor.profitHistory && investor.profitHistory.length > 0) {
      const calculated = investor.profitHistory.reduce((total, profit) => total + profit.profit, 0);
      console.log('✅ Calculated from profitHistory:', calculated);
      return calculated;
    }
    
    console.log('❌ No profit data found, returning 0');
    return 0;
  };

  // Filter investors based on search query
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

  // Skeleton Card Component
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
    
    // Populate form data with current investor info
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

    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim() || !formData.investmentAmount.trim()) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      const updateData: any = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        investmentAmount: parseFloat(formData.investmentAmount),
        joinDate: formData.joinDate.toISOString(),
      };

      // Only include password if provided
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

  const handleShareInvestor = async (investor: Investor) => {
    const pdfGenerator = new PDFGenerator({ showSuccess, showError, showInfo });
    await pdfGenerator.generateInvestorPDF(investor);
  };

  const calculateDistribution = (profit: string, expenses: string) => {
    const totalProfit = parseFloat(profit) || 0;
    const totalExpenses = parseFloat(expenses) || 0;
    
    if (totalProfit > 0 && totalExpenses >= 0) {
      const netProfit = totalProfit - totalExpenses;
      
      if (netProfit > 0) {
        // Calculate total investment
        const totalInvestment = investors.reduce((sum, investor) => 
          sum + (investor.investmentAmount || 0), 0);
        
        if (totalInvestment > 0) {
          // Calculate distribution for each investor
          const distribution = investors.map(investor => {
            const investorInvestment = investor.investmentAmount || 0;
            const ratio = investorInvestment / totalInvestment;
            const investorProfit = netProfit * ratio;
            
            // Use exact profit amount without rounding
            const exactProfit = parseFloat(investorProfit.toFixed(2));
            
            return {
              ...investor,
              ratio: ratio,
              profitAmount: exactProfit,
              formattedProfit: exactProfit.toLocaleString('en-PK', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })
            };
          });
          
          setCalculatedDistribution(distribution);
        }
      } else {
        setCalculatedDistribution([]);
      }
    } else {
      setCalculatedDistribution([]);
    }
  };

  const handleProfitDistribution = async () => {
    if (calculatedDistribution.length === 0) {
      showError('Please enter valid profit and expense amounts');
      return;
    }

    const totalProfit = parseFloat(profitFormData.totalProfit);
    const totalExpenses = parseFloat(profitFormData.totalExpenses);
    const netProfit = totalProfit - totalExpenses;

    if (netProfit <= 0) {
      showError('Net profit must be greater than zero');
      return;
    }

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
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleUpdateInvestor}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Update Investor</Text>
              </TouchableOpacity>
            </View>
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
                }}
                style={[styles.closeButton, { backgroundColor: colors.border }]}
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
                          Investment: Rs. {(investor.investmentAmount || 0).toLocaleString()} • 
                          Ratio: {((investor.ratio || 0) * 100).toFixed(2)}%
                        </Text>
                      </View>
                      <Text style={[styles.distributionAmount, { color: colors.success }]}>
                        Rs. {investor.formattedProfit || '0'}
                      </Text>
                    </View>
                  ))}
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
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.profitButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.profitSubmitButton, { backgroundColor: colors.success }]}
                onPress={handleProfitDistribution}
                activeOpacity={0.7}
                disabled={calculatedDistribution.length === 0}
              >
                <Text style={[styles.profitButtonText, { color: '#FFFFFF' }]}>Distribute Profits</Text>
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
  
  // Edit Modal Form Styles
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
});

