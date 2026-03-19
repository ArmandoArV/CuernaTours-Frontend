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
import { Field } from "@fluentui/react-components";
import {
  ArrowLeftFilled,
  Edit24Regular,
  Save24Regular,
} from "@fluentui/react-icons";
import Link from "next/link";
import { showErrorAlert, showSuccessAlert } from "../../Utils/AlertUtil";
import { OrderFormData } from "@/app/Types/OrderTripTypes";
import { useOrderContext } from "@/app/Contexts/OrderContext";
import { useRouter } from "next/navigation";
import { referenceService, ApiError } from "@/services/api";
import {
  contractsService,
  ContractWithDetails,
} from "@/services/api/contracts.service";
import type { PrefillableData } from "@/services/api/reference.service";
import CountrySelect from "@/app/Components/CountrySelect/CountrySelect";
import { useOrderForm } from "@/app/hooks/useOrderForm";
import { useOrderValidation } from "@/app/hooks/useOrderValidation";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("CreateOrderContent");
import { useClientSelection } from "@/app/hooks/useClientSelection";

interface CreateOrderContentProps {
  contractId?: string;
}

export default function CreateOrderContent({
  contractId,
}: CreateOrderContentProps) {
  const isEdit = !!contractId;
  const { orderData, tripData, setOrderData, clearData, saveToLocalStorage } =
    useOrderContext();
  const router = useRouter();

  const [prefillableData, setPrefillableData] =
    useState<PrefillableData | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Replaced with hook:
  // const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [originalContactData, setOriginalContactData] = useState<any>(null);

  // Contract data from API (for edit mode)
  const [contract, setContract] = useState<ContractWithDetails | null>(null);
  const [isLoadingContract, setIsLoadingContract] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);

  const orderForm = useOrderForm<OrderFormData>(orderData as OrderFormData);

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
    textarea,
    radio,
    updateField,
  } = orderForm;

  const {
    isClientModalOpen,
    setIsClientModalOpen,
    handleClientSearch,
    handleClientSelect: handleClientSelectHook,
    handleCreateClient,
    handleClientCreated,
  } = useClientSelection({
    onClientSelect: (data) => {
      setFormData((prev) => ({
        ...prev,
        ...data,
      }));

      // Update original contact data if not editing
      if (!isEditingContact) {
        const contactData = {
          nombreContacto: data.nombreContacto || "",
          primerApellido: data.primerApellido || "",
          segundoApellido: data.segundoApellido || "",
          telefono: data.telefono || "",
          correoElectronico: data.correoElectronico || "",
          tieneWhatsapp: data.tieneWhatsapp || "No",
        };
        setOriginalContactData(contactData);
      }
    },
    onError: (error) => {
      log.error("Order form error:", error);
    },
  });

  // Wrapper for handleClientSelect to match component signature
  const handleClientSelect = (
    clientId: string,
    option?: SearchableSelectOption,
  ) => {
    handleClientSelectHook(clientId, option);
  };

  // Fetch contract data on mount using /contracts/details/[id] endpoint
  useEffect(() => {
    const fetchContract = async () => {
      if (!contractId) {
        return;
      }

      try {
        setIsLoadingContract(true);
        const contractData = await contractsService.getContractDetails(
          parseInt(contractId),
        );
        setContract(contractData);

        // Pre-fill form with contract data
        const updatedFormData: Partial<OrderFormData> = {
          empresa: contractData.client_id?.toString() || "",
          empresaNombre: contractData.client_name || "",
          tipoPago: contractData.payment_type_id?.toString() || "",
          aplicaIva: contractData.IVA ? "Si" : "No",
          costoViaje: contractData.amount?.toString() || "",
          coordinadorViaje: contractData.coordinator_id?.toString() || "",
          coordinadorNombre: contractData.coordinator_name
            ? `${contractData.coordinator_name} ${contractData.coordinator_lastname || ""}`.trim()
            : "",
          observacionesInternas: contractData.internal_observations || "",
          comentarios: contractData.observations || "",
        };

        // Pre-fill commission fields from API response
        const commission = contractData.commission;
        if (contractData.commission_id && commission) {
          updatedFormData.llevaComision = "Si";
          updatedFormData.nombreRecibeComision =
            commission.establishment || "";
          updatedFormData.tipoComision =
            commission.type === "percentage" ? "Porcentaje" : "Arreglada";
          if (commission.type === "percentage" && commission.amount != null) {
            updatedFormData.porcentaje = commission.amount.toString();
          }
          if (commission.type === "arranged") {
            updatedFormData.montoArreglado =
              commission.amount != null ? commission.amount.toString() : "";
          }
        } else {
          updatedFormData.llevaComision = "No";
        }

        log.group(`Edit order debug for contract ${contractId}`, () => {
          log.debug("Raw contract details response:", contractData);
          log.debug("Commission data received from API:", {
            commissionId: contractData.commission_id ?? null,
            commission: contractData.commission ?? null,
          });
          log.debug("Form prefill currently mapped from contract:", updatedFormData);
          log.debug("Commission-related fields currently mapped into form:", {
            llevaComision: updatedFormData.llevaComision ?? "(not mapped)",
            nombreRecibeComision:
              updatedFormData.nombreRecibeComision ?? "(not mapped)",
            tipoComision: updatedFormData.tipoComision ?? "(not mapped)",
            porcentaje: updatedFormData.porcentaje ?? "(not mapped)",
            montoArreglado: updatedFormData.montoArreglado ?? "(not mapped)",
          });
        });

        // Fetch client details to get contact information
        if (contractData.client_id) {
          try {
            const clientDetails = await referenceService.getClientById(
              contractData.client_id,
            );
            const primaryContact =
              clientDetails.primary_contact || clientDetails.contacts?.[0];

            if (primaryContact) {
              updatedFormData.nombreContacto = primaryContact.name || "";
              updatedFormData.primerApellido =
                primaryContact.first_lastname || "";
              updatedFormData.segundoApellido =
                primaryContact.second_lastname || "";
              updatedFormData.telefono = primaryContact.phone || "";
              updatedFormData.correoElectronico = primaryContact.email || "";
              updatedFormData.tieneWhatsapp =
                primaryContact.is_whatsapp_available ? "Si" : "No";
            }
          } catch (clientErr) {
            log.error("Error fetching client details:", clientErr);
          }
        }

        setFormData((prev) => ({
          ...prev,
          ...updatedFormData,
        }));

        log.debug("Edit order form data after applying contract prefill:", {
          contractId,
          llevaComision: updatedFormData.llevaComision ?? "(not mapped)",
          nombreRecibeComision:
            updatedFormData.nombreRecibeComision ?? "(not mapped)",
          tipoComision: updatedFormData.tipoComision ?? "(not mapped)",
          porcentaje: updatedFormData.porcentaje ?? "(not mapped)",
          montoArreglado: updatedFormData.montoArreglado ?? "(not mapped)",
        });

        // Also update context with the data
        setOrderData({
          ...orderData,
          ...updatedFormData,
        } as OrderFormData);
      } catch (err: any) {
        log.error("Error fetching contract:", err);
        setContractError(
          err?.message || "Error al cargar los datos del contrato",
        );
        showErrorAlert(
          "Error",
          "No se pudo cargar la información del contrato",
        );
      } finally {
        setIsLoadingContract(false);
      }
    };

    fetchContract();
  }, [contractId, setOrderData]);
  const { requiredErrors, isValid, getMissingRequiredFields } =
    useOrderValidation(formData, showErrors);

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

  const handleNext = async () => {
    setShowErrors(true);

    const missing = getMissingRequiredFields();

    if (Object.keys(missing).length > 0) {
      showErrorAlert("Campos obligatorios", "Complete los campos requeridos.");
      return;
    }

    if (isEdit && contractId) {
      try {
        // Construct update payload
        const updatePayload: any = {
          payment_type_id: parseInt(formData.tipoPago),
          IVA: formData.aplicaIva === "Si",
          amount: parseFloat(formData.costoViaje),
          observations: formData.comentarios,
          internal_observations: formData.observacionesInternas,
          coordinator_id: formData.coordinadorViaje
            ? parseInt(formData.coordinadorViaje)
            : undefined,
        };

        await contractsService.update(parseInt(contractId), updatePayload);

        // TODO: Implement commission update if backend supports it in the future

        showSuccessAlert("Éxito", "Datos del contrato actualizados. Ahora puede editar el viaje.");

        // Persist order data in context so the trip edit page can access it
        setOrderData(formData);
        saveToLocalStorage(formData, tripData);

        // Navigate to edit trip page
        router.push(`/dashboard/order/${contractId}/editTrip`);
      } catch (error) {
        log.error("Error updating contract:", error);
        showErrorAlert("Error", "Error al actualizar el contrato");
      }
    } else {
      log.debug("Persisting order draft before navigating to create trip", {
        formData,
      });
      setOrderData(formData);
      saveToLocalStorage(formData, tripData);
      router.push("/dashboard/createOrder/createTrip");
    }
  };
  const handleCancel = () => {
    router.push("/dashboard");
  };

  const fetchPrefillableData = useCallback(async () => {
    try {
      setIsLoadingData(true);
      const data = await referenceService.getPrefillableData();
      setPrefillableData(data);
    } catch (error) {
      log.error("Error fetching prefillable data:", error);
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
      log.error("Error saving contact:", error);
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

  // Removed local handleClientCreated as it's now in the hook

  useEffect(() => {
    const initializeForm = async () => {
      // Clear any persisted data on initial mount
      if (!isEdit) {
        clearData();
      }

      // Fetch prefillable data
      await fetchPrefillableData();
    };

    initializeForm();
  }, [isEdit]); // Run on mount and if isEdit changes

  // Set default values after prefillable data is loaded
  useEffect(() => {
    if (prefillableData && !orderData.empresa && !isEdit) {
      // Only set defaults if form is empty (no empresa selected) and not editing
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
        coordinadorNombre: porAsignarCoordinator
          ? porAsignarCoordinator.display_name
          : "",
      }));
    }
  }, [prefillableData, orderData.empresa]);

  // Also sync when formData changes
  useEffect(() => {
    log.debug("CreateOrderContent - FormData changed:", formData);
  }, [formData]);

  // Function to check if all required fields are filled
  const areAllRequiredFieldsFilled = useCallback(() => {
    return Object.keys(getMissingRequiredFields()).length === 0;
  }, [getMissingRequiredFields]);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link
            href={isEdit ? `/dashboard/order/${contractId}` : "/dashboard"}
            passHref
          >
            <button className={styles.backButton}>
              <ArrowLeftFilled color="#61636E" />
            </button>
          </Link>
          <div>
            <h1 className={styles.title}>
              {isEdit
                ? "Editar contrato de orden #" + contractId
                : "Crear contrato de orden"}
            </h1>
          </div>
        </div>
        <p style={{ color: "#dc2626", fontSize: "0.82rem", margin: "4px 0 0 0" }}>
          *Los campos marcados con un asterisco rojo son obligatorios
        </p>
        <form className={styles.form}>
          <div className={styles.placeSection}>
            <SearchableSelectComponent
              value={formData.empresa}
              selectedLabel={formData.empresaNombre}
              onChange={handleClientSelect}
              onSearch={handleClientSearch}
              onCreate={handleCreateClient}
              label="Empresa o cliente"
              placeholder="Buscar cliente..."
              required={true}
              hasError={!!mergedErrors.empresa}
              errorMessage={mergedErrors.empresa}
              createButtonText="Crear Nuevo Cliente"
              noResultsText="No se encontraron clientes"
              loadingText="Buscando..."
            />
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
              <InputComponent
                type="text"
                {...input("nombreContacto")}
                label="Nombre del contacto"
                required
                disabled={!isEditingContact}
                className={styles.input}
                hasError={!!mergedErrors.nombreContacto}
                errorMessage={mergedErrors.nombreContacto}
              />
            </div>
            <div className={styles.col}>
              <InputComponent
                type="text"
                {...input("primerApellido")}
                label="Primer apellido"
                required
                disabled={!isEditingContact}
                className={styles.input}
                hasError={!!mergedErrors.primerApellido}
                errorMessage={mergedErrors.primerApellido}
              />
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
                  required
                  placeholder=""
                  disabled={!isEditingContact}
                  className={styles.input}
                  hasError={showErrors && !!mergedErrors.telefono}
                  errorMessage={mergedErrors.telefono}
                />
              </div>
            </div>
            <div className={styles.col}>
              <Field
                label="¿Tiene WhatsApp?"
                required
                validationMessage={mergedErrors.tieneWhatsapp}
                validationState={mergedErrors.tieneWhatsapp ? "error" : "none"}
              >
                <div className={styles.radioOptions}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="whatsapp"
                      {...radio("tieneWhatsapp", "Si")}
                      disabled={!isEditingContact}
                      className={styles.radioInput}
                    />
                    Sí
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="whatsapp"
                      {...radio("tieneWhatsapp", "No")}
                      disabled={!isEditingContact}
                      className={styles.radioInput}
                    />
                    No
                  </label>
                </div>
              </Field>
            </div>
            <div className={styles.col}>
              <InputComponent
                type="email"
                {...input("correoElectronico")}
                label="Correo electrónico"
                placeholder=""
                disabled={!isEditingContact}
                className={styles.input}
                hasError={showErrors && !!mergedErrors.correoElectronico}
                errorMessage={mergedErrors.correoElectronico}
              />
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
              hasError={!!mergedErrors.tipoPago}
              errorMessage={mergedErrors.tipoPago}
              className={styles.select}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <Field
                label="¿Aplica IVA?"
                required
                validationMessage={mergedErrors.aplicaIva}
                validationState={mergedErrors.aplicaIva ? "error" : "none"}
              >
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
              </Field>
            </div>
            <div className={styles.col}>
              <InputComponent
                type="text"
                {...input("costoViaje")}
                label="Costo del viaje"
                required
                className={styles.input}
                hasError={!!mergedErrors.costoViaje}
                errorMessage={mergedErrors.costoViaje}
              />
            </div>
          </div>

          <div className={styles.section}>
            <Field
              label="¿Lleva comisión?"
              required
              validationMessage={mergedErrors.llevaComision}
              validationState={mergedErrors.llevaComision ? "error" : "none"}
            >
              <div className={styles.radioOptions}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="comision"
                    className={styles.radioInput}
                    {...radio("llevaComision", "Si")}
                  />
                  Sí
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="comision"
                    className={styles.radioInput}
                    {...radio("llevaComision", "No")}
                  />
                  No
                </label>
              </div>
            </Field>
          </div>

          {/* Conditional commission fields */}
          {formData.llevaComision === "Si" && (
            <>
              <div className={styles.section}>
                <InputComponent
                  type="text"
                  {...input("nombreRecibeComision")}
                  label="Nombre de quien recibe la comisión"
                  required
                  className={styles.input}
                  hasError={!!mergedErrors.nombreRecibeComision}
                  errorMessage={mergedErrors.nombreRecibeComision}
                />
              </div>

              <div className={styles.section}>
                <Field
                  label="Tipo de comisión"
                  required
                  validationMessage={
                    (touchedFields.has("tipoComision") && !formData.tipoComision)
                      ? "Este campo es obligatorio"
                      : mergedErrors.tipoComision
                  }
                  validationState={
                    (touchedFields.has("tipoComision") && !formData.tipoComision) || mergedErrors.tipoComision
                      ? "error"
                      : "none"
                  }
                >
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
                </Field>
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
                        required
                        placeholder="Seleccione..."
                        className={styles.input}
                      />
                    </div>
                    <div className={styles.col}>
                      <InputComponent
                        type="text"
                        {...input("nombreRecibeComision")}
                        label="Nombre de quien recibe la comisión"
                        required
                        className={styles.input}
                        hasError={!!mergedErrors.nombreRecibeComision}
                        errorMessage={mergedErrors.nombreRecibeComision}
                      />
                    </div>
                  </>
                )}
                {formData.tipoComision === "Arreglada" && (
                  <div className={styles.col}>
                    <InputComponent
                      {...input("montoArreglado")}
                      label="Monto de la comisión ($)"
                      required
                      placeholder=""
                      className={styles.input}
                      hasError={showErrors && !!mergedErrors.montoArreglado}
                      errorMessage={mergedErrors.montoArreglado}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <div className={styles.section}>
            <SelectComponent
              value={formData.coordinadorViaje}
              onChange={(e) => {
                const selectedId = e.target.value;
                const selectedCoordinator = prefillableData?.coordinators?.find(
                  (c) => c.user_id.toString() === selectedId,
                );
                setFormData((prev) => ({
                  ...prev,
                  coordinadorViaje: selectedId,
                  coordinadorNombre:
                    selectedCoordinator?.display_name ||
                    (selectedId === "POR_ASIGNAR" ? "Por asignar" : ""),
                }));
              }}
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
                {...textarea("observacionesInternas")}
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
              appearance="outline"
              className={styles.cancelButton}
            />
            <ButtonComponent
              text="Siguiente"
              onClick={handleNext}
              type="button"
              appearance="primary"
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
