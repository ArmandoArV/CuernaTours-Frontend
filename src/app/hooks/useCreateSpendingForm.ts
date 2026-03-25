"use client";
import { useState } from "react";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 5;

export interface FileWithPreview {
  file: File;
}

export function useCreateSpendingForm() {
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [contractId, setContractId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!category) newErrors.category = "La categoría es obligatoria";
    if (category === "otro" && !customCategory.trim())
      newErrors.customCategory = "Especifica la categoría";
    if (!amount || parseFloat(amount) <= 0)
      newErrors.amount = "El monto debe ser mayor a 0";
    if (!contractId)
      newErrors.contractId = "El servicio es obligatorio";
    if (files.length === 0)
      newErrors.files = "Debes adjuntar al menos un archivo";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addFiles = (selected: FileList | null) => {
    if (!selected) return;

    const selectedFiles = Array.from(selected);
    const newErrors: Record<string, string> = {};

    if (files.length + selectedFiles.length > MAX_FILES) {
      newErrors.files = `Máximo ${MAX_FILES} archivos permitidos`;
      setErrors(newErrors);
      return;
    }

    const validFiles: FileWithPreview[] = [];

    for (const file of selectedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        newErrors.files = `El archivo ${file.name} excede 5MB`;
        continue;
      }
      validFiles.push({ file });
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setFiles((prev) => [...prev, ...validFiles]);
    setErrors((prev) => ({ ...prev, files: "" }));
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return {
    category,
    setCategory,
    customCategory,
    setCustomCategory,
    amount,
    setAmount,
    description,
    setDescription,
    contractId,
    setContractId,
    vehicleId,
    setVehicleId,
    files,
    errors,
    validate,
    addFiles,
    removeFile,
  };
}
