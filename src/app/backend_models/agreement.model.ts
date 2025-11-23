/**
 * Company Agreement Model
 */

export interface CompanyAgreement {
  company_agreement_id: number;
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
