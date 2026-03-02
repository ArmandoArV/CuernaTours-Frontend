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
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: Date;
  uploaded_by: number;
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

export interface DriverReceipt {
  driver_receipt_id: number;
  driver_id: number;
  contract_trip_id: number;
  payment_method: 'cash' | 'card' | 'transfer';
  amount_received: number;
  received_date: Date;
  notes?: string;
  submitted_at: Date;
  verification_status: 'pending' | 'verified' | 'discrepancy';
  verified_by?: number;
  verified_at?: Date;
  discrepancy_notes?: string;
}

/**
 * Spending with associated files (using new files system)
 */
export interface SpendingWithFiles extends Spending {
  files?: Array<{
    file_id: number;
    original_name: string;
    stored_name: string;
    file_path: string;
    file_url: string;
    file_size: number;
    mime_type: string;
    uploaded_at: Date;
  }>;
}

/**
 * Create Spending Request DTO
 */
export interface CreateSpendingRequest {
  spending_type?: string;
  spending_amount: number;
  driver_id: number;
  contract_id: number;
  vehicle_id: number;
  comments?: string;
}

/**
 * Spending Submission Response (for unified spending + files endpoint)
 */
export interface SpendingSubmissionResponse {
  success: boolean;
  message: string;
  spending?: SpendingWithFiles;
  errors?: string[];
}

/**
 * Spending Approval Request DTO
 */
export interface SpendingApprovalRequest {
  approved_by_id: number;
  comments?: string;
}
