/**
 * Trips Service
 * 
 * Handles trip-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';
import type { ContractTrip } from '@/app/backend_models/trip.model';

export interface CreateTripRequest {
  contract_id: number;
  service_date: string; // YYYY-MM-DD
  origin_id: number;
  origin_time: string; // HH:mm:ss or HH:mm
  destination_id: number;
  passengers: number;
  unit_type?: string;
  vehicle_id?: number;
  driver_id?: number;
  external_driver_id?: number;
  flight_id?: number;
  observations?: string;
  internal_observations?: string;
  contract_trip_status_id?: number;
}

export interface UpdateTripRequest {
  service_date?: string;
  origin_id?: number;
  origin_time?: string;
  destination_id?: number;
  passengers?: number;
  unit_type?: string;
  vehicle_id?: number;
  driver_id?: number;
  external_driver_id?: number;
  observations?: string;
  internal_observations?: string;
  contract_trip_status_id?: number;
}

export interface AssignDriverRequest {
  driver_id?: number;
  external_driver_id?: number;
}

export interface TripPaymentRequest {
  amount: number;
  payment_method: string;
  notes?: string;
}

class TripsService {
  /**
   * Create new trip
   */
  async create(data: CreateTripRequest): Promise<ContractTrip> {
    const response = await apiClient.post<ContractTrip>(
      API_ENDPOINTS.TRIPS.CREATE,
      data
    );
    return validateResponse<ContractTrip>(response);
  }

  /**
   * Get trip by ID
   */
  async getById(tripId: number): Promise<ContractTrip> {
    const endpoint = API_ENDPOINTS.TRIPS.BY_ID(tripId);
    const response = await apiClient.get<ContractTrip>(endpoint);
    return validateResponse<ContractTrip>(response);
  }

  /**
   * Update existing trip
   */
  async update(tripId: number, data: UpdateTripRequest): Promise<ContractTrip> {
    const endpoint = API_ENDPOINTS.TRIPS.BY_ID(tripId);
    const response = await apiClient.post<ContractTrip>(endpoint, data);
    return validateResponse<ContractTrip>(response);
  }

  /**
   * Delete trip
   */
  async delete(tripId: number): Promise<boolean> {
    const endpoint = API_ENDPOINTS.TRIPS.BY_ID(tripId);
    const response = await apiClient.delete<{ deleted: boolean }>(endpoint);
    const data = validateResponse<{ deleted: boolean }>(response);
    return data.deleted;
  }

  /**
   * Assign driver to trip
   */
  async assignDriver(
    tripId: number,
    driverData: AssignDriverRequest
  ): Promise<ContractTrip> {
    const endpoint = API_ENDPOINTS.TRIPS.ASSIGN_DRIVER(tripId);
    const response = await apiClient.post<ContractTrip>(endpoint, driverData);
    return validateResponse<ContractTrip>(response);
  }

  /**
   * Update trip status
   */
  async updateStatus(
    tripId: number,
    statusId: number
  ): Promise<ContractTrip> {
    return this.update(tripId, { contract_trip_status_id: statusId });
  }

  /**
   * Bulk create trips for a contract
   */
  async createMultiple(trips: CreateTripRequest[]): Promise<ContractTrip[]> {
    const promises = trips.map(trip => this.create(trip));
    return Promise.all(promises);
  }

  /**
   * Get all trips
   */
  async getAll(options?: any): Promise<ContractTrip[]> {
    let endpoint = API_ENDPOINTS.TRIPS.BASE;
    
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

    const response = await apiClient.get<ContractTrip[]>(endpoint);
    return validateResponse<ContractTrip[]>(response);
  }

  /**
   * Assign driver and/or vehicle to a trip
   */
  async assignTripResources(
    tripId: number,
    driverId?: number | null,
    vehicleId?: number | null,
    externalDriverId?: number | null
  ): Promise<ContractTrip> {
    // Check if a specific assign-resources endpoint exists, otherwise fallback to update
    const endpoint = API_ENDPOINTS.TRIPS.ASSIGN_RESOURCES(tripId);
    
    const data: any = {};
    if (driverId !== undefined) data.driver_id = driverId;
    if (vehicleId !== undefined) data.vehicle_id = vehicleId;
    // Handle external driver separately if needed or part of same payload
    if (externalDriverId !== undefined) data.external_driver_id = externalDriverId;

    // Use PUT if it's a standard update, or POST if it's a specific action
    // Assuming update (PUT) for generic ID endpoint, POST for action
    const response = await apiClient.post<ContractTrip>(endpoint, data);
    return validateResponse<ContractTrip>(response);
  }

  /**
   * Get all trip statuses
   */
  async getAllTripStatuses(): Promise<any[]> {
    const response = await apiClient.get<any[]>(API_ENDPOINTS.TRIPS.STATUSES);
    return validateResponse<any[]>(response);
  }

  /**
   * Get all flights
   */
  async getAllFlights(options?: any): Promise<any[]> {
    let endpoint = API_ENDPOINTS.TRIPS.FLIGHTS;
    
    if (options) {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }

    const response = await apiClient.get<any[]>(endpoint);
    return validateResponse<any[]>(response);
  }

  /**
   * Get trips by external driver ID
   */
  async getTripsByExternalDriverId(externalDriverId: number): Promise<ContractTrip[]> {
    const endpoint = API_ENDPOINTS.TRIPS.BY_EXTERNAL_DRIVER(externalDriverId);
    const response = await apiClient.get<ContractTrip[]>(endpoint);
    return validateResponse<ContractTrip[]>(response);
  }
}

// Export singleton instance
export const tripsService = new TripsService();
