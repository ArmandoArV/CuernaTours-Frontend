"use client";

import React, { useState } from "react";
import {
  Card,
  Text,
  Divider,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import {
  EyeRegular,
  PersonAddRegular,
  EditRegular,
  MoneyRegular,
  WalletRegular,
  ArrowSyncRegular,
  DismissRegular,
} from "@fluentui/react-icons";
import DetailsPanel from "@/app/Components/DetailsPanel/DetailsPanel";
import { contractsService } from "@/services/api/contracts.service";
import { Logger } from "@/app/Utils/Logger";
import { getStatusTextColor } from "@/app/Utils/statusUtils";

const log = Logger.getLogger("ContractCard");

interface ContractCardProps {
  contract: any;
  animationIndex?: number;
  onEdit?: (contract: any) => void;
  onAssignDriver?: (contract: any) => void;
  onPayDriver?: (contract: any) => void;
  onRegisterPayment?: (contract: any) => void;
  onViewDetails?: (contract: any) => void;
  onCancel?: (contract: any) => void;
  onChangeStatus?: (contract: any) => void;
  showActions?: boolean;
  showViewDetails?: boolean;
}

const useStyles = makeStyles({
  wrapper: {
    display: "flex",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "16px",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
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
    flexWrap: "wrap",
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

  actionBtnDanger: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 12px",
    borderRadius: "0",
    border: "none",
    backgroundColor: "transparent",
    color: "#c62828",
    fontWeight: "500",
    fontSize: "13px",
    cursor: "pointer",
    transition: "color 0.15s",
    ":hover": {
      color: "#b71c1c",
    },
  },

  paymentBadge: {
    padding: "2px 10px",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "600",
    display: "inline-block",
  },
});

export default function ContractCard({
  contract,
  animationIndex = 0,
  onEdit,
  onAssignDriver,
  onPayDriver,
  onRegisterPayment,
  onViewDetails,
  onCancel,
  onChangeStatus,
  showActions = true,
  showViewDetails = false,
}: ContractCardProps) {
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(false);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const status = contract["Estatus"] || "";
  const statusTextColor = getStatusTextColor(status);
  const isPaid = contract["Estado de Pago"] === "Pagado";

  // Derive trip-level data
  const trips = contract._trips || contract._contractData?.trips || [];
  const firstTrip = trips[0] || {};
  const stops = firstTrip.stops || [];
  const passengers = firstTrip.passengers ?? "-";
  const tipoServicio = trips.length > 1 ? "Redondo" : "Sencillo";
  const fechaHora = contract["Horario"]
    ? `${contract["Fecha"] || "—"}, ${contract["Horario"]}`
    : contract["Fecha"] || "—";

  const handleViewDetails = async () => {
    if (onViewDetails) {
      onViewDetails(contract);
      return;
    }

    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    setIsExpanded(true);
    setDetailsLoading(true);

    const id = contract.contract_id || contract.id;
    if (id) {
      try {
        const data = await contractsService.getContractDetails(Number(id));
        setDetailsData(data);
      } catch (err) {
        log.error("Error fetching contract details:", err);
        setDetailsData(contract);
      }
    } else {
      setDetailsData(contract);
    }
    setDetailsLoading(false);
  };

  return (
    <div
      className={`${styles.wrapper} anim-stagger`}
      style={{ "--i": animationIndex } as React.CSSProperties}
    >
      {/* LEFT STATUS BAR with vertical text */}
      <div className={styles.statusBar} style={{ backgroundColor: statusTextColor }}>
        {status}
      </div>

      {/* CARD CONTENT */}
      <Card className={styles.card} appearance="subtle">
        {/* Header: Client name */}
        <div className={styles.headerRow}>
          <Text weight="semibold">{contract["Empresa O Cliente"]}</Text>
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
          <Text>{contract["Origen"] || "—"}</Text>
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
          <Text>{contract["Destino"] || "—"}</Text>
        </div>

        {/* Unidad + Chofer */}
        <div className={styles.twoColRow}>
          <div className={styles.sectionHalf}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Unidad
            </Text>
            <Text>{contract["Unidad"] || "—"}</Text>
          </div>
          <div className={styles.sectionHalf}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Chofer
            </Text>
            <Text>{contract["Chofer"] || "—"}</Text>
          </div>
        </div>

        {/* No. Pasajeros + Asignados */}
        <div className={styles.twoColRow}>
          <div className={styles.sectionHalf}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              No. Pasajeros
            </Text>
            <Text>{passengers}</Text>
          </div>
          <div className={styles.sectionHalf}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Asignados
            </Text>
            <Text>{contract["Asignados"] || "0/0"}</Text>
          </div>
        </div>

        {/* Estado de Pago */}
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

        {/* Action Buttons */}
        {(showActions || showViewDetails) && (
          <>
            <Divider />
            <div className={styles.actionsRow}>
              {showViewDetails && (
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewDetails();
                  }}
                >
                  <EyeRegular fontSize={16} />
                  Ver detalles
                </button>
              )}
              {onAssignDriver && (
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAssignDriver(contract);
                  }}
                >
                  <PersonAddRegular fontSize={16} />
                  Asignar
                </button>
              )}
              {onEdit && (
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(contract);
                  }}
                >
                  <EditRegular fontSize={16} />
                  Editar
                </button>
              )}
              {onPayDriver && (
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onPayDriver(contract);
                  }}
                >
                  <MoneyRegular fontSize={16} />
                  Pagar Chofer
                </button>
              )}
              {onRegisterPayment && (
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRegisterPayment(contract);
                  }}
                >
                  <WalletRegular fontSize={16} />
                  Registrar Pago
                </button>
              )}
              {onChangeStatus && (
                <button
                  className={styles.actionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChangeStatus(contract);
                  }}
                >
                  <ArrowSyncRegular fontSize={16} />
                  Cambiar Estatus
                </button>
              )}
              {onCancel && (
                <button
                  className={styles.actionBtnDanger}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancel(contract);
                  }}
                >
                  <DismissRegular fontSize={16} />
                  Cancelar
                </button>
              )}
            </div>
          </>
        )}

        {/* Inline Details Panel (for Chofer role) */}
        {isExpanded && (
          <>
            <Divider />
            <DetailsPanel data={detailsData} loading={detailsLoading} />
          </>
        )}
      </Card>
    </div>
  );
}
