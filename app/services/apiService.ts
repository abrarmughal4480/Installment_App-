import TokenService from './tokenService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://app.hgdjlive.com';

interface LoginCredentials {
  customerId?: string;
  email?: string;
  password?: string;
  type: 'customer' | 'admin';
}

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: 'customer' | 'admin';
  customerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}


interface AuthResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
  remainingAttempts?: number;
}

interface OTPResponse {
  success: boolean;
  message: string;
  expiresIn?: number;
  remainingTime?: number;
  remainingAttempts?: number;
}

interface Installment {
  id: string;
  installmentNumber: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  productName: string;
  productDescription: string;
  totalAmount: number;
  advanceAmount: number;
  installmentCount: number;
  installmentUnit: string;
  monthlyInstallment: number;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue' | 'active' | 'completed';
  paymentMethod?: 'cash' | 'bank_transfer' | 'card' | 'other';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  // Additional info about the plan
  totalPaidInstallments?: number;
  totalUnpaidInstallments?: number;
  totalPaidAmount?: number;
  // Edit-specific calculations
  remainingAmount?: number;
  remainingInstallmentCount?: number;
  newMonthlyInstallment?: number;
  dueDay?: number;
  // Next unpaid installment info (from API response)
  nextUnpaid?: {
    installmentNumber: number;
    amount: number;
    dueDate: string;
    status: 'pending';
  };
  installments?: Array<{
    installmentNumber: number;
    amount: number;
    actualPaidAmount?: number;
    dueDate: string;
    paidDate?: string;
    status: 'pending' | 'paid' | 'overdue';
    paymentMethod?: 'cash' | 'bank_transfer' | 'wallet' | 'cheque' | 'other';
    notes?: string;
    paidBy?: string;
  }>;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // For rate limiting (429), return the response data instead of throwing
        if (response.status === 429) {
          return errorData as T;
        }
        
        // Return error data instead of throwing for better error handling
        return errorData as T;
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      // Return a structured error response instead of throwing
      return {
        success: false,
        message: 'Network error. Please check your internet connection and try again.'
      } as T;
    }
  }

  // Authentication Methods
  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
  }): Promise<AuthResponse> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile(): Promise<{ success: boolean; user: User }> {
    const token = await TokenService.getToken();
    return this.request('/api/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token || ''}`,
      },
    });
  }

  async updateProfile(token: string, userData: {
    name?: string;
    phone?: string;
    address?: string;
  }): Promise<AuthResponse> {
    return this.request('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
  }

  async changePassword(token: string, passwords: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/change-password', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(passwords),
    });
  }

  // OTP Methods
  async sendOTP(email: string, name?: string): Promise<OTPResponse> {
    return this.request('/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  }

  async checkEmailExists(email: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/check-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyOTPOnly(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    return this.request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  }

  async completeRegistration(email: string, otp: string, password: string): Promise<AuthResponse> {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, otp, password }),
    });
  }

  async verifyOTP(email: string, otp: string, password: string): Promise<AuthResponse> {
    return this.request('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, password }),
    });
  }

  // Health Check
  async healthCheck(): Promise<{
    message: string;
    status: string;
    timestamp: string;
    uptime: number;
    database: {
      status: string;
      name: string;
    };
  }> {
    return this.request('/');
  }

  // Ping
  async ping(): Promise<{ message: string; timestamp: string }> {
    return this.request('/ping');
  }


  // Installment Management
  async getInstallments(customerId: string, isAdmin: boolean): Promise<{ success: boolean; installments: Installment[] }> {
    const token = await TokenService.getToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const endpoint = isAdmin ? `/api/installments` : `/api/installments/customer/${customerId}`;
    return this.request(endpoint, { headers });
  }

  async createInstallments(data: any): Promise<{ success: boolean; message?: string; customer?: any; installments?: any[] }> {
    const token = await TokenService.getToken();
    return this.request('/api/installments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`,
      },
      body: JSON.stringify(data),
    });
  }

  async getInstallment(installmentId: string): Promise<{ success: boolean; installment: any }> {
    return this.request(`/api/installments/details/${installmentId}`, {
      method: 'GET',
    });
  }

  async payInstallment(installmentId: string, paymentData: {
    installmentNumber: number;
    paymentMethod: string;
    notes?: string;
    customAmount?: number;
  }): Promise<{ 
    success: boolean; 
    message: string; 
    installment?: any;
    distribution?: {
      difference: number;
      distributedTo: number;
      amountPerInstallment: number;
      message: string;
    };
  }> {
    const token = await TokenService.getToken();
    return this.request(`/api/installments/${installmentId}/pay`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token || ''}`,
      },
      body: JSON.stringify(paymentData),
    });
  }

  // Get customer installments (public endpoint - no auth required)
  async getCustomerInstallments(customerId: string): Promise<{
    success: boolean;
    customer?: {
      customerId: string;
      customerName: string;
      customerEmail: string;
      customerPhone: string;
      customerAddress: string;
    };
    installments?: any[];
    totalInstallments?: number;
    message?: string;
  }> {
    return this.request(`/api/installments/customer/${customerId}`, {
      method: 'GET',
    });
  }

  // Delete installment
  async deleteInstallment(installmentId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    const token = await TokenService.getToken();
    return this.request(`/api/installments/${installmentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token || ''}`,
      },
    });
  }
}

export const apiService = new ApiService();
export type { User, Installment, LoginCredentials, AuthResponse, OTPResponse };
