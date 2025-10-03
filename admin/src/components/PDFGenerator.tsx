'use client';

import React from 'react';

interface PDFGeneratorProps {
  installment: any;
  isOpen: boolean;
  onClose: () => void;
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({ installment, isOpen, onClose }) => {
  const generatePDF = () => {
    if (!installment) return;

    // Create a hidden iframe for PDF generation
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    // Generate HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Installment Statement - ${installment.customerName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            line-height: 1.4;
            color: #000;
            background: white;
            padding: 25px 30px 30px 30px;
            max-width: 800px;
            margin: 0 auto;
          }
          
          @page {
            margin: 0;
            size: A4;
          }
          
          @media print {
            body {
              padding: 25px 30px 30px 30px !important;
              margin: 0;
            }
            
            .no-print {
              display: none;
            }
            
            /* Remove browser headers and footers */
            @page {
              margin: 0;
              size: A4;
            }
          }
          
          .header {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 20px;
            margin-top: 0;
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
          
          .statement-id {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
            font-weight: normal;
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
          
          .balance-box {
            background: linear-gradient(135deg, #e8f5e8, #f1f8e9);
            border: 2px solid #4CAF50;
            border-radius: 8px;
            padding: 18px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
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
          
          .invoice-info {
            margin-bottom: 12px;
          }
          
          .invoice-item {
            margin-bottom: 4px;
            font-size: 14px;
            color: #000;
          }
          
          .separator {
            border-top: 2px solid #000;
            margin: 25px 0;
          }
          
          .installment-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .table-header {
            background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
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
            transition: background-color 0.2s;
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
          
          .status-paid {
            color: #000;
            font-weight: bold;
          }
          
          .status-not-paid {
            color: #d32f2f;
            font-weight: bold;
          }
          
          .total-received {
            text-align: right;
            font-size: 16px;
            font-weight: bold;
            color: #000;
            margin-top: 12px;
          }
          
          .footer {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 35px;
            margin-top: 30px;
            padding-top: 15px;
          }
          
          .instructions {
            text-align: right;
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
            background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
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
        <div class="header">
          <div class="logo-section">
            <div>
              <div class="logo-text">APNA BUSINESS</div>
              <div class="logo-subtitle">INNOVATE. SUSTAIN. PROSPER.</div>
            </div>
          </div>
        </div>
        
        <div class="statement-title">
          <h1>CUSTOMER INSTALLMENT STATEMENT</h1>
        </div>
        
        <div class="customer-name">
          ${installment.customerName || 'Customer Name'}
        </div>
        
        <div class="contract-details">
          <div class="contract-info">
            <h3>Contract details</h3>
            <div class="contract-item">${installment.productName || 'Product Name'}</div>
            <div class="contract-item">${installment.installmentCount || 'N/A'}-Month-${installment.amount?.toLocaleString() || '0'}</div>
            <div class="contract-item">Advance: ${installment.advanceAmount?.toLocaleString() || '0'}</div>
          </div>
          
          <div class="invoice-info">
            <div class="invoice-item">Customer ID: ${installment.customerId || 'N/A'}</div>
            <div class="invoice-item">Purchase Date: ${installment.createdAt ? new Date(installment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</div>
            <div class="balance-box">
              <div class="balance-label">Balance :</div>
              <div class="balance-amount">${(() => {
                const totalAmount = installment.totalAmount || 0;
                const advanceAmount = installment.advanceAmount || 0;
                const paidAmount = installment.actualPaidAmount || 0;
                return (totalAmount - advanceAmount - paidAmount).toLocaleString();
              })()}</div>
            </div>
          </div>
        </div>
        
        <div class="separator"></div>
        
        <table class="installment-table">
          <thead class="table-header">
            <tr>
              <th>STATUS</th>
              <th>NO</th>
              <th>INSTALLMENT</th>
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              // Generate installment rows
              const rows = [];
              const installmentCount = installment.installmentCount || 1;
              const monthlyAmount = installment.amount || 0;
              const startDate = installment.createdAt ? new Date(installment.createdAt) : new Date();
              
              for (let i = 1; i <= installmentCount; i++) {
                const dueDate = new Date(startDate);
                dueDate.setMonth(dueDate.getMonth() + i);
                
                // Check if this specific installment is paid
                const isPaid = installment.paymentHistory && 
                  installment.paymentHistory.some((payment: any) => payment.installmentNumber === i);
                
                const status = isPaid ? 'Paid' : 'Not Paid';
                const amount = monthlyAmount.toLocaleString(); // Show amount for all installments
                
                rows.push(`
                  <tr class="table-row">
                    <td class="${isPaid ? 'status-paid' : 'status-not-paid'}">${status}</td>
                    <td>${i}</td>
                    <td>${amount}</td>
                    <td>${dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                  </tr>
                `);
              }
              return rows.join('');
            })()}
          </tbody>
        </table>
        
        <div class="total-received">
          ${(() => {
            const paidAmount = installment.actualPaidAmount || 0;
            return paidAmount.toLocaleString() + ' Received';
          })()}
        </div>
        
        <div class="footer">
          <div class="thank-you-section">
            <div class="thank-you-graphic">
              <div class="thank-you-text">THANKYOU</div>
              <div class="thank-you-urdu">شکریہ</div>
            </div>
          </div>
          
          <div class="instructions">
            <div class="instructions-title">ESSENTIAL INSTRUCTION</div>
            <div class="instructions-text">
              یہ رسید آپ کے قرض انسٹالمنٹ کی مکمل تفصیلات بشمول رقم لینے اور دین کی تاریخوں کے ساتھ فراہم کرتی ہے۔ براہ کرم ادائیگی مقررہ وقت پر ہر ماہ کی 10 تاریخ تک یقینی بنائیں
            </div>
          </div>
        </div>
        
        <script>
          // Auto-print when page loads
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 100);
          };
        </script>
      </body>
      </html>
    `;

    // Write content to iframe
    iframe.contentDocument?.write(htmlContent);
    iframe.contentDocument?.close();

    // Clean up iframe after printing
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  };

  if (!isOpen || !installment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 translate-y-0">
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-2xl bg-blue-50 flex-shrink-0">
          <div className="relative p-6">
            <div className="flex justify-between items-center">
              <div className="flex-1 text-center">
                <h2 className="text-xl font-bold text-gray-800">Generate PDF</h2>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 p-2 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Customer Statement</h3>
            <p className="text-sm text-gray-500 mb-6">
              Create a professional installment statement for <strong>{installment.customerName}</strong>.
              Includes payment schedule, balance details, and terms.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={generatePDF}
              className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-full font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFGenerator;
