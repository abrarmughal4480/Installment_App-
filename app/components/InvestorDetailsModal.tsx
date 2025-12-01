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

interface InvestorDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  investor: Investor | null;
  colors: any;
  formatCurrency: (amount: number) => string;
  calculateTotalProfit: (investor: Investor) => number;
}

export default function InvestorDetailsModal({
  visible,
  onClose,
  investor,
  colors,
  formatCurrency,
  calculateTotalProfit,
}: InvestorDetailsModalProps) {
  if (!investor) return null;

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
              <Ionicons name="person" size={24} color={colors.primary} />
              <View style={styles.modalHeaderText}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  Investor Details
                </Text>
                <Text style={[styles.modalSubtitle, { color: colors.lightText }]}>
                  {investor.name}
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
            {/* Investment Summary */}
            <View style={styles.modalContent}>
              <View style={[styles.investorDetailsCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.investorDetailsCardTitle, { color: colors.text }]}>
                  Investment Summary
                </Text>
                
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Investment Amount</Text>
                    <Text style={[styles.summaryValue, { color: colors.success }]}>
                      {formatCurrency(investor.investmentAmount || 0)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Monthly Profit</Text>
                    <Text style={[styles.summaryValue, { color: colors.warning }]}>
                      {formatCurrency(investor.monthlyProfit || 0)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Total Profit</Text>
                    <Text style={[styles.summaryValue, { color: colors.primary }]}>
                      {formatCurrency(calculateTotalProfit(investor))}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Profit History */}
            <View style={styles.modalContent}>
              <View style={[styles.investorDetailsCard, { backgroundColor: colors.background }]}>
                <Text style={[styles.investorDetailsCardTitle, { color: colors.text }]}>
                  Profit History by Month
                </Text>
                {investor.profitHistory && investor.profitHistory.length > 0 ? (
                  <View style={styles.profitHistoryContainer}>
                    {[...investor.profitHistory]
                      .sort((a, b) => {
                        // Parse month string (format: "YYYY-MM") and sort by date descending (latest first)
                        const parseMonth = (monthStr: string) => {
                          const [year, month] = monthStr.split('-');
                          return new Date(parseInt(year), parseInt(month) - 1).getTime();
                        };
                        
                        const dateA = parseMonth(a.month);
                        const dateB = parseMonth(b.month);
                        
                        // Sort by month date descending (latest first)
                        if (dateB !== dateA) {
                          return dateB - dateA;
                        }
                        
                        // If same month, sort by createdAt descending (latest first)
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      })
                      .map((profit, index) => (
                        <View key={index} style={[styles.profitHistoryItem, { backgroundColor: colors.background, marginBottom: 12 }]}>
                          <View style={styles.profitHistoryHeader}>
                            <View style={styles.profitHistoryHeaderLeft}>
                              <Text style={[styles.profitHistoryLabel, { color: colors.lightText }]}>Month</Text>
                              <Text style={[styles.profitHistoryMonth, { color: colors.text }]}>
                                {profit.month}
                              </Text>
                            </View>
                            <Text style={[styles.profitHistoryAmount, { color: colors.success }]}>
                              {formatCurrency(profit.profit)}
                            </Text>
                          </View>
                        </View>
                      ))}
                  </View>
                ) : (
                  <View style={[styles.emptyProfitHistory, { backgroundColor: colors.background }]}>
                    <Ionicons name="receipt-outline" size={32} color={colors.lightText} />
                    <Text style={[styles.emptyProfitHistoryText, { color: colors.lightText }]}>
                      No profit history available
                    </Text>
                  </View>
                )}
              </View>
            </View>
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
  investorDetailsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  investorDetailsCardTitle: {
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
  profitHistoryContainer: {
    marginTop: 8,
  },
  profitHistoryItem: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profitHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  profitHistoryHeaderLeft: {
    flex: 1,
  },
  profitHistoryLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profitHistoryMonth: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  profitHistoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  emptyProfitHistory: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyProfitHistoryText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
});

