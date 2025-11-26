"use client";
import React from "react";
import styles from "./ConfirmationModal.module.css";
import ButtonComponent from "../ButtonComponent/ButtonComponent";

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
  onConfirm: () => void;
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
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        
        <button className={styles.closeButton} onClick={onClose}>×</button>

        <h2 className={styles.modalTitle}>Resumen de la orden</h2>

        <div className={styles.modalContent}>

          <div className={styles.topSection}>
            {/* LEFT: CLIENT INFO */}
            <div className={styles.leftColumn}>
              <div className={styles.infoItem}>
                <div className={styles.summaryLabel}>Empresa/Cliente</div>
                <div className={styles.summaryValue}>{orderData?.nombreContacto || "Nombre del contacto"}</div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.summaryLabel}>Nombre del contacto</div>
                <div className={styles.summaryValue}>
                  {orderData?.nombreContacto || "000 000 0000"}
                </div>
              </div>
            </div>

            {/* RIGHT: COST */}
            <div className={styles.rightColumn}>
              <div className={styles.summaryLabel}>Costo del viaje</div>
              <div className={styles.costValue}>${orderData?.costoViaje || "0000"}</div>
            </div>
          </div>

          <div className={styles.middleSection}>
            {/* LEFT: TRIP DETAILS */}
            <div className={styles.leftColumn}>
              <div className={styles.infoItem}>
                <div className={styles.summaryLabel}>No. pasajeros</div>
                <div className={styles.summaryValue}>{tripFormData?.numeroPasajeros || "0"}</div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.summaryLabel}>No. unidades</div>
                <div className={styles.summaryValue}>{"2"}</div>
              </div>

              <div className={styles.infoItem}>
                <div className={styles.summaryLabel}>Fecha</div>
                <div className={styles.summaryValue}>
                  {tripFormData?.idaFecha || "00/00/0000, 00:00"}
                  <br />
                  {tripFormData?.tipoViaje === "roundTrip" && tripFormData?.regresoFecha
                    ? tripFormData.regresoFecha
                    : "00/00/00, 00:00"}
                </div>
              </div>
            </div>

            {/* RIGHT: ROUTE BUBBLES */}
            <div className={styles.rightColumn}>
              <div className={styles.routeSection}>
                {/* Origin */}
                <div className={styles.routeItem}>
                  <div className={styles.routeBubble}>1</div>
                  <span className={styles.routeText}>
                    {lugares.find(l => l.value === tripFormData?.origenNombreLugar)?.label || tripFormData?.origenNombreLugar || "Origen"}
                  </span>
                </div>
                
                {/* Paradas (stops) */}
                {paradas && paradas.length > 0 && paradas.map((parada, index) => (
                  <div key={parada.id} className={styles.routeItem}>
                    <div className={styles.routeBubble}>{index + 2}</div>
                    <span className={styles.routeText}>{parada.nombreLugar}</span>
                  </div>
                ))}
                
                {/* Destination */}
                <div className={styles.routeItem}>
                  <div className={styles.routeBubble}>{paradas.length + 2}</div>
                  <span className={styles.routeText}>
                    {console.log("DEBUG - destinoNombreLugar:", tripFormData?.destinoNombreLugar)}
                    {console.log("DEBUG - lugares array:", lugares)}
                    {console.log("DEBUG - Found lugar:", lugares.find(l => l.value === tripFormData?.destinoNombreLugar))}
                    {lugares.find(l => l.value === tripFormData?.destinoNombreLugar)?.label || tripFormData?.destinoNombreLugar || "Destino"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* NOTIFICATIONS / CHECKBOXES */}
          <div className={styles.summarySection}>

            <div className={styles.radioBlock}>
              <span className={styles.radioTitle}>Mandar notificación al cliente *</span>
              <label className={styles.radioOption}>
                <input type="radio" name="notif" defaultChecked />
                <span>Sí</span>
              </label>
              <label className={styles.radioOption}>
                <input type="radio" name="notif" />
                <span>No</span>
              </label>
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
            onClick={onConfirm}
            text="Confirmar"
            className={`${styles.button} ${styles.confirmButton}`}
          />
        </div>

      </div>
    </div>
  );
}
