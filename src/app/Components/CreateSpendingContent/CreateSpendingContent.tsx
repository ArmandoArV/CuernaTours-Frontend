"use client";
import { useState } from "react";
import SelectComponent from "@/app/Components/SelectComponent/SelectComponent";
import InputComponent from "@/app/Components/InputComponent/InputComponent";
import ButtonComponent from "@/app/Components/ButtonComponent/ButtonComponent";
import { AddFilled, DeleteFilled } from "@fluentui/react-icons";
import { ApiError } from "@/services/api";
import { useRouter } from "next/navigation";
import styles from "./CreateSpendingContent.module.css";

const SPENDING_CATEGORIES = [
  { value: "combustible", label: "Combustible" },
  { value: "casetas", label: "Casetas" },
  { value: "alimentacion", label: "Alimentación" },
  { value: "estacionamiento", label: "Estacionamiento" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "otro", label: "Otro" },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;

interface FileWithPreview {
  file: File;
  preview?: string;
}

export default function CreateSpendingContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form fields
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileWithPreview[]>([]);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!category) {
      newErrors.category = "La categoría es obligatoria";
    }

    if (category === "otro" && !customCategory.trim()) {
      newErrors.customCategory = "Especifica la categoría";
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "El monto debe ser mayor a 0";
    }

    if (!description.trim()) {
      newErrors.description = "La descripción es obligatoria";
    }

    if (files.length === 0) {
      newErrors.files = "Debes adjuntar al menos un archivo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newErrors: Record<string, string> = {};

    if (files.length + selectedFiles.length > MAX_FILES) {
      newErrors.files = `Máximo ${MAX_FILES} archivos permitidos`;
      setErrors(newErrors);
      return;
    }

    const validFiles: FileWithPreview[] = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        newErrors.files = `El archivo ${file.name} excede el tamaño máximo de 5MB`;
        continue;
      }

      validFiles.push({ file });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setFiles([...files, ...validFiles]);
      setErrors({ ...errors, files: "" });
    }

    // Reset input
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    if (newFiles.length === 0) {
      setErrors({ ...errors, files: "Debes adjuntar al menos un archivo" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("category", category === "otro" ? customCategory : category);
      formData.append("amount", amount);
      formData.append("description", description);
      
      files.forEach((fileObj, index) => {
        formData.append(`files`, fileObj.file);
      });

      // TODO: Replace with actual API call
      // await spendingsService.create(formData);
      
      console.log("Gasto creado:", {
        category: category === "otro" ? customCategory : category,
        amount,
        description,
        fileCount: files.length,
      });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect back to driver dashboard
      router.push("/chofer/gastos");
    } catch (err) {
      console.error("Error creating spending:", err);
      setError(err instanceof ApiError ? err.message : "Error al crear el gasto");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Registrar Gasto</h1>
        <p className={styles.subtitle}>Completa todos los campos para registrar tu gasto</p>
      </div>

      {error && (
        <div className={styles.errorAlert}>
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Información del Gasto</h2>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <SelectComponent
                label="Categoría"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setErrors({ ...errors, category: "" });
                  if (e.target.value !== "otro") {
                    setCustomCategory("");
                    setErrors({ ...errors, customCategory: "" });
                  }
                }}
                options={SPENDING_CATEGORIES}
                placeholder="Selecciona una categoría"
                required
                id="category"
              />
              {errors.category && <span className={styles.errorText}>{errors.category}</span>}
            </div>

            {category === "otro" && (
              <div className={styles.formField}>
                <InputComponent
                  label='Categoría "Otro"'
                  type="text"
                  value={customCategory}
                  onChange={(e) => {
                    setCustomCategory(e.target.value);
                    setErrors({ ...errors, customCategory: "" });
                  }}
                  placeholder="Especifica la categoría"
                  id="customCategory"
                />
                {errors.customCategory && (
                  <span className={styles.errorText}>{errors.customCategory}</span>
                )}
              </div>
            )}
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <InputComponent
                label="Monto ($)"
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrors({ ...errors, amount: "" });
                }}
                placeholder="0.00"
                id="amount"
              />
              {errors.amount && <span className={styles.errorText}>{errors.amount}</span>}
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formFieldFull}>
              <label htmlFor="description" className={styles.label}>
                Descripción o Comentarios <span className={styles.required}>*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrors({ ...errors, description: "" });
                }}
                placeholder="Describe el gasto realizado..."
                className={styles.textarea}
                rows={4}
              />
              {errors.description && (
                <span className={styles.errorText}>{errors.description}</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.formSection}>
          <h2 className={styles.sectionTitle}>Comprobantes</h2>
          <p className={styles.helpText}>
            Adjunta los comprobantes del gasto (máximo 5 archivos de 5MB cada uno)
          </p>

          <div className={styles.fileDropzone}>
            <input
              type="file"
              id="fileInput"
              multiple
              accept="image/*,application/pdf"
              onChange={handleFileChange}
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

          {errors.files && <span className={styles.errorText}>{errors.files}</span>}

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
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className={styles.removeButton}
                    aria-label="Eliminar archivo"
                  >
                    <DeleteFilled />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.formActions}>
          <ButtonComponent
            text="Cancelar"
            onClick={handleCancel}
            type="button"
            className={styles.cancelButton}
            disabled={loading}
          />
          <ButtonComponent
            text={loading ? "Guardando..." : "Guardar Gasto"}
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          />
        </div>
      </form>
    </div>
  );
}
