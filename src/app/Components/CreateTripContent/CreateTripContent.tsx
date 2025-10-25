"use client";
import { useState, useCallback, useEffect } from "react";
import styles from "./CreateTripContent.module.css";
import InputComponent from "../InputComponent/InputComponent";
import SelectComponent from "../SelectComponent/SelectComponent";
import {
  ArrowHookUpLeftRegular,
  ChevronUpRegular,
  ChevronDownRegular,
  CalendarLtrRegular,
} from "@fluentui/react-icons";
import { Calendar } from "@fluentui/react-calendar-compat";
import Link from "next/link";
import { showErrorAlert, showSuccessAlert } from "@/app/Utils/AlertUtil";
import { getCookie } from "@/app/Utils/CookieUtil";

export default function CreateTripContent() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Order data from previous step
  const [orderData, setOrderData] = useState<any>(null);

  // Trip-specific form data
  const [tripFormData, setTripFormData] = useState({
    // Lugar de Origen
    origenNombreLugar: "",
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

    // Lugar de Destino
    destinoNombreLugar: "",
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

    // Viaje
    tipoViaje: "sencillo", // sencillo | redondo

    // Ida
    idaFecha: "",
    idaHora: 8,
    idaMinutos: 0,
    idaAmPm: "AM",
    idaPasajeros: "",

    // Regreso (solo si es redondo)
    regresoFecha: "",
    regresoHora: 8,
    regresoMinutos: 0,
    regresoAmPm: "AM",
    regresoPasajeros: "",

    // Chofer y unidad
    tipoUnidad: "",
    nombreChofer: "",
    unidadAsignada: "",
    placa: "",
    observacionesChofer: "",
    observacionesCliente: "",
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

  // Calendar visibility state
  const [showIdaCalendar, setShowIdaCalendar] = useState(false);
  const [showRegresoCalendar, setShowRegresoCalendar] = useState(false);

  // Fetch functions
  const fetchLugares = useCallback(async () => {
    try {
      // Get access token from cookies
      const accessToken = getCookie("accessToken");

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add authorization header if token exists
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_URL}/lugares`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const lugarOptions = data.data.map((lugar: any) => ({
            value: lugar.id.toString(),
            label: lugar.nombre,
          }));
          setLugares(lugarOptions);
        }
      }
    } catch (error) {
      console.error("Error fetching lugares:", error);
    }
  }, [API_URL]);

  const fetchChoferes = useCallback(async () => {
    try {
      // Get access token from cookies
      const accessToken = getCookie("accessToken");

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add authorization header if token exists
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_URL}/choferes`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const choferOptions = data.data.map((chofer: any) => ({
            value: chofer.id.toString(),
            label: chofer.nombre,
          }));
          setChoferes(choferOptions);
        }
      }
    } catch (error) {
      console.error("Error fetching choferes:", error);
    }
  }, [API_URL]);

  const fetchUnidades = useCallback(async () => {
    try {
      // Get access token from cookies
      const accessToken = getCookie("accessToken");

      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add authorization header if token exists
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_URL}/unidades`, {
        method: "GET",
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const unidadOptions = data.data.map((unidad: any) => ({
            value: unidad.id.toString(),
            label: `${unidad.tipo} - ${unidad.placa}`,
          }));
          setUnidades(unidadOptions);
        }
      }
    } catch (error) {
      console.error("Error fetching unidades:", error);
    }
  }, [API_URL]);

  // Load order data from localStorage when component mounts
  useEffect(() => {
    const storedOrderData = localStorage.getItem("orderFormData");
    if (storedOrderData) {
      try {
        const parsedData = JSON.parse(storedOrderData);
        setOrderData(parsedData);
      } catch (error) {
        console.error("Error parsing order data:", error);
        showErrorAlert("Error", "Error al cargar los datos del pedido");
      }
    } else {
      // Redirect back if no order data found
      showErrorAlert(
        "Error",
        "No se encontraron datos del pedido. Redirigiendo..."
      );
      setTimeout(() => {
        window.location.href = "/dashboard/createOrder";
      }, 2000);
    }

    // Fetch dropdown data
    fetchLugares();
    fetchChoferes();
    fetchUnidades();
  }, [fetchLugares, fetchChoferes, fetchUnidades]);

  // Close calendars when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.datePickerContainer}`)) {
        setShowIdaCalendar(false);
        setShowRegresoCalendar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleTripInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setTripFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleTripSelectChange =
    (field: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      setTripFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
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

  // Date utility functions
  const formatDateToDDMMYYYY = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const parseDDMMYYYYToDate = (dateString: string): Date | null => {
    const parts = dateString.split("/");
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    return new Date(year, month, day);
  };

  const handleDateChange =
    (field: "idaFecha" | "regresoFecha") => (date: Date | null | undefined) => {
      const dateValue = date ? formatDateToDDMMYYYY(date) : "";
      setTripFormData((prev) => ({
        ...prev,
        [field]: dateValue,
      }));
      // Close calendar after selection
      if (field === "idaFecha") setShowIdaCalendar(false);
      if (field === "regresoFecha") setShowRegresoCalendar(false);
    };

  const handleDateInputChange =
    (field: "idaFecha" | "regresoFecha") => (e: React.ChangeEvent<HTMLInputElement>) => {
      setTripFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleCancel = () => {
    // Clear stored data and go back
    localStorage.removeItem("orderFormData");
    window.location.href = "/dashboard/createOrder";
  };

  const handleSubmit = async () => {
    try {
      // Combine order data and trip data for the final POST request
      const completeData = {
        order: orderData,
        trip: tripFormData,
      };

      console.log("Complete form data:", completeData);

      // Here you would make the POST request to your API
      // const response = await fetch(`${API_URL}/api/create-order-trip`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(completeData),
      // });

      showSuccessAlert("Éxito", "Orden y viaje creados correctamente");
      localStorage.removeItem("orderFormData");
      // Redirect to dashboard or order list
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Error creating order and trip:", error);
      showErrorAlert("Error", "Error al crear la orden y el viaje");
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
        <form className={styles.form}>
          {/* Order Summary Section - Read Only */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Resumen del Pedido</h3>
            {orderData && (
              <div className={styles.orderSummary}>
                <p>
                  <strong>Empresa:</strong> {orderData.empresa}
                </p>
                <p>
                  <strong>Contacto:</strong> {orderData.nombreContacto}{" "}
                  {orderData.primerApellido} {orderData.segundoApellido}
                </p>
                <p>
                  <strong>Teléfono:</strong> {orderData.telefono}
                </p>
                <p>
                  <strong>Costo del viaje:</strong> ${orderData.costoViaje}
                </p>
              </div>
            )}
          </div>

          {/* Lugar de Origen Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Lugar de Origen</h3>

            <div className={styles.row}>
              <div className={styles.col}>
                <SelectComponent
                  value={tripFormData.origenNombreLugar}
                  onChange={handleTripSelectChange("origenNombreLugar")}
                  options={lugares}
                  label="Nombre Lugar *"
                  placeholder="Seleccione..."
                  required={true}
                  className={styles.select}
                />
              </div>
              <div className={styles.col}>
                <InputComponent
                  type="text"
                  value={tripFormData.origenCalle}
                  onChange={handleTripInputChange("origenCalle")}
                  label="Calle"
                  placeholder=""
                  className={styles.input}
                />
              </div>
              <div className={styles.col}>
                <InputComponent
                  type="text"
                  value={tripFormData.origenNumero}
                  onChange={handleTripInputChange("origenNumero")}
                  label="Número"
                  placeholder=""
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.col}>
                <InputComponent
                  type="text"
                  value={tripFormData.origenColonia}
                  onChange={handleTripInputChange("origenColonia")}
                  label="Colonia"
                  placeholder=""
                  className={styles.input}
                />
              </div>
              <div className={styles.col}>
                <InputComponent
                  type="text"
                  value={tripFormData.origenCodigoPostal}
                  onChange={handleTripInputChange("origenCodigoPostal")}
                  label="Código Postal"
                  placeholder=""
                  className={styles.input}
                />
              </div>
              <div className={styles.col}>
                <InputComponent
                  type="text"
                  value={tripFormData.origenCiudad}
                  onChange={handleTripInputChange("origenCiudad")}
                  label="Ciudad"
                  placeholder=""
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.col}>
                <InputComponent
                  type="text"
                  value={tripFormData.origenEstado}
                  onChange={handleTripInputChange("origenEstado")}
                  label="Estado"
                  placeholder=""
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.radioSection}>
              <label className={styles.radioLabel}>¿Es un vuelo?</label>
              <div className={styles.radioOptions}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="origenEsVuelo"
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
                    checked={tripFormData.origenEsVuelo === false}
                    onChange={() => handleRadioChange("origenEsVuelo", false)}
                    className={styles.radioInput}
                  />
                  No
                </label>
              </div>
            </div>

            {tripFormData.origenEsVuelo && (
              <div className={styles.flightSection}>
                <div className={styles.row}>
                  <div className={styles.col}>
                    <InputComponent
                      type="text"
                      value={tripFormData.origenNumeroVuelo}
                      onChange={handleTripInputChange("origenNumeroVuelo")}
                      label="No. de vuelo"
                      placeholder=""
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.col}>
                    <InputComponent
                      type="text"
                      value={tripFormData.origenAerolinea}
                      onChange={handleTripInputChange("origenAerolinea")}
                      label="Aerolínea"
                      placeholder=""
                      className={styles.input}
                    />
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.col}>
                    <InputComponent
                      type="text"
                      value={tripFormData.origenLugarVuelo}
                      onChange={handleTripInputChange("origenLugarVuelo")}
                      label="Lugar de origen del vuelo"
                      placeholder=""
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.col}>
                    <div className={styles.textareaContainer}>
                      <label className={styles.textareaLabel}>Notas</label>
                      <textarea
                        value={tripFormData.origenNotas}
                        onChange={(e) =>
                          setTripFormData((prev) => ({
                            ...prev,
                            origenNotas: e.target.value,
                          }))
                        }
                        className={styles.textarea}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Lugar de Destino Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Lugar de Destino</h3>

            <div className={styles.row}>
              <div className={styles.col}>
                <SelectComponent
                  value={tripFormData.destinoNombreLugar}
                  onChange={handleTripSelectChange("destinoNombreLugar")}
                  options={lugares}
                  label="Nombre Lugar *"
                  placeholder="Seleccione..."
                  required={true}
                  className={styles.select}
                />
              </div>
              <div className={styles.col}>
                <InputComponent
                  type="text"
                  value={tripFormData.destinoCalle}
                  onChange={handleTripInputChange("destinoCalle")}
                  label="Calle"
                  placeholder=""
                  className={styles.input}
                />
              </div>
              <div className={styles.col}>
                <InputComponent
                  type="text"
                  value={tripFormData.destinoNumero}
                  onChange={handleTripInputChange("destinoNumero")}
                  label="Número"
                  placeholder=""
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.col}>
                <InputComponent
                  type="text"
                  value={tripFormData.destinoColonia}
                  onChange={handleTripInputChange("destinoColonia")}
                  label="Colonia"
                  placeholder=""
                  className={styles.input}
                />
              </div>
              <div className={styles.col}>
                <InputComponent
                  type="text"
                  value={tripFormData.destinoCodigoPostal}
                  onChange={handleTripInputChange("destinoCodigoPostal")}
                  label="Código Postal"
                  placeholder=""
                  className={styles.input}
                />
              </div>
              <div className={styles.col}>
                <InputComponent
                  type="text"
                  value={tripFormData.destinoCiudad}
                  onChange={handleTripInputChange("destinoCiudad")}
                  label="Ciudad"
                  placeholder=""
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.col}>
                <InputComponent
                  type="text"
                  value={tripFormData.destinoEstado}
                  onChange={handleTripInputChange("destinoEstado")}
                  label="Estado"
                  placeholder=""
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.radioSection}>
              <label className={styles.radioLabel}>¿Es un vuelo?</label>
              <div className={styles.radioOptions}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="destinoEsVuelo"
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
                    checked={tripFormData.destinoEsVuelo === false}
                    onChange={() => handleRadioChange("destinoEsVuelo", false)}
                    className={styles.radioInput}
                  />
                  No
                </label>
              </div>
            </div>

            {tripFormData.destinoEsVuelo && (
              <div className={styles.flightSection}>
                <div className={styles.row}>
                  <div className={styles.col}>
                    <InputComponent
                      type="text"
                      value={tripFormData.destinoNumeroVuelo}
                      onChange={handleTripInputChange("destinoNumeroVuelo")}
                      label="No. de vuelo"
                      placeholder=""
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.col}>
                    <InputComponent
                      type="text"
                      value={tripFormData.destinoAerolinea}
                      onChange={handleTripInputChange("destinoAerolinea")}
                      label="Aerolínea"
                      placeholder=""
                      className={styles.input}
                    />
                  </div>
                </div>
                <div className={styles.row}>
                  <div className={styles.col}>
                    <InputComponent
                      type="text"
                      value={tripFormData.destinoLugarVuelo}
                      onChange={handleTripInputChange("destinoLugarVuelo")}
                      label="Lugar de origen del vuelo"
                      placeholder=""
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.col}>
                    <div className={styles.textareaContainer}>
                      <label className={styles.textareaLabel}>Notas</label>
                      <textarea
                        value={tripFormData.destinoNotas}
                        onChange={(e) =>
                          setTripFormData((prev) => ({
                            ...prev,
                            destinoNotas: e.target.value,
                          }))
                        }
                        className={styles.textarea}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Viaje Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Viaje</h3>

            <div className={styles.radioSection}>
              <label className={styles.radioLabel}>Tipo de viaje *</label>
              <div className={styles.radioOptions}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="tipoViaje"
                    value="sencillo"
                    checked={tripFormData.tipoViaje === "sencillo"}
                    onChange={handleTripInputChange("tipoViaje")}
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
                    onChange={handleTripInputChange("tipoViaje")}
                    className={styles.radioInput}
                  />
                  Redondo
                </label>
              </div>
            </div>

            {/* Ida */}
            <div className={styles.subSection}>
              <h4 className={styles.subSectionTitle}>Ida</h4>
              <div className={styles.row}>
                <div className={styles.col}>
                  <div className={styles.datePickerContainer}>
                    <label className={styles.datePickerLabel}>Fecha *</label>
                    <div className={styles.dateInputWrapper}>
                      <input
                        type="text"
                        value={tripFormData.idaFecha}
                        onChange={handleDateInputChange("idaFecha")}
                        placeholder="DD/MM/YYYY"
                        className={styles.dateInput}
                      />
                      <button
                        type="button"
                        onClick={() => setShowIdaCalendar(!showIdaCalendar)}
                        className={styles.calendarButton}
                      >
                        <CalendarLtrRegular />
                      </button>
                    </div>
                    {showIdaCalendar && (
                      <div className={styles.calendarDropdown}>
                        <Calendar
                          value={
                            tripFormData.idaFecha
                              ? parseDDMMYYYYToDate(tripFormData.idaFecha) || undefined
                              : undefined
                          }
                          onSelectDate={handleDateChange("idaFecha")}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.col}>
                  <div className={styles.timeContainer}>
                    <label className={styles.timeLabel}>Hora *</label>
                    <div className={styles.timeInputs}>
                      <div className={styles.timeInput}>
                        <input
                          type="number"
                          value={tripFormData.idaHora}
                          readOnly
                          className={styles.timeValue}
                        />
                        <div className={styles.timeButtons}>
                          <button
                            type="button"
                            onClick={() => handleTimeIncrement("idaHora")}
                            className={styles.timeButton}
                          >
                            <ChevronUpRegular />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTimeDecrement("idaHora")}
                            className={styles.timeButton}
                          >
                            <ChevronDownRegular />
                          </button>
                        </div>
                      </div>
                      <span className={styles.timeSeparator}>:</span>
                      <div className={styles.timeInput}>
                        <input
                          type="number"
                          value={tripFormData.idaMinutos
                            .toString()
                            .padStart(2, "0")}
                          readOnly
                          className={styles.timeValue}
                        />
                        <div className={styles.timeButtons}>
                          <button
                            type="button"
                            onClick={() => handleTimeIncrement("idaMinutos")}
                            className={styles.timeButton}
                          >
                            <ChevronUpRegular />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTimeDecrement("idaMinutos")}
                            className={styles.timeButton}
                          >
                            <ChevronDownRegular />
                          </button>
                        </div>
                      </div>
                      <SelectComponent
                        value={tripFormData.idaAmPm}
                        onChange={handleTripSelectChange("idaAmPm")}
                        options={[
                          { value: "AM", label: "AM" },
                          { value: "PM", label: "PM" },
                        ]}
                        label=""
                        placeholder=""
                        className={styles.amPmSelect}
                      />
                    </div>
                  </div>
                </div>
                <div className={styles.col}>
                  <InputComponent
                    type="number"
                    value={tripFormData.idaPasajeros}
                    onChange={handleTripInputChange("idaPasajeros")}
                    label="No. de pasajeros *"
                    className={styles.input}
                  />
                </div>
              </div>
            </div>

            {/* Regreso - Only if round trip */}
            {tripFormData.tipoViaje === "redondo" && (
              <div className={styles.subSection}>
                <h4 className={styles.subSectionTitle}>Regreso</h4>
                <div className={styles.row}>
                  <div className={styles.col}>
                    <div className={styles.datePickerContainer}>
                      <label className={styles.datePickerLabel}>Fecha *</label>
                      <div className={styles.dateInputWrapper}>
                        <input
                          type="text"
                          value={tripFormData.regresoFecha}
                          onChange={handleDateInputChange("regresoFecha")}
                          placeholder="DD/MM/YYYY"
                          className={styles.dateInput}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegresoCalendar(!showRegresoCalendar)}
                          className={styles.calendarButton}
                        >
                          <CalendarLtrRegular />
                        </button>
                      </div>
                      {showRegresoCalendar && (
                        <div className={styles.calendarDropdown}>
                          <Calendar
                            value={
                              tripFormData.regresoFecha
                                ? parseDDMMYYYYToDate(tripFormData.regresoFecha) || undefined
                                : undefined
                            }
                            onSelectDate={handleDateChange("regresoFecha")}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={styles.col}>
                    <div className={styles.timeContainer}>
                      <label className={styles.timeLabel}>Hora *</label>
                      <div className={styles.timeInputs}>
                        <div className={styles.timeInput}>
                          <input
                            type="number"
                            value={tripFormData.regresoHora}
                            readOnly
                            className={styles.timeValue}
                          />
                          <div className={styles.timeButtons}>
                            <button
                              type="button"
                              onClick={() => handleTimeIncrement("regresoHora")}
                              className={styles.timeButton}
                            >
                              <ChevronUpRegular />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTimeDecrement("regresoHora")}
                              className={styles.timeButton}
                            >
                              <ChevronDownRegular />
                            </button>
                          </div>
                        </div>
                        <span className={styles.timeSeparator}>:</span>
                        <div className={styles.timeInput}>
                          <input
                            type="number"
                            value={tripFormData.regresoMinutos
                              .toString()
                              .padStart(2, "0")}
                            readOnly
                            className={styles.timeValue}
                          />
                          <div className={styles.timeButtons}>
                            <button
                              type="button"
                              onClick={() =>
                                handleTimeIncrement("regresoMinutos")
                              }
                              className={styles.timeButton}
                            >
                              <ChevronUpRegular />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleTimeDecrement("regresoMinutos")
                              }
                              className={styles.timeButton}
                            >
                              <ChevronDownRegular />
                            </button>
                          </div>
                        </div>
                        <SelectComponent
                          value={tripFormData.regresoAmPm}
                          onChange={handleTripSelectChange("regresoAmPm")}
                          options={[
                            { value: "AM", label: "AM" },
                            { value: "PM", label: "PM" },
                          ]}
                          label=""
                          placeholder=""
                          className={styles.amPmSelect}
                        />
                      </div>
                    </div>
                  </div>
                  <div className={styles.col}>
                    <InputComponent
                      type="number"
                      value={tripFormData.regresoPasajeros}
                      onChange={handleTripInputChange("regresoPasajeros")}
                      label="No. de pasajeros *"
                      className={styles.input}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chofer y unidad Section */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Chofer y unidad</h3>

            <div className={styles.row}>
              <div className={styles.col}>
                <InputComponent
                  type="text"
                  value={tripFormData.tipoUnidad}
                  onChange={handleTripInputChange("tipoUnidad")}
                  label="Tipo de unidad"
                  placeholder=""
                  className={styles.input}
                />
              </div>
              <div className={styles.col}>
                <SelectComponent
                  value={tripFormData.nombreChofer}
                  onChange={handleTripSelectChange("nombreChofer")}
                  options={choferes}
                  label="Nombre del chofer"
                  placeholder="Seleccione..."
                  className={styles.select}
                />
              </div>
              <div className={styles.col}>
                <SelectComponent
                  value={tripFormData.unidadAsignada}
                  onChange={handleTripSelectChange("unidadAsignada")}
                  options={unidades}
                  label="Unidad asignada"
                  placeholder="Seleccione..."
                  className={styles.select}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.col}>
                <InputComponent
                  type="text"
                  value={tripFormData.placa}
                  onChange={handleTripInputChange("placa")}
                  label="Placa"
                  placeholder=""
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.col}>
                <div className={styles.textareaContainer}>
                  <label className={styles.textareaLabel}>
                    Observaciones para el chofer
                  </label>
                  <textarea
                    value={tripFormData.observacionesChofer}
                    onChange={(e) =>
                      setTripFormData((prev) => ({
                        ...prev,
                        observacionesChofer: e.target.value,
                      }))
                    }
                    className={styles.textarea}
                    rows={4}
                  />
                </div>
              </div>
              <div className={styles.col}>
                <div className={styles.textareaContainer}>
                  <label className={styles.textareaLabel}>
                    Observaciones para el cliente
                  </label>
                  <textarea
                    value={tripFormData.observacionesCliente}
                    onChange={(e) =>
                      setTripFormData((prev) => ({
                        ...prev,
                        observacionesCliente: e.target.value,
                      }))
                    }
                    className={styles.textarea}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.buttonContainer}>
            <button
              type="button"
              onClick={handleCancel}
              className={`${styles.button} ${styles.cancelButton}`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className={`${styles.button} ${styles.nextButton}`}
            >
              Crear Orden y Viaje
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
