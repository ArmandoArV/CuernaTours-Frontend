/**
 * Users Service
 * 
 * Handles user-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';
import type { User } from '@/app/backend_models/user.model';
import type { Contact } from '@/app/backend_models/client.model';

export interface CreateUserRequest {
  name: string;
  first_lastname: string;
  second_lastname?: string;
  email: string;
  password: string;
  role_id: number;
  area_id?: number;
  country_code?: string;
  phone?: string;
}

export interface UpdateUserRequest {
  name?: string;
  first_lastname?: string;
  second_lastname?: string;
  email?: string;
  role_id?: number;
  area_id?: number;
  country_code?: string;
  phone?: string;
}

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface Role {
  role_id: number;
  name: string;
  description?: string;
}

export interface Area {
  area_id: number;
  name: string;
  description?: string;
}

class UsersService {
  /**
   * Get all users
   */
  async getAll(): Promise<User[]> {
    const response = await apiClient.get<User[]>(API_ENDPOINTS.USERS.BASE);
    return validateResponse<User[]>(response);
  }

  /**
   * Get user by ID
   */
  async getById(userId: number): Promise<User> {
    const endpoint = API_ENDPOINTS.USERS.BY_ID(userId);
    const response = await apiClient.get<User>(endpoint);
    return validateResponse<User>(response);
  }

  /**
   * Get user by phone number
   */
  async getByPhone(phone: string, countryCode: string): Promise<User> {
    const endpoint = API_ENDPOINTS.USERS.BY_PHONE(phone, countryCode);
    const response = await apiClient.get<User>(endpoint);
    return validateResponse<User>(response);
  }

  /**
   * Create new user
   */
  async create(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<User>(
      API_ENDPOINTS.USERS.BASE,
      data
    );
    return validateResponse<User>(response);
  }

  /**
   * Update existing user
   */
  async update(userId: number, data: UpdateUserRequest): Promise<User> {
    const endpoint = API_ENDPOINTS.USERS.BY_ID(userId);
    const response = await apiClient.patch<User>(endpoint, data);
    return validateResponse<User>(response);
  }

  /**
   * Delete user
   */
  async delete(userId: number): Promise<boolean> {
    const endpoint = API_ENDPOINTS.USERS.BY_ID(userId);
    const response = await apiClient.delete<{ deleted: boolean }>(endpoint);
    const data = validateResponse<{ deleted: boolean }>(response);
    return data.deleted;
  }

  /**
   * Update user password
   */
  async updatePassword(userId: number, data: UpdatePasswordRequest): Promise<void> {
    const endpoint = API_ENDPOINTS.USERS.UPDATE_PASSWORD(userId);
    const response = await apiClient.patch<void>(endpoint, data);
    validateResponse<void>(response);
  }

  /**
   * Get user contacts
   */
  async getContacts(userId: number): Promise<Contact[]> {
    const endpoint = API_ENDPOINTS.USERS.CONTACTS(userId);
    const response = await apiClient.get<Contact[]>(endpoint);
    return validateResponse<Contact[]>(response);
  }

  /**
   * Add contact to user
   */
  async addContact(userId: number, contactData: any): Promise<Contact> {
    const endpoint = API_ENDPOINTS.USERS.CONTACTS(userId);
    const response = await apiClient.post<Contact>(endpoint, contactData);
    return validateResponse<Contact>(response);
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>(API_ENDPOINTS.USERS.PROFILE);
    return validateResponse<User>(response);
  }

  /**
   * Get all roles
   */
  async getRoles(): Promise<Role[]> {
    const response = await apiClient.get<Role[]>(API_ENDPOINTS.REFERENCE.ROLES);
    return validateResponse<Role[]>(response);
  }

  /**
   * Get all areas
   */
  async getAreas(): Promise<Area[]> {
    const response = await apiClient.get<Area[]>(API_ENDPOINTS.REFERENCE.AREAS);
    return validateResponse<Area[]>(response);
  }
}

// Export singleton instance
export const usersService = new UsersService();
