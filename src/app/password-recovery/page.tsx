"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import { ArrowLeftRegular } from "@fluentui/react-icons";
import { useRouter, useSearchParams } from "next/navigation";
import { authService, ApiError } from "@/services/api";
import { showSuccessAlert, showErrorAlert } from "@/app/Utils/AlertUtil";
import { Button, Input, Text, Field } from "@fluentui/react-components";
import { EyeRegular, EyeOffRegular } from "@fluentui/react-icons";
import { makeStyles, shorthands } from "@fluentui/react-components";
import Image from "next/image";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("PasswordRecoveryPage");

const useFluentOverrides= makeStyles({
  inputRoot: {
    backgroundColor: "#f3f3f3",
    border: "1px solid #d1d1d1",
    borderRadius: "4px",
    ...shorthands.padding("6px", "10px"),
  },
  inputRootFocused: {
    border: "1px solid #b48b2b",
    boxShadow: "0 0 0 2px rgba(180,139,43,0.15)",
  },
  eyeButton: {
    minWidth: "unset",
    padding: "4px",
  },
  primaryButton: {
    backgroundColor: "#b48b2b",
    border: "1px solid #b48b2b",
    width: "200px",
    fontWeight: 600,
  },
  primaryButtonHover: {
    backgroundColor: "#9e7924",
    border: "1px solid #b48b2b",
  },
});
export default function PasswordRecoveryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const fluentStyles = useFluentOverrides();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

      const result = await authService.verifyResetToken(tokenValue);

      if (result.valid) {
        setTokenValid(true);
      } else {
        setTokenValid(false);
        showErrorAlert(
          "Token inválido",
          "El enlace de restablecimiento de contraseña no es válido o ha expirado.",
        );
      }
    } catch (error) {
      log.error("Error validating token:", error);
      setTokenValid(false);

      showErrorAlert(
        "Token inválido",
        "El enlace de restablecimiento de contraseña no es válido o ha expirado.",
      );
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
        "La contraseña debe tener al menos 6 caracteres.",
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
        },
      );
    } catch (error) {
      log.error("Error resetting password:", error);
      if (error instanceof ApiError) {
        showErrorAlert(
          "Error",
          error.message ||
            "No se pudo restablecer la contraseña. El enlace puede haber expirado.",
        );
      } else {
        showErrorAlert(
          "Error",
          "No se pudo restablecer la contraseña. Por favor, intenta nuevamente.",
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
          <div className={styles.logo}>
            <Image
              src="/Images/CuernatoursLogo.svg"
              alt="Cuernatours Logo"
              width={120}
              height={90}
              priority
            />
          </div>
          <h2 className={styles.title}>Enlace inválido</h2>
          <p className={styles.errorText}>
            El enlace de restablecimiento de contraseña no es válido o ha
            expirado.
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

        <div className={styles.logo}>
          <Image
            src="/Images/CuernatoursLogo.svg"
            alt="Cuernatours Logo"
            width={180}
            height={120}
            priority
          />
        </div>
        <h2 className={styles.title}>Recuperar contraseña</h2>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Field>
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Contraseña nueva"
              value={password}
              onChange={(_, data) => setPassword(data.value)}
              className={fluentStyles.inputRoot}
              contentAfter={
                <Button
                  appearance="subtle"
                  size="small"
                  icon={showPassword ? <EyeOffRegular /> : <EyeRegular />}
                  onClick={() => setShowPassword(!showPassword)}
                  className={fluentStyles.eyeButton}
                />
              }
            />
          </Field>

          <Field>
            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmar contraseña nueva"
              value={confirmPassword}
              onChange={(_, data) => setConfirmPassword(data.value)}
              className={fluentStyles.inputRoot}
              contentAfter={
                <Button
                  appearance="subtle"
                  size="small"
                  className={fluentStyles.eyeButton}
                  icon={
                    showConfirmPassword ? <EyeOffRegular /> : <EyeRegular />
                  }
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              }
            />
          </Field>

          <Button
            appearance="primary"
            type="submit"
            disabled={loading}
            className={`${styles.submitBtn} ${fluentStyles.primaryButton}`}
          >
            {loading ? "Restableciendo..." : "Restablecer contraseña"}
          </Button>
        </form>
      </div>
    </div>
  );
}
