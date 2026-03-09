/**
 * Notifications Service
 * 
 * Handles notification-related API calls
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS } from '@/config/api.config';
import { validateResponse } from './validators';
import type { ApiResponse } from '@/app/backend_models/common_types/common.types';

export interface SendNotificationRequest {
  type: string;
  recipient: string;
  data: Record<string, unknown>;
  preferWhatsApp?: boolean;
}

export interface NotificationHistory {
  notification_id: number;
  type: 'email' | 'sms' | 'whatsapp';
  recipient: string;
  subject?: string;
  message: string;
  sent_at: Date;
  status: 'sent' | 'failed' | 'pending';
}

class NotificationsService {
  /**
   * Send email notification (template-based)
   */
  async sendEmail(data: SendNotificationRequest): Promise<{ success: boolean; messageId?: string }> {
    const response = await apiClient.post<{ success: boolean; messageId?: string }>(
      API_ENDPOINTS.NOTIFICATIONS.SEND_EMAIL,
      data
    );
    return validateResponse<{ success: boolean; messageId?: string }>(response);
  }

  /**
   * Send text/SMS or WhatsApp notification (template-based)
   */
  async sendText(data: SendNotificationRequest): Promise<{ success: boolean; messageId?: string }> {
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
    channel?: string;
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<NotificationHistory[]> {
    let endpoint = API_ENDPOINTS.NOTIFICATIONS.HISTORY;

    if (params) {
      const searchParams = new URLSearchParams();
      if (params.channel) searchParams.append('channel', params.channel);
      if (params.status) searchParams.append('status', params.status);
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
