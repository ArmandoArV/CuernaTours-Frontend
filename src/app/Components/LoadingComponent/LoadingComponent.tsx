"use client";

import { Spinner } from "@fluentui/react-components";
import styles from "./LoadingComponent.module.css";

type LoadingComponentProps = {
  message?: string;
};

export default function LoadingComponent({
  message = "Cargando, por favor espera...",
}: LoadingComponentProps) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.message}>{message}</div>
        <Spinner size="medium" appearance="primary" />
      </div>
    </div>
  );
}
