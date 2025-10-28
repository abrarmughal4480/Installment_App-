import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Animated,
  Keyboard,
  Modal,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import TokenService from '../services/tokenService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';

export default function CreateInstallment() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const insets = useSafeAreaInsets();

  
  const [formData, setFormData] = useState({
    customerId: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    reference: '',
    managerId: '',
    productName: '',
    productDescription: '',
    totalAmount: '',
    advanceAmount: '',
    installmentCount: '',
    installmentUnit: 'months',
    monthlyInstallment: '',
    startDate: new Date().toISOString().split('T')[0], 
    dueDate: '', 
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [managers, setManagers] = useState<any[]>([]);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [selectedManager, setSelectedManager] = useState<any>(null);
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [isManagerSearchFocused, setIsManagerSearchFocused] = useState(false);
  
  // Date picker states
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(new Date());

  
  const dot1Opacity = useRef(new Animated.Value(0.3)).current;
  const dot2Opacity = useRef(new Animated.Value(0.3)).current;
  const dot3Opacity = useRef(new Animated.Value(0.3)).current;
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;


  
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

  const handleManagerModalClose = () => {
    // Animate modal close
    Animated.parallel([
      Animated.timing(modalScale, {
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
      setShowManagerDropdown(false);
      setManagerSearchQuery('');
      setIsManagerSearchFocused(false);
    });
  };

  const handleManagerModalOpen = () => {
    setShowManagerDropdown(true);
    // Animate modal open
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadManagers = async () => {
    try {
      const response = await apiService.getManagers();
      if (response.success) {
        setManagers(response.managers || []);
      }
    } catch (error) {
      console.log('Error loading managers:', error);
    }
  };

  // Filter managers based on search query
  const filteredManagers = managers.filter(manager => 
    manager.name.toLowerCase().includes(managerSearchQuery.toLowerCase()) ||
    manager.email.toLowerCase().includes(managerSearchQuery.toLowerCase())
  );

  useEffect(() => {
    loadUserData();
    loadManagers();
    
    
    if (params.editMode === 'true') {
      setIsEditMode(true);
      prefillFormForEdit();
    }
    
    
    return () => {
      
    };
  }, []);

  useEffect(() => {
    if (user) {
      setIsLoading(false);
    }
  }, [user]);

  // Set selected manager when managers are loaded and we have a managerId
  useEffect(() => {
    if (managers.length > 0 && formData.managerId) {
      const manager = managers.find(m => m._id === formData.managerId);
      if (manager) {
        setSelectedManager(manager);
      }
    }
  }, [managers, formData.managerId]);

  
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      // Handle keyboard show if needed
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      // Clear search when keyboard hides
      if (showManagerDropdown) {
        setTimeout(() => {
          setIsManagerSearchFocused(false);
        }, 100);
      }
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [showManagerDropdown]);

  
  useFocusEffect(
    React.useCallback(() => {
      
      setTimeout(() => {
        
      }, 100);
      
      return () => {
        
      };
    }, [])
  );


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

  const prefillFormForEdit = () => {

    setFormData({
      customerId: params.customerId as string || '',
      name: params.customerName as string || '',
      email: params.customerEmail as string || '',
      phone: params.customerPhone as string || '',
      address: params.customerAddress as string || '',
      reference: params.reference as string || '',
      managerId: params.managerId as string || '',
      productName: params.productName as string || '',
      productDescription: params.productDescription as string || '',
      totalAmount: formatNumberWithCommas(params.remainingAmount as string || ''),
      advanceAmount: '0', 
      installmentCount: params.installmentCount as string || '',
      installmentUnit: params.installmentUnit as string || 'months',
      monthlyInstallment: formatNumberWithCommas(params.monthlyInstallment as string || ''),
      startDate: new Date().toISOString().split('T')[0],
      dueDate: params.dueDay as string || '',
    });
  };



  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.customerId.trim()) newErrors.customerId = 'Customer ID is required';
    if (!formData.productName.trim()) newErrors.productName = 'Product name is required';

    if (!formData.totalAmount.trim()) newErrors.totalAmount = 'Total amount is required';
    else {
      const totalAmount = Number(removeCommas(formData.totalAmount));
      if (isNaN(totalAmount) || totalAmount <= 0) {
        newErrors.totalAmount = 'Enter a valid amount';
      }
    }

    if (formData.advanceAmount.trim()) {
      const advanceAmount = Number(removeCommas(formData.advanceAmount));
      if (isNaN(advanceAmount) || advanceAmount < 0) {
        newErrors.advanceAmount = 'Enter a valid advance amount';
      }
    }

    if (!formData.installmentCount.trim()) newErrors.installmentCount = 'Installment count is required';
    else if (isNaN(Number(formData.installmentCount)) || Number(formData.installmentCount) <= 0) {
      newErrors.installmentCount = 'Enter a valid count';
    }

    if (!formData.monthlyInstallment.trim()) newErrors.monthlyInstallment = 'Monthly installment is required';
    else {
      const monthlyAmount = Number(removeCommas(formData.monthlyInstallment));
      if (isNaN(monthlyAmount) || monthlyAmount <= 0) {
        newErrors.monthlyInstallment = 'Enter a valid amount';
      }
    }

    if (!formData.startDate.trim()) newErrors.startDate = 'Start date is required';

    if (!formData.dueDate.trim()) newErrors.dueDate = 'Due day is required';
    else {
      const dueDay = Number(formData.dueDate);
      if (isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
        newErrors.dueDate = 'Enter a valid day (1-31)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setSelectedStartDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, startDate: formattedDate }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showError('Please fix the errors before submitting');
      return;
    }

    setIsSubmitting(true);

    try {
      
      const customerData = {
        customerId: formData.customerId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address || '',
        reference: formData.reference || '',
        managerId: formData.managerId || undefined,
        productName: formData.productName,
        productDescription: formData.productDescription || '',
        totalAmount: Number(removeCommas(formData.totalAmount)),
        advanceAmount: Number(removeCommas(formData.advanceAmount)) || 0,
        installmentCount: Number(formData.installmentCount),
        installmentUnit: formData.installmentUnit,
        monthlyInstallment: Number(removeCommas(formData.monthlyInstallment)),
        startDate: formData.startDate,
        dueDate: formData.dueDate,
      };


      
      const response = await apiService.createInstallments({
        ...customerData,
        installmentId: isEditMode ? params.installmentId : undefined
      });
      
      if (response.success) {
        showSuccess(isEditMode 
          ? 'Installment updated successfully!' 
          : 'Customer and installments created successfully!');
        setTimeout(() => {
          router.back();
        }, 1500);
      } else {
        showError(response.message || `Failed to ${isEditMode ? 'update' : 'create'} installments`);
      }
    } catch (error) {
      showError('Failed to create installment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  
  const formatNumberWithCommas = (num: number | string): string => {
    const number = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(number)) return '';
    return Math.round(number).toLocaleString('en-IN');
  };

  
  const removeCommas = (str: string): string => {
    return str.replace(/,/g, '');
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const calculateMonthlyInstallment = () => {
    const total = Number(removeCommas(formData.totalAmount));
    const advance = isEditMode ? 0 : (Number(removeCommas(formData.advanceAmount)) || 0);
    const count = Number(formData.installmentCount);
    
    if (total > 0 && count > 0) {
      const remainingAmount = total - advance;
      const monthly = Math.ceil(remainingAmount / count); 
      setFormData(prev => ({
        ...prev,
        monthlyInstallment: formatNumberWithCommas(monthly)
      }));
    }
  };

  useEffect(() => {
    calculateMonthlyInstallment();
  }, [formData.totalAmount, formData.installmentCount, formData.advanceAmount]);

  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
          <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
            <View style={styles.loadingContent}>
              <View style={styles.loadingIconContainer}>
                <View style={styles.loadingIcon}>
                  <Ionicons name="add-circle" size={40} color={colors.primary} />
                </View>
                <View style={styles.loadingDots}>
                  <Animated.View style={[styles.loadingDot, styles.dot1, { opacity: dot1Opacity }]} />
                  <Animated.View style={[styles.loadingDot, styles.dot2, { opacity: dot2Opacity }]} />
                  <Animated.View style={[styles.loadingDot, styles.dot3, { opacity: dot3Opacity }]} />
                </View>
              </View>
              <Text style={[styles.loadingTitle, { color: colors.text }]}>
                Loading Create Installment
              </Text>
              <Text style={[styles.loadingSubtitle, { color: colors.lightText }]}>
                Please wait while we prepare the form...
              </Text>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

        {/* Modern Header with Gradient - Same as adminDashboard */}
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
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <View>
                <Text style={styles.modernHeaderTitle}>
                  {isEditMode ? 'Edit Installment' : 'Create Installment'}
                </Text>
                <Text style={styles.modernHeaderSubtitle}>
                  {isEditMode ? 'Update installment details' : 'Add new customer or existing customer'}
                </Text>
              </View>
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
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
            {/* Customer Information Form */}
            <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Customer Information
              </Text>
              
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Customer ID *</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        borderColor: errors.customerId ? colors.danger : colors.border
                      }
                    ]}
                    value={formData.customerId}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, customerId: text }))}
                    placeholder="Customer ID"
                    placeholderTextColor={colors.lightText}
                  />
                  {errors.customerId && (
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errors.customerId}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Name *</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        borderColor: errors.name ? colors.danger : colors.border
                      }
                    ]}
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    placeholder="Customer name"
                    placeholderTextColor={colors.lightText}
                  />
                  {errors.name && (
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errors.name}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Email</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        borderColor: errors.email ? colors.danger : colors.border
                      }
                    ]}
                    value={formData.email}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                      placeholder="Email address (optional)"
                    placeholderTextColor={colors.lightText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {errors.email && (
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errors.email}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Phone</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        borderColor: errors.phone ? colors.danger : colors.border
                      }
                    ]}
                    value={formData.phone}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                      placeholder="Phone number (optional)"
                    placeholderTextColor={colors.lightText}
                    keyboardType="phone-pad"
                  />
                  {errors.phone && (
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errors.phone}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Address</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        borderColor: colors.border
                      }
                    ]}
                    value={formData.address}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                    placeholder="Address (optional)"
                    placeholderTextColor={colors.lightText}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Reference</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        borderColor: colors.border
                      }
                    ]}
                    value={formData.reference}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, reference: text }))}
                    placeholder="Reference (optional)"
                    placeholderTextColor={colors.lightText}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Manager</Text>
                  <TouchableOpacity
                    style={[
                      styles.modernDropdownButton,
                      { 
                        borderColor: selectedManager ? colors.primary : colors.border,
                        backgroundColor: selectedManager ? colors.primary + '10' : colors.inputBackground,
                      }
                    ]}
                    onPress={handleManagerModalOpen}
                    activeOpacity={0.8}
                  >
                    <View style={styles.dropdownContent}>
                      <View style={styles.dropdownTextContainer}>
                        <Text style={[
                          styles.modernDropdownText,
                          { 
                            color: selectedManager ? colors.text : colors.lightText 
                          }
                        ]}>
                          {selectedManager ? selectedManager.name : 'Select Manager'}
                        </Text>
                        {selectedManager && (
                          <Text style={[styles.modernDropdownSubtext, { color: colors.lightText }]}>
                            {selectedManager.email}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Ionicons 
                      name="chevron-down" 
                      size={18} 
                      color={selectedManager ? colors.primary : colors.lightText} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Manager Selection Modal */}
            <Modal
              visible={showManagerDropdown}
              transparent
              animationType="fade"
              onRequestClose={handleManagerModalClose}
            >
              <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
                <Animated.View style={[
                  styles.managerModalContainer, 
                  { 
                    backgroundColor: colors.cardBackground,
                    transform: [{ scale: modalScale }]
                  }
                ]}>
                  {/* Header */}
                  <View style={[styles.modalHeader, { backgroundColor: colors.primary + '10' }]}>
                    <View style={styles.headerText}>
                      <Text style={[styles.modalTitle, { color: colors.text }]}>
                        Select Manager
                      </Text>
                      <Text style={[styles.modalSubtitle, { color: colors.lightText }]}>
                        Choose a manager for this customer
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleManagerModalClose}
                      style={[styles.closeButton, { backgroundColor: colors.border }]}
                    >
                      <Ionicons name="close" size={18} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  {/* Search Bar */}
                  <View style={styles.searchContainer}>
                    <View style={[
                      styles.searchInputWrapper, 
                      { 
                        borderColor: isManagerSearchFocused ? colors.primary : colors.border,
                        borderWidth: isManagerSearchFocused ? 2 : 1,
                      }
                    ]}>
                      <Ionicons name="search" size={18} color={colors.lightText} style={styles.searchIcon} />
                      <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        value={managerSearchQuery}
                        onChangeText={setManagerSearchQuery}
                        placeholder="Search managers..."
                        placeholderTextColor={colors.lightText}
                        onFocus={() => setIsManagerSearchFocused(true)}
                        onBlur={() => setIsManagerSearchFocused(false)}
                      />
                      {managerSearchQuery.length > 0 && (
                        <TouchableOpacity
                          onPress={() => setManagerSearchQuery('')}
                          style={styles.clearSearchButton}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close-circle" size={16} color={colors.lightText} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* Manager List */}
                  <ScrollView style={styles.managerList} showsVerticalScrollIndicator={false}>
                    {filteredManagers.length === 0 ? (
                      <View style={styles.emptyState}>
                        <Text style={[styles.emptyStateText, { color: colors.lightText }]}>
                          {managerSearchQuery ? 'No managers found' : 'No managers available'}
                        </Text>
                        {managerSearchQuery && (
                          <Text style={[styles.emptyStateSubtext, { color: colors.lightText }]}>
                            Try adjusting your search terms
                          </Text>
                        )}
                      </View>
                    ) : (
                      filteredManagers.map((manager, index) => (
                        <TouchableOpacity
                          key={manager._id}
                          style={[
                            styles.managerItem,
                            { 
                              backgroundColor: selectedManager?._id === manager._id ? colors.primary + '15' : 'transparent',
                              borderBottomWidth: index === filteredManagers.length - 1 ? 0 : 1,
                              borderBottomColor: colors.border,
                            }
                          ]}
                          onPress={() => {
                            setSelectedManager(manager);
                            setFormData(prev => ({ ...prev, managerId: manager._id }));
                            handleManagerModalClose();
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.managerItemContent}>
                            <View style={styles.managerInfo}>
                              <Text style={[
                                styles.managerName,
                                { 
                                  color: selectedManager?._id === manager._id ? colors.primary : colors.text 
                                }
                              ]}>
                                {manager.name}
                              </Text>
                              <Text style={[
                                styles.managerEmail,
                                { 
                                  color: selectedManager?._id === manager._id ? colors.primary : colors.lightText 
                                }
                              ]}>
                                {manager.email}
                              </Text>
                            </View>
                            {selectedManager?._id === manager._id && (
                              <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]}>
                                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>

                  {/* Clear Selection Button */}
                  {selectedManager && (
                    <View style={styles.clearSelectionContainer}>
                      <TouchableOpacity
                        style={[styles.clearSelectionButton, { borderColor: colors.danger }]}
                        onPress={() => {
                          setSelectedManager(null);
                          setFormData(prev => ({ ...prev, managerId: '' }));
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={16} color={colors.danger} />
                        <Text style={[styles.clearSelectionText, { color: colors.danger }]}>
                          Clear Selection
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </Animated.View>
              </Animated.View>
            </Modal>

            {/* Product Information */}
            <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Product Information
              </Text>
              
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Product Name *</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        borderColor: errors.productName ? colors.danger : colors.border
                      }
                    ]}
                    value={formData.productName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, productName: text }))}
                    placeholder="Product name"
                    placeholderTextColor={colors.lightText}
                  />
                  {errors.productName && (
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errors.productName}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Product Description</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        borderColor: colors.border
                      }
                    ]}
                    value={formData.productDescription}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, productDescription: text }))}
                    placeholder="Description (optional)"
                    placeholderTextColor={colors.lightText}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </View>

            {/* Installment Information */}
            <View style={[styles.sectionCard, { backgroundColor: colors.cardBackground }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isEditMode ? 'Remaining Installment Information' : 'Installment Information'}
              </Text>
              
              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    {isEditMode ? 'Remaining Amount *' : 'Total Amount *'}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { borderColor: errors.totalAmount ? colors.danger : colors.border }
                    ]}
                    value={formData.totalAmount}
                    onChangeText={(text) => {
                      const numericValue = removeCommas(text);
                      if (numericValue === '' || !isNaN(Number(numericValue))) {
                        setFormData(prev => ({ 
                          ...prev, 
                          totalAmount: numericValue === '' ? '' : formatNumberWithCommas(numericValue)
                        }));
                      }
                    }}
                    placeholder="Total amount (e.g., 8,00,000)"
                    placeholderTextColor={colors.lightText}
                    keyboardType="numeric"
                  />
                  {errors.totalAmount && (
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errors.totalAmount}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    {isEditMode ? 'Advance Amount (Not applicable for remaining)' : 'Advance Amount'}
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { 
                        borderColor: errors.advanceAmount ? colors.danger : colors.border,
                        backgroundColor: isEditMode ? colors.border : colors.cardBackground,
                        opacity: isEditMode ? 0.6 : 1
                      }
                    ]}
                    value={formData.advanceAmount}
                    onChangeText={(text) => {
                      if (!isEditMode) {
                        const numericValue = removeCommas(text);
                        if (numericValue === '' || !isNaN(Number(numericValue))) {
                          setFormData(prev => ({ 
                            ...prev, 
                            advanceAmount: numericValue === '' ? '' : formatNumberWithCommas(numericValue)
                          }));
                        }
                      }
                    }}
                    placeholder={isEditMode ? "Not applicable for remaining installments" : "Advance paid (optional) (e.g., 1,00,000)"}
                    placeholderTextColor={colors.lightText}
                    keyboardType="numeric"
                    editable={!isEditMode}
                  />
                  {errors.advanceAmount && (
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errors.advanceAmount}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    {isEditMode ? 'Remaining Installment Count *' : 'Installment Count *'}
                  </Text>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={[
                        styles.textInputWithUnit,
                        { borderColor: errors.installmentCount ? colors.danger : colors.border }
                      ]}
                      value={formData.installmentCount}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, installmentCount: text }))}
                      placeholder="Number"
                      placeholderTextColor={colors.lightText}
                      keyboardType="numeric"
                    />
                    <View style={styles.unitSelector}>
                      <TouchableOpacity
                        style={[
                          styles.unitButton,
                          { 
                            backgroundColor: formData.installmentUnit === 'days' ? colors.primary : colors.background,
                            borderColor: colors.primary
                          }
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, installmentUnit: 'days' }))}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.unitButtonText,
                          { color: formData.installmentUnit === 'days' ? '#FFFFFF' : colors.primary }
                        ]}>
                          Days
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.unitButton,
                          { 
                            backgroundColor: formData.installmentUnit === 'weeks' ? colors.primary : colors.background,
                            borderColor: colors.primary
                          }
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, installmentUnit: 'weeks' }))}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.unitButtonText,
                          { color: formData.installmentUnit === 'weeks' ? '#FFFFFF' : colors.primary }
                        ]}>
                          Weeks
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.unitButton,
                          { 
                            backgroundColor: formData.installmentUnit === 'months' ? colors.primary : colors.background,
                            borderColor: colors.primary
                          }
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, installmentUnit: 'months' }))}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.unitButtonText,
                          { color: formData.installmentUnit === 'months' ? '#FFFFFF' : colors.primary }
                        ]}>
                          Months
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {errors.installmentCount && (
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errors.installmentCount}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    {formData.installmentUnit === 'days' ? 'Daily' : 
                     formData.installmentUnit === 'weeks' ? 'Weekly' : 'Monthly'} Installment *
                  </Text>
                  <View style={styles.inputWithUnit}>
                    <TextInput
                      style={[
                        styles.textInputWithUnit,
                        { borderColor: errors.monthlyInstallment ? colors.danger : colors.border }
                      ]}
                      value={formData.monthlyInstallment}
                      onChangeText={(text) => {
                        const numericValue = removeCommas(text);
                        if (numericValue === '' || !isNaN(Number(numericValue))) {
                          setFormData(prev => ({ 
                            ...prev, 
                            monthlyInstallment: numericValue === '' ? '' : formatNumberWithCommas(numericValue)
                          }));
                        }
                      }}
                      placeholder="Auto calculated (e.g., 25,000)"
                      placeholderTextColor={colors.lightText}
                      keyboardType="numeric"
                    />
                    <View style={styles.unitDisplay}>
                      <Text style={[styles.unitDisplayText, { color: colors.primary }]}>
                        {formData.installmentUnit === 'days' ? 'Rs/day' : 
                         formData.installmentUnit === 'weeks' ? 'Rs/week' : 'Rs/month'}
                      </Text>
                    </View>
                  </View>
                  {errors.monthlyInstallment && (
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errors.monthlyInstallment}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.inputLabelRow}>
                    <Ionicons name="calendar" size={18} color={colors.primary} />
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Start Date *</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.datePickerButton, { 
                      borderColor: errors.startDate ? colors.danger : colors.border,
                      backgroundColor: colors.background
                    }]}
                    onPress={() => setShowStartDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.datePickerText, { 
                      color: formData.startDate ? colors.text : colors.lightText 
                    }]}>
                      {formData.startDate ? formatDate(formData.startDate) : 'Select Start Date'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  {errors.startDate && (
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errors.startDate}
                    </Text>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Due Day *</Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      { borderColor: errors.dueDate ? colors.danger : colors.border }
                    ]}
                    value={formData.dueDate}
                    onChangeText={(text) => {
                      
                      const numericValue = text.replace(/[^0-9]/g, '');
                      if (numericValue === '' || (Number(numericValue) >= 1 && Number(numericValue) <= 31)) {
                        setFormData(prev => ({ ...prev, dueDate: numericValue }));
                      }
                    }}
                    placeholder="Day of month (1-31)"
                    placeholderTextColor={colors.lightText}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  {errors.dueDate && (
                    <Text style={[styles.errorText, { color: colors.danger }]}>
                      {errors.dueDate}
                    </Text>
                  )}
                  <Text style={[styles.helpText, { color: colors.lightText }]}>
                    Day of each month when installments should be collected (e.g., 10 for 10th of every month)
                  </Text>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                { 
                  backgroundColor: isSubmitting ? colors.lightText : colors.primary,
                  opacity: isSubmitting ? 0.7 : 1
                }
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.8}
            >
              <Ionicons 
                name={isSubmitting ? "hourglass" : "checkmark-circle"} 
                size={20} 
                color="#FFFFFF" 
              />
              <Text style={styles.submitButtonText}>
                {isSubmitting 
                  ? (isEditMode ? 'Updating...' : 'Creating...') 
                  : (isEditMode ? 'Update Installment' : 'Create Installment')
                }
              </Text>
            </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Date Picker for Start Date */}
      {showStartDatePicker && (
        <DateTimePicker
          value={selectedStartDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleStartDateChange}
        />
      )}
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
    marginRight: 12,
  },
  modernHeaderTitle: { 
    fontSize: 24, 
    fontWeight: '800', 
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5
  },
  modernHeaderSubtitle: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.2
  },

  scrollView: { flex: 1, marginTop: -10 },

  
  sectionCard: {
    marginTop: 20,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'visible',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    letterSpacing: -0.3,
  },


  
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A', // Explicit text color
  },
  // Modern Dropdown Button Styles
  modernDropdownButton: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 56,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownTextContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  modernDropdownText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 20,
  },
  modernDropdownSubtext: {
    fontSize: 14,
    fontWeight: '400',
    marginTop: 2,
    opacity: 0.7,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  managerModalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 60,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginRight: 2,
  },

  // Search Styles
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputWrapper: { 
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },

  // Manager List Styles
  managerList: {
    maxHeight: 300,
  },
  managerItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  managerItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  managerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  managerInfo: {
    flex: 1,
  },
  managerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  managerEmail: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty State Styles
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
    opacity: 0.7,
  },

  // Clear Selection Styles
  clearSelectionContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  clearSelectionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputWithUnit: {
    flexDirection: 'column',
    gap: 8,
  },
  textInputWithUnit: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A', // Explicit text color
  },
  unitSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  unitDisplay: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  unitDisplayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    fontWeight: '400',
    marginTop: 4,
    fontStyle: 'italic',
  },

  
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 20,
    gap: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
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

});
