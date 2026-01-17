"use client";
import React, { useState } from "react";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import { Field } from "@fluentui/react-components";
import styles from "./DateRangeFilter.module.css";
import { CalendarRegular } from "@fluentui/react-icons";

interface DateRangeFilterProps {
  onDateRangeChange: (startDate: string, endDate: string) => void;
  label?: string;
  placeholder?: string;
}

export default function DateRangeFilter({
  onDateRangeChange,
  label = "Rango De Fechas",
  placeholder = "Seleccionar Fechas",
}: DateRangeFilterProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleStartDateChange = (date: Date | null | undefined) => {
    setStartDate(date || null);
    if (date && endDate) {
      onDateRangeChange(formatDateToYYYYMMDD(date), formatDateToYYYYMMDD(endDate));
    }
  };

  const handleEndDateChange = (date: Date | null | undefined) => {
    setEndDate(date || null);
    if (startDate && date) {
      onDateRangeChange(formatDateToYYYYMMDD(startDate), formatDateToYYYYMMDD(date));
    }
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    onDateRangeChange("", "");
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return "";
    return date.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const displayText =
    startDate && endDate
      ? `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`
      : placeholder;

  return (
    <div className={styles.container}>
      <div className={styles.filterWrapper}>
        <CalendarRegular className={styles.icon} />
        <button
          type="button"
          className={styles.filterButton}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={label}
        >
          <span className={styles.buttonText}>{displayText}</span>
        </button>
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <span className={styles.dropdownTitle}>{label}</span>
            <button
              type="button"
              className={styles.closeButton}
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>

          <div className={styles.dateInputs}>
            <Field label="Desde" className={styles.dateInput}>
              <DatePicker
                placeholder="Seleccionar fecha"
                value={startDate}
                onSelectDate={handleStartDateChange}
                maxDate={endDate || undefined}
                className={styles.datePicker}
              />
            </Field>

            <Field label="Hasta" className={styles.dateInput}>
              <DatePicker
                placeholder="Seleccionar fecha"
                value={endDate}
                onSelectDate={handleEndDateChange}
                minDate={startDate || undefined}
                className={styles.datePicker}
              />
            </Field>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClear}
              disabled={!startDate && !endDate}
            >
              Limpiar
            </button>
            <button
              type="button"
              className={styles.applyButton}
              onClick={() => setIsOpen(false)}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {(startDate || endDate) && (
        <div className={styles.activeFilter}>
          <span className={styles.filterTag}>
            <span className={styles.filterTagText}>
              {label}: {displayText}
            </span>
            <button
              type="button"
              className={styles.filterTagRemove}
              onClick={handleClear}
              aria-label="Remover filtro"
            >
              ×
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
