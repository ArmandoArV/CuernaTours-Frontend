import { useState, useEffect, useCallback } from "react";
import { referenceService } from "@/services/api";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("useTripDropdowns");

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
  const [tiposUnidad, setTiposUnidad] = useState<
    Array<{ value: string; label: string; capacity?: number }>
  >([]);

  const fetchLugares = useCallback(async () => {
    try {
      const data = await referenceService.getPlaces();
      const lugarOptions = referenceService.transformPlacesForSelect(data);
      setLugares(lugarOptions);
    } catch (error) {
      log.error("Error fetching lugares:", error);
    }
  }, []);

  const fetchChoferes = useCallback(async () => {
    try {
      const data = await referenceService.getDrivers();
      const choferOptions = referenceService.transformDriversForSelect(data);
      setChoferes(choferOptions);
    } catch (error) {
      log.error("Error fetching choferes:", error);
    }
  }, []);

  const fetchUnidades = useCallback(async () => {
    try {
      const data = await referenceService.getVehicles();
      const unidadOptions = referenceService.transformVehiclesForSelect(data);
      setUnidades(unidadOptions);
    } catch (error) {
      log.error("Error fetching unidades:", error);
    }
  }, []);

  const fetchTiposUnidad = useCallback(async () => {
    try {
      const data = await referenceService.getPrefillableData();
      if (data.vehicle_types) {
        const options = referenceService.transformVehicleTypesForSelect(data.vehicle_types);
        setTiposUnidad(options);
      }
    } catch (error) {
      log.error("Error fetching tipos de unidad:", error);
    }
  }, []);

  useEffect(() => {
    fetchLugares();
    fetchChoferes();
    fetchUnidades();
    fetchTiposUnidad();
  }, [fetchLugares, fetchChoferes, fetchUnidades, fetchTiposUnidad]);

  return {
    lugares,
    choferes,
    unidades,
    tiposUnidad,
    fetchLugares,
    fetchChoferes,
    fetchUnidades,
    fetchTiposUnidad,
  };
}
