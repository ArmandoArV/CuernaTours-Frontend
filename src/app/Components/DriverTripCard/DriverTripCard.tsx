"use client";

import {
  Card,
  CardHeader,
  Text,
  Badge,
  Divider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { getStatusColor, getStatusTextColor } from "@/app/Utils/statusUtils";

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
    cursor: "pointer",
    transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    ":hover": {
      transform: "translateY(-3px)",
      boxShadow: tokens.shadow16,
    },
  },

  statusBar: {
    width: "6px",
  },

  success: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },

  warning: {
    backgroundColor: tokens.colorPaletteYellowBackground3,
  },

  danger: {
    backgroundColor: tokens.colorPaletteRedBackground3,
  },

  card: {
    flex: 1,
    backgroundColor: tokens.colorNeutralBackground2,
    padding: "16px",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  section: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "12px",
  },
});

export default function DriverTripCard({ trip, animationIndex = 0, onClick }: Props) {
  const styles = useStyles();

  return (
    <div
      className={`${styles.wrapper} anim-stagger`}
      style={{ "--i": animationIndex } as React.CSSProperties}
      onClick={() => onClick(trip)}
    >
      {/* LEFT STATUS BAR */}
      <div
        className={styles.statusBar}
        style={{ backgroundColor: getStatusTextColor(trip.Estatus) }}
      />

      {/* CARD CONTENT */}
      <Card className={styles.card} appearance="subtle">
        <div className={styles.headerRow}>
          <Text weight="semibold">{trip.Cliente}</Text>
          <span
            style={{
              backgroundColor: getStatusColor(trip.Estatus),
              color: getStatusTextColor(trip.Estatus),
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            {trip.Estatus}
          </span>
        </div>

        <div className={styles.section}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Origen
          </Text>
          <Text>{trip.Origen}</Text>
        </div>

        <div className={styles.section}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Destino
          </Text>
          <Text>{trip.Destino}</Text>
        </div>

        <Divider />

        <div className={styles.footerRow}>
          <div className={styles.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Fecha
            </Text>
            <Text>{trip.Fecha}</Text>
          </div>

          <div className={styles.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Unidad
            </Text>
            <Text>{trip.Unidad}</Text>
          </div>
        </div>
      </Card>
    </div>
  );
}