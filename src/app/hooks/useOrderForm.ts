import { useState, useCallback } from "react";

export function useOrderForm<T extends Record<string, any>>(initialData: T) {
  const [formData, setFormData] = useState<T>(initialData);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showErrors, setShowErrors] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<keyof T>>(new Set());

  /**
   * CORE UPDATE
   */
  const updateField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));

      setTouchedFields((prev) => {
        const next = new Set(prev);
        next.add(field);
        return next;
      });

      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field as string];
        return copy;
      });
    },
    [],
  );

  /* =========================
     INPUT BINDING
  ========================= */

  const input = useCallback(
    <K extends keyof T>(field: K) => ({
      value: formData[field] ?? "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        updateField(field, e.target.value as T[K]),
    }),
    [formData, updateField],
  );

  /* =========================
     SELECT BINDING ✅ FIX
  ========================= */

  const select = useCallback(
    <K extends keyof T>(field: K) => ({
      value: formData[field] ?? "",
      onChange: (e: React.ChangeEvent<HTMLSelectElement>) =>
        updateField(field, e.target.value as T[K]),
    }),
    [formData, updateField],
  );

  /* =========================
     RADIO BINDING
  ========================= */

  const radio = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => ({
      checked: formData[field] === value,
      onChange: () => updateField(field, value),
    }),
    [formData, updateField],
  );

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    showErrors,
    setShowErrors,
    touchedFields,
    updateField,

    // ✅ NEW API
    input,
    select,
    radio,
  };
}
