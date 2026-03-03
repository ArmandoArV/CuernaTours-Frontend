import React from "react";
import { Field, Select } from "@fluentui/react-components";
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
  hasError = false,
  errorMessage = "",
}: SelectTypes & {
  labelClassName?: string;
  labelStyle?: React.CSSProperties;
  style?: React.CSSProperties;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  hasError?: boolean;
  errorMessage?: string;
}) {
  return (
    <div className={containerClassName} style={containerStyle}>
      <Field
        label={
          label
            ? { children: label, className: labelClassName, style: labelStyle }
            : undefined
        }
        required={required}
        validationMessage={hasError ? errorMessage : undefined}
        validationState={hasError ? "error" : "none"}
      >
        <Select
          value={value}
          onChange={onChange}
          className={className}
          disabled={disabled}
          id={id}
          style={style}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option, index) => (
            <option key={`${option.value}-${index}`} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}