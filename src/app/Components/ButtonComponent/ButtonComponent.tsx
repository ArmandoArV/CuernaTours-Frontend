import React from "react";
import styles from "./ButtonComponent.module.css";
import { IButtonProps } from "../../Types/ButtonType";
import { Button } from "@fluentui/react-components";

export default function ButtonComponent({
  text,
  onClick,
  className = "",
  disabled = false,
  type = "button",
  icon,
  title,
  appearance,
  style,
}: IButtonProps) {
  const buttonType = type === "cancel" ? "button" : type;
  
  return (
    <Button
      type={buttonType}
      onClick={(e) => onClick?.(e)}
      className={`${styles.button} ${className}`}
      disabled={disabled}
      icon={icon ? <span className={styles.icon}>{icon}</span> : undefined}
      title={title}
      appearance={appearance}
      style={style}
    >
      {text}
    </Button>
  );
}
