/**
 * Notification Model
 */

/**
 * Notification Log
 * Simple audit trail for sent notifications
 */
export interface NotificationLog {
  log_id: number;
  type_name: string; // 'trip_confirmation', 'trip_reminder', 'payment_confirmation', etc.
  channel: 'whatsapp' | 'email' | 'sms';
  recipient: string; // Phone number or email address
  status: 'sent' | 'failed';
  payload: NotificationPayload | null;
  sent_at: Date;
}

/**
 * Notification Payload
 * Flexible JSON structure stored in the payload field
 */
export interface NotificationPayload {
  contract_id?: number;
  contract_trip_id?: number;
  contact_id?: number;
  user_id?: number;
  template_data?: Record<string, any>; // Variables for template replacement
  message_sent?: string; // Actual message sent after variable replacement
  provider_response?: {
    message_id?: string;
    status?: string;
    [key: string]: any;
  };
  error?: string | null;
  [key: string]: any; // Allow any additional fields
}

/**
 * Notification Channel Priority
 */
export type NotificationChannel = 'whatsapp' | 'email' | 'sms';

/**
 * Notification Type Names
 */
export type NotificationTypeName = 
  | 'trip_confirmation'
  | 'trip_reminder'
  | 'trip_update'
  | 'trip_cancellation'
  | 'payment_confirmation'
  | 'payment_reminder'
  | 'driver_assignment'
  | 'password_recovery'
  | 'custom';
