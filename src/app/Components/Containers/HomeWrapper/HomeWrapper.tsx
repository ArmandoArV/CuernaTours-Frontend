"use client";
import React, { useEffect, useCallback } from "react";
import styles from "./HomeWrapper.module.css";
import Image from "next/image";
import InputComponent from "../../InputComponent/InputComponent";
import ButtonComponent from "../../ButtonComponent/ButtonComponent";
import { LoginUserType } from "@/app/Types/LoginUserType";
import Link from "next/link";
export default function HomeWrapper() {
  const [formData, setFormData] = React.useState<LoginUserType>({
    email: "",
    password: "",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle form submission logic here
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [type === "text" ? "email" : "password"]: value,
    }));
  };

  const authenticateUser = useCallback(async () => {
    if (formData.email && formData.password) {
      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Allow-Control-Allow-Origin": "*",
          },
          body: JSON.stringify(formData),
        });
        if (response.ok) {
          const data = await response.json();
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          // Redirect to dashboard or another page
          window.location.href = "/dashboard";
        } else {
          console.error("Login failed");
          alert(
            "Error en la autenticación. Por favor, verifica tus credenciales."
          );
        }
      } catch (error) {
        console.error("Error during authentication:", error);
        alert(
          "Ocurrió un error durante la autenticación. Inténtalo de nuevo más tarde."
        );
      }
    }
  }, [formData, API_URL]);

  useEffect(() => {
    authenticateUser();
  }, [authenticateUser]);
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
