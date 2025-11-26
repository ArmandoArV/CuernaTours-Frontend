import React from "react";
import styles from "./ButtonComponent.module.css";
import { IButtonProps } from "../../Types/ButtonType";

export default function ButtonComponent({
  text,
  onClick,
  className = "", // Default to empty string if no custom class is provided
  disabled = false, // Default to false if no disabled flag is provided
  type = "button", // Default to "button" if no type is provided
  icon
}: IButtonProps) {
  return (
    <button
      type={type === "cancel" ? "button" : type}
      onClick={onClick}
      className={`${styles.button} ${className}`} // Combine default and custom classes
      disabled={disabled}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {text}
    </button>
  );
}
