"use client";
import React from "react";
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
            value={selection.quantity.toString()}
            onChange={(e) => onChange(selection.id, "quantity", parseInt(e.target.value) || 1)}
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
            icon={<DeleteRegular color="#1A2E47" />}
            className={`${styles.button} ${styles.deleteButton}`}
          />
        )}
        <ButtonComponent
          type="button"
          onClick={onAdd}
          icon={<AddFilled />}
          className={`${styles.button} ${styles.addButton}`}
        />
      </div>
    </div>
  );
}
