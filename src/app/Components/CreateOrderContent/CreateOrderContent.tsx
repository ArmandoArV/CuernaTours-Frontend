"use client";
import { useState, useCallback, useEffect } from "react";
import styles from "./CreateOrderContent.module.css";
import InputComponent from "../InputComponent/InputComponent";
import SelectComponent from "../SelectComponent/SelectComponent";
import SearchableSelectComponent, { SearchableSelectOption } from "../SearchableSelectComponent/SearchableSelectComponent";
import CreateClientModal from "../CreateClientModal/CreateClientModal";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { ArrowLeftFilled } from "@fluentui/react-icons";
import Link from "next/link";
import { showErrorAlert, showSuccessAlert } from "../../Utils/AlertUtil";
import { OrderFormData, mapOrderFormToPayload } from "@/app/Types/OrderTripTypes";
import { useOrderContext } from "@/app/Contexts/OrderContext";
import { useRouter } from "next/navigation";
import { referenceService, ApiError } from "@/services/api";
import type { PrefillableData, ClientTypeReference, PaymentTypeReference } from "@/services/api/reference.service";
export default function CreateOrderContent() {
  const { orderData, setOrderData, clearData } = useOrderContext();
  const router = useRouter();

  // Use context data as form data
  const [formData, setFormData] = useState(orderData);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showErrors, setShowErrors] = useState(false);
  const [prefillableData, setPrefillableData] = useState<PrefillableData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

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
    if (formData.telefono.trim() && !isValidPhone(formData.telefono)) {
      newErrors.telefono = "El teléfono solo debe contener números";
    }

    if (!formData.tieneWhatsapp) {
      missingFields.push("¿Tiene WhatsApp?");
    }

    if (!formData.costoViaje.trim()) {
      missingFields.push("Costo del viaje");
      newErrors.costoViaje = "El costo del viaje es obligatorio";
    } else if (!isValidNumber(formData.costoViaje)) {
      newErrors.costoViaje = "El costo del viaje debe ser un número válido";
    }

    if (!formData.aplicaIva) {
      missingFields.push("¿Aplica IVA?");
    }

    if (!formData.llevaComision) {
      missingFields.push("¿Lleva comisión?");
    }

    // Conditional validations when llevaComision is "Si"
    if (formData.llevaComision === "Si") {
      if (!formData.nombreRecibeComision.trim()) {
        missingFields.push("Nombre de quien recibe la comisión");
        newErrors.nombreRecibeComision =
          "El nombre de quien recibe la comisión es obligatorio";
      }

      if (!formData.tipoComision) {
        missingFields.push("Tipo de comisión");
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
        "Ingrese un correo electrónico válido."
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
        "Corrija los campos que contienen formato incorrecto."
      );
      return false;
    }

    // Show missing fields alert if any
    if (missingFields.length > 0) {
      const fieldsList = missingFields.join(", ");
      showErrorAlert(
        "Campos obligatorios faltantes",
        `Complete los siguientes campos obligatorios: ${fieldsList}`
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

  const fetchPrefillableData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const data = await referenceService.getPrefillableData();
      setPrefillableData(data);
    } catch (error) {
      console.error("Error fetching prefillable data:", error);
      if (error instanceof ApiError) {
        showErrorAlert("Error", `No se pudieron cargar los datos: ${error.message}`);
      }
      setPrefillableData(null);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const handleClientSearch = async (query: string): Promise<SearchableSelectOption[]> => {
    try {
      const results = await referenceService.searchClients(query);
      return results.map(client => ({
        value: client.client_id.toString(),
        label: client.name,
        data: client,
      }));
    } catch (error) {
      console.error("Error searching clients:", error);
      return [];
    }
  };

  const handleClientSelect = async (clientId: string, option?: SearchableSelectOption) => {
    console.log("handleClientSelect called with:", { clientId, option });
    
    // Auto-fill contact information if available
    if (option?.data) {
      try {
        console.log("Fetching client details for ID:", clientId);
        const clientDetails = await referenceService.getClientById(parseInt(clientId));
        console.log("Client details received:", clientDetails);
        
        const primaryContact = clientDetails.primary_contact || clientDetails.contacts?.[0];
        console.log("Primary contact:", primaryContact);
        
        if (primaryContact) {
          setFormData(prev => ({
            ...prev,
            empresa: clientId,
            nombreContacto: primaryContact.name || '',
            primerApellido: primaryContact.first_lastname || '',
            segundoApellido: primaryContact.second_lastname || '',
            telefono: primaryContact.phone || '',
            correoElectronico: primaryContact.email || '',
            tieneWhatsapp: primaryContact.is_whatsapp_available ? 'Si' : 'No',
          }));
        } else {
          setFormData(prev => ({ ...prev, empresa: clientId }));
        }
      } catch (error) {
        console.error("Error fetching client details:", error);
        setFormData(prev => ({ ...prev, empresa: clientId }));
      }
    } else {
      setFormData(prev => ({ ...prev, empresa: clientId }));
    }
  };

  const handleCreateClient = () => {
    setIsClientModalOpen(true);
  };

  const handleClientCreated = (clientId: number, clientName: string, contactData?: any) => {
    // Auto-fill form with newly created client
    setFormData(prev => ({
      ...prev,
      empresa: clientId.toString(),
      nombreContacto: contactData?.name || '',
      primerApellido: contactData?.first_lastname || '',
      segundoApellido: contactData?.second_lastname || '',
      telefono: contactData?.phone || '',
      correoElectronico: contactData?.email || '',
      tieneWhatsapp: contactData?.is_whatsapp_available ? 'Si' : 'No',
    }));
    setIsClientModalOpen(false);
  };

  useEffect(() => {
    const initializeForm = async () => {
      // Clear any persisted data on initial mount
      clearData();
      
      // Fetch prefillable data
      await fetchPrefillableData();
    };
    
    initializeForm();
  }, []); // Empty dependency array - only run on mount

  // Set default values after prefillable data is loaded
  useEffect(() => {
    if (prefillableData && !orderData.empresa) {
      // Only set defaults if form is empty (no empresa selected)
      const porAsignarPaymentType = prefillableData.payment_types.find(
        type => type.name.toLowerCase().includes('por asignar')
      );
      const porAsignarCoordinator = prefillableData.coordinators?.find(
        coord => coord.display_name?.toLowerCase().includes('por asignar')
      );

      setFormData(prev => ({
        ...prev,
        tieneWhatsapp: 'Si',
        aplicaIva: 'Si',
        llevaComision: 'No',
        tipoPago: porAsignarPaymentType ? porAsignarPaymentType.payment_type_id.toString() : '',
        coordinadorViaje: porAsignarCoordinator ? porAsignarCoordinator.user_id.toString() : '',
      }));
    }
  }, [prefillableData, orderData.empresa]);

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
              <ArrowLeftFilled color="#61636E" />
            </button>
          </Link>
          <div>
            <h1 className={styles.title}>Crear contrato de orden</h1>
            <p className={styles.subtitle} style={{color: "red"}}>
              Campos obligatorios{" "}
              <strong style={{ color: "red" }}>* </strong>
            </p>
          </div>
        </div>
        <form className={styles.form}>
          <div className={styles.placeSection}>
            <SearchableSelectComponent
              value={formData.empresa}
              onChange={handleClientSelect}
              onSearch={handleClientSearch}
              onCreate={handleCreateClient}
              label="Empresa o cliente"
              placeholder="Buscar cliente..."
              required={true}
              createButtonText="Crear Nuevo Cliente"
              noResultsText="No se encontraron clientes"
              loadingText="Buscando..."
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
                label="Teléfono"
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
                ...(prefillableData?.payment_types
                  ? referenceService.transformPaymentTypesForSelect(prefillableData.payment_types)
                  : [])
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
                  <>
                    <div className={styles.col}>
                      <SelectComponent
                        value={formData.porcentaje}
                        onChange={(e) => {
                          const percentage = e.target.value;
                          const tripCost = parseFloat(formData.costoViaje) || 0;
                          const calculatedAmount = tripCost * (parseFloat(percentage) / 100);
                          
                          setFormData((prev) => ({
                            ...prev,
                            porcentaje: percentage,
                            montoArreglado: calculatedAmount > 0 ? calculatedAmount.toFixed(2) : "",
                          }));
                        }}
                        options={[
                          { value: "", label: "Seleccione..." },
                          { value: "10", label: "10%" },
                          { value: "15", label: "15%" },
                          { value: "20", label: "20%" },
                        ]}
                        label="Porcentaje (%)"
                        placeholder="Seleccione..."
                        className={`${styles.select} ${
                          showErrors && errors.porcentaje ? styles.selectError : ""
                        }`}
                      />
                      {showErrors && errors.porcentaje && (
                        <p className={styles.errorMessage}>{errors.porcentaje}</p>
                      )}
                    </div>
                    <div className={styles.col}>
                      <InputComponent
                        type="text"
                        value={formData.montoArreglado}
                        onChange={handleInputChange("montoArreglado")}
                        label="Monto del porcentaje ($)"
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
                  </>
                )}
                {formData.tipoComision === "Arreglada" && (
                  <div className={styles.col}>
                    <InputComponent
                      type="text"
                      value={formData.montoArreglado}
                      onChange={handleInputChange("montoArreglado")}
                      label="Monto de la comisión ($)"
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
                )}
              </div>
            </>
          )}

          <div className={styles.section}>
            <SelectComponent
              value={formData.coordinadorViaje}
              onChange={handleSelectChange("coordinadorViaje")}
              options={[
                { value: "POR_ASIGNAR", label: "Por asignar" },
                ...(prefillableData?.coordinators
                  ? prefillableData.coordinators.map(coord => ({
                      value: coord.user_id.toString(),
                      label: coord.display_name,
                    }))
                  : [])
              ]}
              label="Chofer programado"
              placeholder="Seleccione..."
              className={styles.select}
            />
          </div>

          <div className={styles.section}>
            <div className={styles.textareaContainer}>
              <label className={styles.textareaLabel}>
                Observaciones
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
            <ButtonComponent
              text="Cancelar"
              onClick={handleCancel}
              type="cancel"
              className={styles.cancelButton}
            />
            <ButtonComponent
              text="Siguiente"
              onClick={handleNext}
              type="button"
              className={styles.nextButton}
            />
          </div>
        </form>
      </div>

      <CreateClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onClientCreated={handleClientCreated}
        clientTypes={prefillableData?.client_types || []}
      />
    </main>
  );
}
