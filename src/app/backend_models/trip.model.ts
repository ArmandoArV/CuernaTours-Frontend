/**
 * Trip Model (Contract Trips)
 */

export interface ContractTrip {
  contract_trip_id: number;
  contract_id: number;
  service_date: Date;
  origin_id: number;
  origin_time: string; // TIME type
  destination_id: number;
  flight_id?: number;
  passengers: number;
  unit_type?: string;
  observations?: string;
  internal_observations?: string;
  vehicle_id?: number;
  driver_id?: number;
  external_driver_id?: number;
  contract_trip_status_id?: number;
  driver_accepted?: number; // TINYINT in MySQL
}

export interface ContractTripStatus {
  contract_trip_status_id: number;
  name: string;
  description?: string;
}

export interface Flight {
  flight_id: number;
  flight_number: string;
  airline?: string;
  arrival_time?: Date;
  flight_origin?: string;
  notes?: string;
}

export interface ExternalProvider {
  external_provider_id: number;
  provider_name: string;
  contact_person?: string;
  country_code?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: Date;
}

export interface ExternalDriver {
  external_driver_id: number;
  external_provider_id: number;
  driver_name: string;
  country_code?: string;
  phone?: string;
  email?: string;
  license_number?: string;
  notes?: string;
  status: 'active' | 'inactive';
  created_at: Date;
}

// Extended interface for trips with driver information
export interface ContractTripWithDriver extends ContractTrip {
  // Internal driver info (if driver_id is set)
  driver?: {
    user_id: number;
    name: string;
    first_lastname: string;
    phone: string;
    country_code?: string;
  };
  // External driver info (if external_driver_id is set)
  external_driver?: ExternalDriver;
  external_provider?: ExternalProvider;
}
