/**
 * Vehicles Service
 * 
 * Handles vehicle-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';
import type { Vehicle } from '@/app/backend_models/vehicle.model';

export interface CreateVehicleRequest {
  alias: string;
  type: string;
  license_plate: string;
  max_capacity?: number;
  notes?: string;
}

export interface UpdateVehicleRequest {
  alias?: string;
  type?: string;
  license_plate?: string;
  max_capacity?: number;
  notes?: string;
}

export interface VehicleStatus {
  status_id: number;
  name: string;
  description?: string;
}

class VehiclesService {
  /**
   * Get all vehicles
   */
  async getAll(): Promise<Vehicle[]> {
    const response = await apiClient.get<Vehicle[]>(API_ENDPOINTS.VEHICLES.BASE);
    return validateResponse<Vehicle[]>(response);
  }

  /**
   * Get vehicle by ID
   */
  async getById(vehicleId: number): Promise<Vehicle> {
    const endpoint = API_ENDPOINTS.VEHICLES.BY_ID(vehicleId);
    const response = await apiClient.get<Vehicle>(endpoint);
    return validateResponse<Vehicle>(response);
  }

  /**
   * Create new vehicle
   */
  async create(data: CreateVehicleRequest): Promise<Vehicle> {
    const response = await apiClient.post<Vehicle>(
      API_ENDPOINTS.VEHICLES.BASE,
      data
    );
    return validateResponse<Vehicle>(response);
  }

  /**
   * Update existing vehicle
   */
  async update(vehicleId: number, data: UpdateVehicleRequest): Promise<Vehicle> {
    const endpoint = API_ENDPOINTS.VEHICLES.BY_ID(vehicleId);
    const response = await apiClient.patch<Vehicle>(endpoint, data);
    return validateResponse<Vehicle>(response);
  }

  /**
   * Delete vehicle
   */
  async delete(vehicleId: number): Promise<boolean> {
    const endpoint = API_ENDPOINTS.VEHICLES.BY_ID(vehicleId);
    const response = await apiClient.delete<{ deleted: boolean }>(endpoint);
    const data = validateResponse<{ deleted: boolean }>(response);
    return data.deleted;
  }

  /**
   * Search vehicles
   */
  async search(query: string): Promise<Vehicle[]> {
    const endpoint = `${API_ENDPOINTS.VEHICLES.SEARCH}?q=${encodeURIComponent(query)}`;
    const response = await apiClient.get<Vehicle[]>(endpoint);
    return validateResponse<Vehicle[]>(response);
  }

  /**
   * Get available vehicles
   */
  async getAvailable(): Promise<Vehicle[]> {
    const response = await apiClient.get<Vehicle[]>(API_ENDPOINTS.VEHICLES.AVAILABLE);
    return validateResponse<Vehicle[]>(response);
  }

  /**
   * Get vehicle statuses
   */
  async getStatuses(): Promise<VehicleStatus[]> {
    const response = await apiClient.get<VehicleStatus[]>(API_ENDPOINTS.VEHICLES.STATUS);
    return validateResponse<VehicleStatus[]>(response);
  }
}

// Export singleton instance
export const vehiclesService = new VehiclesService();
