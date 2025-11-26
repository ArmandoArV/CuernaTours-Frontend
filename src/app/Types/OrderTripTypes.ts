export interface OrderFormData {
  empresa: string;
  nombreContacto: string;
  primerApellido: string;
  segundoApellido: string;
  telefono: string;
  tieneWhatsapp: string;
  correoElectronico: string;
  comentarios: string;
  tipoPago: string;
  aplicaIva: string;
  costoViaje: string;
  llevaComision: string;
  nombreRecibeComision: string;
  tipoComision: string;
  porcentaje: string;
  montoArreglado: string;
  coordinadorViaje: string;
  observacionesInternas: string;
}

export interface TripFormData {
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  lugarSalida: string;
  lugarDestino: string;
  numeroPersonas: string;
  tipoTransporte: string;
  descripcionViaje: string;
  requisitosPasajeros: string;
  incluye: string;
  noIncluye: string;
  observacionesViaje: string;
  conductor: string;
  vehiculo: string;
}

export interface CompleteOrderTripData {
  order: OrderFormData;
  trip: TripFormData;
}

/**
 * Contract Model
 */

export interface Contract {
  contract_id: number;
  client_id: number;
  created_at: string | Date;
  payment_type_id: number;
  IVA: boolean;
  amount: number;
  commission_id?: number;
  observations?: string;
  internal_observations?: string;
  coordinator_id?: number;
  creator_id: number;
  contract_status_id: number;
}

export interface ContractStatus {
  contract_status_id: number;
  name: string;
  description?: string;
}

export interface Commission {
  commission_id: number;
  type: 'percentage' | 'arranged';
  amount?: number;
  arranged_deal?: string;
  establishment?: string;
  status: 'paid' | 'pending';
}

/**
 * API payloads
 */

export interface CreateTripPayload {
  contract_id: number;
  service_date: string; // YYYY-MM-DD
  origin_id: number;
  origin_time: string; // HH:mm:ss or HH:mm
  destination_id: number;
  passengers: number;
  unit_type?: string;
  vehicle_id?: number;
  driver_id?: number;
  contract_trip_status_id?: number;
}

export interface CommissionPayload {
  type: 'percentage' | 'arranged';
  amount?: number;
  arranged_deal?: string;
  establishment?: string;
}

export interface OriginPayload {
  place_id?: number;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface DestinationPayload {
  place_id?: number;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface FlightPayload {
  flight_number?: string;
  airline?: string;
  arrival_time?: string; // ISO timestamp
  flight_origin?: string;
  notes?: string;
}

export interface TripDetailsPayload {
  service_date?: string; // YYYY-MM-DD
  origin_time?: string; // HH:mm or HH:mm:ss
  passengers?: number;
  unit_type?: string;
  driver_id?: number;
  vehicle_id?: number;
  observations?: string;
  internal_observations?: string;
  origin?: OriginPayload;
  destination?: DestinationPayload;
  flight?: FlightPayload;
  is_round_trip?: boolean;
  return_date?: string; // YYYY-MM-DD
  return_time?: string; // HH:mm
}

export interface CreateOrderPayload {
  client_id: number;
  payment_type_id: number;
  IVA: boolean;
  amount: number;
  coordinator_id?: number;
  observations?: string;
  internal_observations?: string;
  commission?: CommissionPayload;
  trip?: TripDetailsPayload;
}

/**
 * Mapping utilities
 */

// Helper function to map form data to CreateOrderPayload
export const mapOrderFormToPayload = (formData: OrderFormData): CreateOrderPayload => {
  const payload: CreateOrderPayload = {
    client_id: parseInt(formData.empresa),
    payment_type_id: getPaymentTypeId(formData.tipoPago),
    IVA: formData.aplicaIva === "Si",
    amount: parseFloat(formData.costoViaje),
    observations: formData.comentarios || undefined,
    internal_observations: formData.observacionesInternas || undefined,
    coordinator_id: formData.coordinadorViaje ? getCoordinatorId(formData.coordinadorViaje) : undefined,
  };

  // Add commission if applicable
  if (formData.llevaComision === "Si" && formData.nombreRecibeComision) {
    payload.commission = {
      type: formData.tipoComision === "Porcentaje" ? "percentage" : "arranged",
      establishment: formData.nombreRecibeComision,
    };

    if (formData.tipoComision === "Porcentaje" && formData.porcentaje) {
      payload.commission.amount = parseFloat(formData.porcentaje);
    }
    if (formData.montoArreglado) {
      payload.commission.arranged_deal = formData.montoArreglado;
    }
  }

  return payload;
};

// Helper functions for mapping select values to IDs
const getPaymentTypeId = (tipoPago: string): number => {
  const mapping: Record<string, number> = {
    efectivo: 1,
    transferencia: 2,
    tarjeta: 3,
  };
  return mapping[tipoPago] || 1;
};

const getCoordinatorId = (coordinador: string): number => {
  const mapping: Record<string, number> = {
    coordinador1: 1,
    coordinador2: 2,
    coordinador3: 3,
  };
  return mapping[coordinador] || 1;
};

// Helper function to map trip form data to CreateTripPayload
export const mapTripFormToPayload = (tripFormData: any, contractId: number): CreateTripPayload => {
  // Convert DD/MM/YYYY to YYYY-MM-DD
  const convertDateFormat = (ddmmyyyy: string): string => {
    if (!ddmmyyyy) return "";
    const parts = ddmmyyyy.split("/");
    if (parts.length !== 3) return "";
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  };

  // Convert time to HH:mm:ss format
  const convertTimeFormat = (hour: number, minutes: number, ampm: string): string => {
    let h = hour;
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
  };

  const payload: CreateTripPayload = {
    contract_id: contractId,
    service_date: convertDateFormat(tripFormData.idaFecha),
    origin_id: parseInt(tripFormData.origenNombreLugar) || 0,
    origin_time: convertTimeFormat(
      tripFormData.idaHora || 8,
      tripFormData.idaMinutos || 0,
      tripFormData.idaAmPm || "AM"
    ),
    destination_id: parseInt(tripFormData.destinoNombreLugar) || 0,
    passengers: parseInt(tripFormData.numeroPasajeros || tripFormData.idaPasajeros) || 1,
    unit_type: tripFormData.tipoUnidad || undefined,
    vehicle_id: tripFormData.unidadAsignada ? parseInt(tripFormData.unidadAsignada) : undefined,
    driver_id: tripFormData.nombreChofer ? parseInt(tripFormData.nombreChofer) : undefined,
    contract_trip_status_id: 1, // Default status
  };

  return payload;
};