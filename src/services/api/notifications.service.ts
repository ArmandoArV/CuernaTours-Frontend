/**
 * Notifications Service
 * 
 * Handles notification-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';

export interface SendEmailRequest {
  to: string[];
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  attachments?: string[];
}

export interface SendTextRequest {
  to: string;
  message: string;
  countryCode?: string;
}

export interface NotificationHistory {
  notification_id: number;
  type: 'email' | 'sms';
  recipient: string;
  subject?: string;
  message: string;
  sent_at: Date;
  status: 'sent' | 'failed' | 'pending';
}

class NotificationsService {
  /**
   * Send email notification
   */
  async sendEmail(data: SendEmailRequest): Promise<{ success: boolean; messageId?: string }> {
    const response = await apiClient.post<{ success: boolean; messageId?: string }>(
      API_ENDPOINTS.NOTIFICATIONS.SEND_EMAIL,
      data
    );
    return validateResponse<{ success: boolean; messageId?: string }>(response);
  }

  /**
   * Send text/SMS notification
   */
  async sendText(data: SendTextRequest): Promise<{ success: boolean; messageId?: string }> {
    const response = await apiClient.post<{ success: boolean; messageId?: string }>(
      API_ENDPOINTS.NOTIFICATIONS.SEND_TEXT,
      data
    );
    return validateResponse<{ success: boolean; messageId?: string }>(response);
  }

  /**
   * Get notification history
   */
  async getHistory(params?: {
    type?: 'email' | 'sms';
    limit?: number;
    offset?: number;
  }): Promise<NotificationHistory[]> {
    let endpoint = API_ENDPOINTS.NOTIFICATIONS.HISTORY;
    
    if (params) {
      const searchParams = new URLSearchParams();
      if (params.type) searchParams.append('type', params.type);
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.offset) searchParams.append('offset', params.offset.toString());
      
      const queryString = searchParams.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }
    }

    const response = await apiClient.get<NotificationHistory[]>(endpoint);
    return validateResponse<NotificationHistory[]>(response);
  }

  /**
   * Get notification by ID
   */
  async getById(notificationId: number): Promise<NotificationHistory> {
    const endpoint = API_ENDPOINTS.NOTIFICATIONS.BY_ID(notificationId);
    const response = await apiClient.get<NotificationHistory>(endpoint);
    return validateResponse<NotificationHistory>(response);
  }
}

// Export singleton instance
export const notificationsService = new NotificationsService();
