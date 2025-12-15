/**
 * Agreements Service
 * 
 * Handles agreement-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';

export interface Agreement {
  agreement_id: number;
  driver_id: number;
  start_date: Date;
  end_date?: Date;
  terms: string;
  status: 'active' | 'expired' | 'terminated';
  created_at: Date;
}

export interface CreateAgreementRequest {
  driver_id: number;
  start_date: string;
  end_date?: string;
  terms: string;
}

export interface UpdateAgreementRequest {
  start_date?: string;
  end_date?: string;
  terms?: string;
  status?: 'active' | 'expired' | 'terminated';
}

class AgreementsService {
  /**
   * Get all agreements
   */
  async getAll(): Promise<Agreement[]> {
    const response = await apiClient.get<Agreement[]>(API_ENDPOINTS.AGREEMENTS.BASE);
    return validateResponse<Agreement[]>(response);
  }

  /**
   * Get agreement by ID
   */
  async getById(agreementId: number): Promise<Agreement> {
    const endpoint = API_ENDPOINTS.AGREEMENTS.BY_ID(agreementId);
    const response = await apiClient.get<Agreement>(endpoint);
    return validateResponse<Agreement>(response);
  }

  /**
   * Get agreements by driver
   */
  async getByDriver(driverId: number): Promise<Agreement[]> {
    const endpoint = API_ENDPOINTS.AGREEMENTS.BY_DRIVER(driverId);
    const response = await apiClient.get<Agreement[]>(endpoint);
    return validateResponse<Agreement[]>(response);
  }

  /**
   * Create new agreement
   */
  async create(data: CreateAgreementRequest): Promise<Agreement> {
    const response = await apiClient.post<Agreement>(
      API_ENDPOINTS.AGREEMENTS.BASE,
      data
    );
    return validateResponse<Agreement>(response);
  }

  /**
   * Update existing agreement
   */
  async update(agreementId: number, data: UpdateAgreementRequest): Promise<Agreement> {
    const endpoint = API_ENDPOINTS.AGREEMENTS.BY_ID(agreementId);
    const response = await apiClient.patch<Agreement>(endpoint, data);
    return validateResponse<Agreement>(response);
  }

  /**
   * Delete agreement
   */
  async delete(agreementId: number): Promise<boolean> {
    const endpoint = API_ENDPOINTS.AGREEMENTS.BY_ID(agreementId);
    const response = await apiClient.delete<{ deleted: boolean }>(endpoint);
    const data = validateResponse<{ deleted: boolean }>(response);
    return data.deleted;
  }
}

// Export singleton instance
export const agreementsService = new AgreementsService();
