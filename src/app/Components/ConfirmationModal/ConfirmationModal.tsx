"use client";
import React, { useState } from "react";
import styles from "./ConfirmationModal.module.css";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import RouteTimeline, {
  RouteLocation,
} from "@/app/Components/RouteTimeline/RouteTimeline";

interface Parada {
  id: string;
  nombreLugar: string;
  calle: string;
  numero: string;
  colonia: string;
  codigoPostal: string;
  ciudad: string;
  estado: string;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sendNotification: boolean) => void;
  orderData: any;
  tripFormData: any;
  paradas: Parada[];
  lugares?: Array<{ value: string; label: string }>;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  orderData,
  tripFormData,
  paradas,
  lugares = [],
}: ConfirmationModalProps) {
  const [sendNotification, setSendNotification] = useState(true);

  if (!isOpen) return null;
  const origenLabel =
    lugares.find((l) => l.value === tripFormData?.origenNombreLugar)?.label ||
    tripFormData?.origenNombreLugar ||
    "Origen";

  const destinoLabel =
    lugares.find((l) => l.value === tripFormData?.destinoNombreLugar)?.label ||
    tripFormData?.destinoNombreLugar ||
    "Destino";

  const routeLocations: RouteLocation[] = [
    {
      label: origenLabel,
      type: "origin",
    },

    ...(paradas ?? []).map<RouteLocation>((parada) => ({
      id: parada.id,
      label:
        lugares.find((l) => l.value === parada.nombreLugar)?.label ||
        parada.nombreLugar,
      type: "stop",
    })),

    {
      label: destinoLabel,
      type: "destination",
    },
  ];
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>

        <h2 className={styles.modalTitle}>Resumen de la orden</h2>

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
                  {tripFormData?.idaPasajeros ||
                    tripFormData?.numeroPasajeros ||
                    "0"}
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.summaryLabel}>No. unidades</div>
                <div className={styles.summaryValue}>
                  {tripFormData?.unidadAsignada ? "1" : "0"}
                </div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.summaryLabel}>Coordinador</div>
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

        {/* BUTTONS */}
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
      </div>
    </div>
  );
}
