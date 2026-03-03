import { useState, useCallback } from "react";
import { showSuccessAlert } from "@/app/Utils/AlertUtil";

/** Address field suffixes shared between origen and destino */
const ADDRESS_SUFFIXES = [
  "NombreLugar",
  "Calle",
  "Numero",
  "Colonia",
  "CodigoPostal",
  "Ciudad",
  "Estado",
] as const;

type AddressSuffix = (typeof ADDRESS_SUFFIXES)[number];

interface UseAddressEditorOptions<T extends Record<string, any>> {
  /** Field prefix, e.g. "origen" or "destino" */
  prefix: string;
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  /** Start in editing mode (default: true for new forms) */
  initialEditing?: boolean;
}

interface UseAddressEditorReturn {
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  handleEdit: () => void;
  handleSave: () => void;
  handleCancel: () => void;
  /** Snapshot from the last save/load — used to detect "has original" */
  hasOriginal: boolean;
  /** Set original data externally (e.g. when pre-filling from API) */
  setOriginalSnapshot: (data: Record<string, any>) => void;
}

/**
 * Reusable hook for edit/save/cancel of an address block
 * (origen or destino) inside the trip form.
 */
export function useAddressEditor<T extends Record<string, any>>({
  prefix,
  formData,
  setFormData,
  initialEditing = true,
}: UseAddressEditorOptions<T>): UseAddressEditorReturn {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [originalData, setOriginalData] = useState<Partial<T> | null>(null);

  const buildSnapshot = useCallback((): Partial<T> => {
    const snapshot: Record<string, any> = {};
    for (const suffix of ADDRESS_SUFFIXES) {
      const key = `${prefix}${suffix}`;
      snapshot[key] = (formData as any)[key];
    }
    return snapshot as Partial<T>;
  }, [prefix, formData]);

  const handleEdit = useCallback(() => {
    if (!originalData) {
      setOriginalData(buildSnapshot());
    }
    setIsEditing(true);

    // Clear numeric ID so backend receives address fields instead
    const idKey = `${prefix}NombreLugar` as keyof T;
    const currentId = formData[idKey];
    if (currentId && !isNaN(Number(currentId))) {
      setFormData((prev) => ({ ...prev, [idKey]: "" }));
    }
  }, [originalData, buildSnapshot, prefix, formData, setFormData]);

  const handleSave = useCallback(() => {
    setOriginalData(buildSnapshot());
    showSuccessAlert("Éxito", "Cambios guardados localmente");
    setIsEditing(false);
  }, [buildSnapshot]);

  const handleCancel = useCallback(() => {
    if (originalData) {
      setFormData((prev) => ({ ...prev, ...originalData }));
    }
    setIsEditing(false);
  }, [originalData, setFormData]);

  const setOriginalSnapshot = useCallback(
    (data: Record<string, any>) => {
      const snapshot: Record<string, any> = {};
      for (const suffix of ADDRESS_SUFFIXES) {
        const key = `${prefix}${suffix}`;
        snapshot[key] = data[key];
      }
      setOriginalData(snapshot as Partial<T>);
      setIsEditing(false);
    },
    [prefix],
  );

  return {
    isEditing,
    setIsEditing,
    handleEdit,
    handleSave,
    handleCancel,
    hasOriginal: originalData !== null,
    setOriginalSnapshot,
  };
}
