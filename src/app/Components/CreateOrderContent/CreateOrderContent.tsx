"use client";
import { useState, useCallback, useEffect } from "react";
import styles from "./CreateOrderContent.module.css";
import InputComponent from "../InputComponent/InputComponent";
import SelectComponent from "@/app/Components/SelectComponent/SelectComponent";
import SearchableSelectComponent, {
  SearchableSelectOption,
} from "@/app/Components/SearchableSelectComponent/SearchableSelectComponent";
import CreateClientModal from "../CreateClientModal/CreateClientModal";
import ButtonComponent from "@/app/Components/ButtonComponent/ButtonComponent";
import {
  ArrowLeftFilled,
  Edit24Regular,
  Save24Regular,
} from "@fluentui/react-icons";
import Link from "next/link";
import { showErrorAlert, showSuccessAlert } from "../../Utils/AlertUtil";
import {
  OrderFormData,
  mapOrderFormToPayload,
} from "@/app/Types/OrderTripTypes";
import { useOrderContext } from "@/app/Contexts/OrderContext";
import { useRouter } from "next/navigation";
import { referenceService, ApiError } from "@/services/api";
import type {
  PrefillableData,
  ClientTypeReference,
  PaymentTypeReference,
} from "@/services/api/reference.service";
import CountrySelect from "@/app/Components/CountrySelect/CountrySelect";
import FormField from "@/app/Components/FormField/FormField";
import { useOrderForm } from "@/app/hooks/useOrderForm";
import { useOrderValidation } from "@/app/hooks/useOrderValidation";

export default function CreateOrderContent() {
  const { orderData, setOrderData, clearData } = useOrderContext();
  const router = useRouter();

  // Use context data as form data

  const [prefillableData, setPrefillableData] =
    useState<PrefillableData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [originalContactData, setOriginalContactData] = useState<any>(null);
  const orderForm = useOrderForm<OrderFormData>(orderData);

  const {
    formData,
    setFormData,
    errors,
    setErrors,
    showErrors,
    setShowErrors,
    touchedFields,
    input,
    select,
    radio,
    updateField,
  } = orderForm;
  const { requiredErrors, isValid } = useOrderValidation(formData, showErrors);
  // Function to get required field status
  const getFieldRequiredStatus = useCallback(
    (fieldName: string): boolean => {
      switch (fieldName) {
        case "empresa":
        case "nombreContacto":
        case "primerApellido":
        case "tieneWhatsapp":
        case "costoViaje":
        case "aplicaIva":
        case "llevaComision":
        case "tipoPago":
          return true;
        case "nombreRecibeComision":
        case "tipoComision":
          return formData.llevaComision === "Si";
        default:
          return false;
      }
    },
    [formData.llevaComision],
  );

  const getMissingRequiredFields = useCallback(() => {
    const missing: Record<string, string> = {};

    const check = (field: string, label: string) => {
      if (!getFieldRequiredStatus(field)) return;

      const value = formData[field as keyof typeof formData];

      if (!value || value.toString().trim() === "") {
        missing[field] = `${label} es obligatorio`;
      }
    };

    check("empresa", "Empresa o cliente");
    check("nombreContacto", "Nombre del contacto");
    check("primerApellido", "Primer apellido");
    check("tieneWhatsapp", "WhatsApp");
    check("costoViaje", "Costo del viaje");
    check("aplicaIva", "Aplica IVA");
    check("llevaComision", "Lleva comisión");
    check("tipoPago", "Tipo de pago");

    if (formData.llevaComision === "Si") {
      check("nombreRecibeComision", "Nombre de quien recibe comisión");
      check("tipoComision", "Tipo de comisión");
    }

    return missing;
  }, [formData, getFieldRequiredStatus]);

  const mergedErrors = {
    ...requiredErrors,
    ...errors,
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidPhone = (phone: string) => {
    const phoneRegex = /^\d*$/;
    return phoneRegex.test(phone);
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
    setShowErrors(true);

    const missing = getMissingRequiredFields();

    if (Object.keys(missing).length > 0) {
      showErrorAlert("Campos obligatorios", "Complete los campos requeridos.");
      return;
    }

    setOrderData(formData);

    router.push("/dashboard/createOrder/createTrip");
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
        showErrorAlert(
          "Error",
          `No se pudieron cargar los datos: ${error.message}`,
        );
      }
      setPrefillableData(null);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const handleClientSearch = async (
    query: string,
  ): Promise<SearchableSelectOption[]> => {
    try {
      const results = await referenceService.searchClients(query);
      return results.map((client) => ({
        value: client.client_id.toString(),
        label: client.name,
        data: client,
      }));
    } catch (error) {
      console.error("Error searching clients:", error);
      return [];
    }
  };

  const handleClientSelect = async (
    clientId: string,
    option?: SearchableSelectOption,
  ) => {
    console.log("handleClientSelect called with:", { clientId, option });

    // Auto-fill contact information if available
    if (option?.data) {
      try {
        console.log("Fetching client details for ID:", clientId);
        const clientDetails = await referenceService.getClientById(
          parseInt(clientId),
        );
        console.log("Client details received:", clientDetails);

        const primaryContact =
          clientDetails.primary_contact || clientDetails.contacts?.[0];
        console.log("Primary contact:", primaryContact);

        if (primaryContact) {
          const contactData = {
            nombreContacto: primaryContact.name || "",
            primerApellido: primaryContact.first_lastname || "",
            segundoApellido: primaryContact.second_lastname || "",
            telefono: primaryContact.phone || "",
            correoElectronico: primaryContact.email || "",
            tieneWhatsapp: primaryContact.is_whatsapp_available ? "Si" : "No",
          };
          setFormData((prev) => ({
            ...prev,
            empresa: clientId,
            empresaNombre: clientDetails.name || option.label,
            empresaTipo: clientDetails.client_type_id?.toString() || "",
            ...contactData,
          }));
          setOriginalContactData(contactData);
          setIsEditingContact(false);
        } else {
          setFormData((prev) => ({
            ...prev,
            empresa: clientId,
            empresaNombre: clientDetails.name || option.label,
            empresaTipo: clientDetails.client_type_id?.toString() || "",
          }));
          setOriginalContactData(null);
          setIsEditingContact(false);
        }
      } catch (error) {
        console.error("Error fetching client details:", error);
        setFormData((prev) => ({
          ...prev,
          empresa: clientId,
          empresaNombre: option.label,
          empresaTipo: "",
        }));
        setOriginalContactData(null);
        setIsEditingContact(false);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        empresa: clientId,
        empresaNombre: option?.label || "",
        empresaTipo: "",
      }));
      setOriginalContactData(null);
      setIsEditingContact(false);
    }
  };

  const handleCreateClient = () => {
    setIsClientModalOpen(true);
  };

  const handleEditContact = () => {
    setIsEditingContact(true);
  };

  const handleSaveContact = async () => {
    if (!formData.empresa) return;

    try {
      // Validate contact fields
      const contactErrors: { [key: string]: string } = {};

      if (!formData.nombreContacto.trim()) {
        contactErrors.nombreContacto = "El nombre del contacto es obligatorio";
      }
      if (!formData.primerApellido.trim()) {
        contactErrors.primerApellido = "El primer apellido es obligatorio";
      }
      if (formData.telefono.trim() && !isValidPhone(formData.telefono)) {
        contactErrors.telefono = "El teléfono solo debe contener números";
      }
      if (
        formData.correoElectronico.trim() &&
        !isValidEmail(formData.correoElectronico)
      ) {
        contactErrors.correoElectronico = "El correo electrónico no es válido";
      }

      if (Object.keys(contactErrors).length > 0) {
        setErrors(contactErrors);
        setShowErrors(true);
        showErrorAlert(
          "Errores en datos de contacto",
          "Por favor corrija los errores antes de guardar.",
        );
        return;
      }

      // TODO: Implement backend endpoint to update contact
      // For now, just update the local state

      // Update original data
      setOriginalContactData({
        nombreContacto: formData.nombreContacto,
        primerApellido: formData.primerApellido,
        segundoApellido: formData.segundoApellido,
        telefono: formData.telefono,
        correoElectronico: formData.correoElectronico,
        tieneWhatsapp: formData.tieneWhatsapp,
      });

      setIsEditingContact(false);
      showSuccessAlert(
        "Cambios guardados",
        "Los cambios en los datos del contacto se han guardado localmente. Se actualizarán al crear el contrato.",
      );
    } catch (error) {
      console.error("Error saving contact:", error);
      showErrorAlert(
        "Error",
        "No se pudieron guardar los cambios. Intente nuevamente.",
      );
    }
  };

  const handleCancelEditContact = () => {
    if (originalContactData) {
      setFormData((prev) => ({
        ...prev,
        ...originalContactData,
      }));
    }
    setIsEditingContact(false);
  };

  const handleClientCreated = (
    clientId: number,
    clientName: string,
    contactData?: any,
  ) => {
    // Auto-fill form with newly created client
    const contact = {
      nombreContacto: contactData?.name || "",
      primerApellido: contactData?.first_lastname || "",
      segundoApellido: contactData?.second_lastname || "",
      telefono: contactData?.phone || "",
      correoElectronico: contactData?.email || "",
      tieneWhatsapp: contactData?.is_whatsapp_available ? "Si" : "No",
    };
    setFormData((prev) => ({
      ...prev,
      empresa: clientId.toString(),
      ...contact,
    }));
    setOriginalContactData(contact);
    setIsEditingContact(false);
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
      const porAsignarPaymentType = prefillableData.payment_types.find((type) =>
        type.name.toLowerCase().includes("por asignar"),
      );
      const porAsignarCoordinator = prefillableData.coordinators?.find(
        (coord) => coord.display_name?.toLowerCase().includes("por asignar"),
      );

      setFormData((prev) => ({
        ...prev,
        tieneWhatsapp: "Si",
        aplicaIva: "Si",
        llevaComision: "No",
        tipoPago: porAsignarPaymentType
          ? porAsignarPaymentType.payment_type_id.toString()
          : "",
        coordinadorViaje: porAsignarCoordinator
          ? porAsignarCoordinator.user_id.toString()
          : "",
      }));
    }
  }, [prefillableData, orderData.empresa]);

  // Also sync when formData changes
  useEffect(() => {
    console.log("CreateOrderContent - FormData changed:", formData);
  }, [formData]);

  // Function to check if all required fields are filled
  const areAllRequiredFieldsFilled = useCallback(() => {
    return Object.keys(getMissingRequiredFields()).length === 0;
  }, [getMissingRequiredFields]);

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
            <p className={styles.subtitle} style={{ color: "red" }}>
              Campos obligatorios <strong style={{ color: "red" }}>* </strong>
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
            />
            {mergedErrors.empresa && (
              <p className={styles.requiredLabel}>{mergedErrors.empresa}</p>
            )}
          </div>

          <div className={styles.contactSection}>
            <div className={styles.contactHeader}>
              <h3 className={styles.contactTitle}>Datos del contacto</h3>
              {formData.empresa && !isEditingContact && (
                <button
                  type="button"
                  onClick={handleEditContact}
                  className={styles.editButton}
                  title="Editar datos de contacto"
                >
                  <Edit24Regular />
                </button>
              )}
              {formData.empresa && isEditingContact && (
                <div className={styles.contactActions}>
                  <button
                    type="button"
                    onClick={handleCancelEditContact}
                    className={styles.cancelEditButton}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveContact}
                    className={styles.saveButton}
                    title="Guardar cambios"
                  >
                    <Save24Regular /> Guardar cambios
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <FormField
                label="Nombre del contacto"
                required
                error={mergedErrors.nombreContacto}
              >
                <InputComponent
                  type="text"
                  {...input("nombreContacto")}
                  disabled={!isEditingContact}
                  className={styles.input}
                />
              </FormField>
            </div>
            <div className={styles.col}>
              <FormField
                label="Primer apellido"
                required
                error={mergedErrors.primerApellido}
              >
                <InputComponent
                  type="text"
                  {...input("primerApellido")}
                  disabled={!isEditingContact}
                  className={styles.input}
                />
              </FormField>
            </div>
            <div className={styles.col}>
              <InputComponent
                type="text"
                {...input("segundoApellido")}
                label="Segundo apellido"
                placeholder=""
                disabled={!isEditingContact}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <div className={styles.phoneInputGroup}>
                <CountrySelect
                  value={formData.codigoPais || "+52"}
                  onChange={(e) =>
                    setFormData({ ...formData, codigoPais: e.target.value })
                  }
                  disabled={!isEditingContact}
                  className={styles.countryCodeSelect}
                />
                <InputComponent
                  type="text"
                  {...input("telefono")}
                  label="Teléfono"
                  placeholder=""
                  disabled={!isEditingContact}
                  className={`${styles.input} ${
                    showErrors && mergedErrors.telefono ? styles.inputError : ""
                  }`}
                />
              </div>
              {showErrors && mergedErrors.telefono && (
                <p className={styles.errorMessage}>{mergedErrors.telefono}</p>
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
                      disabled={!isEditingContact}
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
                      disabled={!isEditingContact}
                      className={styles.radioInput}
                    />
                    No
                  </label>
                </div>
                {mergedErrors.tieneWhatsapp && (
                  <p className={styles.requiredLabel}>
                    {mergedErrors.tieneWhatsapp}
                  </p>
                )}
              </div>
            </div>
            <div className={styles.col}>
              <InputComponent
                type="email"
                {...input("correoElectronico")}
                label="Correo electrónico"
                placeholder=""
                disabled={!isEditingContact}
                className={`${styles.input} ${
                  showErrors && mergedErrors.correoElectronico
                    ? styles.inputError
                    : ""
                }`}
              />
              {showErrors && mergedErrors.correoElectronico && (
                <p className={styles.errorMessage}>
                  {mergedErrors.correoElectronico}
                </p>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.textareaContainer}>
              <InputComponent
                type="text"
                {...input("comentarios")}
                label="Comentarios del contacto"
                placeholder=""
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.section}>
            <SelectComponent
              {...select("tipoPago")}
              options={[
                ...(prefillableData?.payment_types
                  ? referenceService.transformPaymentTypesForSelect(
                      prefillableData.payment_types,
                    )
                  : []),
              ]}
              label="Tipo de pago"
              placeholder="Seleccione..."
              required
              className={styles.select}
            />
            {mergedErrors.tipoPago && (
              <p className={styles.requiredLabel}>{mergedErrors.tipoPago}</p>
            )}
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
                      {...radio("aplicaIva", "Si")}
                    />
                    Sí
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="iva"
                      value="No"
                      {...radio("aplicaIva", "No")}
                    />
                    No
                  </label>
                </div>
                {mergedErrors.aplicaIva && (
                  <p className={styles.requiredLabel}>
                    {mergedErrors.aplicaIva}
                  </p>
                )}
              </div>
            </div>
            <div className={styles.col}>
              <FormField
                label="Costo del viaje"
                required
                error={mergedErrors.costoViaje}
              >
                <InputComponent
                  type="text"
                  {...input("costoViaje")}
                  className={styles.input}
                />
              </FormField>
              {showErrors && mergedErrors.costoViaje && (
                <p className={styles.errorMessage}>{mergedErrors.costoViaje}</p>
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
              {mergedErrors.llevaComision && (
                <p className={styles.requiredLabel}>
                  {mergedErrors.llevaComision}
                </p>
              )}
            </div>
          </div>

          {/* Conditional commission fields */}
          {formData.llevaComision === "Si" && (
            <>
              <div className={styles.section}>
                <FormField
                  label="Nombre de quien recibe la comisión"
                  required
                  error={mergedErrors.nombreRecibeComision}
                >
                  <InputComponent
                    type="text"
                    {...input("nombreRecibeComision")}
                    className={styles.input}
                  />
                </FormField>
                {showErrors && mergedErrors.nombreRecibeComision && (
                  <p className={styles.errorMessage}>
                    {mergedErrors.nombreRecibeComision}
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
                        {...radio("tipoComision", "Porcentaje")}
                      />
                      Porcentaje
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="tipoComision"
                        value="Arreglada"
                        className={styles.radioInput}
                        {...radio("tipoComision", "Arreglada")}
                      />
                      Arreglada
                    </label>
                  </div>
                  {touchedFields.has("tipoComision") &&
                    !formData.tipoComision && (
                      <p className={styles.requiredLabel}>
                        Este campo es obligatorio
                      </p>
                    )}
                  {showErrors && mergedErrors.tipoComision && (
                    <p className={styles.errorMessage}>
                      {mergedErrors.tipoComision}
                    </p>
                  )}
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
                          const calculatedAmount =
                            tripCost * (parseFloat(percentage) / 100);
                          setFormData((prev) => ({
                            ...prev,
                            porcentaje: percentage,
                            montoArreglado:
                              calculatedAmount > 0
                                ? calculatedAmount.toFixed(2)
                                : "",
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
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.col}>
                      <FormField
                        label="Nombre de quien recibe la comisión"
                        required
                        error={mergedErrors.nombreRecibeComision}
                      >
                        <InputComponent
                          {...input("nombreRecibeComision")}
                          className={styles.input}
                        />
                      </FormField>
                      {showErrors && mergedErrors.nombreRecibeComision && (
                        <p className={styles.errorMessage}>
                          {mergedErrors.nombreRecibeComision}
                        </p>
                      )}
                    </div>
                  </>
                )}
                {formData.tipoComision === "Arreglada" && (
                  <div className={styles.col}>
                    <InputComponent
                      {...input("montoArreglado")}
                      label="Monto de la comisión ($)"
                      placeholder=""
                      className={`${styles.input} ${
                        showErrors && mergedErrors.montoArreglado
                          ? styles.inputError
                          : ""
                      }`}
                    />
                    {showErrors && mergedErrors.montoArreglado && (
                      <p className={styles.errorMessage}>
                        {mergedErrors.montoArreglado}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          <div className={styles.section}>
            <SelectComponent
              {...select("coordinadorViaje")}
              options={[
                { value: "POR_ASIGNAR", label: "Por asignar" },
                ...(prefillableData?.coordinators
                  ? prefillableData.coordinators.map((coord) => ({
                      value: coord.user_id.toString(),
                      label: coord.display_name,
                    }))
                  : []),
              ]}
              label="Chofer programado"
              placeholder="Seleccione..."
              className={styles.select}
            />
          </div>

          <div className={styles.section}>
            <div className={styles.textareaContainer}>
              <label className={styles.textareaLabel}>Observaciones</label>
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
              title={
                !areAllRequiredFieldsFilled()
                  ? "Complete los campos obligatorios antes de continuar"
                  : "Siguiente"
              }
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
