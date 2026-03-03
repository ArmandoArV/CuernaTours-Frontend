"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("OrderContext");

// Types
interface OrderFormData {
  empresa: string;
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

interface TripFormData {
  // ===== ORIGEN =====
  origenNombreLugar?: string;
  origenNombreDisplay?: string;
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
  destinoNombreDisplay?: string;
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
  nombreChofer?: string;

  observacionesChofer?: string;
  observacionesCliente?: string;
}

interface OrderContextType {
  orderData: OrderFormData;
  tripData: TripFormData;
  setOrderData: (data: OrderFormData) => void;
  setTripData: (data: TripFormData) => void;
  clearData: () => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => void;
}

// Default values
const defaultOrderData: OrderFormData = {
  empresa: "",
  nombreContacto: "",
  primerApellido: "",
  segundoApellido: "",
  codigoPais: "+52",
  telefono: "",
  tieneWhatsapp: "",
  correoElectronico: "",
  comentarios: "",
  tipoPago: "",
  aplicaIva: "",
  costoViaje: "",
  llevaComision: "",
  nombreRecibeComision: "",
  tipoComision: "",
  porcentaje: "",
  montoArreglado: "",
  coordinadorViaje: "",
  observacionesInternas: "",
};

const defaultTripData: TripFormData = {
  origenNombreLugar: "",
  origenNombreDisplay: "",
  origenCalle: "",
  origenNumero: "",
  origenColonia: "",
  origenCodigoPostal: "",
  origenCiudad: "",
  origenEstado: "",
  origenEsVuelo: false,
  origenNumeroVuelo: "",
  origenAerolinea: "",
  origenLugarVuelo: "",
  origenNotas: "",

  destinoNombreLugar: "",
  destinoNombreDisplay: "",
  destinoCalle: "",
  destinoNumero: "",
  destinoColonia: "",
  destinoCodigoPostal: "",
  destinoCiudad: "",
  destinoEstado: "",
  destinoEsVuelo: false,
  destinoNumeroVuelo: "",
  destinoAerolinea: "",
  destinoLugarVuelo: "",
  destinoNotas: "",

  tipoViaje: "sencillo",

  idaFecha: "",
  idaHora: "8",
  idaMinutos: "0",
  idaAmPm: "AM",
  idaPasajeros: "",

  regresoFecha: "",
  regresoHora: "8",
  regresoMinutos: "0",
  regresoAmPm: "AM",
  regresoPasajeros: "",

  nombreChofer: "",
  observacionesChofer: "",
  observacionesCliente: "",
};
// Create context
const OrderContext = createContext<OrderContextType | undefined>(undefined);

// Provider component
export function OrderProvider({ children }: { children: ReactNode }) {
  const [orderData, setOrderData] = useState<OrderFormData>(defaultOrderData);
  const [tripData, setTripData] = useState<TripFormData>(defaultTripData);

  // Load data from localStorage on mount
  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  const saveToLocalStorage = () => {
    const data = {
      orderData,
      tripData,
      timestamp: Date.now(),
    };
    localStorage.setItem("orderFormData", JSON.stringify(data));
  };

  const loadFromLocalStorage = () => {
    try {
      const storedData = localStorage.getItem("orderFormData");
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        if (parsedData.orderData) {
          setOrderData(parsedData.orderData);
        }
        if (parsedData.tripData) {
          setTripData(parsedData.tripData);
        }
        // Handle legacy format (old localStorage structure)
        else if (parsedData.empresa) {
          // Old format - direct form data
          const { tripFormData, contract_id, ...oldOrderData } = parsedData;
          setOrderData(oldOrderData);
          if (tripFormData) {
            setTripData(tripFormData);
          }
        }
      }
    } catch (error) {
      log.error("Error loading data from localStorage:", error);
    }
  };

  const clearData = () => {
    setOrderData(defaultOrderData);
    setTripData(defaultTripData);
    localStorage.removeItem("orderFormData");
  };

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    // Only save if we have actual data (not just default values)
    if (orderData.empresa || tripData.idaFecha) {
      const timeoutId = setTimeout(() => {
        saveToLocalStorage();
      }, 500); // Debounce saves

      return () => clearTimeout(timeoutId);
    }
  }, [orderData, tripData]);

  const value: OrderContextType = {
    orderData,
    tripData,
    setOrderData,
    setTripData,
    clearData,
    saveToLocalStorage,
    loadFromLocalStorage,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
}

// Hook to use the context
export function useOrderContext() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrderContext must be used within an OrderProvider");
  }
  return context;
}
