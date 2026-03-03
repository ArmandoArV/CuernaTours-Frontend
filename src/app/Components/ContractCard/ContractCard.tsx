"use client";

import {
  Card,
  Text,
  Divider,
  makeStyles,
  tokens,
  Button,
} from "@fluentui/react-components";
import {
  PersonAddRegular,
  EditRegular,
  MoneyRegular,
} from "@fluentui/react-icons";

interface ContractCardProps {
  contract: any;
  onEdit?: (contract: any) => void;
  onAssignDriver?: (contract: any) => void;
  onPayDriver?: (contract: any) => void;
  showActions?: boolean;
}

const useStyles = makeStyles({
  wrapper: {
    display: "flex",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "12px",
    boxShadow: tokens.shadow4,
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

  section: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },

  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "4px",
  },

  badge: {
    color: "white",
    padding: "2px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    whiteSpace: "nowrap",
  },

  paymentBadge: {
    padding: "2px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
  },

  actionsRow: {
    display: "flex",
    gap: "8px",
    marginTop: "4px",
    flexWrap: "wrap",
  },
});

const getStatusColor = (status: string) => {
  const key = (status || "").toLowerCase();
  switch (key) {
    case "pendiente":
      return "#19A5EB";
    case "en curso":
      return "#4D5DBC";
    case "finalizado":
      return "#80C26C";
    case "cancelado":
      return "#C7C7C7";
    case "agendado":
      return "#19A5EB";
    case "por asignar":
      return "#F86E24";
    case "proximo":
      return "#C89600";
    default:
      return "#C89600";
  }
};

export default function ContractCard({
  contract,
  onEdit,
  onAssignDriver,
  onPayDriver,
  showActions = true,
}: ContractCardProps) {
  const styles = useStyles();

  const status = contract["Estatus"] || "";
  const statusColor = getStatusColor(status);
  const isPaid = contract["Estado de Pago"] === "Pagado";

  return (
    <div className={styles.wrapper}>
      <div className={styles.statusBar} style={{ backgroundColor: statusColor }} />

      <Card className={styles.card} appearance="subtle">
        {/* Header: Client + Status */}
        <div className={styles.headerRow}>
          <Text weight="semibold" size={400}>
            {contract["Empresa O Cliente"]}
          </Text>
          <span className={styles.badge} style={{ backgroundColor: statusColor }}>
            {status}
          </span>
        </div>

        <Divider />

        {/* Info Grid */}
        <div className={styles.infoGrid}>
          <div className={styles.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Fecha
            </Text>
            <Text>{contract["Fecha"] || "—"}</Text>
          </div>

          <div className={styles.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Horario
            </Text>
            <Text>{contract["Horario"] || "—"}</Text>
          </div>

          <div className={styles.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Asignados
            </Text>
            <Text>{contract["Asignados"] || "0/0"}</Text>
          </div>

          <div className={styles.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Monto
            </Text>
            <Text weight="semibold">{contract["Monto"] || "—"}</Text>
          </div>
        </div>

        {/* Payment Status */}
        <div className={styles.footerRow}>
          <div className={styles.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Estado de Pago
            </Text>
            <span
              className={styles.paymentBadge}
              style={{
                backgroundColor: isPaid ? "#E6F4EA" : "#FFF3E0",
                color: isPaid ? "#2E7D32" : "#E65100",
              }}
            >
              {contract["Estado de Pago"] || "—"}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <>
            <Divider />
            <div className={styles.actionsRow}>
              {onAssignDriver && (
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<PersonAddRegular />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignDriver(contract);
                  }}
                >
                  Asignar
                </Button>
              )}
              {onEdit && (
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<EditRegular />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(contract);
                  }}
                >
                  Editar
                </Button>
              )}
              {onPayDriver && (
                <Button
                  appearance="subtle"
                  size="small"
                  icon={<MoneyRegular />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPayDriver(contract);
                  }}
                >
                  Pagar
                </Button>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
