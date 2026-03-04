"use client";
import React, { useState, useEffect } from "react";
import styles from "./UnidadItem.module.css";
import SelectComponent from "../SelectComponent/SelectComponent";
import InputComponent from "../InputComponent/InputComponent";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { DeleteRegular, AddFilled } from "@fluentui/react-icons";
import type { UnitTypeSelection } from "@/app/hooks/useUnidades";

interface UnidadItemProps {
  selection: UnitTypeSelection;
  index: number;
  tiposUnidad: Array<{ value: string; label: string; capacity?: number }>;
  onRemove: (id: string) => void;
  onChange: (id: string, field: "vehicleTypeId" | "quantity", value: string | number) => void;
  onAdd: () => void;
  canDelete: boolean;
}

export default function UnidadItem({
  selection,
  index,
  tiposUnidad,
  onRemove,
  onChange,
  onAdd,
  canDelete,
}: UnidadItemProps) {
  const [quantityStr, setQuantityStr] = useState(selection.quantity.toString());

  useEffect(() => {
    setQuantityStr(selection.quantity.toString());
  }, [selection.quantity]);

  return (
    <div className={styles.unidadContainer}>
      <div className={styles.section}>
        <div className={styles.typeSelect}>
          <SelectComponent
            label={`Tipo de unidad ${index + 1} *`}
            options={[
              { value: "", label: "Seleccionar tipo" },
              ...tiposUnidad.map((t) => ({
                value: t.value,
                label: t.capacity ? `${t.label} (${t.capacity} pax)` : t.label,
              })),
            ]}
            value={selection.vehicleTypeId}
            onChange={(e) => onChange(selection.id, "vehicleTypeId", e.target.value)}
            className={styles.input}
          />
        </div>
        <div className={styles.quantityInput}>
          <InputComponent
            type="number"
            value={quantityStr}
            onChange={(e) => setQuantityStr(e.target.value)}
            onBlur={(e) => {
              const num = parseInt(e.target.value);
              const clamped = isNaN(num) || num < 1 ? 1 : num;
              setQuantityStr(clamped.toString());
              onChange(selection.id, "quantity", clamped);
            }}
            label="Cantidad"
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.buttonRow}>
        {canDelete && (
          <ButtonComponent
            type="button"
            onClick={() => onRemove(selection.id)}
            icon={<DeleteRegular color="white" />}
            className={`${styles.button} ${styles.deleteButton}`}
            style={{ backgroundColor: "#1a2e47", borderColor: "#1a2e47", color: "white" }}
          />
        )}
        <ButtonComponent
          type="button"
          onClick={onAdd}
          icon={<AddFilled />}
          className={`${styles.button} ${styles.addButton}`}
          style={{ backgroundColor: "#1a2e47", borderColor: "#1a2e47", color: "white" }}
        />
      </div>
    </div>
  );
}
