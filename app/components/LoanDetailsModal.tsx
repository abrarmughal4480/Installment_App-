import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Loan {
  _id: string;
  investorName: string;
  loanId: string;
  loanAmount: number;
  interestRate: number;
  duration: number;
  monthlyPayment: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  notes?: string;
  paymentHistory?: Array<{
    paymentDate: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
  }>;
  additionalAmountHistory?: Array<{
    addedDate: string;
    additionalAmount: number;
    reason?: string;
  }>;
}

interface LoanDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  loan: Loan | null;
  colors: any;
  formatCurrency: (amount: number) => string;
}

export default function LoanDetailsModal({
  visible,
  onClose,
  loan,
  colors,
  formatCurrency,
}: LoanDetailsModalProps) {
  if (!loan) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.cardBackground }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
              <Ionicons name="document-text" size={24} color={colors.primary} />
              <View style={styles.modalHeaderText}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Loan Details
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.lightText }]}>
                  {loan.investorName} - Loan #{loan.loanId}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
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
            {/* Payment Summary */}
            <View style={styles.modalContent}>
              <View style={[styles.loanDetailsCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.loanDetailsCardTitle, { color: colors.text }]}>
                  Payment Summary
                </Text>
                <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Total Paid</Text>
                  <Text style={[styles.summaryValue, { color: colors.success }]}>
                    {formatCurrency(loan.paidAmount || 0)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Remaining</Text>
                  <Text style={[styles.summaryValue, { color: colors.danger }]}>
                    {formatCurrency(loan.remainingAmount || 0)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Progress</Text>
                  <Text style={[styles.summaryValue, { color: colors.primary }]}>
                    {loan.totalAmount ? Math.round(((loan.paidAmount || 0) / loan.totalAmount) * 100) : 0}%
                  </Text>
                </View>
              </View>
              </View>
            </View>

            {/* Payment History */}
            <View style={styles.modalContent}>
              <View style={[styles.loanDetailsCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.loanDetailsCardTitle, { color: colors.text }]}>
                  Payment History
                </Text>
                {((loan.paymentHistory?.length ?? 0) > 0 || (loan.additionalAmountHistory?.length ?? 0) > 0) ? (
                  <View style={styles.paymentHistoryContainer}>
                    {[
                      ...(loan.additionalAmountHistory || []).map((item: any) => ({
                        ...item,
                        type: 'additional',
                        date: item.addedDate || item.createdAt,
                      })),
                      ...(loan.paymentHistory || []).map((item: any) => ({
                        ...item,
                        type: 'payment',
                        date: item.paymentDate,
                      })),
                    ]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((item: any, index: number) => {
                        if (item.type === 'additional') {
                          return (
                            <View key={`additional-${index}`} style={[styles.paymentItem, { backgroundColor: colors.background, marginBottom: 12 }]}>
                              <View style={styles.paymentHeader}>
                                <View style={styles.paymentHeaderLeft}>
                                  <Text style={[styles.paymentLabel, { color: colors.lightText }]}>Added on</Text>
                                  <Text style={[styles.paymentDate, { color: colors.text }]}>
                                    {new Date(item.addedDate).toLocaleDateString()}
                                  </Text>
                                </View>
                                <Text style={[styles.paymentAmount, { color: colors.warning }]}>
                                  +{formatCurrency(item.additionalAmount)}
                                </Text>
                              </View>
                              <View style={styles.paymentDetails}>
                                <Text style={[styles.paymentMethod, { color: colors.lightText }]}>
                                  Description: {item.reason || 'No description provided'}
                                </Text>
                              </View>
                            </View>
                          );
                        } else {
                          return (
                            <View key={`payment-${index}`} style={[styles.paymentItem, { backgroundColor: colors.background, marginBottom: 12 }]}>
                              <View style={styles.paymentHeader}>
                                <View style={styles.paymentHeaderLeft}>
                                  <Text style={[styles.paymentLabel, { color: colors.lightText }]}>Paid on</Text>
                                  <Text style={[styles.paymentDate, { color: colors.text }]}>
                                    {new Date(item.paymentDate).toLocaleDateString()}
                                  </Text>
                                </View>
                                <Text style={[styles.paymentAmount, { color: colors.success }]}>
                                  {formatCurrency(item.amount)}
                                </Text>
                              </View>
                              <View style={styles.paymentDetails}>
                                <Text style={[styles.paymentMethod, { color: colors.lightText }]}>
                                  Method: {item.paymentMethod}
                                </Text>
                                {item.notes && (
                                  <Text style={[styles.paymentNotes, { color: colors.lightText }]}>
                                    Notes: {item.notes}
                                  </Text>
                                )}
                              </View>
                            </View>
                          );
                        }
                      })}
                  </View>
                ) : (
                  <View style={[styles.emptyPaymentHistory, { backgroundColor: colors.background }]}>
                    <Ionicons name="receipt-outline" size={32} color={colors.lightText} />
                    <Text style={[styles.emptyPaymentText, { color: colors.lightText }]}>
                      No payment history available
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Notes */}
            {loan.notes && (
              <View style={styles.modalContent}>
                <View style={[styles.loanDetailsCard, { backgroundColor: colors.background }]}>
                  <Text style={[styles.loanDetailsCardTitle, { color: colors.text }]}>
                    Notes
                  </Text>
                  <View style={[styles.notesCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.notesText, { color: colors.text }]}>
                      {loan.notes}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
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
    flex: 1,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.8,
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
  modalContent: {
    padding: 20,
    paddingBottom: 20,
  },
  loanDetailsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loanDetailsCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  paymentHistoryContainer: {
    marginTop: 8,
  },
  paymentItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  paymentHeaderLeft: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paymentDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  paymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  paymentDetails: {
    gap: 4,
  },
  paymentMethod: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  paymentNotes: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  additionalAmountItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  additionalAmountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  additionalAmountHeaderLeft: {
    flex: 1,
  },
  additionalAmountLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  additionalAmountDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  additionalAmountValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  additionalAmountDetails: {
    marginTop: 8,
  },
  additionalAmountReason: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.7,
  },
  emptyPaymentHistory: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPaymentText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  notesCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    letterSpacing: -0.1,
  },
});

