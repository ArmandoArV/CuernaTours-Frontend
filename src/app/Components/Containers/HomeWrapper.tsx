"use client";
import React from "react";
import styles from "./HomeWrapper.module.css";
import Image from "next/image";
import InputComponent from "../InputComponent/InputComponent";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { LoginUserType } from "@/app/Types/LoginUserType";
import Link from "next/link";
export default function HomeWrapper() {
  const [formData, setFormData] = React.useState<LoginUserType>({
    email: "",
    password: "",
  });

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
              onClick={() => {
                // Handle button click if needed
              }}
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
