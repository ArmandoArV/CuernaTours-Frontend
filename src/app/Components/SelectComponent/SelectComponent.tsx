import React from "react";
import styles from "./selectStyles.module.css";
import { SelectTypes } from "@/app/Types/SelectTypes";

export default function SelectComponent({
  value,
  onChange,
  options,
  placeholder = "Seleccione...",
  className = "",
  label = "",
  disabled = false,
  id = "",
  required = false,
  labelClassName = "",
  labelStyle = {},
  style = {},
  containerClassName = "",
  containerStyle = {},
}: SelectTypes & {
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
}) {
  return (
    <div
      className={`${styles.selectContainer} ${containerClassName}`}
      style={containerStyle}
    >
      {label && (
        <label
          htmlFor={id}
          className={`${styles.label} ${labelClassName}`}
          style={labelStyle}
        >
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <div className={styles.selectWrapper}>
        <select
          value={value}
          onChange={onChange}
          className={`${styles.select} ${className}`}
          disabled={disabled}
          id={id}
          style={style}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}