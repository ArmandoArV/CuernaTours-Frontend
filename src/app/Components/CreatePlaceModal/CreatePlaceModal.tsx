'use client';

import React, { useState } from 'react';
import styles from './CreatePlaceModal.module.css';
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogBody,
  DialogContent,
  DialogActions,
  Button,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import ButtonComponent from '../ButtonComponent/ButtonComponent';
import InputComponent from '../InputComponent/InputComponent';
import { referenceService } from '@/services/api/reference.service';
import { ApiError } from '@/services/api/ApiError';
import { showSuccessAlert, showErrorAlert } from '@/app/Utils/AlertUtil';
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("CreatePlaceModal");

interface CreatePlaceModalProps{
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
  should_save: boolean;
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
    should_save: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del lugar es requerido';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'La calle es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();

    if (!validateForm()) {
      showErrorAlert('Error de validación', 'Corrija los errores en el formulario');
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

      showSuccessAlert('Listo', `El lugar "${newPlace.name}" ha sido creado exitosamente.`);
      
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
        should_save: true,
        annotations: '',
      });
      setErrors({});
      onClose();
    } catch (error) {
      log.error('Error creating place:', error);
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
      should_save: true,
      annotations: '',
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => { if (!data.open) handleClose(); }}>
      <DialogSurface style={{ maxWidth: "45rem", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
        <DialogBody>
          <DialogTitle
            action={
              <Button
                appearance="subtle"
                aria-label="close"
                icon={<Dismiss24Regular />}
                onClick={handleClose}
                disabled={isSubmitting}
              />
            }
          >
            Crear Nuevo Lugar
          </DialogTitle>
          <DialogContent>
            <form onSubmit={handleSubmit} className={styles.form} id="create-place-form">
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Información del Lugar</h3>
                
                <InputComponent
                  type="text"
                  label="Nombre del Lugar"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Hotel Marriott, Aeropuerto Internacional, etc."
                  disabled={isSubmitting}
                  hasError={!!errors.name}
                  errorMessage={errors.name}
                />
              </div>

              <div className={styles.section}>
                <h3 className={styles.sectionTitle}>Dirección</h3>
                
                <div className={styles.rowAddress}>
                  <div className={styles.fieldLarge}>
                    <InputComponent
                      type="text"
                      label="Calle"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Nombre de la calle"
                      disabled={isSubmitting}
                      hasError={!!errors.address}
                      errorMessage={errors.address}
                    />
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
                  placeholder="Colonia"
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
                    />
                  </div>

                  <div className={styles.field}>
                    <InputComponent
                      type="text"
                      label="Estado"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Estado"
                      disabled={isSubmitting}
                    />
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
                <div className={styles.checkboxGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.should_save}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          should_save: e.target.checked,
                        })
                      }
                      disabled={isSubmitting}
                    />
                    <span>Guardar este lugar para uso futuro</span>
                  </label>
                </div>
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
            </form>
          </DialogContent>
          <DialogActions>
            <ButtonComponent
              type="button"
              onClick={handleClose}
              text="Cancelar"
              disabled={isSubmitting}
              className={styles.cancelButton}
            />
            <ButtonComponent
              type="submit"
              text={isSubmitting ? 'Creando...' : 'Crear'}
              disabled={isSubmitting}
              className={styles.submitButton}
              onClick={handleSubmit}
            />
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
