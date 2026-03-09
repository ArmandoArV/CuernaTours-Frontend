/**
 * Contract Model
 */

export interface Contract {
  contract_id: number;
  client_id: number;
  created_at: Date;
  payment_type_id: number;
  IVA: boolean;
  amount: number;
  commission_id?: number;
  observations?: string;
  internal_observations?: string;
  coordinator_id?: number;
  creator_id: number;
  contract_status_id: number;
  payment_status?: 'pending' | 'paid';
  paid_date?: Date;
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
