import styles from "./FormField.module.css";
import React from "react";

interface FormFieldProps {
  label: React.ReactNode;
  error?: string;
  required?: boolean;
  children: React.ReactElement<{ className?: string }>; // Type the expected props
}

export default function FormField({
  label,
  error,
  required,
  children,
}: FormFieldProps) {
  const hasError = !!error;

  return (
    <div className={styles.container}>
      {/* LABEL */}
      <label className={`${styles.label} ${hasError ? styles.labelError : ""}`}>
        {label}
        {required && <strong className={styles.required}> *</strong>}
      </label>

      {/* INPUT */}
      {React.cloneElement(children, {
        className: `${children.props.className ?? ""} ${
          hasError ? styles.fieldError : ""
        }`.trim(),
      })}

      {/* ERROR */}
      {hasError && <p className={styles.errorMessage}>{error}</p>}
    </div>
  );
}
