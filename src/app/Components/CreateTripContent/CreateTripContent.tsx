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

  // Trip-specific form data
  const [tripFormData, setTripFormData] = useState({
    ...tripData,
    numeroPasajeros: tripData.regresoPasajeros || "",
    idaFecha: tripData.idaFecha || "",
    regresoFecha: tripData.regresoFecha || "",
  });

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

  // Place search and selection handlers
  const handlePlaceSearch = async (
    query: string
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
    option?: SearchableSelectOption
  ) => {
    setTripFormData((prev) => ({ ...prev, [field]: placeId }));

    // Auto-fill address fields if available
    if (option?.data) {
      try {
        const placeDetails = await referenceService.getPlaceById(
          parseInt(placeId)
        );
        const prefix = field.replace("NombreLugar", "");

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
    placeData?: any
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

  const handleParadaChange = (id: string, field: keyof Parada, value: string) => {
    setParadas(
      paradas.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleParadaPlaceSelect = async (
    id: string,
    placeId: string,
    option?: SearchableSelectOption
  ) => {
    handleParadaChange(id, "nombreLugar", placeId);

    // Auto-fill address fields if available
    if (option?.data) {
      try {
        const placeDetails = await referenceService.getPlaceById(
          parseInt(placeId)
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
              : p
          )
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
          "No se encontraron datos del pedido. Redirigiendo..."
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

  const handleTripInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      console.log(`Field ${field} changed to:`, value);
      setTripFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleTripSelectChange =
    (field: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;

      // If selecting a vehicle, auto-fill the license plate
      if (field === "unidadAsignada" && value) {
        const selectedVehicle = unidades.find((u) => u.value === value);
        if (selectedVehicle?.licensePlate) {
          setTripFormData((prev) => ({
            ...prev,
            [field]: value,
            placa: selectedVehicle.licensePlate || "",
          }));
          return;
        }
      }

      setTripFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleRadioChange = (field: string, value: boolean) => {
    setTripFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTimeIncrement = (
    field: "idaHora" | "idaMinutos" | "regresoHora" | "regresoMinutos"
  ) => {
    setTripFormData((prev) => {
      const current = prev[field] as number;
      if (field.includes("Hora")) {
        return { ...prev, [field]: current >= 12 ? 1 : current + 1 };
      } else {
        return { ...prev, [field]: current >= 59 ? 0 : current + 1 };
      }
    });
  };

  const handleTimeDecrement = (
    field: "idaHora" | "idaMinutos" | "regresoHora" | "regresoMinutos"
  ) => {
    setTripFormData((prev) => {
      const current = prev[field] as number;
      if (field.includes("Hora")) {
        return { ...prev, [field]: current <= 1 ? 12 : current - 1 };
      } else {
        return { ...prev, [field]: current <= 0 ? 59 : current - 1 };
      }
    });
  };

  const parseDDMMYYYYToDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    const parts = dateString.split("/");
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

    if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900)
      return null;

    const date = new Date(year, month, day);
    if (
      date.getDate() !== day ||
      date.getMonth() !== month ||
      date.getFullYear() !== year
    ) {
      return null;
    }

    return date;
  };

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

    if (
      !tripFormData.idaFecha ||
      !tripFormData.origenNombreLugar ||
      !tripFormData.destinoNombreLugar
    ) {
      showErrorAlert(
        "Error",
        "Complete todos los campos obligatorios"
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
        ...mapCompleteOrderToPayload(
          orderData as OrderFormData,
          tripFormData
        ),
        send_notification: sendNotification,
      };
      console.log("Contract payload:", contractPayload);

      const result = await contractsService.create(contractPayload);
      console.log("Contract created:", result);

      showSuccessAlert("Éxito", "Contrato y viaje creados correctamente");
      clearData();
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
            : "Error al crear el contrato y viaje"
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
              Campos obligatorios{" "}
              <strong style={{ color: "red" }}>* </strong>
            </p>
          </div>
        </div>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <h2 className={styles.sectionTitle}>Dirección de origen</h2>
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
                onChange={handleTripInputChange("origenNotasAdicionales")}
                label="Notas adicionales"
                className={styles.textarea}
              />
            </div>
          )}

          <div className={styles.divider}>
            <h2 className={styles.sectionTitle}>Dirección de destino</h2>
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
                    value="oneWay"
                    checked={tripFormData.tipoViaje === "oneWay"}
                    onChange={() =>
                      setTripFormData((prev) => ({
                        ...prev,
                        tipoViaje: "oneWay",
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
                    checked={tripFormData.tipoViaje === "roundTrip"}
                    onChange={() =>
                      setTripFormData((prev) => ({
                        ...prev,
                        tipoViaje: "roundTrip",
                      }))
                    }
                  />
                  Redondo
                </label>
              </div>
            </div>
          </div>

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
          </div>
          {tripFormData.tipoViaje === "roundTrip" && (
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
                />
              </div>
              <div className={styles.section}>
                <SelectComponent
                  label="Chofer"
                  options={[
                    { value: "POR_ASIGNAR", label: "POR ASIGNAR" },
                    ...choferes
                  ]}
                  value={tripFormData.nombreChofer || ""}
                  onChange={handleTripSelectChange("nombreChofer")}
                  className={styles.input}
                />
                <SelectComponent
                  label="Unidad"
                  options={[
                    { value: "POR_ASIGNAR", label: "POR ASIGNAR" },
                    ...unidades
                  ]}
                  value={tripFormData.unidadAsignada || ""}
                  onChange={handleTripSelectChange("unidadAsignada")}
                  className={styles.input}
                />
                <InputComponent
                  type="text"
                  value={tripFormData.placa || ""}
                  onChange={handleTripInputChange("placa")}
                  label="Placa"
                  className={styles.input}
                />
              </div>
              <div className={styles.section}>
                <InputComponent
                  type="textarea"
                  value={tripFormData.observacionesChofer || ""}
                  onChange={handleTripInputChange("observacionesChofer")}
                  label="Notas adicionales"
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
              label="Observaciones para el cliente"
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
