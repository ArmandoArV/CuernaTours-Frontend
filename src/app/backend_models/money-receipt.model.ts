export interface MoneyReceipt {
  money_receipt_id: number;
  contract_id: number;
  amount: number;
  received_date: Date;
  received_by?: number;
  notes?: string;
  created_at?: Date;
}
