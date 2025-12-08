const API_BASE = 'http://localhost:5001/api';

class ApiClient {
  async validateAccessCode(code: string): Promise<{ valid: boolean; accessCodeId?: string; message?: string }> {
    const response = await fetch(`${API_BASE}/access-codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error('Failed to validate code');
    }

    return response.json();
  }

  async submitAssessment(data: {
    accessCode: string;
    totalScore: number;
    category: string;
    attachmentStyle: string;
    dimensions: any[];
    answers: Record<number, number>;
  }) {
    const response = await fetch(`${API_BASE}/assessments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to submit' }));
      throw new Error(error.error || 'Failed to submit assessment');
    }

    return response.json();
  }

  async getAssessment(id: string) {
    const response = await fetch(`${API_BASE}/assessments/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to get assessment');
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();
