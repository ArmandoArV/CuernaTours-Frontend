/**
 * Contract Payments Service
 * 
 * Handles contract payment-related API calls (client payments)
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ContractPayment } from '@/app/backend_models/payment.model';

export interface CreateContractPaymentRequest {
  contract_id: number;
  payment_amount: number;
  payment_date: string;
  payment_type_id: number;
  reference_number?: string;
  notes?: string;
}

export interface UpdateContractPaymentRequest {
  payment_amount?: number;
  payment_date?: string;
  payment_type_id?: number;
  reference_number?: string;
  notes?: string;
}

export interface PaymentSummary {
  contract_id: number;
  total_amount: number;
  total_paid: number;
  remaining_amount: number;
  payments: ContractPayment[];
}

class PaymentsService {
  /**
   * Get payments by contract ID
   */
  async getByContract(contractId: number): Promise<ContractPayment[]> {
    const endpoint = API_ENDPOINTS.CONTRACT_PAYMENTS.BASE(contractId);
    const response = await apiClient.get<ContractPayment[]>(endpoint);
    return validateResponse<ContractPayment[]>(response);
  }

  /**
   * Get payment summary
   */
  async getSummary(contractId: number): Promise<PaymentSummary> {
    const endpoint = API_ENDPOINTS.CONTRACT_PAYMENTS.SUMMARY(contractId);
    const response = await apiClient.get<PaymentSummary>(endpoint);
    return validateResponse<PaymentSummary>(response);
  }

  /**
   * Create new contract payment
   */
  async create(contractId: number, data: Omit<CreateContractPaymentRequest, 'contract_id'>): Promise<ContractPayment> {
    const endpoint = API_ENDPOINTS.CONTRACT_PAYMENTS.BASE(contractId);
    const response = await apiClient.post<ContractPayment>(endpoint, data);
    return validateResponse<ContractPayment>(response);
  }

  /**
   * Update existing payment
   */
  async update(contractId: number, paymentId: number, data: UpdateContractPaymentRequest): Promise<ContractPayment> {
    const endpoint = API_ENDPOINTS.CONTRACT_PAYMENTS.BY_ID(contractId, paymentId);
    const response = await apiClient.put<ContractPayment>(endpoint, data);
    return validateResponse<ContractPayment>(response);
  }

  /**
   * Delete payment
   */
  async delete(contractId: number, paymentId: number): Promise<boolean> {
    const endpoint = API_ENDPOINTS.CONTRACT_PAYMENTS.BY_ID(contractId, paymentId);
    const response = await apiClient.delete<{ deleted: boolean }>(endpoint);
    const data = validateResponse<{ deleted: boolean }>(response);
    return data.deleted;
  }
}

// Export singleton instance
export const paymentsService = new PaymentsService();
