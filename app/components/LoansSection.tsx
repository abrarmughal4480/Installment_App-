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
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../services/apiService';
import { useToast } from '../contexts/ToastContext';
import ConfirmationModal from './ConfirmationModal';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

interface Loan {
  _id: string;
  loanId: string;
  investorName: string;
  loanAmount: number;
  interestRate: number;
  duration: number;
  monthlyPayment: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
  startDate: string;
  endDate: string;
  notes?: string;
  createdAt: string;
  paymentHistory?: Array<{
    paymentDate: string;
    amount: number;
    paymentMethod: string;
    notes?: string;
  }>;
}

interface LoansSectionProps {
  colors: any;
}

export default function LoansSection({ colors }: LoansSectionProps) {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'defaulted' | 'cancelled'>('all');
  const [showOverview, setShowOverview] = useState(true);
  
  // Add loan modal state
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  
  // Edit modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Loan details modal state
  const [showLoanDetailsModal, setShowLoanDetailsModal] = useState(false);
  
  // Form input states
  const [formData, setFormData] = useState({
    investorName: '',
    loanAmount: '',
    interestRate: '',
    duration: '',
    notes: '',
  });
  
  // Payment form data
  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    paymentMethod: 'cash',
    notes: '',
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
    loadLoans();
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

  const loadLoans = async (showLoader = true) => {
    try {
      if (showLoader) {
        setIsLoading(true);
      }

      console.log('🔄 Loading loans...');
      const response = await apiService.getLoans();
      console.log('📡 Loans API response:', response);

      if (response.success) {
        console.log('✅ Loans loaded successfully:', response.data?.length || 0, 'loans');
        setLoans(response.data || []);
      } else {
        console.log('❌ Failed to load loans:', response);
        if (showLoader) {
          showError(response.message || 'Failed to load loans');
        }
      }
    } catch (error) {
      console.log('❌ Loan load error:', error);
      if (showLoader) {
        showError('Failed to load loans. Please try again.');
      }
    } finally {
      if (showLoader) {
        setIsLoading(false);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadLoans(false);
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

  const formatCurrency = (amount: number) => {
    // Apply +1 round-off if amount has decimal points
    const roundedAmount = amount % 1 !== 0 ? Math.round(amount) + 1 : Math.round(amount);
    return `Rs. ${roundedAmount.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success;
      case 'completed': return colors.primary;
      case 'defaulted': return colors.danger;
      case 'cancelled': return colors.lightText;
      default: return colors.text;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return 'play-circle';
      case 'completed': return 'checkmark-circle';
      case 'defaulted': return 'alert-circle';
      case 'cancelled': return 'close-circle';
      default: return 'help-circle';
    }
  };

  // Calculate loan statistics
  const loanStats = useMemo(() => {
    const totalLoans = loans.length;
    const activeLoans = loans.filter(l => l.status === 'active').length;
    const completedLoans = loans.filter(l => l.status === 'completed').length;
    const defaultedLoans = loans.filter(l => l.status === 'defaulted').length;
    const cancelledLoans = loans.filter(l => l.status === 'cancelled').length;
    
    const totalLoanAmount = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
    const totalPaidAmount = loans.reduce((sum, loan) => sum + loan.paidAmount, 0);
    const totalRemainingAmount = loans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    const totalInterestEarned = loans.reduce((sum, loan) => sum + (loan.totalAmount - loan.loanAmount), 0);
    
    return {
      totalLoans,
      activeLoans,
      completedLoans,
      defaultedLoans,
      cancelledLoans,
      totalLoanAmount,
      totalPaidAmount,
      totalRemainingAmount,
      totalInterestEarned,
    };
  }, [loans]);

  // Filter loans based on search query and status filter
  const filteredLoans = useMemo(() => {
    let filtered = loans;
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(loan => loan.status === filter);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(loan => 
        loan.investorName?.toLowerCase().includes(query) ||
        loan.loanId?.toLowerCase().includes(query) ||
        loan.status?.toLowerCase().includes(query) ||
        loan.loanAmount?.toString().includes(query)
      );
    }
    
    return filtered;
  }, [loans, searchQuery, filter]);

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

  const handleAddLoan = async () => {
    if (!formData.investorName.trim() || !formData.loanAmount.trim() || 
        !formData.interestRate.trim() || !formData.duration.trim()) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      const response = await apiService.addLoan({
        investorName: formData.investorName.trim(),
        loanAmount: parseFloat(formData.loanAmount),
        interestRate: parseFloat(formData.interestRate),
        duration: parseInt(formData.duration),
        notes: formData.notes.trim(),
      });

      if (response.success) {
        showSuccess('Loan added successfully');
        setShowAddLoanModal(false);
        setFormData({
          investorName: '',
          loanAmount: '',
          interestRate: '',
          duration: '',
          notes: '',
        });
        loadLoans(false);
      } else {
        showError(response.message || 'Failed to add loan');
      }
    } catch (error) {
      console.error('Add loan error:', error);
      showError('Failed to add loan. Please try again.');
    }
  };

  const handleAddPayment = async () => {
    if (!paymentFormData.amount.trim()) {
      showError('Please enter payment amount');
      return;
    }

    try {
      const response = await apiService.addLoanPayment(selectedLoan!._id, {
        amount: parseFloat(paymentFormData.amount),
        paymentMethod: paymentFormData.paymentMethod,
        notes: paymentFormData.notes.trim(),
      });

      if (response.success) {
        showSuccess('Payment added successfully');
        setShowPaymentModal(false);
        setPaymentFormData({
          amount: '',
          paymentMethod: 'cash',
          notes: '',
        });
        loadLoans(false);
      } else {
        showError(response.message || 'Failed to add payment');
      }
    } catch (error) {
      console.error('Add payment error:', error);
      showError('Failed to add payment. Please try again.');
    }
  };

  const handleDeleteLoan = async (loan: Loan) => {
    setConfirmationModal({
      visible: true,
      title: 'Delete Loan',
      message: `Are you sure you want to delete the loan for "${loan.investorName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      confirmColor: colors.danger,
      icon: 'trash',
      iconColor: colors.danger,
      onConfirm: async () => {
        try {
          const response = await apiService.deleteLoan(loan._id);
          
          if (response.success) {
            showSuccess('Loan deleted successfully');
            loadLoans(false);
          } else {
            showError(response.message || 'Failed to delete loan');
          }
        } catch (error) {
          showError('Failed to delete loan. Please try again.');
        }
      },
    });
  };

  const handleShareLoan = async (loan: Loan) => {
    try {
      showInfo('Generating PDF...');
      
      const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;
      const formatDate = (date?: string) => {
        if (date) {
          return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          });
        }
        return 'N/A';
      };

      const generateHTML = () => {
        // Generate payment history rows
        const paymentRows = loan.paymentHistory && loan.paymentHistory.length > 0 
          ? loan.paymentHistory.map((payment: any, index: number) => {
              const paymentDate = new Date(payment.paymentDate);
              return `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 12px 10px; font-size: 14px; color: #000; border-right: 1px solid #ddd; font-weight: bold; color: #10B981;">
                    Paid
                  </td>
                  <td style="padding: 12px 10px; font-size: 14px; color: #000; border-right: 1px solid #ddd;">${index + 1}</td>
                  <td style="padding: 12px 10px; font-size: 14px; color: #000; border-right: 1px solid #ddd;">${formatCurrency(payment.amount)}</td>
                  <td style="padding: 12px 10px; font-size: 14px; color: #000;">${paymentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                </tr>
              `;
            }).join('')
          : '';

        // Generate remaining payment rows for unpaid installments
        const totalPayments = loan.paymentHistory ? loan.paymentHistory.length : 0;
        const remainingPayments = Math.max(0, loan.duration - totalPayments);
        const remainingRows = Array.from({ length: remainingPayments }, (_, idx) => {
          const paymentNumber = totalPayments + idx + 1;
          const startDate = new Date(loan.startDate);
          const dueDate = new Date(startDate);
          dueDate.setMonth(dueDate.getMonth() + paymentNumber);

          return `
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 12px 10px; font-size: 14px; color: #000; border-right: 1px solid #ddd; font-weight: bold; color: #d32f2f;">
                Not Paid
              </td>
              <td style="padding: 12px 10px; font-size: 14px; color: #000; border-right: 1px solid #ddd;">${paymentNumber}</td>
              <td style="padding: 12px 10px; font-size: 14px; color: #000; border-right: 1px solid #ddd;">Rs. 0</td>
              <td style="padding: 12px 10px; font-size: 14px; color: #000;">${dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
            </tr>
          `;
        }).join('');

        return `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              * {
                box-sizing: border-box;
                color-scheme: light !important;
                forced-color-adjust: none !important;
              }
              body {
                font-family: Arial, sans-serif;
                color: #000;
                background: #fff;
                margin: 0;
                padding: 0;
              }
              .sheet {
                width: 794px;
                min-width: 794px;
                padding: 25px 30px 30px 30px;
                margin: 0 auto;
              }
              .header {
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 3px solid #000;
              }
              .logo-section {
                display: flex;
                align-items: center;
                gap: 15px;
              }
              .logo-text {
                font-size: 22px;
                font-weight: bold;
                color: #000;
                line-height: 1.2;
                letter-spacing: 1px;
              }
              .logo-subtitle {
                font-size: 11px;
                color: #666;
                margin-top: 3px;
                letter-spacing: 0.5px;
              }
              .statement-title {
                text-align: center;
                margin: 25px 0;
              }
              .statement-title h1 {
                font-size: 28px;
                font-weight: bold;
                color: #000;
                margin-bottom: 8px;
                letter-spacing: 1px;
              }
              .customer-name {
                font-size: 32px;
                font-weight: 900;
                color: #000;
                text-align: center;
                margin-bottom: 25px;
                letter-spacing: 0.5px;
              }
              .contract-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 40px;
                margin-bottom: 30px;
                padding: 20px;
                background: #fafafa;
                border-radius: 8px;
                border: 1px solid #e0e0e0;
              }
              .contract-info h3 {
                font-size: 16px;
                font-weight: bold;
                color: #000;
                margin-bottom: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .contract-item {
                margin-bottom: 6px;
                font-size: 14px;
                color: #000;
              }
              .invoice-info {
                margin-bottom: 12px;
              }
              .invoice-item {
                margin-bottom: 4px;
                font-size: 14px;
                color: #000;
              }
              .balance-box {
                background: #e8f5e8;
                border: 2px solid #4CAF50;
                border-radius: 8px;
                padding: 18px;
                text-align: center;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-top: 10px;
                width: auto;
                display: inline-block;
              }
              .balance-label {
                font-size: 14px;
                font-weight: bold;
                color: #000;
                margin-bottom: 4px;
              }
              .balance-amount {
                font-size: 22px;
                font-weight: 900;
                color: #000;
              }
              .separator {
                border-top: 2px solid #000;
                margin: 25px 0;
              }
              table.installment-table {
                width: auto;
                border-collapse: collapse;
                margin-bottom: 20px;
                margin-left: 20px;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              }
              .table-header {
                background: #f5f5f5;
                border-bottom: 2px solid #000;
              }
              .table-header th {
                padding: 14px 10px;
                font-size: 14px;
                font-weight: bold;
                color: #000;
                text-align: left;
                border-right: 1px solid #ddd;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              }
              .table-header th:last-child {
                border-right: none;
              }
              .table-row {
                border-bottom: 1px solid #ddd;
              }
              .table-row:nth-child(even) {
                background-color: #f9f9f9;
              }
              .table-row td {
                padding: 12px 10px;
                font-size: 14px;
                color: #000;
                border-right: 1px solid #ddd;
              }
              .table-row td:last-child {
                border-right: none;
              }
              .total-received {
                text-align: right;
                font-size: 16px;
                font-weight: bold;
                color: #000;
                margin-top: 12px;
                margin-left: 20px;
              }
              .footer {
                margin-top: 30px;
                padding-top: 15px;
              }
              .instructions {
                text-align: right;
                width: 50%;
                margin-left: auto;
              }
              .instructions-title {
                font-size: 14px;
                font-weight: bold;
                color: #4CAF50;
                margin-bottom: 8px;
              }
              .instructions-text {
                font-size: 12px;
                color: #000;
                line-height: 1.5;
                direction: rtl;
                text-align: right;
              }
              .thank-you-section {
                text-align: left;
                position: relative;
              }
              .thank-you-graphic {
                width: 120px;
                height: 120px;
                background: #e8f5e8;
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                position: relative;
                border: 3px solid #4CAF50;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              }
              .thank-you-text {
                font-size: 16px;
                font-weight: bold;
                color: #000;
                font-style: italic;
                margin-bottom: 4px;
              }
              .thank-you-urdu {
                font-size: 14px;
                font-weight: bold;
                color: #000;
                font-style: italic;
              }
            </style>
          </head>
          <body>
            <div class="sheet">
              <div class="header">
                <div class="logo-section">
                  <div>
                    <div class="logo-text">APNA BUSINESS 12</div>
                    <div class="logo-subtitle">INNOVATE. SUSTAIN. PROSPER.</div>
                  </div>
                </div>
              </div>

              <div class="statement-title">
                <h1>LOAN STATEMENT</h1>
              </div>

              <div class="customer-name">
                ${loan.investorName || 'Investor Name'}
              </div>

              <div class="contract-details">
                <div class="contract-info">
                  <h3>Loan details</h3>
                  <div class="contract-item">Loan ID: ${loan.loanId}</div>
                  <div class="contract-item">
                    ${loan.duration}-Month-${formatCurrency(loan.monthlyPayment)}
                  </div>
                  <div class="contract-item">Interest Rate: ${loan.interestRate}%</div>
                </div>

                <div class="invoice-info">
                  <div class="invoice-item">Start Date: ${formatDate(loan.startDate)}</div>
                  <div class="invoice-item">End Date: ${formatDate(loan.endDate)}</div>
                  <div class="balance-box">
                    <div class="balance-label">Remaining :</div>
                    <div class="balance-amount">${formatCurrency(loan.remainingAmount)}</div>
                  </div>
                </div>
              </div>

              <div class="separator"></div>

              <table class="installment-table">
                <thead class="table-header">
                  <tr>
                    <th>STATUS</th>
                    <th>NO</th>
                    <th>PAYMENT</th>
                    <th>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  ${paymentRows}
                  ${remainingRows}
                </tbody>
              </table>

              <div class="total-received">
                ${formatCurrency(loan.paidAmount)} Received
              </div>

              <div class="footer">
                <div class="instructions">
                  <div class="instructions-title">ESSENTIAL INSTRUCTION</div>
                  <div class="instructions-text">
                    یہ رسید آپ کے قرض کی مکمل تفصیلات بشمول رقم لینے اور دینے کی تاریخوں کے ساتھ فراہم کرتی ہے۔ براہ کرم ادائیگی مقررہ وقت پر ہر ماہ کی 10 تاریخ پر یقینی بنائیں
                  </div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
      };

      const html = generateHTML();
      const fileName = `Loan_${loan.investorName?.replace(/[^a-zA-Z0-9]/g, '_')}_${loan.loanId}.pdf`;
      
      const { uri } = await Print.printToFileAsync({
        html: html,
        base64: false,
      });
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Loan Statement'
        });
        showSuccess('PDF generated and ready to share!');
      } else {
        showError('Sharing not available on this device');
      }
      
    } catch (error) {
      console.log('PDF generation error:', error);
      showError('Failed to generate PDF. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loanSection}>
        {/* Skeleton Overview */}
        <View style={[styles.revenueCard, { backgroundColor: colors.cardBackground }]}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.revenueGradient}
          >
            <Animated.View style={[styles.skeletonLine, styles.skeletonRevenueTitle, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
            <View style={styles.revenueStats}>
              <View style={styles.revenueItem}>
                <Animated.View style={[styles.skeletonLine, styles.skeletonRevenueLabel, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
                <Animated.View style={[styles.skeletonLine, styles.skeletonRevenueValue, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
              </View>
              <View style={styles.revenueRow}>
                <View style={styles.revenueItem}>
                  <Animated.View style={[styles.skeletonLine, styles.skeletonRevenueLabel, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
                  <Animated.View style={[styles.skeletonLine, styles.skeletonRevenueValue, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
                </View>
                <View style={styles.revenueItem}>
                  <Animated.View style={[styles.skeletonLine, styles.skeletonRevenueLabel, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
                  <Animated.View style={[styles.skeletonLine, styles.skeletonRevenueValue, { backgroundColor: 'rgba(255,255,255,0.3)', opacity: shimmerOpacity }]} />
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Skeleton Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.modernFilterScrollView}
          contentContainerStyle={styles.modernFilterContainer}
        >
          {[1, 2, 3, 4, 5].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.skeletonFilterPill,
                { backgroundColor: colors.border, opacity: shimmerOpacity }
              ]}
            />
          ))}
        </ScrollView>

        {/* Skeleton Section Header */}
        <View style={styles.sectionHeader}>
          <Animated.View style={[styles.skeletonLine, styles.skeletonSectionTitle, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
          <View style={styles.headerActions}>
            <Animated.View style={[styles.skeletonActionButton, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonActionButton, { backgroundColor: colors.border, opacity: shimmerOpacity }]} />
          </View>
        </View>

        {/* Skeleton Cards */}
        <>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </>
      </View>
    );
  }

  return (
    <View style={styles.loanSection}>
      {/* Overview Section */}
      {showOverview && (
        <View style={[styles.revenueCard, { backgroundColor: colors.cardBackground }]}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.revenueGradient}
          >
            <Text style={styles.revenueTitle}>Loan Overview</Text>
            <View style={styles.revenueStats}>
              <View style={styles.revenueItem}>
                <Text style={styles.revenueLabel}>Total</Text>
                <Text style={styles.revenueValue}>{formatCurrency(loanStats.totalLoanAmount)}</Text>
              </View>
              <View style={styles.revenueRow}>
                <View style={styles.revenueItem}>
                  <Text style={styles.revenueLabel}>Collected</Text>
                  <Text style={[styles.revenueValue, { color: '#4ECDC4' }]}>
                    {formatCurrency(loanStats.totalPaidAmount)}
                  </Text>
                </View>
                <View style={styles.revenueItem}>
                  <Text style={styles.revenueLabel}>Remaining</Text>
                  <Text style={[styles.revenueValue, { color: '#FF6B6B' }]}>
                    {formatCurrency(loanStats.totalRemainingAmount)}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}
      
      {/* Filter Buttons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.modernFilterScrollView}
        contentContainerStyle={styles.modernFilterContainer}
      >
        {[
          { key: 'all', label: 'All', count: loans.length },
          { key: 'active', label: 'Active', count: loans.filter(l => l.status === 'active').length },
          { key: 'completed', label: 'Completed', count: loans.filter(l => l.status === 'completed').length },
          { key: 'defaulted', label: 'Defaulted', count: loans.filter(l => l.status === 'defaulted').length },
          { key: 'cancelled', label: 'Cancelled', count: loans.filter(l => l.status === 'cancelled').length },
        ].map((filterOption) => {
          const isActive = filter === filterOption.key;
          const color =
            filterOption.key === 'active' ? colors.primary :
            filterOption.key === 'defaulted' ? colors.danger :
            filterOption.key === 'completed' ? colors.success :
            filterOption.key === 'cancelled' ? colors.lightText :
            colors.lightText;
          
          return (
            <TouchableOpacity
              key={filterOption.key}
              onPress={() => setFilter(filterOption.key as any)}
              style={[
                styles.modernFilterPill,
                isActive && { backgroundColor: color, borderColor: color }
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.modernFilterText,
                  isActive ? { color: '#FFFFFF' } : { color: color }
                ]}
              >
                {filterOption.label}{filterOption.count > 0 ? ` (${filterOption.count})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Loans Section */}
      <View style={styles.loanSection}>
        <View style={styles.sectionHeader}>
          {!showSearchBar ? (
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Loans ({filteredLoans.length})
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
                placeholder="Search loans..."
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
            {/* Add Loan Icon */}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={() => setShowAddLoanModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {filteredLoans.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
          <Ionicons name="card-outline" size={48} color={colors.lightText} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {loans.length === 0 ? 'No Loans Yet' : 'No Loans Found'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.lightText }]}>
            {loans.length === 0 
              ? 'No loans have been created yet.'
              : 'Try adjusting your search to see more loans.'
            }
          </Text>
        </View>
      ) : (
        filteredLoans.map((loan, index) => (
          <View key={loan._id}>
            <TouchableOpacity 
              style={[styles.loanCard, { backgroundColor: colors.cardBackground }]}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedLoan(loan);
                setShowLoanDetailsModal(true);
              }}
            >
            <View style={styles.loanHeader}>
              <View style={styles.loanInfo}>
                <Text style={[styles.loanName, { color: colors.text }]}>
                  {loan.investorName}
                </Text>
                <Text style={[styles.loanId, { color: colors.lightText }]}>
                  Loan #{loan.loanId}
                </Text>
                <View style={styles.statusContainer}>
                  <Ionicons 
                    name={getStatusIcon(loan.status)} 
                    size={14} 
                    color={getStatusColor(loan.status)} 
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(loan.status) }]}>
                    {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                  </Text>
                </View>
              </View>
              <View style={styles.headerActions}>
                {/* Share button */}
                <TouchableOpacity
                  style={[styles.cardActionButton, { backgroundColor: colors.primary }]}
                  onPress={(e) => {
                    e.stopPropagation(); 
                    handleShareLoan(loan);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="share" size={14} color="#FFFFFF" />
                </TouchableOpacity>
                {/* Payment button */}
                <TouchableOpacity
                  style={[styles.cardActionButton, { backgroundColor: colors.success }]}
                  onPress={(e) => {
                    e.stopPropagation(); 
                    setSelectedLoan(loan);
                    setShowPaymentModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="card" size={14} color="#FFFFFF" />
                </TouchableOpacity>
                {/* Delete button */}
                <TouchableOpacity
                  style={[styles.cardActionButton, { backgroundColor: colors.danger }]}
                  onPress={(e) => {
                    e.stopPropagation(); 
                    handleDeleteLoan(loan);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.loanDetails}>
              <View style={styles.loanRow}>
                <View style={styles.loanCol}>
                  <Text style={[styles.loanLabel, { color: colors.lightText }]}>Loan Amount</Text>
                  <Text style={[styles.loanValue, { color: colors.primary }]}>
                    {formatCurrency(loan.loanAmount)}
                  </Text>
                </View>
                <View style={styles.loanCol}>
                  <Text style={[styles.loanLabel, { color: colors.lightText }]}>Interest Rate</Text>
                  <Text style={[styles.loanValue, { color: colors.warning }]}>
                    {loan.interestRate}%
                  </Text>
                </View>
              </View>
              <View style={styles.loanRow}>
                <View style={styles.loanCol}>
                  <Text style={[styles.loanLabel, { color: colors.lightText }]}>Monthly Payment</Text>
                  <Text style={[styles.loanValue, { color: colors.success }]}>
                    {formatCurrency(loan.monthlyPayment)}
                  </Text>
                </View>
                <View style={styles.loanCol}>
                  <Text style={[styles.loanLabel, { color: colors.lightText }]}>Duration</Text>
                  <Text style={[styles.loanValue, { color: colors.text }]}>
                    {loan.duration} months
                  </Text>
                </View>
              </View>
              <View style={styles.loanRow}>
                <View style={styles.loanCol}>
                  <Text style={[styles.loanLabel, { color: colors.lightText }]}>Paid Amount</Text>
                  <Text style={[styles.loanValue, { color: colors.success }]}>
                    {formatCurrency(loan.paidAmount)}
                  </Text>
                </View>
                <View style={styles.loanCol}>
                  <Text style={[styles.loanLabel, { color: colors.lightText }]}>Remaining</Text>
                  <Text style={[styles.loanValue, { color: colors.danger }]}>
                    {formatCurrency(loan.remainingAmount)}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          </View>
        ))
      )}
      </View>
      
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

      {/* Loan Details Modal */}
      <Modal
        visible={showLoanDetailsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoanDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.addModalContainer, { backgroundColor: colors.cardBackground }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { backgroundColor: colors.primary + '10' }]}>
              <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                  <Ionicons name="document-text" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Loan Details
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.lightText }]}>
                    {selectedLoan?.investorName} - Loan #{selectedLoan?.loanId}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowLoanDetailsModal(false)}
                style={[styles.closeButton, { backgroundColor: colors.border }]}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Content */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Loan Information */}
              <View style={styles.detailsSection}>
                <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Loan Information</Text>
                <View style={styles.loanInfoCard}>
                  <View style={styles.loanInfoRow}>
                    <View style={styles.loanInfoItem}>
                      <Text style={[styles.loanInfoLabel, { color: colors.lightText }]}>Loan Amount</Text>
                      <Text style={[styles.loanInfoValue, { color: colors.primary }]}>
                        {formatCurrency(selectedLoan?.loanAmount || 0)}
                      </Text>
                    </View>
                    <View style={styles.loanInfoItem}>
                      <Text style={[styles.loanInfoLabel, { color: colors.lightText }]}>Interest Rate</Text>
                      <Text style={[styles.loanInfoValue, { color: colors.text }]}>
                        {selectedLoan?.interestRate}%
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.loanInfoRow}>
                    <View style={styles.loanInfoItem}>
                      <Text style={[styles.loanInfoLabel, { color: colors.lightText }]}>Duration</Text>
                      <Text style={[styles.loanInfoValue, { color: colors.text }]}>
                        {selectedLoan?.duration} months
                      </Text>
                    </View>
                    <View style={styles.loanInfoItem}>
                      <Text style={[styles.loanInfoLabel, { color: colors.lightText }]}>Monthly Payment</Text>
                      <Text style={[styles.loanInfoValue, { color: colors.success }]}>
                        {formatCurrency(selectedLoan?.monthlyPayment || 0)}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.loanInfoRow}>
                    <View style={styles.loanInfoItem}>
                      <Text style={[styles.loanInfoLabel, { color: colors.lightText }]}>Total Amount</Text>
                      <Text style={[styles.loanInfoValue, { color: colors.text }]}>
                        {formatCurrency(selectedLoan?.totalAmount || 0)}
                      </Text>
                    </View>
                    <View style={styles.loanInfoItem}>
                      <Text style={[styles.loanInfoLabel, { color: colors.lightText }]}>Status</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedLoan?.status || 'active') }]}>
                        <Text style={styles.modalStatusText}>
                          {(selectedLoan?.status || 'active').charAt(0).toUpperCase() + (selectedLoan?.status || 'active').slice(1)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Payment Summary */}
              <View style={styles.detailsSection}>
                <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Payment Summary</Text>
                <View style={styles.summaryCard}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Total Paid</Text>
                    <Text style={[styles.summaryValue, { color: colors.success }]}>
                      {formatCurrency(selectedLoan?.paidAmount || 0)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Remaining</Text>
                    <Text style={[styles.summaryValue, { color: colors.danger }]}>
                      {formatCurrency(selectedLoan?.remainingAmount || 0)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.lightText }]}>Progress</Text>
                    <Text style={[styles.summaryValue, { color: colors.primary }]}>
                      {selectedLoan?.totalAmount ? Math.round(((selectedLoan?.paidAmount || 0) / selectedLoan?.totalAmount) * 100) : 0}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Payment History */}
              <View style={styles.detailsSection}>
                <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Payment History</Text>
                {selectedLoan?.paymentHistory && selectedLoan.paymentHistory.length > 0 ? (
                  <View style={styles.paymentHistory}>
                    {selectedLoan.paymentHistory.map((payment: any, index: number) => (
                      <View key={index} style={[styles.paymentItem, { backgroundColor: colors.background }]}>
                        <View style={styles.paymentHeader}>
                          <Text style={[styles.paymentDate, { color: colors.text }]}>
                            {new Date(payment.paymentDate).toLocaleDateString()}
                          </Text>
                          <Text style={[styles.paymentAmount, { color: colors.success }]}>
                            {formatCurrency(payment.amount)}
                          </Text>
                        </View>
                        <View style={styles.paymentDetails}>
                          <Text style={[styles.paymentMethod, { color: colors.lightText }]}>
                            Method: {payment.paymentMethod}
                          </Text>
                          {payment.notes && (
                            <Text style={[styles.paymentNotes, { color: colors.lightText }]}>
                              Notes: {payment.notes}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
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

              {/* Notes */}
              {selectedLoan?.notes && (
                <View style={styles.detailsSection}>
                  <Text style={[styles.detailsSectionTitle, { color: colors.text }]}>Notes</Text>
                  <View style={[styles.notesCard, { backgroundColor: colors.background }]}>
                    <Text style={[styles.notesText, { color: colors.text }]}>
                      {selectedLoan.notes}
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Add Loan Modal */}
      <Modal
        visible={showAddLoanModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddLoanModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.addModalContainer, { backgroundColor: colors.cardBackground }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { backgroundColor: colors.primary + '10' }]}>
              <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                  <Ionicons name="card" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Add New Loan
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.lightText }]}>
                    Create a new loan for an investor
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddLoanModal(false)}
                style={[styles.closeButton, { backgroundColor: colors.border }]}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Content */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <View style={styles.inputField}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Investor Name *
                  </Text>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      color: colors.text 
                    }]}
                    value={formData.investorName}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, investorName: text }))}
                    placeholder="Enter investor name"
                    placeholderTextColor={colors.lightText}
                  />
                </View>
                
                <View style={styles.inputField}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Loan Amount (Rs.) *
                  </Text>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      color: colors.text 
                    }]}
                    value={formData.loanAmount}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, loanAmount: text }))}
                    placeholder="Enter loan amount"
                    placeholderTextColor={colors.lightText}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.inputRow}>
                  <View style={styles.inputCol}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Interest Rate (%) *
                    </Text>
                    <TextInput
                      style={[styles.textInput, { 
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                        color: colors.text 
                      }]}
                      value={formData.interestRate}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, interestRate: text }))}
                      placeholder="e.g., 5"
                      placeholderTextColor={colors.lightText}
                      keyboardType="numeric"
                    />
                  </View>
                  
                  <View style={styles.inputCol}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>
                      Duration (months) *
                    </Text>
                    <TextInput
                      style={[styles.textInput, { 
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                        color: colors.text 
                      }]}
                      value={formData.duration}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, duration: text }))}
                      placeholder="e.g., 12"
                      placeholderTextColor={colors.lightText}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
                
                <View style={styles.inputField}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Notes (Optional)
                  </Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea, { 
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      color: colors.text 
                    }]}
                    value={formData.notes}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                    placeholder="Enter any additional notes"
                    placeholderTextColor={colors.lightText}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </ScrollView>
            
            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={() => setShowAddLoanModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleAddLoan}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Add Loan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.addModalContainer, { backgroundColor: colors.cardBackground }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { backgroundColor: colors.success + '10' }]}>
              <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: colors.success }]}>
                  <Ionicons name="card" size={20} color="#FFFFFF" />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Add Payment
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: colors.lightText }]}>
                    {selectedLoan?.investorName} - {formatCurrency(selectedLoan?.remainingAmount || 0)} remaining
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowPaymentModal(false)}
                style={[styles.closeButton, { backgroundColor: colors.border }]}
              >
                <Ionicons name="close" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {/* Content */}
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.inputContainer}>
                <View style={styles.inputField}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Payment Amount (Rs.) *
                  </Text>
                  <TextInput
                    style={[styles.textInput, { 
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      color: colors.text 
                    }]}
                    value={paymentFormData.amount}
                    onChangeText={(text) => setPaymentFormData(prev => ({ ...prev, amount: text }))}
                    placeholder="Enter payment amount"
                    placeholderTextColor={colors.lightText}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={styles.inputField}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Payment Method
                  </Text>
                  <View style={styles.paymentMethodContainer}>
                    {['cash', 'bank_transfer', 'cheque', 'online'].map((method) => (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.paymentMethodButton,
                          { 
                            backgroundColor: paymentFormData.paymentMethod === method 
                              ? colors.primary 
                              : colors.border 
                          }
                        ]}
                        onPress={() => setPaymentFormData(prev => ({ ...prev, paymentMethod: method }))}
                        activeOpacity={0.7}
                      >
                        <Text style={[
                          styles.paymentMethodText,
                          { 
                            color: paymentFormData.paymentMethod === method 
                              ? '#FFFFFF' 
                              : colors.text 
                          }
                        ]}>
                          {method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.inputField}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>
                    Notes (Optional)
                  </Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea, { 
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.border,
                      color: colors.text 
                    }]}
                    value={paymentFormData.notes}
                    onChangeText={(text) => setPaymentFormData(prev => ({ ...prev, notes: text }))}
                    placeholder="Enter payment notes"
                    placeholderTextColor={colors.lightText}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>
            </ScrollView>
            
            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.border }]}
                onPress={() => setShowPaymentModal(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.success }]}
                onPress={handleAddPayment}
                activeOpacity={0.7}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Add Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loanSection: {
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
  loanCard: {
    marginBottom: 16,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
    gap: 4,
  },
  loanInfo: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  loanName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  loanId: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  loanDetails: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  loanRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  loanCol: {
    flex: 1,
    marginRight: 16,
  },
  loanLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loanValue: {
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

  // Overview Styles
  overviewContainer: {
    marginBottom: 16,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  overviewToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewStats: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  overviewCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    gap: 12,
  },
  overviewIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewContent: {
    flex: 1,
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  // Revenue Overview Styles - Matching Admin Dashboard
  revenueCard: {
    marginTop: -1,
    borderRadius: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  revenueGradient: {
    padding: 24,
  },
  revenueTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  revenueStats: {
    flexDirection: 'column',
    gap: 16,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 20,
  },
  revenueItem: {
    flex: 1,
    alignItems: 'center',
  },
  revenueLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },

  // Filter Styles - Matching Admin Dashboard
  modernFilterScrollView: {
    marginTop: 24,
  },
  modernFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 0,
    paddingRight: 20, 
  },
  modernFilterPill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    flexShrink: 0, 
  },
  modernFilterText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // Skeleton Styles - Matching Admin Dashboard
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
    padding: 20,
    paddingBottom: 16,
  },
  skeletonInfo: {
    flex: 1,
  },
  skeletonLine: {
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTitle: {
    height: 20,
    width: '70%',
  },
  skeletonSubtitle: {
    height: 14,
    width: '50%',
  },
  skeletonBadge: {
    height: 24,
    width: 60,
    borderRadius: 12,
  },
  skeletonDetails: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  skeletonRow: {
    flexDirection: 'row',
    marginBottom: 16,
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

  // Additional Skeleton Styles
  skeletonRevenueTitle: {
    height: 24,
    width: '60%',
    marginBottom: 20,
  },
  skeletonRevenueLabel: {
    height: 14,
    width: '50%',
    marginBottom: 8,
  },
  skeletonRevenueValue: {
    height: 20,
    width: '70%',
  },
  skeletonFilterPill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 25,
    minHeight: 40,
    width: 80,
    marginRight: 8,
  },
  skeletonSectionTitle: {
    height: 20,
    width: '40%',
  },
  skeletonActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  addModalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
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
  modalSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    opacity: 0.8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: 400,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputField: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputCol: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
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
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Loan Details Modal Styles
  detailsSection: {
    marginBottom: 24,
  },
  detailsSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  loanInfoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  loanInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  loanInfoItem: {
    flex: 1,
    marginHorizontal: 8,
  },
  loanInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loanInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
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
  paymentHistory: {
    gap: 12,
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
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentDate: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
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
    letterSpacing: 0.2,
  },
  paymentNotes: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
    fontStyle: 'italic',
  },
  emptyPaymentHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyPaymentText: {
    fontSize: 14,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  modalStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
