/**
 * Place Model
 */

export interface Place {
  place_id: number;
  name: string;
  address?: string;
  number?: string;
  colonia?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  annotations?: string;
}
