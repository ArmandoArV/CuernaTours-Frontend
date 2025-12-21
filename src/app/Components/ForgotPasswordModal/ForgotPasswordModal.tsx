"use client";

import React, { useState } from "react";
import styles from "./ForgotPasswordModal.module.css";
import { DismissRegular } from "@fluentui/react-icons";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import InputComponent from "../InputComponent/InputComponent";
import { showSuccessAlert, showErrorAlert } from "@/app/Utils/AlertUtil";
import { authService } from "@/services/api";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({
  isOpen,
  onClose,
}: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showErrorAlert("Campo requerido", "Por favor, ingresa tu correo electrónico.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showErrorAlert("Formato inválido", "Por favor, ingresa un correo electrónico válido.");
      return;
    }

    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setSubmitted(true);
      showSuccessAlert(
        "Correo enviado",
        "Si la dirección de correo existe, te llegará un enlace para restablecer tu contraseña."
      );
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error("Error requesting password reset:", error);
      showErrorAlert(
        "Error",
        "No se pudo enviar el correo. Por favor, intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setSubmitted(false);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeButton}
          onClick={handleClose}
          aria-label="Cerrar"
        >
          <DismissRegular />
        </button>

        <h2 className={styles.title}>Recuperar contraseña</h2>

        {!submitted ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <label className={styles.label}>Escribe tu correo</label>
            <InputComponent
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo"
              className={styles.input}
            />
            <p className={styles.hint}>
              *Si la dirección de correo existe, te llegará un correo con un enlace para
              restablecer tu contraseña
            </p>

            <ButtonComponent
              text={loading ? "Enviando..." : "Enviar"}
              className={styles.submitButton}
              type="submit"
              disabled={loading}
            />
          </form>
        ) : (
          <div className={styles.successMessage}>
            ✓ Correo enviado exitosamente
          </div>
        )}
      </div>
    </div>
  );
}
