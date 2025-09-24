"use client";

interface SettingsSectionProps {
  colors: any;
}

export default function SettingsSection({ colors }: SettingsSectionProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
        Settings
      </h2>
      
      <div 
        className="p-6 rounded-2xl shadow-lg"
        style={{ backgroundColor: colors.cardBackground }}
      >
        <h3 className="text-lg font-semibold mb-4" style={{ color: colors.text }}>
          General Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span style={{ color: colors.text }}>Email Notifications</span>
            <input type="checkbox" className="w-4 h-4" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: colors.text }}>SMS Notifications</span>
            <input type="checkbox" className="w-4 h-4" />
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: colors.text }}>Auto Reminders</span>
            <input type="checkbox" className="w-4 h-4" defaultChecked />
          </div>
        </div>
      </div>
    </div>
  );
}
