"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import styles from "./CreateTripContent.module.css";
import InputComponent from "../InputComponent/InputComponent";
import SelectComponent from "../SelectComponent/SelectComponent";
import SearchableSelectComponent, {
  SearchableSelectOption,
} from "../SearchableSelectComponent/SearchableSelectComponent";
import CreatePlaceModal from "../CreatePlaceModal/CreatePlaceModal";
import ConfirmationModal from "../ConfirmationModal/ConfirmationModal";
import {
  ArrowHookUpLeftRegular,
  ChevronUpRegular,
  AddFilled,
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
import ParadaItem from "../ParadaItem/ParadaItem";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/app/hooks/useUserRole";
import {
  referenceService,
  contractsService,
  tripsService,
  ApiError,
} from "@/services/api";
import { useOrderForm } from "@/app/hooks/useOrderForm";
interface Parada {
  id: string;
  nombreLugar: string;
  calle: string;
  numero: string;
  colonia: string;
  codigoPostal: string;
  ciudad: string;
  estado: string;
}

export default function CreateTripContent() {
  const { orderData, tripData, setTripData, clearData } = useOrderContext();
  const router = useRouter();
  const { canAssignResources } = useUserRole();

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

  // Paradas state
  const [paradas, setParadas] = useState<Parada[]>([]);

  // Field validation errors state
  const tripForm = useOrderForm({
    ...tripData,
    numeroPasajeros: tripData.regresoPasajeros || "",
    idaFecha: tripData.idaFecha || "",
    regresoFecha: tripData.regresoFecha || "",
    unidadAsignada1: "",
    placa1: "",
    unidadAsignada2: "",
    placa2: "",
    unidadAsignada3: "",
    placa3: "",
  });

  const {
    formData: tripFormData,
    setFormData: setTripFormData,
    errors,
    setErrors,
    showErrors,
    setShowErrors,
    input,
    select,
    updateField,
  } = tripForm;

  /* =============================
   COMPATIBILITY (DO NOT REMOVE)
   Keeps existing JSX working
============================= */

  const fieldErrors: Record<string, boolean> = Object.keys(errors).reduce(
    (acc, key) => {
      acc[key] = true;
      return acc;
    },
    {} as Record<string, boolean>,
  );

  const setFieldErrors = (
    errs:
      | Record<string, boolean>
      | ((prev: Record<string, boolean>) => Record<string, boolean>),
  ) => {
    const current: Record<string, boolean> = Object.keys(errors).reduce(
      (acc, key) => {
        acc[key] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    );

    const resolved = typeof errs === "function" ? errs(current) : errs;

    const formatted: Record<string, string> = {};

    Object.entries(resolved).forEach(([key, value]) => {
      if (value) formatted[key] = "Este campo es obligatorio";
    });

    setErrors(formatted);
  };
  const handleTripInputChange =
    (field: keyof typeof tripFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      updateField(field, e.target.value);

  const handleTripSelectChange =
    (field: keyof typeof tripFormData) =>
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      updateField(field, e.target.value);

  const handleRadioChange = (field: keyof typeof tripFormData, value: any) => {
    updateField(field, value);
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

    // Clear error when field is filled
    if (placeId && fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: false }));
    }

    // Auto-fill address fields if available
    if (option?.data) {
      try {
        const placeDetails = await referenceService.getPlaceById(
          parseInt(placeId),
        );
        const prefix = field.replace("NombreLugar", "");

        // Clear errors for autofilled fields
        const updatedErrors = { ...fieldErrors };
        if (placeDetails.address) updatedErrors[`${prefix}Calle`] = false;
        if (placeDetails.number) updatedErrors[`${prefix}Numero`] = false;
        if (placeDetails.colonia) updatedErrors[`${prefix}Colonia`] = false;
        if (placeDetails.zip_code)
          updatedErrors[`${prefix}CodigoPostal`] = false;
        if (placeDetails.city) updatedErrors[`${prefix}Ciudad`] = false;
        if (placeDetails.state) updatedErrors[`${prefix}Estado`] = false;
        setFieldErrors(updatedErrors);

        setTripFormData((prev) => ({
          ...prev,
          [`${prefix}Calle`]: placeDetails.address || "",
          [`${prefix}Numero`]: placeDetails.number || "",
          [`${prefix}Colonia`]: placeDetails.colonia || "",
          [`${prefix}CodigoPostal`]: placeDetails.zip_code || "",
          [`${prefix}Ciudad`]: placeDetails.city || "",
          [`${prefix}Estado`]: placeDetails.state || "",
        }));
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
      // Clear errors for autofilled origen fields
      const updatedErrors = { ...fieldErrors };
      updatedErrors.origenNombreLugar = false;
      if (placeData?.address) updatedErrors.origenCalle = false;
      if (placeData?.number) updatedErrors.origenNumero = false;
      if (placeData?.colonia) updatedErrors.origenColonia = false;
      if (placeData?.zip_code) updatedErrors.origenCodigoPostal = false;
      if (placeData?.city) updatedErrors.origenCiudad = false;
      if (placeData?.state) updatedErrors.origenEstado = false;
      setFieldErrors(updatedErrors);

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
    } else if (placeModalContext === "destino") {
      // Clear errors for autofilled destino fields
      const updatedErrors = { ...fieldErrors };
      updatedErrors.destinoNombreLugar = false;
      if (placeData?.address) updatedErrors.destinoCalle = false;
      if (placeData?.number) updatedErrors.destinoNumero = false;
      if (placeData?.colonia) updatedErrors.destinoColonia = false;
      if (placeData?.zip_code) updatedErrors.destinoCodigoPostal = false;
      if (placeData?.city) updatedErrors.destinoCiudad = false;
      if (placeData?.state) updatedErrors.destinoEstado = false;
      setFieldErrors(updatedErrors);

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
    }

    setIsPlaceModalOpen(false);
    setPlaceModalContext(null);
  };

  // Parada handlers
  const handleAddParada = () => {
    const newParada: Parada = {
      id: Date.now().toString(),
      nombreLugar: "",
      calle: "",
      numero: "",
      colonia: "",
      codigoPostal: "",
      ciudad: "",
      estado: "",
    };
    setParadas([...paradas, newParada]);
  };

  const handleRemoveParada = (id: string) => {
    setParadas(paradas.filter((p) => p.id !== id));
  };

  const handleParadaChange = (
    id: string,
    field: keyof Parada,
    value: string,
  ) => {
    setParadas(
      paradas.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const handleParadaPlaceSelect = async (
    id: string,
    placeId: string,
    option?: SearchableSelectOption,
  ) => {
    handleParadaChange(id, "nombreLugar", placeId);

    // Auto-fill address fields if available
    if (option?.data) {
      try {
        const placeDetails = await referenceService.getPlaceById(
          parseInt(placeId),
        );
        setParadas(
          paradas.map((p) =>
            p.id === id
              ? {
                  ...p,
                  nombreLugar: placeId,
                  calle: placeDetails.address || "",
                  numero: placeDetails.number || "",
                  colonia: placeDetails.colonia || "",
                  codigoPostal: placeDetails.zip_code || "",
                  ciudad: placeDetails.city || "",
                  estado: placeDetails.state || "",
                }
              : p,
          ),
        );
      } catch (error) {
        console.error("Error fetching place details:", error);
      }
    }
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

  // Load data and sync with context
  useEffect(() => {
    console.log("CreateTripContent - OrderData:", orderData);
    console.log("CreateTripContent - TripData:", tripData);

    const checkOrderData = () => {
      const localStorageData =
        typeof window !== "undefined"
          ? localStorage.getItem("orderData")
          : null;

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
          router.push("/dashboard/createOrder");
        }, 2000);
        return;
      }

      console.log("Order data validation passed, proceeding...");
    };

    const timeoutId = setTimeout(checkOrderData, 500);

    // Sync form data with context data, ensuring proper defaults
    setTripFormData((prev) => ({
      ...prev,
      ...tripData,
      numeroPasajeros: tripData.regresoPasajeros || prev.numeroPasajeros || "",
      idaFecha: tripData.idaFecha || prev.idaFecha || "",
      regresoFecha: tripData.regresoFecha || prev.regresoFecha || "",
    }));

    fetchLugares();
    fetchChoferes();
    fetchUnidades();

    return () => clearTimeout(timeoutId);
  }, [fetchLugares, fetchChoferes, fetchUnidades, orderData, tripData, router]);

  // Debug effect to monitor form data changes
  useEffect(() => {
    console.log("Current tripFormData:", tripFormData);
  }, [tripFormData]);

  const handleCancel = () => {
    setTripData(tripFormData);
    router.push("/dashboard/createOrder");
  };

  const handleSaveDraft = () => {
    setTripData(tripFormData);
    showSuccessAlert("Guardado", "Borrador guardado correctamente");
  };

  const handleCreateTrip = () => {
    // Validate required fields before showing confirmation
    if (!orderData) {
      showErrorAlert("Error", "No se encontraron datos del pedido");
      return;
    }

    // Define required fields
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
      "numeroPasajeros",
    ];

    // Add conditional required fields
    if (canAssignResources) {
      requiredFields.push("tipoUnidad");
    }

    // Check for missing fields
    const errors: Record<string, boolean> = {};
    let hasErrors = false;

    requiredFields.forEach((field) => {
      if (!tripFormData[field as keyof typeof tripFormData]) {
        errors[field] = true;
        hasErrors = true;
      }
    });

    // Update error state
    setFieldErrors(errors);

    if (hasErrors) {
      showErrorAlert(
        "Error",
        "Complete todos los campos obligatorios marcados en rojo",
      );
      return;
    }

    // Show confirmation modal
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmCreateTrip = async (sendNotification: boolean) => {
    try {
      // Close the confirmation modal
      setIsConfirmationModalOpen(false);

      // Create contract with embedded trip using new comprehensive endpoint
      const contractPayload = {
        ...mapCompleteOrderToPayload(orderData as OrderFormData, tripFormData),
        send_notification: sendNotification,
      };
      console.log("Contract payload:", contractPayload);

      const result = await contractsService.create(contractPayload);
      console.log("Contract created:", result);

      showSuccessAlert("Éxito", "Contrato y viaje creados correctamente");

      // Clear all form data
      clearData();

      // Clear local trip form data
      setTripFormData({
        ...tripData,
        numeroPasajeros: "",
        idaFecha: "",
        regresoFecha: "",
        unidadAsignada1: "",
        placa1: "",
        unidadAsignada2: "",
        placa2: "",
        unidadAsignada3: "",
        placa3: "",
      });

      // Clear paradas
      setParadas([]);

      // Clear field errors
      setFieldErrors({});

      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating contract and trip:", error);

      if (error instanceof ApiError) {
        showErrorAlert("Error", error.message);
      } else {
        showErrorAlert(
          "Error",
          error instanceof Error
            ? error.message
            : "Error al crear el contrato y viaje",
        );
      }
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/dashboard/createOrder" passHref>
            <button className={styles.backButton}>
              <ArrowHookUpLeftRegular color="black" />
            </button>
          </Link>
          <div>
            <h1 className={styles.title}>Crear viaje</h1>
            <p className={styles.subtitle} style={{ color: "red" }}>
              Campos obligatorios <strong style={{ color: "red" }}>* </strong>
            </p>
          </div>
        </div>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.divider}>
            <h2 className={styles.subsectionTitle}>Ida</h2>
          </div>
          <div className={styles.section}>
            <DatePickerComponent
              id="idaFecha"
              label="Fecha"
              value={tripFormData.idaFecha || ""}
              onChange={(value) => {
                console.log("Date changed:", value);
                setTripFormData((prev) => ({
                  ...prev,
                  idaFecha: value,
                }));
              }}
              placeholder="dd/mm/yyyy"
              required
              hasError={fieldErrors.idaFecha}
              errorMessage={
                fieldErrors.idaFecha ? "Este campo es obligatorio" : ""
              }
            />
            <InputComponent
              type="number"
              value={String(tripFormData.idaHora ?? "")}
              onChange={handleTripInputChange("idaHora")}
              label="Hora"
              className={styles.input}
            />
            <InputComponent
              type="number"
              value={String(tripFormData.idaMinutos ?? "")}
              onChange={handleTripInputChange("idaMinutos")}
              label="Minutos"
              className={styles.input}
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
            />
            <InputComponent
              type="number"
              value={String(tripFormData.idaPasajeros ?? "")}
              onChange={handleTripInputChange("idaPasajeros")}
              label={
                <p>
                  Pasajeros <strong style={{ color: "red" }}>*</strong>
                </p>
              }
              className={styles.input}
              hasError={fieldErrors.idaPasajeros}
              errorMessage={
                fieldErrors.idaPasajeros ? "Este campo es obligatorio" : ""
              }
            />
          </div>

          <h2 className={styles.sectionTitle}>Dirección De Origen</h2>
          <div className={styles.section}>
            <SearchableSelectComponent
              label="Seleccionar Dirección"
              value={tripFormData.origenNombreLugar || ""}
              onChange={(value, option) =>
                handlePlaceSelect("origenNombreLugar", value, option)
              }
              onSearch={handlePlaceSearch}
              onCreate={() => handleCreatePlace("origen")}
              required
              placeholder="Buscar"
              className={styles.input}
              hasError={fieldErrors.origenNombreLugar}
              errorMessage={
                fieldErrors.origenNombreLugar ? "Este campo es obligatorio" : ""
              }
            />
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
              hasError={fieldErrors.origenCalle}
              errorMessage={
                fieldErrors.origenCalle ? "Este campo es obligatorio" : ""
              }
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
              hasError={fieldErrors.origenNumero}
              errorMessage={
                fieldErrors.origenNumero ? "Este campo es obligatorio" : ""
              }
            />
          </div>
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
              hasError={fieldErrors.origenColonia}
              errorMessage={
                fieldErrors.origenColonia ? "Este campo es obligatorio" : ""
              }
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
              hasError={fieldErrors.origenCodigoPostal}
              errorMessage={
                fieldErrors.origenCodigoPostal
                  ? "Este campo es obligatorio"
                  : ""
              }
            />
          </div>
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
              hasError={fieldErrors.origenCiudad}
              errorMessage={
                fieldErrors.origenCiudad ? "Este campo es obligatorio" : ""
              }
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
              hasError={fieldErrors.origenEstado}
              errorMessage={
                fieldErrors.origenEstado ? "Este campo es obligatorio" : ""
              }
            />
          </div>

          {/* Es un vuelo radio buttons */}
          <div className={styles.buttonGroup}>
            <label className={styles.radioLabel}>
              ¿Es un vuelo? <strong style={{ color: "red" }}>*</strong>
            </label>
            <div className={styles.radioOptions}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="origenEsVuelo"
                  value="yes"
                  checked={tripFormData.origenEsVuelo === true}
                  onChange={() => handleRadioChange("origenEsVuelo", true)}
                />
                Sí
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="origenEsVuelo"
                  value="no"
                  checked={tripFormData.origenEsVuelo === false}
                  onChange={() => handleRadioChange("origenEsVuelo", false)}
                />
                No
              </label>
            </div>
          </div>

          {tripFormData.origenEsVuelo && (
            <div className={styles.section}>
              <InputComponent
                type="text"
                value={tripFormData.origenNumeroVuelo || ""}
                onChange={handleTripInputChange("origenNumeroVuelo")}
                label={
                  <p>
                    Número de vuelo <strong style={{ color: "red" }}>*</strong>
                  </p>
                }
                className={styles.input}
              />
              <InputComponent
                type="text"
                value={tripFormData.origenAerolinea || ""}
                onChange={handleTripInputChange("origenAerolinea")}
                label="Aerolínea"
                className={styles.input}
              />
              <InputComponent
                type="text"
                value={tripFormData.origenLugarVuelo || ""}
                onChange={handleTripInputChange("origenLugarVuelo")}
                label="Origen de vuelo"
                className={styles.input}
              />
            </div>
          )}

          {tripFormData.origenEsVuelo && (
            <div className={styles.section}>
              <InputComponent
                type="textarea"
                value={tripFormData.origenNotas || ""}
                {...handleTripInputChange("origenNotas")}
                label="Notas adicionales"
                className={styles.textarea}
              />
            </div>
          )}

          <div className={styles.divider}>
            <h2 className={styles.sectionTitle}>Dirección De Destino</h2>
          </div>

          <div className={styles.section}>
            <SearchableSelectComponent
              label="Seleccionar Dirección"
              value={tripFormData.destinoNombreLugar || ""}
              onChange={(value, option) =>
                handlePlaceSelect("destinoNombreLugar", value, option)
              }
              onSearch={handlePlaceSearch}
              onCreate={() => handleCreatePlace("destino")}
              required
              placeholder="Buscar"
              className={styles.input}
              hasError={fieldErrors.destinoNombreLugar}
              errorMessage={
                fieldErrors.destinoNombreLugar
                  ? "Este campo es obligatorio"
                  : ""
              }
            />
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
              hasError={fieldErrors.destinoCalle}
              errorMessage={
                fieldErrors.destinoCalle ? "Este campo es obligatorio" : ""
              }
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
              hasError={fieldErrors.destinoNumero}
              errorMessage={
                fieldErrors.destinoNumero ? "Este campo es obligatorio" : ""
              }
            />
          </div>
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
              hasError={fieldErrors.destinoColonia}
              errorMessage={
                fieldErrors.destinoColonia ? "Este campo es obligatorio" : ""
              }
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
              hasError={fieldErrors.destinoCodigoPostal}
              errorMessage={
                fieldErrors.destinoCodigoPostal
                  ? "Este campo es obligatorio"
                  : ""
              }
            />
          </div>
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
              hasError={fieldErrors.destinoCiudad}
              errorMessage={
                fieldErrors.destinoCiudad ? "Este campo es obligatorio" : ""
              }
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
              hasError={fieldErrors.destinoEstado}
              errorMessage={
                fieldErrors.destinoEstado ? "Este campo es obligatorio" : ""
              }
            />
          </div>

          <div className={styles.divider}>
            <h2 className={styles.sectionTitle}>Viaje</h2>
          </div>

          <div className={styles.section}>
            <InputComponent
              type="number"
              value={tripFormData.numeroPasajeros || ""}
              onChange={handleTripInputChange("numeroPasajeros")}
              label="No. de pasajeros"
              className={styles.input}
              hasError={fieldErrors.numeroPasajeros}
              errorMessage={
                fieldErrors.numeroPasajeros ? "Este campo es obligatorio" : ""
              }
            />
          </div>

          <div className={styles.section}>
            <div className={styles.buttonGroup}>
              <div className={styles.radioOptions}>
                <label className={styles.radioLabel}>
                  Tipo de viaje<strong style={{ color: "red" }}>*</strong>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="tipoViaje"
                    value="sencillo"
                    checked={tripFormData.tipoViaje === "sencillo"}
                    onChange={() =>
                      setTripFormData((prev) => ({
                        ...prev,
                        tipoViaje: "sencillo",
                      }))
                    }
                  />
                  Sencillo
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="tipoViaje"
                    value="roundTrip"
                    checked={tripFormData.tipoViaje === "redondo"}
                    onChange={() =>
                      setTripFormData((prev) => ({
                        ...prev,
                        tipoViaje: "redondo",
                      }))
                    }
                  />
                  Redondo
                </label>
              </div>
            </div>
          </div>

          {tripFormData.tipoViaje === "redondo" && (
            <>
              <div className={styles.divider}>
                <h2 className={styles.subsectionTitle}>Regreso</h2>
              </div>
              <div className={styles.section}>
                <DatePickerComponent
                  id="regresoFecha"
                  label="Fecha de regreso *"
                  value={tripFormData.regresoFecha || ""}
                  onChange={(value) => {
                    console.log("Return date changed:", value);
                    setTripFormData((prev) => ({
                      ...prev,
                      regresoFecha: value,
                    }));
                  }}
                  placeholder="dd/mm/yyyy"
                  required
                />
                <InputComponent
                  type="number"
                  value={String(tripFormData.regresoHora ?? "")}
                  onChange={handleTripInputChange("regresoHora")}
                  label="Hora"
                  className={styles.input}
                />
                <InputComponent
                  type="number"
                  value={String(tripFormData.regresoMinutos ?? "")}
                  onChange={handleTripInputChange("regresoMinutos")}
                  label="Minutos"
                  className={styles.input}
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
                />
              </div>
            </>
          )}

          <div className={styles.divider}>
            <h2 className={styles.sectionTitle}>Paradas</h2>
          </div>

          <div className={styles.section}>
            <ButtonComponent
              type="button"
              onClick={handleAddParada}
              icon={<AddFilled />}
              className={`${styles.button} ${styles.addButton}`}
            />
          </div>

          {paradas.map((parada, index) => (
            <ParadaItem
              key={parada.id}
              parada={parada}
              index={index}
              onRemove={handleRemoveParada}
              onChange={handleParadaChange}
              onPlaceSelect={handleParadaPlaceSelect}
              onPlaceSearch={handlePlaceSearch}
              onCreatePlace={handleCreatePlace}
              onAdd={handleAddParada}
            />
          ))}

          {canAssignResources && (
            <>
              <div className={styles.divider}>
                <h2 className={styles.sectionTitle}>Asignación</h2>
              </div>

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
                  hasError={fieldErrors.tipoUnidad}
                  errorMessage={
                    fieldErrors.tipoUnidad ? "Este campo es obligatorio" : ""
                  }
                />
              </div>
              <div className={styles.section}>
                <SelectComponent
                  label="Chofer"
                  options={[
                    { value: "POR_ASIGNAR", label: "Por Asignar" },
                    ...choferes,
                  ]}
                  value={tripFormData.nombreChofer || ""}
                  onChange={handleTripSelectChange("nombreChofer")}
                  className={styles.input}
                />
              </div>

              <h3 className={styles.subsectionTitle}>Unidades Asignadas</h3>

              <div className={styles.section}>
                <SelectComponent
                  label="Unidad 1"
                  options={[
                    { value: "POR_ASIGNAR", label: "Por Asignar" },
                    ...unidades,
                  ]}
                  value={tripFormData.unidadAsignada1 || ""}
                  onChange={handleTripSelectChange("unidadAsignada1")}
                  className={styles.input}
                />
                <InputComponent
                  type="text"
                  value={tripFormData.placa1 || ""}
                  onChange={handleTripInputChange("placa1")}
                  label="Placa 1"
                  className={styles.input}
                />
              </div>

              <div className={styles.section}>
                <SelectComponent
                  label="Unidad 2"
                  options={[
                    { value: "POR_ASIGNAR", label: "Por Asignar" },
                    ...unidades,
                  ]}
                  value={tripFormData.unidadAsignada2 || ""}
                  onChange={handleTripSelectChange("unidadAsignada2")}
                  className={styles.input}
                />
                <InputComponent
                  type="text"
                  value={tripFormData.placa2 || ""}
                  onChange={handleTripInputChange("placa2")}
                  label="Placa 2"
                  className={styles.input}
                />
              </div>

              <div className={styles.section}>
                <SelectComponent
                  label="Unidad 3"
                  options={[
                    { value: "POR_ASIGNAR", label: "Por Asignar" },
                    ...unidades,
                  ]}
                  value={tripFormData.unidadAsignada3 || ""}
                  onChange={handleTripSelectChange("unidadAsignada3")}
                  className={styles.input}
                />
                <InputComponent
                  type="text"
                  value={tripFormData.placa3 || ""}
                  onChange={handleTripInputChange("placa3")}
                  label="Placa 3"
                  className={styles.input}
                />
              </div>
              <div className={styles.section}>
                <InputComponent
                  type="textarea"
                  value={tripFormData.observacionesChofer || ""}
                  onChange={handleTripInputChange("observacionesChofer")}
                  label="Notas Adicionales"
                  className={styles.textarea}
                />
              </div>
            </>
          )}
          <div className={styles.section}>
            <InputComponent
              type="textarea"
              value={tripFormData.observacionesCliente || ""}
              onChange={handleTripInputChange("observacionesCliente")}
              label="Observaciones Para El Cliente"
              className={styles.textarea}
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
                onClick={handleSaveDraft}
                text="Guardar y agregar otro viaje"
                className={`${styles.button} ${styles.cancelButton}`}
              />
              <ButtonComponent
                type="button"
                onClick={handleCreateTrip}
                text="Finalizar"
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
        onConfirm={handleConfirmCreateTrip}
        orderData={orderData}
        tripFormData={tripFormData}
        paradas={paradas}
        lugares={lugares}
      />
    </main>
  );
}
