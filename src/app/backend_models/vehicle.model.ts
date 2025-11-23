/**
 * Vehicle Model
 */

export interface Vehicle {
  vehicle_id: number;
  alias?: string;
  type: string;
  brand?: string;
  model?: number; // YEAR type
  max_capacity?: number;
  license_plate: string;
  color?: string;
  fuel?: string;
  photo_url?: string;
  serial_number?: string;
  engine_number?: string;
  notes?: string;
}
