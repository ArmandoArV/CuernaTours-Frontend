/**
 * API Response Validators
 * 
 * Runtime validation for API responses with type guards
 */

import type { ApiResponse } from '@/app/backend_models/common_types/common.types';
import type { Contract } from '@/app/backend_models/contract.model';
import type { User } from '@/app/backend_models/user.model';

/**
 * Validate and extract data from ApiResponse
 */
export function validateResponse<T>(response: any): T {
  if (
    typeof response !== 'object' ||
    response === null ||
    typeof response.success !== 'boolean'
  ) {
    throw new Error('Invalid API response format');
  }

  if (response.success !== true || !('data' in response)) {
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
