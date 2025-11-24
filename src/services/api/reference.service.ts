/**
 * Reference Service
 * 
 * Handles reference data API calls (clients, places, drivers, vehicles)
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';
import type { Client } from '@/app/backend_models/client.model';
import type { Place } from '@/app/backend_models/place.model';
import type { Vehicle } from '@/app/backend_models/vehicle.model';
import type { User } from '@/app/backend_models/user.model';

// API response types for reference data
export interface ClientReference {
  client_id: number;
  name: string;
  client_type_id?: number;
  client_type_name?: string;
}

export interface PlaceReference {
  id: number;
  nombre: string;
  place_id?: number;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
}

export interface DriverReference {
  id: number;
  nombre: string;
  user_id?: number;
  name?: string;
  first_lastname?: string;
  phone?: string;
  country_code?: string;
}

export interface VehicleReference {
  id: number;
  tipo: string;
  placa: string;
  vehicle_id?: number;
  alias?: string;
  type?: string;
  license_plate?: string;
  max_capacity?: number;
}

class ReferenceService {
  /**
   * Get all clients
   */
  async getClients(): Promise<ClientReference[]> {
    const response = await apiClient.get<ClientReference[]>(
      API_ENDPOINTS.REFERENCE.CLIENTS
    );
    return validateResponse<ClientReference[]>(response);
  }

  /**
   * Get all places/locations
   */
  async getPlaces(): Promise<PlaceReference[]> {
    const response = await apiClient.get<PlaceReference[]>(
      API_ENDPOINTS.REFERENCE.PLACES
    );
    return validateResponse<PlaceReference[]>(response);
  }

  /**
   * Get all drivers
   */
  async getDrivers(): Promise<DriverReference[]> {
    const response = await apiClient.get<DriverReference[]>(
      API_ENDPOINTS.REFERENCE.DRIVERS
    );
    return validateResponse<DriverReference[]>(response);
  }

  /**
   * Get all vehicles
   */
  async getVehicles(): Promise<VehicleReference[]> {
    const response = await apiClient.get<VehicleReference[]>(
      API_ENDPOINTS.REFERENCE.VEHICLES
    );
    return validateResponse<VehicleReference[]>(response);
  }

  /**
   * Get all reference data at once
   */
  async getAll(): Promise<{
    clients: ClientReference[];
    places: PlaceReference[];
    drivers: DriverReference[];
    vehicles: VehicleReference[];
  }> {
    const [clients, places, drivers, vehicles] = await Promise.all([
      this.getClients(),
      this.getPlaces(),
      this.getDrivers(),
      this.getVehicles(),
    ]);

    return { clients, places, drivers, vehicles };
  }

  /**
   * Transform clients for select dropdown
   */
  transformClientsForSelect(clients: ClientReference[]): Array<{ value: string; label: string }> {
    return clients.map(client => ({
      value: client.client_id.toString(),
      label: client.name,
    }));
  }

  /**
   * Transform places for select dropdown
   */
  transformPlacesForSelect(places: PlaceReference[]): Array<{ value: string; label: string }> {
    return places.map(place => ({
      value: (place.place_id || place.id).toString(),
      label: place.name || place.nombre,
    }));
  }

  /**
   * Transform drivers for select dropdown
   */
  transformDriversForSelect(drivers: DriverReference[]): Array<{ value: string; label: string }> {
    return drivers.map(driver => ({
      value: (driver.user_id || driver.id).toString(),
      label: driver.name 
        ? `${driver.name} ${driver.first_lastname || ''}`.trim()
        : driver.nombre,
    }));
  }

  /**
   * Transform vehicles for select dropdown
   */
  transformVehiclesForSelect(vehicles: VehicleReference[]): Array<{ value: string; label: string }> {
    return vehicles.map(vehicle => ({
      value: (vehicle.vehicle_id || vehicle.id).toString(),
      label: vehicle.alias 
        ? `${vehicle.alias} (${vehicle.license_plate || vehicle.placa})`
        : `${vehicle.type || vehicle.tipo} - ${vehicle.license_plate || vehicle.placa}`,
    }));
  }
}

// Export singleton instance
export const referenceService = new ReferenceService();
