import { useState, useEffect, useCallback } from "react";
import { referenceService } from "@/services/api";

export function useTripDropdowns() {
  const [lugares, setLugares] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [choferes, setChoferes] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [unidades, setUnidades] = useState<
    Array<{ value: string; label: string; licensePlate?: string }>
  >([]);

  const fetchLugares = useCallback(async () => {
    try {
      const data = await referenceService.getPlaces();
      const lugarOptions = referenceService.transformPlacesForSelect(data);
      setLugares(lugarOptions);
    } catch (error) {
      console.error("Error fetching lugares:", error);
    }
  }, []);

  const fetchChoferes = useCallback(async () => {
    try {
      const data = await referenceService.getDrivers();
      const choferOptions = referenceService.transformDriversForSelect(data);
      setChoferes(choferOptions);
    } catch (error) {
      console.error("Error fetching choferes:", error);
    }
  }, []);

  const fetchUnidades = useCallback(async () => {
    try {
      const data = await referenceService.getVehicles();
      const unidadOptions = referenceService.transformVehiclesForSelect(data);
      setUnidades(unidadOptions);
    } catch (error) {
      console.error("Error fetching unidades:", error);
    }
  }, []);

  useEffect(() => {
    fetchLugares();
    fetchChoferes();
    fetchUnidades();
  }, [fetchLugares, fetchChoferes, fetchUnidades]);

  return {
    lugares,
    choferes,
    unidades,
    fetchLugares,
    fetchChoferes,
    fetchUnidades,
  };
}
