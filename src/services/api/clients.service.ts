/**
 * Clients Service
 * 
 * Handles client-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';
import type { Client } from '@/app/backend_models/client.model';
import type { Contact } from '@/app/backend_models/client.model';

export interface CreateClientRequest {
  client_type_id: number;
  name: string;
  comments?: string;
}

export interface UpdateClientRequest {
  client_type_id?: number;
  name?: string;
  comments?: string;
}

export interface ClientWithContacts extends Client {
  contacts?: Contact[];
  primary_contact?: Contact;
}

export interface CreateContactRequest {
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
}

class ClientsService {
  /**
   * Get all clients
   */
  async getAll(): Promise<Client[]> {
    const response = await apiClient.get<Client[]>(API_ENDPOINTS.CLIENTS.BASE);
    return validateResponse<Client[]>(response);
  }

  /**
   * Get client by ID with contacts
   */
  async getById(clientId: number): Promise<ClientWithContacts> {
    const endpoint = API_ENDPOINTS.CLIENTS.BY_ID(clientId);
    const response = await apiClient.get<ClientWithContacts>(endpoint);
    return validateResponse<ClientWithContacts>(response);
  }

  /**
   * Search clients by name
   */
  async search(query: string): Promise<ClientWithContacts[]> {
    const endpoint = `${API_ENDPOINTS.CLIENTS.SEARCH}?q=${encodeURIComponent(query)}`;
    const response = await apiClient.get<ClientWithContacts[]>(endpoint);
    return validateResponse<ClientWithContacts[]>(response);
  }

  /**
   * Create new client
   */
  async create(data: CreateClientRequest): Promise<Client> {
    const response = await apiClient.post<Client>(
      API_ENDPOINTS.CLIENTS.CREATE,
      data
    );
    return validateResponse<Client>(response);
  }

  /**
   * Update existing client
   */
  async update(clientId: number, data: UpdateClientRequest): Promise<Client> {
    const endpoint = API_ENDPOINTS.CLIENTS.BY_ID(clientId);
    const response = await apiClient.put<Client>(endpoint, data);
    return validateResponse<Client>(response);
  }

  /**
   * Delete client
   */
  async delete(clientId: number): Promise<boolean> {
    const endpoint = API_ENDPOINTS.CLIENTS.BY_ID(clientId);
    const response = await apiClient.delete<{ deleted: boolean }>(endpoint);
    const data = validateResponse<{ deleted: boolean }>(response);
    return data.deleted;
  }

  /**
   * Get client contacts
   */
  async getContacts(clientId: number): Promise<Contact[]> {
    const endpoint = API_ENDPOINTS.CLIENTS.CONTACTS(clientId);
    const response = await apiClient.get<Contact[]>(endpoint);
    return validateResponse<Contact[]>(response);
  }

  /**
   * Add contact to client
   */
  async addContact(clientId: number, contactData: CreateContactRequest): Promise<Contact> {
    const endpoint = API_ENDPOINTS.CLIENTS.ADD_CONTACT(clientId);
    const response = await apiClient.post<Contact>(endpoint, contactData);
    return validateResponse<Contact>(response);
  }
}

// Export singleton instance
export const clientsService = new ClientsService();
