import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

// Types for different PDF generation functions
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

interface Investor {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  type?: string;
  investmentAmount?: number;
  monthlyProfit?: number;
  profitHistory?: Array<{
    month: string;
    profit: number;
    createdAt: string;
  }>;
  createdAt: string;
}

interface Installment {
  _id: string;
  customerName: string;
  customerId: string;
  customerPhone?: string;
  customerAddress?: string;
  productName?: string;
  installmentCount: number;
  amount: number;
  advanceAmount: number;
  totalAmount: number;
  totalPaidInstallments: number;
  createdAt: string;
  installments?: Array<{
    installmentNumber: number;
    amount: number;
    actualPaidAmount?: number;
    dueDate: string;
    paidDate?: string;
    status: string;
    paymentMethod: string;
    notes?: string;
    paidBy?: string;
  }>;
}

interface PDFGeneratorProps {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

export default class PDFGenerator {
  private showSuccess: (message: string) => void;
  private showError: (message: string) => void;
  private showInfo: (message: string) => void;

  constructor({ showSuccess, showError, showInfo }: PDFGeneratorProps) {
    this.showSuccess = showSuccess;
    this.showError = showError;
    this.showInfo = showInfo;
  }

  private formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString()}`;
  
  private formatDate = (date?: string) => {
    if (date) {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    return 'N/A';
  };

  async generateLoanPDF(loan: Loan) {
    try {
      this.showInfo('Generating PDF...');

      const generateHTML = () => {
        // Generate payment history rows
        const paymentRows = loan.paymentHistory && loan.paymentHistory.length > 0 
          ? loan.paymentHistory.map((payment: any, index: number) => {
              const paymentDate = new Date(payment.paymentDate);
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${paymentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>${this.formatCurrency(loan.monthlyPayment)}</td>
                  <td>${this.formatCurrency(payment.amount)}</td>
                  <td><span class="status-paid">Paid</span></td>
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
            <tr>
              <td>${paymentNumber}</td>
              <td>${dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
              <td>${this.formatCurrency(loan.monthlyPayment)}</td>
              <td>Rs. 0</td>
              <td><span class="status-pending">Pending</span></td>
            </tr>
          `;
        }).join('');

        return `
          <!doctype html>
          <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <title>Loan Statement - Customer</title>
            <style>
              *{box-sizing:border-box;margin:0;padding:0}
              body{font-family:"Segoe UI",Roboto,Arial,sans-serif;background:#f4f6f8;color:#0f1724;padding:0}

              .statement{max-width:900px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,36,0.08)}

              .header{display:flex;align-items:center;justify-content:space-between;padding:20px 28px;background:linear-gradient(90deg,#0f1724 0%,#1f2937 100%);color:#fff}
              .brand{display:flex;gap:16px;align-items:center}
              .company{line-height:1.3}
              .company h1{font-size:20px;margin-bottom:4px}
              .company p{font-size:12px;opacity:0.9}

              .meta{text-align:right}
              .meta .title{font-weight:700;font-size:16px}
              .meta .sub{font-size:12px;opacity:0.9}

              .body{padding:22px 28px}
              .section{display:flex;justify-content:space-between;margin-bottom:18px;gap:16px;flex-wrap:nowrap}
              .card{background:#fbfbff;padding:14px;border-radius:8px;flex:1;min-width:200px;border:1px solid rgba(15,23,36,0.04)}

              .card h3{font-size:14px;margin-bottom:8px;color:#101828}
              .card p{font-size:13px;line-height:1.6}

              table{width:100%;border-collapse:collapse;margin-top:8px}
              th,td{padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:center;font-size:13px}
              th{background:#f8fafc;color:#0f1724;font-weight:700}
              tr.total-row td{font-weight:800;background:#fdf6e5}

              .status-paid{color:#0f5132;background:rgba(16,81,50,0.08);padding:6px 10px;border-radius:999px;display:inline-block}
              .status-due{color:#dc2626;background:rgba(220,38,38,0.08);padding:6px 10px;border-radius:999px;display:inline-block}
              .status-overdue{color:#dc2626;background:rgba(220,38,38,0.12);padding:6px 10px;border-radius:999px;display:inline-block;font-weight:bold}
              .status-pending{color:#6b7280;background:rgba(107,114,128,0.08);padding:6px 10px;border-radius:999px;display:inline-block}

              .footer{padding:18px 28px;background:#ffffff;border-top:1px dashed rgba(15,23,36,0.06);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap}
              .notes{font-size:12px;color:#475569;max-width:70%}

              @media print{
                body{background:#fff}
                .statement{box-shadow:none;border-radius:0}
                .header{page-break-after:avoid}
                @page:first{margin-top:0}
                @page{margin-top:16px}
                .section{page-break-inside:avoid}
                .installment-schedule{page-break-inside:avoid}
                .payment-history{page-break-inside:avoid}
              }

              @media (max-width:700px){
                .header{flex-direction:column;align-items:flex-start;gap:12px}
                .section{flex-direction:column}
                .meta{text-align:left}
                .notes{max-width:100%;margin-top:10px}
              }
            </style>
          </head>
          <body>
            <div class="statement">
              <div class="header">
                <div class="brand">
                  <div class="company">
                    <h1>Apna Business 12</h1>
                  </div>
                </div>
                <div class="meta">
                  <div class="title">Loan Statement</div>
                  <div class="sub">Statement No: <strong>#LN-${loan.loanId}</strong></div>
                  <div class="sub">Issue Date: <strong>${this.formatDate(new Date().toISOString())}</strong></div>
              </div>
              </div>

              <div class="body">
                <div class="section">
                  <div class="card">
                    <h3>Borrower Details</h3>
                    <p><strong>Name:</strong> ${loan.investorName || 'Borrower Name'}<br>
                       <strong>Loan ID:</strong> ${loan.loanId || 'N/A'}<br>
                       <strong>Start Date:</strong> ${this.formatDate(loan.startDate)}<br>
                       <strong>End Date:</strong> ${this.formatDate(loan.endDate)}
                    </p>
              </div>

                  <div class="card">
                    <h3>Loan Summary</h3>
                    <p><strong>Duration:</strong> ${loan.duration} Months<br>
                       <strong>Interest Rate:</strong> ${loan.interestRate}%<br>
                       <strong>Monthly Payment:</strong> ${this.formatCurrency(loan.monthlyPayment)}<br>
                       <strong>Total Amount:</strong> ${this.formatCurrency(loan.totalAmount)}
                    </p>
                </div>

                  <div class="card">
                    <h3>Balance Overview</h3>
                    <p><strong>Loan Amount:</strong> ${this.formatCurrency(loan.loanAmount)}<br>
                       <strong>Paid to Date:</strong> ${this.formatCurrency(loan.paidAmount)}<br>
                       <strong>Remaining Balance:</strong> ${this.formatCurrency(loan.remainingAmount)}
                    </p>
                </div>
              </div>

                <div class="installment-schedule">
                  <h3 style="margin-bottom:8px;text-align:left">Payment Schedule</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Payment No.</th>
                        <th>Due Date</th>
                        <th>Payment Amount (PKR)</th>
                        <th>Paid</th>
                        <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${paymentRows}
                  ${remainingRows}
                      <tr class="total-row">
                        <td colspan="2">Totals</td>
                        <td>${this.formatCurrency(loan.totalAmount)}</td>
                        <td>${this.formatCurrency(loan.paidAmount)}</td>
                        <td></td>
                      </tr>
                </tbody>
              </table>
                </div>

                ${loan.paymentHistory && loan.paymentHistory.length > 0 ? `
                <div class="payment-history" style="margin-top:18px">
                  <h3 style="margin-bottom:8px;text-align:left">Payment History</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reference / Transaction</th>
                        <th>Amount (PKR)</th>
                        <th>Payment Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${loan.paymentHistory.map((payment: any, index: number) => {
                        const paymentDate = new Date(payment.paymentDate);
                        return `
                          <tr>
                            <td>${paymentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td>TXN-${String(index + 1).padStart(4, '0')}</td>
                            <td>${this.formatCurrency(payment.amount)}</td>
                            <td>${payment.paymentMethod || 'Cash'}</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
                ` : ''}
              </div>

              <div class="footer">
                <div class="notes">
                  <strong>Note:</strong> The team will verify the payments. This statement is for the borrower's record only. In case of any discrepancy, please contact within 7 business days.
                  </div>
                <div style="text-align:right">
                  <div style="font-weight:800">Authorized Signatory</div>
                  <div style="font-size:12px;opacity:0.8">Apna Business 12</div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
      };

      const html = generateHTML();
      const fileName = `${loan.investorName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Investor'}.pdf`;
      
      const { uri } = await Print.printToFileAsync({
        html: html,
        base64: false,
      });
      
      // Rename the file to have a proper name
      const newUri = uri.replace(/[^/]*\.pdf$/, fileName);
      await FileSystem.moveAsync({
        from: uri,
        to: newUri
      });
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Loan Statement'
        });
        this.showSuccess('PDF generated and ready to share!');
      } else {
        this.showError('Sharing not available on this device');
      }
      
    } catch (error) {
      console.log('PDF generation error:', error);
      this.showError('Failed to generate PDF. Please try again.');
    }
  }

  async generateInvestorPDF(investor: Investor) {
    try {
      this.showInfo('Generating PDF...');

      const generateHTML = () => {
        return `
          <!doctype html>
          <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <title>Investor Statement - Monthly Profit</title>
            <style>
              *{box-sizing:border-box;margin:0;padding:0}
              body{font-family:"Segoe UI",Roboto,Arial,sans-serif;background:#f4f6f8;color:#0f1724;padding:0}

              .statement{max-width:900px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,36,0.08)}

              .header{display:flex;align-items:center;justify-content:space-between;padding:20px 28px;background:linear-gradient(90deg,#0f1724 0%,#1f2937 100%);color:#fff}
              .company h1{font-size:20px;margin-bottom:4px}
              .company p{font-size:12px;opacity:0.9}

              .meta{text-align:right}
              .meta .title{font-weight:700;font-size:16px}
              .meta .sub{font-size:12px;opacity:0.9}

              .body{padding:22px 28px}
              .section{display:flex;justify-content:space-between;margin-bottom:18px;gap:16px;flex-wrap:nowrap}
              .card{background:#fbfbff;padding:14px;border-radius:8px;flex:1;min-width:200px;border:1px solid rgba(15,23,36,0.04)}

              .card h3{font-size:14px;margin-bottom:8px;color:#101828}
              .card p{font-size:13px;line-height:1.6}

              table{width:100%;border-collapse:collapse;margin-top:8px}
              th,td{padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:center;font-size:13px}
              th{background:#f8fafc;color:#0f1724;font-weight:700}
              tr.total-row td{font-weight:800;background:#fdf6e5}

              .status-paid{color:#0f5132;background:rgba(16,81,50,0.08);padding:6px 10px;border-radius:999px;display:inline-block}
              .status-pending{color:#663b00;background:rgba(102,59,0,0.06);padding:6px 10px;border-radius:999px;display:inline-block}

              .footer{padding:18px 28px;background:#ffffff;border-top:1px dashed rgba(15,23,36,0.06);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap}
              .notes{font-size:12px;color:#475569;max-width:70%}

              @media print{
                body{background:#fff}
                .statement{box-shadow:none;border-radius:0}
                .header{page-break-after:avoid}
                @page:first{margin-top:0}
                @page{margin-top:16px}
                .section{page-break-inside:avoid}
              }

              @media (max-width:700px){
                .header{flex-direction:column;align-items:flex-start;gap:12px}
                .section{flex-direction:column}
                .meta{text-align:left}
                .notes{max-width:100%;margin-top:10px}
              }
            </style>
          </head>
          <body>
            <div class="statement">
              <div class="header">
                <div class="company">
                  <h1>Apna Business 12</h1>
                </div>
                <div class="meta">
                  <div class="title">Investor Profit Statement</div>
                  <div class="sub">Issue Date: <strong>${this.formatDate(new Date().toISOString())}</strong></div>
                </div>
              </div>

              <div class="body">
                <div class="section">
                  <div class="card">
                    <h3>Investor Details</h3>
                    <p><strong>Name:</strong> ${investor.name || 'Investor Name'}<br>
                       <strong>Email:</strong> ${investor.email || 'N/A'}<br>
                       <strong>Phone:</strong> ${investor.phone || 'N/A'}<br>
                       <strong>Type:</strong> ${investor.type || 'Investor'}
                    </p>
                  </div>

                  <div class="card">
                    <h3>Investment Summary</h3>
                    <p><strong>Investment Start Date:</strong> ${this.formatDate(investor.createdAt)}<br>
                       <strong>Profit Distribution:</strong> Monthly Closing
                    </p>
                  </div>

                  <div class="card">
                    <h3>Financial Overview</h3>
                    <p><strong>Invested Amount:</strong> ${this.formatCurrency(investor.investmentAmount || 0)}<br>
                       <strong>Total Profit Earned:</strong> ${this.formatCurrency(investor.monthlyProfit || 0)}<br>
                       <strong>Status:</strong> Active Investment
                    </p>
                  </div>
                </div>

                <div>
                  <h3 style="margin-bottom:8px;text-align:left">Monthly Profit Record</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Closing Date</th>
                        <th>Profit (PKR)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${investor.profitHistory && investor.profitHistory.length > 0 
                        ? investor.profitHistory.map((profitRecord: any) => {
                            const monthDate = new Date(profitRecord.month + '-01');
                            const monthName = monthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                            const closingDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
                            return `
                              <tr>
                                <td>${monthName}</td>
                                <td>${this.formatDate(closingDate.toISOString())}</td>
                                <td>${this.formatCurrency(profitRecord.profit)}</td>
                                <td><span class="status-paid">Paid</span></td>
                              </tr>
                            `;
                          }).join('')
                        : `
                          <tr>
                            <td>${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</td>
                            <td>${this.formatDate(new Date().toISOString())}</td>
                            <td>${this.formatCurrency(investor.monthlyProfit || 0)}</td>
                            <td><span class="status-paid">Paid</span></td>
                          </tr>
                        `
                      }
                      <tr class="total-row">
                        <td colspan="2">Total Profit</td>
                        <td>${this.formatCurrency(investor.profitHistory ? investor.profitHistory.reduce((sum: number, p: any) => sum + p.profit, 0) : (investor.monthlyProfit || 0))}</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div class="footer">
                <div class="notes">
                  <strong>Note:</strong> Monthly profit is calculated at closing and transferred to the investor's registered account. Contact Apna Business 12 for clarifications within 7 business days.
                </div>
                <div style="text-align:right">
                  <div style="font-weight:800">Authorized Signatory</div>
                  <div style="font-size:12px;opacity:0.8">Apna Business 12</div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
      };

      const html = generateHTML();
      const fileName = `${investor.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Investor'}.pdf`;
      
      const { uri } = await Print.printToFileAsync({
        html: html,
        base64: false,
      });
      
      // Rename the file to have a proper name
      const newUri = uri.replace(/[^/]*\.pdf$/, fileName);
      await FileSystem.moveAsync({
        from: uri,
        to: newUri
      });
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Investor Statement'
        });
        this.showSuccess('PDF generated and ready to share!');
      } else {
        this.showError('Sharing not available on this device');
      }
      
    } catch (error) {
      console.log('PDF generation error:', error);
      this.showError('Failed to generate PDF. Please try again.');
    }
  }

  async generateInstallmentPDF(installment: Installment) {
    try {
      this.showInfo('Generating PDF...');

      const calculateTotals = () => {
        const totalAmount = installment.totalAmount || 0;
        const advanceAmount = installment.advanceAmount || 0;
        const paidInstallments = installment.totalPaidInstallments || 0;
        const monthlyAmount = installment.amount || 0;
        const paidFromInstallments = paidInstallments * monthlyAmount;
        const totalPaidAmount = advanceAmount + paidFromInstallments;
        const remaining = totalAmount - totalPaidAmount;
        return { totalAmount, advanceAmount, paidAmount: totalPaidAmount, remaining };
      };

      const totals = calculateTotals();

      const generateHTML = () => {
        // Generate installment schedule rows
        const installmentRows = Array.from({ length: installment.installmentCount || 1 }, (_, idx) => {
          const i = idx + 1;
          const start = installment.createdAt ? new Date(installment.createdAt) : new Date();
          const due = new Date(start);
          due.setMonth(due.getMonth() + i);
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Reset time to start of day
          due.setHours(0, 0, 0, 0); // Reset time to start of day

          // Check if this specific installment is paid
          let isPaid = false;
          let paymentMethod = 'cash';
          let paidDate = '';
          
          // Check if there's an installment record for this number
          if (Array.isArray(installment.installments)) {
            const installmentRecord = installment.installments.find((inst: any) => inst.installmentNumber === i);
            if (installmentRecord) {
              isPaid = installmentRecord.status === 'paid';
              paymentMethod = installmentRecord.paymentMethod || 'cash';
              paidDate = installmentRecord.paidDate || '';
            }
          }
          
          // Fallback: check if this installment number is less than or equal to total paid installments
          if (!isPaid && installment.totalPaidInstallments && i <= installment.totalPaidInstallments) {
            isPaid = true;
          }

          // Determine status based on payment and due date
          let status = '';
          let statusClass = '';
          
          if (isPaid) {
            status = 'Paid';
            statusClass = 'status-paid';
          } else if (due < today) {
            status = 'Overdue';
            statusClass = 'status-overdue';
          } else if (due.getTime() === today.getTime()) {
            status = 'Due Today';
            statusClass = 'status-due';
          } else {
            status = 'Pending';
            statusClass = 'status-pending';
          }

          const paidAmount = isPaid ? installment.amount : 0;
          const remainingAmount = installment.amount - paidAmount;

          return `
            <tr>
              <td>${i}</td>
              <td>${due.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
              <td>${this.formatCurrency(installment.amount)}</td>
              <td>${this.formatCurrency(paidAmount)}</td>
              <td>${this.formatCurrency(remainingAmount)}</td>
              <td><span class="${statusClass}">${status}</span></td>
            </tr>
          `;
        }).join('');

        // Generate payment history rows from paid installments
        const paymentHistoryRows = installment.installments && installment.installments.length > 0 
          ? installment.installments
              .filter((inst: any) => inst.status === 'paid' && inst.paidDate)
              .map((payment: any, index: number) => {
                const paymentDate = new Date(payment.paidDate);
        return `
                  <tr>
                    <td>${paymentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>TXN-${String(payment.installmentNumber).padStart(4, '0')}</td>
                    <td>${this.formatCurrency(payment.actualPaidAmount || payment.amount)}</td>
                    <td>${payment.paymentMethod || 'Cash'}</td>
                  </tr>
                `;
              }).join('')
          : '';

        return `
          <!doctype html>
          <html lang="en">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width,initial-scale=1" />
            <title>Installment Statement - Customer</title>
            <style>
              *{box-sizing:border-box;margin:0;padding:0}
              body{font-family:"Segoe UI",Roboto,Arial,sans-serif;background:#f4f6f8;color:#0f1724;padding:0}

              .statement{max-width:900px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,36,0.08)}

              .header{display:flex;align-items:center;justify-content:space-between;padding:20px 28px;background:linear-gradient(90deg,#0f1724 0%,#1f2937 100%);color:#fff}
              .brand{display:flex;gap:16px;align-items:center}
              .company{line-height:1.3}
              .company h1{font-size:20px;margin-bottom:4px}
              .company p{font-size:12px;opacity:0.9}

              .meta{text-align:right}
              .meta .title{font-weight:700;font-size:16px}
              .meta .sub{font-size:12px;opacity:0.9}

              .body{padding:22px 28px}
              .section{display:flex;justify-content:space-between;margin-bottom:18px;gap:16px;flex-wrap:nowrap}
              .card{background:#fbfbff;padding:14px;border-radius:8px;flex:1;min-width:200px;border:1px solid rgba(15,23,36,0.04)}

              .card h3{font-size:14px;margin-bottom:8px;color:#101828}
              .card p{font-size:13px;line-height:1.6}

              table{width:100%;border-collapse:collapse;margin-top:8px}
              th,td{padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:center;font-size:13px}
              th{background:#f8fafc;color:#0f1724;font-weight:700}
              tr.total-row td{font-weight:800;background:#fdf6e5}

              .status-paid{color:#0f5132;background:rgba(16,81,50,0.08);padding:6px 10px;border-radius:999px;display:inline-block}
              .status-due{color:#dc2626;background:rgba(220,38,38,0.08);padding:6px 10px;border-radius:999px;display:inline-block}
              .status-overdue{color:#dc2626;background:rgba(220,38,38,0.12);padding:6px 10px;border-radius:999px;display:inline-block;font-weight:bold}
              .status-pending{color:#6b7280;background:rgba(107,114,128,0.08);padding:6px 10px;border-radius:999px;display:inline-block}

              .footer{padding:18px 28px;background:#ffffff;border-top:1px dashed rgba(15,23,36,0.06);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap}
              .notes{font-size:12px;color:#475569;max-width:70%}

              @media print{
                body{background:#fff}
                .statement{box-shadow:none;border-radius:0}
                .header{page-break-after:avoid}
                @page:first{margin-top:0}
                @page{margin-top:16px}
                .section{page-break-inside:avoid}
                .installment-schedule{page-break-inside:avoid}
                .payment-history{page-break-inside:avoid}
              }

              @media (max-width:700px){
                .header{flex-direction:column;align-items:flex-start;gap:12px}
                .section{flex-direction:column}
                .meta{text-align:left}
                .notes{max-width:100%;margin-top:10px}
              }
            </style>
          </head>
          <body>
            <div class="statement">
              <div class="header">
                <div class="brand">
                  <div class="company">
                    <h1>Apna Business 12</h1>
                  </div>
                </div>
                <div class="meta">
                  <div class="title">Installment Statement</div>
                  <div class="sub">Statement No: <strong>#ST-${installment.customerId || 'N/A'}</strong></div>
                  <div class="sub">Issue Date: <strong>${this.formatDate(new Date().toISOString())}</strong></div>
              </div>
              </div>

              <div class="body">
                <div class="section">
                  <div class="card">
                    <h3>Customer Details</h3>
                    <p><strong>Name:</strong> ${installment.customerName || 'Customer Name'}<br>
                       <strong>Customer ID:</strong> ${installment.customerId || 'N/A'}${installment.customerPhone ? `<br><strong>Phone:</strong> ${installment.customerPhone}` : ''}${installment.customerAddress ? `<br><strong>Address:</strong> ${installment.customerAddress}` : ''}
                    </p>
              </div>

                  <div class="card">
                    <h3>Account Summary</h3>
                    <p><strong>Product:</strong> ${installment.productName || 'Product Name'}<br>
                       <strong>Agreement Date:</strong> ${this.formatDate(installment.createdAt)}<br>
                       <strong>Term:</strong> ${installment.installmentCount || 'N/A'} Months
                    </p>
                </div>

                  <div class="card">
                    <h3>Balance Overview</h3>
                    <p><strong>Total Price:</strong> ${this.formatCurrency(totals.totalAmount)}<br>
                       <strong>Paid to Date:</strong> ${this.formatCurrency(totals.paidAmount)}<br>
                       <strong>Remaining Balance:</strong> ${this.formatCurrency(totals.remaining)}
                    </p>
                </div>
              </div>

                <div class="installment-schedule">
                  <h3 style="margin-bottom:8px;text-align:left">Installment Schedule</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Installment No.</th>
                        <th>Due Date</th>
                        <th>Installment Amount (PKR)</th>
                        <th>Paid</th>
                        <th>Remaining</th>
                        <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${installmentRows}
                      <tr class="total-row">
                        <td colspan="2">Totals</td>
                        <td>${this.formatCurrency(totals.totalAmount)}</td>
                        <td>${this.formatCurrency(totals.paidAmount)}</td>
                        <td>${this.formatCurrency(totals.remaining)}</td>
                        <td></td>
                      </tr>
                </tbody>
              </table>
                </div>

                ${paymentHistoryRows ? `
                <div class="payment-history" style="margin-top:18px">
                  <h3 style="margin-bottom:8px;text-align:left">Payment History</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Reference / Transaction</th>
                        <th>Amount (PKR)</th>
                        <th>Payment Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${paymentHistoryRows}
                    </tbody>
                  </table>
                </div>
                ` : ''}
              </div>

              <div class="footer">
                <div class="notes">
                  <strong>Note:</strong> The team will verify the payments. This statement is for the customer's record only. In case of any discrepancy, please contact within 7 business days.
                  </div>
                <div style="text-align:right">
                  <div style="font-weight:800">Authorized Signatory</div>
                  <div style="font-size:12px;opacity:0.8">Apna Business 12</div>
                </div>
              </div>
            </div>
          </body>
          </html>
        `;
      };

      const html = generateHTML();
      const fileName = `${installment.customerName?.replace(/[^a-zA-Z0-9]/g, '_') || 'Customer'}.pdf`;
      
      const { uri } = await Print.printToFileAsync({
        html: html,
        base64: false,
      });
      
      // Rename the file to have a proper name
      const newUri = uri.replace(/[^/]*\.pdf$/, fileName);
      await FileSystem.moveAsync({
        from: uri,
        to: newUri
      });
      
      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Installment Statement'
        });
        this.showSuccess('PDF generated and ready to share!');
      } else {
        this.showError('Sharing not available on this device');
      }
      
    } catch (error) {
      console.log('PDF generation error:', error);
      this.showError('Failed to generate PDF. Please try again.');
    }
  }
}
