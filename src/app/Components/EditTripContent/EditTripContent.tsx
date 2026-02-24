"use client";
import { useState, useCallback, useEffect } from "react";
import styles from "../CreateTripContent/CreateTripContent.module.css";
import InputComponent from "../InputComponent/InputComponent";
import SelectComponent from "../SelectComponent/SelectComponent";
import SearchableSelectComponent, {
  SearchableSelectOption,
} from "../SearchableSelectComponent/SearchableSelectComponent";
import CreatePlaceModal from "../CreatePlaceModal/CreatePlaceModal";
import ConfirmationModal from "../ConfirmationModal/ConfirmationModal";
import {
  ArrowHookUpLeftRegular,
  Edit24Regular,
  Save24Regular,
} from "@fluentui/react-icons";
import DatePickerComponent from "../DatePickerComponent/DatePickerComponent";
import Link from "next/link";
import { showErrorAlert, showSuccessAlert } from "@/app/Utils/AlertUtil";
import {
  mapCompleteOrderToPayload,
  OrderFormData,
} from "@/app/Types/OrderTripTypes";
import { useOrderContext } from "@/app/Contexts/OrderContext";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/app/hooks/useUserRole";
import type { TripFormData } from "@/app/Types/OrderTripTypes";
import {
  referenceService,
  contractsService,
  tripsService,
  ApiError,
} from "@/services/api";

interface EditTripContentProps {
  contractId: string;
}

export default function EditTripContent({ contractId }: EditTripContentProps) {
  const { orderData, tripData, setTripData, clearData } = useOrderContext();
  const router = useRouter();
  const { canAssignResources } = useUserRole();

  // Loading state for trip data
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);

  // Edit mode states
  const [isEditingOrigen, setIsEditingOrigen] = useState(false);
  const [isEditingDestino, setIsEditingDestino] = useState(false);
  const [isEditingViaje, setIsEditingViaje] = useState(false);
  const [isEditingAsignacion, setIsEditingAsignacion] = useState(false);

  // Original data for cancel functionality
  const [originalOrigenData, setOriginalOrigenData] = useState<
    Partial<TripFormData>
  >({});
  const [originalDestinoData, setOriginalDestinoData] = useState<
    Partial<TripFormData>
  >({});
  const [originalViajeData, setOriginalViajeData] = useState<
    Partial<TripFormData>
  >({});
  const [originalAsignacionData, setOriginalAsignacionData] = useState<
    Partial<TripFormData>
  >({});

  // Trip-specific form data
  const [tripFormData, setTripFormData] = useState<TripFormData>(() => ({
    idaFecha: tripData?.idaFecha || "",
    regresoFecha: tripData?.regresoFecha || "",
    unidadAsignada1: "",
    placa1: "",
    unidadAsignada2: "",
    placa2: "",
    unidadAsignada3: "",
    placa3: "",
    tipoViaje: tripData?.tipoViaje as "sencillo" | "redondo" | undefined,
  }));

  // Dropdown data
  const [lugares, setLugares] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [choferes, setChoferes] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [unidades, setUnidades] = useState<
    Array<{ value: string; label: string; licensePlate?: string }>
  >([]);

  // Place modal state
  const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
  const [placeModalContext, setPlaceModalContext] = useState<
    "origen" | "destino" | null
  >(null);

  // Confirmation modal state
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Function to check if a field is required
  const isFieldRequired = (field: string): boolean => {
    const requiredFields = [
      "origenNombreLugar",
      "origenCalle",
      "origenNumero",
      "origenColonia",
      "origenCodigoPostal",
      "origenCiudad",
      "origenEstado",
      "destinoNombreLugar",
      "destinoCalle",
      "destinoNumero",
      "destinoColonia",
      "destinoCodigoPostal",
      "destinoCiudad",
      "destinoEstado",
      "idaFecha",
      "idaPasajeros",
      "tipoUnidad",
    ];
    return requiredFields.includes(field);
  };

  // Function to validate a specific field
  const validateField = (field: string, value: any): string | null => {
    if (!value && isFieldRequired(field)) {
      return "Este campo es obligatorio";
    }

    // Add specific validations here
    if (field.includes("CodigoPostal") && value && !/^\d{5}$/.test(value)) {
      return "El código postal debe tener 5 dígitos";
    }

    if (field.includes("Numero") && value && !/^\d+$/.test(value)) {
      return "Este campo solo debe contener números";
    }

    return null;
  };

  // Handle field touch
  const handleFieldTouch = (field: string) => {
    setTouchedFields((prev) => new Set(prev).add(field));

    // Validate the field
    const error = validateField(field, getFieldValue(field));
    if (error) {
      setErrors((prev) => ({ ...prev, [field]: error }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Helper to get field value from tripFormData
  const getFieldValue = (field: string): any => {
    return (tripFormData as any)[field];
  };

  // Place search and selection handlers
  const handlePlaceSearch = async (
    query: string,
  ): Promise<SearchableSelectOption[]> => {
    try {
      const results = await referenceService.searchPlaces(query);
      return results.map((place) => ({
        value: (place.place_id || place.id)?.toString() || "",
        label: place.name || place.nombre || "",
        data: place,
      }));
    } catch (error) {
      console.error("Error searching places:", error);
      return [];
    }
  };

  const handlePlaceSelect = async (
    field: string,
    placeId: string,
    option?: SearchableSelectOption,
  ) => {
    setTripFormData((prev) => ({ ...prev, [field]: placeId }));
    handleFieldTouch(field);

    // Auto-fill address fields if available
    if (option?.data) {
      try {
        const placeDetails = await referenceService.getPlaceById(
          parseInt(placeId),
        );
        const prefix = field === "origenNombreLugar" ? "origen" : "destino";

        const updates: Partial<TripFormData> = {
          [`${prefix}Calle`]: placeDetails.address || "",
          [`${prefix}Numero`]: placeDetails.number || "",
          [`${prefix}Colonia`]: placeDetails.colonia || "",
          [`${prefix}CodigoPostal`]: placeDetails.zip_code || "",
          [`${prefix}Ciudad`]: placeDetails.city || "",
          [`${prefix}Estado`]: placeDetails.state || "",
        };

        setTripFormData((prev) => ({ ...prev, ...updates }));

        // Mark all auto-filled fields as touched
        Object.keys(updates).forEach((key) => handleFieldTouch(key));
      } catch (error) {
        console.error("Error fetching place details:", error);
      }
    }
  };

  const handleCreatePlace = (context: "origen" | "destino") => {
    setPlaceModalContext(context);
    setIsPlaceModalOpen(true);
  };

  const handlePlaceCreated = (
    placeId: number,
    placeName: string,
    placeData?: any,
  ) => {
    if (placeModalContext === "origen") {
      setTripFormData((prev) => ({
        ...prev,
        origenNombreLugar: placeId.toString(),
        origenCalle: placeData?.address || "",
        origenNumero: placeData?.number || "",
        origenColonia: placeData?.colonia || "",
        origenCodigoPostal: placeData?.zip_code || "",
        origenCiudad: placeData?.city || "",
        origenEstado: placeData?.state || "",
      }));

      // Mark all origin fields as touched
      const originFields = [
        "origenNombreLugar",
        "origenCalle",
        "origenNumero",
        "origenColonia",
        "origenCodigoPostal",
        "origenCiudad",
        "origenEstado",
      ];
      originFields.forEach((field) => handleFieldTouch(field));
    } else if (placeModalContext === "destino") {
      setTripFormData((prev) => ({
        ...prev,
        destinoNombreLugar: placeId.toString(),
        destinoCalle: placeData?.address || "",
        destinoNumero: placeData?.number || "",
        destinoColonia: placeData?.colonia || "",
        destinoCodigoPostal: placeData?.zip_code || "",
        destinoCiudad: placeData?.city || "",
        destinoEstado: placeData?.state || "",
      }));

      // Mark all destination fields as touched
      const destFields = [
        "destinoNombreLugar",
        "destinoCalle",
        "destinoNumero",
        "destinoColonia",
        "destinoCodigoPostal",
        "destinoCiudad",
        "destinoEstado",
      ];
      destFields.forEach((field) => handleFieldTouch(field));
    }

    setIsPlaceModalOpen(false);
    setPlaceModalContext(null);
  };

  // Fetch functions
  const fetchLugares = useCallback(async () => {
    try {
      const data = await referenceService.getPlaces();
      const lugarOptions = referenceService.transformPlacesForSelect(data);
      setLugares(lugarOptions);
    } catch (error) {
      console.error("Error fetching lugares:", error);
    }
  }, []);

  const fetchChoferes = useCallback(async () => {
    try {
      const data = await referenceService.getDrivers();
      const choferOptions = referenceService.transformDriversForSelect(data);
      setChoferes(choferOptions);
    } catch (error) {
      console.error("Error fetching choferes:", error);
    }
  }, []);

  const fetchUnidades = useCallback(async () => {
    try {
      const data = await referenceService.getVehicles();
      const unidadOptions = referenceService.transformVehiclesForSelect(data);
      setUnidades(unidadOptions);
    } catch (error) {
      console.error("Error fetching unidades:", error);
    }
  }, []);

  // Edit mode handlers for each section
  const handleEditOrigen = () => {
    // Store current origin data
    const originData: Partial<TripFormData> = {
      origenNombreLugar: tripFormData.origenNombreLugar,
      origenCalle: tripFormData.origenCalle,
      origenNumero: tripFormData.origenNumero,
      origenColonia: tripFormData.origenColonia,
      origenCodigoPostal: tripFormData.origenCodigoPostal,
      origenCiudad: tripFormData.origenCiudad,
      origenEstado: tripFormData.origenEstado,
      origenEsVuelo: tripFormData.origenEsVuelo,
      origenNumeroVuelo: tripFormData.origenNumeroVuelo,
      origenAerolinea: tripFormData.origenAerolinea,
      origenLugarVuelo: tripFormData.origenLugarVuelo,
      origenNotas: tripFormData.origenNotas,
    };
    setOriginalOrigenData(originData);
    setIsEditingOrigen(true);
  };

  const handleSaveOrigen = async () => {
    try {
      // Validate all origin fields
      const originFields = [
        "origenNombreLugar",
        "origenCalle",
        "origenNumero",
        "origenColonia",
        "origenCodigoPostal",
        "origenCiudad",
        "origenEstado",
      ];

      const newErrors: { [key: string]: string } = {};

      originFields.forEach((field) => {
        const value = getFieldValue(field);
        if (!value) {
          newErrors[field] = "Este campo es obligatorio";
        }
      });

      // Validate postal code format if present
      if (
        tripFormData.origenCodigoPostal &&
        !/^\d{5}$/.test(tripFormData.origenCodigoPostal)
      ) {
        newErrors.origenCodigoPostal = "El código postal debe tener 5 dígitos";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...newErrors }));
        showErrorAlert(
          "Errores en origen",
          "Por favor corrija los errores antes de guardar.",
        );
        return;
      }

      setIsEditingOrigen(false);
      showSuccessAlert(
        "Cambios guardados",
        "Los cambios en el origen se han guardado localmente.",
      );
    } catch (error) {
      console.error("Error saving origin:", error);
      showErrorAlert(
        "Error",
        "No se pudieron guardar los cambios. Intente nuevamente.",
      );
    }
  };

  const handleCancelEditOrigen = () => {
    if (Object.keys(originalOrigenData).length > 0) {
      setTripFormData((prev) => ({
        ...prev,
        ...originalOrigenData,
      }));
    }
    setIsEditingOrigen(false);
  };

  const handleEditDestino = () => {
    // Store current destination data
    const destData: Partial<TripFormData> = {
      destinoNombreLugar: tripFormData.destinoNombreLugar,
      destinoCalle: tripFormData.destinoCalle,
      destinoNumero: tripFormData.destinoNumero,
      destinoColonia: tripFormData.destinoColonia,
      destinoCodigoPostal: tripFormData.destinoCodigoPostal,
      destinoCiudad: tripFormData.destinoCiudad,
      destinoEstado: tripFormData.destinoEstado,
      destinoEsVuelo: tripFormData.destinoEsVuelo,
      destinoNumeroVuelo: tripFormData.destinoNumeroVuelo,
      destinoAerolinea: tripFormData.destinoAerolinea,
      destinoLugarVuelo: tripFormData.destinoLugarVuelo,
      destinoNotas: tripFormData.destinoNotas,
    };
    setOriginalDestinoData(destData);
    setIsEditingDestino(true);
  };

  const handleSaveDestino = async () => {
    try {
      // Validate all destination fields
      const destFields = [
        "destinoNombreLugar",
        "destinoCalle",
        "destinoNumero",
        "destinoColonia",
        "destinoCodigoPostal",
        "destinoCiudad",
        "destinoEstado",
      ];

      const newErrors: { [key: string]: string } = {};

      destFields.forEach((field) => {
        const value = getFieldValue(field);
        if (!value) {
          newErrors[field] = "Este campo es obligatorio";
        }
      });

      // Validate postal code format if present
      if (
        tripFormData.destinoCodigoPostal &&
        !/^\d{5}$/.test(tripFormData.destinoCodigoPostal)
      ) {
        newErrors.destinoCodigoPostal = "El código postal debe tener 5 dígitos";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...newErrors }));
        showErrorAlert(
          "Errores en destino",
          "Por favor corrija los errores antes de guardar.",
        );
        return;
      }

      setIsEditingDestino(false);
      showSuccessAlert(
        "Cambios guardados",
        "Los cambios en el destino se han guardado localmente.",
      );
    } catch (error) {
      console.error("Error saving destination:", error);
      showErrorAlert(
        "Error",
        "No se pudieron guardar los cambios. Intente nuevamente.",
      );
    }
  };

  const handleCancelEditDestino = () => {
    if (Object.keys(originalDestinoData).length > 0) {
      setTripFormData((prev) => ({
        ...prev,
        ...originalDestinoData,
      }));
    }
    setIsEditingDestino(false);
  };

  const handleEditViaje = () => {
    // Store current trip data
    const viajeData: Partial<TripFormData> = {
      tipoViaje: tripFormData.tipoViaje,
      idaFecha: tripFormData.idaFecha,
      idaHora: tripFormData.idaHora,
      idaMinutos: tripFormData.idaMinutos,
      idaAmPm: tripFormData.idaAmPm,
      idaPasajeros: tripFormData.idaPasajeros,
      regresoFecha: tripFormData.regresoFecha,
      regresoHora: tripFormData.regresoHora,
      regresoMinutos: tripFormData.regresoMinutos,
      regresoAmPm: tripFormData.regresoAmPm,
      observacionesCliente: tripFormData.observacionesCliente,
    };
    setOriginalViajeData(viajeData);
    setIsEditingViaje(true);
  };

  const handleSaveViaje = async () => {
    try {
      // Validate required trip fields
      const newErrors: { [key: string]: string } = {};

      if (!tripFormData.idaFecha) {
        newErrors.idaFecha = "La fecha de ida es obligatoria";
      }
      if (!tripFormData.idaPasajeros) {
        newErrors.idaPasajeros = "El número de pasajeros es obligatorio";
      }

      if (tripFormData.tipoViaje === "redondo" && !tripFormData.regresoFecha) {
        newErrors.regresoFecha =
          "La fecha de regreso es obligatoria para viajes redondos";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...newErrors }));
        showErrorAlert(
          "Errores en datos del viaje",
          "Por favor corrija los errores antes de guardar.",
        );
        return;
      }

      setIsEditingViaje(false);
      showSuccessAlert(
        "Cambios guardados",
        "Los cambios en los datos del viaje se han guardado localmente.",
      );
    } catch (error) {
      console.error("Error saving trip data:", error);
      showErrorAlert(
        "Error",
        "No se pudieron guardar los cambios. Intente nuevamente.",
      );
    }
  };

  const handleCancelEditViaje = () => {
    if (Object.keys(originalViajeData).length > 0) {
      setTripFormData((prev) => ({
        ...prev,
        ...originalViajeData,
      }));
    }
    setIsEditingViaje(false);
  };

  const handleEditAsignacion = () => {
    // Store current assignment data
    const asignacionData: Partial<TripFormData> = {
      tipoUnidad: tripFormData.tipoUnidad,
      nombreChofer: tripFormData.nombreChofer,
      unidadAsignada1: tripFormData.unidadAsignada1,
      placa1: tripFormData.placa1,
      unidadAsignada2: tripFormData.unidadAsignada2,
      placa2: tripFormData.placa2,
      unidadAsignada3: tripFormData.unidadAsignada3,
      placa3: tripFormData.placa3,
      observacionesChofer: tripFormData.observacionesChofer,
    };
    setOriginalAsignacionData(asignacionData);
    setIsEditingAsignacion(true);
  };

  const handleSaveAsignacion = async () => {
    try {
      // Validate required assignment fields
      const newErrors: { [key: string]: string } = {};

      if (!tripFormData.tipoUnidad) {
        newErrors.tipoUnidad = "El tipo de unidad es obligatorio";
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...newErrors }));
        showErrorAlert(
          "Errores en asignación",
          "Por favor corrija los errores antes de guardar.",
        );
        return;
      }

      setIsEditingAsignacion(false);
      showSuccessAlert(
        "Cambios guardados",
        "Los cambios en la asignación se han guardado localmente.",
      );
    } catch (error) {
      console.error("Error saving assignment:", error);
      showErrorAlert(
        "Error",
        "No se pudieron guardar los cambios. Intente nuevamente.",
      );
    }
  };

  const handleCancelEditAsignacion = () => {
    if (Object.keys(originalAsignacionData).length > 0) {
      setTripFormData((prev) => ({
        ...prev,
        ...originalAsignacionData,
      }));
    }
    setIsEditingAsignacion(false);
  };

  // Load data and sync with context
  useEffect(() => {
    console.log("EditTripContent - OrderData:", orderData);
    console.log("EditTripContent - TripData:", tripData);

    const fetchTripData = async () => {
      try {
        setIsLoadingTrip(true);

        // Fetch contract details to get trips
        const contractData = await contractsService.getContractDetails(
          parseInt(contractId),
        );
        console.log("Contract data with trips:", contractData);

        // If there are trips, populate the form with the first trip's data
        if (contractData.trips && contractData.trips.length > 0) {
          const trip = contractData.trips[0];
          console.log("First trip data:", trip);

          // Parse the service date
          let idaFechaFormatted = "";
          if (trip.service_date) {
            const date = new Date(trip.service_date);
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            idaFechaFormatted = `${day}/${month}/${year}`;
          }

          // Parse origin time (HH:MM:SS format)
          let idaHora: string | undefined = undefined;
          let idaMinutos: string | undefined = undefined;
          let idaAmPm: "AM" | "PM" | undefined = "AM";
          if (trip.origin_time) {
            const timeParts = trip.origin_time.split(":");
            let hour = parseInt(timeParts[0] || "0");
            let minutes = parseInt(timeParts[1] || "0");
            if (hour >= 12) {
              idaAmPm = "PM";
              if (hour > 12) hour -= 12;
            } else if (hour === 0) {
              hour = 12;
            }
            idaHora = hour.toString();
            idaMinutos = minutes.toString();
          }

          // Fetch place details for origin and destination
          let origenData: any = {};
          let destinoData: any = {};

          if (trip.origin?.id) {
            try {
              const originPlace = await referenceService.getPlaceById(
                trip.origin.id,
              );
              origenData = {
                origenNombreLugar: trip.origin.id.toString(),
                origenCalle: originPlace.address || "",
                origenNumero: originPlace.number || "",
                origenColonia: originPlace.colonia || "",
                origenCodigoPostal: originPlace.zip_code || "",
                origenCiudad: originPlace.city || "",
                origenEstado: originPlace.state || "",
              };
            } catch (e) {
              console.error("Error fetching origin place:", e);
              origenData = { origenNombreLugar: trip.origin.id.toString() };
            }
          }

          if (trip.destination?.id) {
            try {
              const destPlace = await referenceService.getPlaceById(
                trip.destination.id,
              );
              destinoData = {
                destinoNombreLugar: trip.destination.id.toString(),
                destinoCalle: destPlace.address || "",
                destinoNumero: destPlace.number || "",
                destinoColonia: destPlace.colonia || "",
                destinoCodigoPostal: destPlace.zip_code || "",
                destinoCiudad: destPlace.city || "",
                destinoEstado: destPlace.state || "",
              };
            } catch (e) {
              console.error("Error fetching destination place:", e);
              destinoData = {
                destinoNombreLugar: trip.destination.id.toString(),
              };
            }
          }

          // Determine tipoViaje based on whether there's a return trip
          const tipoViajeValue: "sencillo" | "redondo" = trip.is_round_trip
            ? "redondo"
            : "sencillo";

          const tripUpdatedData: Partial<TripFormData> = {
            ...origenData,
            ...destinoData,
            idaFecha: idaFechaFormatted,
            idaHora,
            idaMinutos:
              idaMinutos !== undefined ? idaMinutos.toString() : undefined,
            idaAmPm,
            idaPasajeros: trip.passengers?.toString() || "",
            tipoUnidad: trip.unit_type || "",
            nombreChofer: trip.driver?.id?.toString() || "",
            unidadAsignada: trip.vehicle?.id?.toString() || "",
            placa: trip.vehicle?.license_plate || "",
            observacionesChofer: trip.internal_notes || "",
            observacionesCliente: trip.notes || "",
            tipoViaje: tipoViajeValue,
            // Flight information
            origenEsVuelo: !!trip.flight,
            origenNumeroVuelo: trip.flight?.flight_number || "",
            origenAerolinea: trip.flight?.airline || "",
            origenLugarVuelo: trip.flight?.flight_origin || "",
          };

          setTripFormData((prev) => ({
            ...prev,
            ...tripUpdatedData,
          }));

          setTripData({
            ...tripFormData,
            ...tripUpdatedData
          });

          // Store original data for each section
          setOriginalOrigenData(origenData);
          setOriginalDestinoData(destinoData);
          setOriginalViajeData({
            idaHora,
            idaMinutos,
          });
        }
      } catch (err) {
        console.error("Error fetching trip data:", err);
      } finally {
        setIsLoadingTrip(false);
      }
    };

    const checkOrderData = () => {
      const hasOrderData =
        orderData &&
        (orderData.empresa || orderData.nombreContacto || orderData.costoViaje);

      if (!hasOrderData) {
        console.log("No order data found, redirecting...");
        showErrorAlert(
          "Error",
          "No se encontraron datos del pedido. Redirigiendo...",
        );
        setTimeout(() => {
          router.push(`/dashboard/order/${contractId}`);
        }, 2000);
        return;
      }

      console.log("Order data validation passed, proceeding...");
    };

    const timeoutId = setTimeout(checkOrderData, 500);

    // Fetch trip data from contract
    fetchTripData();

    fetchLugares();
    fetchChoferes();
    fetchUnidades();

    return () => clearTimeout(timeoutId);
  }, [
    fetchLugares,
    fetchChoferes,
    fetchUnidades,
    orderData,
    router,
    contractId,
    setTripData,
  ]);

  const handleTripInputChange =
    (field: keyof TripFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      setTripFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleTripSelectChange =
    (field: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;

      // If selecting a vehicle, auto-fill the license plate for any unidad field
      if (field.startsWith("unidadAsignada") && value) {
        const selectedVehicle = unidades.find((u) => u.value === value);
        const unitNumber = field.replace("unidadAsignada", "") || "";
        const placaField = `placa${unitNumber}`;

        if (selectedVehicle?.licensePlate) {
          setTripFormData((prev) => ({
            ...prev,
            [field]: value,
            [placaField]: selectedVehicle.licensePlate || "",
          }));
          handleFieldTouch(field);
          handleFieldTouch(placaField);
          return;
        }
      }

      setTripFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      handleFieldTouch(field);
    };

  const handleRadioChange = (field: string, value: boolean) => {
    setTripFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    handleFieldTouch(field);
  };

  const handleCancel = () => {
    setTripData(tripFormData);
    router.push(`/dashboard/order/${contractId}`);
  };

  const handleSaveDraft = () => {
    setTripData(tripFormData);
    showSuccessAlert("Guardado", "Borrador guardado correctamente");
  };

  const handleUpdateTrip = () => {
    // Validate required fields before showing confirmation
    if (!orderData) {
      showErrorAlert("Error", "No se encontraron datos del pedido");
      return;
    }

    if (
      !tripFormData.idaFecha ||
      !tripFormData.origenNombreLugar ||
      !tripFormData.destinoNombreLugar
    ) {
      showErrorAlert("Error", "Complete todos los campos obligatorios");
      return;
    }

    // Show confirmation modal
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmUpdateTrip = async () => {
    try {
      // Close the confirmation modal
      setIsConfirmationModalOpen(false);

      // Update contract using the contracts service
      const updatePayload = {
        payment_type_id: orderData.tipoPago
          ? parseInt(orderData.tipoPago)
          : undefined,
        IVA: orderData.aplicaIva === "Si",
        amount: orderData.costoViaje
          ? parseFloat(orderData.costoViaje)
          : undefined,
        observations: orderData.comentarios || undefined,
        internal_observations: orderData.observacionesInternas || undefined,
        coordinator_id: orderData.coordinadorViaje
          ? parseInt(orderData.coordinadorViaje)
          : undefined,
      };

      console.log("Update payload:", updatePayload);

      await contractsService.update(parseInt(contractId), updatePayload);

      showSuccessAlert("Éxito", "Contrato actualizado correctamente");
      clearData();
      router.back();
    } catch (error) {
      console.error("Error updating contract:", error);

      if (error instanceof ApiError) {
        showErrorAlert("Error", error.message);
      } else {
        showErrorAlert(
          "Error",
          error instanceof Error
            ? error.message
            : "Error al actualizar el contrato",
        );
      }
    }
  };

  // Show loading state while fetching trip data
  if (isLoadingTrip) {
    return (
      <main className={styles.main}>
        <div className={styles.container}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "400px",
            }}
          >
            <p>Cargando información del viaje...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href={`/dashboard/order/${contractId}`} passHref>
            <button className={styles.backButton}>
              <ArrowHookUpLeftRegular color="black" />
            </button>
          </Link>
          <div>
            <h1 className={styles.title}>
              Editar viaje - Contrato #{contractId}
            </h1>
            <p className={styles.subtitle} style={{ color: "red" }}>
              Campos obligatorios <strong style={{ color: "red" }}>* </strong>
            </p>
          </div>
        </div>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          {/* Origen Section with Edit functionality */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Origen</h2>
            {!isEditingOrigen && (
              <button
                type="button"
                onClick={handleEditOrigen}
                className={styles.editButton}
                title="Editar origen"
              >
                <Edit24Regular />
              </button>
            )}
            {isEditingOrigen && (
              <div className={styles.sectionActions}>
                <button
                  type="button"
                  onClick={handleCancelEditOrigen}
                  className={styles.cancelEditButton}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveOrigen}
                  className={styles.saveButton}
                  title="Guardar cambios"
                >
                  <Save24Regular /> Guardar cambios
                </button>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <SearchableSelectComponent
              label="Nombre lugar"
              value={tripFormData.origenNombreLugar || ""}
              onChange={(value, option) =>
                handlePlaceSelect("origenNombreLugar", value, option)
              }
              onSearch={handlePlaceSearch}
              onCreate={() => handleCreatePlace("origen")}
              required
              placeholder="Buscar lugar de origen..."
              className={`${styles.input} ${
                touchedFields.has("origenNombreLugar") &&
                !tripFormData.origenNombreLugar
                  ? styles.fieldError
                  : ""
              }`}
              disabled={!isEditingOrigen}
            />
            {touchedFields.has("origenNombreLugar") &&
              !tripFormData.origenNombreLugar && (
                <p className={styles.requiredLabel}>
                  Este campo es obligatorio
                </p>
              )}
          </div>

          <div className={styles.section}>
            <InputComponent
              type="text"
              value={tripFormData.origenCalle || ""}
              onChange={handleTripInputChange("origenCalle")}
              label={
                <p>
                  Calle <strong style={{ color: "red" }}>*</strong>
                </p>
              }
              containerClassName={styles.streetInputContainer}
              disabled={!isEditingOrigen}
              className={`${touchedFields.has("origenCalle") && !tripFormData.origenCalle ? styles.fieldError : ""}`}
            />
            <InputComponent
              type="text"
              value={tripFormData.origenNumero || ""}
              onChange={handleTripInputChange("origenNumero")}
              label={
                <p>
                  Número <strong style={{ color: "red" }}>*</strong>
                </p>
              }
              containerClassName={styles.numberInputContainer}
              disabled={!isEditingOrigen}
              className={`${touchedFields.has("origenNumero") && !tripFormData.origenNumero ? styles.fieldError : ""}`}
            />
          </div>
          {touchedFields.has("origenCalle") && !tripFormData.origenCalle && (
            <p className={styles.requiredLabel}>La calle es obligatoria</p>
          )}
          {touchedFields.has("origenNumero") && !tripFormData.origenNumero && (
            <p className={styles.requiredLabel}>El número es obligatorio</p>
          )}

          <div className={styles.section}>
            <InputComponent
              type="text"
              value={tripFormData.origenColonia || ""}
              onChange={handleTripInputChange("origenColonia")}
              label={
                <p>
                  Colonia <strong style={{ color: "red" }}>*</strong>
                </p>
              }
              className={styles.input}
              containerClassName={styles.streetInputContainer}
              disabled={!isEditingOrigen}
            />
            <InputComponent
              type="text"
              value={tripFormData.origenCodigoPostal || ""}
              onChange={handleTripInputChange("origenCodigoPostal")}
              label={
                <p>
                  Código Postal <strong style={{ color: "red" }}>*</strong>
                </p>
              }
              className={styles.input}
              containerClassName={styles.numberInputContainer}
              disabled={!isEditingOrigen}
            />
          </div>
          {touchedFields.has("origenColonia") &&
            !tripFormData.origenColonia && (
              <p className={styles.requiredLabel}>La colonia es obligatoria</p>
            )}
          {touchedFields.has("origenCodigoPostal") &&
            !tripFormData.origenCodigoPostal && (
              <p className={styles.requiredLabel}>
                El código postal es obligatorio
              </p>
            )}

          <div className={styles.section}>
            <InputComponent
              type="text"
              value={tripFormData.origenCiudad || ""}
              onChange={handleTripInputChange("origenCiudad")}
              label={
                <p>
                  Ciudad <strong style={{ color: "red" }}>*</strong>
                </p>
              }
              className={styles.input}
              containerClassName={styles.streetInputContainer}
              disabled={!isEditingOrigen}
            />
            <InputComponent
              type="text"
              value={tripFormData.origenEstado || ""}
              onChange={handleTripInputChange("origenEstado")}
              label={
                <p>
                  Estado <strong style={{ color: "red" }}>*</strong>
                </p>
              }
              className={styles.input}
              containerClassName={styles.numberInputContainer}
              disabled={!isEditingOrigen}
            />
          </div>
          {touchedFields.has("origenCiudad") && !tripFormData.origenCiudad && (
            <p className={styles.requiredLabel}>La ciudad es obligatoria</p>
          )}
          {touchedFields.has("origenEstado") && !tripFormData.origenEstado && (
            <p className={styles.requiredLabel}>El estado es obligatorio</p>
          )}

          <div className={styles.section}>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>¿Es vuelo?</label>
              <div className={styles.radioOptions}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="origenEsVuelo"
                    value="true"
                    checked={tripFormData.origenEsVuelo === true}
                    onChange={() => handleRadioChange("origenEsVuelo", true)}
                    className={styles.radioInput}
                    disabled={!isEditingOrigen}
                  />
                  Sí
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="origenEsVuelo"
                    value="false"
                    checked={tripFormData.origenEsVuelo === false}
                    onChange={() => handleRadioChange("origenEsVuelo", false)}
                    className={styles.radioInput}
                    disabled={!isEditingOrigen}
                  />
                  No
                </label>
              </div>
            </div>
          </div>

          {tripFormData.origenEsVuelo && (
            <div className={styles.section}>
              <InputComponent
                type="text"
                value={tripFormData.origenNumeroVuelo || ""}
                onChange={handleTripInputChange("origenNumeroVuelo")}
                label="Número de vuelo"
                className={styles.input}
                disabled={!isEditingOrigen}
              />
              <InputComponent
                type="text"
                value={tripFormData.origenAerolinea || ""}
                onChange={handleTripInputChange("origenAerolinea")}
                label="Aerolínea"
                className={styles.input}
                disabled={!isEditingOrigen}
              />
              <InputComponent
                type="text"
                value={tripFormData.origenLugarVuelo || ""}
                onChange={handleTripInputChange("origenLugarVuelo")}
                label="Lugar del vuelo"
                className={styles.input}
                disabled={!isEditingOrigen}
              />
            </div>
          )}

          <div className={styles.section}>
            <InputComponent
              type="textarea"
              value={tripFormData.origenNotas || ""}
              onChange={handleTripInputChange("origenNotas")}
              label="Notas de origen"
              className={styles.textarea}
              disabled={!isEditingOrigen}
            />
          </div>

          {/* Destino Section with Edit functionality */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Destino</h2>
            {!isEditingDestino && (
              <button
                type="button"
                onClick={handleEditDestino}
                className={styles.editButton}
                title="Editar destino"
              >
                <Edit24Regular />
              </button>
            )}
            {isEditingDestino && (
              <div className={styles.sectionActions}>
                <button
                  type="button"
                  onClick={handleCancelEditDestino}
                  className={styles.cancelEditButton}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDestino}
                  className={styles.saveButton}
                  title="Guardar cambios"
                >
                  <Save24Regular /> Guardar cambios
                </button>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <SearchableSelectComponent
              label="Nombre lugar"
              value={tripFormData.destinoNombreLugar || ""}
              onChange={(value, option) =>
                handlePlaceSelect("destinoNombreLugar", value, option)
              }
              onSearch={handlePlaceSearch}
              onCreate={() => handleCreatePlace("destino")}
              required
              placeholder="Buscar lugar de destino..."
              className={`${styles.input} ${
                touchedFields.has("destinoNombreLugar") &&
                !tripFormData.destinoNombreLugar
                  ? styles.fieldError
                  : ""
              }`}
              disabled={!isEditingDestino}
            />
            {touchedFields.has("destinoNombreLugar") &&
              !tripFormData.destinoNombreLugar && (
                <p className={styles.requiredLabel}>
                  Este campo es obligatorio
                </p>
              )}
          </div>

          <div className={styles.section}>
            <InputComponent
              type="text"
              value={tripFormData.destinoCalle || ""}
              onChange={handleTripInputChange("destinoCalle")}
              label={
                <p>
                  Calle <strong style={{ color: "red" }}>*</strong>
                </p>
              }
              containerClassName={styles.streetInputContainer}
              disabled={!isEditingDestino}
              className={`${touchedFields.has("destinoCalle") && !tripFormData.destinoCalle ? styles.fieldError : ""}`}
            />
            <InputComponent
              type="text"
              value={tripFormData.destinoNumero || ""}
              onChange={handleTripInputChange("destinoNumero")}
              label={
                <p>
                  Número <strong style={{ color: "red" }}>*</strong>
                </p>
              }
              containerClassName={styles.numberInputContainer}
              disabled={!isEditingDestino}
              className={`${touchedFields.has("destinoNumero") && !tripFormData.destinoNumero ? styles.fieldError : ""}`}
            />
          </div>
          {touchedFields.has("destinoCalle") && !tripFormData.destinoCalle && (
            <p className={styles.requiredLabel}>La calle es obligatoria</p>
          )}
          {touchedFields.has("destinoNumero") &&
            !tripFormData.destinoNumero && (
              <p className={styles.requiredLabel}>El número es obligatorio</p>
            )}

          <div className={styles.section}>
            <InputComponent
              type="text"
              value={tripFormData.destinoColonia || ""}
              onChange={handleTripInputChange("destinoColonia")}
              label={
                <p>
                  Colonia <strong style={{ color: "red" }}>*</strong>
                </p>
              }
              className={styles.input}
              containerClassName={styles.streetInputContainer}
              disabled={!isEditingDestino}
            />
            <InputComponent
              type="text"
              value={tripFormData.destinoCodigoPostal || ""}
              onChange={handleTripInputChange("destinoCodigoPostal")}
              label={
                <p>
                  Código Postal <strong style={{ color: "red" }}>*</strong>
                </p>
              }
              className={styles.input}
              containerClassName={styles.numberInputContainer}
              disabled={!isEditingDestino}
            />
          </div>
          {touchedFields.has("destinoColonia") &&
            !tripFormData.destinoColonia && (
              <p className={styles.requiredLabel}>La colonia es obligatoria</p>
            )}
          {touchedFields.has("destinoCodigoPostal") &&
            !tripFormData.destinoCodigoPostal && (
              <p className={styles.requiredLabel}>
                El código postal es obligatorio
              </p>
            )}

          <div className={styles.section}>
            <InputComponent
              type="text"
              value={tripFormData.destinoCiudad || ""}
              onChange={handleTripInputChange("destinoCiudad")}
              label={
                <p>
                  Ciudad <strong style={{ color: "red" }}>*</strong>
                </p>
              }
              className={styles.input}
              containerClassName={styles.streetInputContainer}
              disabled={!isEditingDestino}
            />
            <InputComponent
              type="text"
              value={tripFormData.destinoEstado || ""}
              onChange={handleTripInputChange("destinoEstado")}
              label={
                <p>
                  Estado <strong style={{ color: "red" }}>*</strong>
                </p>
              }
              className={styles.input}
              containerClassName={styles.numberInputContainer}
              disabled={!isEditingDestino}
            />
          </div>
          {touchedFields.has("destinoCiudad") &&
            !tripFormData.destinoCiudad && (
              <p className={styles.requiredLabel}>La ciudad es obligatoria</p>
            )}
          {touchedFields.has("destinoEstado") &&
            !tripFormData.destinoEstado && (
              <p className={styles.requiredLabel}>El estado es obligatorio</p>
            )}

          <div className={styles.section}>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>¿Es vuelo?</label>
              <div className={styles.radioOptions}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="destinoEsVuelo"
                    value="true"
                    checked={tripFormData.destinoEsVuelo === true}
                    onChange={() => handleRadioChange("destinoEsVuelo", true)}
                    className={styles.radioInput}
                    disabled={!isEditingDestino}
                  />
                  Sí
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="destinoEsVuelo"
                    value="false"
                    checked={tripFormData.destinoEsVuelo === false}
                    onChange={() => handleRadioChange("destinoEsVuelo", false)}
                    className={styles.radioInput}
                    disabled={!isEditingDestino}
                  />
                  No
                </label>
              </div>
            </div>
          </div>

          {tripFormData.destinoEsVuelo && (
            <div className={styles.section}>
              <InputComponent
                type="text"
                value={tripFormData.destinoNumeroVuelo || ""}
                onChange={handleTripInputChange("destinoNumeroVuelo")}
                label="Número de vuelo"
                className={styles.input}
                disabled={!isEditingDestino}
              />
              <InputComponent
                type="text"
                value={tripFormData.destinoAerolinea || ""}
                onChange={handleTripInputChange("destinoAerolinea")}
                label="Aerolínea"
                className={styles.input}
                disabled={!isEditingDestino}
              />
              <InputComponent
                type="text"
                value={tripFormData.destinoLugarVuelo || ""}
                onChange={handleTripInputChange("destinoLugarVuelo")}
                label="Lugar del vuelo"
                className={styles.input}
                disabled={!isEditingDestino}
              />
            </div>
          )}

          <div className={styles.section}>
            <InputComponent
              type="textarea"
              value={tripFormData.destinoNotas || ""}
              onChange={handleTripInputChange("destinoNotas")}
              label="Notas de destino"
              className={styles.textarea}
              disabled={!isEditingDestino}
            />
          </div>

          {/* Tipo de viaje Section with Edit functionality */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Tipo de viaje</h2>
            {!isEditingViaje && (
              <button
                type="button"
                onClick={handleEditViaje}
                className={styles.editButton}
                title="Editar tipo de viaje"
              >
                <Edit24Regular />
              </button>
            )}
            {isEditingViaje && (
              <div className={styles.sectionActions}>
                <button
                  type="button"
                  onClick={handleCancelEditViaje}
                  className={styles.cancelEditButton}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveViaje}
                  className={styles.saveButton}
                  title="Guardar cambios"
                >
                  <Save24Regular /> Guardar cambios
                </button>
              </div>
            )}
          </div>

          <div className={styles.divider}>
            <div className={styles.section}>
              <div className={styles.radioGroup}>
                <div className={styles.radioOptions}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="tipoViaje"
                      value="sencillo"
                      checked={tripFormData.tipoViaje === "sencillo"}
                      onChange={() =>
                        setTripFormData((prev) => ({
                          ...prev,
                          tipoViaje: "sencillo" as const,
                        }))
                      }
                      className={styles.radioInput}
                      disabled={!isEditingViaje}
                    />
                    Sencillo
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="tipoViaje"
                      value="redondo"
                      checked={tripFormData.tipoViaje === "redondo"}
                      onChange={() =>
                        setTripFormData((prev) => ({
                          ...prev,
                          tipoViaje: "redondo" as const,
                        }))
                      }
                      className={styles.radioInput}
                      disabled={!isEditingViaje}
                    />
                    Redondo
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.divider}>
            <h2 className={styles.sectionTitle}>Ida</h2>
          </div>
          <div className={styles.section}>
            <DatePickerComponent
              id="idaFecha"
              label="Fecha de ida"
              value={tripFormData.idaFecha || ""}
              onChange={(value) => {
                console.log("Date changed:", value);
                setTripFormData((prev) => ({
                  ...prev,
                  idaFecha: value,
                }));
                handleFieldTouch("idaFecha");
              }}
              placeholder="dd/mm/yyyy"
              required
              disabled={!isEditingViaje}
              className={`${touchedFields.has("idaFecha") && !tripFormData.idaFecha ? styles.fieldError : ""}`}
            />
            {touchedFields.has("idaFecha") && !tripFormData.idaFecha && (
              <p className={styles.requiredLabel}>
                La fecha de ida es obligatoria
              </p>
            )}

            <InputComponent
              type="number"
              value={String(tripFormData.idaHora ?? "")}
              onChange={handleTripInputChange("idaHora")}
              label="Hora"
              className={styles.input}
              disabled={!isEditingViaje}
            />
            <InputComponent
              type="number"
              value={String(tripFormData.idaMinutos ?? "")}
              onChange={handleTripInputChange("idaMinutos")}
              label="Minutos"
              className={styles.input}
              disabled={!isEditingViaje}
            />
            <SelectComponent
              label="AM/PM"
              options={[
                { value: "AM", label: "AM" },
                { value: "PM", label: "PM" },
              ]}
              value={tripFormData.idaAmPm || "AM"}
              onChange={handleTripSelectChange("idaAmPm")}
              className={styles.input}
              disabled={!isEditingViaje}
            />
          </div>
          <div className={styles.section}>
            <InputComponent
              type="text"
              value={tripFormData.idaPasajeros || ""}
              onChange={handleTripInputChange("idaPasajeros")}
              label={
                <p>
                  Número de pasajeros{" "}
                  <strong style={{ color: "red" }}>*</strong>
                </p>
              }
              className={styles.input}
              disabled={!isEditingViaje}
            />
            {touchedFields.has("idaPasajeros") &&
              !tripFormData.idaPasajeros && (
                <p className={styles.requiredLabel}>
                  El número de pasajeros es obligatorio
                </p>
              )}
          </div>

          {tripFormData.tipoViaje === "redondo" && (
            <>
              <div className={styles.divider}>
                <h2 className={styles.sectionTitle}>Regreso</h2>
              </div>
              <div className={styles.section}>
                <DatePickerComponent
                  id="regresoFecha"
                  label="Fecha de regreso"
                  value={tripFormData.regresoFecha || ""}
                  onChange={(value) => {
                    console.log("Return date changed:", value);
                    setTripFormData((prev) => ({
                      ...prev,
                      regresoFecha: value,
                    }));
                    handleFieldTouch("regresoFecha");
                  }}
                  placeholder="dd/mm/yyyy"
                  required
                  disabled={!isEditingViaje}
                  className={`${touchedFields.has("regresoFecha") && !tripFormData.regresoFecha ? styles.fieldError : ""}`}
                />
                {touchedFields.has("regresoFecha") &&
                  !tripFormData.regresoFecha &&
                  tripFormData.tipoViaje === "redondo" && (
                    <p className={styles.requiredLabel}>
                      La fecha de regreso es obligatoria
                    </p>
                  )}

                <InputComponent
                  type="number"
                  value={String(tripFormData.regresoHora ?? "")}
                  onChange={handleTripInputChange("regresoHora")}
                  label="Hora"
                  className={styles.input}
                  disabled={!isEditingViaje}
                />
                <InputComponent
                  type="number"
                  value={String(tripFormData.regresoMinutos ?? "")}
                  onChange={handleTripInputChange("regresoMinutos")}
                  label="Minutos"
                  className={styles.input}
                  disabled={!isEditingViaje}
                />
                <SelectComponent
                  label="AM/PM"
                  options={[
                    { value: "AM", label: "AM" },
                    { value: "PM", label: "PM" },
                  ]}
                  value={tripFormData.regresoAmPm || "AM"}
                  onChange={handleTripSelectChange("regresoAmPm")}
                  className={styles.input}
                  disabled={!isEditingViaje}
                />
              </div>
            </>
          )}

          {canAssignResources && (
            <>
              {/* Asignación Section with Edit functionality */}
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Asignación</h2>
                {!isEditingAsignacion && (
                  <button
                    type="button"
                    onClick={handleEditAsignacion}
                    className={styles.editButton}
                    title="Editar asignación"
                  >
                    <Edit24Regular />
                  </button>
                )}
                {isEditingAsignacion && (
                  <div className={styles.sectionActions}>
                    <button
                      type="button"
                      onClick={handleCancelEditAsignacion}
                      className={styles.cancelEditButton}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAsignacion}
                      className={styles.saveButton}
                      title="Guardar cambios"
                    >
                      <Save24Regular /> Guardar cambios
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.divider}>
                <div className={styles.section}>
                  <InputComponent
                    type="text"
                    value={tripFormData.tipoUnidad || ""}
                    onChange={handleTripInputChange("tipoUnidad")}
                    label={
                      <p>
                        Tipo de unidad (Provisional){" "}
                        <strong style={{ color: "red" }}>*</strong>
                      </p>
                    }
                    className={styles.input}
                    disabled={!isEditingAsignacion}
                  />
                  {touchedFields.has("tipoUnidad") &&
                    !tripFormData.tipoUnidad && (
                      <p className={styles.requiredLabel}>
                        El tipo de unidad es obligatorio
                      </p>
                    )}
                </div>

                <div className={styles.section}>
                  <SelectComponent
                    label="Chofer"
                    options={choferes}
                    value={tripFormData.nombreChofer || ""}
                    onChange={handleTripSelectChange("nombreChofer")}
                    className={styles.input}
                    disabled={!isEditingAsignacion}
                  />
                </div>

                <h3 className={styles.subsectionTitle}>Unidades Asignadas</h3>

                <div className={styles.section}>
                  <SelectComponent
                    label="Unidad 1"
                    options={unidades}
                    value={tripFormData.unidadAsignada1 || ""}
                    onChange={handleTripSelectChange("unidadAsignada1")}
                    className={styles.input}
                    disabled={!isEditingAsignacion}
                  />
                  <InputComponent
                    type="text"
                    value={tripFormData.placa1 || ""}
                    onChange={handleTripInputChange("placa1")}
                    label="Placa 1"
                    className={styles.input}
                    disabled={!isEditingAsignacion}
                  />
                </div>

                <div className={styles.section}>
                  <SelectComponent
                    label="Unidad 2"
                    options={unidades}
                    value={tripFormData.unidadAsignada2 || ""}
                    onChange={handleTripSelectChange("unidadAsignada2")}
                    className={styles.input}
                    disabled={!isEditingAsignacion}
                  />
                  <InputComponent
                    type="text"
                    value={tripFormData.placa2 || ""}
                    onChange={handleTripInputChange("placa2")}
                    label="Placa 2"
                    className={styles.input}
                    disabled={!isEditingAsignacion}
                  />
                </div>

                <div className={styles.section}>
                  <SelectComponent
                    label="Unidad 3"
                    options={unidades}
                    value={tripFormData.unidadAsignada3 || ""}
                    onChange={handleTripSelectChange("unidadAsignada3")}
                    className={styles.input}
                    disabled={!isEditingAsignacion}
                  />
                  <InputComponent
                    type="text"
                    value={tripFormData.placa3 || ""}
                    onChange={handleTripInputChange("placa3")}
                    label="Placa 3"
                    className={styles.input}
                    disabled={!isEditingAsignacion}
                  />
                </div>

                <div className={styles.section}>
                  <InputComponent
                    type="textarea"
                    value={tripFormData.observacionesChofer || ""}
                    onChange={handleTripInputChange("observacionesChofer")}
                    label="Notas Adicionales"
                    className={styles.textarea}
                    disabled={!isEditingAsignacion}
                  />
                </div>
              </div>
            </>
          )}

          <div className={styles.section}>
            <InputComponent
              type="textarea"
              value={tripFormData.observacionesCliente || ""}
              onChange={handleTripInputChange("observacionesCliente")}
              label="Observaciones para el cliente"
              className={styles.textarea}
              disabled={!isEditingViaje}
            />
          </div>

          <div className={styles.sectionButtons}>
            <div className={styles.actionButtons}>
              <ButtonComponent
                type="button"
                onClick={handleCancel}
                text="Atrás"
                className={`${styles.button} ${styles.cancelButton}`}
              />
              <ButtonComponent
                type="button"
                onClick={handleUpdateTrip}
                text="Guardar cambios"
                className={`${styles.button} ${styles.createButton}`}
              />
            </div>
          </div>
        </form>
      </div>

      <CreatePlaceModal
        isOpen={isPlaceModalOpen}
        onClose={() => {
          setIsPlaceModalOpen(false);
          setPlaceModalContext(null);
        }}
        onPlaceCreated={handlePlaceCreated}
      />

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleConfirmUpdateTrip}
        orderData={orderData}
        tripFormData={tripFormData}
        paradas={[]}
        lugares={lugares}
      />
    </main>
  );
}
