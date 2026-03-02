import React, { useState, useRef } from "react";
import { Field, Input, Button, Textarea } from "@fluentui/react-components";
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
      inputRef.current.showPicker?.();
    }
  };

  const inputType = type === "password" && showPassword ? "text" : type;

  const contentAfter =
    type === "password" ? (
      <Button
        appearance="transparent"
        icon={showPassword ? <EyeFilled /> : <EyeOffFilled />}
        onClick={togglePasswordVisibility}
        aria-label={showPassword ? "Hide password" : "Show password"}
      />
    ) : null;

  const contentBefore = icon ? (
    <span
      onClick={handleIconClick}
      style={{
        cursor: onIconClick || type === "date" ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        paddingRight: "8px",
      }}
    >
      {icon}
    </span>
  ) : null;

  return (
    <div className={containerClassName} style={containerStyle}>
      <Field
        label={
          label
            ? { children: label, className: labelClassName, style: labelStyle }
            : undefined
        }
        validationMessage={hasError ? errorMessage : undefined}
        validationState={hasError ? "error" : "none"}
        htmlFor={id}
      >
        {type === "textarea" ? (
          <Textarea
            value={value}
            onChange={onChange as any}
            placeholder={placeholder}
            disabled={disabled}
            id={id}
            name={name || id}
            style={style}
            className={className}
          />
        ) : (
          <Input
            ref={inputRef}
            type={inputType}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            id={id}
            name={name || id}
            style={style}
            className={className}
            contentBefore={contentBefore}
            contentAfter={contentAfter}
          />
        )}
      </Field>
    </div>
  );
}
