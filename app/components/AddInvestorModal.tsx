import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';

interface AddInvestorModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  colors: any;
}

export default function AddInvestorModal({ 
  visible, 
  onClose, 
  onSuccess, 
  colors 
}: AddInvestorModalProps) {
  const { showSuccess, showError } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    investmentAmount: '',
    monthlyProfit: '',
    joinDate: new Date(),
  });

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setFormData(prev => ({ ...prev, joinDate: selectedDate }));
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      showError('Please enter investor name');
      return;
    }

    if (!formData.email.trim()) {
      showError('Please enter email address');
      return;
    }

    if (!formData.phone.trim()) {
      showError('Please enter phone number');
      return;
    }

    if (!formData.password.trim()) {
      showError('Please enter password');
      return;
    }

    if (!formData.investmentAmount.trim()) {
      showError('Please enter investment amount');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showError('Please enter a valid email address');
      return;
    }

    // Password validation
    if (formData.password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    // Investment amount validation
    const investmentAmount = parseFloat(formData.investmentAmount);
    if (isNaN(investmentAmount) || investmentAmount <= 0) {
      showError('Please enter a valid investment amount');
      return;
    }

    // Monthly profit validation (optional)
    let monthlyProfit = 0;
    if (formData.monthlyProfit.trim()) {
      monthlyProfit = parseFloat(formData.monthlyProfit);
      if (isNaN(monthlyProfit) || monthlyProfit < 0) {
        showError('Please enter a valid monthly profit amount');
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await apiService.addInvestor({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password.trim(),
        investmentAmount: investmentAmount,
        monthlyProfit: monthlyProfit,
        joinDate: formData.joinDate.toISOString(),
      });

      if (response.success) {
        showSuccess('Investor added successfully!');
        setFormData({ 
          name: '', 
          email: '', 
          phone: '', 
          password: '', 
          investmentAmount: '', 
          monthlyProfit: '',
          joinDate: new Date(),
        });
        setShowPassword(false);
        onSuccess();
        onClose();
      } else {
        showError(response.message || 'Failed to add investor');
      }
    } catch (error) {
      console.error('Add investor error:', error);
      showError('Failed to add investor. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ 
      name: '', 
      email: '', 
      phone: '', 
      password: '', 
      investmentAmount: '', 
      monthlyProfit: '',
      joinDate: new Date(),
    });
    setShowPassword(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.primary + '10' }]}>
            <View style={styles.headerContent}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                <Ionicons name="trending-up" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Add New Investor
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.lightText }]}>
                  Create a new investor account
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={[styles.closeButton, { backgroundColor: colors.border }]}
            >
              <Ionicons name="close" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Investor Name <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <TextInput
                style={[styles.inputContainer, styles.textInput, { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border, 
                  color: colors.text 
                }]}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter investor name"
                placeholderTextColor={colors.lightText}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Email Address <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <TextInput
                style={[styles.inputContainer, styles.textInput, { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border, 
                  color: colors.text 
                }]}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="Enter email address"
                placeholderTextColor={colors.lightText}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Phone Number <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <TextInput
                style={[styles.inputContainer, styles.textInput, { 
                  backgroundColor: colors.background, 
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

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Password <Text style={{ color: colors.danger }}>*</Text>
              </Text>
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
                  value={formData.password}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                  placeholder="Enter password (min 6 characters)"
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

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Investment Amount <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <TextInput
                style={[styles.inputContainer, styles.textInput, { 
                  backgroundColor: colors.background, 
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

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Monthly Profit (Optional)
              </Text>
              <TextInput
                style={[styles.inputContainer, styles.textInput, { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border, 
                  color: colors.text 
                }]}
                value={formData.monthlyProfit}
                onChangeText={(text) => setFormData(prev => ({ ...prev, monthlyProfit: text }))}
                placeholder="Enter monthly profit amount"
                placeholderTextColor={colors.lightText}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Join Date
              </Text>
              <TouchableOpacity
                style={[styles.inputContainer, { 
                  backgroundColor: colors.background, 
                  borderColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.textInput, { color: colors.text }]}>
                  {formatDate(formData.joinDate)}
                </Text>
                <Ionicons name="calendar" size={20} color={colors.lightText} />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={formData.joinDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
              {Platform.OS === 'ios' && showDatePicker && (
                <TouchableOpacity
                  style={[styles.datePickerDoneButton, { backgroundColor: colors.primary }]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerDoneText}>Done</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmit}
              activeOpacity={0.7}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.submitButtonText}>Adding...</Text>
              ) : (
                <Text style={styles.submitButtonText}>Add Investor</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    maxHeight: '90%',
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
  modalSubtitle: {
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
  formContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  modalFooter: {
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
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
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
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
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

