"use client";

import styles from "./ContractDetailsPanel.module.css";
import { Contract } from "@/app/Types/ContractTypes";
import RouteTimeline, {
  RouteLocation,
} from "@/app/Components/RouteTimeline/RouteTimeline";

interface Props {
  contract: Contract;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoItem}>
      <span className={styles.label}>{label}:</span>
      <span className={styles.value}>{value || "—"}</span>
    </div>
  );
}

function DateBlock({
  label,
  dateStr,
  time,
}: {
  label: string;
  dateStr?: string;
  time?: string;
}) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const day = date.getUTCDate();
  const month = date.toLocaleString("es-MX", {
    month: "short",
    timeZone: "UTC",
  });

  return (
    <div className={styles.dateBlock}>
      <span className={styles.dateLabel}>{label}:</span>
      <strong className={styles.dateDay}>
        {day} {month}
      </strong>
      {time && <small className={styles.dateTime}>{time.slice(0, 5)}</small>}
    </div>
  );
}

export default function ContractDetailsPanel({ contract }: Props) {
  const trips = contract.trips.toArray();
  const activeTrip = trips[0];
  const returnTrip = trips.length > 1 ? trips[1] : null;

  const routeLocations: RouteLocation[] = activeTrip
    ? [
        { label: activeTrip.originName, type: "origin" },
        ...activeTrip.sortedStops.map((stop) => ({
          id: stop.stop_id ?? `stop-${stop.stop_order}`,
          label:
            stop.place?.name ||
            stop.place_name ||
            stop.description ||
            [stop.place?.address || stop.address, stop.city]
              .filter(Boolean)
              .join(", ") ||
            `Parada ${stop.stop_order}`,
          type: "stop" as const,
        })),
        { label: activeTrip.destinationName, type: "destination" },
      ]
    : [];

  const flightDisplay = activeTrip?.hasFlightInfo
    ? [
        activeTrip.flightNumber,
        activeTrip.airline,
        [activeTrip.flightOrigin].filter(Boolean).join(", "),
      ]
        .filter(Boolean)
        .join(", ")
    : "No";

  return (
    <div className={styles.container}>
      {/* ============ TOP CARD ============ */}
      <div className={styles.topCard}>
        {/* Header row: client + summary */}
        <div className={styles.headerRow}>
          <div className={styles.clientBlock}>
            <h2 className={styles.clientName}>{contract.clientName}</h2>
            <div className={styles.contactLine}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="#25D366"
                className={styles.whatsappIcon}
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>{contract.contactPhone || "—"}</span>
              <span className={styles.contactSep}>|</span>
              <span>{contract.contactEmail || "—"}</span>
            </div>
          </div>

          <div className={styles.summaryRow}>
            <InfoItem
              label="Costo del viaje"
              value={`$${contract.amount.toLocaleString("es-MX")}`}
            />
            <InfoItem
              label="Estatus pago"
              value={contract.isPaid ? "Pagado" : "Pendiente"}
            />
            <InfoItem
              label="Tipo de servicio"
              value={trips.length > 1 ? "Redondo" : "Sencillo"}
            />

            <DateBlock
              label="Ida"
              dateStr={activeTrip?.serviceDate}
              time={activeTrip?.originTime}
            />
            <DateBlock
              label="Regreso"
              dateStr={returnTrip?.serviceDate}
              time={returnTrip?.originTime}
            />
          </div>
        </div>

        <hr className={styles.divider} />

        {/* Details grid */}
        <div className={styles.detailsGrid}>
          {/* Column 1 */}
          <div className={styles.column}>
            <InfoItem
              label="No. pasajeros"
              value={String(activeTrip?.passengers ?? "—")}
            />
            <InfoItem
              label="No. unidades"
              value={String(activeTrip?.units?.length ?? "—")}
            />
            <InfoItem label="Coordinador" value={contract.coordinatorName} />
            <InfoItem label="Tipo de pago" value={contract.paymentTypeName} />
            <InfoItem label="Fecha del pago" value="—" />
          </div>

          {/* Column 2 */}
          <div className={styles.column}>
            <InfoItem
              label="Aplica IVA"
              value={contract.IVA >= 1 ? "Sí" : "No"}
            />
            <InfoItem
              label="Comisión"
              value={contract.hasCommission ? "Sí" : "N/A"}
            />
            <InfoItem label="Porcentaje de la comisión" value="—" />
            <InfoItem label="Monto comisión" value="—" />
            <InfoItem label="Chofer entregó efectivo" value="—" />
          </div>

          {/* Column 3 */}
          <div className={styles.column}>
            <InfoItem label="Origen" value={activeTrip?.originAddress ?? "—"} />
            <InfoItem
              label="Destino"
              value={activeTrip?.destinationAddress ?? "—"}
            />
          </div>

          {/* Column 4 */}
          <div className={styles.column}>
            <InfoItem label="Unidad" value={activeTrip?.vehicleType ?? "—"} />
            <InfoItem label="Chofer" value={activeTrip?.driverName || "—"} />
            <InfoItem label="Es vuelo" value={flightDisplay} />
          </div>
        </div>
      </div>

      {/* ============ BOTTOM CARD ============ */}
      <div className={styles.bottomCard}>
        <div className={styles.routeSection}>
          <h3 className={styles.sectionTitle}>Servicio</h3>
          <RouteTimeline locations={routeLocations} />
        </div>

        <div className={styles.observationsSection}>
          <div className={styles.observationBlock}>
            <span className={styles.obsLabel}>Observaciones internas:</span>
            <p className={styles.obsText}>
              {contract.internalObservations || "—"}
            </p>
          </div>

          <div className={styles.observationBlock}>
            <span className={styles.obsLabel}>
              Observaciones para el cliente:
            </span>
            <p className={styles.obsTextHighlight}>
              {contract.observations || "—"}
            </p>
          </div>

          <div className={styles.observationBlock}>
            <span className={styles.obsLabel}>
              Observaciones para el chofer:
            </span>
            <p className={styles.obsTextHighlight}>
              {activeTrip?.internalNotes || "—"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
