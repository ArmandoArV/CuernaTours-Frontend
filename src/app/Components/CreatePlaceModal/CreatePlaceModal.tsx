'use client';

import React, { useState } from 'react';
import styles from './CreatePlaceModal.module.css';
import ButtonComponent from '../ButtonComponent/ButtonComponent';
import InputComponent from '../InputComponent/InputComponent';
import { referenceService } from '@/services/api/reference.service';
import { ApiError } from '@/services/api/ApiError';
import { showSuccessAlert, showErrorAlert } from '@/app/Utils/AlertUtil';

interface CreatePlaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaceCreated: (placeId: number, placeName: string, placeData?: any) => void;
}

interface PlaceFormData {
  name: string;
  address: string;
  number: string;
  colonia: string;
  city: string;
  state: string;
  zip_code: string;
  annotations: string;
}

export default function CreatePlaceModal({
  isOpen,
  onClose,
  onPlaceCreated,
}: CreatePlaceModalProps) {
  const [formData, setFormData] = useState<PlaceFormData>({
    name: '',
    address: '',
    number: '',
    colonia: '',
    city: '',
    state: '',
    zip_code: '',
    annotations: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del lugar es requerido';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La calle es requerida';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'El estado es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showErrorAlert('Error de validación', 'Por favor, corrija los errores en el formulario');
      return;
    }

    setIsSubmitting(true);

    try {
      const newPlace = await referenceService.createPlace({
        name: formData.name,
        address: formData.address,
        number: formData.number || undefined,
        colonia: formData.colonia || undefined,
        city: formData.city,
        state: formData.state,
        zip_code: formData.zip_code || undefined,
        annotations: formData.annotations || undefined,
      });

      showSuccessAlert('Éxito', 'Lugar creado exitosamente');
      
      // Pass back the place info for auto-fill
      onPlaceCreated(newPlace.place_id, newPlace.name, formData);
      
      // Reset form
      setFormData({
        name: '',
        address: '',
        number: '',
        colonia: '',
        city: '',
        state: '',
        zip_code: '',
        annotations: '',
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating place:', error);
      if (error instanceof ApiError) {
        showErrorAlert('Error', error.message);
      } else {
        showErrorAlert('Error', 'Error al crear el lugar. Por favor, intente nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      address: '',
      number: '',
      colonia: '',
      city: '',
      state: '',
      zip_code: '',
      annotations: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={handleClose} disabled={isSubmitting}>
          ×
        </button>

        <h2 className={styles.modalTitle}>Crear Nuevo Lugar</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Información del Lugar</h3>
            
            <InputComponent
              type="text"
              label="Nombre del Lugar"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Hotel Marriott, Aeropuerto Internacional, etc."
              disabled={isSubmitting}
              containerClassName={errors.name ? styles.fieldError : ''}
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Dirección</h3>
            
            <div className={styles.row}>
              <div className={styles.fieldLarge}>
                <InputComponent
                  type="text"
                  label="Calle"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Nombre de la calle"
                  disabled={isSubmitting}
                  containerClassName={errors.address ? styles.fieldError : ''}
                />
                {errors.address && <span className={styles.errorText}>{errors.address}</span>}
              </div>

              <div className={styles.fieldSmall}>
                <InputComponent
                  type="text"
                  label="Número"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="Núm."
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <InputComponent
              type="text"
              label="Colonia"
              value={formData.colonia}
              onChange={(e) => setFormData({ ...formData, colonia: e.target.value })}
              placeholder="Colonia o vecindario"
              disabled={isSubmitting}
            />

            <div className={styles.row}>
              <div className={styles.field}>
                <InputComponent
                  type="text"
                  label="Ciudad"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ciudad"
                  disabled={isSubmitting}
                  containerClassName={errors.city ? styles.fieldError : ''}
                />
                {errors.city && <span className={styles.errorText}>{errors.city}</span>}
              </div>

              <div className={styles.field}>
                <InputComponent
                  type="text"
                  label="Estado"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Estado"
                  disabled={isSubmitting}
                  containerClassName={errors.state ? styles.fieldError : ''}
                />
                {errors.state && <span className={styles.errorText}>{errors.state}</span>}
              </div>
            </div>

            <InputComponent
              type="text"
              label="Código Postal"
              value={formData.zip_code}
              onChange={(e) => setFormData({ ...formData, zip_code: e.target.value.replace(/\D/g, '') })}
              placeholder="00000"
              disabled={isSubmitting}
            />
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Notas Adicionales</h3>
            
            <InputComponent
              type="text"
              label="Anotaciones"
              value={formData.annotations}
              onChange={(e) => setFormData({ ...formData, annotations: e.target.value })}
              placeholder="Referencias, instrucciones especiales, etc. (opcional)"
              disabled={isSubmitting}
            />
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
              text={isSubmitting ? 'Creando...' : 'Crear Lugar'}
              disabled={isSubmitting}
              className={styles.submitButton}
            />
          </div>
        </form>
      </div>
    </div>
  );
}
