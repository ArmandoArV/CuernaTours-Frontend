"use client";
import { useState } from "react";
import styles from "./CreateOrderContent.module.css";
import InputComponent from "../InputComponent/InputComponent";
import SelectComponent from "../SelectComponent/SelectComponent";
import { ArrowBounceFilled } from "@fluentui/react-icons";

export default function CreateOrderContent() {
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

  const handleNext = () => {
    // Handle next/submit logic
    console.log("Form data:", formData);
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => window.history.back()}
          >
            <ArrowBounceFilled color="#ffff" />
          </button>
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
                label="Nombre(s) del contacto *"
                placeholder=""
                className={styles.input}
              />
            </div>
            <div className={styles.col}>
              <InputComponent
                type="text"
                value={formData.primerApellido}
                onChange={handleInputChange("primerApellido")}
                label="Primer apellido *"
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
                label="Teléfono *"
                placeholder=""
                className={styles.input}
              />
            </div>
            <div className={styles.col}>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>¿Tiene WhatsApp? *</label>
                <div className={styles.radioOptions}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="whatsapp"
                      value="Si"
                      checked={formData.tieneWhatsapp === "Si"}
                      onChange={() => handleRadioChange("tieneWhatsapp", "Si")}
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
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>¿Aplica IVA? *</label>
                <div className={styles.radioOptions}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="iva"
                      value="Si"
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
                label="Costo del viaje *"
                placeholder=""
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>¿Lleva comisión? *</label>
              <div className={styles.radioOptions}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="comision"
                    value="Si"
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
                    checked={formData.llevaComision === "No"}
                    onChange={() => handleRadioChange("llevaComision", "No")}
                  />
                  No
                </label>
              </div>
            </div>
          </div>

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
            <button
              type="button"
              onClick={handleNext}
              className={`${styles.button} ${styles.nextButton}`}
            >
              Siguiente
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
