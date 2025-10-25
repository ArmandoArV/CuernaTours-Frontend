"use client";
import React, { useEffect, useCallback } from "react";
import styles from "./HomeWrapper.module.css";
import Image from "next/image";
import InputComponent from "../../InputComponent/InputComponent";
import ButtonComponent from "../../ButtonComponent/ButtonComponent";
import { LoginUserType } from "@/app/Types/LoginUserType";
import Link from "next/link";
import { showSuccessAlert, showErrorAlert } from "@/app/Utils/AlertUtil";
import { setCookie } from "@/app/Utils/CookieUtil";
export default function HomeWrapper() {
  const [formData, setFormData] = React.useState<LoginUserType>({
    email: "",
    password: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Allow-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Store tokens and user data in cookies
        setCookie("accessToken", data.data.accessToken, {
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
        setCookie("refreshToken", data.data.refreshToken, {
          expires: 30, // 30 days for refresh token
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
        setCookie("user", JSON.stringify(data.data.user), {
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
        
        // Show success alert
        showSuccessAlert(
          "Inicio de sesión exitoso",
          `Bienvenido, ${data.data.user.display_name}!`,
          () => {
            // Redirect to dashboard after alert is closed
            window.location.href = "/dashboard";
          }
        );
      } else {
        // Handle different types of authentication errors
        let errorTitle = "Error de autenticación";
        let errorMessage = "Error en la autenticación. Por favor, verifica tus credenciales.";
        
        if (data.message) {
          // Check for specific error messages from the API
          const message = data.message.toLowerCase();
          
          if (message.includes("invalid") || message.includes("incorrect") || 
              message.includes("wrong") || message.includes("credenciales") ||
              message.includes("usuario") || message.includes("contraseña")) {
            errorTitle = "Credenciales incorrectas";
            errorMessage = "Usuario o contraseña incorrectos. Por favor, verifica tus datos e intenta nuevamente.";
          } else if (message.includes("not found") || message.includes("no encontrado")) {
            errorTitle = "Usuario no encontrado";
            errorMessage = "El usuario ingresado no existe en el sistema.";
          } else if (message.includes("blocked") || message.includes("suspended") || 
                     message.includes("bloqueado") || message.includes("suspendido")) {
            errorTitle = "Cuenta bloqueada";
            errorMessage = "Tu cuenta ha sido bloqueada. Contacta al administrador.";
          } else if (message.includes("expired") || message.includes("expirado")) {
            errorTitle = "Sesión expirada";
            errorMessage = "Tu sesión ha expirado. Por favor, intenta iniciar sesión nuevamente.";
          } else {
            // Use the original message from the API if it doesn't match specific patterns
            errorMessage = data.message;
          }
        }
        
        // Handle HTTP status codes
        if (response.status === 401) {
          errorTitle = "Credenciales incorrectas";
          errorMessage = "Usuario o contraseña incorrectos. Por favor, verifica tus datos e intenta nuevamente.";
        } else if (response.status === 403) {
          errorTitle = "Acceso denegado";
          errorMessage = "No tienes permisos para acceder al sistema.";
        } else if (response.status === 429) {
          errorTitle = "Demasiados intentos";
          errorMessage = "Has excedido el límite de intentos de inicio de sesión. Intenta más tarde.";
        } else if (response.status >= 500) {
          errorTitle = "Error del servidor";
          errorMessage = "Error interno del servidor. Por favor, intenta más tarde.";
        }
        
        showErrorAlert(errorTitle, errorMessage);
      }
    } catch (error) {
      console.error("Error during authentication:", error);
      
      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        showErrorAlert(
          "Error de conexión",
          "No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente."
        );
      } else {
        showErrorAlert(
          "Error inesperado",
          "Ocurrió un error inesperado durante la autenticación. Inténtalo de nuevo más tarde."
        );
      }
    }
  }, [formData, API_URL]);

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
