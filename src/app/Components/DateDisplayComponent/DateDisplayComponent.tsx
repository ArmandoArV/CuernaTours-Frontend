"use client";
import React from "react";
import styles from "./DateDisplayComponent.module.css";

interface DateDisplayComponentProps {
  date: string | Date;
  className?: string;
}

const DateDisplayComponent: React.FC<DateDisplayComponentProps> = ({
  date,
  className,
}) => {
  const dateObj = new Date(date);
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString("es-MX", { month: "short" });
  const time = dateObj.toLocaleTimeString("es-MX", { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });

  return (
    <div className={`${styles.dateDisplay} ${className || ''}`}>
      <div className={styles.dayNumber}>{day}</div>
      <div className={styles.dateInfo}>
        <div className={styles.month}>{month}</div>
        <div className={styles.time}>{time}</div>
      </div>
    </div>
  );
};

export default DateDisplayComponent;