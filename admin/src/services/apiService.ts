const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface DashboardStats {
  totalManagers: number;
  totalInstallments: number;
  totalProductsSold: number;
  pendingPayments: number;
  completedPayments: number;
  totalRevenue: number;
  recentActivities: Array<{
    action: string;
    user: string;
    time: string;
    amount: number;
    status: string;
  }>;
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    requireAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add auth token only if required and available
    if (requireAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred',
      };
    }
  }

  // Dashboard API (no auth required for now)
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/dashboard/stats', {}, false);
  }

  async addSampleData() {
    return this.request('/dashboard/sample-data', {
      method: 'POST',
    }, false);
  }

  async getManagers() {
    return this.request('/dashboard/managers', {}, false);
  }

  async addManager(data: { name: string; email: string }) {
    return this.request('/dashboard/managers', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);
  }

  async deleteManager(id: string) {
    return this.request(`/dashboard/managers/${id}`, {
      method: 'DELETE',
    }, false);
  }

  async getAllInstallments() {
    return this.request('/dashboard/installments', {}, false);
  }

  // Auth API
  async login(credentials: { email: string; password: string; type: string }) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Installments API
  async getInstallments() {
    return this.request('/installments');
  }

  async getInstallment(id: string) {
    return this.request(`/installments/${id}`);
  }

  async createInstallments(data: any) {
    return this.request('/installments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInstallment(id: string, data: any) {
    return this.request(`/installments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteInstallment(id: string) {
    return this.request(`/installments/${id}`, {
      method: 'DELETE',
    });
  }

  async payInstallment(id: string, data: any) {
    return this.request(`/installments/${id}/pay`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
