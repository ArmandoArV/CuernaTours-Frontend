"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Input,
  Label,
  Field,
  Checkbox,
  makeStyles,
  tokens,
  shorthands,
  Select,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import {
  referenceService,
  type ClientTypeReference,
} from "@/services/api/reference.service";
import { ApiError } from "@/services/api/ApiError";
import { showSuccessAlert, showErrorAlert } from "@/app/Utils/AlertUtil";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("CreateClientModal");

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (
    clientId: number,
    clientName: string,
    contactData?: any
  ) => void;
  clientTypes: ClientTypeReference[];
}

interface ClientFormData {
  name: string;
  client_type_id: string;
  comments: string;
  contactName: string;
  first_lastname: string;
  second_lastname: string;
  country_code: string;
  phone: string;
  email: string;
  is_whatsapp_available: boolean;
  role: string;
}

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: "640px",
    width: "95vw",
    maxHeight: "90vh",
    ...shorthands.padding(0),
    display: "flex",
    flexDirection: "column",
    overflowY: "hidden",
  },
  dialogBody: {
    display: "flex",
    flexDirection: "column",
    overflowY: "hidden",
    maxHeight: "calc(90vh - 2px)",
  },
  title: {
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
    paddingBottom: tokens.spacingVerticalS,
    flexShrink: 0,
  },
  body: {
    overflowY: "auto",
    flex: 1,
    minHeight: 0,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL),
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  sectionTitle: {
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
    marginBottom: tokens.spacingVerticalXS,
  },
  row: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    "@media (max-width: 480px)": {
      flexDirection: "column",
    },
  },
  field: {
    flex: 1,
    minWidth: 0,
  },
  fieldSmall: {
    flex: "0 0 5.5rem",
    "@media (max-width: 480px)": {
      flex: "unset",
      width: "100%",
    },
  },
  actions: {
    ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalL),
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
    justifyContent: "flex-end",
    flexShrink: 0,
    "@media (max-width: 480px)": {
      flexDirection: "column-reverse",
    },
  },
  cancelButton: {
    color: "var(--Main-96781A)",
    ...shorthands.border("2px", "solid", "var(--Main-96781A)"),
    fontWeight: tokens.fontWeightSemibold,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
    fontSize: tokens.fontSizeBase200,
  },
});

const initialFormData: ClientFormData = {
  name: "",
  client_type_id: "",
  comments: "",
  contactName: "",
  first_lastname: "",
  second_lastname: "",
  country_code: "+52",
  phone: "",
  email: "",
  is_whatsapp_available: true,
  role: "",
};

export default function CreateClientModal({
  isOpen,
  onClose,
  onClientCreated,
  clientTypes,
}: CreateClientModalProps) {
  const styles = useStyles();
  const [formData, setFormData] = useState<ClientFormData>({ ...initialFormData });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof ClientFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre del cliente es requerido";
    }
    if (!formData.client_type_id) {
      newErrors.client_type_id = "El tipo de cliente es requerido";
    }
    if (!formData.contactName.trim()) {
      newErrors.contactName = "El nombre del contacto es requerido";
    }
    if (!formData.first_lastname.trim()) {
      newErrors.first_lastname = "El apellido paterno es requerido";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "El teléfono es requerido";
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = "El teléfono debe tener 10 dígitos";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El correo electrónico no es válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showErrorAlert("Campos inválidos", "Corrija los errores en el formulario");
      return;
    }

    setIsSubmitting(true);

    try {
      const contactData = {
        name: formData.contactName,
        first_lastname: formData.first_lastname,
        second_lastname: formData.second_lastname || undefined,
        country_code: formData.country_code,
        phone: formData.phone,
        email: formData.email || undefined,
        is_whatsapp_available: formData.is_whatsapp_available,
        role: formData.role || undefined,
        is_primary: true,
        comments: undefined,
      };

      const result = await referenceService.createClientWithContact({
        name: formData.name,
        client_type_id: parseInt(formData.client_type_id),
        comments: formData.comments || undefined,
        contact: contactData,
      });

      showSuccessAlert("Éxito", "Cliente creado exitosamente");
      onClientCreated(result.client.client_id, result.client.name, contactData);
      handleClose();
    } catch (error) {
      log.error("Error creating client:", error);
      if (error instanceof ApiError) {
        showErrorAlert("Error", error.message);
      } else {
        showErrorAlert("Error", "Error al crear el cliente. Por favor, intente nuevamente.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ ...initialFormData });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => { if (!data.open) handleClose(); }}>
      <DialogSurface className={styles.dialogSurface}>
        <form onSubmit={handleSubmit}>
          <DialogBody className={styles.dialogBody}>
            <DialogTitle
              className={styles.title}
              action={
                <Button
                  appearance="subtle"
                  aria-label="Cerrar"
                  icon={<Dismiss24Regular />}
                  onClick={handleClose}
                  disabled={isSubmitting}
                />
              }
            >
              Crear Nuevo Cliente
            </DialogTitle>

            <DialogContent className={styles.body}>
              <div className={styles.form}>
                {/* Client Information */}
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Información del Cliente</div>

                  <Field
                    label="Nombre del Cliente / Empresa"
                    required
                    validationMessage={errors.name}
                    validationState={errors.name ? "error" : "none"}
                  >
                    <Input
                      value={formData.name}
                      onChange={(_, data) => updateField("name", data.value)}
                      placeholder="Ej: Empresa XYZ"
                      disabled={isSubmitting}
                    />
                  </Field>

                  <Field
                    label="Tipo de Cliente"
                    required
                    validationMessage={errors.client_type_id}
                    validationState={errors.client_type_id ? "error" : "none"}
                  >
                    <Select
                      value={formData.client_type_id}
                      onChange={(_, data) => updateField("client_type_id", data.value)}
                      disabled={isSubmitting}
                    >
                      <option value="">Seleccione tipo de cliente</option>
                      {clientTypes.map((type) => (
                        <option key={type.client_type_id} value={type.client_type_id.toString()}>
                          {type.name}
                        </option>
                      ))}
                    </Select>
                  </Field>

                  <Field label="Comentarios">
                    <Input
                      value={formData.comments}
                      onChange={(_, data) => updateField("comments", data.value)}
                      placeholder="Notas adicionales (opcional)"
                      disabled={isSubmitting}
                    />
                  </Field>
                </div>

                {/* Contact Information */}
                <div className={styles.section}>
                  <div className={styles.sectionTitle}>Información del Contacto Principal</div>

                  <div className={styles.row}>
                    <Field
                      className={styles.field}
                      label="Nombre"
                      required
                      validationMessage={errors.contactName}
                      validationState={errors.contactName ? "error" : "none"}
                    >
                      <Input
                        value={formData.contactName}
                        onChange={(_, data) => updateField("contactName", data.value)}
                        placeholder="Nombre"
                        disabled={isSubmitting}
                      />
                    </Field>

                    <Field
                      className={styles.field}
                      label="Apellido Paterno"
                      required
                      validationMessage={errors.first_lastname}
                      validationState={errors.first_lastname ? "error" : "none"}
                    >
                      <Input
                        value={formData.first_lastname}
                        onChange={(_, data) => updateField("first_lastname", data.value)}
                        placeholder="Apellido Paterno"
                        disabled={isSubmitting}
                      />
                    </Field>
                  </div>

                  <Field label="Apellido Materno">
                    <Input
                      value={formData.second_lastname}
                      onChange={(_, data) => updateField("second_lastname", data.value)}
                      placeholder="Apellido Materno (opcional)"
                      disabled={isSubmitting}
                    />
                  </Field>

                  <div className={styles.row}>
                    <Field className={styles.fieldSmall} label="Código">
                      <Input
                        value={formData.country_code}
                        onChange={(_, data) => updateField("country_code", data.value)}
                        placeholder="+52"
                        disabled={isSubmitting}
                      />
                    </Field>

                    <Field
                      className={styles.field}
                      label="Teléfono"
                      required
                      validationMessage={errors.phone}
                      validationState={errors.phone ? "error" : "none"}
                    >
                      <Input
                        value={formData.phone}
                        onChange={(_, data) => updateField("phone", data.value.replace(/\D/g, ""))}
                        placeholder="0000000000"
                        disabled={isSubmitting}
                      />
                    </Field>
                  </div>

                  <Field
                    label="Correo Electrónico"
                    validationMessage={errors.email}
                    validationState={errors.email ? "error" : "none"}
                  >
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(_, data) => updateField("email", data.value)}
                      placeholder="correo@ejemplo.com (opcional)"
                      disabled={isSubmitting}
                    />
                  </Field>

                  <Field label="Rol/Puesto">
                    <Input
                      value={formData.role}
                      onChange={(_, data) => updateField("role", data.value)}
                      placeholder="Ej: Gerente (opcional)"
                      disabled={isSubmitting}
                    />
                  </Field>

                  <Checkbox
                    checked={formData.is_whatsapp_available}
                    onChange={(_, data) => updateField("is_whatsapp_available", !!data.checked)}
                    disabled={isSubmitting}
                    label="¿Tiene WhatsApp?"
                  />
                </div>
              </div>
            </DialogContent>

            <DialogActions className={styles.actions}>
              <Button
                appearance="outline"
                className={styles.cancelButton}
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                appearance="primary"
                type="submit"
                disabled={isSubmitting}
                style={{ backgroundColor: "var(--Main-96781A)", borderColor: "var(--Main-96781A)" }}
              >
                {isSubmitting ? "Creando..." : "Crear"}
              </Button>
            </DialogActions>
          </DialogBody>
        </form>
      </DialogSurface>
    </Dialog>
  );
}
