/**
 * API Client
 * 
 * Core HTTP client with token management, interceptors, and error handling
 */

import { apiConfig, API_ENDPOINTS, HTTP_STATUS, REQUEST_TIMEOUT_MESSAGE, NETWORK_ERROR_MESSAGE } from '@/config/api.config';
import { 
  ApiError, 
  NetworkError, 
  TimeoutError, 
  UnauthorizedError,
  createApiError 
} from './ApiError';
import { getCookie, setCookie, deleteCookie } from '@/app/Utils/CookieUtil';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';

export interface RequestConfig extends RequestInit {
  timeout?: number;
  retryAttempts?: number;
  skipAuth?: boolean;
}

export class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;
  private defaultRetryAttempts: number;
  private retryDelay: number;
  private enableLogging: boolean;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.baseUrl = apiConfig.baseUrl;
    this.defaultTimeout = apiConfig.timeout;
    this.defaultRetryAttempts = apiConfig.retryAttempts;
    this.retryDelay = apiConfig.retryDelay;
    this.enableLogging = apiConfig.enableLogging;
  }

  /**
   * Get access token from cookie
   */
  private getAccessToken(): string | null {
    return getCookie('accessToken');
  }

  /**
   * Get refresh token from cookie
   */
  private getRefreshToken(): string | null {
    return getCookie('refreshToken');
  }

  /**
   * Set access token in cookie
   */
  private setAccessToken(token: string): void {
    setCookie('accessToken', token, {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });
  }

  /**
   * Refresh the access token using refresh token
   */
  private async refreshAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const refreshToken = this.getRefreshToken();
      
      if (!refreshToken) {
        throw new UnauthorizedError('No refresh token available');
      }

      try {
        const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.REFRESH}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (!response.ok) {
          throw new UnauthorizedError('Token refresh failed');
        }

        const data: ApiResponse<{ accessToken: string; refreshToken: string }> = await response.json();
        
        if (data.success && data.data) {
          this.setAccessToken(data.data.accessToken);
          
          if (data.data.refreshToken) {
            setCookie('refreshToken', data.data.refreshToken, {
              expires: 30,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/'
            });
          }
          
          return data.data.accessToken;
        } else {
          throw new UnauthorizedError('Invalid refresh token response');
        }
      } catch (error) {
        // Clear tokens on refresh failure
        deleteCookie('accessToken');
        deleteCookie('refreshToken');
        deleteCookie('user');
        throw error;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Build headers for request
   */
  private buildHeaders(skipAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (!skipAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Log request/response for debugging
   */
  private log(type: 'request' | 'response' | 'error', data: any): void {
    if (!this.enableLogging) return;

    const timestamp = new Date().toISOString();
    const emoji = type === 'request' ? '🚀' : type === 'response' ? '✅' : '❌';
    
    console.group(`${emoji} API ${type.toUpperCase()} - ${timestamp}`);
    console.log(data);
    console.groupEnd();
  }

  /**
   * Execute fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    config: RequestConfig,
    timeout: number
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new TimeoutError(REQUEST_TIMEOUT_MESSAGE);
      }
      throw error;
    }
  }

  /**
   * Retry logic for failed requests
   */
  private async retryRequest<T>(
    fn: () => Promise<T>,
    attempts: number,
    delay: number
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempts <= 1) {
        throw error;
      }

      // Don't retry auth errors, client errors, or server errors
      if (error instanceof ApiError && (error.isAuthError() || error.isClientError() || error.isServerError())) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.retryRequest(fn, attempts - 1, delay * 2);
    }
  }

  /**
   * Core request method
   */
  public async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      timeout = this.defaultTimeout,
      retryAttempts = this.defaultRetryAttempts,
      skipAuth = false,
      ...fetchConfig
    } = config;

    const url = `${this.baseUrl}${endpoint}`;
    const headers = this.buildHeaders(skipAuth);

    this.log('request', { url, method: fetchConfig.method || 'GET', headers, body: fetchConfig.body });

    const makeRequest = async (): Promise<ApiResponse<T>> => {
      try {
        const response = await this.fetchWithTimeout(
          url,
          { ...fetchConfig, headers },
          timeout
        );

        // Handle 401 - attempt token refresh
        if (response.status === HTTP_STATUS.UNAUTHORIZED && !skipAuth) {
          try {
            const newToken = await this.refreshAccessToken();
            
            // Retry request with new token
            const retryHeaders = {
              ...headers,
              'Authorization': `Bearer ${newToken}`,
            };

            const retryResponse = await this.fetchWithTimeout(
              url,
              { ...fetchConfig, headers: retryHeaders },
              timeout
            );

            return this.handleResponse<T>(retryResponse);
          } catch (refreshError) {
            throw new UnauthorizedError();
          }
        }

        return this.handleResponse<T>(response);
      } catch (error: any) {
        if (error instanceof ApiError) {
          throw error;
        }

        // Network error
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
          throw new NetworkError(NETWORK_ERROR_MESSAGE);
        }

        throw new ApiError(
          error.message || 'Unknown error occurred',
          'UNKNOWN_ERROR' as any
        );
      }
    };

    try {
      return await this.retryRequest(makeRequest, retryAttempts, this.retryDelay);
    } catch (error) {
      this.log('error', error);
      throw error;
    }
  }

  /**
   * Handle response and parse JSON
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    let data: any;

    try {
      data = await response.json();
    } catch (error) {
      throw createApiError(
        response.status,
        'Invalid JSON response from server'
      );
    }

    this.log('response', { status: response.status, data });

    if (!response.ok) {
      throw createApiError(
        response.status,
        data.message || response.statusText,
        data.errors,
        data
      );
    }

    return data as ApiResponse<T>;
  }

  /**
   * Convenience methods for HTTP verbs
   */
  public async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  public async post<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async put<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async patch<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

export { ApiError };
