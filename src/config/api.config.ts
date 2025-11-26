/**
 * API Configuration
 * 
 * Centralized configuration for API requests
 */

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableLogging: boolean;
}

const getBaseUrl = (): string => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!envUrl) {
    console.warn('NEXT_PUBLIC_API_URL not set, using default');
    return 'http://localhost:3001';
  }
  
  // Remove trailing slash
  return envUrl.replace(/\/$/, '');
};

export const apiConfig: ApiConfig = {
  baseUrl: getBaseUrl(),
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  enableLogging: process.env.NODE_ENV === 'development',
};

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    VALIDATE: '/auth/validate',
    REFRESH: '/auth/refresh',
  },
  
  // Contract endpoints
  CONTRACTS: {
    BASE: '/contracts',
    DETAILS: '/contracts/details',
    CREATE: '/contracts/create',
    BY_ID: (id: number) => `/contracts/details/${id}`,
  },
  
  // Trip endpoints
  TRIPS: {
    BASE: '/trips',
    CREATE: '/trips',
    BY_ID: (id: number) => `/trips/${id}`,
    ASSIGN_DRIVER: (id: number) => `/trips/${id}/assign-driver`,
    PAYMENTS: (id: number) => `/trips/${id}/payments`,
  },
  
  // Reference data endpoints
  REFERENCE: {
    CLIENTS: '/clients',
    PLACES: '/places',
    DRIVERS: '/drivers',
    VEHICLES: '/vehicles',
  },
  
  // Places endpoints
  PLACES: {
    BASE: '/places',
    BY_ID: (id: number) => `/places/${id}`,
    SEARCH: '/places/search',
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const REQUEST_TIMEOUT_MESSAGE = 'Request timeout - please try again';
export const NETWORK_ERROR_MESSAGE = 'Network error - please check your connection';
export const UNAUTHORIZED_MESSAGE = 'Session expired - please login again';
