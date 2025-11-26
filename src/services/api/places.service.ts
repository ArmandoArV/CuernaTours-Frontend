/**
 * Places Service
 * 
 * Handles place-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';
import type { Place } from '@/app/backend_models/place.model';

export interface CreatePlaceRequest {
  name: string;
  address?: string;
  number?: string;
  colonia?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  annotations?: string;
}

export interface UpdatePlaceRequest {
  name?: string;
  address?: string;
  number?: string;
  colonia?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  annotations?: string;
}

export interface PlacesListResponse {
  success: boolean;
  data: Place[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SearchPlacesParams {
  q?: string;
  limit?: number;
  page?: number;
}

class PlacesService {
  /**
   * Get all places
   */
  async getAll(): Promise<Place[]> {
    const response = await apiClient.get<Place[]>(API_ENDPOINTS.PLACES.BASE);
    return validateResponse<Place[]>(response);
  }

  /**
   * Get places with pagination and filtering
   */
  async getPlaces(params?: {
    page?: number;
    limit?: number;
    q?: string;
  }): Promise<PlacesListResponse> {
    let endpoint = API_ENDPOINTS.PLACES.BASE;
    
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', params.page.toString());
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.q) searchParams.append('q', params.q);
      
      if (searchParams.toString()) {
        endpoint += `?${searchParams.toString()}`;
      }
    }

    const response = await apiClient.get<PlacesListResponse>(endpoint);
    return validateResponse<PlacesListResponse>(response);
  }

  /**
   * Get place by ID
   */
  async getById(placeId: number): Promise<Place> {
    const endpoint = API_ENDPOINTS.PLACES.BY_ID(placeId);
    const response = await apiClient.get<Place>(endpoint);
    return validateResponse<Place>(response);
  }

  /**
   * Create new place
   */
  async create(data: CreatePlaceRequest): Promise<Place> {
    const response = await apiClient.post<Place>(
      API_ENDPOINTS.PLACES.BASE,
      data
    );
    return validateResponse<Place>(response);
  }

  /**
   * Update existing place
   */
  async update(placeId: number, data: UpdatePlaceRequest): Promise<Place> {
    const endpoint = API_ENDPOINTS.PLACES.BY_ID(placeId);
    const response = await apiClient.patch<Place>(endpoint, data);
    return validateResponse<Place>(response);
  }

  /**
   * Delete place
   */
  async delete(placeId: number): Promise<boolean> {
    const endpoint = API_ENDPOINTS.PLACES.BY_ID(placeId);
    const response = await apiClient.delete<{ deleted: boolean }>(endpoint);
    const data = validateResponse<{ deleted: boolean }>(response);
    return data.deleted;
  }

  /**
   * Search places by name or address
   */
  async search(params: SearchPlacesParams): Promise<PlacesListResponse> {
    let endpoint = API_ENDPOINTS.PLACES.SEARCH;
    
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.append('q', params.q);
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    
    if (searchParams.toString()) {
      endpoint += `?${searchParams.toString()}`;
    }

    const response = await apiClient.get<PlacesListResponse>(endpoint);
    return validateResponse<PlacesListResponse>(response);
  }

  /**
   * Simple search by query string (convenience method)
   */
  async searchByQuery(query: string, limit?: number): Promise<Place[]> {
    const result = await this.search({ q: query, limit });
    return result.data;
  }
}

// Export singleton instance
export const placesService = new PlacesService();