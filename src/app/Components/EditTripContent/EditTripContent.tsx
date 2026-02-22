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
import { ArrowHookUpLeftRegular } from "@fluentui/react-icons";
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

  // Trip-specific form data
  const [tripFormData, setTripFormData] = useState({
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
    console.log("EditTripContent - OrderData:", orderData);
    console.log("EditTripContent - TripData:", tripData);

    const fetchTripData = async () => {
      try {
        setIsLoadingTrip(true);

        // Fetch contract details to get trips
        const contractData = await contractsService.getContractDetails(
          parseInt(contractId)
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
          let idaHora = "";
          let idaMinutos = "";
          let idaAmPm = "AM";
          if (trip.origin_time) {
            const timeParts = trip.origin_time.split(":");
            let hour = parseInt(timeParts[0] || "0");
            idaMinutos = timeParts[1] || "00";
            if (hour >= 12) {
              idaAmPm = "PM";
              if (hour > 12) hour -= 12;
            } else if (hour === 0) {
              hour = 12;
            }
            idaHora = String(hour);
          }

          // Fetch place details for origin and destination
          let origenData: any = {};
          let destinoData: any = {};

          if (trip.origin?.id) {
            try {
              const originPlace = await referenceService.getPlaceById(
                trip.origin.id
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
                trip.destination.id
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

          const tripUpdatedData = {
            ...origenData,
            ...destinoData,
            idaFecha: idaFechaFormatted,
            idaHora,
            idaMinutos,
            idaAmPm,
            idaPasajeros: trip.passengers?.toString() || "",
            tipoUnidad: trip.unit_type || "",
            nombreChofer: trip.driver?.id?.toString() || "",
            unidadAsignada: trip.vehicle?.id?.toString() || "",
            placa: trip.vehicle?.license_plate || "",
            observacionesChofer: trip.internal_notes || "",
            observacionesCliente: trip.notes || "",
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
            ...tripData,
            ...tripUpdatedData,
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
          "No se encontraron datos del pedido. Redirigiendo..."
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
      showErrorAlert(
        "Error",
        "Complete todos los campos obligatorios"
      );
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
            : "Error al actualizar el contrato"
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
              Campos obligatorios{" "}
              <strong style={{ color: "red" }}>* </strong>
            </p>
            <p className={styles.subtitle} style={{ color: "#0078D4", marginTop: "8px" }}>
              Nota: Solo se pueden editar los datos del contrato (coordinador, costo, observaciones). 
              Los datos del viaje son solo de referencia.
            </p>
          </div>
        </div>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <h2 className={styles.sectionTitle}>Origen</h2>
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
              containerClassName={styles.streetInputContainer}
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
            />
          </div>

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
                label="Lugar del vuelo"
                className={styles.input}
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
            />
          </div>

          <h2 className={styles.sectionTitle}>Destino</h2>
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
              containerClassName={styles.streetInputContainer}
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
            />
          </div>

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
              />
              <InputComponent
                type="text"
                value={tripFormData.destinoAerolinea || ""}
                onChange={handleTripInputChange("destinoAerolinea")}
                label="Aerolínea"
                className={styles.input}
              />
              <InputComponent
                type="text"
                value={tripFormData.destinoLugarVuelo || ""}
                onChange={handleTripInputChange("destinoLugarVuelo")}
                label="Lugar del vuelo"
                className={styles.input}
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
            />
          </div>

          <div className={styles.divider}>
            <h2 className={styles.sectionTitle}>Tipo de viaje</h2>
          </div>
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
                        tipoViaje: "sencillo",
                      }))
                    }
                    className={styles.radioInput}
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
                        tipoViaje: "redondo",
                      }))
                    }
                    className={styles.radioInput}
                  />
                  Redondo
                </label>
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
            />
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
                  options={choferes}
                  value={tripFormData.nombreChofer || ""}
                  onChange={handleTripSelectChange("nombreChofer")}
                  className={styles.input}
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
                  options={unidades}
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
                  options={unidades}
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
