import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, StatusBar, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import InvestorDashboard from '../components/InvestorDashboard';
import TokenService from '../services/tokenService';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';

export default function InvestorDashboardPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [user, setUser] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const [lastTap, setLastTap] = useState(0);

  // Animation refs
  const dragTranslateY = useRef(new Animated.Value(0)).current;
  const dragOpacity = useRef(new Animated.Value(1)).current;
  const modalSlideY = useRef(new Animated.Value(200)).current;
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
    loadUserData();
  }, []);

  // Reset modal animations when closed
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

  // Animate modal when opened
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

  const loadUserData = async () => {
    try {
      const token = await TokenService.getToken();
      if (token) {
        const response = await apiService.getProfile();
        if (response.success && response.user) {
          setUser(response.user);
        }
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await TokenService.removeToken();
      await apiService.logout();
      setUser(null);
      setShowProfileModal(false);
      showSuccess('Logged out successfully');
      router.replace('/');
    } catch (error) {
      console.log('Logout error:', error);
      await TokenService.removeToken();
      setUser(null);
      setShowProfileModal(false);
      showSuccess('Logged out successfully');
      router.replace('/');
    }
  };

  // Drag handlers
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
      setShowProfileModal(false);
    } else {
      setLastTap(now);
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
            <Text style={styles.modernHeaderTitle}>Investor Dashboard</Text>
            <Text style={styles.modernHeaderSubtitle}>
              Welcome back, {user?.name || 'Investor'}
            </Text>
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
        showsVerticalScrollIndicator={false}
      >
        <InvestorDashboard colors={colors} />
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
                  <View style={[
                    styles.roleBadge, 
                    { backgroundColor: colors.success }
                  ]}>
                    <Text style={styles.roleText}>Investor</Text>
                  </View>
                </View>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.profileActions}>
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

      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: { 
    flex: 1, 
    marginTop: -10 
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
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

  // Profile Modal Styles
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    gap: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
