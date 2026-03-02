import React from "react";
import styles from "./ButtonComponent.module.css";
import { IButtonProps } from "../../Types/ButtonType";
import { Button } from "@fluentui/react-components";

export default function ButtonComponent({
  text,
  onClick,
  className = "", // Default to empty string if no custom class is provided
  disabled = false, // Default to false if no disabled flag is provided
  type = "button", // Default to "button" if no type is provided
  icon,
  title,
}: IButtonProps) {
  const buttonType = type === "cancel" ? "button" : type;
  
  return (
    <Button
      type={buttonType}
      onClick={(e) => onClick?.(e)}
      className={`${styles.button} ${className}`} // Combine default and custom classes
      disabled={disabled}
      icon={icon ? <span className={styles.icon}>{icon}</span> : undefined}
      title={title}
    >
      {text}
    </Button>
  );
}
