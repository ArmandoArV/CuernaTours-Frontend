// hooks/useDriverTrips.ts
"use client";
import { useEffect, useState, useCallback } from "react";
import { contractsService, ApiError } from "@/services/api";
import { transformDriverTripsData } from "@/app/Utils/transformDriverTripsData";

export function useDriverTrips(driverId: number | null) {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrips = useCallback(async () => {
    if (!driverId) return;

    setLoading(true);
    setError(null);

    try {
      // Use driver-specific endpoint without query params
      const response = await contractsService.getDriverContracts(driverId);
      console.log("🔍 Raw API response:", response);
      const transformed = transformDriverTripsData(response, driverId);
      console.log("✨ Transformed trips:", transformed);
      setTrips(transformed);
    } catch (err) {
      console.error("❌ Error fetching trips:", err);
      setError(
        err instanceof ApiError ? err.message : "Error al cargar tus viajes",
      );
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  return { trips, loading, error, refresh: fetchTrips };
}
