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