/**
 * Spendings Service
 * 
 * Handles spending-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';

export interface Spending {
  spending_id: number;
  amount: number;
  spending_date: Date;
  category: string;
  description?: string;
  created_by: number;
  created_at: Date;
}

export interface CreateSpendingRequest {
  amount: number;
  spending_date: string;
  category: string;
  description?: string;
}

export interface UpdateSpendingRequest {
  amount?: number;
  spending_date?: string;
  category?: string;
  description?: string;
}

export interface SpendingFile {
  file_id: number;
  spending_id: number;
  file_url: string;
  original_name: string;
}

class SpendingsService {
  /**
   * Get all spendings
   */
  async getAll(): Promise<Spending[]> {
    const response = await apiClient.get<Spending[]>(API_ENDPOINTS.SPENDINGS.BASE);
    return validateResponse<Spending[]>(response);
  }

  /**
   * Get spending by ID
   */
  async getById(spendingId: number): Promise<Spending> {
    const endpoint = API_ENDPOINTS.SPENDINGS.BY_ID(spendingId);
    const response = await apiClient.get<Spending>(endpoint);
    return validateResponse<Spending>(response);
  }

  /**
   * Create new spending
   */
  async create(data: CreateSpendingRequest): Promise<Spending> {
    const response = await apiClient.post<Spending>(
      API_ENDPOINTS.SPENDINGS.BASE,
      data
    );
    return validateResponse<Spending>(response);
  }

  /**
   * Update existing spending
   */
  async update(spendingId: number, data: UpdateSpendingRequest): Promise<Spending> {
    const endpoint = API_ENDPOINTS.SPENDINGS.BY_ID(spendingId);
    const response = await apiClient.patch<Spending>(endpoint, data);
    return validateResponse<Spending>(response);
  }

  /**
   * Get spending files
   */
  async getFiles(spendingId: number): Promise<SpendingFile[]> {
    const endpoint = API_ENDPOINTS.SPENDINGS.FILES(spendingId);
    const response = await apiClient.get<SpendingFile[]>(endpoint);
    return validateResponse<SpendingFile[]>(response);
  }

  /**
   * Upload file for spending
   */
  async uploadFile(spendingId: number, file: File): Promise<SpendingFile> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('spending_id', spendingId.toString());

    // Use fetch directly for FormData uploads
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];

    const response = await fetch(API_ENDPOINTS.SPENDINGS.UPLOAD_FILE, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return validateResponse<SpendingFile>(data);
  }
}

// Export singleton instance
export const spendingsService = new SpendingsService();
