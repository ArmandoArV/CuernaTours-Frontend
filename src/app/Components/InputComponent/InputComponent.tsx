import React, { useState, useRef } from "react";
import styles from "./inputStyles.module.css";
import { EyeFilled, EyeOffFilled } from "@fluentui/react-icons";
import { InputTypes } from "@/app/Types/InputTypes";

type Props = Partial<InputTypes> & {
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  hasError?: boolean;
  errorMessage?: string;
};

export default function InputComponent({
  type = "text",
  value = "",
  onChange,
  placeholder = "",
  className = "",
  label = "",
  disabled = false,
  id = "",
  name,
  icon,
  onIconClick,
  labelClassName = "",
  labelStyle = {},
  style = {},
  containerClassName = "",
  containerStyle = {},
  hasError = false,
  errorMessage = "",
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleIconClick = () => {
    if (onIconClick) {
      onIconClick();
    } else if (type === "date" && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.showPicker?.();
    }
  };

  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div
      className={`${styles.inputContainer} ${containerClassName}`}
      style={containerStyle}
    >
      {label && (
        <label
          htmlFor={id}
          className={`${styles.label} ${labelClassName}`}
          style={labelStyle}
        >
          {label}
        </label>
      )}

      <div className={styles.inputWrapper}>
        {icon && (
          <span
            className={`${styles.inputIcon} ${
              onIconClick || type === "date" ? styles.clickableIcon : ""
            }`}
            onClick={handleIconClick}
          >
            {icon}
          </span>
        )}

        <input
          ref={inputRef}
          type={inputType}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          id={id}
          name={name || id}
          style={style}
          className={`
            ${styles.input}
            ${className}
            ${icon ? styles.inputWithIcon : ""}
            ${hasError ? styles.inputError : ""}
          `}
        />

        {type === "password" && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className={styles.showPasswordButton}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeFilled className={styles.passwordIcon} />
            ) : (
              <EyeOffFilled className={styles.passwordIcon} />
            )}
          </button>
        )}
      </div>

      {hasError && errorMessage && (
        <span className={styles.errorMessage}>{errorMessage}</span>
      )}
    </div>
  );
}
