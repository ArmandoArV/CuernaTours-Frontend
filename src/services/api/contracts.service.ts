/**
 * Contracts Service
 * 
 * Handles contract-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse, isContract } from './validators';
import type { ApiResponse, QueryOptions } from '@/app/backend_models/common_types/common.types';
import type { Contract } from '@/app/backend_models/contract.model';

// Extended contract type with joined data from API
export interface ContractWithDetails extends Contract {
  // Client information
  client_name: string;
  client_type_name: string;
  
  // Status information
  contract_status_name: string;
  payment_type_name: string;
  
  // Coordinator information
  coordinator_name: string;
  coordinator_lastname: string;
  
  // Creator information
  creator_name: string;
  creator_lastname: string;
  
  // Associated trips
  trips?: any[];
}

export interface CreateContractRequest {
  client_id: number;
  payment_type_id: number;
  IVA: boolean | number;
  amount: number;
  coordinator_id?: number;
  observations?: string;
  internal_observations?: string;
  commission?: {
    type: 'percentage' | 'arranged';
    amount?: number;
    arranged_deal?: string;
    establishment?: string;
  };
}

export interface CreateContractResponse {
  contract_id: number;
  id: number;
}

export interface UpdateContractRequest {
  payment_type_id?: number;
  IVA?: boolean | number;
  amount?: number;
  observations?: string;
  internal_observations?: string;
  coordinator_id?: number;
  contract_status_id?: number;
  payment_status?: 'pending' | 'paid';
}

class ContractsService {
  /**
   * Get all contracts with details
   */
  async getAll(options?: QueryOptions): Promise<ContractWithDetails[]> {
    let endpoint = API_ENDPOINTS.CONTRACTS.DETAILS;
    
    // Add query parameters if provided
    if (options) {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('order', options.sortOrder);
      
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });
      }
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }

    const response = await apiClient.get<ContractWithDetails[]>(endpoint);
    return validateResponse<ContractWithDetails[]>(response);
  }

  /**
   * Get contract by ID with full details
   */
  async getById(contractId: number): Promise<ContractWithDetails> {
    const endpoint = API_ENDPOINTS.CONTRACTS.BY_ID(contractId);
    const response = await apiClient.get<ContractWithDetails>(endpoint);
    return validateResponse<ContractWithDetails>(response);
  }

  /**
   * Create new contract
   */
  async create(data: CreateContractRequest): Promise<CreateContractResponse> {
    const response = await apiClient.post<CreateContractResponse>(
      API_ENDPOINTS.CONTRACTS.CREATE,
      data
    );
    return validateResponse<CreateContractResponse>(response);
  }

  /**
   * Update existing contract
   */
  async update(contractId: number, data: UpdateContractRequest): Promise<Contract> {
    const endpoint = `${API_ENDPOINTS.CONTRACTS.BASE}/${contractId}`;
    const response = await apiClient.patch<Contract>(endpoint, data);
    return validateResponse<Contract>(response);
  }

  /**
   * Delete contract
   */
  async delete(contractId: number): Promise<boolean> {
    const endpoint = `${API_ENDPOINTS.CONTRACTS.BASE}/${contractId}`;
    const response = await apiClient.delete<{ deleted: boolean }>(endpoint);
    const data = validateResponse<{ deleted: boolean }>(response);
    return data.deleted;
  }

  /**
   * Update contract status
   */
  async updateStatus(
    contractId: number,
    statusId: number
  ): Promise<Contract> {
    return this.update(contractId, { contract_status_id: statusId });
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    contractId: number,
    paymentStatus: 'pending' | 'paid'
  ): Promise<Contract> {
    return this.update(contractId, { payment_status: paymentStatus });
  }
}

// Export singleton instance
export const contractsService = new ContractsService();
