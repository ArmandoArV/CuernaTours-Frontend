/**
 * Driver Receipts Service
 * 
 * Handles driver receipt-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { DriverReceipt } from '@/app/backend_models/payment.model';

export interface CreateDriverReceiptRequest {
  driver_id: number;
  contract_trip_id: number;
  amount_received: number;
  payment_method: 'cash' | 'card' | 'transfer';
  received_date: string;
  notes?: string;
}

export interface UpdateDriverReceiptRequest {
  amount_received?: number;
  payment_method?: 'cash' | 'card' | 'transfer';
  received_date?: string;
  notes?: string;
  verification_status?: 'pending' | 'verified' | 'discrepancy';
  discrepancy_notes?: string;
}

class DriverReceiptsService {
  /**
   * Get all driver receipts
   */
  async getAll(): Promise<DriverReceipt[]> {
    const response = await apiClient.get<DriverReceipt[]>(API_ENDPOINTS.DRIVER_RECEIPTS.BASE);
    return validateResponse<DriverReceipt[]>(response);
  }

  /**
   * Get driver receipt by ID
   */
  async getById(receiptId: number): Promise<DriverReceipt> {
    const endpoint = API_ENDPOINTS.DRIVER_RECEIPTS.BY_ID(receiptId);
    const response = await apiClient.get<DriverReceipt>(endpoint);
    return validateResponse<DriverReceipt>(response);
  }

  /**
   * Get unverified receipts
   */
  async getUnverified(): Promise<DriverReceipt[]> {
    const response = await apiClient.get<DriverReceipt[]>(API_ENDPOINTS.DRIVER_RECEIPTS.UNVERIFIED);
    return validateResponse<DriverReceipt[]>(response);
  }

  /**
   * Get receipts by driver
   */
  async getByDriver(driverId: number): Promise<DriverReceipt[]> {
    const endpoint = API_ENDPOINTS.DRIVER_RECEIPTS.BY_DRIVER(driverId);
    const response = await apiClient.get<DriverReceipt[]>(endpoint);
    return validateResponse<DriverReceipt[]>(response);
  }

  /**
   * Get receipts by trip
   */
  async getByTrip(tripId: number): Promise<DriverReceipt[]> {
    const endpoint = API_ENDPOINTS.DRIVER_RECEIPTS.BY_TRIP(tripId);
    const response = await apiClient.get<DriverReceipt[]>(endpoint);
    return validateResponse<DriverReceipt[]>(response);
  }

  /**
   * Get receipts by status
   */
  async getByStatus(status: string): Promise<DriverReceipt[]> {
    const endpoint = API_ENDPOINTS.DRIVER_RECEIPTS.BY_STATUS(status);
    const response = await apiClient.get<DriverReceipt[]>(endpoint);
    return validateResponse<DriverReceipt[]>(response);
  }

  /**
   * Get receipt with details
   */
  async getWithDetails(receiptId: number): Promise<DriverReceipt> {
    const endpoint = API_ENDPOINTS.DRIVER_RECEIPTS.DETAILS(receiptId);
    const response = await apiClient.get<DriverReceipt>(endpoint);
    return validateResponse<DriverReceipt>(response);
  }

  /**
   * Create new driver receipt
   */
  async create(data: CreateDriverReceiptRequest): Promise<DriverReceipt> {
    const response = await apiClient.post<DriverReceipt>(
      API_ENDPOINTS.DRIVER_RECEIPTS.BASE,
      data
    );
    return validateResponse<DriverReceipt>(response);
  }

  /**
   * Update existing driver receipt
   */
  async update(receiptId: number, data: UpdateDriverReceiptRequest): Promise<DriverReceipt> {
    const endpoint = API_ENDPOINTS.DRIVER_RECEIPTS.BY_ID(receiptId);
    const response = await apiClient.patch<DriverReceipt>(endpoint, data);
    return validateResponse<DriverReceipt>(response);
  }

  /**
   * Verify receipt
   */
  async verify(receiptId: number): Promise<DriverReceipt> {
    const endpoint = API_ENDPOINTS.DRIVER_RECEIPTS.VERIFY(receiptId);
    const response = await apiClient.patch<DriverReceipt>(endpoint, {});
    return validateResponse<DriverReceipt>(response);
  }

  /**
   * Delete driver receipt
   */
  async delete(receiptId: number): Promise<boolean> {
    const endpoint = API_ENDPOINTS.DRIVER_RECEIPTS.BY_ID(receiptId);
    const response = await apiClient.delete<{ deleted: boolean }>(endpoint);
    const data = validateResponse<{ deleted: boolean }>(response);
    return data.deleted;
  }
}

// Export singleton instance
export const driverReceiptsService = new DriverReceiptsService();
