// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      PROFILE: '/api/auth/profile',
      CHECK_EMAIL: '/api/auth/check-email',
      SEND_OTP: '/api/auth/send-otp',
      VERIFY_OTP: '/api/auth/verify-otp',
      REGISTER: '/api/auth/register'
    },
    INSTALLMENTS: {
      LIST: '/api/installments',
      CREATE: '/api/installments',
      UPDATE: '/api/installments',
      DELETE: '/api/installments'
    },
    DASHBOARD: {
      OVERVIEW: '/api/dashboard/overview',
      STATS: '/api/dashboard/stats'
    }
  }
};

// Helper function to build full API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function for API requests
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = buildApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Add auth token if available
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (token) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      'Authorization': `Bearer ${token}`,
    };
  }

  return fetch(url, { ...defaultOptions, ...options });
};
