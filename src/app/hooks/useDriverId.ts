"use client";
import { useEffect, useState } from "react";
import { getCookie } from "@/app/Utils/CookieUtil";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("useDriverId");

type UseDriverIdReturn = {
  driverId: number | null;
  error: string | null;
  loading: boolean;
};

export function useDriverId(): UseDriverIdReturn {
  const [driverId, setDriverId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userCookie = getCookie("user");

      if (!userCookie) {
        setError("Sesión no válida");
        setLoading(false);
        return;
      }

      const userData = JSON.parse(userCookie);

      const rawId =
        userData?.id ??
        userData?.user_id ??
        userData?.userId ??
        null;

      if (!rawId) {
        setError("No se pudo identificar al usuario");
        setLoading(false);
        return;
      }

      const numericId = Number(rawId);

      if (isNaN(numericId)) {
        setError("ID de usuario inválido");
        setLoading(false);
        return;
      }

      setDriverId(numericId);
    } catch (err) {
      log.error("Error parsing user cookie:", err);
      setError("Error al obtener datos del usuario");
    } finally {
      setLoading(false);
    }
  }, []);

  return { driverId, error, loading };
}