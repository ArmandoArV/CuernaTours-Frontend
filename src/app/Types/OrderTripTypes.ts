export interface OrderFormData {
  empresa: string;
  empresaNombre?: string; // Nombre del cliente para mostrar
  empresaTipo?: string; // Tipo de cliente (Corporativo, Individual, etc.)
  nombreContacto: string;
  primerApellido: string;
  segundoApellido: string;
  codigoPais: string;
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
  // ===== ORIGEN =====
  origenNombreLugar?: string;
  origenCalle?: string;
  origenNumero?: string;
  origenColonia?: string;
  origenCodigoPostal?: string;
  origenCiudad?: string;
  origenEstado?: string;
  origenEsVuelo?: boolean;
  origenNumeroVuelo?: string;
  origenAerolinea?: string;
  origenLugarVuelo?: string;
  origenNotas?: string;

  // ===== DESTINO =====
  destinoNombreLugar?: string;
  destinoCalle?: string;
  destinoNumero?: string;
  destinoColonia?: string;
  destinoCodigoPostal?: string;
  destinoCiudad?: string;
  destinoEstado?: string;
  destinoEsVuelo?: boolean;
  destinoNumeroVuelo?: string;
  destinoAerolinea?: string;
  destinoLugarVuelo?: string;
  destinoNotas?: string;

  // ===== VIAJE =====
  tipoViaje?: "sencillo" | "redondo";

  idaFecha?: string;
  idaHora?: string; // STRING
  idaMinutos?: string; // STRING
  idaAmPm?: "AM" | "PM";
  idaPasajeros?: string; // STRING

  regresoFecha?: string;
  regresoHora?: string; // STRING
  regresoMinutos?: string; // STRING
  regresoAmPm?: "AM" | "PM";
  regresoPasajeros?: string; // STRING

  // ===== ASIGNACIÓN =====
  tipoUnidad?: string;
  nombreChofer?: string;

  unidadAsignada?: string;
  placa?: string;

  unidadAsignada1?: string;
  placa1?: string;

  unidadAsignada2?: string;
  placa2?: string;

  unidadAsignada3?: string;
  placa3?: string;

  observacionesChofer?: string;
  observacionesCliente?: string;
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
  type: "percentage" | "arranged";
  amount?: number;
  arranged_deal?: string;
  establishment?: string;
  status: "paid" | "pending";
}

/**
 * API payloads matching backend specification
 */

export interface PlacePayload {
  place_id?: number;
  name?: string;
  address?: string;
  number?: string;
  colonia?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  annotations?: string;
}

export interface FlightPayload {
  flight_number: string; // REQUIRED if flight exists
  airline?: string;
  arrival_time?: string; // ISO datetime
  flight_origin?: string;
  notes?: string;
}

export interface TripPayload {
  service_date: string; // YYYY-MM-DD
  origin_time: string; // HH:MM
  passengers: number;

  origin: PlacePayload;
  destination: PlacePayload;

  unit_type?: string;
  driver_id?: number;
  external_driver_id?: number;
  vehicle_id?: number;
  observations?: string;
  internal_observations?: string;

  flight?: FlightPayload;

  is_round_trip?: boolean;
  return_date?: string; // YYYY-MM-DD
  return_time?: string; // HH:MM
}

export interface CommissionPayload {
  type: "percentage" | "arranged";
  amount?: number; // REQUIRED if type='percentage'
  arranged_deal?: string; // REQUIRED if type='arranged'
  establishment?: string;
}

export interface CreateContractPayload {
  client_id: number;
  payment_type_id: number;
  IVA: boolean;
  amount: number;

  coordinator_id?: number;
  observations?: string;
  internal_observations?: string;
  send_notification?: boolean;
  has_received_money?: boolean;

  commission?: CommissionPayload;
  trip: TripPayload;
}

// Legacy interfaces for backward compatibility
export interface CreateTripPayload {
  contract_id: number;
  service_date: string;
  origin_id: number;
  origin_time: string;
  destination_id: number;
  passengers: number;
  unit_type?: string;
  vehicle_id?: number;
  driver_id?: number;
  contract_trip_status_id?: number;
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

export interface TripDetailsPayload {
  service_date?: string;
  origin_time?: string;
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
  return_date?: string;
  return_time?: string;
}

export interface CreateOrderPayload {
  client_id: number;
  payment_type_id: number;
  IVA: boolean;
  amount: number;
  coordinator_id?: number;
  observations?: string;
  internal_observations?: string;
  send_notification?: boolean;
  has_received_money?: boolean;
  commission?: CommissionPayload;
  trip?: TripDetailsPayload;
}

/**
 * Mapping utilities
 */

// Helper function to map complete order + trip form data to CreateContractPayload
export const mapCompleteOrderToPayload = (
  orderData: OrderFormData,
  tripData: TripFormData,
): CreateContractPayload => {
  // Convert DD/MM/YYYY to YYYY-MM-DD
  const convertDateFormat = (ddmmyyyy: string): string => {
    if (!ddmmyyyy) return "";
    const parts = ddmmyyyy.split("/");
    if (parts.length !== 3) return "";
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  };

  // Convert time to HH:MM format
  const convertTimeFormat = (
    hour: string,
    minutes: string,
    ampm: "AM" | "PM",
  ): string => {
    let h = typeof hour === "string" ? parseInt(hour) : hour;
    const m = typeof minutes === "string" ? parseInt(minutes) : minutes;

    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const payload: CreateContractPayload = {
    client_id: parseInt(orderData.empresa),
    payment_type_id: parseInt(orderData.tipoPago) || 1,
    IVA: orderData.aplicaIva === "Si",
    amount: parseFloat(orderData.costoViaje),
    observations: orderData.comentarios || undefined,
    internal_observations: orderData.observacionesInternas || undefined,
    coordinator_id: orderData.coordinadorViaje
      ? parseInt(orderData.coordinadorViaje)
      : undefined,
    send_notification: false,
    has_received_money: false,

    trip: {
      service_date: convertDateFormat(tripData.idaFecha || ""),
      origin_time: convertTimeFormat(
        tripData.idaHora || "8",
        tripData.idaMinutos || "0",
        tripData.idaAmPm || "AM",
      ),
      passengers: parseInt(tripData.idaPasajeros || "1", 10),

      // Origin place
      origin: tripData.origenNombreLugar
        ? { place_id: parseInt(tripData.origenNombreLugar, 10) }
        : {
            name: "Origen",
            address: tripData.origenCalle,
            number: tripData.origenNumero,
            colonia: tripData.origenColonia,
            city: tripData.origenCiudad,
            state: tripData.origenEstado,
            zip_code: tripData.origenCodigoPostal,
            annotations: tripData.origenNotas,
          },
      // Destination place
      destination: tripData.destinoNombreLugar
        ? { place_id: parseInt(tripData.destinoNombreLugar, 10) }
        : {
            name: "Destino",
            address: tripData.destinoCalle,
            number: tripData.destinoNumero,
            colonia: tripData.destinoColonia,
            city: tripData.destinoCiudad,
            state: tripData.destinoEstado,
            zip_code: tripData.destinoCodigoPostal,
            annotations: tripData.destinoNotas,
          },

      unit_type: tripData.tipoUnidad || undefined,
      driver_id: tripData.nombreChofer
        ? parseInt(tripData.nombreChofer)
        : undefined,
      vehicle_id: tripData.unidadAsignada
        ? parseInt(tripData.unidadAsignada)
        : undefined,
      observations: tripData.observacionesCliente || undefined,
      internal_observations: tripData.observacionesChofer || undefined,

      // Flight info (if origin is a flight)
      flight:
        tripData.origenEsVuelo && tripData.origenNumeroVuelo
          ? {
              flight_number: tripData.origenNumeroVuelo,
              airline: tripData.origenAerolinea,
              flight_origin: tripData.origenLugarVuelo,
              notes: tripData.origenNotas,
            }
          : undefined,

      // Round trip
      is_round_trip: tripData.tipoViaje === "redondo",
      return_date:
        tripData.tipoViaje === "redondo"
          ? convertDateFormat(tripData.regresoFecha || "")
          : undefined,
      return_time:
        tripData.tipoViaje === "redondo"
          ? convertTimeFormat(
              tripData.regresoHora || "8",
              tripData.regresoMinutos || "0",
              tripData.regresoAmPm || "AM",
            )
          : undefined,
    },
  };

  // Add commission if applicable
  if (orderData.llevaComision === "Si" && orderData.nombreRecibeComision) {
    payload.commission = {
      type: orderData.tipoComision === "Porcentaje" ? "percentage" : "arranged",
      establishment: orderData.nombreRecibeComision,
    };

    if (orderData.tipoComision === "Porcentaje" && orderData.porcentaje) {
      payload.commission.amount = parseFloat(orderData.porcentaje);
    }
    if (orderData.montoArreglado) {
      payload.commission.arranged_deal = orderData.montoArreglado;
    }
  }

  return payload;
};

// Helper function to map form data to CreateOrderPayload (legacy - for backward compatibility)
export const mapOrderFormToPayload = (
  formData: OrderFormData,
): CreateOrderPayload => {
  const payload: CreateOrderPayload = {
    client_id: parseInt(formData.empresa),
    payment_type_id: parseInt(formData.tipoPago) || 1,
    IVA: formData.aplicaIva === "Si",
    amount: parseFloat(formData.costoViaje),
    observations: formData.comentarios || undefined,
    internal_observations: formData.observacionesInternas || undefined,
    coordinator_id: formData.coordinadorViaje
      ? parseInt(formData.coordinadorViaje)
      : undefined,
    send_notification: false,
    has_received_money: false,
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

// Helper function to map trip form data to CreateTripPayload (legacy - for separate trip creation)
export const mapTripFormToPayload = (
  tripFormData: any,
  contractId: number,
): CreateTripPayload => {
  // Convert DD/MM/YYYY to YYYY-MM-DD
  const convertDateFormat = (ddmmyyyy: string): string => {
    if (!ddmmyyyy) return "";
    const parts = ddmmyyyy.split("/");
    if (parts.length !== 3) return "";
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  };

  const convertTimeFormat = (
    hour: string,
    minutes: string,
    ampm: "AM" | "PM",
  ): string => {
    let h = parseInt(hour, 10);
    const m = parseInt(minutes, 10);

    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const payload: CreateTripPayload = {
    contract_id: contractId,
    service_date: convertDateFormat(tripFormData.idaFecha),
    origin_id: parseInt(tripFormData.origenNombreLugar) || 0,
    origin_time: convertTimeFormat(
      tripFormData.idaHora || "8",
      tripFormData.idaMinutos || "0",
      tripFormData.idaAmPm || "AM",
    ),
    destination_id: parseInt(tripFormData.destinoNombreLugar) || 0,
    passengers:
      parseInt(tripFormData.numeroPasajeros || tripFormData.idaPasajeros) || 1,
    unit_type: tripFormData.tipoUnidad || undefined,
    vehicle_id: tripFormData.unidadAsignada
      ? parseInt(tripFormData.unidadAsignada)
      : undefined,
    driver_id: tripFormData.nombreChofer
      ? parseInt(tripFormData.nombreChofer)
      : undefined,
    contract_trip_status_id: 1,
  };

  return payload;
};
