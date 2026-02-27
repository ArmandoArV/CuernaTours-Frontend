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

interface Props {
  trip: any;
  onClick: (trip: any) => void;
}

const useStyles = makeStyles({
  wrapper: {
    display: "flex",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "16px",
    cursor: "pointer",
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

export default function DriverTripCard({ trip, onClick }: Props) {
  const styles = useStyles();

  const getStatusColorClass = () => {
    switch (trip.Estatus) {
      case "Finalizado":
        return styles.success;
      case "Cancelado":
        return styles.danger;
      default:
        return styles.warning;
    }
  };

  return (
    <div className={styles.wrapper} onClick={() => onClick(trip)}>
      {/* LEFT STATUS BAR */}
      <div
        className={`${styles.statusBar} ${getStatusColorClass()}`}
      />

      {/* CARD CONTENT */}
      <Card className={styles.card} appearance="subtle">
        <div className={styles.headerRow}>
          <Text weight="semibold">{trip.Cliente}</Text>
          <Badge appearance="filled" color="brand">
            {trip.Estatus}
          </Badge>
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