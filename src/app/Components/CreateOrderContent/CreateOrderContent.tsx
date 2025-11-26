"use client";
import { useState, useCallback, useEffect } from "react";
import styles from "./CreateOrderContent.module.css";
import InputComponent from "../InputComponent/InputComponent";
import SelectComponent from "../SelectComponent/SelectComponent";
import { ArrowHookUpLeftRegular } from "@fluentui/react-icons";
import Link from "next/link";
import { showErrorAlert, showSuccessAlert } from "../../Utils/AlertUtil";
import { OrderFormData, mapOrderFormToPayload } from "@/app/Types/OrderTripTypes";
import { useOrderContext } from "@/app/Contexts/OrderContext";
import { useRouter } from "next/navigation";
import { referenceService, ApiError } from "@/services/api";
export default function CreateOrderContent() {
  const { orderData, setOrderData } = useOrderContext();
  const router = useRouter();

  // Use context data as form data
  const [formData, setFormData] = useState(orderData);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showErrors, setShowErrors] = useState(false);
  const [clients, setClients] = useState<
    Array<{ value: string; label: string }>
  >([]);

  const validateForm = () => {
    const missingFields: string[] = [];
    const newErrors: { [key: string]: string } = {};

    // Required fields validation
    if (!formData.empresa.trim()) {
      missingFields.push("Empresa o cliente");
      newErrors.empresa = "La empresa o cliente es obligatorio";
    }
    if (!formData.nombreContacto.trim()) {
      missingFields.push("Nombre del contacto");
      newErrors.nombreContacto = "El nombre del contacto es obligatorio";
    }
    if (!formData.primerApellido.trim()) {
      missingFields.push("Primer apellido");
      newErrors.primerApellido = "El primer apellido es obligatorio";
    }
    if (!formData.telefono.trim()) {
      missingFields.push("Teléfono");
      newErrors.telefono = "El teléfono es obligatorio";
    } else if (!isValidPhone(formData.telefono)) {
      newErrors.telefono = "El teléfono solo debe contener números";
    }

    if (!formData.costoViaje.trim()) {
      missingFields.push("Costo del viaje");
      newErrors.costoViaje = "El costo del viaje es obligatorio";
    } else if (!isValidNumber(formData.costoViaje)) {
      newErrors.costoViaje = "El costo del viaje debe ser un número válido";
    }

    // Conditional validations when llevaComision is "Si"
    if (formData.llevaComision === "Si") {
      if (!formData.nombreRecibeComision.trim()) {
        missingFields.push("Nombre de quien recibe la comisión");
        newErrors.nombreRecibeComision =
          "El nombre de quien recibe la comisión es obligatorio";
      }

      // Validate percentage if tipo comision is percentage
      if (
        formData.tipoComision === "Porcentaje" &&
        formData.porcentaje.trim() &&
        !isValidNumber(formData.porcentaje)
      ) {
        newErrors.porcentaje = "El porcentaje debe ser un número válido";
      }

      // Validate amount if provided
      if (
        formData.montoArreglado.trim() &&
        !isValidNumber(formData.montoArreglado)
      ) {
        newErrors.montoArreglado = "El monto debe ser un número válido";
      }
    }

    // Email validation (if provided)
    if (
      formData.correoElectronico.trim() &&
      !isValidEmail(formData.correoElectronico)
    ) {
      newErrors.correoElectronico = "El correo electrónico no es válido";
      showErrorAlert(
        "Email inválido",
        "Por favor, ingrese un correo electrónico válido."
      );
      setErrors(newErrors);
      setShowErrors(true);
      return false;
    }

    // Set errors for inline display
    setErrors(newErrors);
    setShowErrors(true);

    // Check for format errors first
    const formatErrors = Object.keys(newErrors).filter(
      (key) =>
        newErrors[key].includes("número válido") ||
        newErrors[key].includes("solo debe contener números")
    );

    if (formatErrors.length > 0) {
      showErrorAlert(
        "Formato incorrecto",
        "Por favor, corrija los campos que contienen formato incorrecto."
      );
      return false;
    }

    // Show missing fields alert if any
    if (missingFields.length > 0) {
      const fieldsList = missingFields.join(", ");
      showErrorAlert(
        "Campos obligatorios faltantes",
        `Por favor, complete los siguientes campos obligatorios: ${fieldsList}`
      );
      return false;
    }

    return true;
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidNumber = (value: string) => {
    const numberRegex = /^\d*\.?\d*$/;
    return numberRegex.test(value);
  };

  const isValidPhone = (phone: string) => {
    const phoneRegex = /^\d*$/;
    return phoneRegex.test(phone);
  };

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      // Apply numeric validation for specific fields
      if (field === "telefono" && !isValidPhone(value)) {
        return; // Don't update if not valid phone number
      }

      if (
        (field === "costoViaje" ||
          field === "porcentaje" ||
          field === "montoArreglado") &&
        !isValidNumber(value)
      ) {
        return; // Don't update if not valid number
      }

      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };

  const handleSelectChange =
    (field: string) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Clear error for this field when user makes a selection
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    };

  const handleRadioChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user makes a selection
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNext = () => {
    if (validateForm()) {
      console.log("Saving form data to context:", formData);
      // Update context with current form data
      setOrderData(formData);
      
      // Give a small delay to ensure context is updated
      setTimeout(() => {
        // Proceed to next step
        router.push("/dashboard/createOrder/createTrip");
      }, 100);
    }
  };

  const handleCancel = () => {
    // Handle cancel logic
    console.log("Cancel clicked");
  };

  const fetchClients = useCallback(async () => {
    try {
      const data = await referenceService.getClients();
      const clientOptions = referenceService.transformClientsForSelect(data);
      setClients(clientOptions);
    } catch (error) {
      console.error("Error fetching clients:", error);
      if (error instanceof ApiError) {
        showErrorAlert("Error", `No se pudieron cargar los clientes: ${error.message}`);
      }
      setClients([]);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    
    // Sync form data with context data
    console.log("CreateOrderContent - OrderData from context:", orderData);
    setFormData(orderData);
  }, [fetchClients, orderData]);

  // Also sync when formData changes
  useEffect(() => {
    console.log("CreateOrderContent - FormData changed:", formData);
  }, [formData]);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/dashboard" passHref>
            <button className={styles.backButton}>
              <ArrowHookUpLeftRegular color="black" />
            </button>
          </Link>
          <div>
            <h1 className={styles.title}>Crear contrato de orden</h1>
            <p className={styles.subtitle}>
              Los campos marcados con un asterisco rojo son obligatorios{" "}
              <strong style={{ color: "red" }}>* </strong>
            </p>
          </div>
        </div>
        <form className={styles.form}>
          <div className={styles.placeSection}>
            <SelectComponent
              value={formData.empresa}
              onChange={handleSelectChange("empresa")}
              options={clients}
              label="Empresa o cliente"
              placeholder="Seleccione..."
              required={true}
              className={`${styles.select} ${
                showErrors && errors.empresa ? styles.selectError : ""
              }`}
            />
            {showErrors && errors.empresa && (
              <p className={styles.errorMessage}>{errors.empresa}</p>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <InputComponent
                type="text"
                value={formData.nombreContacto}
                onChange={handleInputChange("nombreContacto")}
                label={
                  <p>
                    Nombre del contacto{" "}
                    <strong style={{ color: "red" }}>*</strong>
                  </p>
                }
                placeholder=""
                className={`${styles.input} ${
                  showErrors && errors.nombreContacto ? styles.inputError : ""
                }`}
              />
              {showErrors && errors.nombreContacto && (
                <p className={styles.errorMessage}>{errors.nombreContacto}</p>
              )}
            </div>
            <div className={styles.col}>
              <InputComponent
                type="text"
                value={formData.primerApellido}
                onChange={handleInputChange("primerApellido")}
                label={
                  <p>
                    Primer apellido <strong style={{ color: "red" }}>*</strong>
                  </p>
                }
                placeholder=""
                className={`${styles.input} ${
                  showErrors && errors.primerApellido ? styles.inputError : ""
                }`}
              />
              {showErrors && errors.primerApellido && (
                <p className={styles.errorMessage}>{errors.primerApellido}</p>
              )}
            </div>
            <div className={styles.col}>
              <InputComponent
                type="text"
                value={formData.segundoApellido}
                onChange={handleInputChange("segundoApellido")}
                label="Segundo apellido"
                placeholder=""
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <InputComponent
                type="text"
                value={formData.telefono}
                onChange={handleInputChange("telefono")}
                label={
                  <p>
                    Teléfono <strong style={{ color: "red" }}>*</strong>
                  </p>
                }
                placeholder=""
                className={`${styles.input} ${
                  showErrors && errors.telefono ? styles.inputError : ""
                }`}
              />
              {showErrors && errors.telefono && (
                <p className={styles.errorMessage}>{errors.telefono}</p>
              )}
            </div>
            <div className={styles.col}>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  ¿Tiene WhatsApp?
                  <strong style={{ color: "red" }}> *</strong>
                </label>
                <div className={styles.radioOptions}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="whatsapp"
                      value="Si"
                      checked={formData.tieneWhatsapp === "Si"}
                      onChange={() => handleRadioChange("tieneWhatsapp", "Si")}
                      className={styles.radioInput}
                    />
                    Sí
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="whatsapp"
                      value="No"
                      checked={formData.tieneWhatsapp === "No"}
                      onChange={() => handleRadioChange("tieneWhatsapp", "No")}
                      className={styles.radioInput}
                    />
                    No
                  </label>
                </div>
              </div>
            </div>
            <div className={styles.col}>
              <InputComponent
                type="email"
                value={formData.correoElectronico}
                onChange={handleInputChange("correoElectronico")}
                label="Correo electrónico"
                placeholder=""
                className={`${styles.input} ${
                  showErrors && errors.correoElectronico
                    ? styles.inputError
                    : ""
                }`}
              />
              {showErrors && errors.correoElectronico && (
                <p className={styles.errorMessage}>
                  {errors.correoElectronico}
                </p>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.textareaContainer}>
              <InputComponent
                type="text"
                value={formData.comentarios}
                onChange={handleInputChange("comentarios")}
                label="Comentarios del contacto"
                placeholder=""
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.section}>
            <SelectComponent
              value={formData.tipoPago}
              onChange={handleSelectChange("tipoPago")}
              options={[
                { value: "efectivo", label: "Efectivo" },
                { value: "transferencia", label: "Transferencia" },
                { value: "tarjeta", label: "Tarjeta" },
              ]}
              label="Tipo de pago"
              placeholder="Seleccione..."
              required={true}
              className={styles.select}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <div className={styles.radioGroupHorizontal}>
                <label className={styles.radioLabelHorizontal}>
                  ¿Aplica IVA? <strong style={{ color: "red" }}>*</strong>
                </label>
                <div className={styles.radioOptions}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="iva"
                      value="Si"
                      checked={formData.aplicaIva === "Si"}
                      onChange={() => handleRadioChange("aplicaIva", "Si")}
                      className={styles.radioInput}
                    />
                    Sí
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="iva"
                      value="No"
                      checked={formData.aplicaIva === "No"}
                      onChange={() => handleRadioChange("aplicaIva", "No")}
                      className={styles.radioInput}
                    />
                    No
                  </label>
                </div>
              </div>
            </div>
            <div className={styles.col}>
              <InputComponent
                type="text"
                value={formData.costoViaje}
                onChange={handleInputChange("costoViaje")}
                label={
                  <p>
                    Costo del viaje <strong style={{ color: "red" }}>*</strong>
                  </p>
                }
                placeholder=""
                className={`${styles.input} ${
                  showErrors && errors.costoViaje ? styles.inputError : ""
                }`}
              />
              {showErrors && errors.costoViaje && (
                <p className={styles.errorMessage}>{errors.costoViaje}</p>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.radioGroupHorizontal}>
              <label className={styles.radioLabelHorizontal}>
                ¿Lleva comisión? <strong style={{ color: "red" }}>*</strong>
              </label>
              <div className={styles.radioOptions}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="comision"
                    value="Si"
                    className={styles.radioInput}
                    checked={formData.llevaComision === "Si"}
                    onChange={() => handleRadioChange("llevaComision", "Si")}
                  />
                  Sí
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="comision"
                    value="No"
                    className={styles.radioInput}
                    checked={formData.llevaComision === "No"}
                    onChange={() => handleRadioChange("llevaComision", "No")}
                  />
                  No
                </label>
              </div>
            </div>
          </div>

          {/* Conditional commission fields */}
          {formData.llevaComision === "Si" && (
            <>
              <div className={styles.section}>
                <InputComponent
                  type="text"
                  value={formData.nombreRecibeComision}
                  onChange={handleInputChange("nombreRecibeComision")}
                  label="Nombre de quien recibe la comisión *"
                  placeholder=""
                  className={`${styles.input} ${
                    showErrors && errors.nombreRecibeComision
                      ? styles.inputError
                      : ""
                  }`}
                />
                {showErrors && errors.nombreRecibeComision && (
                  <p className={styles.errorMessage}>
                    {errors.nombreRecibeComision}
                  </p>
                )}
              </div>

              <div className={styles.section}>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    Tipo de comisión <strong style={{ color: "red" }}>*</strong>
                  </label>
                  <div className={styles.radioOptions}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="tipoComision"
                        value="Porcentaje"
                        className={styles.radioInput}
                        checked={formData.tipoComision === "Porcentaje"}
                        onChange={() =>
                          handleRadioChange("tipoComision", "Porcentaje")
                        }
                      />
                      Porcentaje
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="tipoComision"
                        value="Arreglada"
                        className={styles.radioInput}
                        checked={formData.tipoComision === "Arreglada"}
                        onChange={() =>
                          handleRadioChange("tipoComision", "Arreglada")
                        }
                      />
                      Arreglada
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.row}>
                {formData.tipoComision === "Porcentaje" && (
                  <div className={styles.col}>
                    <InputComponent
                      type="text"
                      value={formData.porcentaje}
                      onChange={handleInputChange("porcentaje")}
                      label="Porcentaje (%)"
                      placeholder=""
                      className={`${styles.input} ${
                        showErrors && errors.porcentaje ? styles.inputError : ""
                      }`}
                    />
                    {showErrors && errors.porcentaje && (
                      <p className={styles.errorMessage}>{errors.porcentaje}</p>
                    )}
                  </div>
                )}
                <div className={styles.col}>
                  <InputComponent
                    type="text"
                    value={formData.montoArreglado}
                    onChange={handleInputChange("montoArreglado")}
                    label={
                      formData.tipoComision === "Porcentaje"
                        ? "Monto del porcentaje ($)"
                        : "Monto de la comisión ($)"
                    }
                    placeholder=""
                    className={`${styles.input} ${
                      showErrors && errors.montoArreglado
                        ? styles.inputError
                        : ""
                    }`}
                  />
                  {showErrors && errors.montoArreglado && (
                    <p className={styles.errorMessage}>
                      {errors.montoArreglado}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className={styles.section}>
            <SelectComponent
              value={formData.coordinadorViaje}
              onChange={handleSelectChange("coordinadorViaje")}
              options={[
                { value: "coordinador1", label: "Coordinador 1" },
                { value: "coordinador2", label: "Coordinador 2" },
                { value: "coordinador3", label: "Coordinador 3" },
              ]}
              label="Coordinador del viaje"
              placeholder="Seleccione..."
              className={styles.select}
            />
          </div>

          <div className={styles.section}>
            <div className={styles.textareaContainer}>
              <label className={styles.textareaLabel}>
                Observaciones internas
              </label>
              <textarea
                value={formData.observacionesInternas}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    observacionesInternas: e.target.value,
                  }))
                }
                className={styles.textarea}
                rows={4}
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
              onClick={handleNext}
              className={`${styles.button} ${styles.nextButton}`}
            >
              Siguiente
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
