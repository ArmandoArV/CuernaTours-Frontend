/**
 * Common Types and Interfaces
 * 
 * Shared types used across the application
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  filters?: Record<string, any>;
}

export interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}
