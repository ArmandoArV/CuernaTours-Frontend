"use client";

import { useState } from "react";
import styles from "./ContractDetailsPanel.module.css";
import { Contract } from "@/app/Types/ContractTypes";
import TripDatesSummary from "@/app/Components/TripDatesSummary/TripDatesSummary";
import RouteTimeline, {
  RouteLocation,
} from "@/app/Components/RouteTimeline/RouteTimeline";
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
    const month = date.toLocaleString("es-MX", {
      month: "short",
    });

    return (
      <div className={styles.dateBlock}>
        <strong>{day}</strong>
        <span>{month}</span>
        {time && <small>{time.slice(0, 5)}</small>}
      </div>
    );
  };

  const routeLocations: RouteLocation[] = activeTrip
    ? [
        {
          label: activeTrip.originName,
          type: "origin",
        },

        {
          label: activeTrip.destinationName,
          type: "destination",
        },
      ]
    : [];

  return (
    <div className={styles.container}>
      {/* ================== CONTRACT SUMMARY ================== */}
      <div className={styles.contractCard}>
        <div className={styles.contractHeader}>
          {/* MAIN GRID */}
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
              <span className={styles.value}>
                {activeTrip?.driverName ?? "—"}
              </span>
            </div>

            {/* PAYMENT TYPE */}
            <div>
              <span className={styles.label}>Tipo de pago</span>
              <span className={styles.value}>{contract.paymentTypeName}</span>
            </div>
          </div>

          {/* ================== RIGHT DATE SUMMARY ================== */}
          <div className={styles.tripDates}>
            {activeTrip && (
              <TripDatesSummary
                departureDate={activeTrip.serviceDate}
                departureTime={activeTrip.originTime}
                returnDate={trips[1]?.serviceDate}
                returnTime={trips[1]?.originTime}
              />
            )}
          </div>
        </div>
      </div>

      {/* ================== SERVICES ================== */}
      <div className={styles.servicesSection}>
        {/* LEFT */}
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

        {/* MIDDLE */}
        <div className={styles.servicesMiddle}>
          <h3>Servicio {activeIndex + 1}</h3>
          <RouteTimeline locations={routeLocations} />
        </div>

        {/* RIGHT */}
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
