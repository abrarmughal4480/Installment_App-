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
import { usePermissions } from '../contexts/PermissionContext';
import ConfirmationModal from './ConfirmationModal';

interface Admin {
  _id: string;
  name: string;
  email: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  permissions?: {
    canViewData: boolean;
    canAddData: boolean;
    grantedBy?: string;
    grantedAt?: string;
  };
}

interface AdminsSectionProps {
  colors: any;
  user?: any;
}

export default function AdminsSection({ colors, user }: AdminsSectionProps) {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const { refreshPermissions } = usePermissions();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // Edit dropdown state
  const [showEditDropdown, setShowEditDropdown] = useState<string | null>(null);
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  
  // Individual edit modals
  const [showEditInfoModal, setShowEditInfoModal] = useState(false);
  const [showEditEmailModal, setShowEditEmailModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  
  // Add admin modal state
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  
  // Reset password loading state
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Edit name loading state
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  
  // Permission management loading state
  const [isUpdatingPermissions, setIsUpdatingPermissions] = useState<string | null>(null);
  
  // Form input states
  const [formData, setFormData] = useState({
    name: '',
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

  // Check if current user can add admins
  const canAddAdmin = user?.type === 'admin' && user?.email === 'installmentadmin@app.com';

  useEffect(() => {
    loadAdmins();
  }, []);

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

  const loadAdmins = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }
      
      const response = await apiService.getAdmins();
      if (response.success) {
        setAdmins(response.admins || []);
      } else {
        showError('Failed to load admins');
      }
    } catch (error) {
      console.log('Error loading admins:', error);
      showError('Failed to load admins');
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAdmins(false);
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const filteredAdmins = useMemo(() => {
    if (!searchQuery.trim()) return admins;
    
    const query = searchQuery.toLowerCase().trim();
    return admins.filter(admin =>
      admin.name?.toLowerCase().includes(query) ||
      admin.email?.toLowerCase().includes(query)
    );
  }, [admins, searchQuery]);

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

  const handleEditAdmin = async (admin: Admin) => {
    setSelectedAdmin(admin);
    
    // Populate form data with current admin info
    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      newEmail: '',
      newPassword: '',
      confirmPassword: '',
    });
    
    // Directly open name edit modal
    setShowEditInfoModal(true);
  };

  const toggleEditDropdown = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowEditModal(true);
  };

  const handleDeleteAdmin = async (admin: Admin) => {
    // Prevent deleting the main admin
    if (admin.email === 'installmentadmin@app.com') {
      showError('Cannot delete the main admin account');
      return;
    }

    setConfirmationModal({
      visible: true,
      title: 'Delete Admin',
      message: `Are you sure you want to delete "${admin.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmColor: colors.danger,
      icon: 'trash',
      iconColor: colors.danger,
      onConfirm: async () => {
        try {
          const response = await apiService.deleteAdmin(admin._id);
          
          if (response.success) {
            showSuccess('Admin deleted successfully');
            // Reload admins list
            loadAdmins(false);
          } else {
            showError(response.message || 'Failed to delete admin');
          }
        } catch (error) {
          showError('Failed to delete admin. Please try again.');
        }
      },
    });
  };

  const handleAddAdmin = async () => {
    if (!formData.name.trim()) {
      showError('Please enter admin name');
      return;
    }

    if (!formData.email.trim()) {
      showError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      showError('Please enter a valid email address');
      return;
    }

    try {
      const response = await apiService.addAdmin(formData.email.trim(), formData.name.trim());
      
      if (response.success) {
        setFormData({ name: '', email: '', newEmail: '', newPassword: '', confirmPassword: '' });
        setShowAddAdminModal(false);
        showSuccess('Admin created successfully! Password sent to email.');
        loadAdmins(false); // Refresh the list
      } else {
        showError(response.message || 'Failed to create admin');
      }
    } catch (error) {
      showError('Failed to create admin. Please try again.');
    }
  };

  const handleGrantPermissions = async (admin: Admin) => {
    try {
      setIsUpdatingPermissions(admin._id);
      const response = await apiService.updateAdminPermissions(admin._id, true, true);
      
      if (response.success) {
        showSuccess('Admin permissions granted successfully');
        loadAdmins(false); // Refresh the list
        // Refresh permissions for all users (in case the granted admin is currently logged in)
        await refreshPermissions();
      } else {
        showError(response.message || 'Failed to grant permissions');
      }
    } catch (error) {
      showError('Failed to grant permissions. Please try again.');
    } finally {
      setIsUpdatingPermissions(null);
    }
  };

  const handleRevokePermissions = async (admin: Admin) => {
    try {
      setIsUpdatingPermissions(admin._id);
      const response = await apiService.updateAdminPermissions(admin._id, false, false);
      
      if (response.success) {
        showSuccess('Admin permissions revoked successfully');
        loadAdmins(false); // Refresh the list
        // Refresh permissions for all users (in case the revoked admin is currently logged in)
        await refreshPermissions();
      } else {
        showError(response.message || 'Failed to revoke permissions');
      }
    } catch (error) {
      showError('Failed to revoke permissions. Please try again.');
    } finally {
      setIsUpdatingPermissions(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.installmentSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Admins
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
            Admins ({filteredAdmins.length})
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
              placeholder="Search admins..."
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
          {/* Add Admin Icon - Only for main admin */}
          {canAddAdmin && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddAdminModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {filteredAdmins.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
          <Ionicons name="shield-outline" size={48} color={colors.lightText} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {admins.length === 0 ? 'No Admins Yet' : 'No Admins Found'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.lightText }]}>
            {admins.length === 0 
              ? 'No admins have been added yet.'
              : 'Try adjusting your search to see more admins.'
            }
          </Text>
        </View>
      ) : (
        filteredAdmins.map((admin, index) => (
          <View key={admin._id}>
            <TouchableOpacity 
              style={[styles.installmentCard, { backgroundColor: colors.cardBackground }]}
              activeOpacity={0.7}
            >
            <View style={styles.installmentHeader}>
              <View style={styles.installmentInfo}>
                <Text style={[styles.installmentCustomerName, { color: colors.text }]}>
                  {admin.name}
                </Text>
                <Text style={[styles.installmentId, { color: colors.lightText }]}>
                  Admin #{filteredAdmins.length - index}
                </Text>
                <Text style={[styles.installmentId, { color: colors.lightText }]}>
                  Email: {admin.email}
                </Text>
                {admin.email === 'installmentadmin@app.com' ? (
                  <Text style={[styles.installmentId, { color: colors.success }]}>
                    Main Admin
                  </Text>
                ) : (
                  <Text style={[styles.installmentId, { 
                    color: admin.permissions?.canViewData ? colors.success : colors.warning 
                  }]}>
                    {admin.permissions?.canViewData ? 'Has Access' : 'No Access'}
                  </Text>
                )}
              </View>
              <View style={styles.headerActions}>
                {/* Edit and Delete buttons - Only for main admin */}
                {canAddAdmin && (
                  <>
                    <TouchableOpacity
                      style={[styles.cardActionButton, { backgroundColor: colors.primary }]}
                      onPress={(e) => {
                        e.stopPropagation(); 
                        handleEditAdmin(admin);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="create" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                    
                    {/* Permission management buttons - Only for non-main admins */}
                    {admin.email !== 'installmentadmin@app.com' && (
                      <>
                        {admin.permissions?.canViewData ? (
                          <TouchableOpacity
                            style={[
                              styles.cardActionButton, 
                              { 
                                backgroundColor: isUpdatingPermissions === admin._id ? colors.lightText : colors.success,
                                opacity: isUpdatingPermissions === admin._id ? 0.7 : 1
                              }
                            ]}
                            onPress={(e) => {
                              e.stopPropagation(); 
                              handleRevokePermissions(admin);
                            }}
                            activeOpacity={0.7}
                            disabled={isUpdatingPermissions === admin._id}
                          >
                            <Ionicons name="lock-open" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity
                            style={[
                              styles.cardActionButton, 
                              { 
                                backgroundColor: isUpdatingPermissions === admin._id ? colors.lightText : colors.danger,
                                opacity: isUpdatingPermissions === admin._id ? 0.7 : 1
                              }
                            ]}
                            onPress={(e) => {
                              e.stopPropagation(); 
                              handleGrantPermissions(admin);
                            }}
                            activeOpacity={0.7}
                            disabled={isUpdatingPermissions === admin._id}
                          >
                            <Ionicons name="lock-closed" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity
                          style={[styles.cardActionButton, { backgroundColor: colors.danger }]}
                          onPress={(e) => {
                            e.stopPropagation(); 
                            handleDeleteAdmin(admin);
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </>
                    )}
                  </>
                )}
              </View>
            </View>

            <View style={styles.installmentDetails}>
              <View style={styles.installmentRow}>
                <View style={styles.installmentCol}>
                  <Text style={[styles.installmentLabel, { color: colors.lightText }]}>Joined</Text>
                  <Text style={[styles.installmentValue, { color: colors.text }]}>
                    {formatDate(admin.createdAt)}
                  </Text>
                </View>
                <View style={styles.installmentCol}>
                  <Text style={[styles.installmentLabel, { color: colors.lightText }]}>Last Login</Text>
                  <Text style={[styles.installmentValue, { color: colors.text }]}>
                    {formatDate(admin.lastLogin || '')}
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
      
      {/* Edit Name Modal */}
      <Modal
        visible={showEditInfoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditInfoModal(false)}
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
                    Edit Admin Name
                  </Text>
                  <Text style={[styles.managerName, { color: colors.lightText }]}>
                    {selectedAdmin?.name}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowEditInfoModal(false);
                  setFormData({ name: '', email: '', newEmail: '', newPassword: '', confirmPassword: '' });
                  setIsUpdatingName(false);
                }}
                style={[styles.closeButton, { backgroundColor: colors.border }]}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Form Content */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Admin Name</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    placeholder="Enter admin name"
                    placeholderTextColor={colors.lightText}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.border }]}
                  onPress={() => {
                    setShowEditInfoModal(false);
                    setFormData({ name: '', email: '', newEmail: '', newPassword: '', confirmPassword: '' });
                    setIsUpdatingName(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveButton, 
                    { 
                      backgroundColor: isUpdatingName ? colors.lightText : colors.primary,
                      opacity: isUpdatingName ? 0.7 : 1
                    }
                  ]}
                  onPress={async () => {
                    if (!formData.name.trim()) {
                      showError('Please enter admin name');
                      return;
                    }

                    if (!selectedAdmin) {
                      showError('No admin selected');
                      return;
                    }

                    try {
                      setIsUpdatingName(true);
                      const response = await apiService.updateAdminName(selectedAdmin._id, formData.name.trim());
                      
                      if (response.success) {
                        showSuccess('Admin name updated successfully');
                        setShowEditInfoModal(false);
                        setFormData({ name: '', email: '', newEmail: '', newPassword: '', confirmPassword: '' });
                        loadAdmins(false); // Refresh the list
                      } else {
                        showError(response.message || 'Failed to update admin name');
                      }
                    } catch (error) {
                      showError('Failed to update admin name. Please try again.');
                    } finally {
                      setIsUpdatingName(false);
                    }
                  }}
                  activeOpacity={0.7}
                  disabled={isUpdatingName}
                >
                  <Text style={styles.saveButtonText}>
                    {isUpdatingName ? 'Updating...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Admin Modal */}
      <Modal
        visible={showAddAdminModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddAdminModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContainer, { backgroundColor: colors.cardBackground }]}>
            {/* Header with gradient */}
            <View style={[styles.modalHeader, { backgroundColor: colors.primary + '10' }]}>
              <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                  <Ionicons name="person-add" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Add New Admin
                  </Text>
                  <Text style={[styles.managerName, { color: colors.lightText }]}>
                    Create a new admin account
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowAddAdminModal(false);
                  setFormData({ name: '', email: '', newEmail: '', newPassword: '', confirmPassword: '' });
                }}
                style={[styles.closeButton, { backgroundColor: colors.border }]}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Form Content */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Admin Name</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    value={formData.name}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                    placeholder="Enter admin name"
                    placeholderTextColor={colors.lightText}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Admin Email Address</Text>
                <View style={[styles.inputContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <TextInput
                    style={[styles.textInput, { color: colors.text }]}
                    value={formData.email}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                    placeholder="Enter admin email address"
                    placeholderTextColor={colors.lightText}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>
              
              <View style={styles.warningContainer}>
                <Ionicons name="information-circle" size={16} color={colors.warning} />
                <Text style={[styles.warningText, { color: colors.lightText }]}>
                  A temporary password will be sent to this email address. The admin can change it after first login.
                </Text>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: colors.border }]}
                  onPress={() => {
                    setShowAddAdminModal(false);
                    setFormData({ name: '', email: '', newEmail: '', newPassword: '', confirmPassword: '' });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddAdmin}
                  activeOpacity={0.7}
                >
                  <Text style={styles.saveButtonText}>Create Admin</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
    flex: 1,
  },
});