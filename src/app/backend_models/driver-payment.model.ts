/**
 * Driver Payment Model
 * 
 * Type definitions for driver payments
 */

export interface DriverPayment {
  driver_payment_id: number;
  contract_id: number;
  user_id: number | null;
  external_driver_id: number | null;
  amount: number;
  payment_date: Date;
  notes: string | null;
  recorded_by: number;
  created_at: Date;
}

export interface CreateDriverPaymentData {
  contract_id: number;
  user_id?: number | null;
  external_driver_id?: number | null;
  amount: number;
  payment_date: Date;
  notes?: string;
  recorded_by: number;
}

export interface DriverPaymentWithDetails extends DriverPayment {
  driver_name?: string;
  driver_type?: 'internal' | 'external';
  recorded_by_name?: string;
}
