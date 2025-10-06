'use client';

import React, { useState } from 'react';

interface ChangePasswordFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  showToast?: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSubmit, onCancel, showToast }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

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

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Password strength calculation
  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    let requirements = {
      length: false,
      lowercase: false,
      uppercase: false,
      digits: false,
      symbols: false,
      length12: false
    };

    // Length check (8+ characters)
    if (password.length >= 8) {
      score += 1;
      requirements.length = true;
    }

    // Length bonus (12+ characters)
    if (password.length >= 12) {
      score += 1;
      requirements.length12 = true;
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
      requirements.lowercase = true;
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
      requirements.uppercase = true;
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
      requirements.digits = true;
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
      requirements.symbols = true;
    }

    return { score, requirements };
  };

  const getStrengthLevel = (score: number) => {
    if (score <= 1) return { level: 'Very Weak', color: 'bg-red-600', textColor: 'text-red-700' };
    if (score <= 2) return { level: 'Weak', color: 'bg-red-500', textColor: 'text-red-600' };
    if (score <= 3) return { level: 'Fair', color: 'bg-orange-500', textColor: 'text-orange-600' };
    if (score <= 4) return { level: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    if (score <= 5) return { level: 'Strong', color: 'bg-green-500', textColor: 'text-green-600' };
    return { level: 'Very Strong', color: 'bg-green-600', textColor: 'text-green-700' };
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      const strength = calculatePasswordStrength(formData.newPassword);
      
      // Check if all requirements are met
      if (!strength.requirements.length) {
        newErrors.newPassword = 'Password must be at least 8 characters long';
      } else if (!strength.requirements.lowercase) {
        newErrors.newPassword = 'Password must contain lowercase letters (a-z)';
      } else if (!strength.requirements.uppercase) {
        newErrors.newPassword = 'Password must contain uppercase letters (A-Z)';
      } else if (!strength.requirements.digits) {
        newErrors.newPassword = 'Password must contain numbers (0-9)';
      } else if (!strength.requirements.symbols) {
        newErrors.newPassword = 'Password must contain special symbols (!@#$%^&*)';
      } else if (!strength.requirements.length12) {
        newErrors.newPassword = 'Password must be at least 12 characters for maximum security';
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Show toast for incomplete requirements
      if (showToast && formData.newPassword) {
        const strength = calculatePasswordStrength(formData.newPassword);
        let missingRequirements = [];
        
        if (!strength.requirements.length) missingRequirements.push('8+ characters');
        if (!strength.requirements.lowercase) missingRequirements.push('lowercase letters');
        if (!strength.requirements.uppercase) missingRequirements.push('uppercase letters');
        if (!strength.requirements.digits) missingRequirements.push('numbers');
        if (!strength.requirements.symbols) missingRequirements.push('special symbols');
        if (!strength.requirements.length12) missingRequirements.push('12+ characters');
        
        if (missingRequirements.length > 0) {
          showToast(`Password must include: ${missingRequirements.join(', ')}`, 'warning');
        }
      }
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-black mb-1">
          Current Password *
        </label>
        <div className="relative">
          <input
            type={showPasswords.currentPassword ? "text" : "password"}
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleInputChange}
            maxLength={12}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
              errors.currentPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter current password"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('currentPassword')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPasswords.currentPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>
        )}
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-black mb-1">
          New Password *
        </label>
        <div className="relative">
          <input
            type={showPasswords.newPassword ? "text" : "password"}
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            maxLength={12}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
              errors.newPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter new password"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('newPassword')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPasswords.newPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
        )}
        
        {/* Password Strength Meter */}
        {formData.newPassword && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Password Strength:</span>
              <span className={`text-sm font-semibold ${getStrengthLevel(calculatePasswordStrength(formData.newPassword).score).textColor}`}>
                {getStrengthLevel(calculatePasswordStrength(formData.newPassword).score).level}
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${getStrengthLevel(calculatePasswordStrength(formData.newPassword).score).color}`}
                style={{ 
                  width: `${(calculatePasswordStrength(formData.newPassword).score / 6) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-black mb-1">
          Confirm New Password *
        </label>
        <div className="relative">
          <input
            type={showPasswords.confirmPassword ? "text" : "password"}
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            maxLength={12}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Confirm new password"
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('confirmPassword')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPasswords.confirmPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Required Fields Note */}
      <div className="text-center pt-2">
        <p className="text-sm text-red-600 font-medium">All fields marked with * are required</p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full font-medium transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-full font-medium transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Changing...
            </>
          ) : (
            'Change Password'
          )}
        </button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
