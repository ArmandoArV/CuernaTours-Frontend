"use client";

import styles from "./TripDatesSummary.module.css";

interface Props {
  departureDate: string;
  departureTime?: string;
  returnDate?: string;
  returnTime?: string;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);

  return {
    day: date.getDate(),
    month: date.toLocaleString("es-MX", {
      month: "short",
    }),
  };
};

export default function TripDatesSummary({
  departureDate,
  departureTime,
  returnDate,
  returnTime,
}: Props) {
  const ida = formatDate(departureDate);
  const regreso = returnDate ? formatDate(returnDate) : null;

  return (
    <div className={styles.container}>
      {/* IDA */}
      <div className={styles.block}>
        <span className={styles.label}>Ida:</span>

        <div className={styles.date}>
          <strong>{ida.day}</strong>

          <div>
            <span>{ida.month}</span>
            {departureTime && <small>{departureTime.slice(0, 5)}</small>}
          </div>
        </div>
      </div>

      {/* DIVIDER */}
      {regreso && <div className={styles.divider} />}

      {/* REGRESO */}
      {regreso && (
        <div className={styles.block}>
          <span className={styles.label}>Regreso:</span>

          <div className={styles.date}>
            <strong>{regreso.day}</strong>

            <div>
              <span>{regreso.month}</span>
              {returnTime && <small>{returnTime.slice(0, 5)}</small>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
