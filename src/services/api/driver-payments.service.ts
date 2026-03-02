/**
 * Driver Payments Service
 * 
 * Handles driver payment-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { DriverPayment, CreateDriverPaymentData, DriverPaymentWithDetails } from '@/app/backend_models/driver-payment.model';

class DriverPaymentsService {
  /**
   * Get driver payment by ID
   */
  async getById(paymentId: number): Promise<DriverPayment> {
    const endpoint = API_ENDPOINTS.DRIVER_PAYMENTS.BY_ID(paymentId);
    const response = await apiClient.get<DriverPayment>(endpoint);
    return validateResponse<DriverPayment>(response);
  }

  /**
   * Get driver payments by trip ID
   */
  async getByTrip(tripId: number): Promise<DriverPayment[]> {
    const endpoint = API_ENDPOINTS.DRIVER_PAYMENTS.BY_TRIP(tripId);
    const response = await apiClient.get<DriverPayment[]>(endpoint);
    return validateResponse<DriverPayment[]>(response);
  }

  /**
   * Create new driver payment
   */
  async create(data: CreateDriverPaymentData): Promise<DriverPayment> {
    const response = await apiClient.post<DriverPayment>(
      API_ENDPOINTS.DRIVER_PAYMENTS.BASE,
      data
    );
    return validateResponse<DriverPayment>(response);
  }

  /**
   * Mark payment as paid
   */
  async markPaid(paymentId: number): Promise<DriverPayment> {
    const endpoint = API_ENDPOINTS.DRIVER_PAYMENTS.MARK_PAID(paymentId);
    const response = await apiClient.patch<DriverPayment>(endpoint, {});
    return validateResponse<DriverPayment>(response);
  }
}

// Export singleton instance
export const driverPaymentsService = new DriverPaymentsService();
