const API_BASE = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
  ? 'http://localhost:5001/api'
  : '/api';

class AdminApi {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `Request failed with status ${response.status}`);
      }

      return response.json();
    } catch (error: any) {
      // Handle network errors and other fetch errors
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('无法连接到服务器，请检查网络连接和服务器状态');
      }
      throw error;
    }
  }

  async login(email: string, password: string) {
    return this.request('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getStatistics() {
    return this.request('/assessments/stats');
  }

  async listAssessments(page: number, limit: number) {
    return this.request(`/assessments/list?page=${page}&limit=${limit}`);
  }

  async getCodeStats() {
    return this.request('/access-codes/stats');
  }

  async listCodes(page: number, limit: number, filter: 'all' | 'used' | 'available') {
    return this.request(`/access-codes/list?page=${page}&limit=${limit}&filter=${filter}`);
  }

  async generateCodes(count: number) {
    return this.request('/access-codes/generate', {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
  }
}

export const adminApi = new AdminApi();
