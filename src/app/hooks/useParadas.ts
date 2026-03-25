import { useState, useCallback } from "react";
import { referenceService } from "@/services/api";
import { SearchableSelectOption } from "@/app/Components/SearchableSelectComponent/SearchableSelectComponent";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("useParadas");

export interface Parada {
  id: string;
  nombreLugar: string;
  description: string;
  calle: string;
  numero: string;
  colonia: string;
  codigoPostal: string;
  ciudad: string;
  estado: string;
}

export function useParadas(initialParadas: Parada[] = []) {
  const [paradas, setParadas] = useState<Parada[]>(initialParadas);
  const [editingParadas, setEditingParadas] = useState<Record<string, boolean>>({});

  const isParadaEditing = useCallback(
    (id: string) => editingParadas[id] || false,
    [editingParadas],
  );

  const toggleParadaEdit = useCallback((id: string) => {
    setEditingParadas((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const startParadaEdit = useCallback((id: string) => {
    setEditingParadas((prev) => ({ ...prev, [id]: true }));
  }, []);

  const stopParadaEdit = useCallback((id: string) => {
    setEditingParadas((prev) => ({ ...prev, [id]: false }));
  }, []);

  const handleAddParada = useCallback(() => {
    // Validate that the last parada has required fields before adding a new one
    if (paradas.length > 0) {
      const lastParada = paradas[paradas.length - 1];
      if (!lastParada.nombreLugar && !lastParada.calle) {
        return; // Don't add a new stop if the last one is empty
      }
    }
    const newParada: Parada = {
      id: Date.now().toString(),
      nombreLugar: "",
      description: "",
      calle: "",
      numero: "",
      colonia: "",
      codigoPostal: "",
      ciudad: "",
      estado: "",
    };
    setParadas((prev) => [...prev, newParada]);
    startParadaEdit(newParada.id);
  }, [paradas, startParadaEdit]);

  const handleRemoveParada = useCallback((id: string) => {
    setParadas((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleParadaChange = useCallback(
    (id: string, field: keyof Parada, value: string) => {
      setParadas((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
      );
    },
    [],
  );

  const handleParadaPlaceSelect = useCallback(
    async (id: string, placeId: string, option?: SearchableSelectOption) => {
      handleParadaChange(id, "nombreLugar", placeId);

      // Auto-fill address fields if available
      if (option?.data) {
        try {
          const placeDetails = await referenceService.getPlaceById(
            parseInt(placeId),
          );
          setParadas((prev) =>
            prev.map((p) =>
              p.id === id
                ? {
                    ...p,
                    nombreLugar: placeId,
                    calle: placeDetails.address || "",
                    numero: placeDetails.number || "",
                    colonia: placeDetails.colonia || "",
                    codigoPostal: placeDetails.zip_code || "",
                    ciudad: placeDetails.city || "",
                    estado: placeDetails.state || "",
                  }
                : p,
            ),
          );
          stopParadaEdit(id);
        } catch (error) {
          log.error("Error fetching place details:", error);
        }
      }
    },
    [handleParadaChange, stopParadaEdit],
  );

  return {
    paradas,
    setParadas,
    handleAddParada,
    handleRemoveParada,
    handleParadaChange,
    handleParadaPlaceSelect,
    isParadaEditing,
    toggleParadaEdit,
    startParadaEdit,
    stopParadaEdit,
  };
}
