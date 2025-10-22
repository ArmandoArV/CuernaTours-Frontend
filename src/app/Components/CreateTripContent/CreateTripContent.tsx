"use client";
import { useState, useCallback, useEffect } from "react";
import styles from "./CreateOrderContent.module.css";
import InputComponent from "../InputComponent/InputComponent";
import SelectComponent from "../SelectComponent/SelectComponent";
import { ArrowHookUpLeftRegular } from "@fluentui/react-icons";
import Link from "next/link";
export default function CreateOrderContent() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [formData, setFormData] = useState({
    empresa: "",
    nombreContacto: "",
    primerApellido: "",
    segundoApellido: "",
    telefono: "",
    tieneWhatsapp: "Si",
    correoElectronico: "",
    comentarios: "",
    tipoPago: "",
    aplicaIva: "Si",
    costoViaje: "",
    llevaComision: "Si",
    nombreRecibeComision: "",
    tipoComision: "Porcentaje",
    porcentaje: "",
    montoArreglado: "",
    coordinadorViaje: "",
    observacionesInternas: "",
  });

  const handleInputChange =
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleRadioChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCancel = () => {
    // Handle cancel logic
    console.log("Cancel clicked");
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/dashboard" passHref>
            <button className={styles.backButton}>
              <ArrowHookUpLeftRegular color="black" />
            </button>
          </Link>
          <div>
            <h1 className={styles.title}>Crear contrato de orden</h1>
            <p className={styles.subtitle}>
              Los campos marcados con un asterisco rojo son obligatorios{" "}
              <strong style={{ color: "red" }}>* </strong>
            </p>
          </div>
        </div>
        <form className={styles.form}>
          <div className={styles.section}>
            <SelectComponent
              value={formData.empresa}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  empresa: e.target.value,
                }))
              }
              options={[
                { value: "empresa1", label: "Empresa 1" },
                { value: "empresa2", label: "Empresa 2" },
                { value: "empresa3", label: "Empresa 3" },
              ]}
              label="Empresa o cliente"
              placeholder="Seleccione..."
              required={true}
              className={styles.select}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <InputComponent
                type="text"
                value={formData.nombreContacto}
                onChange={handleInputChange("nombreContacto")}
                label={
                  <p>
                    Nombre del contacto{" "}
                    <strong style={{ color: "red" }}>*</strong>
                  </p>
                }
                placeholder=""
                className={styles.input}
              />
            </div>
            <div className={styles.col}>
              <InputComponent
                type="text"
                value={formData.primerApellido}
                onChange={handleInputChange("primerApellido")}
                label={
                  <p>
                    Primer apellido <strong style={{ color: "red" }}>*</strong>
                  </p>
                }
                placeholder=""
                className={styles.input}
              />
            </div>
            <div className={styles.col}>
              <InputComponent
                type="text"
                value={formData.segundoApellido}
                onChange={handleInputChange("segundoApellido")}
                label="Segundo apellido"
                placeholder=""
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <InputComponent
                type="tel"
                value={formData.telefono}
                onChange={handleInputChange("telefono")}
                label={
                  <p>
                    Teléfono <strong style={{ color: "red" }}>*</strong>
                  </p>
                }
                placeholder=""
                className={styles.input}
              />
            </div>
            <div className={styles.col}>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  ¿Tiene WhatsApp?
                  <strong style={{ color: "red" }}> *</strong>
                </label>
                <div className={styles.radioOptions}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="whatsapp"
                      value="Si"
                      checked={formData.tieneWhatsapp === "Si"}
                      onChange={() => handleRadioChange("tieneWhatsapp", "Si")}
                      className={styles.radioInput}
                    />
                    Sí
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="whatsapp"
                      value="No"
                      checked={formData.tieneWhatsapp === "No"}
                      onChange={() => handleRadioChange("tieneWhatsapp", "No")}
                      className={styles.radioInput}
                    />
                    No
                  </label>
                </div>
              </div>
            </div>
            <div className={styles.col}>
              <InputComponent
                type="email"
                value={formData.correoElectronico}
                onChange={handleInputChange("correoElectronico")}
                label="Correo electrónico"
                placeholder=""
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.textareaContainer}>
              <InputComponent
                type="text"
                value={formData.comentarios}
                onChange={handleInputChange("comentarios")}
                label="Comentarios del contacto"
                placeholder=""
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.section}>
            <SelectComponent
              value={formData.tipoPago}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tipoPago: e.target.value }))
              }
              options={[
                { value: "efectivo", label: "Efectivo" },
                { value: "transferencia", label: "Transferencia" },
                { value: "tarjeta", label: "Tarjeta" },
              ]}
              label="Tipo de pago"
              placeholder="Seleccione..."
              required={true}
              className={styles.select}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.col}>
              <div className={styles.radioGroupHorizontal}>
                <label className={styles.radioLabel}>
                  ¿Aplica IVA?
                  <strong style={{ color: "red" }}> *</strong>
                </label>
                <div className={styles.radioOptions}>
                  <label className={styles.radioLabelHorizontal}>
                    <input
                      type="radio"
                      name="iva"
                      value="Si"
                      className={styles.radioInput}
                      checked={formData.aplicaIva === "Si"}
                      onChange={() => handleRadioChange("aplicaIva", "Si")}
                    />
                    Sí
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="iva"
                      value="No"
                      className={styles.radioInput}
                      checked={formData.aplicaIva === "No"}
                      onChange={() => handleRadioChange("aplicaIva", "No")}
                    />
                    No
                  </label>
                </div>
              </div>
            </div>
            <div className={styles.col}>
              <InputComponent
                type="number"
                value={formData.costoViaje}
                onChange={handleInputChange("costoViaje")}
                label={
                  <p>
                    Costo del viaje <strong style={{ color: "red" }}>*</strong>
                  </p>
                }
                placeholder=""
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.radioGroupHorizontal}>
              <label className={styles.radioLabelHorizontal}>
                ¿Lleva comisión? <strong style={{ color: "red" }}>*</strong>
              </label>
              <div className={styles.radioOptions}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="comision"
                    value="Si"
                    className={styles.radioInput}
                    checked={formData.llevaComision === "Si"}
                    onChange={() => handleRadioChange("llevaComision", "Si")}
                  />
                  Sí
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="comision"
                    value="No"
                    className={styles.radioInput}
                    checked={formData.llevaComision === "No"}
                    onChange={() => handleRadioChange("llevaComision", "No")}
                  />
                  No
                </label>
              </div>
            </div>
          </div>

          {/* Conditional commission fields */}
          {formData.llevaComision === "Si" && (
            <>
              <div className={styles.section}>
                <InputComponent
                  type="text"
                  value={formData.nombreRecibeComision}
                  onChange={handleInputChange("nombreRecibeComision")}
                  label="Nombre de quien recibe la comisión *"
                  placeholder=""
                  className={styles.input}
                />
              </div>

              <div className={styles.section}>
                <div className={styles.radioGroup}>
                  <label className={styles.radioLabel}>
                    Tipo de comisión <strong style={{ color: "red" }}>*</strong>
                  </label>
                  <div className={styles.radioOptions}>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="tipoComision"
                        value="Porcentaje"
                        className={styles.radioInput}
                        checked={formData.tipoComision === "Porcentaje"}
                        onChange={() =>
                          handleRadioChange("tipoComision", "Porcentaje")
                        }
                      />
                      Porcentaje
                    </label>
                    <label className={styles.radioOption}>
                      <input
                        type="radio"
                        name="tipoComision"
                        value="Arreglada"
                        className={styles.radioInput}
                        checked={formData.tipoComision === "Arreglada"}
                        onChange={() =>
                          handleRadioChange("tipoComision", "Arreglada")
                        }
                      />
                      Arreglada
                    </label>
                  </div>
                </div>
              </div>

              <div className={styles.row}>
                {formData.tipoComision === "Porcentaje" && (
                  <div className={styles.col}>
                    <InputComponent
                      type="number"
                      value={formData.porcentaje}
                      onChange={handleInputChange("porcentaje")}
                      label="Porcentaje (%)"
                      placeholder=""
                      className={styles.input}
                    />
                  </div>
                )}
                <div className={styles.col}>
                  <InputComponent
                    type="number"
                    value={formData.montoArreglado}
                    onChange={handleInputChange("montoArreglado")}
                    label={
                      formData.tipoComision === "Porcentaje"
                        ? "Monto del porcentaje ($)"
                        : "Monto de la comisión ($)"
                    }
                    placeholder=""
                    className={styles.input}
                  />
                </div>
              </div>
            </>
          )}

          <div className={styles.section}>
            <SelectComponent
              value={formData.coordinadorViaje}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  coordinadorViaje: e.target.value,
                }))
              }
              options={[
                { value: "coordinador1", label: "Coordinador 1" },
                { value: "coordinador2", label: "Coordinador 2" },
                { value: "coordinador3", label: "Coordinador 3" },
              ]}
              label="Coordinador del viaje"
              placeholder="Seleccione..."
              className={styles.select}
            />
          </div>

          <div className={styles.section}>
            <div className={styles.textareaContainer}>
              <label className={styles.textareaLabel}>
                Observaciones internas
              </label>
              <textarea
                value={formData.observacionesInternas}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    observacionesInternas: e.target.value,
                  }))
                }
                className={styles.textarea}
                rows={4}
              />
            </div>
          </div>

          <div className={styles.buttonContainer}>
            <button
              type="button"
              onClick={handleCancel}
              className={`${styles.button} ${styles.cancelButton}`}
            >
              Cancelar
            </button>
            <Link href="/dashboard/createOrder/createTrip" passHref>
              <button
                type="button"
                className={`${styles.button} ${styles.nextButton}`}
              >
                Siguiente
              </button>
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
