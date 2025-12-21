"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import { ArrowLeftRegular } from "@fluentui/react-icons";
import { useRouter, useSearchParams } from "next/navigation";
import { authService, ApiError } from "@/services/api";
import { showSuccessAlert, showErrorAlert } from "@/app/Utils/AlertUtil";

export default function PasswordRecoveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    if (token) {
      validateToken(token);
    } else {
      setValidatingToken(false);
      setTokenValid(false);
    }
  }, [token]);

  const validateToken = async (tokenValue: string) => {
    try {
      setValidatingToken(true);
      await authService.verifyResetToken(tokenValue);
      setTokenValid(true);
    } catch (error) {
      console.error("Error validating token:", error);
      setTokenValid(false);
      if (error instanceof ApiError) {
        showErrorAlert(
          "Token inválido",
          "El enlace de restablecimiento de contraseña no es válido o ha expirado."
        );
      }
    } finally {
      setValidatingToken(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      showErrorAlert("Error", "Token de restablecimiento no encontrado.");
      return;
    }

    if (!password || !confirmPassword) {
      showErrorAlert("Campos requeridos", "Por favor completa ambos campos.");
      return;
    }

    if (password.length < 6) {
      showErrorAlert(
        "Contraseña débil",
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    if (password !== confirmPassword) {
      showErrorAlert("Error", "Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      showSuccessAlert(
        "Contraseña restablecida",
        "Tu contraseña ha sido restablecida correctamente.",
        () => {
          router.push("/");
        }
      );
    } catch (error) {
      console.error("Error resetting password:", error);
      if (error instanceof ApiError) {
        showErrorAlert(
          "Error",
          error.message || "No se pudo restablecer la contraseña. El enlace puede haber expirado."
        );
      } else {
        showErrorAlert(
          "Error",
          "No se pudo restablecer la contraseña. Por favor, intenta nuevamente."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.card}>
          <div className={styles.loading}>Validando enlace...</div>
        </div>
      </div>
    );
  }

  if (!tokenValid || !token) {
    return (
      <div className={styles.pageWrap}>
        <div className={styles.card}>
          <div className={styles.logo}>CUERNATOURS</div>
          <h2 className={styles.title}>Enlace inválido</h2>
          <p className={styles.errorText}>
            El enlace de restablecimiento de contraseña no es válido o ha expirado.
          </p>
          <button
            className={styles.backHomeButton}
            onClick={() => router.push("/")}
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.card}>
        <button
          aria-label="Volver"
          className={styles.backBtn}
          onClick={() => router.push("/")}
        >
          <ArrowLeftRegular />
        </button>

        <div className={styles.logo}>CUERNATOURS</div>
        <h2 className={styles.title}>Recuperar contraseña</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Contraseña nueva"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            autoComplete="new-password"
          />

          <input
            type="password"
            placeholder="Confirmar contraseña nueva"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={styles.input}
            autoComplete="new-password"
          />

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? "Restableciendo..." : "Restablecer contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
