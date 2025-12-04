/**
 * Reference Service
 * 
 * Handles reference data API calls (clients, places, drivers, vehicles)
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';
import type { Client, Contact } from '@/app/backend_models/client.model';
import type { Place } from '@/app/backend_models/place.model';
import type { Vehicle } from '@/app/backend_models/vehicle.model';
import type { User } from '@/app/backend_models/user.model';
import type { PaymentType } from '@/app/backend_models/payment.model';

// Prefillable data response
export interface PrefillableData {
  drivers: DriverReference[];
  vehicles: VehicleReference[];
  payment_types: PaymentTypeReference[];
  client_types: ClientTypeReference[];
  contract_statuses: ContractStatusReference[];
  trip_statuses: TripStatusReference[];
  coordinators?: UserReference[];
}

// API response types for reference data
export interface ClientReference {
  client_id: number;
  name: string;
  client_type_id?: number;
  client_type_name?: string;
  comments?: string;
}

export interface ClientWithContacts extends ClientReference {
  contacts?: Contact[];
  primary_contact?: Contact;
}

export interface PlaceReference {
  id?: number;
  nombre?: string;
  place_id?: number;
  name?: string;
  address?: string;
  number?: string;
  colonia?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  annotations?: string;
}

export interface PaymentTypeReference {
  payment_type_id: number;
  name: string;
  notes?: string;
}

export interface ClientTypeReference {
  client_type_id: number;
  name: string;
  description?: string;
}

export interface ContractStatusReference {
  contract_status_id: number;
  name: string;
  description?: string;
}

export interface TripStatusReference {
  contract_trip_status_id: number;
  name: string;
  description?: string;
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

export interface UserReference {
  user_id: number;
  name: string;
  first_lastname?: string;
  second_lastname?: string;
  email?: string;
}

class ReferenceService {
  /**
   * Get prefillable data for forms (drivers, vehicles, payment types, client types, etc.)
   */
  async getPrefillableData(): Promise<PrefillableData> {
    const response = await apiClient.get<PrefillableData>(
      API_ENDPOINTS.SYSTEM.PREFILLABLE_DATA
    );
    return validateResponse<PrefillableData>(response);
  }

  /**
   * Search clients by name
   */
  async searchClients(query: string): Promise<ClientWithContacts[]> {
    const response = await apiClient.get<ClientWithContacts[]>(
      `${API_ENDPOINTS.CLIENTS.SEARCH}?q=${encodeURIComponent(query)}`
    );
    return validateResponse<ClientWithContacts[]>(response);
  }

  /**
   * Search places by name
   */
  async searchPlaces(query: string): Promise<PlaceReference[]> {
    const response = await apiClient.get<PlaceReference[]>(
      `${API_ENDPOINTS.PLACES.SEARCH}?q=${encodeURIComponent(query)}`
    );
    return validateResponse<PlaceReference[]>(response);
  }

  /**
   * Get client by ID with contacts
   */
  async getClientById(clientId: number): Promise<ClientWithContacts> {
    // Fetch both client data and contacts
    const [clientResponse, contactsResponse] = await Promise.all([
      apiClient.get<Client>(API_ENDPOINTS.CLIENTS.BY_ID(clientId)),
      apiClient.get<Contact[]>(API_ENDPOINTS.CLIENTS.CONTACTS(clientId))
    ]);
    
    const client = validateResponse<Client>(clientResponse);
    const contacts = validateResponse<Contact[]>(contactsResponse);
    
    // Find primary contact
    const primary_contact = contacts.find(c => c.is_primary) || contacts[0];
    
    return {
      ...client,
      contacts,
      primary_contact
    };
  }

  /**
   * Get place by ID
   */
  async getPlaceById(placeId: number): Promise<PlaceReference> {
    const response = await apiClient.get<PlaceReference>(
      API_ENDPOINTS.PLACES.BY_ID(placeId)
    );
    return validateResponse<PlaceReference>(response);
  }

  /**
   * Create new client
   */
  async createClient(data: {
    client_type_id: number;
    name: string;
    comments?: string;
  }): Promise<Client> {
    const response = await apiClient.post<Client>(
      API_ENDPOINTS.CLIENTS.CREATE,
      data
    );
    return validateResponse<Client>(response);
  }

  /**
   * Create new place
   */
  async createPlace(data: {
    name: string;
    address?: string;
    number?: string;
    colonia?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    annotations?: string;
  }): Promise<Place> {
    const response = await apiClient.post<Place>(
      API_ENDPOINTS.PLACES.BASE,
      data
    );
    return validateResponse<Place>(response);
  }

  /**
   * Create new contact for client
   */
  async createClientContact(clientId: number, contactData: {
    name: string;
    first_lastname: string;
    second_lastname?: string;
    country_code?: string;
    phone?: string;
    email?: string;
    is_whatsapp_available: boolean;
    role?: string;
    is_primary: boolean;
    comments?: string;
  }): Promise<Contact> {
    const response = await apiClient.post<Contact>(
      API_ENDPOINTS.CLIENTS.ADD_CONTACT(clientId),
      contactData
    );
    return validateResponse<Contact>(response);
  }

  /**
   * Update place
   */
  async updatePlace(placeId: number, data: Partial<Place>): Promise<Place> {
    const response = await apiClient.patch<Place>(
      API_ENDPOINTS.PLACES.BY_ID(placeId),
      data
    );
    return validateResponse<Place>(response);
  }

  /**
   * Get all clients
   */
  async getClients(): Promise<ClientReference[]> {
    const response = await apiClient.get<ClientReference[]>(
      API_ENDPOINTS.CLIENTS.BASE
    );
    return validateResponse<ClientReference[]>(response);
  }

  /**
   * Get all places/locations
   */
  async getPlaces(): Promise<PlaceReference[]> {
    const response = await apiClient.get<PlaceReference[]>(
      API_ENDPOINTS.PLACES.BASE
    );
    return validateResponse<PlaceReference[]>(response);
  }

  /**
   * Get all drivers
   */
  async getDrivers(): Promise<DriverReference[]> {
    const response = await apiClient.get<DriverReference[]>(
      API_ENDPOINTS.DRIVERS.BASE
    );
    return validateResponse<DriverReference[]>(response);
  }

  /**
   * Get all vehicles
   */
  async getVehicles(): Promise<VehicleReference[]> {
    const response = await apiClient.get<VehicleReference[]>(
      API_ENDPOINTS.VEHICLES.BASE
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
      value: (place.place_id || place.id)?.toString() || '',
      label: place.name || place.nombre || '',
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
  transformVehiclesForSelect(vehicles: VehicleReference[]): Array<{ value: string; label: string; licensePlate?: string }> {
    return vehicles.map(vehicle => ({
      value: (vehicle.vehicle_id || vehicle.id).toString(),
      label: vehicle.alias 
        ? `${vehicle.alias} (${vehicle.license_plate || vehicle.placa})`
        : `${vehicle.type || vehicle.tipo} - ${vehicle.license_plate || vehicle.placa}`,
      licensePlate: vehicle.license_plate || vehicle.placa,
    }));
  }

  /**
   * Transform payment types for select dropdown
   */
  transformPaymentTypesForSelect(paymentTypes: PaymentTypeReference[]): Array<{ value: string; label: string }> {
    return paymentTypes.map(type => ({
      value: type.payment_type_id.toString(),
      label: type.name,
    }));
  }

  /**
   * Transform client types for select dropdown
   */
  transformClientTypesForSelect(clientTypes: ClientTypeReference[]): Array<{ value: string; label: string }> {
    return clientTypes.map(type => ({
      value: type.client_type_id.toString(),
      label: type.name,
    }));
  }
}

// Export singleton instance
export const referenceService = new ReferenceService();
