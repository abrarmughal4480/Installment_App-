'use client';

import React, { useState } from 'react';

interface EditManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  manager: any;
  editType: 'name' | 'email' | 'password';
  colors: any;
}

const EditManagerModal: React.FC<EditManagerModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  manager, 
  editType, 
  colors 
}) => {
  const [formData, setFormData] = useState({
    name: manager?.name || '',
    email: manager?.email || '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (editType === 'name' && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (editType === 'email') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (editType === 'password' && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (editType === 'password' && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (editType) {
      case 'name': return 'Edit Manager Name';
      case 'email': return 'Edit Manager Email';
      case 'password': return 'Reset Manager Password';
      default: return 'Edit Manager';
    }
  };

  const getDescription = () => {
    switch (editType) {
      case 'name': return 'Update the manager\'s name';
      case 'email': return 'Update the manager\'s email address. A new password will be sent to the new email.';
      case 'password': return 'Generate a new password for the manager. The new password will be sent to their email.';
      default: return 'Edit manager information';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 opacity-100" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100 translate-y-0">
        {/* Header */}
        <div 
          className="relative overflow-hidden rounded-t-2xl"
          style={{ 
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primaryDark} 100%)`
          }}
        >
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">{getTitle()}</h2>
                <p className="text-white/90 text-sm">{getDescription()}</p>
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {editType === 'name' && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-black mb-1">
                  Manager Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter manager name"
                />
                {errors.name && (
                  <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                )}
              </div>
            )}

            {editType === 'email' && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                  Manager Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter manager email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  A new password will be generated and sent to this email address.
                </p>
              </div>
            )}

            {editType === 'password' && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter new password"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  The new password will be sent to the manager's email address.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-black bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: colors.primary,
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Updating...
                  </>
                ) : (
                  editType === 'password' ? 'Reset Password' : 'Update'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditManagerModal;
