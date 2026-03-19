/**
 * Vales Service
 *
 * Handles vale (voucher) related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';

export type ValeStatus = 'pending' | 'paid' | 'denied';
export type ValePaymentType = 'Efectivo' | 'Transferencia';
export type ValeDecisionAction = 'paid' | 'denied';

export interface Vale {
  vale_id: number;
  driver_id: number;
  amount: number;
  request_notes?: string;
  created_by: number;
  created_at: string;
  status: ValeStatus;
  payment_type: ValePaymentType | null;
  decided_by?: number;
  decision_notes?: string;
}

export interface ValeWithDetails extends Vale {
  driver_name?: string;
  created_by_name?: string;
  decided_by_name?: string;
}

export interface RequestValeData {
  amount: number;
  request_notes?: string;
}

export interface AssignValeData {
  driver_id: number;
  amount: number;
  payment_type: ValePaymentType;
  decision_notes?: string;
}

export interface DecideValeData {
  action: ValeDecisionAction;
  payment_type?: ValePaymentType;
  decision_notes?: string;
}

class ValesService {
  /**
   * Get all vales (admin view, supports filters)
   */
  async getAll(filters?: { status?: ValeStatus; driver_id?: number }): Promise<ValeWithDetails[]> {
    let endpoint = API_ENDPOINTS.VALES.BASE;
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.driver_id) params.append('driver_id', String(filters.driver_id));
    const qs = params.toString();
    if (qs) endpoint += `?${qs}`;

    const response = await apiClient.get<ValeWithDetails[]>(endpoint);
    return validateResponse<ValeWithDetails[]>(response);
  }

  /**
   * Get pending vales (admin view)
   */
  async getPending(): Promise<ValeWithDetails[]> {
    const response = await apiClient.get<ValeWithDetails[]>(API_ENDPOINTS.VALES.PENDING);
    return validateResponse<ValeWithDetails[]>(response);
  }

  /**
   * Get vales for a specific driver
   */
  async getByDriver(driverId: number): Promise<ValeWithDetails[]> {
    const response = await apiClient.get<ValeWithDetails[]>(API_ENDPOINTS.VALES.BY_DRIVER(driverId));
    return validateResponse<ValeWithDetails[]>(response);
  }

  /**
   * Get a single vale by ID
   */
  async getById(id: number): Promise<ValeWithDetails> {
    const response = await apiClient.get<ValeWithDetails>(API_ENDPOINTS.VALES.BY_ID(id));
    return validateResponse<ValeWithDetails>(response);
  }

  /**
   * Driver requests a new vale (status starts as 'pending')
   */
  async requestVale(data: RequestValeData): Promise<Vale> {
    const response = await apiClient.post<Vale>(API_ENDPOINTS.VALES.CREATE, data);
    return validateResponse<Vale>(response);
  }

  /**
   * Admin assigns a vale directly (instant 'paid' status)
   */
  async assignVale(data: AssignValeData): Promise<Vale> {
    const response = await apiClient.post<Vale>(API_ENDPOINTS.VALES.ASSIGN, data);
    return validateResponse<Vale>(response);
  }

  /**
   * Admin decides on a pending vale (mark as 'paid' or 'denied')
   */
  async decideVale(id: number, data: DecideValeData): Promise<Vale> {
    const response = await apiClient.patch<Vale>(API_ENDPOINTS.VALES.DECIDE(id), data);
    return validateResponse<Vale>(response);
  }

  /**
   * Delete a pending vale
   */
  async deleteVale(id: number): Promise<void> {
    const response = await apiClient.delete<void>(API_ENDPOINTS.VALES.BY_ID(id));
    return validateResponse<void>(response);
  }
}

export const valesService = new ValesService();
