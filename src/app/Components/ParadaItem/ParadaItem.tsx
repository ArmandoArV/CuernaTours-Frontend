"use client";
import React from "react";
import styles from "./ParadaItem.module.css";
import SearchableSelectComponent, { SearchableSelectOption } from "../SearchableSelectComponent/SearchableSelectComponent";
import InputComponent from "../InputComponent/InputComponent";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { DeleteRegular, AddFilled } from "@fluentui/react-icons";
import type { Parada } from "@/app/hooks/useParadas";

interface ParadaItemProps {
  parada: Parada;
  index: number;
  onRemove: (id: string) => void;
  onChange: (id: string, field: keyof Parada, value: string) => void;
  onPlaceSelect: (id: string, placeId: string, option?: SearchableSelectOption) => void;
  onPlaceSearch: (query: string) => Promise<SearchableSelectOption[]>;
  onCreatePlace: (context: "origen" | "destino") => void;
  onAdd: () => void;
}

export default function ParadaItem({
  parada,
  index,
  onRemove,
  onChange,
  onPlaceSelect,
  onPlaceSearch,
  onCreatePlace,
  onAdd,
}: ParadaItemProps) {
  return (
    <div className={styles.paradaContainer}>
      <div className={styles.section}>
        <SearchableSelectComponent
          label={`Parada`}
          value={parada.nombreLugar}
          onChange={(value, option) => onPlaceSelect(parada.id, value, option)}
          onSearch={onPlaceSearch}
          onCreate={() => onCreatePlace("destino")}
          placeholder="Buscar lugar..."
          className={styles.input}
        />
      </div>

      <div className={styles.section}>
        <InputComponent
          type="text"
          value={parada.description || ""}
          onChange={(e) => onChange(parada.id, "description", e.target.value)}
          label="Descripción de la parada"
          placeholder="Ej: Parar por café en algún Oxxo"
          className={styles.input}
        />
      </div>

      <div className={styles.section}>
        <InputComponent
          type="text"
          value={parada.calle}
          onChange={(e) => onChange(parada.id, "calle", e.target.value)}
          label={<p>Calle <strong style={{ color: "red" }}>*</strong></p>}
          containerClassName={styles.streetInputContainer}
        />
        <InputComponent
          type="text"
          value={parada.numero}
          onChange={(e) => onChange(parada.id, "numero", e.target.value)}
          label="Número"
          containerClassName={styles.numberInputContainer}
        />
      </div>

      <div className={styles.section}>
        <InputComponent
          type="text"
          value={parada.colonia}
          onChange={(e) => onChange(parada.id, "colonia", e.target.value)}
          label="Colonia"
          className={styles.input}
          containerClassName={styles.streetInputContainer}
        />
        <InputComponent
          type="text"
          value={parada.codigoPostal}
          onChange={(e) => onChange(parada.id, "codigoPostal", e.target.value)}
          label="Código postal"
          className={styles.input}
          containerClassName={styles.numberInputContainer}
        />
      </div>

      <div className={styles.section}>
        <InputComponent
          type="text"
          value={parada.ciudad}
          onChange={(e) => onChange(parada.id, "ciudad", e.target.value)}
          label={<p>Ciudad <strong style={{ color: "red" }}>*</strong></p>}
          className={styles.input}
        />
        <InputComponent
          type="text"
          value={parada.estado}
          onChange={(e) => onChange(parada.id, "estado", e.target.value)}
          label={<p>Estado <strong style={{ color: "red" }}>*</strong></p>}
          className={styles.input}
        />
      </div>

      <div className={styles.buttonRow}>
        <ButtonComponent
          type="button"
          onClick={() => onRemove(parada.id)}
          icon={<DeleteRegular 
          color="#1A2E47"
          />}
          className={`${styles.button} ${styles.deleteButton}`}
        />
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
