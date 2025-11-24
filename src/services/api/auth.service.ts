/**
 * Auth Service
 * 
 * Handles authentication-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse, isUser } from './validators';
import { setCookie, deleteCookie } from '@/app/Utils/CookieUtil';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';
import type { User } from '@/app/backend_models/user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ValidateResponse {
  tokenValid: boolean;
  user?: User;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

class AuthService {
  /**
   * Login user
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      { email, password },
      { skipAuth: true }
    );

    const data = validateResponse<LoginResponse>(response);

    // Store tokens and user in cookies
    if (data.accessToken) {
      setCookie('accessToken', data.accessToken, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }

    if (data.refreshToken) {
      setCookie('refreshToken', data.refreshToken, {
        expires: 30,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }

    if (data.user) {
      setCookie('user', JSON.stringify(data.user), {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }

    return data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      // Log error but continue with local cleanup
      console.error('Logout API call failed:', error);
    } finally {
      // Always clear local tokens
      this.clearSession();
    }
  }

  /**
   * Validate current token
   */
  async validate(): Promise<ValidateResponse> {
    const response = await apiClient.post<ValidateResponse>(
      API_ENDPOINTS.AUTH.VALIDATE
    );

    const data = validateResponse<ValidateResponse>(response);

    // Update user cookie if returned
    if (data.user) {
      setCookie('user', JSON.stringify(data.user), {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }

    return data;
  }

  /**
   * Refresh access token
   */
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    const response = await apiClient.post<RefreshResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
      { refreshToken },
      { skipAuth: true }
    );

    const data = validateResponse<RefreshResponse>(response);

    // Update tokens
    if (data.accessToken) {
      setCookie('accessToken', data.accessToken, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }

    if (data.refreshToken) {
      setCookie('refreshToken', data.refreshToken, {
        expires: 30,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    }

    return data;
  }

  /**
   * Clear session (cookies)
   */
  clearSession(): void {
    deleteCookie('accessToken');
    deleteCookie('refreshToken');
    deleteCookie('user');
  }

  /**
   * Check if user is authenticated (has valid tokens)
   */
  isAuthenticated(): boolean {
    // This is a simple check - actual validation happens via validate() API call
    const accessToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='));
    
    return !!accessToken;
  }
}

// Export singleton instance
export const authService = new AuthService();
