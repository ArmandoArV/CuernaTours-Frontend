import React, { useState } from "react";
import styles from "./inputStyles.module.css";
import { EyeFilled, EyeOffFilled } from "@fluentui/react-icons";
import { InputTypes } from "@/app/Types/InputTypes";
export default function InputComponent({
  type = "text",
  value,
  onChange,
  placeholder = "",
  className = "",
  label = "",
  disabled = false,
  id = "",
  labelClassName = "",
  labelStyle = {},
  style = {},
  containerClassName = "",
  containerStyle = {},
}: InputTypes & {
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}) {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const inputType = type === "password" && showPassword ? "text" : type;

  return (
    <div className={`${styles.inputContainer} ${containerClassName}`} style={containerStyle}>
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
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${styles.input} ${className}`}
          disabled={disabled}
          id={id}
          style={style} // Apply custom styles
        />
        {type === "password" && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className={styles.showPasswordButton}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOffFilled className={styles.passwordIcon} />
            ) : (
              <EyeFilled className={styles.passwordIcon} />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
