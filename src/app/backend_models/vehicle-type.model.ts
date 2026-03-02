/**
 * Vehicle Type Models
 */

export interface VehicleType {
  vehicle_type_id: number;
  name: string;
  description?: string;
  typical_capacity?: number;
  is_active: number; // TINYINT
}

export interface ContractTripUnit {
  contract_trip_unit_id: number;
  contract_trip_id: number;
  vehicle_type_id: number;
  vehicle_id?: number;
  driver_id?: number;
  external_driver_id?: number;
  driver_accepted?: number; // TINYINT
  notes?: string;
}

export interface ContractTripUnitWithDetails extends ContractTripUnit {
  vehicle_type_name?: string;
  vehicle_alias?: string;
  vehicle_license_plate?: string;
  driver_name?: string;
  driver_lastname?: string;
  external_driver_name?: string;
}
