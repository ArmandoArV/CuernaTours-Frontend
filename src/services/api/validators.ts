/**
 * API Response Validators
 * 
 * Runtime validation for API responses with type guards
 */

import type { ApiResponse, PaginatedResponse } from '@/app/backend_models/common_types/common.types';
import type { Contract } from '@/app/backend_models/contract.model';
import type { ContractTrip } from '@/app/backend_models/trip.model';
import type { User } from '@/app/backend_models/user.model';
import type { Client } from '@/app/backend_models/client.model';
import type { Vehicle } from '@/app/backend_models/vehicle.model';
import type { Place } from '@/app/backend_models/place.model';

/**
 * Base type guard for ApiResponse
 */
export function isApiResponse<T>(data: any): data is ApiResponse<T> {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.success === 'boolean'
  );
}

/**
 * Type guard for successful ApiResponse
 */
export function isSuccessResponse<T>(data: any): data is ApiResponse<T> & { success: true; data: T } {
  return isApiResponse(data) && data.success === true && 'data' in data;
}

/**
 * Type guard for error ApiResponse
 */
export function isErrorResponse(data: any): data is ApiResponse & { success: false; message: string } {
  return isApiResponse(data) && data.success === false;
}

/**
 * Type guard for PaginatedResponse
 */
export function isPaginatedResponse<T>(data: any): data is PaginatedResponse<T> {
  return (
    isApiResponse(data) &&
    'pagination' in data &&
    typeof data.pagination === 'object' &&
    data.pagination !== null &&
    typeof data.pagination.page === 'number' &&
    typeof data.pagination.limit === 'number' &&
    typeof data.pagination.total === 'number' &&
    typeof data.pagination.totalPages === 'number'
  );
}

/**
 * Validate and extract data from ApiResponse
 */
export function validateResponse<T>(response: any): T {
  if (!isApiResponse(response)) {
    throw new Error('Invalid API response format');
  }

  if (!isSuccessResponse<T>(response)) {
    const message = response.message || 'API request failed';
    throw new Error(message);
  }

  return response.data;
}

/**
 * Type guard for User
 */
export function isUser(data: any): data is User {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.user_id === 'number' &&
    typeof data.name === 'string' &&
    typeof data.email === 'string'
  );
}

/**
 * Type guard for Contract
 */
export function isContract(data: any): data is Contract {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.contract_id === 'number' &&
    typeof data.client_id === 'number' &&
    typeof data.amount === 'number'
  );
}

/**
 * Type guard for ContractTrip
 */
export function isContractTrip(data: any): data is ContractTrip {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.contract_trip_id === 'number' &&
    typeof data.contract_id === 'number' &&
    typeof data.origin_id === 'number' &&
    typeof data.destination_id === 'number'
  );
}

/**
 * Type guard for Client
 */
export function isClient(data: any): data is Client {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.client_id === 'number' &&
    typeof data.name === 'string'
  );
}

/**
 * Type guard for Vehicle
 */
export function isVehicle(data: any): data is Vehicle {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.vehicle_id === 'number' &&
    typeof data.license_plate === 'string'
  );
}

/**
 * Type guard for Place
 */
export function isPlace(data: any): data is Place {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.place_id === 'number' &&
    typeof data.name === 'string'
  );
}

/**
 * Validate array of items
 */
export function validateArray<T>(
  data: any,
  validator: (item: any) => item is T
): T[] {
  if (!Array.isArray(data)) {
    throw new Error('Expected array');
  }

  return data.filter(validator);
}

/**
 * Safe parse for API responses with validation
 */
export function safeParseResponse<T>(
  response: any,
  validator?: (data: any) => data is T
): T {
  const data = validateResponse<T>(response);

  if (validator && !validator(data)) {
    throw new Error('Response data validation failed');
  }

  return data;
}
