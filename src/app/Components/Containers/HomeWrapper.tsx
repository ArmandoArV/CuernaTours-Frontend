"use client";
import React from "react";
import styles from "./HomeWrapper.module.css";
import Image from "next/image";
import { on } from "events";
export default function HomeWrapper() {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // Handle form submission logic here
  };
  return (
    <div className={styles["mainContainer"]}>
      <div className={styles["leftContainer"]}>
        <div className={styles["logoImageWrapper"]}>
          <Image
            src="/Images/CuernaToursLogo.svg"
            alt="Cuerna Tours Logo"
            width={200}
            height={100}
            className={styles["logoImage"]}
          />
        </div>
      </div>
      <div className={styles["rightContainer"]}>
        <form className={styles["formContainer"]} onSubmit={handleSubmit}>
          <div className={styles["headerContainer"]}>
            <h1 className={styles["headerText"]}>Iniciar Sesión</h1>
          </div>
          <div className={styles[""]}></div>
          <div className={styles[""]}></div>
          <div className={styles[""]}></div>
        </form>
      </div>
    </div>
  );
}
