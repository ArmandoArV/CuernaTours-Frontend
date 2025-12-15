/**
 * Driver Receipts Service
 * 
 * Handles driver receipt-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';

export interface DriverReceipt {
  receipt_id: number;
  driver_id: number;
  trip_id?: number;
  amount: number;
  receipt_date: Date;
  receipt_number?: string;
  notes?: string;
  created_at: Date;
}

export interface CreateDriverReceiptRequest {
  driver_id: number;
  trip_id?: number;
  amount: number;
  receipt_date: string;
  receipt_number?: string;
  notes?: string;
}

export interface UpdateDriverReceiptRequest {
  amount?: number;
  receipt_date?: string;
  receipt_number?: string;
  notes?: string;
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
