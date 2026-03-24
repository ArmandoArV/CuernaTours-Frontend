/**
 * Contract Model
 */

export interface Contract {
  contract_id: number;
  created_at: Date | string;
  payment_type_id: number;
  IVA: boolean | number;
  amount: number;
  commission_id?: number | null;
  observations?: string;
  internal_observations?: string;
  coordinator_id?: number | null;
  creator_id: number;
  contract_status_id: number;
  paid_date?: Date | string | null;
  // Legacy flat field — may not be present on /details responses
  client_id?: number;
}

export interface ContractStatus {
  contract_status_id: number;
  name: string;
  description?: string;
}

export interface Commission {
  commission_id: number;
  type: 'percentage' | 'arranged';
  amount?: number;
  arranged_deal?: string;
  establishment?: string;
  status: 'paid' | 'pending';
  paid_date?: Date;
  paid_by?: number;
}
