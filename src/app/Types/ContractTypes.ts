// Contract-related interfaces and classes
import { TripData, Trip, TripCollection } from "./TripTypes";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("ContractTypes");

export interface ContractStatus {
  id: number;
  name: string;
}

export interface PaymentType {
  id: number;
  name: string;
}

export interface Client {
  id: number;
  name: string;
  type_name: string;
}

export interface User {
  id: number;
  name: string;
  lastname: string;
}

// --- New interfaces matching the actual API response ---

export interface ClientContact {
  contact_id: number;
  name: string;
  first_lastname: string;
  second_lastname: string | null;
  country_code: string;
  phone: string;
  email: string;
  is_whatsapp_available: number;
  comments: string | null;
  role: string | null;
  is_primary: number;
}

export interface ClientTypeData {
  client_type_id: number;
  name: string;
  description: string;
}

export interface ClientData {
  client_id: number;
  name: string;
  comments: string | null;
  client_type_id: number;
  client_type: ClientTypeData;
  contacts: ClientContact[];
}

export interface CommissionData {
  commission_id: number;
  type: "percentage" | "arranged";
  amount?: number | null;
  arranged_deal?: string | null;
  establishment?: string | null;
  status?: "paid" | "pending";
  paid_date?: string | null;
  paid_by?: number | null;
}

export interface ContractData {
  contract_id: number;
  created_at: string;
  payment_type_id: number;
  IVA: number;
  amount: number;
  commission_id: number | null;
  observations: string | null;
  internal_observations: string | null;
  coordinator_id: number | null;
  creator_id: number;
  contract_status_id: number;
  paid_date: string | null;
  amount_paid: number;
  amount_remaining: number;
  is_fully_paid: number;
  cancelled_at: string | null;
  cancelled_by: number | null;
  cancellation_reason: string | null;
  contract_status_name: string;
  payment_type_name: string;
  coordinator_displayname: string | null;
  creator_displayname: string;
  client: ClientData;
  commission: CommissionData | null;
  trips: TripData[];
  payments: any[];
}

export interface ContractResponse {
  success: boolean;
  data: ContractData;
}

export class Contract {
  private _data: ContractData;
  private _trips: TripCollection;

  constructor(contractData: ContractData) {
    this._data = contractData;
    this._trips = new TripCollection(contractData.trips);
  }

  // Helper: find the primary contact from the client's contacts array
  private get primaryContact(): ClientContact | null {
    const contacts = this._data.client?.contacts;
    if (!contacts || contacts.length === 0) return null;
    return contacts.find((c) => c.is_primary === 1) ?? contacts[0];
  }

  // Basic contract information getters
  get contractId(): number {
    return this._data.contract_id;
  }

  get clientId(): number {
    return this._data.client?.client_id ?? 0;
  }

  get createdAt(): string {
    return this._data.created_at;
  }

  get formattedCreatedAt(): Date {
    return new Date(this._data.created_at);
  }

  get paymentTypeId(): number {
    return this._data.payment_type_id;
  }

  get IVA(): number {
    return this._data.IVA;
  }

  get amount(): number {
    return this._data.amount;
  }

  get commissionId(): number | null {
    return this._data.commission_id;
  }

  get observations(): string {
    return this._data.observations || "";
  }

  get internalObservations(): string {
    return this._data.internal_observations || "";
  }

  get coordinatorId(): number | null {
    return this._data.coordinator_id;
  }

  get creatorId(): number {
    return this._data.creator_id;
  }

  get contractStatusId(): number {
    return this._data.contract_status_id;
  }

  get paymentStatus(): string {
    return this._data.is_fully_paid ? "paid" : "pending";
  }

  // Client information getters
  get clientName(): string {
    return this._data.client?.name ?? "";
  }

  get clientTypeName(): string {
    return this._data.client?.client_type?.name ?? "";
  }

  get client(): Client {
    return {
      id: this._data.client?.client_id ?? 0,
      name: this._data.client?.name ?? "",
      type_name: this._data.client?.client_type?.name ?? "",
    };
  }

  get contactPhone(): string {
    const contact = this.primaryContact;
    if (!contact) return "";
    const code = contact.country_code ? `+${contact.country_code} ` : "";
    return `${code}${contact.phone}`;
  }

  get contactEmail(): string {
    return this.primaryContact?.email || "";
  }

  get contactName(): string {
    const contact = this.primaryContact;
    if (!contact) return "";
    return [contact.name, contact.first_lastname, contact.second_lastname]
      .filter(Boolean)
      .join(" ");
  }

  get contactIsWhatsapp(): boolean {
    return this.primaryContact?.is_whatsapp_available === 1;
  }

  // Status and payment information getters
  get contractStatusName(): string {
    return this._data.contract_status_name;
  }

  get paymentTypeName(): string {
    return this._data.payment_type_name;
  }

  get contractStatus(): ContractStatus {
    return {
      id: this._data.contract_status_id,
      name: this._data.contract_status_name,
    };
  }

  get paymentType(): PaymentType {
    return {
      id: this._data.payment_type_id,
      name: this._data.payment_type_name,
    };
  }

  // Coordinator information getters
  get coordinatorName(): string {
    return this._data.coordinator_displayname ?? "";
  }

  get coordinator(): User {
    const displayname = this._data.coordinator_displayname ?? "";
    const parts = displayname.split(" ");
    return {
      id: this._data.coordinator_id ?? 0,
      name: parts[0] ?? "",
      lastname: parts.slice(1).join(" "),
    };
  }

  // Creator information getters
  get creatorName(): string {
    return this._data.creator_displayname ?? "";
  }

  get creator(): User {
    const displayname = this._data.creator_displayname ?? "";
    const parts = displayname.split(" ");
    return {
      id: this._data.creator_id,
      name: parts[0] ?? "",
      lastname: parts.slice(1).join(" "),
    };
  }

  // Trip information getters
  get trips(): TripCollection {
    return this._trips;
  }

  get tripCount(): number {
    return this._trips.count;
  }

  get firstTrip(): Trip | undefined {
    return this._trips.firstTrip;
  }

  get lastTrip(): Trip | undefined {
    return this._trips.lastTrip;
  }

  // Financial calculations
  get totalAmount(): number {
    return this._data.amount;
  }

  get totalWithIVA(): number {
    return this._data.amount + this._data.IVA;
  }

  get ivaAmount(): number {
    return this._data.IVA;
  }

  get hasIVA(): boolean {
    return this._data.IVA > 0;
  }

  get ivaPercentage(): number {
    if (this._data.amount === 0) return 0;
    return (this._data.IVA / this._data.amount) * 100;
  }

  get amountPaid(): number {
    return this._data.amount_paid ?? 0;
  }

  get amountRemaining(): number {
    return this._data.amount_remaining ?? this._data.amount;
  }

  // Status checks
  get isPaid(): boolean {
    return this._data.is_fully_paid === 1;
  }

  get isFinished(): boolean {
    return this._data.contract_status_name.toLowerCase() === "finalizado";
  }

  get isActive(): boolean {
    return !this.isFinished;
  }

  get isCancelled(): boolean {
    return this._data.cancelled_at !== null;
  }

  get cancellationReason(): string | null {
    return this._data.cancellation_reason;
  }

  get hasCommission(): boolean {
    return this._data.commission !== null;
  }

  get commissionData(): CommissionData | null {
    return this._data.commission;
  }

  get hasObservations(): boolean {
    return !!this._data.observations;
  }

  get hasInternalObservations(): boolean {
    return !!this._data.internal_observations;
  }

  // Date range from trips
  get serviceDate(): { start: Date | null; end: Date | null } {
    return this._trips.dateRange;
  }

  // Summary information
  get routeSummary(): string {
    if (this._trips.isEmpty) return "Sin viajes";
    if (this._trips.count === 1) {
      const trip = this._trips.firstTrip!;
      return trip.routeSummary;
    }
    return `${this._trips.count} viajes`;
  }

  get tripTypeSummary(): string {
    return this._trips.tripType;
  }

  get passengersSummary(): number {
    return this._trips.totalPassengers;
  }

  get vehicleCount(): number {
    return this._trips.vehicles.length;
  }

  // Utility methods
  get formattedAmount(): string {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(this._data.amount);
  }

  get formattedTotalWithIVA(): string {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(this.totalWithIVA);
  }

  get formattedIVA(): string {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(this._data.IVA);
  }

  // Setters for mutable properties
  set observations(value: string) {
    this._data.observations = value;
  }

  set internalObservations(value: string) {
    this._data.internal_observations = value;
  }

  set amount(value: number) {
    this._data.amount = value;
  }

  set IVA(value: number) {
    this._data.IVA = value;
  }

  set paymentStatus(value: string) {
    this._data.is_fully_paid = value === "paid" ? 1 : 0;
  }

  // Method to get all raw data
  get rawData(): ContractData {
    return { ...this._data };
  }

  // Method to update contract status
  updateContractStatus(status: ContractStatus): void {
    this._data.contract_status_id = status.id;
    this._data.contract_status_name = status.name;
  }

  // Method to update payment status
  updatePaymentStatus(status: string): void {
    this._data.is_fully_paid = status === "paid" ? 1 : 0;
  }

  // Method to get trip by ID
  getTripById(tripId: number): Trip | undefined {
    return this._trips.getTripById(tripId);
  }

  // Method to check if contract is for a specific client
  isForClient(clientId: number): boolean {
    return this._data.client?.client_id === clientId;
  }

  // Method to check if contract was created by specific user
  wasCreatedBy(userId: number): boolean {
    return this._data.creator_id === userId;
  }

  // Method to check if contract is coordinated by specific user
  isCoordinatedBy(userId: number): boolean {
    return this._data.coordinator_id === userId;
  }
}

// Utility class for handling contract API responses
export class ContractService {
  static fromApiResponse(response: ContractResponse): Contract {
    if (!response.success) {
      throw new Error("Invalid contract response");
    }
    return new Contract(response.data);
  }

  static async fetchContract(
    contractId: number,
    baseUrl: string,
    token: string,
  ): Promise<Contract> {
    try {
      const response = await fetch(`${baseUrl}/contracts/${contractId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ContractResponse = await response.json();
      return ContractService.fromApiResponse(data);
    } catch (error) {
      log.error("Error fetching contract:", error);
      throw error;
    }
  }
}

// Payment status constants
export const PAYMENT_STATUS = {
  PAID: "paid",
  PENDING: "pending",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

// Contract status constants (you may need to adjust these based on your actual status IDs)
export const CONTRACT_STATUS = {
  PENDING: 1,
  CONFIRMED: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  CANCELLED: 5,
  FINISHED: 6,
} as const;

export type PaymentStatusType =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
export type ContractStatusType =
  (typeof CONTRACT_STATUS)[keyof typeof CONTRACT_STATUS];
