"use client";

import {
  Card,
  Text,
  Divider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { EyeRegular } from "@fluentui/react-icons";
import { getStatusTextColor } from "@/app/Utils/statusUtils";

interface Props {
  trip: any;
  animationIndex?: number;
  onClick: (trip: any) => void;
}

const useStyles = makeStyles({
  wrapper: {
    display: "flex",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "16px",
    transition:
      "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    ":hover": {
      transform: "translateY(-3px)",
      boxShadow: tokens.shadow16,
    },
  },

  statusBar: {
    width: "32px",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    writingMode: "vertical-rl",
    textOrientation: "mixed",
    transform: "rotate(180deg)",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
    userSelect: "none",
  },

  card: {
    flex: 1,
    backgroundColor: tokens.colorNeutralBackground2,
    padding: "16px",
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
  },

  headerRow: {
    marginBottom: "12px",
    width: "100%",
  },

  twoColRow: {
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "8px",
    width: "100%",
    marginBottom: "8px",
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
    wordBreak: "break-word",
    marginBottom: "8px",
  },

  sectionHalf: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    minWidth: 0,
    wordBreak: "break-word",
    flex: "1 1 45%",
  },

  actionsRow: {
    display: "flex",
    justifyContent: "space-around",
    gap: "8px",
    width: "100%",
    marginTop: "4px",
  },

  actionBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    borderRadius: "0",
    border: "none",
    backgroundColor: "transparent",
    color: tokens.colorNeutralForeground3,
    fontWeight: "500",
    fontSize: "13px",
    cursor: "pointer",
    transition: "color 0.15s",
    ":hover": {
      color: tokens.colorNeutralForeground1,
    },
  },
});

export default function DriverTripCard({
  trip,
  animationIndex = 0,
  onClick,
}: Props) {
  const styles = useStyles();

  const tripData = trip._tripData || {};
  const contractData = trip._contractData || {};
  const stops = tripData.stops || [];
  const passengers = tripData.passengers ?? "-";
  const tripCount = contractData.trips?.length || 1;
  const tipoServicio = tripCount > 1 ? "Redondo" : "Sencillo";

  const fechaHora = trip.Hora ? `${trip.Fecha}, ${trip.Hora}` : trip.Fecha;

  return (
    <div
      className={`${styles.wrapper} anim-stagger`}
      style={{ "--i": animationIndex } as React.CSSProperties}
    >
      {/* LEFT STATUS BAR with vertical text */}
      <div
        className={styles.statusBar}
        style={{ backgroundColor: getStatusTextColor(trip.Estatus) }}
      >
        {trip.Estatus}
      </div>

      {/* CARD CONTENT */}
      <Card className={styles.card} appearance="subtle">
        {/* Header: Client name */}
        <div className={styles.headerRow}>
          <Text weight="semibold">{trip.Cliente}</Text>
        </div>

        {/* Fecha + Tipo servicio */}
        <div className={styles.twoColRow}>
          <div className={styles.sectionHalf}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Fecha
            </Text>
            <Text>{fechaHora}</Text>
          </div>
          <div className={styles.sectionHalf}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Tipo servicio
            </Text>
            <Text>{tipoServicio}</Text>
          </div>
        </div>

        {/* Origen */}
        <div className={styles.section}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Origen
          </Text>
          <Text>{trip.Origen}</Text>
        </div>

        {/* Stops */}
        {stops.map((stop: any, idx: number) => (
          <div className={styles.section} key={stop.stop_id ?? idx}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Parada {idx + 1}
            </Text>
            <Text>{stop.place?.name || stop.description || "-"}</Text>
          </div>
        ))}

        {/* Destino */}
        <div className={styles.section}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Destino
          </Text>
          <Text>{trip.Destino}</Text>
        </div>

        {/* Unidad + No. Pasajeros */}
        <div className={styles.twoColRow}>
          <div className={styles.sectionHalf}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Unidad
            </Text>
            <Text>{trip.Unidad}</Text>
          </div>
          <div className={styles.sectionHalf}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              No. Pasajeros
            </Text>
            <Text>{passengers}</Text>
          </div>
        </div>

        <Divider />

        {/* Action buttons */}
        <div className={styles.actionsRow}>
          <button
            className={styles.actionBtn}
            onClick={(e) => {
              e.stopPropagation();
              onClick(trip);
            }}
          >
            <EyeRegular fontSize={16} />
            Ver detalles
          </button>
        </div>
      </Card>
    </div>
  );
}
