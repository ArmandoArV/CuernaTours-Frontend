"use client";
import React, { useEffect, useCallback } from "react";
import styles from "./HomeWrapper.module.css";
import Image from "next/image";
import InputComponent from "../../InputComponent/InputComponent";
import ButtonComponent from "../../ButtonComponent/ButtonComponent";
import { LoginUserType } from "@/app/Types/LoginUserType";
import Link from "next/link";
import { showSuccessAlert, showErrorAlert } from "@/app/Utils/AlertUtil";
import { useRouter } from "next/navigation";
import { authService, ApiError } from "@/services/api";

export default function HomeWrapper() {
  const router = useRouter();
  const [formData, setFormData] = React.useState<LoginUserType>({
    email: "",
    password: "",
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    authenticateUser();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [type === "text" ? "email" : "password"]: value,
    }));
  };

  const authenticateUser = useCallback(async () => {
    // Validate required fields
    if (!formData.email || !formData.password) {
      if (!formData.email && !formData.password) {
        showErrorAlert(
          "Campos requeridos",
          "Por favor, ingresa tu usuario y contraseña."
        );
      } else if (!formData.email) {
        showErrorAlert(
          "Campo requerido",
          "Por favor, ingresa tu usuario."
        );
      } else {
        showErrorAlert(
          "Campo requerido",
          "Por favor, ingresa tu contraseña."
        );
      }
      return;
    }

    // Validate email format (basic validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showErrorAlert(
        "Formato inválido",
        "Por favor, ingresa un correo electrónico válido."
      );
      return;
    }

    try {
      // authService.login() handles all cookie storage internally
      const data = await authService.login(formData.email, formData.password);

      // Show success alert
      const welcomeName = data.user.display_name || data.user.name || "Usuario";
      showSuccessAlert(
        "Inicio de sesión exitoso",
        `Bienvenido, ${welcomeName}!`,
        () => {
          // Redirect to dashboard after alert is closed
          router.push("/dashboard");
        }
      );
    } catch (error) {
      console.error("Error during authentication:", error);
      
      if (error instanceof ApiError) {
        let errorTitle = "Error de autenticación";
        let errorMessage = error.message;
        
        // Handle specific error types
        if (error.isAuthError()) {
          errorTitle = "Credenciales incorrectas";
          errorMessage = "Usuario o contraseña incorrectos. Por favor, verifica tus datos e intenta nuevamente.";
        } else if (error.isNetworkError()) {
          errorTitle = "Error de conexión";
          errorMessage = "No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.";
        } else if (error.statusCode === 429) {
          errorTitle = "Demasiados intentos";
          errorMessage = "Has excedido el límite de intentos de inicio de sesión. Intenta más tarde.";
        } else if (error.isServerError()) {
          errorTitle = "Error del servidor";
          errorMessage = "Error interno del servidor. Por favor, intenta más tarde.";
        }
        
        showErrorAlert(errorTitle, errorMessage);
      } else {
        showErrorAlert(
          "Error inesperado",
          "Ocurrió un error inesperado durante la autenticación. Inténtalo de nuevo más tarde."
        );
      }
    }
  }, [formData, router]);

  return (
    <div className={styles["mainContainer"]}>
      <div className={styles["leftContainer"]}>
        <div className={styles["logoImageWrapper"]}>
          <Image
            src="/Images/CuernaToursAsset2.svg"
            alt="Cuerna Tours Logo"
            width={700}
            height={200}
            className={styles["logoImage"]}
          />
        </div>
      </div>
      <div className={styles["rightContainer"]}>
        <form className={styles["formContainer"]} onSubmit={handleSubmit}>
          <div className={styles["headerContainer"]}>
            <h1 className={styles["headerText"]}>Iniciar Sesión</h1>
          </div>
          <div className={styles["inputContainers"]}>
            <InputComponent
              type="text"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Usuario"
              className={styles["inputField"]}
            />
            <InputComponent
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Contraseña"
              className={styles["inputField"]}
            />
          </div>
          <div className={styles["buttonContainer"]}>
            <ButtonComponent
              text="Iniciar Sesión"
              onClick={authenticateUser}
              className={styles["loginButton"]}
              type="submit"
            />
          </div>
          <div className={styles["forgotPassword"]}>
            <p className={styles["forgotPasswordText"]}>
              ¿Olvidaste tu contraseña?{" "}
              <Link href="#" className={styles["forgotPasswordLink"]}>
                Da clic aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}