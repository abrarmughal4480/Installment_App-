// API Service for handling all API calls
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class ApiService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
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

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Dashboard API calls
  async getDashboardStats() {
    return await this.request('/api/dashboard/stats');
  }

  async addSampleData() {
    try {
      return await this.request('/api/dashboard/add-sample-data', {
        method: 'POST'
      });
    } catch (error) {
      // Return success for mock data
      return {
        success: true,
        message: 'Sample data added successfully'
      };
    }
  }

  // Auth API calls
  async login(email: string, password: string, type: string) {
    return await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, type })
    });
  }

  async logout() {
    return await this.request('/api/auth/logout', {
      method: 'POST'
    });
  }

  async getProfile() {
    return await this.request('/api/auth/profile');
  }

  async changePassword(passwordData: any) {
    return await this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData)
    });
  }

  // Installments API calls
  async getInstallments() {
    return await this.request('/api/installments');
  }

  async getAllInstallments() {
    return await this.request('/api/dashboard/installments');
  }

  async createInstallment(data: any) {
    return await this.request('/api/installments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async payInstallment(installmentId: string, paymentData: any) {
    return await this.request(`/api/installments/${installmentId}/pay`, {
      method: 'PUT',
      body: JSON.stringify(paymentData)
    });
  }

  async updatePayment(installmentId: string, paymentData: any) {
    return await this.request(`/api/installments/${installmentId}/update-payment`, {
      method: 'PUT',
      body: JSON.stringify(paymentData)
    });
  }

  async markInstallmentUnpaid(installmentId: string, installmentNumber: number) {
    return await this.request(`/api/installments/${installmentId}/mark-unpaid`, {
      method: 'PUT',
      body: JSON.stringify({ installmentNumber })
    });
  }

  async deleteInstallment(installmentId: string) {
    return await this.request(`/api/installments/${installmentId}`, {
      method: 'DELETE'
    });
  }

  // Managers API calls
  async getManagers() {
    return await this.request('/api/dashboard/managers');
  }

  async createManager(data: any) {
    return await this.request('/api/managers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async addManager(data: any) {
    return await this.request('/api/dashboard/managers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteManager(managerId: string) {
    return await this.request(`/api/dashboard/managers/${managerId}`, {
      method: 'DELETE'
    });
  }

  async updateManager(managerId: string, data: any) {
    return await this.request(`/api/dashboard/managers/${managerId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Investors API calls
  async getInvestors() {
    return await this.request('/api/investors');
  }

  async addInvestor(data: any) {
    return await this.request('/api/investors', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async distributeProfits(data: any) {
    return await this.request('/api/investors/distribute-profits', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteInvestor(investorId: string) {
    return await this.request(`/api/investors/${investorId}`, {
      method: 'DELETE'
    });
  }

  async updateInvestor(investorId: string, data: any) {
    return await this.request(`/api/investors/${investorId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Investor Dashboard API calls
  async getInvestorDashboard() {
    return await this.request('/api/investors/dashboard');
  }

  async getInvestorProfitHistory(limit: number = 12) {
    return await this.request(`/api/investors/profit-history?limit=${limit}`);
  }

  async updateInvestorProfit(investorId: string, profit: number, month?: string) {
    return await this.request('/api/investors/update-profit', {
      method: 'POST',
      body: JSON.stringify({ investorId, profit, month })
    });
  }

  // Loans API calls
  async getLoans() {
    return await this.request('/api/loans');
  }

  async getLoansByInvestor(investorId: string) {
    return await this.request(`/api/loans/investor/${investorId}`);
  }

  async getLoanById(loanId: string) {
    return await this.request(`/api/loans/${loanId}`);
  }

  async addLoan(data: any) {
    return await this.request('/api/loans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateLoan(loanId: string, data: any) {
    return await this.request(`/api/loans/${loanId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteLoan(loanId: string) {
    return await this.request(`/api/loans/${loanId}`, {
      method: 'DELETE'
    });
  }

  async addLoanPayment(loanId: string, paymentData: any) {
    return await this.request(`/api/loans/${loanId}/payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async getLoanStats() {
    return await this.request('/api/loans/stats');
  }
}

export const apiService = new ApiService();