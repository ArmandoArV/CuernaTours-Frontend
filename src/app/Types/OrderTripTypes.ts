import { CreateContractWithTripsRequest } from "@/services/api/contracts.service";

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
 * Helper function to map complete order + trip form data to CreateContractWithTripsRequest
 */
export const mapCompleteOrderToPayload = (
  orderData: OrderFormData,
  tripData: TripFormData,
): CreateContractWithTripsRequest => {
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
    let h = typeof hour === "string" ? parseInt(hour, 10) : hour;
    const m = typeof minutes === "string" ? parseInt(minutes, 10) : minutes;

    if (isNaN(h) || isNaN(m)) return "00:00";

    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const payload: CreateContractWithTripsRequest = {
    client_id: parseInt(orderData.empresa, 10),
    payment_type_id: parseInt(orderData.tipoPago, 10) || 1,
    IVA: orderData.aplicaIva === "Si",
    amount: parseFloat(orderData.costoViaje) || 0,
    observations: orderData.comentarios || undefined,
    internal_observations: orderData.observacionesInternas || undefined,
    coordinator_id: orderData.coordinadorViaje
      ? parseInt(orderData.coordinadorViaje, 10)
      : undefined,
    send_notification: false,

    trip: {
      service_date: convertDateFormat(tripData.idaFecha || ""),
      origin_time: convertTimeFormat(
        tripData.idaHora || "8",
        tripData.idaMinutos || "0",
        tripData.idaAmPm || "AM",
      ),
      passengers: parseInt(tripData.idaPasajeros || "1", 10),

      // Origin place
      origin: tripData.origenNombreLugar && !isNaN(parseInt(tripData.origenNombreLugar))
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
      destination: tripData.destinoNombreLugar && !isNaN(parseInt(tripData.destinoNombreLugar))
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
        ? parseInt(tripData.nombreChofer, 10)
        : undefined,
      vehicle_id: tripData.unidadAsignada
        ? parseInt(tripData.unidadAsignada, 10)
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
