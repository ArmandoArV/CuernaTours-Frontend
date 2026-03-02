import { useState, useCallback } from "react";
import { referenceService } from "@/services/api";
import { SearchableSelectOption } from "@/app/Components/SearchableSelectComponent/SearchableSelectComponent";

export interface Parada {
  id: string;
  nombreLugar: string;
  calle: string;
  numero: string;
  colonia: string;
  codigoPostal: string;
  ciudad: string;
  estado: string;
}

export function useParadas(initialParadas: Parada[] = []) {
  const [paradas, setParadas] = useState<Parada[]>(initialParadas);

  const handleAddParada = useCallback(() => {
    const newParada: Parada = {
      id: Date.now().toString(),
      nombreLugar: "",
      calle: "",
      numero: "",
      colonia: "",
      codigoPostal: "",
      ciudad: "",
      estado: "",
    };
    setParadas((prev) => [...prev, newParada]);
  }, []);

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
        } catch (error) {
          console.error("Error fetching place details:", error);
        }
      }
    },
    [handleParadaChange],
  );

  return {
    paradas,
    setParadas,
    handleAddParada,
    handleRemoveParada,
    handleParadaChange,
    handleParadaPlaceSelect,
  };
}
