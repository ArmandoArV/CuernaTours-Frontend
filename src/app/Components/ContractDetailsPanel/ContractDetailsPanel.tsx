"use client";

import { useState } from "react";
import styles from "./ContractDetailsPanel.module.css";
import { Contract } from "@/app/Types/ContractTypes";

interface Props {
  contract: Contract;
}

export default function ContractDetailsPanel({ contract }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const trips = contract.trips.toArray();
  const activeTrip = trips[activeIndex];

  const formatDateBlock = (dateStr: string, time?: string) => {
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString("es-MX", { month: "short" });

    return (
      <div className={styles.dateBlock}>
        <strong>{day}</strong>
        <span>{month}</span>
        {time && <small>{time.slice(0, 5)}</small>}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* ================== TOP SUMMARY CARD ================== */}
      <div className={styles.contractCard}>
        <div className={styles.contractGrid}>
          {/* CLIENT */}
          <div>
            <span className={styles.label}>Nombre del cliente</span>
            <span className={styles.value}>{contract.clientName}</span>
          </div>

          {/* COST */}
          <div>
            <span className={styles.label}>Costo del viaje</span>
            <span className={styles.value}>${contract.amount}</span>
          </div>

          {/* STATUS */}
          <div>
            <span className={styles.label}>Estatus pago</span>
            <span className={styles.value}>
              {contract.isPaid ? "Pagado" : "Pendiente"}
            </span>
          </div>

          {/* TRIP TYPE */}
          <div>
            <span className={styles.label}>Tipo de viaje</span>
            <span className={styles.value}>
              {trips.length > 1 ? "Redondo" : "Sencillo"}
            </span>
          </div>

          {/* PASSENGERS */}
          <div>
            <span className={styles.label}>No. pasajeros</span>
            <span className={styles.value}>
              {activeTrip?.passengers ?? "—"}
            </span>
          </div>

          {/* IVA */}
          <div>
            <span className={styles.label}>Aplica IVA</span>
            <span className={styles.value}>
              {contract.IVA === 1 ? "Sí" : "No"}
            </span>
          </div>

          {/* ORIGIN */}
          <div>
            <span className={styles.label}>Origen</span>
            <span className={styles.value}>
              {activeTrip?.originAddress ?? "—"}
            </span>
          </div>

          {/* DESTINATION */}
          <div>
            <span className={styles.label}>Destino</span>
            <span className={styles.value}>
              {activeTrip?.destinationAddress ?? "—"}
            </span>
          </div>

          {/* DRIVER */}
          <div>
            <span className={styles.label}>Chofer</span>
            <span className={styles.value}>{activeTrip?.driverName}</span>
          </div>

          {/* PAYMENT TYPE */}
          <div>
            <span className={styles.label}>Tipo de pago</span>
            <span className={styles.value}>{contract.paymentTypeName}</span>
          </div>

          {/* DATE BLOCKS */}
          <div className={styles.dateWrapper}>
            <span className={styles.label}>Ida:</span>
            {activeTrip &&
              formatDateBlock(activeTrip.serviceDate, activeTrip.originTime)}
          </div>
        </div>
      </div>

      {/* ================== SERVICES ================== */}
      <div className={styles.servicesSection}>
        <div className={styles.servicesLeft}>
          <strong>Servicios</strong>
          {trips.map((trip, i) => (
            <button
              key={trip.tripId}
              className={`${styles.serviceTab} ${
                i === activeIndex ? styles.activeTab : ""
              }`}
              onClick={() => setActiveIndex(i)}
            >
              Servicio {i + 1}
            </button>
          ))}
        </div>
        <div className={styles.servicesMiddle}>
          <h3>Servicio {activeIndex + 1}</h3>

          <div className={styles.routeSection}>
            {/* Origin */}
            <div className={styles.routeItem}>
              <div className={styles.outsideBubble}>
                <div className={styles.routeBubble}>1</div>
              </div>
              <span className={styles.routeText}>
                {activeTrip?.originName ?? "Origen"}
              </span>
            </div>

            {/* Stops placeholder (future ready) */}
            {/* You can extend Trip model later to include stops[] */}

            {/* Destination */}
            <div className={styles.routeItem}>
              <div className={styles.outsideBubble}>
                <div className={styles.routeBubble}>2</div>
              </div>
              <span className={styles.routeText}>
                {activeTrip?.destinationName ?? "Destino"}
              </span>
            </div>
          </div>
        </div>
        <div className={styles.servicesRight}>
          <div>
            <span className={styles.label}>Observaciones internas:</span>
            <p>{contract.internalObservations ?? "—"}</p>
          </div>

          <div>
            <span className={styles.label}>Observaciones para el cliente:</span>
            <p>{contract.observations ?? "—"}</p>
          </div>

          <div>
            <span className={styles.label}>Vuelo:</span>
            <p>
              {activeTrip?.hasFlightInfo
                ? `${activeTrip.flightNumber} - ${activeTrip.airline}`
                : "No aplica"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
