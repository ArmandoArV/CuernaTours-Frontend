// Trip-related interfaces and classes
export interface TripStatus {
  id: number;
  name: string;
}

export interface Location {
  id: number;
  name: string;
  address: string;
}

export interface Vehicle {
  id: number;
  alias: string;
  type?: string;
  license_plate: string;
}

export interface Driver {
  id: number;
  name?: string;
  lastname?: string;
  phone?: string;
  driver_displayname?: string;
}

export interface Flight {
  id: number;
  flight_number: string;
  airline: string;
  arrival_time: string;
  flight_origin: string;
  notes?: string;
}

export interface TripStopPlace {
  id: number;
  name: string;
  address?: string;
}

export interface TripStop {
  stop_id?: number;
  place_id?: number;
  place_name?: string;
  place?: TripStopPlace;
  description?: string | null;
  stop_order: number;
  address?: string;
  city?: string;
  state?: string;
}

export interface TripUnitDetail {
  unit_id?: number;
  contract_trip_unit_id?: number;
  vehicle_type?: string;
  vehicle_type_name?: string;
  vehicle_type_id?: number;
  vehicle?: Vehicle | null;
  vehicle_alias?: string;
  vehicle_license_plate?: string;
  driver?: Driver | null;
  driver_id?: number;
  driver_name?: string;
  driver_lastname?: string;
  external_driver_id?: number;
  external_driver_name?: string;
  notes?: string;
}

export interface TripData {
  trip_id: number;
  service_date: string;
  origin_time: string;
  passengers: number;
  status: TripStatus;
  origin: Location;
  destination: Location;
  // Vehicle and driver are now sourced from units; kept optional for legacy consumers
  vehicle?: Vehicle | null;
  driver?: Driver | null;
  flight?: Flight;
  notes?: string;
  internal_notes?: string;
  stops?: TripStop[];
  return_stops?: TripStop[];
  units?: TripUnitDetail[];
}

export class Trip {
  private _data: TripData;
  constructor(tripData: TripData) {
    this._data = {
      ...tripData,
      vehicle: tripData.vehicle ?? null,
      driver: tripData.driver ?? null,
      origin: tripData.origin ?? null,
      destination: tripData.destination ?? null,
      notes: tripData.notes ?? "",
      internal_notes: tripData.internal_notes ?? "",
    };
  }
  // Basic trip information getters
  get tripId(): number {
    return this._data.trip_id;
  }

  get serviceDate(): string {
    return this._data.service_date;
  }

  get originTime(): string {
    return this._data.origin_time;
  }

  get passengers(): number {
    return this._data.passengers;
  }

  /** Vehicle type label derived from first unit */
  get unitType(): string {
    const firstUnit = this._data.units?.[0];
    return firstUnit?.vehicle_type_name ?? firstUnit?.vehicle_type ?? "";
  }

  get notes(): string {
    return this._data.notes || "";
  }

  get internalNotes(): string {
    return this._data.internal_notes || "";
  }

  // Status getters
  get status(): TripStatus {
    return this._data.status;
  }

  get statusName(): string {
    return this._data.status.name;
  }

  get statusId(): number {
    return this._data.status.id;
  }

  // Location getters
  get origin(): Location {
    return this._data.origin;
  }

  get destination(): Location {
    return this._data.destination;
  }

  get originName(): string {
    return this._data.origin.name;
  }

  get destinationName(): string {
    return this._data.destination.name;
  }

  get originAddress(): string {
    return this._data.origin.address;
  }

  get destinationAddress(): string {
    return this._data.destination.address;
  }

  // Vehicle getters — first check direct field, fall back to first unit
  get vehicle(): Vehicle | null {
    if (this._data.vehicle) return this._data.vehicle;
    const u = this._data.units?.[0];
    if (!u) return null;
    if (u.vehicle) return u.vehicle;
    if (u.vehicle_alias || u.vehicle_license_plate) {
      return {
        id: 0,
        alias: u.vehicle_alias ?? "",
        type: u.vehicle_type_name ?? u.vehicle_type ?? "",
        license_plate: u.vehicle_license_plate ?? "",
      };
    }
    return null;
  }

  get vehicleAlias(): string {
    return this.vehicle?.alias ?? "";
  }

  get vehicleType(): string {
    return this.vehicle?.type ?? this.unitType ?? "—";
  }

  get licensePlate(): string {
    return this.vehicle?.license_plate ?? "";
  }

  // Driver getters — first check direct field, fall back to first unit
  get driver(): Driver | null {
    if (this._data.driver) return this._data.driver;
    const u = this._data.units?.[0];
    if (!u) return null;
    if (u.driver) return u.driver;
    if (u.driver_name) {
      return {
        id: u.driver_id ?? 0,
        name: u.driver_name,
        lastname: u.driver_lastname ?? "",
        phone: "",
      };
    }
    return null;
  }

  get driverName(): string {
    const d = this.driver;
    if (!d) return "";
    if (d.driver_displayname) return d.driver_displayname;
    return [d.name, d.lastname].filter(Boolean).join(" ");
  }

  get driverFirstName(): string {
    return this.driver?.name ?? "";
  }

  get driverLastName(): string {
    return this.driver?.lastname ?? "";
  }

  get driverPhone(): string {
    return this.driver?.phone ?? "";
  }

  // Units getter
  get units(): TripUnitDetail[] {
    return this._data.units ?? [];
  }

  // Flight getters
  get flight(): Flight | undefined {
    return this._data.flight;
  }

  get hasFlightInfo(): boolean {
    return !!this._data.flight;
  }

  get flightNumber(): string {
    return this._data.flight?.flight_number || "";
  }

  get airline(): string {
    return this._data.flight?.airline || "";
  }

  get flightArrivalTime(): string {
    return this._data.flight?.arrival_time || "";
  }

  get flightOrigin(): string {
    return this._data.flight?.flight_origin || "";
  }

  get flightNotes(): string {
    return this._data.flight?.notes || "";
  }

  // Stops getters
  get stops(): TripStop[] {
    return this._data.stops ?? [];
  }

  get returnStops(): TripStop[] {
    return this._data.return_stops ?? [];
  }

  get hasStops(): boolean {
    return this.stops.length > 0;
  }

  get hasReturnStops(): boolean {
    return this.returnStops.length > 0;
  }

  get sortedStops(): TripStop[] {
    return [...this.stops].sort((a, b) => a.stop_order - b.stop_order);
  }

  get sortedReturnStops(): TripStop[] {
    return [...this.returnStops].sort((a, b) => a.stop_order - b.stop_order);
  }

  // Utility methods
  get formattedServiceDate(): Date {
    return new Date(this._data.service_date);
  }

  get formattedFlightArrivalTime(): Date | null {
    return this._data.flight?.arrival_time
      ? new Date(this._data.flight.arrival_time)
      : null;
  }

  get routeSummary(): string {
    return `${this.originName} → ${this.destinationName}`;
  }

  get vehicleInfo(): string {
    return `${this.vehicleAlias} (${this.licensePlate})`;
  }

  get flightInfo(): string {
    if (!this.hasFlightInfo) return "";
    return `${this.flightNumber} - ${this.airline}`;
  }

  // Setters for mutable properties
  set notes(value: string) {
    this._data.notes = value;
  }

  set internalNotes(value: string) {
    this._data.internal_notes = value;
  }

  set passengers(value: number) {
    this._data.passengers = value;
  }

  set originTime(value: string) {
    this._data.origin_time = value;
  }

  // Method to get all data
  get rawData(): TripData {
    return { ...this._data };
  }

  // Method to update status
  updateStatus(status: TripStatus): void {
    this._data.status = status;
  }

  // Method to check if trip is on a specific date
  isOnDate(date: Date): boolean {
    const tripDate = new Date(this._data.service_date);
    return tripDate.toDateString() === date.toDateString();
  }

  // Method to check if this is a return trip compared to another trip
  isReturnTripOf(otherTrip: Trip): boolean {
    return (
      this.origin.id === otherTrip.destination.id &&
      this.destination.id === otherTrip.origin.id
    );
  }
}

// Utility class to handle multiple trips
export class TripCollection {
  private _trips: Trip[];

  constructor(tripsData: TripData[]) {
    this._trips = (tripsData ?? []).map((tripData) => new Trip(tripData));
  }

  get trips(): Trip[] {
    return this._trips;
  }

  get count(): number {
    return this._trips.length;
  }

  get isEmpty(): boolean {
    return this._trips.length === 0;
  }

  getTripById(id: number): Trip | undefined {
    return this._trips.find((trip) => trip.tripId === id);
  }

  get sortedByDate(): Trip[] {
    return [...this._trips].sort((a, b) => {
      const aTime = a.formattedServiceDate?.getTime?.() ?? 0;
      const bTime = b.formattedServiceDate?.getTime?.() ?? 0;
      return aTime - bTime;
    });
  }

  get firstTrip(): Trip | undefined {
    return this.sortedByDate[0];
  }

  get lastTrip(): Trip | undefined {
    const sorted = this.sortedByDate;
    return sorted[sorted.length - 1];
  }

  get isRoundTrip(): boolean {
    if (this._trips.length !== 2) return false;
    const [trip1, trip2] = this._trips;
    return trip1.isReturnTripOf(trip2) || trip2.isReturnTripOf(trip1);
  }

  get tripType(): string {
    if (this.isEmpty) return "N/A";
    if (this.count === 1) return "Sencillo";
    if (this.isRoundTrip) return "Redondo";
    return `${this.count} viajes`;
  }

  get totalPassengers(): number {
    if (this.isEmpty) return 0;
    return Math.max(...this._trips.map((trip) => trip.passengers));
  }

  /** Collects unique drivers across all trips (from units) */
  get drivers(): Driver[] {
    const uniqueDrivers = new Map<number, Driver>();
    this._trips.forEach((trip) => {
      const d = trip.driver;
      if (d?.id) uniqueDrivers.set(d.id, d);
    });
    return Array.from(uniqueDrivers.values());
  }

  /** Collects unique vehicles across all trips (from units) */
  get vehicles(): Vehicle[] {
    const uniqueVehicles = new Map<number, Vehicle>();
    this._trips.forEach((trip) => {
      const v = trip.vehicle;
      if (v?.id) uniqueVehicles.set(v.id, v);
    });
    return Array.from(uniqueVehicles.values());
  }

  get dateRange(): { start: Date | null; end: Date | null } {
    if (this.isEmpty) return { start: null, end: null };
    const sorted = this.sortedByDate;
    return {
      start: sorted[0]?.formattedServiceDate ?? null,
      end: sorted[sorted.length - 1]?.formattedServiceDate ?? null,
    };
  }

  toArray(): Trip[] {
    return this._trips;
  }
}
