"use client";

import {
  Card,
  Text,
  Badge,
  Divider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { AttachRegular } from "@fluentui/react-icons";

interface Props {
  spending: any;
  onClick: (spending: any) => void;
}

const useStyles = makeStyles({
  wrapper: {
    display: "flex",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "16px",
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
    ":hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    },
    ":active": {
      transform: "translateY(0)",
    },
  },

  statusBar: {
    width: "6px",
  },

  pending: {
    backgroundColor: tokens.colorPaletteYellowBackground3,
  },

  approved: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },

  rejected: {
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

export default function DriverSpendingsCard({ spending, onClick }: Props) {
  const styles = useStyles();

  const getStatusClass = () => {
    switch (spending.Estatus) {
      case "Aprobado":
        return styles.approved;
      case "Rechazado":
        return styles.rejected;
      default:
        return styles.pending;
    }
  };

  const getBadgeColor = () => {
    switch (spending.Estatus) {
      case "Aprobado":
        return "success";
      case "Rechazado":
        return "danger";
      default:
        return "warning";
    }
  };

  return (
    <div className={styles.wrapper} onClick={() => onClick(spending)}>
      {/* Status Bar */}
      <div className={`${styles.statusBar} ${getStatusClass()}`} />

      <Card className={styles.card} appearance="subtle">
        <div className={styles.headerRow}>
          <Text weight="semibold">{spending.Categoría}</Text>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {spending._raw?.files?.length > 0 && (
              <Badge
                appearance="outline"
                color="informative"
                icon={<AttachRegular />}
                size="small"
              >
                {spending._raw.files.length}
              </Badge>
            )}
            <Badge appearance="filled" color={getBadgeColor()}>
              {spending.Estatus}
            </Badge>
          </div>
        </div>

        <div className={styles.section}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Descripción
          </Text>
          <Text>{spending.Descripción}</Text>
        </div>

        <Divider />

        <div className={styles.footerRow}>
          <div className={styles.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Fecha
            </Text>
            <Text>{spending.Fecha}</Text>
          </div>

          <div className={styles.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Monto
            </Text>
            <Text>{spending.Monto}</Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
