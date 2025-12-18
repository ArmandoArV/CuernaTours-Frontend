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
import type { User, SimpleUser } from '@/app/backend_models/user.model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: SimpleUser;  // Backend returns SimpleUser, not full User
}

export interface ValidateResponse {
  tokenValid: boolean;
  user?: SimpleUser;  // Backend returns SimpleUser, not full User
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

    console.log('=== LOGIN DEBUG ===');
    console.log('1. Raw API response:', response);
    console.log('2. Response structure check:', {
      hasSuccess: 'success' in response,
      hasData: 'data' in response,
      dataType: typeof response.data,
      dataKeys: response.data ? Object.keys(response.data) : null
    });

    const data = validateResponse<LoginResponse>(response);

    console.log('3. After validateResponse:', data);
    console.log('4. Data.user object:', data.user);
    console.log('5. Data.user keys:', data.user ? Object.keys(data.user) : null);
    console.log('6. Data.user values:', JSON.stringify(data.user, null, 2));

    // Prepare complete user data for cookie storage
    const userData = this.prepareUserDataForStorage(data.user, email);
    console.log('7. Prepared user data for storage:', JSON.stringify(userData, null, 2));

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

    // Store the complete user data with all necessary fields
    if (userData) {
      console.log('8. Storing complete user data in cookie:', userData);
      const userDataString = JSON.stringify(userData);
      console.log('9. Cookie string to be stored:', userDataString);
      
      setCookie('user', userDataString, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      
      // Verify the cookie was set correctly
      setTimeout(() => {
        const storedCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('user='));
        if (storedCookie) {
          const cookieValue = decodeURIComponent(storedCookie.split('=')[1]);
          console.log('10. Verified cookie after storage:', cookieValue);
          console.log('11. Parsed cookie:', JSON.parse(cookieValue));
        } else {
          console.error('WARNING: User cookie was not set!');
        }
      }, 100);
    } else {
      console.error('WARNING: userData is null, not storing cookie');
    }

    return data;
  }

  /**
   * Prepare user data for cookie storage with all required fields
   * Only processes real user objects, not JWT payloads
   */
  private prepareUserDataForStorage(user: any, email: string): any {
    if (!user) {
      console.error('prepareUserDataForStorage: user is null or undefined');
      return null;
    }

    console.log('prepareUserDataForStorage input:', {
      user: JSON.stringify(user),
      userKeys: Object.keys(user),
      hasIat: 'iat' in user,
      hasExp: 'exp' in user,
      hasUserId: 'userId' in user,
      hasUser_id: 'user_id' in user,
      user_id: user.user_id,
      name: user.name,
      first_lastname: user.first_lastname,
      display_name: user.display_name,
      role_id: user.role_id
    });

    // Check if this is a JWT payload instead of user data
    // JWT payloads have 'iat', 'exp', and 'userId' (camelCase) instead of 'user_id'
    if ('iat' in user || 'exp' in user || ('userId' in user && !('user_id' in user))) {
      console.warn('JWT payload detected - skipping storage. Use this only for token validation.');
      return null;
    }

    // Map role based on role_id
    const getRoleName = (roleId?: number): string => {
      if (!roleId) return 'Usuario';
      
      const roleMap: { [key: number]: string } = {
        1: 'Maestro',
        2: 'Administrador',
        3: 'Chofer',
        4: 'Oficina',
      };
      return roleMap[roleId] || 'Usuario';
    };

    // Only extract the fields we need - don't spread to avoid JWT payload contamination
    const userData = {
      // Core user identification
      user_id: user.user_id,
      userId: user.user_id,
      
      // User details
      name: user.name || '',
      first_lastname: user.first_lastname || '',
      second_lastname: user.second_lastname,
      display_name: user.display_name || `${user.name || ''} ${user.first_lastname || ''}`.trim(),
      
      // Contact info
      email: email || user.email || '',
      username: user.username || email?.split('@')[0] || '',
      phone: user.phone,
      
      // Role and permissions
      role_id: user.role_id,
      roleId: user.role_id,
      role: getRoleName(user.role_id),
      
      // Profile
      picture_url: user.picture_url || null,
      area_id: user.area_id || null,
      
      // Status
      status: user.status,
    };

    console.log('prepareUserDataForStorage output:', JSON.stringify(userData, null, 2));
    
    return userData;
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
   * Note: Does NOT update user cookie - user data is stored during login only
   * This endpoint only validates the token is still valid
   */
  async validate(): Promise<ValidateResponse> {
    const response = await apiClient.post<ValidateResponse>(
      API_ENDPOINTS.AUTH.VALIDATE
    );

    const data = validateResponse<ValidateResponse>(response);

    console.log('=== VALIDATE DEBUG ===');
    console.log('1. Validate response:', data);
    console.log('2. Token is valid:', data.tokenValid);
    console.log('3. User cookie is preserved - not updated during validation');

    // DO NOT update user cookie from validate endpoint
    // The validate endpoint returns JWT payload, not full user data
    // User cookie is only set during login with complete user information
    
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
   * Get current user from cookie
   */
  getCurrentUser(): any {
    try {
      const userCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('user='));
      
      if (userCookie) {
        const userValue = decodeURIComponent(userCookie.split('=')[1]);
        return JSON.parse(userValue);
      }
    } catch (error) {
      console.error('Error getting user from cookie:', error);
    }
    return null;
  }

  /**
   * Helper method to get user cookie
   */
  private getUserCookie(): any {
    return this.getCurrentUser();
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