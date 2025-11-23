/**
 * User Model
 */

export interface User {
  user_id: number;
  name: string;
  first_lastname: string;
  second_lastname?: string;
  company: string;
  username: string;
  role_id: number;
  picture_url?: string;
  country_code?: string;
  phone: string;
  email: string;
  hashed_password: string;
  display_name?: string;
  allergies?: string;
  blood_type?: 'O+' | 'O-' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-';
  rfc?: string;
  curp?: string;
  emergency_contact_id?: number;
  vision?: string;
  diseases?: string;
  treatment?: string;
  status: 'active' | 'inactive';
  area_id?: number;
  is_coordinator: boolean;
  // Token management fields
  reset_token_hash?: string;
  reset_token_expires?: Date;
  auth_token_hash?: string;
  last_login?: Date;
  last_token_refresh?: Date;
  last_reset_request?: Date;
}

export interface SimpleUser {
  user_id: number;
  name: string;
  first_lastname: string;
  role_id: number;
  display_name?: string | undefined;
  picture_url?: string | undefined;
  area_id?: number | undefined;
}

export interface Role {
  role_id: number;
  name: string;
  description?: string;
}

export interface Area {
  area_id: number;
  name: string;
  description?: string;
}
