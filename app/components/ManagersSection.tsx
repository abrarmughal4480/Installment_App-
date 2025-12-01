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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal';
import AddManagerModal from './AddManagerModal';

interface Manager {
  _id: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface ManagersSectionProps {
  colors: any;
  onManagerClick?: (managerId: string) => void;
  isActive?: boolean;
}

export default function ManagersSection({ colors, onManagerClick, isActive = true }: ManagersSectionProps) {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Edit dropdown state
  const [showEditDropdown, setShowEditDropdown] = useState<string | null>(null);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  
  // Individual edit modals
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [showEditEmailModal, setShowEditEmailModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  
  // Add manager modal state
  const [showAddManagerModal, setShowAddManagerModal] = useState(false);
  
  // Reset password loading state
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Password visibility states
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form input states
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    newEmail: '',
    newPassword: '',
    confirmPassword: '',
  });
  
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
  
  // Shimmer animation
  const shimmerOpacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    // Only load managers when section is active
    if (isActive) {
      loadManagers();
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

  const loadManagers = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }

      console.log('🔄 Loading managers...');
      const startTime = Date.now();
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
      });
      
      const response = await Promise.race([
        apiService.getManagers(),
        timeoutPromise
      ]) as any;
      
      const loadTime = Date.now() - startTime;
      console.log(`📡 Managers API response (${loadTime}ms):`, response);

      if (response.success) {
        console.log('✅ Managers loaded successfully:', response.managers?.length || 0, 'managers');
        setManagers(response.managers || []);
      } else {
        console.log('❌ Failed to load managers:', response);
        if (showLoader) {
          showError(response.message || 'Failed to load managers');
        }
      }
    } catch (error) {
      console.log('❌ Manager load error:', error);
      if (showLoader) {
        if ((error as any).message === 'Request timeout') {
          showError('Request timeout. Please check your connection and try again.');
        } else {
          showError('Failed to load managers. Please try again.');
        }
      }
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadManagers(false);
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

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;

  // Filter managers based on search query
  const filteredManagers = useMemo(() => {
    if (!searchQuery.trim()) {
      return managers;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return managers.filter(manager => 
      manager.name?.toLowerCase().includes(query) ||
      manager.email?.toLowerCase().includes(query) ||
      manager.phone?.toLowerCase().includes(query)
    );
  }, [managers, searchQuery]);

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

  const handleEditManager = async (manager: Manager, editType: 'name' | 'email' | 'password') => {
    setSelectedManager(manager);
    
    // Populate form data with current manager info
    setFormData({
      name: manager.name || '',
      phone: manager.phone || '',
      email: manager.email || '',
      newEmail: '',
      newPassword: '',
      confirmPassword: '',
    });
    
    if (editType === 'name') {
      setShowEditInfoModal(true);
    } else if (editType === 'email') {
      setShowEditEmailModal(true);
    } else if (editType === 'password') {
      setShowResetPasswordModal(true);
    }
  };

  const toggleEditDropdown = (manager: Manager) => {
    setSelectedManager(manager);
    setShowEditModal(true);
  };

  const handleDeleteManager = async (manager: Manager) => {
    setConfirmationModal({
      visible: true,
      title: 'Delete Manager',
      message: `Are you sure you want to delete "${manager.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmColor: colors.danger,
      icon: 'trash',
      iconColor: colors.danger,
      onConfirm: async () => {
        try {
          const response = await apiService.deleteManager(manager._id);
          
          if (response.success) {
            showSuccess('Manager deleted successfully');
            // Reload managers list
            loadManagers(false);
          } else {
            showError(response.message || 'Failed to delete manager');
          }
        } catch (error) {
          showError('Failed to delete manager. Please try again.');
        }
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.installmentSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Managers
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
    <View style={styles.installmentSection}>
      <View style={styles.sectionHeader}>
        {!showSearchBar ? (
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Managers ({filteredManagers.length})
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
              placeholder="Search managers..."
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
          {/* Add Manager Icon */}
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowAddManagerModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {filteredManagers.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
          <Ionicons name="people-outline" size={48} color={colors.lightText} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {managers.length === 0 ? 'No Managers Yet' : 'No Managers Found'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.lightText }]}>
            {managers.length === 0 
              ? 'No managers have been added yet.'
              : 'Try adjusting your search to see more managers.'
            }
          </Text>
        </View>
      ) : (
        filteredManagers.map((manager, index) => (
          <View key={manager._id}>
            <TouchableOpacity 
              style={[styles.installmentCard, { backgroundColor: colors.cardBackground }]}
              activeOpacity={0.7}
              onPress={() => {
                if (onManagerClick) {
                  onManagerClick(manager._id);
                }
              }}
            >
            <View style={styles.installmentHeader}>
              <View style={styles.installmentInfo}>
                <Text style={[styles.installmentCustomerName, { color: colors.text }]}>
                  {manager.name}
                </Text>
                <Text style={[styles.installmentId, { color: colors.lightText }]}>
                  Manager #{filteredManagers.length - index}
                </Text>
                <Text style={[styles.installmentId, { color: colors.lightText }]}>
                  Email: {manager.email}
                </Text>
                <Text style={[styles.installmentId, { color: colors.lightText }]}>
                  Phone: {manager.phone || 'Not provided'}
                </Text>
              </View>
              <View style={styles.headerActions}>
                {/* Edit and Delete buttons */}
                <TouchableOpacity
                  style={[styles.cardActionButton, { backgroundColor: colors.primary }]}
                  onPress={(e) => {
                    e.stopPropagation(); 
                    toggleEditDropdown(manager);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="create" size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cardActionButton, { backgroundColor: colors.danger }]}
                  onPress={(e) => {
                    e.stopPropagation(); 
                    handleDeleteManager(manager);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.installmentDetails}>
              <View style={styles.installmentRow}>
                <View style={styles.installmentCol}>
                  <Text style={[styles.installmentLabel, { color: colors.lightText }]}>Joined</Text>
                  <Text style={[styles.installmentValue, { color: colors.text }]}>
                    {formatDate(manager.createdAt)}
                  </Text>
                </View>
                <View style={styles.installmentCol}>
                  <Text style={[styles.installmentLabel, { color: colors.lightText }]}>Last Login</Text>
                  <Text style={[styles.installmentValue, { color: colors.text }]}>
                    {formatDate(manager.lastLogin || '')}
                  </Text>
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
                    Edit Manager
                  </Text>
                  <Text style={[styles.managerName, { color: colors.lightText }]}>
                    {selectedManager?.name}
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
            
            {/* Edit Options */}
            <View style={styles.editOptions}>
              <TouchableOpacity
                style={[styles.editOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setShowEditModal(false);
                  handleEditManager(selectedManager!, 'name');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionIcon, { backgroundColor: colors.success + '20' }]}>
                    <Ionicons name="person-outline" size={18} color={colors.success} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>Edit Info</Text>
                    <Text style={[styles.optionSubtitle, { color: colors.lightText }]}>Change name and basic information</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.lightText} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.editOption, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setShowEditModal(false);
                  handleEditManager(selectedManager!, 'email');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionIcon, { backgroundColor: colors.warning + '20' }]}>
                    <Ionicons name="mail-outline" size={18} color={colors.warning} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>Edit Email</Text>
                    <Text style={[styles.optionSubtitle, { color: colors.lightText }]}>Change email address</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.lightText} />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.editOption}
                onPress={() => {
                  setShowEditModal(false);
                  handleEditManager(selectedManager!, 'password');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.optionIcon, { backgroundColor: colors.danger + '20' }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.danger} />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: colors.text }]}>Reset Password</Text>
                    <Text style={[styles.optionSubtitle, { color: colors.lightText }]}>Change manager password</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.lightText} />
              </TouchableOpacity>
            </View>
            
            {/* Footer */}
            <View style={styles.modalFooter}>
              <Text style={[styles.footerText, { color: colors.lightText }]}>
                Select an option to edit manager details
              </Text>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Edit Info Modal */}
      <Modal
        visible={showEditInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditInfoModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContainer, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.success + '10' }]}>
              <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.success }]}>
                  <Ionicons name="person" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Edit Manager Info
                  </Text>
                  <Text style={[styles.managerName, { color: colors.lightText }]}>
                    {selectedManager?.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowEditInfoModal(false)}
                style={[styles.closeButton, { backgroundColor: colors.border }]}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Manager Name</Text>
                <TextInput
                  style={[styles.inputContainer, styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={formData.name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                  placeholder="Enter manager name"
                  placeholderTextColor={colors.lightText}
                />
              </View>
              
              <View style={styles.inputGroupLast}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number</Text>
                <TextInput
                  style={[styles.inputContainer, styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={formData.phone}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.lightText}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowEditInfoModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.success }]}
                  onPress={async () => {
                    try {
                      const response = await apiService.updateManager(selectedManager!._id, {
                        name: formData.name,
                        phone: formData.phone,
                        editType: 'name'
                      });
                      
                      if (response.success) {
                        setShowEditInfoModal(false);
                        showSuccess('Manager info updated successfully');
                        loadManagers(false); // Reload managers list
                      } else {
                        showError(response.message || 'Failed to update manager info');
                      }
                    } catch (error) {
                      showError('Failed to update manager info. Please try again.');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Edit Email Modal */}
      <Modal
        visible={showEditEmailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditEmailModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContainer, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.warning + '10' }]}>
              <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.warning }]}>
                  <Ionicons name="mail" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Edit Email Address
                  </Text>
                  <Text style={[styles.managerName, { color: colors.lightText }]}>
                    {selectedManager?.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowEditEmailModal(false)}
                style={[styles.closeButton, { backgroundColor: colors.border }]}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Current Email</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.inputText, { color: colors.text }]}>
                    {selectedManager?.email}
                  </Text>
                </View>
              </View>
              
              <View style={styles.inputGroupLast}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>New Email Address</Text>
                <TextInput
                  style={[styles.inputContainer, styles.textInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  value={formData.newEmail}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, newEmail: text }))}
                  placeholder="Enter new email address"
                  placeholderTextColor={colors.lightText}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.border }]}
                  onPress={() => setShowEditEmailModal(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.warning }]}
                  onPress={async () => {
                    if (!formData.newEmail.trim()) {
                      showError('Please enter a new email address');
                      return;
                    }
                    
                    try {
                      const response = await apiService.updateManager(selectedManager!._id, {
                        email: formData.newEmail,
                        editType: 'email'
                      });
                      
                      if (response.success) {
                        setShowEditEmailModal(false);
                        showSuccess('Email address updated successfully');
                        loadManagers(false); // Reload managers list
                      } else {
                        showError(response.message || 'Failed to update email address');
                      }
                    } catch (error) {
                      showError('Failed to update email address. Please try again.');
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveButtonText}>Update Email</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Reset Password Modal */}
      <Modal
        visible={showResetPasswordModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowResetPasswordModal(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContainer, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.danger + '10' }]}>
              <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.danger }]}>
                  <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Reset Password
                  </Text>
                  <Text style={[styles.managerName, { color: colors.lightText }]}>
                    {selectedManager?.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowResetPasswordModal(false)}
                style={[styles.closeButton, { backgroundColor: colors.border }]}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
                <View style={[styles.inputContainer, { 
                  backgroundColor: colors.background, 
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
                    placeholder="Enter new password"
                    placeholderTextColor={colors.lightText}
                    secureTextEntry={!showNewPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showNewPassword ? "eye-off" : "eye"}
                      size={20}
                      color={colors.lightText}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.inputGroupLast}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Confirm Password</Text>
                <View style={[styles.inputContainer, { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center'
                }]}>
                  <TextInput
                    style={[styles.textInput, { 
                      color: colors.text,
                      flex: 1
                    }]}
                    value={formData.confirmPassword}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.lightText}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={20}
                      color={colors.lightText}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.border }]}
                  onPress={() => {
                    setShowResetPasswordModal(false);
                    // Reset form data when modal is closed
                    setFormData(prev => ({
                      ...prev,
                      newPassword: '',
                      confirmPassword: ''
                    }));
                    setIsResettingPassword(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton, 
                    { 
                      backgroundColor: isResettingPassword ? colors.lightText : colors.danger,
                      opacity: isResettingPassword ? 0.7 : 1
                    }
                  ]}
                  onPress={async () => {
                    if (isResettingPassword) return; // Prevent multiple clicks
                    
                    if (!formData.newPassword.trim()) {
                      showError('Please enter a new password');
                      return;
                    }
                    
                    if (formData.newPassword !== formData.confirmPassword) {
                      showError('Passwords do not match');
                      return;
                    }
                    
                    if (formData.newPassword.length < 6) {
                      showError('Password must be at least 6 characters long');
                      return;
                    }
                    
                    try {
                      setIsResettingPassword(true);
                      const response = await apiService.updateManager(selectedManager!._id, {
                        password: formData.newPassword,
                        editType: 'password'
                      });
                      
                      if (response.success) {
                        setShowResetPasswordModal(false);
                        showSuccess('Password reset successfully');
                        loadManagers(false); // Reload managers list
                        // Reset form data
                        setFormData(prev => ({
                          ...prev,
                          newPassword: '',
                          confirmPassword: ''
                        }));
                      } else {
                        showError(response.message || 'Failed to reset password');
                      }
                    } catch (error) {
                      showError('Failed to reset password. Please try again.');
                    } finally {
                      setIsResettingPassword(false);
                    }
                  }}
                  activeOpacity={0.7}
                  disabled={isResettingPassword}
                >
                  <Text style={styles.saveButtonText}>
                    {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Add Manager Modal */}
      <AddManagerModal
        visible={showAddManagerModal}
        onClose={() => setShowAddManagerModal(false)}
        onSuccess={() => loadManagers(false)}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
    gap: 4,
  },
  installmentInfo: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
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
  managerName: {
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
    padding: 16,
    paddingTop: 12,
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
    textAlign: 'center',
  },
  
  // Form Styles
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupLast: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 0,
  },
  inputText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
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
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  cancelButton: {
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
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  eyeButton: {
    padding: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});