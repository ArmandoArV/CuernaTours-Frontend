"use client";
import React, { useState } from "react";
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartDate(value);
    if (value && endDate) {
      onDateRangeChange(value, endDate);
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndDate(value);
    if (startDate && value) {
      onDateRangeChange(startDate, value);
    }
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");
    onDateRangeChange("", "");
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
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
            <div className={styles.dateInput}>
              <label className={styles.label} htmlFor="startDate">
                Desde
              </label>
              <input
                id="startDate"
                type="date"
                className={styles.input}
                value={startDate}
                onChange={handleStartDateChange}
                max={endDate || undefined}
              />
            </div>

            <div className={styles.dateInput}>
              <label className={styles.label} htmlFor="endDate">
                Hasta
              </label>
              <input
                id="endDate"
                type="date"
                className={styles.input}
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate || undefined}
              />
            </div>
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
