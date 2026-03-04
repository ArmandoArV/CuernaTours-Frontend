"use client";
import { useState } from "react";
import {
  Button,
  Field,
  Input,
  Textarea,
  Dropdown,
  Option,
  Text,
  Spinner,
} from "@fluentui/react-components";
import { AddFilled, DeleteFilled } from "@fluentui/react-icons";
import { useRouter } from "next/navigation";
import {
  showSuccessAlert,
  showErrorAlert,
  showConfirmAlert,
} from "@/app/Utils/AlertUtil";
import styles from "./CreateSpendingContent.module.css";
import { useCreateSpendingForm } from "@/app/hooks/useCreateSpendingForm";
import { spendingsService } from "@/services/api/spendings.service";
import { useDriverId } from "@/app/hooks/useDriverId";
import {
  NETWORK_ERROR_MESSAGE,
  SERVER_ERROR_MESSAGE,
} from "@/config/api.config";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("CreateSpendingContent");

const SPENDING_CATEGORIES= [
  { value: "gas", label: "Gasolina" },
  { value: "casetas", label: "Casetas" },
  { value: "hotel", label: "Hotel" },
  { value: "estacionamiento", label: "Estacionamiento" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "TAG", label: "TAG" },
  { value: "otro", label: "Otro" },
];

export default function CreateSpendingContent({ backRoute = "/chofer/gastos" }: { backRoute?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { driverId, error: driverError, loading: driverLoading } = useDriverId();

  const {
    category,
    setCategory,
    customCategory,
    setCustomCategory,
    amount,
    setAmount,
    description,
    setDescription,
    files,
    errors,
    validate,
    addFiles,
    removeFile,
  } = useCreateSpendingForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    showConfirmAlert(
      "Confirmar Registro",
      "¿Deseas registrar este gasto?",
      "Registrar",
      async () => {
        setLoading(true);

        try {
          if (!driverId) {
            showErrorAlert("Error", "No se pudo identificar al usuario");
            return;
          }

          const payload = {
            spending_amount: Number(amount),
            spending_type: category === "otro" ? customCategory : category,
            driver_id: driverId,
            comments: description,
          };

          // 1️⃣ Create spending
          const createdSpending = await spendingsService.create(payload);

          // 2️⃣ Upload files (controlled sequential upload)
          for (const fileObj of files) {
            await spendingsService.uploadFile(
              createdSpending.spending_id,
              fileObj.file,
            );
          }

          showSuccessAlert(
            "Gasto Registrado",
            "El gasto fue registrado correctamente",
            () => router.push(backRoute),
          );
        } catch (error: any) {
          log.error("Spending creation error:", error);

          const errorMessage =
            error?.message || NETWORK_ERROR_MESSAGE || SERVER_ERROR_MESSAGE;

          showErrorAlert("Error al registrar", errorMessage);
        } finally {
          setLoading(false);
        }
      },
    );
  };
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Registrar Gasto</h1>
        <p className={styles.subtitle}>
          Completa todos los campos para registrar tu gasto
        </p>
      </div>

      {apiError && (
        <div className={styles.errorAlert}>
          <p>{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* ========================= */}
        {/* Información del Gasto */}
        {/* ========================= */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Información del Gasto</h2>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <Field
                label="Categoría"
                required
                validationMessage={errors.category}
              >
                <Dropdown
                  value={category}
                  placeholder="Selecciona una categoría"
                  onOptionSelect={(_, data) =>
                    setCategory(String(data.optionValue))
                  }
                >
                  {SPENDING_CATEGORIES.map((cat) => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            </div>

            {category === "otro" && (
              <div className={styles.formField}>
                <Field
                  label='Categoría "Otro"'
                  validationMessage={errors.customCategory}
                >
                  <Input
                    value={customCategory}
                    onChange={(_, data) => setCustomCategory(data.value)}
                  />
                </Field>
              </div>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <Field label="Monto ($)" validationMessage={errors.amount}>
                <Input
                  type="number"
                  value={amount}
                  onChange={(_, data) => setAmount(data.value)}
                />
              </Field>
            </div>
          </div>

          <div className={styles.formFieldFull}>
            <Field
              label="Descripción o Comentarios"
              required
              validationMessage={errors.description}
            >
              <Textarea
                value={description}
                onChange={(_, data) => setDescription(data.value)}
                rows={4}
              />
            </Field>
          </div>
        </div>

        {/* ========================= */}
        {/* Comprobantes */}
        {/* ========================= */}
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Comprobantes</h2>
          <p className={styles.helpText}>
            Adjunta los comprobantes del gasto (máximo 5 archivos de 5MB cada
            uno)
          </p>

          <div className={styles.fileDropzone}>
            <input
              type="file"
              id="fileInput"
              multiple
              accept="image/*,application/pdf"
              onChange={(e) => addFiles(e.target.files)}
              className={styles.fileInput}
            />

            <label htmlFor="fileInput" className={styles.fileLabel}>
              <AddFilled className={styles.uploadIcon} />
              <span>Haz clic o arrastra archivos aquí</span>
              <span className={styles.fileLabelSmall}>
                Máximo 5 archivos de 5MB (imágenes o PDF)
              </span>
            </label>
          </div>

          {errors.files && (
            <span className={styles.errorText}>{errors.files}</span>
          )}

          {files.length > 0 && (
            <div className={styles.fileList}>
              {files.map((fileObj, index) => (
                <div key={index} className={styles.fileItem}>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName}>{fileObj.file.name}</span>
                    <span className={styles.fileSize}>
                      {(fileObj.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>

                  <Button
                    appearance="subtle"
                    icon={<DeleteFilled />}
                    onClick={() => removeFile(index)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========================= */}
        {/* Actions */}
        {/* ========================= */}
        <div className={styles.formActions}>
          <Button
            appearance="secondary"
            onClick={() => router.back()}
            disabled={loading}
            className={styles.cancelButton}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={loading}
            className={styles.submitButton}
            style={{
              backgroundColor: "var(--Main-96781A, #96781a)",
              borderColor: "var(--Main-96781A, #96781a)",
              color: "#ffffff",
            }}
          >
            {loading ? <Spinner size="tiny" /> : "Guardar Gasto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
