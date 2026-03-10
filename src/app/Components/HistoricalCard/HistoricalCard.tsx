"use client";

import {
  Card,
  Text,
  Divider,
  makeStyles,
  tokens,
  Button,
} from "@fluentui/react-components";
import { EyeFilled } from "@fluentui/react-icons";

interface HistoricalCardProps {
  trip: any;
  animationIndex?: number;
  onViewDetails?: (trip: any) => void;
}

const useStyles = makeStyles({
  wrapper: {
    display: "flex",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "12px",
    boxShadow: tokens.shadow4,
    transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    ":hover": {
      transform: "translateY(-3px)",
      boxShadow: tokens.shadow16,
    },
  },
  statusBar: {
    width: "6px",
    flexShrink: 0,
  },
  card: {
    flex: 1,
    backgroundColor: tokens.colorNeutralBackground1,
    padding: "16px",
    gap: "8px",
    display: "flex",
    flexDirection: "column",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  badge: {
    color: "white",
    padding: "2px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },
  actionsRow: {
    display: "flex",
    gap: "8px",
    marginTop: "4px",
    flexWrap: "wrap",
  },
});

import { getStatusColor, getStatusTextColor } from "@/app/Utils/statusUtils";

export default function HistoricalCard({ trip, animationIndex = 0, onViewDetails }: HistoricalCardProps) {
  const styles = useStyles();
  const status = trip["Estatus"] || "";
  const statusColor = getStatusColor(status);
  const statusTextColor = getStatusTextColor(status);

  return (
    <div
      className={`${styles.wrapper} anim-stagger`}
      style={{ "--i": animationIndex } as React.CSSProperties}
    >
      <div className={styles.statusBar} style={{ backgroundColor: statusTextColor }} />
      <Card className={styles.card} appearance="subtle">
        <div className={styles.headerRow}>
          <Text weight="semibold" size={400}>
            {trip["Empresa o Cliente"] || "—"}
          </Text>
          <span className={styles.badge} style={{ backgroundColor: statusColor, color: statusTextColor }}>
            {status}
          </span>
        </div>

        <Divider />

        <div className={styles.infoGrid}>
          <div className={styles.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Origen
            </Text>
            <Text>{trip["Origen"] || "—"}</Text>
          </div>
          <div className={styles.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Destino
            </Text>
            <Text>{trip["Destino"] || "—"}</Text>
          </div>
          <div className={styles.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Fecha
            </Text>
            <Text>{trip["Fecha"] || "—"}</Text>
          </div>
          <div className={styles.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Unidad
            </Text>
            <Text>{trip["Unidad"] || "—"}</Text>
          </div>
          <div className={styles.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Chofer
            </Text>
            <Text>{trip["Chofer"] || "—"}</Text>
          </div>
        </div>

        {onViewDetails && (
          <>
            <Divider />
            <div className={styles.actionsRow}>
              <Button
                appearance="subtle"
                size="small"
                icon={<EyeFilled />}
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(trip);
                }}
              >
                Ver Detalles
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
