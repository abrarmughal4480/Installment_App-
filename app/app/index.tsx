import React, { useState, useRef, useEffect } from 'react';
import TokenService from '../services/tokenService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';

export default function LandingPage() {
  const [customerId, setCustomerId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isCustomerIdFocused, setIsCustomerIdFocused] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); 
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false);
  const [isOtpFocused, setIsOtpFocused] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  
  const otpRefs = useRef<(TextInput | null)[]>([]);
  
  
  const headerAnimation = useRef(new Animated.Value(-100)).current;

  
  useEffect(() => {
    Animated.timing(headerAnimation, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    loadSavedCustomerId();
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await TokenService.getToken();
      if (token) {
        
        const response = await apiService.getProfile();
        if (response.success && response.user) {
        }
      }
    } catch (error) {
      
    }
  };

  const loadSavedCustomerId = async () => {
    try {
      const savedCustomerId = await AsyncStorage.getItem('customerId');
      if (savedCustomerId) {
        setCustomerId(savedCustomerId);
      }
    } catch (error) {
    }
  };

  
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

  const handleSignUp = async () => {
    
    Keyboard.dismiss();
    setIsNameFocused(false);
    setIsEmailFocused(false);
    setIsPasswordFocused(false);
    setIsConfirmPasswordFocused(false);
    
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match. Please try again.');
      return;
    }

    
    if (password.length < 8) {
      showError('Password must be at least 8 characters long.');
      return;
    }

    if (password.length > 12) {
      showError('Password must not exceed 12 characters.');
      return;
    }

    if (!/[a-z]/.test(password)) {
      showError('Password must contain at least one lowercase letter.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      showError('Password must contain at least one uppercase letter.');
      return;
    }

    if (!/[0-9]/.test(password)) {
      showError('Password must contain at least one number.');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      showError('Password must contain at least one symbol.');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiService.register({
        name,
        email,
        password,
        phone: '',
        address: ''
      });
      
      if (response.success) {
        showSuccess(`Welcome ${name}! Your account has been created successfully. You can now login with your email and password.`);
        
        setTimeout(() => {
          setIsSignUpMode(false);
          setIsAdminMode(false);
          setCurrentStep(0);
          setName('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
          setOtp('');
          setShowPassword(false);
          setShowConfirmPassword(false);
          setResendTimer(0);
          setResendAttempts(0);
          setPasswordStrength(0);
        }, 2000);
      } else {
        showError(response.message || 'Failed to create account. Please try again.');
      }
      
    } catch (error) {Keyboard
      showError('An error occurred during account creation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    
    Keyboard.dismiss();
    setIsCustomerIdFocused(false);
    
    if (!customerId.trim()) {
      showError('Please enter your customer ID');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await apiService.getCustomerInstallments(customerId.trim());
      
      if (response.success) {
        
        try {
          await AsyncStorage.setItem('customerId', customerId.trim());
        } catch (error) {
        }

        
        router.replace({
          pathname: '/installments',
          params: {
            customerId: response.customer?.customerId,
            customerName: response.customer?.customerName,
            customerEmail: response.customer?.customerEmail,
            customerPhone: response.customer?.customerPhone,
            customerAddress: response.customer?.customerAddress,
            installments: JSON.stringify(response.installments),
            totalInstallments: response.totalInstallments
          }
        });
      } else {
        
        const errorMessage = response.message || 'Customer not found';
        if (errorMessage.includes('No installments found') || errorMessage.includes('Customer not found')) {
          showError('Customer ID not found. Please check your customer ID and try again.');
        } else if (errorMessage.includes('Network error')) {
          showError('Please check your internet connection and try again.');
        } else {
          showError(errorMessage);
        }
      }
    } catch (error) {
      showError('Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setIsEmailFocused(false);
    setIsPasswordFocused(false);
    setIsCustomerIdFocused(false);
  };

  const toggleMode = () => {
    setIsAdminMode(!isAdminMode);
    setCustomerId('');
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setOtp('');
    setIsEmailFocused(false);
    setIsPasswordFocused(false);
    setIsCustomerIdFocused(false);
    setIsNameFocused(false);
    setIsConfirmPasswordFocused(false);
    setIsOtpFocused(false);
    setResendTimer(0);
    setResendAttempts(0);
    setCurrentStep(0); 
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const toggleSignUpMode = () => {
    setIsSignUpMode(!isSignUpMode);
    setIsAdminMode(false); 
    setCustomerId('');
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setOtp('');
    setIsEmailFocused(false);
    setIsPasswordFocused(false);
    setIsCustomerIdFocused(false);
    setIsNameFocused(false);
    setIsConfirmPasswordFocused(false);
    setIsOtpFocused(false);
    setResendTimer(0);
    setResendAttempts(0);
    setCurrentStep(0); 
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const nextStep = async () => {
    if (isSignUpMode) {
      if (currentStep === 0 && name.trim() && email.trim()) {
        try {
          setIsLoading(true);
          const response = await apiService.sendOTP(email, name);
          
          if (response.success) {
            setCurrentStep(1);
            startResendTimer();
            showSuccess('Please check your email for the 6-digit OTP code.');
          } else {
            
            if (response.remainingTime) {
              const minutes = Math.floor(response.remainingTime / 60);
              const seconds = response.remainingTime % 60;
              const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
              showWarning(`Please wait ${timeString} before requesting a new OTP.`);
            } else {
              showError(response.message || 'Failed to send OTP. Please try again.');
            }
          }
        } catch (error) {
          showError('Failed to send OTP. Please check your internet connection and try again.');
        } finally {
          setIsLoading(false);
        }
      } else if (currentStep === 1 && otp.trim().length === 6) {
        
        try {
          setIsLoading(true);
          const response = await apiService.verifyOTPOnly(email, otp);
          
          if (response.success) {
            setCurrentStep(2);
            showSuccess('Please create your password to complete registration.');
          } else {
            showError(response.message || 'Invalid code. Please try again.');
          }
        } catch (error) {
          showError('Failed to verify OTP. Please check your internet connection and try again.');
        } finally {
          setIsLoading(false);
        }
      } else if (currentStep === 2 && password.trim().length >= 8 && confirmPassword.trim().length >= 8) {
        
        Keyboard.dismiss();
        setIsPasswordFocused(false);
        setIsConfirmPasswordFocused(false);
        
        try {
          setIsLoading(true);
          const response = await apiService.completeRegistration(email, otp, password);
          
          if (response.success) {
            
            if (response.token) {
              await TokenService.setToken(response.token);
            }
            
            showSuccess('Account created successfully!');
            setTimeout(() => {
              router.replace('/adminDashboard');
            }, 2000);
          } else {
            if (response.remainingAttempts !== undefined) {
              showError(`Invalid code. ${response.remainingAttempts} attempts remaining.`);
            } else {
              showError(response.message || 'Failed to create account. Please try again.');
            }
          }
        } catch (error) {
          showError('Failed to create account. Please check your internet connection and try again.');
        } finally {
          setIsLoading(false);
        }
      }
    } else if (isAdminMode) {
      
      if (currentStep === 0 && email.trim()) {
        
        try {
          setIsLoading(true);
          const response = await apiService.checkEmailExists(email);
          
          if (response.success) {
            setCurrentStep(1);
          } else {
            showError(response.message || 'No admin account found with this email.');
          }
        } catch (error) {
          showError('Failed to verify email. Please check your internet connection and try again.');
        } finally {
          setIsLoading(false);
        }
      } else if (currentStep === 1 && password.trim()) {
        
        Keyboard.dismiss();
        setIsPasswordFocused(false);
        
        try {
          setIsLoading(true);
          const response = await apiService.login({ 
            email, 
            password, 
            type: 'admin' 
          });
          
          if (response.success) {
            
            if (response.token) {
              await TokenService.setToken(response.token);
            }
            
            router.replace('/adminDashboard');
          } else {
            showError(response.message || 'Invalid admin credentials. Please check your email and password.');
          }
        } catch (error) {
          showError('An error occurred during login. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      if (currentStep === 0 && email.trim()) {
        setCurrentStep(1);
      }
    }
  };

  const startResendTimer = () => {
    const timers = [30, 60, 120]; 
    const currentTimer = timers[resendAttempts] || 0;
    
    if (currentTimer === 0) return; 
    
    setResendTimer(currentTimer);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return; 
    
    
    Keyboard.dismiss();
    setIsOtpFocused(false);
    
    try {
      setIsLoading(true);
      const response = await apiService.sendOTP(email, name);
      
      if (response.success) {
        setResendAttempts(prev => prev + 1);
        startResendTimer();
        showSuccess('A new verification code has been sent to your email.');
      } else {
        
        if (response.remainingTime) {
          const minutes = Math.floor(response.remainingTime / 60);
          const seconds = response.remainingTime % 60;
          const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
          showWarning(`Please wait ${timeString} before requesting a new OTP.`);
        } else {
          showError(response.message || 'Failed to resend OTP. Please try again.');
        }
      }
    } catch (error) {
      showError('Failed to resend OTP. Please check your internet connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimer = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    
    
    if (/[a-z]/.test(password)) {
      strength = 1;
      
      
      if (/[A-Z]/.test(password)) {
        strength = 2;
        
        
        if (/[0-9]/.test(password)) {
          strength = 3;
          
          
          if (/[^A-Za-z0-9]/.test(password) && password.length >= 8 && password.length <= 12) {
            strength = 4;
          }
        }
      }
    }
    
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    switch (strength) {
      case 0:
        return '#E5E7EB'; 
      case 1:
        return '#EF4444'; 
      case 2:
        return '#F59E0B'; 
      case 3:
        return '#3B82F6'; 
      case 4:
        return '#10B981'; 
      default:
        return '#E5E7EB';
    }
  };


  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 3;
    },
    onPanResponderGrant: () => {
      
    },
    onPanResponderMove: (evt, gestureState) => {
      
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dy } = gestureState;
      
      
      if (dy < -20 && !isAdminMode && !isSignUpMode) {
        setIsAdminMode(true);
        setCustomerId('');
        setEmail('');
        setPassword('');
        setName('');
        setConfirmPassword('');
        setIsEmailFocused(false);
        setIsPasswordFocused(false);
        setIsCustomerIdFocused(false);
        setIsNameFocused(false);
        setIsConfirmPasswordFocused(false);
        setCurrentStep(0);
      }
      
      else if (dy > 20 && (isAdminMode || isSignUpMode)) {
        setIsAdminMode(false);
        setIsSignUpMode(false);
        setCustomerId('');
        setEmail('');
        setPassword('');
        setName('');
        setConfirmPassword('');
        setIsEmailFocused(false);
        setIsPasswordFocused(false);
        setIsCustomerIdFocused(false);
        setIsNameFocused(false);
        setIsConfirmPasswordFocused(false);
        setCurrentStep(0);
      }
    },
  });

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

        {/* Modern Header with Gradient - Swipeable */}
        <Animated.View
          style={{
            transform: [{ translateY: headerAnimation }]
          }}
        >
          <View {...panResponder.panHandlers}>
            <LinearGradient
              colors={[colors.primary, colors.primaryLight]}
              style={styles.modernHeader}
            >
              <View style={styles.headerContent}>
                <View>
                  <Text style={styles.modernHeaderTitle}>
                    {isAdminMode ? 'Admin Portal' : isSignUpMode ? 'Create Account' : 'Installment Tracker'}
                  </Text>
                  <Text style={styles.modernHeaderSubtitle}>
                    {isAdminMode ? 'Manage your business' : isSignUpMode ? 'Get started with your account' : 'Manage your payments with ease'}
                  </Text>
                  <View style={styles.swipeIndicator}>
                    <Ionicons 
                      name={isAdminMode ? "chevron-down" : isSignUpMode ? "chevron-down" : "chevron-up"} 
                      size={16} 
                      color="rgba(255, 255, 255, 0.8)" 
                    />
                    <Text style={styles.swipeHint}>
                      {isAdminMode ? 'Swipe down for customer login' : isSignUpMode ? 'Swipe down for login' : 'Swipe up for admin login'}
                    </Text>
                  </View>
                </View>
                <View style={styles.headerIcon}>
                  <Ionicons 
                    name={isAdminMode ? "shield-checkmark" : isSignUpMode ? "person-add-outline" : "card"} 
                    size={24} 
                    color="#FFFFFF" 
                  />
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
          {/* Input Section */}
          <View style={[styles.inputCard, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.inputHeader}>
              {((isAdminMode && currentStep === 1) || (isSignUpMode && currentStep > 1)) && (
                <TouchableOpacity
                  style={styles.backArrowButton}
                  onPress={() => setCurrentStep(currentStep - 1)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name="arrow-back" 
                    size={20} 
                    color={colors.primary} 
                  />
                </TouchableOpacity>
              )}
              <View style={styles.inputTitleContainer}>
                <Text style={[styles.inputTitle, { color: colors.text }]}>
                  {isSignUpMode && currentStep === 1 
                    ? 'Enter Verification Code'
                    : isSignUpMode && currentStep === 2
                      ? 'Create Password'
                      : isAdminMode 
                        ? 'Admin Login' 
                        : isSignUpMode 
                          ? 'Sign Up' 
                          : 'Customer Login'
                  }
                </Text>
              </View>
              <Text style={[styles.inputSubtitle, { color: colors.lightText }]}>
                {isSignUpMode && currentStep === 1
                  ? `We've sent a 6-digit code to ${email}`
                  : isSignUpMode && currentStep === 2
                    ? 'Create a strong password to secure your account'
                    : isAdminMode 
                      ? 'Access manager dashboard to manage the system'
                      : isSignUpMode 
                        ? 'Create your account to get started'
                        : 'Access your account to manage installments'
                }
              </Text>
            </View>

            {isSignUpMode ? (
              
              <>
                {/* Step 0: Name and Email Inputs */}
                {currentStep === 0 && (
                  <>
                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            borderColor: isNameFocused ? colors.focusBorder : colors.border,
                            backgroundColor: colors.inputBackground,
                            shadowColor: colors.shadow,
                            elevation: isNameFocused ? 6 : 3,
                          }
                        ]}
                      >
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          value={name}
                          onChangeText={setName}
                          placeholder="Enter your full name"
                          placeholderTextColor={colors.lightText}
                          autoCapitalize="words"
                          returnKeyType="next"
                          onSubmitEditing={() => setIsEmailFocused(true)}
                          onFocus={() => setIsNameFocused(true)}
                          onBlur={() => setIsNameFocused(false)}
                        />
                      </View>
                    </View>

                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            borderColor: isEmailFocused ? colors.focusBorder : colors.border,
                            backgroundColor: colors.inputBackground,
                            shadowColor: colors.shadow,
                            elevation: isEmailFocused ? 6 : 3,
                          }
                        ]}
                      >
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          value={email}
                          onChangeText={setEmail}
                          placeholder="Enter your email"
                          placeholderTextColor={colors.lightText}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          returnKeyType="done"
                          onSubmitEditing={nextStep}
                          onFocus={() => setIsEmailFocused(true)}
                          onBlur={() => setIsEmailFocused(false)}
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* Step 1: OTP Input - 6 Blocks */}
                {currentStep === 1 && (
                  <>
                    <View style={styles.otpContainer}>
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <View
                          key={index}
                          style={[
                            styles.otpBlock,
                            {
                              borderColor: isOtpFocused && otp.length === index ? colors.focusBorder : colors.border,
                              backgroundColor: colors.inputBackground,
                              shadowColor: colors.shadow,
                              elevation: isOtpFocused && otp.length === index ? 6 : 3,
                            }
                          ]}
                        >
                          <TextInput
                            ref={(ref) => {
                              otpRefs.current[index] = ref;
                            }}
                            style={[styles.otpInput, { color: colors.text }]}
                            value={otp[index] || ''}
                            onChangeText={(text) => {
                              const numericText = text.replace(/[^0-9]/g, '');
                              if (numericText.length <= 1) {
                                let newOtp = otp.split('');
                                newOtp[index] = numericText;
                                setOtp(newOtp.join(''));
                                
                                
                                if (numericText && index < 5) {
                                  setTimeout(() => {
                                    const nextRef = otpRefs.current[index + 1];
                                    if (nextRef) {
                                      nextRef.focus();
                                    }
                                  }, 100);
                                }
                              }
                            }}
                            onKeyPress={({ nativeEvent }) => {
                              
                              if (nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                                const prevRef = otpRefs.current[index - 1];
                                if (prevRef) {
                                  prevRef.focus();
                                }
                              }
                            }}
                            placeholder=""
                            placeholderTextColor={colors.lightText}
                            keyboardType="numeric"
                            maxLength={1}
                            returnKeyType={index === 5 ? "done" : "next"}
                            onSubmitEditing={index === 5 ? nextStep : undefined}
                            onFocus={() => setIsOtpFocused(true)}
                            onBlur={() => setIsOtpFocused(false)}
                            textAlign="center"
                          />
                        </View>
                      ))}
                    </View>
                    
                  </>
                )}

                {/* Step 2: Password and Confirm Password Inputs */}
                {currentStep === 2 && (
                  <>
                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            borderColor: isPasswordFocused ? colors.focusBorder : colors.border,
                            backgroundColor: colors.inputBackground,
                            shadowColor: colors.shadow,
                            elevation: isPasswordFocused ? 6 : 3,
                          }
                        ]}
                      >
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            setPasswordStrength(calculatePasswordStrength(text));
                          }}
                          placeholder="Enter your password"
                          placeholderTextColor={colors.lightText}
                          secureTextEntry={!showPassword}
                          returnKeyType="next"
                          onSubmitEditing={() => setIsConfirmPasswordFocused(true)}
                          onFocus={() => setIsPasswordFocused(true)}
                          onBlur={() => setIsPasswordFocused(false)}
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

                    {/* Enhanced Password Strength Meter */}
                    {password.length > 0 && (
                      <View style={styles.passwordStrengthContainer}>
                        <View style={styles.passwordStrengthBars}>
                          {[1, 2, 3, 4].map((level) => (
                            <View
                              key={level}
                              style={[
                                styles.passwordStrengthBar,
                                {
                                  backgroundColor: level <= passwordStrength 
                                    ? getPasswordStrengthColor(passwordStrength) 
                                    : '#E5E7EB',
                                  borderWidth: level <= passwordStrength ? 0 : 1,
                                  borderColor: level <= passwordStrength ? 'transparent' : '#D1D5DB',
                                }
                              ]}
                            />
                          ))}
                        </View>
                        <View style={styles.passwordStrengthLabels}>
                          <Text style={[styles.passwordStrengthLabel, { 
                            color: passwordStrength >= 1 ? getPasswordStrengthColor(passwordStrength) : colors.lightText 
                          }]}>
                            abc
                          </Text>
                          <Text style={[styles.passwordStrengthLabel, { 
                            color: passwordStrength >= 2 ? getPasswordStrengthColor(passwordStrength) : colors.lightText 
                          }]}>
                            ABC
                          </Text>
                          <Text style={[styles.passwordStrengthLabel, { 
                            color: passwordStrength >= 3 ? getPasswordStrengthColor(passwordStrength) : colors.lightText 
                          }]}>
                            123
                          </Text>
                          <Text style={[styles.passwordStrengthLabel, { 
                            color: passwordStrength >= 4 ? getPasswordStrengthColor(passwordStrength) : colors.lightText 
                          }]}>
                            !@#
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.inputContainer}>
                      <View
                        style={[
                          styles.inputWrapper,
                          {
                            borderColor: isConfirmPasswordFocused ? colors.focusBorder : colors.border,
                            backgroundColor: colors.inputBackground,
                            shadowColor: colors.shadow,
                            elevation: isConfirmPasswordFocused ? 6 : 3,
                          }
                        ]}
                      >
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          placeholder="Confirm your password"
                          placeholderTextColor={colors.lightText}
                          secureTextEntry={!showConfirmPassword}
                          returnKeyType="done"
                          onSubmitEditing={handleSignUp}
                          onFocus={() => setIsConfirmPasswordFocused(true)}
                          onBlur={() => setIsConfirmPasswordFocused(false)}
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
                  </>
                )}

              </>
            ) : isAdminMode ? (
              
              <>
                {/* Step 0: Email Input */}
                {currentStep === 0 && (
                  <View style={styles.inputContainer}>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          borderColor: isEmailFocused ? colors.focusBorder : colors.border,
                          backgroundColor: colors.inputBackground,
                          shadowColor: colors.shadow,
                          elevation: isEmailFocused ? 6 : 3,
                        }
                      ]}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        placeholderTextColor={colors.lightText}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        returnKeyType="next"
                        onSubmitEditing={nextStep}
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                      />
                    </View>
                  </View>
                )}

                {/* Step 1: Password Input */}
                {currentStep === 1 && (
                  <View style={styles.inputContainer}>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          borderColor: isPasswordFocused ? colors.focusBorder : colors.border,
                          backgroundColor: colors.inputBackground,
                          shadowColor: colors.shadow,
                          elevation: isPasswordFocused ? 6 : 3,
                        }
                      ]}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.lightText}
                        secureTextEntry={!showPassword}
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() => setIsPasswordFocused(false)}
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
                )}

                {/* Navigation Buttons */}
                <View style={styles.stepperButtons}>
                  <TouchableOpacity
                    style={[
                      styles.stepperButton, 
                      styles.fullWidthButton,
                      { backgroundColor: colors.primary },
                      (currentStep === 0 && !email.trim()) || (currentStep === 1 && !password.trim()) || isLoading ? styles.disabledButton : {}
                    ]}
                    onPress={nextStep}
                    disabled={(currentStep === 0 && !email.trim()) || (currentStep === 1 && !password.trim()) || isLoading}
                    activeOpacity={0.8}
                  >
                    <Ionicons 
                      name={isLoading ? "hourglass" : (currentStep === 0 ? "arrow-forward" : "shield-checkmark")} 
                      size={20} 
                      color="#FFFFFF" 
                    />
                    <Text style={[styles.stepperButtonText, { color: '#FFFFFF' }]}>
                      {isLoading 
                        ? (currentStep === 0 ? 'Verifying Email...' : 'Authenticating...') 
                        : (currentStep === 0 ? 'Next' : 'Login')
                      }
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              
              <View style={styles.inputContainer}>
                <View
                  style={[
                    styles.inputWrapper,
                    {
                      borderColor: isCustomerIdFocused ? colors.focusBorder : colors.border,
                      backgroundColor: colors.inputBackground,
                      shadowColor: colors.shadow,
                      elevation: isCustomerIdFocused ? 6 : 3,
                    }
                  ]}
                >
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    value={customerId}
                    onChangeText={setCustomerId}
                    placeholder="Enter your customer ID"
                    placeholderTextColor={colors.lightText}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    onFocus={() => setIsCustomerIdFocused(true)}
                    onBlur={() => setIsCustomerIdFocused(false)}
                  />
                </View>
              </View>
            )}

            {!isAdminMode && !isSignUpMode && (
              <View style={styles.customerButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: colors.primary },
                    isLoading && styles.disabledButton
                  ]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons 
                      name={isLoading ? "hourglass" : "arrow-forward"} 
                      size={20} 
                      color="#FFFFFF" 
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.submitButtonText}>
                      {isLoading ? 'Authenticating...' : 'Access My Account'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {isSignUpMode && (
              <View style={styles.customerButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: colors.primary },
                    isLoading && styles.disabledButton
                  ]}
                  onPress={currentStep === 0 ? nextStep : currentStep === 1 ? nextStep : currentStep === 2 ? nextStep : handleSignUp}
                  disabled={isLoading || (currentStep === 0 && (!name.trim() || !email.trim())) || (currentStep === 1 && otp.trim().length !== 6) || (currentStep === 2 && (!password.trim() || !confirmPassword.trim() || password !== confirmPassword))}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryLight]}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons 
                      name={isLoading ? "hourglass" : currentStep === 2 ? "person-add" : "arrow-forward"} 
                      size={20} 
                      color="#FFFFFF" 
                      style={styles.buttonIcon}
                    />
                    <Text style={styles.submitButtonText}>
                      {isLoading 
                        ? (currentStep === 0 ? 'Sending OTP...' : currentStep === 1 ? 'Verifying OTP...' : currentStep === 2 ? 'Creating Account...' : 'Processing...') 
                        : currentStep === 2 ? 'Create Account' : 'Next'
                      }
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                {/* Resend OTP Button - Only show on OTP step */}
                {currentStep === 1 && resendAttempts < 3 && (
                  <View style={styles.resendContainer}>
                    <Text style={[styles.resendText, { color: colors.lightText }]}>
                      Didn&apos;t receive OTP?{' '}
                    </Text>
                    {resendTimer > 0 ? (
                      <Text style={[styles.timerText, { color: colors.primary }]}>
                        Resend in {formatTimer(resendTimer)}
                      </Text>
                    ) : (
                      <TouchableOpacity 
                        onPress={handleResendOTP} 
                        activeOpacity={0.7}
                        disabled={isLoading}
                      >
                        <Text style={[
                          styles.resendButtonText, 
                          { 
                            color: isLoading ? colors.lightText : colors.primary,
                            opacity: isLoading ? 0.6 : 1
                          }
                        ]}>
                          {isLoading ? 'Sending...' : 'Resend'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Help Text */}
            {isAdminMode && (
              <TouchableOpacity 
                style={styles.helpTextContainer}
                onPress={toggleSignUpMode}
              >
                <Text style={[styles.helpText, { color: colors.primary }]}>
                  Don&apos;t have account? <Text style={styles.linkText}>Sign up as admin</Text>
                </Text>
              </TouchableOpacity>
            )}


          </View>


          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginTop: -10,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'center',
  },

  
  modernHeader: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
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
  backArrowButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modernHeaderTitle: { 
    fontSize: 28, 
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
  swipeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  swipeHint: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 4,
    fontStyle: 'italic'
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  
  inputCard: {
    padding: 20,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  inputHeader: {
    marginBottom: 24,
    alignItems: 'center',
    position: 'relative',
  },
  inputTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  titleSpacer: {
    width: 32,
  },
  inputTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
    alignSelf: 'center',
  },
  inputSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.2,
    opacity: 0.8,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 8,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '600',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    borderWidth: 2,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    minHeight: 64,
    position: 'relative',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    minHeight: 56,
    borderWidth: 0,
    textAlign: 'left',
    textAlignVertical: 'center',
    paddingLeft: 20,
    paddingRight: 20,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  submitButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    minHeight: 68,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 32,
  },
  buttonIcon: {
    marginRight: 12,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#6366F1',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  adminButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.2,
  },

  
  helpTextContainer: {
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  helpText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  linkText: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },

  
  stepperButtons: {
    marginTop: 8,
  },
  customerButtonContainer: {
    marginTop: 8,
  },
  stepperButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    minHeight: 56,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fullWidthButton: {
    width: '100%',
  },
  backButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderWidth: 2,
    borderColor: '#6366F1',
    flex: 0.4,
  },
  stepperButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
    letterSpacing: 0.2,
  },

  
  otpHeaderContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  otpHeaderTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  otpHeaderSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.8,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  otpBlock: {
    width: 40,
    height: 50,
    borderWidth: 1.5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  otpInput: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    width: '100%',
    height: '100%',
    borderWidth: 0,
    padding: 0,
    margin: 0,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  
  passwordStrengthContainer: {
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 4,
    alignSelf: 'flex-end',
    width: '60%',
  },
  passwordStrengthBars: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 4,
    height: 4,
  },
  passwordStrengthBar: {
    flex: 1,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1,
    elevation: 1,
  },
  passwordStrengthLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 1,
  },
  passwordStrengthLabel: {
    fontSize: 8,
    fontWeight: '600',
    textAlign: 'center',
    opacity: 0.7,
  },

  
  eyeButton: {
    padding: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

});