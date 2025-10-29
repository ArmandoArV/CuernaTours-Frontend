"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "./DatePickerComponent.module.css";
import { Input } from "@fluentui/react-components";

type Props = {
  id?: string;
  label?: React.ReactNode;
  value?: string; // dd/mm/yyyy
  onChange?: (value: string) => void;
  placeholder?: string;
  minDate?: Date;
  required?: boolean;
};

const formatDateToDDMMYYYY = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDDMMYYYYToDate = (dateString: string): Date | null => {
  const parts = dateString.split("/");
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900) return null;
  const date = new Date(year, month, day);
  if (date.getDate() !== day || date.getMonth() !== month || date.getFullYear() !== year) {
    return null;
  }
  return date;
};

export default function DatePickerComponent({
  id,
  label,
  value = "",
  onChange,
  placeholder = "dd/mm/yyyy",
  minDate,
  required = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!containerRef.current) return;
      if (target && containerRef.current.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  // Convert dd/mm/yyyy to ISO date (yyyy-mm-dd) for input[type=date]
  const ddmmyyyyToIso = (str: string): string => {
    const d = parseDDMMYYYYToDate(str);
    if (!d) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const isoToDdmmYYYY = (iso: string): string => {
    if (!iso) return "";
    const parts = iso.split("-");
    if (parts.length !== 3) return "";
    const [yyyy, mm, dd] = parts;
    return `${dd}/${mm}/${yyyy}`;
  };

  const handleInputIsoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const iso = e.target.value; // yyyy-mm-dd or ''
    const formatted = iso ? isoToDdmmYYYY(iso) : "";
    if (onChange) onChange(formatted);
  };

  const inputIsoValue = value ? ddmmyyyyToIso(value) : "";

  return (
    <div className={styles.container} ref={containerRef}>
      {label && <label className={styles.label} htmlFor={id}>{label}</label>}
      <Input
        id={id}
        type="date"
        value={inputIsoValue}
        onChange={handleInputIsoChange as any}
        className={styles.inputField}
        required={required}
      />
    </div>
  );
}
