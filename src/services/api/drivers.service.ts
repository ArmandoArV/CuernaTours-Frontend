/**
 * Drivers Service
 * 
 * Handles driver-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';

export interface Driver {
  user_id: number;
  name: string;
  first_lastname: string;
  second_lastname?: string;
  phone?: string;
  country_code?: string;
  email?: string;
}

export interface DriverPayment {
  payment_id: number;
  driver_id: number;
  trip_id?: number;
  amount: number;
  payment_date: Date;
  payment_method: string;
  notes?: string;
}

export interface DriverSpending {
  spending_id: number;
  driver_id: number;
  amount: number;
  spending_date: Date;
  category: string;
  description?: string;
}

export interface CreateDriverPaymentRequest {
  trip_id?: number;
  amount: number;
  payment_method: string;
  notes?: string;
}

class DriversService {
  /**
   * Get all drivers
   */
  async getAll(): Promise<Driver[]> {
    const response = await apiClient.get<Driver[]>(API_ENDPOINTS.DRIVERS.BASE);
    return validateResponse<Driver[]>(response);
  }

  /**
   * Get driver by ID
   */
  async getById(driverId: number): Promise<Driver> {
    const endpoint = API_ENDPOINTS.DRIVERS.BY_ID(driverId);
    const response = await apiClient.get<Driver>(endpoint);
    return validateResponse<Driver>(response);
  }

  /**
   * Get driver payments
   */
  async getPayments(driverId: number): Promise<DriverPayment[]> {
    const endpoint = API_ENDPOINTS.DRIVERS.PAYMENTS(driverId);
    const response = await apiClient.get<DriverPayment[]>(endpoint);
    return validateResponse<DriverPayment[]>(response);
  }

  /**
   * Create driver payment
   */
  async createPayment(driverId: number, data: CreateDriverPaymentRequest): Promise<DriverPayment> {
    const endpoint = API_ENDPOINTS.DRIVERS.PAYMENTS(driverId);
    const response = await apiClient.post<DriverPayment>(endpoint, data);
    return validateResponse<DriverPayment>(response);
  }

  /**
   * Get driver spendings
   */
  async getSpendings(driverId: number): Promise<DriverSpending[]> {
    const endpoint = API_ENDPOINTS.DRIVERS.SPENDINGS(driverId);
    const response = await apiClient.get<DriverSpending[]>(endpoint);
    return validateResponse<DriverSpending[]>(response);
  }

  /**
   * Search drivers
   */
  async search(query: string): Promise<Driver[]> {
    const endpoint = `${API_ENDPOINTS.DRIVERS.SEARCH}?q=${encodeURIComponent(query)}`;
    const response = await apiClient.get<Driver[]>(endpoint);
    return validateResponse<Driver[]>(response);
  }

  /**
   * Get available drivers
   */
  async getAvailable(): Promise<Driver[]> {
    const response = await apiClient.get<Driver[]>(API_ENDPOINTS.DRIVERS.AVAILABLE);
    return validateResponse<Driver[]>(response);
  }
}

// Export singleton instance
export const driversService = new DriversService();
