// hooks/useDriverId.ts
"use client";
import { useEffect, useState } from "react";
import { getCookie } from "@/app/Utils/CookieUtil";

export function useDriverId() {
  const [driverId, setDriverId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const userCookie = getCookie("user");
      if (!userCookie) {
        setError("Sesión no válida");
        return;
      }

      const userData = JSON.parse(userCookie);
      const userId = userData.id || userData.user_id || userData.userId;

      if (!userId) {
        setError("No se pudo identificar al usuario");
        return;
      }

      setDriverId(userId);
    } catch {
      setError("Error al obtener datos del usuario");
    }
  }, []);

  return { driverId, error };
}
