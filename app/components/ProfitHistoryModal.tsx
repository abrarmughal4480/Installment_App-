import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';

interface ProfitRecord {
  month: string;
  profit: number;
  createdAt?: string;
}

interface ProfitHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  investorId: string;
  investorName: string;
  profitHistory?: ProfitRecord[];
  onSuccess?: () => void;
  colors: any;
}

const ProfitHistoryModal: React.FC<ProfitHistoryModalProps> = ({
  visible,
  onClose,
  investorId,
  investorName,
  profitHistory = [],
  onSuccess,
  colors,
}) => {
  const [history, setHistory] = useState<ProfitRecord[]>(profitHistory);
  const [formData, setFormData] = useState({
    profit: '',
    month: new Date(),
    year: new Date().getFullYear().toString(),
  });
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (visible) {
      setHistory(profitHistory);
      resetForm();
    }
  }, [visible, profitHistory]);

  const resetForm = () => {
    const now = new Date();
    setFormData({
      profit: '',
      month: now,
      year: now.getFullYear().toString(),
    });
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleMonthChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android' || event.type === 'set') {
      setShowMonthPicker(false);
      if (selectedDate) {
        setFormData(prev => ({
          ...prev,
          month: selectedDate,
          year: selectedDate.getFullYear().toString(),
        }));
      }
    }
  };

  const formatMonthYear = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' });
  };

  const getMonthString = () => {
    const month = String(formData.month.getMonth() + 1).padStart(2, '0');
    const year = formData.year;
    return `${year}-${month}`;
  };

  const handleAddOrUpdate = () => {
    if (!formData.profit.trim()) {
      showError('Please enter profit amount');
      return;
    }

    if (isNaN(Number(formData.profit)) || Number(formData.profit) < 0) {
      showError('Profit must be a non-negative number');
      return;
    }

    const monthStr = getMonthString();
    const newRecord: ProfitRecord = {
      month: monthStr,
      profit: Number(formData.profit),
    };

    if (isEditing && editingIndex !== null) {
      const updatedHistory = [...history];
      updatedHistory[editingIndex] = newRecord;
      setHistory(updatedHistory);
      showSuccess('Record updated');
      resetForm();
    } else {
      const existingIndex = history.findIndex(p => p.month === monthStr);
      if (existingIndex !== -1) {
        showError('Profit for this month already exists');
        return;
      }
      setHistory([...history, newRecord]);
      showSuccess('Record added');
      resetForm();
    }
  };

  const handleEdit = (index: number) => {
    const record = history[index];
    const [year, month] = record.month.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    
    setFormData({
      profit: record.profit.toString(),
      month: date,
      year: year,
    });
    setIsEditing(true);
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    setHistory(history.filter((_, i) => i !== index));
    showSuccess('Record deleted');
  };

  const handleSaveAll = async () => {
    if (history.length === 0) {
      showError('Please add at least one profit record');
      return;
    }

    try {
      setLoading(true);

      const response = await apiService.updateInvestorProfitHistory(
        investorId,
        history
      );

      if (response.success) {
        showSuccess('Profit history saved successfully');
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      } else {
        showError(response.message || 'Failed to save profit history');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to save profit history');
    } finally {
      setLoading(false);
    }
  };

  const getTotalProfit = () => {
    return history.reduce((sum, record) => sum + record.profit, 0);
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade" 
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerContent}>
              <Ionicons name="bar-chart" size={24} color={colors.primary} />
              <View style={styles.headerText}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Profit History</Text>
                <Text style={[styles.headerSubtitle, { color: colors.lightText }]}>
                  {investorName}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Form Section */}
            <View style={[styles.formSection, { backgroundColor: colors.background }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                {isEditing ? 'Edit Record' : 'Add Record'}
              </Text>

              {/* Month Picker */}
              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={[styles.label, { color: colors.lightText }]}>Month *</Text>
                  <TouchableOpacity
                    style={[styles.dateButton, { borderColor: colors.border }]}
                    onPress={() => setShowMonthPicker(true)}
                  >
                    <Ionicons name="calendar" size={18} color={colors.primary} />
                    <Text style={[styles.dateButtonText, { color: colors.text }]}>
                      {formData.month.toLocaleDateString('en-PK', { month: 'long', year: 'numeric' })}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Profit Input */}
                <View style={styles.formCol}>
                  <Text style={[styles.label, { color: colors.lightText }]}>Profit (Rs.) *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        color: colors.text,
                        backgroundColor: colors.cardBackground,
                      },
                    ]}
                    value={formData.profit}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, profit: text }))}
                    placeholder="0"
                    placeholderTextColor={colors.lightText}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.buttonRow}>
                {isEditing && (
                  <TouchableOpacity
                    style={[styles.button, styles.cancelEditButton, { backgroundColor: colors.border }]}
                    onPress={() => {
                      resetForm();
                      setIsEditing(false);
                    }}
                  >
                    <Text style={[styles.buttonText, { color: colors.text }]}>Cancel Edit</Text>
                  </TouchableOpacity>
                )}
                <View style={styles.buttonSpacer} />
                <TouchableOpacity
                  style={[styles.button, styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddOrUpdate}
                >
                  <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                    {isEditing ? 'Update' : 'Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* History Section */}
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  Records ({history.length})
                </Text>
                {history.length > 0 && (
                  <Text style={[styles.totalProfit, { color: colors.success }]}>
                    Total: Rs. {getTotalProfit().toLocaleString()}
                  </Text>
                )}
              </View>

              {history.length === 0 ? (
                <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
                  <Ionicons name="document-outline" size={40} color={colors.lightText} />
                  <Text style={[styles.emptyText, { color: colors.lightText }]}>
                    No records added yet
                  </Text>
                </View>
              ) : (
                <View style={styles.recordsList}>
                  {history.map((record, index) => (
                    <View
                      key={index}
                      style={[
                        styles.recordItem,
                        {
                          backgroundColor: colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={styles.recordInfo}>
                        <Text style={[styles.recordMonth, { color: colors.text }]}>
                          {formatMonthYear(record.month)}
                        </Text>
                        <Text style={[styles.recordProfit, { color: colors.success }]}>
                          Rs. {record.profit.toLocaleString()}
                        </Text>
                      </View>
                      <View style={styles.recordActions}>
                        <TouchableOpacity onPress={() => handleEdit(index)}>
                          <Ionicons name="pencil" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(index)}>
                          <Ionicons name="trash" size={18} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: colors.border }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: loading || history.length === 0 ? 0.5 : 1,
                },
              ]}
              onPress={handleSaveAll}
              disabled={loading || history.length === 0}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Save All</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Month Picker */}
          {showMonthPicker && (
            <DateTimePicker
              value={formData.month}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleMonthChange}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    minHeight: '75%',
    borderRadius: 24,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  formCol: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
    alignItems: 'center',
  },
  buttonSpacer: {
    flex: 1,
  },
  cancelEditButton: {
    flex: 0,
    minWidth: 100,
  },
  addButton: {
    flex: 0,
    minWidth: 100,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  historySection: {
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalProfit: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  recordsList: {
    gap: 8,
  },
  recordItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  recordInfo: {
    flex: 1,
  },
  recordMonth: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  recordProfit: {
    fontSize: 13,
    fontWeight: '500',
  },
  recordActions: {
    flexDirection: 'row',
    gap: 12,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ProfitHistoryModal;
