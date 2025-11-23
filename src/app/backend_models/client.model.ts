/**
 * Client Model
 */

export interface Client {
  client_id: number;
  client_type_id: number;
  name: string;
  comments?: string;
}

export interface ClientType {
  client_type_id: number;
  name: string;
  description?: string;
}

export interface Contact {
  contact_id: number;
  name: string;
  first_lastname: string;
  second_lastname?: string;
  country_code?: string;
  phone?: string;
  email?: string;
  is_whatsapp_available: boolean;
  comments?: string;
  // Optional fields from junction tables (client_contacts, user_contacts)
  is_primary?: boolean;
  role?: string;
  client_contact_id?: number;
  user_contact_id?: number;
  relationship?: string;
}

export interface ClientContact {
  client_contact_id: number;
  client_id: number;
  contact_id: number;
  role?: string;
  is_primary: boolean;
}

export interface UserContact {
  user_contact_id: number;
  user_id: number;
  contact_id: number;
  relationship: string;
  is_primary: boolean;
}
