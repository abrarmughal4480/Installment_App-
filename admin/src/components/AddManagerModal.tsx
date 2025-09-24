"use client";

import { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';

interface AddManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  colors: any;
}

export default function AddManagerModal({ isOpen, onClose, onSuccess, colors }: AddManagerModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup effect to restore scroll when component unmounts
  useEffect(() => {
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset';
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      setError('First name, last name, and email are required');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.addManager({
        name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.trim()
      });

      if (response.success) {
        // Reset form
        setFormData({ firstName: '', lastName: '', email: '' });
        onSuccess();
        onClose();
      } else {
        setError(response.message || 'Failed to add manager');
      }
    } catch (err) {
      setError('An error occurred while adding manager');
      console.error('Add manager error:', err);
    } finally {
      setIsLoading(false);
    }
  };


  if (!isOpen) return null;

  // Prevent body scroll when modal is open
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden';
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({ firstName: '', lastName: '', email: '' });
      setError(null);
      // Restore body scroll
      if (typeof document !== 'undefined') {
        document.body.style.overflow = 'unset';
      }
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
    >
      <div 
        className="w-full max-w-lg rounded-2xl shadow-2xl mr-4"
        style={{ backgroundColor: colors.cardBackground }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 
              className="text-2xl font-bold"
              style={{ color: colors.text }}
            >
              Add New Manager
            </h2>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text }}
                >
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  placeholder="First name"
                  disabled={isLoading}
                  required
                />
              </div>
              <div>
                <label 
                  className="block text-sm font-medium mb-2"
                  style={{ color: colors.text }}
                >
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none focus:ring-2 transition-all duration-200"
                  style={{
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                  placeholder="Last name"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label 
                className="block text-sm font-medium mb-2"
                style={{ color: colors.text }}
              >
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none focus:ring-2 transition-all duration-200"
                style={{
                  backgroundColor: colors.inputBackground,
                  borderColor: colors.border,
                  color: colors.text
                }}
                placeholder="Enter manager's email address"
                disabled={isLoading}
                required
              />
            </div>

            {error && (
              <div 
                className="p-3 rounded-lg text-sm"
                style={{ 
                  backgroundColor: `${colors.danger}20`,
                  color: colors.danger,
                  border: `1px solid ${colors.danger}40`
                }}
              >
                {error}
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-full font-medium transition-all duration-200"
                style={{
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  border: `1px solid ${colors.border}`
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-full font-medium text-white transition-all duration-200 disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Adding...
                  </div>
                ) : (
                  'Add Manager'
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
