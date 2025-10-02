'use client';

import React from 'react';
import ChangePasswordForm from './ChangePasswordForm';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 translate-y-0">
        {/* Header */}
        <div 
          className="relative overflow-hidden rounded-t-2xl"
          style={{ 
            background: `linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)`
          }}
        >
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Change Password</h2>
                <p className="text-white/90 text-sm">Update your account password</p>
              </div>
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <ChangePasswordForm onSubmit={onSubmit} onCancel={onClose} />
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
