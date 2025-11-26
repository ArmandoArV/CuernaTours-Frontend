"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import styles from "./CreateTripContent.module.css";
import InputComponent from "../InputComponent/InputComponent";
import SelectComponent from "../SelectComponent/SelectComponent";
import { AddFilled, DeleteRegular } from "@fluentui/react-icons";
import {
  ArrowHookUpLeftRegular,
  ChevronUpRegular,
  ChevronDownRegular,
} from "@fluentui/react-icons";
import DatePickerComponent from "../DatePickerComponent/DatePickerComponent";
import Link from "next/link";
import { showErrorAlert, showSuccessAlert } from "@/app/Utils/AlertUtil";
import {
  mapTripFormToPayload,
  mapOrderFormToPayload,
  OrderFormData,
  CreateOrderPayload,
} from "@/app/Types/OrderTripTypes";
import { useOrderContext } from "@/app/Contexts/OrderContext";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { useRouter } from "next/navigation";
import {
  referenceService,
  contractsService,
  tripsService,
  ApiError,
} from "@/services/api";
import { Button } from "@fluentui/react-components";
import ConfirmationModal from "../ConfirmationModal/ConfirmationModal";

export default function CreateTripContent() {
  const { orderData, tripData, setTripData, clearData } = useOrderContext();
  const router = useRouter();

  // Trip-specific form data
  const [tripFormData, setTripFormData] = useState({
    ...tripData,
    numeroPasajeros: tripData.regresoPasajeros || "",
    idaFecha: tripData.idaFecha || "",
    regresoFecha: tripData.regresoFecha || "",
  });

  // Paradas (stops) management
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

  const [paradas, setParadas] = useState<Parada[]>([]);
  const [showParadaForm, setShowParadaForm] = useState(false);
  const [newParada, setNewParada] = useState<Parada>({
    id: "",
    nombreLugar: "",
    calle: "",
    numero: "",
    colonia: "",
    codigoPostal: "",
    ciudad: "",
    estado: "",
  });

  // Dropdown data
  const [lugares, setLugares] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [choferes, setChoferes] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [unidades, setUnidades] = useState<
    Array<{ value: string; label: string }>
  >([]);

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

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
      console.log(`🔍 Select field ${field} changed to:`, e.target.value);
      setTripFormData((prev) => {
        const updated = {
          ...prev,
          [field]: e.target.value,
        };
        console.log(`✅ Updated tripFormData:`, updated);
        return updated;
      });
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

  // Parada handlers
  const handleAddParada = () => {
    setShowParadaForm(true);
    setNewParada({
      id: `parada-${Date.now()}`,
      nombreLugar: "",
      calle: "",
      numero: "",
      colonia: "",
      codigoPostal: "",
      ciudad: "",
      estado: "",
    });
  };

  const handleParadaInputChange =
    (field: keyof Parada) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setNewParada((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSaveParada = () => {
    if (!newParada.nombreLugar || !newParada.calle || !newParada.ciudad) {
      showErrorAlert(
        "Error",
        "Por favor complete los campos obligatorios de la parada"
      );
      return;
    }

    setParadas((prev) => [...prev, newParada]);
    setShowParadaForm(false);
    setNewParada({
      id: "",
      nombreLugar: "",
      calle: "",
      numero: "",
      colonia: "",
      codigoPostal: "",
      ciudad: "",
      estado: "",
    });
    showSuccessAlert("Éxito", "Parada agregada correctamente");
  };

  const handleCancelParada = () => {
    setShowParadaForm(false);
    setNewParada({
      id: "",
      nombreLugar: "",
      calle: "",
      numero: "",
      colonia: "",
      codigoPostal: "",
      ciudad: "",
      estado: "",
    });
  };

  const handleRemoveParada = (paradaId: string) => {
    setParadas((prev) => prev.filter((p) => p.id !== paradaId));
    showSuccessAlert("Éxito", "Parada eliminada correctamente");
  };

  const createTripForParada = async (
    parada: Parada,
    contractId: number,
    baseTrip: any
  ) => {
    const tripPayload = {
      ...baseTrip,
      // Map parada data to destination fields
      destinoNombreLugar: parada.nombreLugar,
      destinoCalle: parada.calle,
      destinoNumero: parada.numero,
      destinoColonia: parada.colonia,
      destinoCodigoPostal: parada.codigoPostal,
      destinoCiudad: parada.ciudad,
      destinoEstado: parada.estado,
    };

    // Create the mapped payload and ensure contract_id is included
    const mappedPayload = mapTripFormToPayload(tripPayload, contractId);
    
    console.log("🔍 DEBUG - Parada trip payload:", JSON.stringify(mappedPayload, null, 2));
    
    // Ensure contract_id is explicitly set
    if (!mappedPayload.contract_id) {
      mappedPayload.contract_id = contractId;
    }

    return await tripsService.create(mappedPayload);
  };

  // Helper functions for data conversion
  const convertDateFormat = (ddmmyyyy: string): string => {
    if (!ddmmyyyy) return "";
    const parts = ddmmyyyy.split("/");
    if (parts.length !== 3) return "";
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  };

  const convertTimeFormat = (hour: number, minutes: number, ampm: string): string => {
    let h = hour;
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
  };

  const handleFinalizarClick = () => {
    console.log("🔘 Finalizar button clicked - showing confirmation modal");
    setShowConfirmModal(true);
  };

  const handleConfirmCreateTrip = async () => {
    console.log("🚀 DEBUG - handleConfirmCreateTrip function called!");
    setShowConfirmModal(false);
    try {
      if (!orderData) {
        console.log("❌ No orderData found");
        showErrorAlert("Error", "No se encontraron datos del pedido");
        return;
      }

      console.log("🔍 Checking required trip fields:", {
        idaFecha: tripFormData.idaFecha,
        origenNombreLugar: tripFormData.origenNombreLugar,
        destinoNombreLugar: tripFormData.destinoNombreLugar
      });

      if (
        !tripFormData.idaFecha ||
        !tripFormData.origenNombreLugar ||
        !tripFormData.destinoNombreLugar
      ) {
        console.log("❌ Missing required trip fields");
        showErrorAlert(
          "Error",
          "Por favor complete todos los campos obligatorios"
        );
        return;
      }

      console.log("✅ All required trip fields present");

      // Debug: Log the original form data
      console.log("🔍 DEBUG - Original Order Data:", orderData);
      console.log("🔍 DEBUG - Original Trip Data:", tripFormData);

      // Step 1: Create contract with trip data included
      const orderPayload = mapOrderFormToPayload(orderData as OrderFormData);
      
      // Create trip details payload to include in contract creation
      const tripDetailsPayload: any = {
        service_date: convertDateFormat(tripFormData.idaFecha),
        origin_time: convertTimeFormat(
          tripFormData.idaHora || 8,
          tripFormData.idaMinutos || 0,
          tripFormData.idaAmPm || "AM"
        ),
        passengers: parseInt(tripFormData.numeroPasajeros) || 1,
        unit_type: tripFormData.tipoUnidad || undefined,
        driver_id: tripFormData.nombreChofer ? parseInt(tripFormData.nombreChofer) : undefined,
        vehicle_id: tripFormData.unidadAsignada ? parseInt(tripFormData.unidadAsignada) : undefined,
        observations: tripFormData.observacionesChofer || undefined,
        internal_observations: tripFormData.observacionesCliente || undefined,
        origin: {
          place_id: parseInt(tripFormData.origenNombreLugar),
          name: tripFormData.origenNombreLugar,
          address: `${tripFormData.origenCalle} ${tripFormData.origenNumero}`,
          city: tripFormData.origenCiudad,
          state: tripFormData.origenEstado,
          zip_code: tripFormData.origenCodigoPostal,
        },
        destination: {
          place_id: parseInt(tripFormData.destinoNombreLugar),
          name: tripFormData.destinoNombreLugar,
          address: `${tripFormData.destinoCalle} ${tripFormData.destinoNumero}`,
          city: tripFormData.destinoCiudad,
          state: tripFormData.destinoEstado,
          zip_code: tripFormData.destinoCodigoPostal,
        },
        is_round_trip: tripFormData.tipoViaje === "roundTrip",
        return_date: tripFormData.tipoViaje === "roundTrip" ? convertDateFormat(tripFormData.regresoFecha) : undefined,
        return_time: tripFormData.tipoViaje === "roundTrip" ? convertTimeFormat(
          tripFormData.regresoHora || 8,
          tripFormData.regresoMinutos || 0,
          tripFormData.regresoAmPm || "AM"
        ) : undefined,
      };

      // Add flight details if it's a flight
      if (tripFormData.origenEsVuelo) {
        tripDetailsPayload.flight = {
          flight_number: tripFormData.origenNumeroVuelo,
          airline: tripFormData.origenAerolinea,
          flight_origin: tripFormData.origenLugarVuelo,
          notes: tripFormData.origenNotas,
        };
      }

      // Include trip data in the contract creation payload
      orderPayload.trip = tripDetailsPayload;

      console.log(
        "📤 DEBUG - Complete payload (contract + trip):",
        JSON.stringify(orderPayload, null, 2)
      );

      // Check for missing required fields
      const fieldChecks = {
        client_id: orderPayload.client_id,
        payment_type_id: orderPayload.payment_type_id,
        IVA: orderPayload.IVA,
        amount: orderPayload.amount,
        trip: orderPayload.trip,
      };

      const missingFields = Object.entries(fieldChecks)
        .filter(([key, value]) => {
          if (key === "IVA") return value === undefined || value === null;
          return (
            value === undefined ||
            value === null ||
            value === 0 ||
            (typeof value === "string" && value === "")
          );
        })
        .map(([key]) => key);

      if (missingFields.length > 0) {
        console.error("❌ Missing required fields:", missingFields);
        console.error("📊 Field values:", fieldChecks);
        showErrorAlert(
          "Error de validación",
          `Faltan campos requeridos: ${missingFields.join(
            ", "
          )}. Revise los datos del formulario.`
        );
        return;
      }

      const orderResult = await contractsService.create(orderPayload);
      const contractId = orderResult.contract_id || orderResult.id;

      console.log("✅ Contract and main trip created successfully with ID:", contractId);

      // Step 2: Create additional trips for each parada if any
      if (paradas.length > 0) {
        console.log(`🔄 Creating ${paradas.length} additional parada trips...`);
        const baseTrip = { ...tripFormData };
        for (const parada of paradas) {
          await createTripForParada(parada, contractId, baseTrip);
        }
        showSuccessAlert(
          "Éxito",
          `Contrato, viaje principal y ${paradas.length} parada(s) creados correctamente`
        );
      } else {
        showSuccessAlert("Éxito", "Contrato y viaje creados correctamente");
      }

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
            <p className={styles.subtitle}>
              Los campos marcados con un asterisco rojo son obligatorios{" "}
              <strong style={{ color: "red" }}>* </strong>
            </p>
          </div>
        </div>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <h2 className={styles.sectionTitle}>Origen</h2>
          <div className={styles.section}>
            <SelectComponent
              label="Nombre lugar"
              options={lugares}
              value={tripFormData.origenNombreLugar || ""}
              onChange={handleTripSelectChange("origenNombreLugar")}
              required
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
                label="Lugar de vuelo"
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
            <h2 className={styles.sectionTitle}>Destino</h2>
          </div>

          <div className={styles.section}>
            <SelectComponent
              label="Nombre lugar"
              options={lugares}
              value={tripFormData.destinoNombreLugar || ""}
              onChange={handleTripSelectChange("destinoNombreLugar")}
              required
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
          <div className={styles.divider}>
            <h2 className={styles.subsectionTitle}>Paradas</h2>
          </div>

          {/* List of existing paradas */}
          {paradas.length > 0 && (
            <div className={`${styles.section} ${styles.paradasList}`}>
              <h3 className={styles.subsectionTitle}>
                Paradas agregadas ({paradas.length})
              </h3>
              {paradas.map((parada, index) => (
                <div key={parada.id} className={styles.paradaItem}>
                  <div className={styles.paradaInfo}>
                    <strong>Parada {index + 1}:</strong> {parada.nombreLugar}
                    <br />
                    <span className={styles.paradaAddress}>
                      {parada.calle} {parada.numero}, {parada.colonia},{" "}
                      {parada.ciudad}, {parada.estado}
                    </span>
                  </div>
                  <ButtonComponent
                    type="button"
                    onClick={() => handleRemoveParada(parada.id)}
                    icon={<DeleteRegular />}
                    text=""
                    className={`${styles.button} ${styles.cancelButton}`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className={styles.section}>
            <ButtonComponent
              type="button"
              onClick={handleAddParada}
              text=""
              icon={<AddFilled />}
              className={`${styles.button} ${styles.addButton}`}
            />
          </div>

          {/* Parada Form */}
          {showParadaForm && (
            <div className={styles.paradaForm}>
              <h3 className={styles.subsectionTitle}>Nueva Parada</h3>

              <div className={styles.section}>
                <SelectComponent
                  label="Nombre lugar"
                  options={lugares}
                  value={newParada.nombreLugar}
                  onChange={handleParadaInputChange("nombreLugar")}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.section}>
                <InputComponent
                  type="text"
                  value={newParada.calle}
                  onChange={handleParadaInputChange("calle")}
                  label={
                    <p>
                      Calle <strong style={{ color: "red" }}>*</strong>
                    </p>
                  }
                  containerClassName={styles.streetInputContainer}
                />
                <InputComponent
                  type="text"
                  value={newParada.numero}
                  onChange={handleParadaInputChange("numero")}
                  label="Número"
                  containerClassName={styles.numberInputContainer}
                />
              </div>

              <div className={styles.section}>
                <InputComponent
                  type="text"
                  value={newParada.colonia}
                  onChange={handleParadaInputChange("colonia")}
                  label="Colonia"
                  className={styles.input}
                  containerClassName={styles.streetInputContainer}
                />
                <InputComponent
                  type="text"
                  value={newParada.codigoPostal}
                  onChange={handleParadaInputChange("codigoPostal")}
                  label="Código Postal"
                  className={styles.input}
                  containerClassName={styles.numberInputContainer}
                />
              </div>

              <div className={styles.section}>
                <InputComponent
                  type="text"
                  value={newParada.ciudad}
                  onChange={handleParadaInputChange("ciudad")}
                  label={
                    <p>
                      Ciudad <strong style={{ color: "red" }}>*</strong>
                    </p>
                  }
                  className={styles.input}
                />
                <InputComponent
                  type="text"
                  value={newParada.estado}
                  onChange={handleParadaInputChange("estado")}
                  label="Estado"
                  className={styles.input}
                />
              </div>

              <div className={styles.sectionButtons}>
                <div className={styles.actionButtons}>
                  <ButtonComponent
                    type="button"
                    onClick={handleCancelParada}
                    icon={<DeleteRegular />}
                    text=""
                    className={`${styles.button} ${styles.cancelButton}`}
                  />
                  <ButtonComponent
                    type="button"
                    onClick={handleSaveParada}
                    text="Guardar parada"
                    className={`${styles.button} ${styles.createButton}`}
                  />
                </div>
              </div>
            </div>
          )}
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
              options={choferes}
              value={tripFormData.nombreChofer || ""}
              onChange={handleTripSelectChange("nombreChofer")}
              className={styles.input}
            />
            <SelectComponent
              label="Unidad"
              options={unidades}
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
                text="Atras"
                className={`${styles.button} ${styles.actionButton}`}
              />
              <ButtonComponent
                type="button"
                onClick={handleSaveDraft}
                text="Guardar y agregar otro viaje"
                className={`${styles.button} ${styles.actionButton}`}
              />
              <ButtonComponent
                type="button"
                onClick={handleFinalizarClick}
                text="Finalizar"
                className={`${styles.button} ${styles.createButton}`}
              />
            </div>
          </div>
        </form>

        <ConfirmationModal
          isOpen={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmCreateTrip}
          orderData={orderData}
          tripFormData={tripFormData}
          paradas={paradas}
          lugares={lugares}
        />
      </div>
    </main>
  );
}
