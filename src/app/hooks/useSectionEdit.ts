import { useState, useCallback } from "react";

/**
 * Hook to manage the editing state of a section within a larger form.
 * It handles entering edit mode, saving changes (and committing them),
 * and cancelling edits (reverting to original data).
 */
export function useSectionEdit<T>(
  initialData: T,
  onSave?: (data: T) => Promise<void> | void
) {
  const [isEditing, setIsEditing] = useState(false);
  const [data, setData] = useState<T>(initialData);
  const [originalData, setOriginalData] = useState<T>(initialData);

  // Sync data if initialData changes from parent (e.g. API load)
  // BE CAREFUL: This might overwrite local edits if not handled correctly.
  // Usually, we only want to sync if we are NOT editing.

  const startEdit = useCallback(() => {
    setOriginalData(data);
    setIsEditing(true);
  }, [data]);

  const cancelEdit = useCallback(() => {
    setData(originalData);
    setIsEditing(false);
  }, [originalData]);

  const saveEdit = useCallback(async () => {
    if (onSave) {
      await onSave(data);
    }
    // Commit the changes by updating originalData to current data
    setOriginalData(data);
    setIsEditing(false);
  }, [data, onSave]);

  const updateField = useCallback((field: keyof T, value: any) => {
    setData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  return {
    isEditing,
    data,
    setData,
    startEdit,
    cancelEdit,
    saveEdit,
    updateField,
  };
}
