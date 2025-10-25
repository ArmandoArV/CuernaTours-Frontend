"use client";
import { useState, useCallback, useEffect } from "react";
import styles from "./CreateTripContent.module.css";
import InputComponent from "../InputComponent/InputComponent";
import SelectComponent from "../SelectComponent/SelectComponent";
import { ArrowHookUpLeftRegular } from "@fluentui/react-icons";
import Link from "next/link";
import { showErrorAlert, showSuccessAlert } from "@/app/Utils/AlertUtil";

export default function CreateTripContent() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Order data from previous step
  const [orderData, setOrderData] = useState<any>(null);

  // Trip-specific form data
  const [tripFormData, setTripFormData] = useState({
    fechaInicio: "",
    fechaFin: "",
    horaInicio: "",
    horaFin: "",
    lugarSalida: "",
    lugarDestino: "",
    numeroPersonas: "",
    tipoTransporte: "",
    descripcionViaje: "",
    requisitosPasajeros: "",
    incluye: "",
    noIncluye: "",
    observacionesViaje: "",
    conductor: "",
    vehiculo: "",
  });

  // Load order data from localStorage when component mounts
  useEffect(() => {
    const storedOrderData = localStorage.getItem('orderFormData');
    if (storedOrderData) {
      try {
        const parsedData = JSON.parse(storedOrderData);
        setOrderData(parsedData);
      } catch (error) {
        console.error('Error parsing order data:', error);
        showErrorAlert('Error', 'Error al cargar los datos del pedido');
      }
    } else {
      // Redirect back if no order data found
      showErrorAlert('Error', 'No se encontraron datos del pedido. Redirigiendo...');
      setTimeout(() => {
        window.location.href = '/dashboard/createOrder';
      }, 2000);
    }
  }, []);

  const handleTripInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setTripFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleTripSelectChange = (field: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTripFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleCancel = () => {
    // Clear stored data and go back
    localStorage.removeItem('orderFormData');
    window.location.href = '/dashboard/createOrder';
  };

  const handleSubmit = async () => {
    try {
      // Combine order data and trip data for the final POST request
      const completeData = {
        order: orderData,
        trip: tripFormData
      };

      console.log('Complete form data:', completeData);
      
      // Here you would make the POST request to your API
      // const response = await fetch(`${API_URL}/api/create-order-trip`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(completeData),
      // });

      showSuccessAlert('Éxito', 'Orden y viaje creados correctamente');
      localStorage.removeItem('orderFormData');
      // Redirect to dashboard or order list
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Error creating order and trip:', error);
      showErrorAlert('Error', 'Error al crear la orden y el viaje');
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
                <p><strong>Empresa:</strong> {orderData.empresa}</p>
                <p><strong>Contacto:</strong> {orderData.nombreContacto} {orderData.primerApellido} {orderData.segundoApellido}</p>
                <p><strong>Teléfono:</strong> {orderData.telefono}</p>
                <p><strong>Costo del viaje:</strong> ${orderData.costoViaje}</p>
              </div>
            )}
          </div>

          {/* Trip Details Section */}
          <h3 className={styles.sectionTitle}>Detalles del Viaje</h3>
          
          <div className={styles.row}>
            <div className={styles.col}>
              <InputComponent
                type="date"
                value={tripFormData.fechaInicio}
                onChange={handleTripInputChange("fechaInicio")}
                label={
                  <p>
                    Fecha de inicio <strong style={{ color: "red" }}>*</strong>
                  </p>
                }
                placeholder=""
                className={styles.input}
              />
            </div>
            <div className={styles.col}>
              <InputComponent
                type="date"
                value={tripFormData.fechaFin}
                onChange={handleTripInputChange("fechaFin")}
                label={
                  <p>
                    Fecha de fin <strong style={{ color: "red" }}>*</strong>
                  </p>
                }
                placeholder=""
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <InputComponent
                type="time"
                value={tripFormData.horaInicio}
                onChange={handleTripInputChange("horaInicio")}
                label="Hora de inicio"
                placeholder=""
                className={styles.input}
              />
            </div>
            <div className={styles.col}>
              <InputComponent
                type="time"
                value={tripFormData.horaFin}
                onChange={handleTripInputChange("horaFin")}
                label="Hora de fin"
                placeholder=""
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <InputComponent
                type="text"
                value={tripFormData.lugarSalida}
                onChange={handleTripInputChange("lugarSalida")}
                label={
                  <p>
                    Lugar de salida <strong style={{ color: "red" }}>*</strong>
                  </p>
                }
                placeholder=""
                className={styles.input}
              />
            </div>
            <div className={styles.col}>
              <InputComponent
                type="text"
                value={tripFormData.lugarDestino}
                onChange={handleTripInputChange("lugarDestino")}
                label={
                  <p>
                    Lugar de destino <strong style={{ color: "red" }}>*</strong>
                  </p>
                }
                placeholder=""
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <InputComponent
                type="number"
                value={tripFormData.numeroPersonas}
                onChange={handleTripInputChange("numeroPersonas")}
                label={
                  <p>
                    Número de personas <strong style={{ color: "red" }}>*</strong>
                  </p>
                }
                placeholder=""
                className={styles.input}
              />
            </div>
            <div className={styles.col}>
              <SelectComponent
                value={tripFormData.tipoTransporte}
                onChange={handleTripSelectChange("tipoTransporte")}
                options={[
                  { value: "autobus", label: "Autobús" },
                  { value: "van", label: "Van" },
                  { value: "automovil", label: "Automóvil" },
                  { value: "microbus", label: "Microbús" },
                ]}
                label="Tipo de transporte *"
                placeholder="Seleccione..."
                required={true}
                className={styles.select}
              />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.textareaContainer}>
              <label className={styles.textareaLabel}>
                Descripción del viaje <strong style={{ color: "red" }}>*</strong>
              </label>
              <textarea
                value={tripFormData.descripcionViaje}
                onChange={(e) =>
                  setTripFormData((prev) => ({
                    ...prev,
                    descripcionViaje: e.target.value,
                  }))
                }
                className={styles.textarea}
                rows={4}
                placeholder="Describe el itinerario del viaje..."
              />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.textareaContainer}>
              <label className={styles.textareaLabel}>
                Requisitos para pasajeros
              </label>
              <textarea
                value={tripFormData.requisitosPasajeros}
                onChange={(e) =>
                  setTripFormData((prev) => ({
                    ...prev,
                    requisitosPasajeros: e.target.value,
                  }))
                }
                className={styles.textarea}
                rows={3}
                placeholder="Ej: Documento de identidad, equipaje ligero..."
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <div className={styles.textareaContainer}>
                <label className={styles.textareaLabel}>
                  Incluye
                </label>
                <textarea
                  value={tripFormData.incluye}
                  onChange={(e) =>
                    setTripFormData((prev) => ({
                      ...prev,
                      incluye: e.target.value,
                    }))
                  }
                  className={styles.textarea}
                  rows={3}
                  placeholder="Ej: Transporte, seguro, refrigerios..."
                />
              </div>
            </div>
            <div className={styles.col}>
              <div className={styles.textareaContainer}>
                <label className={styles.textareaLabel}>
                  No incluye
                </label>
                <textarea
                  value={tripFormData.noIncluye}
                  onChange={(e) =>
                    setTripFormData((prev) => ({
                      ...prev,
                      noIncluye: e.target.value,
                    }))
                  }
                  className={styles.textarea}
                  rows={3}
                  placeholder="Ej: Comidas, hospedaje, actividades extras..."
                />
              </div>
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <SelectComponent
                value={tripFormData.conductor}
                onChange={handleTripSelectChange("conductor")}
                options={[
                  { value: "conductor1", label: "Juan Pérez" },
                  { value: "conductor2", label: "María García" },
                  { value: "conductor3", label: "Carlos López" },
                ]}
                label="Conductor asignado"
                placeholder="Seleccione..."
                className={styles.select}
              />
            </div>
            <div className={styles.col}>
              <SelectComponent
                value={tripFormData.vehiculo}
                onChange={handleTripSelectChange("vehiculo")}
                options={[
                  { value: "vehiculo1", label: "Autobús - ABC-123" },
                  { value: "vehiculo2", label: "Van - DEF-456" },
                  { value: "vehiculo3", label: "Microbús - GHI-789" },
                ]}
                label="Vehículo asignado"
                placeholder="Seleccione..."
                className={styles.select}
              />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.textareaContainer}>
              <label className={styles.textareaLabel}>
                Observaciones del viaje
              </label>
              <textarea
                value={tripFormData.observacionesViaje}
                onChange={(e) =>
                  setTripFormData((prev) => ({
                    ...prev,
                    observacionesViaje: e.target.value,
                  }))
                }
                className={styles.textarea}
                rows={4}
                placeholder="Observaciones adicionales sobre el viaje..."
              />
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
