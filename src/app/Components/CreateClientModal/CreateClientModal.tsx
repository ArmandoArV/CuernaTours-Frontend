"use client";

import React, { useState } from "react";
import styles from "./CreateClientModal.module.css";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import InputComponent from "../InputComponent/InputComponent";
import SelectComponent from "../SelectComponent/SelectComponent";
import {
  referenceService,
  type ClientTypeReference,
} from "@/services/api/reference.service";
import { ApiError } from "@/services/api/ApiError";
import { showSuccessAlert, showErrorAlert } from "@/app/Utils/AlertUtil";

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
  // Contact information
  contactName: string;
  first_lastname: string;
  second_lastname: string;
  country_code: string;
  phone: string;
  email: string;
  is_whatsapp_available: boolean;
  role: string;
}

export default function CreateClientModal({
  isOpen,
  onClose,
  onClientCreated,
  clientTypes,
}: CreateClientModalProps) {
  const [formData, setFormData] = useState<ClientFormData>({
    name: "",
    client_type_id: "",
    comments: "",
    contactName: "",
    first_lastname: "",
    second_lastname: "",
    country_code: "+52",
    phone: "",
    email: "",
    is_whatsapp_available: false,
    role: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

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
      showErrorAlert(
        "Campos inválidos",
        "Por favor, corrija los errores en el formulario"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Create client
      const newClient = await referenceService.createClient({
        name: formData.name,
        client_type_id: parseInt(formData.client_type_id),
        comments: formData.comments || undefined,
      });

      // Create primary contact for the client
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

      await referenceService.createClientContact(
        newClient.client_id,
        contactData
      );

      showSuccessAlert("Éxito", "Cliente creado exitosamente");

      // Pass back the client info and contact data for auto-fill
      onClientCreated(newClient.client_id, newClient.name, contactData);

      // Reset form
      setFormData({
        name: "",
        client_type_id: "",
        comments: "",
        contactName: "",
        first_lastname: "",
        second_lastname: "",
        country_code: "+52",
        phone: "",
        email: "",
        is_whatsapp_available: false,
        role: "",
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error("Error creating client:", error);
      if (error instanceof ApiError) {
        showErrorAlert("Error", error.message);
      } else {
        showErrorAlert(
          "Error",
          "Error al crear el cliente. Por favor, intente nuevamente."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      client_type_id: "",
      comments: "",
      contactName: "",
      first_lastname: "",
      second_lastname: "",
      country_code: "+52",
      phone: "",
      email: "",
      is_whatsapp_available: false,
      role: "",
    });
    setErrors({});
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button
          className={styles.closeButton}
          onClick={handleClose}
          disabled={isSubmitting}
        >
          ×
        </button>

        <h2 className={styles.modalTitle}>Crear Nuevo Cliente</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Información del Cliente</h3>

            <InputComponent
              type="text"
              label="Nombre del Cliente / Empresa"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ej: Empresa XYZ"
              disabled={isSubmitting}
              containerClassName={errors.name ? styles.fieldError : ""}
            />
            {errors.name && (
              <span className={styles.errorText}>{errors.name}</span>
            )}

            <SelectComponent
              label="Tipo de Cliente"
              value={formData.client_type_id}
              onChange={(e) =>
                setFormData({ ...formData, client_type_id: e.target.value })
              }
              options={clientTypes.map((type) => ({
                value: type.client_type_id.toString(),
                label: type.name,
              }))}
              placeholder="Seleccione tipo de cliente"
              disabled={isSubmitting}
              required
              containerClassName={
                errors.client_type_id ? styles.fieldError : ""
              }
            />
            {errors.client_type_id && (
              <span className={styles.errorText}>{errors.client_type_id}</span>
            )}

            <InputComponent
              type="text"
              label="Comentarios"
              value={formData.comments}
              onChange={(e) =>
                setFormData({ ...formData, comments: e.target.value })
              }
              placeholder="Notas adicionales (opcional)"
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              Información del Contacto Principal
            </h3>

            <div className={styles.row}>
              <div className={styles.field}>
                <InputComponent
                  type="text"
                  label="Nombre"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  placeholder="Nombre"
                  disabled={isSubmitting}
                  containerClassName={
                    errors.contactName ? styles.fieldError : ""
                  }
                />
                {errors.contactName && (
                  <span className={styles.errorText}>{errors.contactName}</span>
                )}
              </div>

              <div className={styles.field}>
                <InputComponent
                  type="text"
                  label="Apellido Paterno"
                  value={formData.first_lastname}
                  onChange={(e) =>
                    setFormData({ ...formData, first_lastname: e.target.value })
                  }
                  placeholder="Apellido Paterno"
                  disabled={isSubmitting}
                  containerClassName={
                    errors.first_lastname ? styles.fieldError : ""
                  }
                />
                {errors.first_lastname && (
                  <span className={styles.errorText}>
                    {errors.first_lastname}
                  </span>
                )}
              </div>
            </div>

            <InputComponent
              type="text"
              label="Apellido Materno"
              value={formData.second_lastname}
              onChange={(e) =>
                setFormData({ ...formData, second_lastname: e.target.value })
              }
              placeholder="Apellido Materno (opcional)"
              disabled={isSubmitting}
            />

            <div className={styles.row}>
              <div className={styles.fieldSmall}>
                <InputComponent
                  type="text"
                  label="Código"
                  value={formData.country_code}
                  onChange={(e) =>
                    setFormData({ ...formData, country_code: e.target.value })
                  }
                  placeholder="+52"
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.field}>
                <InputComponent
                  type="text"
                  label="Teléfono"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="0000000000"
                  disabled={isSubmitting}
                  containerClassName={errors.phone ? styles.fieldError : ""}
                />
                {errors.phone && (
                  <span className={styles.errorText}>{errors.phone}</span>
                )}
              </div>
            </div>

            <InputComponent
              type="email"
              label="Correo Electrónico"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="correo@ejemplo.com (opcional)"
              disabled={isSubmitting}
              containerClassName={errors.email ? styles.fieldError : ""}
            />
            {errors.email && (
              <span className={styles.errorText}>{errors.email}</span>
            )}

            <InputComponent
              type="text"
              label="Rol/Puesto"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              placeholder="Ej: Gerente (opcional)"
              disabled={isSubmitting}
            />

            <div className={styles.checkboxGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.is_whatsapp_available}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_whatsapp_available: e.target.checked,
                    })
                  }
                  disabled={isSubmitting}
                />
                <span>¿Tiene WhatsApp?</span>
              </label>
            </div>
          </div>

          <div className={styles.modalActions}>
            <ButtonComponent
              type="button"
              onClick={handleClose}
              text="Cancelar"
              disabled={isSubmitting}
              className={styles.cancelButton}
            />
            <ButtonComponent
              type="submit"
              text={isSubmitting ? "Creando..." : "Crear Cliente"}
              disabled={isSubmitting}
              className={styles.submitButton}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
