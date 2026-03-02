/**
 * Contract Template Model
 * 
 * Reusable contract template with preselected origin, destination, payment, unit type, etc.
 * Used to quickly create new contracts from saved presets.
 */

export interface ContractTemplate {
  contract_template_id: number;
  client_id: number;
  name: string;
  origin_id: number;
  passengers: number;
  destination_id: number;
  unit_type?: string;
  payment_type_id: number;
  amount: number;
  observations?: string;
  internal_observations?: string;
}
