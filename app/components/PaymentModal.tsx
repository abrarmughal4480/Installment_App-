import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  selectedInstallment: any;
  installmentPlan: any;
  onPayment: (paymentData: any) => void;
  onMarkUnpaid?: (installmentData: any) => void;
  isRecording: boolean;
  colors: any;
  formatCurrency: (amount: number) => string;
  formatDate: (date: string) => string;
  roundUp: (amount: number) => number;
  mode?: 'record' | 'edit'; // New prop to determine mode
  onUpdatePayment?: (paymentData: any) => void; // New prop for update functionality
}

export default function PaymentModal({
  visible,
  onClose,
  selectedInstallment,
  installmentPlan,
  onPayment,
  onMarkUnpaid,
  isRecording,
  colors,
  formatCurrency,
  formatDate,
  roundUp,
  mode = 'record',
  onUpdatePayment,
}: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentPaidDate, setPaymentPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [distributionInfo, setDistributionInfo] = useState<{
    difference: number;
    remainingCount: number;
    amountPerInstallment: number;
    isExcess: boolean;
    message: string;
  } | null>(null);

  const paymentMethods = [
    { id: 'cash', name: 'Cash', icon: 'cash' },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: 'card' },
    { id: 'wallet', name: 'Mobile Wallet', icon: 'phone-portrait' },
    { id: 'cheque', name: 'Cheque', icon: 'document-text' },
    { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
  ];

  const calculateDistribution = (amount: number) => {
    if (!selectedInstallment || !installmentPlan) return null;
    
    const originalAmount = selectedInstallment.amount;
    const difference = amount - originalAmount;
    
    if (difference === 0) return null;
    
    const remainingInstallments = installmentPlan.installments.filter((inst: any) => 
      inst.status === 'pending' && inst.installmentNumber > selectedInstallment.installmentNumber
    );
    
    if (remainingInstallments.length === 0) return null;
    
    const amountPerInstallment = difference / remainingInstallments.length;
    const roundedAmountPerInstallment = roundUp(Math.abs(amountPerInstallment));
    
    return {
      difference,
      remainingCount: remainingInstallments.length,
      amountPerInstallment: roundedAmountPerInstallment,
      isExcess: difference > 0,
      message: difference > 0 
        ? `Excess of ${formatCurrency(Math.abs(difference))} will be distributed across ${remainingInstallments.length} remaining installments (${formatCurrency(roundedAmountPerInstallment)} each)`
        : `Shortfall of ${formatCurrency(Math.abs(difference))} will be distributed across ${remainingInstallments.length} remaining installments (${formatCurrency(roundedAmountPerInstallment)} each)`
    };
  };

  const handleAmountChange = (amount: string) => {
    setPaymentAmount(amount);
    const numAmount = parseFloat(amount);
    if (!isNaN(numAmount) && numAmount > 0) {
      const distInfo = calculateDistribution(numAmount);
      setDistributionInfo(distInfo);
    } else {
      setDistributionInfo(null);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0];
      setPaymentPaidDate(formattedDate);
    }
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    const paymentData = {
      installmentNumber: selectedInstallment.installmentNumber,
      paymentMethod: paymentMethod,
      notes: paymentNotes,
      customAmount: amount,
      paidDate: paymentPaidDate
    };

    onPayment(paymentData);
  };

  const handleUpdatePayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    const paymentData = {
      installmentNumber: selectedInstallment.installmentNumber,
      paymentMethod: paymentMethod,
      notes: paymentNotes,
      customAmount: amount,
      paidDate: paymentPaidDate
    };

    if (onUpdatePayment) {
      onUpdatePayment(paymentData);
    }
  };

  const handleMarkUnpaid = () => {
    if (onMarkUnpaid && selectedInstallment) {
      const installmentData = {
        installmentNumber: selectedInstallment.installmentNumber,
        installmentId: installmentPlan?.id
      };
      onMarkUnpaid(installmentData);
    }
  };

  const resetForm = () => {
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentNotes('');
    setPaymentPaidDate(new Date().toISOString().split('T')[0]);
    setDistributionInfo(null);
    setShowDatePicker(false);
    setSelectedDate(new Date());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Initialize form when modal opens and reset when closed
  React.useEffect(() => {
    if (visible && selectedInstallment) {
      // For edit mode, use actual paid amount, for record mode use installment amount
      const amount = mode === 'edit' ? (selectedInstallment.actualPaidAmount || selectedInstallment.amount) : selectedInstallment.amount;
      setPaymentAmount(amount.toString());
      setPaymentMethod(mode === 'edit' ? (selectedInstallment.paymentMethod || 'cash') : 'cash');
      setPaymentNotes(mode === 'edit' ? (selectedInstallment.notes || '') : '');
      
      let paidDate = '';
      if (selectedInstallment.paidDate) {
        try {
          const date = new Date(selectedInstallment.paidDate);
          if (!isNaN(date.getTime())) {
            paidDate = date.toISOString().split('T')[0];
          } else {
            paidDate = selectedInstallment.paidDate;
          }
        } catch (error) {
          paidDate = selectedInstallment.paidDate;
        }
      }
      setPaymentPaidDate(paidDate || new Date().toISOString().split('T')[0]);
      setDistributionInfo(null);
    } else if (!visible) {
      // Reset all states when modal is closed
      resetForm();
    }
  }, [visible, selectedInstallment, mode]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
          {/* Modal Header - Fixed */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Ionicons name={mode === 'edit' ? 'create' : 'card'} size={24} color={mode === 'edit' ? colors.warning : colors.primary} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {mode === 'edit' ? 'Edit Payment' : 'Record Payment'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.lightText} />
            </TouchableOpacity>
          </View>

          {/* Scrollable Content */}
          <ScrollView 
            style={styles.modalScrollView}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
            indicatorStyle="black"
            persistentScrollbar={true}
            keyboardShouldPersistTaps="handled"
          >
            {selectedInstallment && (
              <View style={[styles.installmentInfo, { backgroundColor: (mode === 'edit' ? colors.warning : colors.primary) + '10' }]}>
                <View style={styles.installmentInfoHeader}>
                  <Ionicons name="receipt" size={20} color={mode === 'edit' ? colors.warning : colors.primary} />
                  <Text style={[styles.installmentInfoTitle, { color: mode === 'edit' ? colors.warning : colors.primary }]}>
                    {mode === 'edit' ? 'Payment Details' : 'Installment Details'}
                  </Text>
                </View>
                <View style={styles.installmentInfoRow}>
                  <Text style={[styles.installmentInfoLabel, { color: colors.text }]}>
                    {mode === 'edit' ? 'Installment:' : 'Number:'}
                  </Text>
                  <Text style={[styles.installmentInfoValue, { color: colors.text }]}>
                    {mode === 'edit' ? `#${selectedInstallment.installmentNumber}` : `#${selectedInstallment.installmentNumber}`}
                  </Text>
                </View>
                <View style={styles.installmentInfoRow}>
                  <Text style={[styles.installmentInfoLabel, { color: colors.lightText }]}> 
                    Paid Date:
                  </Text>
                  <Text style={[styles.installmentInfoValue, { color: colors.lightText }]}> 
                    {formatDate(selectedInstallment.paidDate)}
                  </Text>
                </View>
                <View style={styles.installmentInfoRow}>
                  <Text style={[styles.installmentInfoLabel, { color: colors.lightText }]}>
                    {mode === 'edit' ? 'Current Amount:' : 'Original Amount:'}
                  </Text>
                  <Text style={[styles.installmentInfoValue, { color: mode === 'edit' ? colors.success : colors.primary, fontWeight: '700' }]}>
                    {formatCurrency(mode === 'edit' ? (selectedInstallment.actualPaidAmount || selectedInstallment.amount) : selectedInstallment.amount)}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalContent}>
              {/* Payment Amount */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Ionicons name="cash" size={18} color={mode === 'edit' ? colors.warning : colors.primary} />
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Amount *</Text>
                </View>
                <TextInput
                  style={[styles.textInput, { 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.background
                  }]}
                  value={paymentAmount}
                  onChangeText={handleAmountChange}
                  placeholder="Enter amount"
                  placeholderTextColor={colors.lightText}
                  keyboardType="numeric"
                />
                <Text style={[styles.inputHint, { color: colors.lightText }]}>
                  {mode === 'edit' 
                    ? 'Update the payment amount for this installment.' 
                    : 'You can pay more or less than the original amount. Any difference will be automatically distributed across remaining installments.'
                  }
                </Text>
                
                {/* Distribution Info Display */}
                {distributionInfo && (
                  <View style={[styles.distributionInfo, { 
                    backgroundColor: distributionInfo.isExcess ? colors.success + '10' : colors.warning + '10',
                    borderColor: distributionInfo.isExcess ? colors.success : colors.warning
                  }]}>
                    <View style={styles.distributionHeader}>
                      <Ionicons 
                        name={distributionInfo.isExcess ? 'trending-up' : 'trending-down'} 
                        size={16} 
                        color={distributionInfo.isExcess ? colors.success : colors.warning} 
                      />
                      <Text style={[styles.distributionTitle, { 
                        color: distributionInfo.isExcess ? colors.success : colors.warning 
                      }]}>
                        {distributionInfo.isExcess ? 'Excess Payment' : 'Shortfall Payment'}
                      </Text>
                    </View>
                    <Text style={[styles.distributionMessage, { color: colors.text }]}>
                      {distributionInfo.message}
                    </Text>
                  </View>
                )}
              </View>

              {/* Payment Method */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Ionicons name="card" size={18} color={mode === 'edit' ? colors.warning : colors.primary} />
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Method *</Text>
                </View>
                <View style={styles.paymentMethodGrid}>
                  {paymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                        style={[
                          styles.paymentMethodOption,
                          { 
                            backgroundColor: paymentMethod === method.id ? (mode === 'edit' ? colors.warning + '20' : colors.primary + '20') : colors.background,
                            borderColor: paymentMethod === method.id ? (mode === 'edit' ? colors.warning : colors.primary) : colors.border
                          }
                        ]}
                      onPress={() => setPaymentMethod(method.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons 
                        name={method.icon as any} 
                        size={20} 
                        color={paymentMethod === method.id ? (mode === 'edit' ? colors.warning : colors.primary) : colors.lightText} 
                      />
                      <Text style={[
                        styles.paymentMethodText,
                        { color: paymentMethod === method.id ? (mode === 'edit' ? colors.warning : colors.primary) : colors.text }
                      ]}>
                        {method.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Paid Date */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Ionicons name="calendar" size={18} color={mode === 'edit' ? colors.warning : colors.primary} />
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Paid Date</Text>
                </View>
                <TouchableOpacity
                  style={[styles.datePickerButton, { 
                    borderColor: colors.border,
                    backgroundColor: colors.background
                  }]}
                  onPress={openDatePicker}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.datePickerText, { 
                    color: paymentPaidDate ? colors.text : colors.lightText 
                  }]}>
                    {paymentPaidDate ? formatDate(paymentPaidDate) : 'Select Paid Date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={mode === 'edit' ? colors.warning : colors.primary} />
                </TouchableOpacity>
                <Text style={[styles.inputHint, { color: colors.lightText }]}>
                  Tap to select the paid date for this installment.
                </Text>
              </View>

              {/* Payment Notes */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Ionicons name="document-text" size={18} color={mode === 'edit' ? colors.warning : colors.primary} />
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Notes (Optional)</Text>
                </View>
                <TextInput
                  style={[styles.textInput, styles.textArea, { 
                    borderColor: colors.border,
                    color: colors.text,
                    backgroundColor: colors.background
                  }]}
                  value={paymentNotes}
                  onChangeText={setPaymentNotes}
                  placeholder="Add any notes about this payment"
                  placeholderTextColor={colors.lightText}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Record Payment Button - Inside scrollable content */}
              <View style={styles.recordPaymentContainer}>
                <TouchableOpacity
                  style={[
                    styles.recordPaymentButton, 
                    { 
                      backgroundColor: isRecording ? colors.lightText : (mode === 'edit' ? colors.warning : colors.primary),
                      opacity: isRecording ? 0.7 : 1
                    }
                  ]}
                  onPress={mode === 'edit' ? handleUpdatePayment : handlePayment}
                  activeOpacity={0.8}
                  disabled={isRecording}
                >
                  {isRecording ? (
                    <>
                      <Ionicons name="hourglass" size={20} color="#FFFFFF" />
                      <Text style={styles.recordPaymentButtonText}>
                        {mode === 'edit' ? 'Updating...' : 'Recording...'}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      <Text style={styles.recordPaymentButtonText}>
                        {mode === 'edit' ? 'Update Payment' : 'Record Payment'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Mark as Unpaid Button - Only show for paid installments */}
                {selectedInstallment?.status === 'paid' && onMarkUnpaid && (
                  <TouchableOpacity
                    style={[
                      styles.markUnpaidButton, 
                      { 
                        backgroundColor: colors.danger,
                        opacity: isRecording ? 0.7 : 1
                      }
                    ]}
                    onPress={handleMarkUnpaid}
                    activeOpacity={0.8}
                    disabled={isRecording}
                  >
                    <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.markUnpaidButtonText}>Mark as Unpaid</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
        
        {/* Date Picker for Payment Modal */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleDateChange}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  installmentInfo: {
    margin: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  installmentInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  installmentInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  installmentInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  installmentInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  installmentInfoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputHint: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 50,
  },
  textArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  paymentMethodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  paymentMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    minWidth: '45%',
    justifyContent: 'center',
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
  },
  recordPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordPaymentButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  markUnpaidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  markUnpaidButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  recordPaymentContainer: {
    marginTop: 20,
    marginBottom: 20,
    gap: 12,
  },
  distributionInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  distributionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  distributionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  distributionMessage: {
    fontSize: 12,
    lineHeight: 16,
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
