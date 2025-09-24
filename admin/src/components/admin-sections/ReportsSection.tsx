"use client";

interface ReportsSectionProps {
  colors: any;
}

export default function ReportsSection({ colors }: ReportsSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
        Reports & Analytics
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div 
          className="p-6 rounded-2xl shadow-lg"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
            Revenue Overview
          </h3>
          <div className="h-64 flex items-center justify-center" style={{ backgroundColor: colors.background }}>
            <p style={{ color: colors.lightText }}>Chart will be implemented here</p>
          </div>
        </div>
        
        <div 
          className="p-6 rounded-2xl shadow-lg"
          style={{ backgroundColor: colors.cardBackground }}
        >
          <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
            Payment Status
          </h3>
          <div className="h-64 flex items-center justify-center" style={{ backgroundColor: colors.background }}>
            <p style={{ color: colors.lightText }}>Chart will be implemented here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
