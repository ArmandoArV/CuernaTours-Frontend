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

  // Flat commission fields returned by details endpoints
  commission_type?: 'percentage' | 'arranged' | null;
  commission_amount?: number | null;
  commission_arranged_deal?: string | null;
  commission_establishment?: string | null;
  commission_status?: 'paid' | 'pending' | null;
  commission_paid_date?: string | null;
  commission_paid_by?: number | null;

  // Nested commission object (also returned by details endpoints)
  commission?: {
    commission_id: number;
    type: 'percentage' | 'arranged';
    amount?: number | null;
    arranged_deal?: string | null;
    establishment?: string | null;
    status?: 'paid' | 'pending';
    paid_date?: string | null;
    paid_by?: number | null;
  } | null;

  // Payments
  payments?: any[];
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

export interface CreateContractWithTripsRequest {
  // Contract data
  client_id: number;
  payment_type_id: number;
  IVA: boolean;
  amount: number;
  coordinator_id?: number;
  creator_id?: number;
  observations?: string;
  internal_observations?: string;
  
  // Commission data (optional)
  commission?: {
    type: 'percentage' | 'arranged';
    amount?: number;
    arranged_deal?: string;
    establishment?: string;
  };
  
  // Trip data
  trip: {
    service_date: string;
    origin: {
      place_id?: number;
      name?: string;
      address?: string;
      number?: string;
      colonia?: string;
      city?: string;
      state?: string;
      zip_code?: string;
      annotations?: string;
    };
    destination: {
      place_id?: number;
      name?: string;
      address?: string;
      number?: string;
      colonia?: string;
      city?: string;
      state?: string;
      zip_code?: string;
      annotations?: string;
    };
    origin_time: string;
    passengers: number;
    observations?: string;
    internal_observations?: string;
    
    // Flight data (optional)
    flight?: {
      flight_number: string;
      airline?: string;
      arrival_time?: string;
      flight_origin?: string;
      notes?: string;
    };
    
    // Round trip flag
    is_round_trip?: boolean;
    return_date?: string;
    return_time?: string;

    // Units (required — vehicle_type_id is mandatory)
    units?: Array<{
      vehicle_type_id: number;
      vehicle_id?: number;
      driver_id?: number;
      external_driver_id?: number;
      notes?: string;
    }>;

    // Stops
    stops?: Array<{
      place_id?: number;
      description?: string;
      stop_order: number;
    }>;
    return_stops?: Array<{
      place_id?: number;
      description?: string;
      stop_order: number;
    }>;
    reverse_stops_for_return?: boolean;
  };

  // Notification control
  send_notification?: boolean;
}

export interface CreateContractWithTripsResponse {
  contract: Contract;
  commission?: any;
  origin_place: any;
  destination_place: any;
  flight?: any;
  outbound_trip: any;
  return_trip?: any;
}

export interface CreateCommissionRequest {
  contract_id: number;
  type: 'percentage' | 'arranged';
  amount?: number;
  arranged_deal?: string;
  establishment?: string;
}

class ContractsService {
  /**
   * Get all contracts with details
   */
  async getAll(options?: QueryOptions): Promise<ContractWithDetails[]> {
    let endpoint = API_ENDPOINTS.CONTRACTS.ALL_DETAILS;
    
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
   * Get contract details by ID using /contracts/details/:id endpoint
   */
  async getContractDetails(contractId: number): Promise<ContractWithDetails> {
    const endpoint = API_ENDPOINTS.CONTRACTS.DETAILS(contractId);
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
    const endpoint = API_ENDPOINTS.CONTRACTS.UPDATE(contractId);
    const response = await apiClient.put<Contract>(endpoint, data);
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

  /**
   * Create contract with trips
   */
  async createWithTrips(data: CreateContractWithTripsRequest): Promise<CreateContractWithTripsResponse> {
    const response = await apiClient.post<CreateContractWithTripsResponse>(
      API_ENDPOINTS.CONTRACTS.CREATE_WITH_TRIPS,
      data
    );
    return validateResponse<CreateContractWithTripsResponse>(response);
  }

  /**
   * Send trip confirmation notification
   */
  async sendTripConfirmation(contractId: number): Promise<{ success: boolean; message: string; error?: string }> {
    const endpoint = API_ENDPOINTS.CONTRACTS.SEND_CONFIRMATION(contractId);
    const response = await apiClient.post<{ success: boolean; message: string; error?: string }>(endpoint, {});
    return validateResponse<{ success: boolean; message: string; error?: string }>(response);
  }

  /**
   * Get all contract statuses
   */
  async getStatuses(): Promise<any[]> {
    const response = await apiClient.get<any[]>(API_ENDPOINTS.REFERENCE.CONTRACT_STATUSES);
    return validateResponse<any[]>(response);
  }

  /**
   * Get all commissions
   */
  async getCommissions(options?: QueryOptions): Promise<any[]> {
    let endpoint = API_ENDPOINTS.COMMISSIONS.BASE || '/commissions';
    
    if (options) {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('order', options.sortOrder);
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }

    const response = await apiClient.get<any[]>(endpoint);
    return validateResponse<any[]>(response);
  }

  /**
   * Create commission
   */
  async createCommission(data: CreateCommissionRequest): Promise<any> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.COMMISSIONS.BASE || '/commissions',
      data
    );
    return validateResponse<any>(response);
  }

  /**
   * Mark contract money as received
   */
  async markMoneyReceived(
    contractId: number,
    receivedDate?: string
  ): Promise<Contract> {
    const endpoint = API_ENDPOINTS.CONTRACTS.MONEY_RECEIVED(contractId);
    const response = await apiClient.patch<Contract>(endpoint, { received_date: receivedDate });
    return validateResponse<Contract>(response);
  }

  /**
   * Get contracts pending money receipt
   */
  async getPendingMoneyReceipt(): Promise<Contract[]> {
    const response = await apiClient.get<Contract[]>(API_ENDPOINTS.CONTRACTS.PENDING_MONEY_RECEIVED);
    return validateResponse<Contract[]>(response);
  }

  /**
   * Mark commission as paid
   */
  async markCommissionPaid(
    commissionId: number,
    paidDate?: string
  ): Promise<any> {
    const endpoint = API_ENDPOINTS.COMMISSIONS.MARK_PAID(commissionId);
    const response = await apiClient.patch<any>(endpoint, { paid_date: paidDate });
    return validateResponse<any>(response);
  }

  /**
   * Get pending commissions
   */
  async getPendingCommissions(): Promise<any[]> {
    const response = await apiClient.get<any[]>(API_ENDPOINTS.COMMISSIONS.PENDING);
    return validateResponse<any[]>(response);
  }

  /**
   * Cancel contract
   */
  async cancelContract(
    contractId: number,
    cancellationReason: string
  ): Promise<Contract> {
    const endpoint = API_ENDPOINTS.CONTRACTS.CANCEL(contractId);
    const response = await apiClient.patch<Contract>(endpoint, { cancellation_reason: cancellationReason });
    return validateResponse<Contract>(response);
  }

  /**
   * Get cancelled contracts
   */
  async getCancelledContracts(): Promise<Contract[]> {
    const response = await apiClient.get<Contract[]>(API_ENDPOINTS.CONTRACTS.CANCELLED);
    return validateResponse<Contract[]>(response);
  }

  /**
   * Uncancel contract
   */
  async uncancelContract(contractId: number): Promise<Contract> {
    const endpoint = API_ENDPOINTS.CONTRACTS.UNCANCEL(contractId);
    const response = await apiClient.patch<Contract>(endpoint, {});
    return validateResponse<Contract>(response);
  }

  /**
   * Get contracts with pending assignments
   */
  async getPendingAssignments(): Promise<ContractWithDetails[]> {
    const endpoint = API_ENDPOINTS.CONTRACTS.PENDING_ASSIGNMENTS || '/contracts/pending-assignments';
    const response = await apiClient.get<ContractWithDetails[]>(endpoint);
    return validateResponse<ContractWithDetails[]>(response);
  }

  /**
   * Get completed contracts
   */
  async getCompletedContracts(): Promise<ContractWithDetails[]> {
    const endpoint = API_ENDPOINTS.CONTRACTS.COMPLETED || '/contracts/completed';
    const response = await apiClient.get<ContractWithDetails[]>(endpoint);
    return validateResponse<ContractWithDetails[]>(response);
  }

  /**
   * Record money received from driver (returns a MoneyReceipt record)
   */
  async receiveMoneyFromDriver(
    contractId: number,
    data: { amount_received: number; received_date: string; notes?: string }
  ): Promise<{ success: boolean; contract_id: number; money_receipt: { money_receipt_id: number; amount: number; received_date: string; received_by: { user_id: number }; notes?: string } }> {
    const endpoint = `/contracts/${contractId}/receive-money`;
    const response = await apiClient.post<any>(endpoint, data);
    return validateResponse<any>(response);
  }

  /**
   * Pay drivers for a contract
   */
  async payDrivers(
    contractId: number,
    data: { payments: { driver_id: number; driver_type: 'internal' | 'external'; amount: number }[]; payment_date: string }
  ): Promise<any> {
    const endpoint = `/contracts/${contractId}/pay-drivers`;
    const response = await apiClient.post<any>(endpoint, data);
    return validateResponse<any>(response);
  }

  /**
   * Get contracts for a driver (mobile dashboard)
   */
  async getDriverContracts(driverId: number): Promise<any> {
    const endpoint = `/contracts/driver/${driverId}`;
    const response = await apiClient.get<any>(endpoint);
    return validateResponse<any>(response);
  }
}

// Export singleton instance
export const contractsService = new ContractsService();
