import { useState, useCallback, useRef, useEffect } from "react";

export interface UnitTypeSelection {
  id: string;
  vehicleTypeId: string;
  quantity: number;
}

export interface UnitAssignment {
  id: string;
  vehicleTypeId: string;
  vehicleTypeName: string;
  driverId: string;
  vehicleId: string;
  notes: string;
}

export function useUnidades() {
  const [typeSelections, setTypeSelections] = useState<UnitTypeSelection[]>([
    { id: Date.now().toString(), vehicleTypeId: "", quantity: 1 },
  ]);
  const [assignments, setAssignments] = useState<UnitAssignment[]>([]);
  const prevSelectionsRef = useRef<UnitTypeSelection[]>([]);

  // Regenerate assignments when typeSelections change
  useEffect(() => {
    const prev = prevSelectionsRef.current;
    prevSelectionsRef.current = typeSelections;

    // Build new assignment list, preserving existing data where possible
    const newAssignments: UnitAssignment[] = [];
    typeSelections.forEach((sel) => {
      if (!sel.vehicleTypeId) return;
      for (let i = 0; i < sel.quantity; i++) {
        const stableId = `${sel.id}-${i}`;
        const existing = assignments.find((a) => a.id === stableId);
        if (existing && existing.vehicleTypeId === sel.vehicleTypeId) {
          newAssignments.push(existing);
        } else {
          newAssignments.push({
            id: stableId,
            vehicleTypeId: sel.vehicleTypeId,
            vehicleTypeName: "",
            driverId: "",
            vehicleId: "",
            notes: "",
          });
        }
      }
    });
    setAssignments(newAssignments);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeSelections]);

  // Type selection handlers
  const handleAddTypeSelection = useCallback(() => {
    setTypeSelections((prev) => [
      ...prev,
      { id: Date.now().toString(), vehicleTypeId: "", quantity: 1 },
    ]);
  }, []);

  const handleRemoveTypeSelection = useCallback((id: string) => {
    setTypeSelections((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((s) => s.id !== id);
    });
  }, []);

  const handleTypeSelectionChange = useCallback(
    (id: string, field: "vehicleTypeId" | "quantity", value: string | number) => {
      setTypeSelections((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          if (field === "quantity") {
            const qty = Math.max(1, typeof value === "number" ? value : parseInt(value as string) || 1);
            return { ...s, quantity: qty };
          }
          return { ...s, [field]: String(value) };
        })
      );
    },
    []
  );

  // Assignment handlers
  const handleAssignmentChange = useCallback(
    (id: string, field: keyof UnitAssignment, value: string) => {
      setAssignments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, [field]: value } : a))
      );
    },
    []
  );

  return {
    typeSelections,
    setTypeSelections,
    assignments,
    setAssignments,
    handleAddTypeSelection,
    handleRemoveTypeSelection,
    handleTypeSelectionChange,
    handleAssignmentChange,
  };
}
