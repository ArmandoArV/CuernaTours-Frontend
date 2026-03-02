/**
 * Driver Model
 * 
 * Note: Drivers are users with a specific role.
 * This file contains driver-related types.
 * Driver payments are in payment.model.ts
 */

import type { User } from './user.model';
import type { SpendingWithFiles } from './payment.model';

/**
 * Driver Dashboard Statistics
 */
export interface DriverDashboardStats {
  upcoming_trips: number;
  completed_trips: number;
  pending_spendings: number;
  approved_spendings_unpaid: number;
  total_earnings: number;
  pending_payments: number;
}

/**
 * Trip Summary for Dashboard
 */
export interface DashboardTripSummary {
  trip_id: number;
  contract_id: number;
  pickup_location: string;
  destination: string;
  pickup_datetime: Date;
  dropoff_datetime?: Date;
  trip_status: string;
  vehicle_type?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  client_name?: string;
}

/**
 * Driver Dashboard Summary Response
 */
export interface DriverDashboardSummary {
  driver: Omit<User, 'hashed_password'>;
  stats: DriverDashboardStats;
  recent_trips: DashboardTripSummary[];
  recent_spendings: SpendingWithFiles[];
}
