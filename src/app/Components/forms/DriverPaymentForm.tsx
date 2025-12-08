import React from "react";
import { DriverPaymentFormState } from "@/app/hooks/useDriverPaymentForm";
import styles from "./DriverPaymentForm.module.css";
import InputComponent from "@/app/Components/InputComponent/InputComponent";
import ButtonComponent from "@/app/Components/ButtonComponent/ButtonComponent";

interface DriverPaymentFormProps {
  tripCost: number;
  vouchers: number;
  driverExpenses: number;
  driverName: string;
  formState: DriverPaymentFormState;
  onRadioChange: (value: boolean) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

const DriverPaymentForm: React.FC<DriverPaymentFormProps> = ({
  tripCost,
  vouchers,
  driverExpenses,
  driverName,
  formState,
  onRadioChange,
  onInputChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <div className={styles.container}>
      <div className={styles.modalContent}>
        <h1 className={styles.title}>Pago del chofer</h1>

        <div className={styles.infoGrid}>
          <div>
            Costo del viaje: <span>${tripCost}</span>
          </div>
          <div>
            Vales: <span>${vouchers}</span>
          </div>
          <div>
            Gastos del chofer: <span>${driverExpenses}</span>
          </div>
        </div>

        <form onSubmit={onSubmit}>
          <div className={styles.formGroup}>
            <div className={styles.radioGroup}>
              <label className={styles.label}>
                ¿Se recibió efectivo del chofer?{" "}
                <span className={styles.required}>*</span>
              </label>
              <div className={styles.radioContainer}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="cashReceived"
                    className={styles.radioInput}
                    checked={formState.cashReceived === true}
                    onChange={() => onRadioChange(true)}
                  />
                  <span>Si</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="cashReceived"
                    className={styles.radioInput}
                    checked={formState.cashReceived === false}
                    onChange={() => onRadioChange(false)}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {formState.cashReceived && (
              <div className={styles.cashAmountContainer}>
                <InputComponent
                  type="text"
                  id="cashAmount"
                  value={formState.cashAmount}
                  onChange={onInputChange}
                  label="Monto del efectivo"
                  labelClassName={styles.label}
                />
              </div>
            )}
          </div>

          <div className={styles.inputGroup}>
            <InputComponent
              type="text"
              id="driverName"
              value={driverName}
              onChange={() => {}}
              label="Nombre del chofer"
              labelClassName={styles.label}
              disabled={true}
            />
          </div>

          <div className={styles.inputGroupLarge}>
            <InputComponent
              type="text"
              id="driverPayment"
              value={formState.driverPayment}
              onChange={onInputChange}
              label="Monto de pago del chofer"
              labelClassName={styles.label}
            />
          </div>
          <div className={styles.footer}>
            <div className={styles.buttonGroup}>
              <ButtonComponent
                text="Cancelar"
                type="cancel"
                onClick={onCancel}
                className={styles.cancelButton}
              />
              <ButtonComponent
                text="Guardar"
                type="submit"
                className={styles.saveButton}
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverPaymentForm;
