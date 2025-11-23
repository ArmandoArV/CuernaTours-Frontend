/**
 * Payment & Spending Models
 */

export interface PaymentType {
  payment_type_id: number;
  name: string;
  notes?: string;
}

export interface Spending {
  spending_id: number;
  spending_type?: string;
  spending_amount: number;
  driver_id: number;
  contract_id: number;
  vehicle_id: number;
  submitted_at: Date;
  approved_status: 'approved' | 'pending' | 'denied';
  approved_by_id?: number;
  payment_status: 'pending' | 'paid';
  comments?: string;
}

export interface SpendingFile {
  spending_file_id: number;
  spending_id: number;
  file_url: string;
}

export interface ContractPayment {
  contract_payment_id: number;
  contract_id: number;
  payment_amount: number;
  payment_date: Date;
  payment_type_id: number;
  reference_number?: string;
  notes?: string;
  recorded_by: number;
  created_at: Date;
}

export interface DriverPayment {
  driver_payment_id: number;
  user_id: number;
  contract_trip_id: number;
  amount?: number;
  status: string;
}
