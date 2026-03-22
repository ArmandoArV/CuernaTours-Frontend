"use client";
import React from "react";
import styles from "./DetailsPanel.module.css";
import DateDisplayComponent from "@/app/Components/DateDisplayComponent";
import { Contract, type ContractData } from "@/app/Types/ContractTypes";
import { FaWhatsapp, FaEnvelope } from "react-icons/fa";

export interface DetailsPanelProps {
  data: any;
  loading?: boolean;
  error?: string | null;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({
  data,
  loading,
  error,
}) => {
  if (loading) return <div className={styles.loading}>Cargando...</div>;
  if (error || !data)
    return <div className={styles.error}>Error al cargar datos</div>;

  const contract = new Contract(data as ContractData);
  const phone = contract.contactPhone || "—";
  const email = contract.contactEmail || "—";
  return (
    <div className={styles.container}>
      {/* HEADER SECTION */}
      <div className={styles.header}>
        <div className={styles.clientInfo}>
          <h2 className={styles.clientName}>
            {contract.clientName || "Nombre del cliente"}
          </h2>
          <div className={styles.contactRow}>
            <span className={styles.phone}>
              <FaWhatsapp className={styles.whatsappIcon} /> {phone}
            </span>
            <span className={styles.divider}>|</span>
            <span className={styles.email}>
              <FaEnvelope className={styles.emailIcon} />
              {email}
            </span>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.tripTypeBox}>
            <label>Tipo de viaje</label>
            <strong>{contract.tripTypeSummary || "Redondo"}</strong>
          </div>
          <div className={styles.datesWrapper}>
            {contract.serviceDate.start && (
              <div className={styles.serviceTypeBox}>
                <span className={styles.datesLabel}>Ida</span>
                <DateDisplayComponent
                  date={contract.serviceDate.start.toISOString()}
                />
              </div>
            )}

            {contract.serviceDate.end && (
              <>
                <div className={styles.verticalDivider} />
                <div className={styles.serviceTypeBox}>
                  <span className={styles.datesLabel}>Regreso</span>
                  <DateDisplayComponent
                    date={contract.serviceDate.end.toISOString()}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className={styles.mainGrid}>
        {/* LEFT COLUMN: Metadata */}
        <div className={styles.column}>
          <div className={styles.infoGroup}>
            <label>No. pasajeros</label>
            <span>{contract.passengersSummary}</span>
          </div>
          <div className={styles.infoGroup}>
            <label>No. unidades</label>
            <span>{contract.vehicleCount}</span>
          </div>
          <div className={styles.infoGroup}>
            <label>Coordinador</label>
            <span>{contract.coordinatorName || "—"}</span>
          </div>
          <div className={styles.infoGroup}>
            <label>Tipo de pago</label>
            <span>{contract.paymentTypeName || "Efectivo"}</span>
          </div>
          <div className={styles.infoGroup}>
            <label>Estatus del cobro</label>
            <span>Pagado/Por cobrar</span>
          </div>
        </div>

        {/* MIDDLE COLUMN: Locations */}
        <div className={styles.column}>
          {contract.trips.trips.map((trip, idx) => (
            <div key={idx} className={styles.locationGroup}>
              <div className={styles.infoGroup}>
                <label>Origen</label>
                <p className={styles.addressText}>
                  {trip.originAddress ||
                    "Nombre calle #, Colonia, Ciudad, Estado"}
                </p>
              </div>
              <div className={styles.infoGroup}>
                <label>Destino</label>
                <p className={styles.addressText}>
                  {trip.destinationAddress ||
                    "Nombre calle #, Colonia, Ciudad, Estado"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: Flight & Observations */}
        <div className={styles.column}>
          <div className={styles.infoGroup}>
            <label>Es vuelo:</label>
            <p className={styles.addressText}>
              No. vuelo, Aerolinea, Aeropuerto - Terminal
            </p>
          </div>
          <div className={styles.infoGroup}>
            <label>Observaciones:</label>
            <p className={styles.observationsText}>
              {contract.observations ||
                "Ninguna observación registrada para este contrato."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsPanel;
