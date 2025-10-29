"use client";
import React, { useState, useRef, useEffect } from "react";
import { useMemo } from "react";
import { DatePicker } from "@fluentui/react-datepicker-compat";
import { Field, Input } from "@fluentui/react-components";
import styles from "./DatePickerComponent.module.css";

type Props = {
  id?: string;
  label?: string;
  value?: string; // dd/mm/yyyy
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
};

const formatDateToDDMMYYYY = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDDMMYYYYToDate = (val: string): Date | null => {
  const parts = val.split("/");
  if (parts.length !== 3) return null;
  const d = Number(parts[0]),
    m = Number(parts[1]) - 1,
    y = Number(parts[2]);
  const date = new Date(y, m, d);
  if (
    isNaN(date.getTime()) ||
    date.getDate() !== d ||
    date.getMonth() !== m ||
    date.getFullYear() !== y
  ) {
    return null;
  }
  return date;
};

export default function DatePickerComponent({
  id,
  label,
  value = "",
  onChange,
  placeholder = "Select a date",
  required = false,
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = value
    ? parseDDMMYYYYToDate(value) || undefined
    : undefined;

  // Memoize restrictedDates: generate dates from (today - 20 years) up to yesterday.
  // This keeps the array small (~7.3k entries) and still covers typical past selections.
  const restrictedDates = useMemo(() => {
    const arr: Date[] = [];
    const start = new Date(today);
    start.setFullYear(start.getFullYear() - 20);
    start.setHours(0, 0, 0, 0);
    const end = new Date(today);
    end.setDate(end.getDate() - 1); // yesterday

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      arr.push(new Date(d));
    }
    return arr;
  }, [today]);

  return (
    <div className={styles.container}>
      <Field
        label={label}
        required={required}
      >
        <DatePicker
          value={selectedDate}
          minDate={today}
          placeholder={placeholder}
          // Restricted dates are passed to the calendar slot so the internal Calendar marks them disabled
          calendar={{ restrictedDates }}
          onSelectDate={(date: Date | null | undefined) => {
            if (date && date >= today) {
              onChange?.(formatDateToDDMMYYYY(date));
            }
          }}
          className={styles.calendar}
          formatDate={(date?: Date) => date ? formatDateToDDMMYYYY(date) : ""}
          parseDateFromString={(str: string) => parseDDMMYYYYToDate(str)}
        />
      </Field>
    </div>
  );
}
