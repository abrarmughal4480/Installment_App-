'use client';

import React, { useMemo, useRef, useState } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

type Installment = {
  customerName?: string;
  customerId?: string;
  productName?: string;
  totalAmount?: number;
  advanceAmount?: number;
  actualPaidAmount?: number;
  installmentNumber?: number;
  installmentCount?: number;
  amount?: number;
  dueDate?: string;
  status?: string;
  paymentMethod?: string;
  paidDate?: string;
  customerEmail?: string;
  customerPhone?: string;
  createdAt?: string;
  paymentHistory?: { installmentNumber: number; amount?: number; date?: string }[];
};

interface PDFGeneratorProps {
  installment: Installment;
  isOpen: boolean;
  onClose: () => void;
}

const S = (v?: string, def = 'N/A') => (v && String(v).trim() ? String(v) : def);
const money = (n?: number, def = '0') =>
  typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString() : def;
const dateStr = (d?: string, def = 'N/A') =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : def;

const PDFGenerator: React.FC<PDFGeneratorProps> = ({ installment, isOpen, onClose }) => {
  const [busy, setBusy] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const totals = useMemo(() => {
    if (!installment) return { totalAmount: 0, advanceAmount: 0, paidAmount: 0, remaining: 0 };
    
    const totalAmount = installment.totalAmount || 0;
    const advanceAmount = installment.advanceAmount || 0;
    const paidAmount = installment.actualPaidAmount || 0;
    const remaining = totalAmount - advanceAmount - paidAmount;
    return { totalAmount, advanceAmount, paidAmount, remaining };
  }, [installment]);

  const generatePDF = async () => {
    if (!contentRef.current || busy) return;
    try {
      setBusy(true);

      // A4: 595.28 x 841.89 pt (72dpi). We'll render canvas at higher scale for crisp text.
      const a4w = 595.28;
      const a4h = 841.89;
      const margin = 24; // pt
      const target = contentRef.current;

      // Show overlay to indicate PDF generation is processing
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: white;
        font-family: Arial, sans-serif;
        flex-direction: column;
        gap: 10px;
      `;
      overlay.innerHTML = `
        <div style="font-size: 18px; font-weight: bold;">Generating PDF...</div>
      `;
      
      // Add overlay to the PDF container
      if (target.parentElement) {
        target.parentElement.style.position = 'relative';
        target.parentElement.appendChild(overlay);
      }

      // Temporarily make the content fully visible for PDF generation
      const originalStyles = {
        maxHeight: target.style.maxHeight,
        overflowY: target.style.overflowY,
        overflowX: target.style.overflowX,
        height: target.style.height,
        width: target.style.width,
        minWidth: target.style.minWidth
      };
      
      // Remove height and width restrictions temporarily
      target.style.maxHeight = 'none';
      target.style.overflowY = 'visible';
      target.style.overflowX = 'visible';
      target.style.height = 'auto';
      target.style.width = '794px'; // Full A4 width
      target.style.minWidth = '794px';

      // Render DOM to canvas with error handling
      let canvas;
      try {
        canvas = await Promise.race([
          html2canvas(target, {
            scale: 2, // sharper
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            windowWidth: target.scrollWidth,
            windowHeight: target.scrollHeight,
            allowTaint: false,
            onclone: (clonedDoc) => {
              // Override all CSS properties that might cause issues
              const overrideStyle = clonedDoc.createElement('style');
              overrideStyle.textContent = `
                * {
                  color-scheme: light !important;
                  forced-color-adjust: none !important;
                  color: #000000 !important;
                  background-color: #ffffff !important;
                }
                body, html {
                  color-scheme: light !important;
                  forced-color-adjust: none !important;
                }
                .pdf-container {
                  max-height: none !important;
                  overflow: visible !important;
                  height: auto !important;
                }
              `;
              clonedDoc.head.appendChild(overrideStyle);
              
              // Remove max-height constraints from cloned elements
              const clonedContainer = clonedDoc.querySelector('.sheet') as HTMLElement;
              if (clonedContainer) {
                clonedContainer.style.maxHeight = 'none';
                clonedContainer.style.height = 'auto';
              }
            }
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('HTML2Canvas timeout')), 15000)
          )
        ]);
      } catch (error) {
        console.error('HTML2Canvas failed:', error);
        alert('PDF generation failed. Please try again.');
        return;
      } finally {
        // Remove overlay
        if (target.parentElement && target.parentElement.querySelector('div[style*="background: rgba(0, 0, 0, 0.7)"]')) {
          target.parentElement.removeChild(overlay);
        }
        
        // Restore original styles
        target.style.maxHeight = originalStyles.maxHeight;
        target.style.overflowY = originalStyles.overflowY;
        target.style.overflowX = originalStyles.overflowX;
        target.style.height = originalStyles.height;
        target.style.width = originalStyles.width;
        target.style.minWidth = originalStyles.minWidth;
      }

      const imgData = (canvas as HTMLCanvasElement).toDataURL('image/png');
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });

      // Compute image sizing to fit A4 width (minus margins), keep aspect ratio
      const imgW = a4w - margin * 2;
      const imgH = ((canvas as HTMLCanvasElement).height * imgW) / (canvas as HTMLCanvasElement).width;

      // If content taller than one page, add pages and slice image vertically
      let remainingH = imgH;
      let positionY = margin;

      // draw first page
      pdf.addImage(imgData, 'PNG', margin, positionY, imgW, imgH);
      remainingH -= a4h - margin * 2;

      // add extra pages by shifting the image vertically
      while (remainingH > 0) {
        pdf.addPage();
        positionY = margin - (imgH - remainingH); // shift up
        pdf.addImage(imgData, 'PNG', margin, positionY, imgW, imgH);
        remainingH -= a4h - margin * 2;
      }

      const safeName = `Installment_${S(installment.customerName, 'Customer')}_${S(
        installment.customerId,
        'ID',
      )}`.replace(/[^\w.-]+/g, '_');

      // Generate PDF blob for sharing
      const pdfBlob = pdf.output('blob');
      
      // Get customer phone number
      const customerPhone = installment.customerPhone?.replace(/[^0-9]/g, '') || '';
      
      // Create WhatsApp message
      const message = `Hello ${S(installment.customerName, 'Customer')},\n\nYour installment statement is ready.\n\nPlease find the attached PDF file.\n\nThank you!`;
      
      // Check if Web Share API is supported
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], `${safeName}.pdf`, { type: 'application/pdf' })] })) {
        try {
          await navigator.share({
            files: [new File([pdfBlob], `${safeName}.pdf`, { type: 'application/pdf' })],
            text: message,
            title: `Installment Statement - ${S(installment.customerName, 'Customer')}`
          });
          return; // Success, exit function
        } catch (error) {
          console.log('Web Share API failed:', error);
        }
      }
      
      // Fallback: Open WhatsApp with message and download PDF
      if (customerPhone) {
        // Open WhatsApp with the customer's number
        const whatsappUrl = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        
        // Also download the PDF for manual attachment
        setTimeout(() => {
          pdf.save(`${safeName}.pdf`);
        }, 500);
        
      } else {
        // No phone number - just download the file
        alert('No customer phone number available. Downloading PDF instead.');
        pdf.save(`${safeName}.pdf`);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen || !installment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-white rounded-lg sm:rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 translate-y-0">
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-lg sm:rounded-t-2xl bg-blue-50 flex-shrink-0">
          <div className="relative p-3 sm:p-6">
            <div className="flex justify-between items-center">
              <div className="flex-1 text-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Generate PDF</h2>
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

        {/* Content + Rendered PDF layout */}
        <div className="p-3 sm:p-6 overflow-y-auto overflow-x-auto flex-1">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Customer Statement</h3>
            <p className="text-sm text-gray-500">
              Create a professional installment statement for <strong>{S(installment.customerName, 'Customer')}</strong>.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={generatePDF}
              disabled={busy}
              className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-full font-medium transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {busy ? 'Generating…' : 'Generate PDF'}
            </button>
          </div>

          {/* ======= PDF LAYOUT (EXACTLY WHAT GETS PRINTED) ======= */}
          <div ref={contentRef} style={{
            maxHeight: '24rem',
            overflowY: 'auto',
            overflowX: 'auto', // Add horizontal scrolling
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            // Override any Tailwind CSS that might conflict
            colorScheme: 'light',
            forcedColorAdjust: 'none',
            // Mobile responsive
            width: '100%',
            minWidth: '320px'
          }}>
            <style>{`
              * { 
                box-sizing: border-box;
                color-scheme: light !important;
                forced-color-adjust: none !important;
              }
              .sheet {
                font-family: Arial, sans-serif;
                color: #000;
                background: #fff;
                width: 794px;       /* approx A4 @ 96dpi */
                min-width: 794px;   /* Prevent shrinking */
                padding: 25px 30px 30px 30px;
                margin: 0 auto;
              }
              /* Mobile responsive adjustments */
              @media (max-width: 768px) {
                .sheet {
                  width: 100% !important;
                  min-width: 100% !important;
                  max-width: 100% !important;
                  padding: 10px 15px 15px 15px;
                  font-size: 14px;
                }
                .customer-name { font-size: 24px !important; }
                .statement-title h1 { font-size: 20px !important; }
                .contract-details { 
                  display: block !important;
                  gap: 15px !important; 
                  padding: 15px !important; 
                }
                .contract-info h3 { font-size: 14px !important; margin-bottom: 10px !important; }
                .table-header th { 
                  font-size: 11px !important; 
                  padding: 8px 4px !important; 
                }
                .table-row td { 
                  font-size: 11px !important; 
                  padding: 8px 4px !important; 
                }
                .invoice-info { margin-bottom: 10px !important; }
                .logo-text { font-size: 18px !important; }
                .logo-subtitle { font-size: 10px !important; }
              }
              .header {
                display: flex;
                justify-content: center;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 3px solid #000;
              }
              .logo-section { display: flex; align-items: center; gap: 15px; }
              .logo-text { font-size: 22px; font-weight: bold; color: #000; line-height: 1.2; letter-spacing: 1px; }
              .logo-subtitle { font-size: 11px; color: #666; margin-top: 3px; letter-spacing: 0.5px; }
              .statement-title { text-align: center; margin: 25px 0; }
              .statement-title h1 { font-size: 28px; font-weight: bold; color: #000; margin-bottom: 8px; letter-spacing: 1px; }
              .customer-name { font-size: 32px; font-weight: 900; color: #000; text-align: center; margin-bottom: 25px; letter-spacing: 0.5px; }
              .contract-details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; padding: 20px; background: #fafafa; border-radius: 8px; border: 1px solid #e0e0e0; }
              .contract-info h3 { font-size: 16px; font-weight: bold; color: #000; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
              .contract-item { margin-bottom: 6px; font-size: 14px; color: #000; }
              .invoice-info { margin-bottom: 12px; }
              .invoice-item { margin-bottom: 4px; font-size: 14px; color: #000; }
              .balance-box { background: #e8f5e8; border: 2px solid #4CAF50; border-radius: 8px; padding: 18px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 10px;}
              .balance-label { font-size: 14px; font-weight: bold; color: #000; margin-bottom: 4px; }
              .balance-amount { font-size: 22px; font-weight: 900; color: #000; }
              .separator { border-top: 2px solid #000; margin: 25px 0; }
              table.installment-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .table-header { background: #f5f5f5; border-bottom: 2px solid #000; }
              .table-header th { padding: 14px 10px; font-size: 14px; font-weight: bold; color: #000; text-align: left; border-right: 1px solid #ddd; text-transform: uppercase; letter-spacing: 0.5px; }
              .table-header th:last-child { border-right: none; }
              .table-row { border-bottom: 1px solid #ddd; }
              .table-row:nth-child(even) { background-color: #f9f9f9; }
              .table-row td { padding: 12px 10px; font-size: 14px; color: #000; border-right: 1px solid #ddd; }
              .table-row td:last-child { border-right: none; }
              .status-paid { color: #000; font-weight: bold; }
              .status-not-paid { color: #d32f2f; font-weight: bold; }
              .total-received { text-align: right; font-size: 16px; font-weight: bold; color: #000; margin-top: 12px; }
              .footer { display: grid; grid-template-columns: 1fr 1fr; gap: 35px; margin-top: 30px; padding-top: 15px; }
              .instructions { text-align: right; }
              .instructions-title { font-size: 14px; font-weight: bold; color: #4CAF50; margin-bottom: 8px; }
              .instructions-text { font-size: 12px; color: #000; line-height: 1.5; direction: rtl; text-align: right; }
              .thank-you-section { text-align: left; position: relative; }
              .thank-you-graphic { width: 120px; height: 120px; background: #e8f5e8; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; border: 3px solid #4CAF50; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
              .thank-you-text { font-size: 16px; font-weight: bold; color: #000; font-style: italic; margin-bottom: 4px; }
              .thank-you-urdu { font-size: 14px; font-weight: bold; color: #000; font-style: italic; }
            `}</style>

            <div className="sheet">
              <div className="header">
                <div className="logo-section">
                  <div>
                    <div className="logo-text">APNA BUSINESS</div>
                    <div className="logo-subtitle">INNOVATE. SUSTAIN. PROSPER.</div>
                  </div>
                </div>
              </div>

              <div className="statement-title">
                <h1>CUSTOMER INSTALLMENT STATEMENT</h1>
              </div>

              <div className="customer-name">
                {S(installment.customerName, 'Customer Name')}
              </div>

              <div className="contract-details">
                <div className="contract-info">
                  <h3>Contract details</h3>
                  <div className="contract-item">{S(installment.productName, 'Product Name')}</div>
                  <div className="contract-item">
                    {installment.installmentCount || 'N/A'}-Month-{money(installment.amount)}
                  </div>
                  <div className="contract-item">Advance: {money(installment.advanceAmount)}</div>
                </div>

                <div className="invoice-info">
                  <div className="invoice-item">Customer ID: {S(installment.customerId)}</div>
                  <div className="invoice-item">Purchase Date: {dateStr(installment.createdAt)}</div>
                  <div className="balance-box">
                    <div className="balance-label">Balance :</div>
                    <div className="balance-amount">{money(totals.remaining)}</div>
                  </div>
                </div>
              </div>

              <div className="separator" />

              <table className="installment-table">
                <thead className="table-header">
                  <tr>
                    <th>STATUS</th>
                    <th>NO</th>
                    <th>INSTALLMENT</th>
                    <th>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: installment.installmentCount || 1 }, (_, idx) => {
                    const i = idx + 1;
                    const start = installment.createdAt ? new Date(installment.createdAt) : new Date();
                    const due = new Date(start);
                    due.setMonth(due.getMonth() + i);

                    // Calculate what should be paid up to this installment
                    const totalShouldBePaid = (installment.advanceAmount || 0) + (i * (installment.amount || 0));
                    const actualPaidAmount = installment.actualPaidAmount || 0;
                    
                    // Check if this installment is paid
                    const isPaid = actualPaidAmount >= totalShouldBePaid || 
                      (Array.isArray(installment.paymentHistory) && 
                       installment.paymentHistory.some(p => p.installmentNumber === i));

                    return (
                      <tr className="table-row" key={i}>
                        <td className={isPaid ? 'status-paid' : 'status-not-paid'}>
                          {isPaid ? 'Paid' : 'Not Paid'}
                        </td>
                        <td>{i}</td>
                        <td>{money(installment.amount)}</td>
                        <td>{due.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="total-received">
                {money(totals.paidAmount)} Received
              </div>

              <div className="footer">
                <div className="thank-you-section">
                  <div className="thank-you-graphic">
                    <div className="thank-you-text">THANKYOU</div>
                    <div className="thank-you-urdu">شکریہ</div>
                  </div>
                </div>

                <div className="instructions">
                  <div className="instructions-title">ESSENTIAL INSTRUCTION</div>
                  <div className="instructions-text">
                    یہ رسید آپ کے قرض انسٹالمنٹ کی مکمل تفصیلات بشمول رقم لینے اور دین کی تاریخوں کے ساتھ فراہم کرتی ہے۔ براہ کرم ادائیگی مقررہ وقت پر ہر ماہ کی 10 تاریخ تک یقینی بنائیں
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* ======= /PDF LAYOUT ======= */}
        </div>
      </div>
    </div>
  );
};

export default PDFGenerator;
