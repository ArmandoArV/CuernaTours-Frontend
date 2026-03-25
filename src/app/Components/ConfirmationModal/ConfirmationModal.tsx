"use client";
import React, { useState } from "react";
import styles from "./ConfirmationModal.module.css";
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  makeStyles,
} from "@fluentui/react-components";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import RouteTimeline, {
  RouteLocation,
} from "@/app/Components/RouteTimeline/RouteTimeline";
import type { Parada } from "@/app/hooks/useParadas";

import type { UnitAssignment } from "@/app/hooks/useUnidades";

const useDialogStyles = makeStyles({
  surface: {
    maxWidth: "650px",
    width: "100%",
    maxHeight: "85vh",
    overflowY: "auto",
    padding: "0",
  },
});

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sendNotification: boolean) => void;
  orderData: any;
  tripFormData: any;
  paradas: Parada[];
  unitAssignments?: UnitAssignment[];
  lugares?: Array<{ value: string; label: string }>;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  orderData,
  tripFormData,
  paradas,
  unitAssignments = [],
  lugares = [],
}: ConfirmationModalProps) {
  const [sendNotification, setSendNotification] = useState(true);
  const dialogStyles = useDialogStyles();

  const buildAddressLabel = (prefix: "origen" | "destino", defaultLabel: string) => {
    // Prefer stored display name (set when place was selected)
    const displayName = tripFormData?.[`${prefix}NombreDisplay`];
    if (displayName) return displayName;

    // Try to find in lugares list by ID
    const placeId = tripFormData?.[`${prefix}NombreLugar`];
    if (placeId) {
      const found = lugares.find((l) => String(l.value) === String(placeId));
      if (found) return found.label;
    }

    // Build from address fields as last resort
    const parts = [
      tripFormData?.[`${prefix}Calle`],
      tripFormData?.[`${prefix}Colonia`],
      tripFormData?.[`${prefix}Ciudad`],
      tripFormData?.[`${prefix}Estado`],
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(", ");

    return defaultLabel;
  };

  const origenLabel = buildAddressLabel("origen", "Origen");

  const destinoLabel = buildAddressLabel("destino", "Destino");

  const routeLocations: RouteLocation[] = [
    {
      label: origenLabel,
      type: "origin",
    },

    ...(paradas ?? []).map<RouteLocation>((parada) => {
      const paradaLabel =
        lugares.find((l) => l.value === parada.nombreLugar)?.label ||
        parada.description ||
        [parada.calle, parada.ciudad].filter(Boolean).join(", ") ||
        parada.nombreLugar ||
        "Parada";
      return { id: parada.id, label: paradaLabel, type: "stop" };
    }),

    {
      label: destinoLabel,
      type: "destination",
    },
  ];
  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => { if (!data.open) onClose(); }}>
      <DialogSurface className={dialogStyles.surface}>
        <DialogBody>
          <DialogTitle style={{ paddingLeft: "1.5rem" }}>Resumen de la orden</DialogTitle>

          <DialogContent>
            <div className={styles.modalContent}>
              <div className={styles.topSection}>
                {/* LEFT: CLIENT INFO */}
                <div className={styles.leftColumn}>
                  <div className={styles.infoItem}>
                    <div className={styles.summaryLabel}>Empresa/Cliente</div>
                    <div className={styles.summaryValue}>
                      {orderData?.empresaNombre ||
                        orderData?.empresa ||
                        "Cliente no seleccionado"}
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.summaryLabel}>Nombre del contacto</div>
                    <div className={styles.summaryValue}>
                      {orderData?.nombreContacto || "Nombre del contacto"}
                    </div>
                  </div>
                </div>

                {/* RIGHT: COST */}
                <div className={styles.rightColumn}>
                  <div className={styles.summaryLabel}>Costo del viaje</div>
                  <div className={styles.costValue}>
                    ${orderData?.costoViaje || "0000"}
                  </div>
                </div>
              </div>

              <div className={styles.middleSection}>
                {/* LEFT: TRIP DETAILS */}
                <div className={styles.leftColumn}>
                  <div className={styles.infoItem}>
                    <div className={styles.summaryLabel}>No. pasajeros</div>
                    <div className={styles.summaryValue}>
                      {tripFormData?.numeroPasajeros || "0"}
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.summaryLabel}>No. unidades</div>
                    <div className={styles.summaryValue}>
                      {unitAssignments.length || "0"}
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.summaryLabel}>Chofer Principal</div>
                    <div className={styles.summaryValue}>
                      {orderData?.coordinadorNombre || "Sin asignar"}
                    </div>
                  </div>

                  <div className={styles.infoItem}>
                    <div className={styles.summaryLabel}>Fecha</div>
                    <div className={styles.summaryValue}>
                      {tripFormData?.idaFecha
                        ? `${tripFormData.idaFecha}, ${tripFormData.idaHora?.padStart(
                            2,
                            "0",
                          )}:${tripFormData.idaMinutos?.padStart(2, "0")}:00 ${
                            tripFormData.idaAmPm || ""
                          }`
                        : "00/00/0000, 00:00:00"}
                      <br />
                      {tripFormData?.tipoViaje === "redondo"
                        ? tripFormData.regresoFecha
                          ? `${
                              tripFormData.regresoFecha
                            }, ${tripFormData.regresoHora?.padStart(
                              2,
                              "0",
                            )}:${tripFormData.regresoMinutos?.padStart(
                              2,
                              "0",
                            )}:00 ${tripFormData.regresoAmPm || ""}`
                          : "Sin fecha de regreso"
                        : "SOLO IDA"}
                    </div>
                  </div>
                </div>

                {/* RIGHT: ROUTE BUBBLES */}
                <div className={styles.rightColumn}>
                  <RouteTimeline locations={routeLocations} />
                </div>
              </div>

              {/* NOTIFICATIONS / CHECKBOXES */}
              <div className={styles.summarySection}>
                <div className={styles.radioBlock}>
                  <span className={styles.radioTitle}>
                    Mandar notificación al cliente{" "}
                    <strong style={{ color: "red" }}>*</strong>
                  </span>
                  <div className={styles.radioOptions}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="notif"
                        checked={sendNotification === true}
                        onChange={() => setSendNotification(true)}
                      />
                      <span>Sí</span>
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="notif"
                        checked={sendNotification === false}
                        onChange={() => setSendNotification(false)}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>

                <div className={styles.checkboxRow}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" />
                    <span>Guardar como viaje frecuente</span>
                  </label>
                </div>
              </div>
            </div>
          </DialogContent>

          {/* BUTTONS */}
          <DialogActions>
            <div className={styles.modalActions}>
              <ButtonComponent
                type="button"
                onClick={onClose}
                text="Editar"
                className={`${styles.button} ${styles.editButton}`}
              />
              <ButtonComponent
                type="button"
                onClick={() => onConfirm(sendNotification)}
                text="Confirmar"
                className={`${styles.button} ${styles.confirmButton}`}
              />
            </div>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
