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
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    VALIDATE: '/auth/validate',
    REFRESH: '/auth/refresh-token',
    REFRESH_TOKEN: '/auth/refresh-token',
    REQUEST_PASSWORD_RESET: '/auth/request-password-reset',
    VERIFY_RESET_TOKEN: '/auth/verify-reset-token',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // Contract endpoints
  CONTRACTS: {
    BASE: '/contracts',
    CREATE: '/contracts/create',
    CREATE_WITH_TRIPS: '/contracts/create-with-trips',
    BY_ID: (id: number) => `/contracts/${id}`,
    DETAILS: (id: number) => `/contracts/details/${id}`,
    ALL_DETAILS: '/contracts/details',
    CANCELLED: '/contracts/cancelled',
    PENDING_MONEY_RECEIVED: '/contracts/pending-money-received',
    PENDING_ASSIGNMENTS: '/contracts/pending-assignments',
    COMPLETED: '/contracts/completed',
    CANCEL: (id: number) => `/contracts/${id}/cancel`,
    UNCANCEL: (id: number) => `/contracts/${id}/uncancel`,
    MONEY_RECEIVED: (id: number) => `/contracts/${id}/money-received`,
    SEND_CONFIRMATION: (id: number) => `/contracts/${id}/send-confirmation`,
  },
  
  // Commission endpoints
  COMMISSIONS: {
    BASE: '/commissions',
    PENDING: '/commissions/pending',
    MARK_PAID: (id: number) => `/commissions/${id}/mark-paid`,
  },
  
  // Contract Payment endpoints
  CONTRACT_PAYMENTS: {
    BASE: '/contract-payments',
    BY_CONTRACT: (contractId: number) => `/contract-payments/contract/${contractId}`,
    BY_ID: (id: number) => `/contract-payments/${id}`,
  },
  
  // Trip endpoints
  TRIPS: {
    BASE: '/trips',
    CREATE: '/trips',
    BY_ID: (id: number) => `/trips/${id}`,
    BY_CONTRACT: (contractId: number) => `/trips/contract/${contractId}`,
    BY_EXTERNAL_DRIVER: (id: number) => `/trips/external-driver/${id}`,
    ASSIGN_DRIVER: (id: number) => `/trips/${id}/assign-driver`,
    ASSIGN_RESOURCES: (id: number) => `/trips/${id}/assign-resources`,
    UPDATE_STATUS: (id: number) => `/trips/${id}/status`,
    STATUSES: '/trip/status',
    FLIGHTS: '/flights',
  },
  
  // Driver Payment endpoints
  DRIVER_PAYMENTS: {
    BASE: '/driver-payments',
    BY_TRIP: (tripId: number) => `/driver-payments/trip/${tripId}`,
    BY_ID: (id: number) => `/driver-payments/${id}`,
    MARK_PAID: (id: number) => `/driver-payments/${id}/mark-paid`,
  },
  
  // Client endpoints
  CLIENTS: {
    BASE: '/clients',
    CREATE: '/clients/create',
    BY_ID: (id: number) => `/clients/${id}`,
    SEARCH: '/clients/search',
    CONTACTS: (id: number) => `/clients/${id}/contacts`,
    ADD_CONTACT: (id: number) => `/clients/${id}/contacts`,
  },
  
  // Contact endpoints
  CONTACTS: {
    BASE: '/contacts',
    BY_ID: (id: number) => `/contacts/${id}`,
  },
  
  // Place endpoints
  PLACES: {
    BASE: '/places',
    BY_ID: (id: number) => `/places/${id}`,
    SEARCH: '/places/search',
    BY_CITY: (city: string) => `/places/city/${city}`,
    BY_STATE: (state: string) => `/places/state/${state}`,
  },
  
  // Driver endpoints
  DRIVERS: {
    BASE: '/drivers',
    BY_ID: (id: number) => `/drivers/${id}`,
    AVAILABLE: '/drivers/available',
    SEARCH: '/drivers/search',
    PAYMENTS: (id: number) => `/drivers/${id}/payments`,
    SPENDINGS: (id: number) => `/drivers/${id}/spendings`,
  },
  
  // External Provider endpoints
  EXTERNAL_PROVIDERS: {
    BASE: '/external-providers',
    BY_ID: (id: number) => `/external-providers/${id}`,
    DRIVERS: (id: number) => `/external-providers/${id}/drivers`,
  },
  
  // Vehicle endpoints
  VEHICLES: {
    BASE: '/vehicles',
    BY_ID: (id: number) => `/vehicles/${id}`,
    AVAILABLE: '/vehicles/available',
    SEARCH: '/vehicles/search',
    STATUS: '/vehicles/status',
  },
  
  // User endpoints
  USERS: {
    BASE: '/users',
    BY_ID: (id: number) => `/users/${id}`,
    PROFILE: '/users/profile',
    UPDATE_PASSWORD: (id: number) => `/users/${id}/password`,
    CONTACTS: (id: number) => `/users/${id}/contacts`,
    BY_PHONE: (phone: string, country: string) => `/users/phone/${phone}/country/${country}`,
  },
  
  // Agreement endpoints
  AGREEMENTS: {
    BASE: '/agreements',
    BY_ID: (id: number) => `/agreements/${id}`,
    BY_DRIVER: (driverId: number) => `/agreements/driver/${driverId}`,
  },
  
  // File/Document endpoints
  FILES: {
    BASE: '/files',
    UPLOAD: '/files/upload',
    BY_ID: (id: number) => `/files/${id}`,
    DOWNLOAD: (id: number) => `/files/${id}/download`,
    BY_ENTITY: (entityType: string, entityId: number) => `/files/${entityType}/${entityId}`,
  },
  
  // Notification endpoints
  NOTIFICATIONS: {
    SEND_EMAIL: '/notifications/send-email',
    SEND_TEXT: '/notifications/send-text',
    HISTORY: '/notifications/history',
    BY_ID: (id: number) => `/notifications/${id}`,
  },
  
  // Payment endpoints
  PAYMENTS: {
    BASE: '/payments',
    BY_ID: (id: number) => `/payments/${id}`,
    BY_CONTRACT: (contractId: number) => `/payments/contract/${contractId}`,
  },

  // Spendings endpoints
  SPENDINGS: {
    BASE: '/spendings',
    BY_ID: (id: number) => `/spendings/${id}`,
    FILES: (spendingId: number) => `/spending-files/${spendingId}`,
    UPLOAD_FILE: '/spending-files',
  },

  // Driver Receipts endpoints
  DRIVER_RECEIPTS: {
    BASE: '/driver-receipts',
    BY_ID: (id: number) => `/driver-receipts/${id}`,
  },
  
  // System/Reference data endpoints
  REFERENCE: {
    // Client types
    CLIENT_TYPES: '/client-types',
    
    // Contract statuses (backend uses /contract-status)
    CONTRACT_STATUSES: '/contract-status',
    
    // Trip statuses (backend uses /trip/status)
    TRIP_STATUSES: '/trip/status',
    
    // Payment types
    PAYMENT_TYPES: '/payment-types',
    
    // Roles
    ROLES: '/roles',
    
    // Areas
    AREAS: '/areas',
    
    // Vehicle statuses
    VEHICLE_STATUSES: '/vehicles/status',
  },
  
  // System endpoints
  SYSTEM: {
    HEALTH: '/system/health',
    VERSION: '/system/version',
    PREFILLABLE_DATA: '/system/prefillable-data',
  },
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const REQUEST_TIMEOUT_MESSAGE = 'Request timeout - please try again';
export const NETWORK_ERROR_MESSAGE = 'Network error - please check your connection';
export const UNAUTHORIZED_MESSAGE = 'Session expired - please login again';
export const FORBIDDEN_MESSAGE = 'You do not have permission to perform this action';
export const NOT_FOUND_MESSAGE = 'The requested resource was not found';
export const CONFLICT_MESSAGE = 'This operation conflicts with existing data';
export const SERVER_ERROR_MESSAGE = 'An unexpected error occurred - please try again later';