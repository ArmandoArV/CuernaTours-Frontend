/**
 * Contract Templates Service
 * 
 * Handles contract template-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ContractTemplate } from '@/app/backend_models/contract-template.model';

export interface CreateContractTemplateRequest {
  client_id: number;
  name: string;
  origin_id: number;
  passengers: number;
  destination_id: number;
  unit_type?: string;
  payment_type_id: number;
  amount: number;
  observations?: string;
  internal_observations?: string;
}

export interface UpdateContractTemplateRequest {
  client_id?: number;
  name?: string;
  origin_id?: number;
  passengers?: number;
  destination_id?: number;
  unit_type?: string;
  payment_type_id?: number;
  amount?: number;
  observations?: string;
  internal_observations?: string;
}

class ContractTemplatesService {
  /**
   * Get all contract templates
   */
  async getAll(): Promise<ContractTemplate[]> {
    const response = await apiClient.get<ContractTemplate[]>(API_ENDPOINTS.CONTRACT_TEMPLATES.BASE);
    return validateResponse<ContractTemplate[]>(response);
  }

  /**
   * Get contract template by ID
   */
  async getById(templateId: number): Promise<ContractTemplate> {
    const endpoint = API_ENDPOINTS.CONTRACT_TEMPLATES.BY_ID(templateId);
    const response = await apiClient.get<ContractTemplate>(endpoint);
    return validateResponse<ContractTemplate>(response);
  }

  /**
   * Create new contract template
   */
  async create(data: CreateContractTemplateRequest): Promise<ContractTemplate> {
    const response = await apiClient.post<ContractTemplate>(
      API_ENDPOINTS.CONTRACT_TEMPLATES.BASE,
      data
    );
    return validateResponse<ContractTemplate>(response);
  }

  /**
   * Update existing contract template
   */
  async update(templateId: number, data: UpdateContractTemplateRequest): Promise<ContractTemplate> {
    const endpoint = API_ENDPOINTS.CONTRACT_TEMPLATES.BY_ID(templateId);
    const response = await apiClient.put<ContractTemplate>(endpoint, data);
    return validateResponse<ContractTemplate>(response);
  }

  /**
   * Delete contract template
   */
  async delete(templateId: number): Promise<boolean> {
    const endpoint = API_ENDPOINTS.CONTRACT_TEMPLATES.BY_ID(templateId);
    const response = await apiClient.delete<{ deleted: boolean }>(endpoint);
    const data = validateResponse<{ deleted: boolean }>(response);
    return data.deleted;
  }

  /**
   * Get templates by client
   */
  async getByClient(clientId: number): Promise<ContractTemplate[]> {
    const endpoint = API_ENDPOINTS.CONTRACT_TEMPLATES.BY_CLIENT(clientId);
    const response = await apiClient.get<ContractTemplate[]>(endpoint);
    return validateResponse<ContractTemplate[]>(response);
  }
}

// Export singleton instance
export const contractTemplatesService = new ContractTemplatesService();
