"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Input,
  Field,
  Textarea,
  Spinner,
  Text,
  makeStyles,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import { Dismiss24Regular, GasPumpRegular } from "@fluentui/react-icons";
import { valesService } from "@/services/api/vales.service";
import { showSuccessAlert, showErrorAlert } from "@/app/Utils/AlertUtil";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("AddValeModal");

interface AddValeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripData: any | null;
  onValeCreated?: () => void;
}

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: "480px",
    width: "100%",
    ...shorthands.borderRadius("16px"),
  },
  headerIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    ...shorthands.borderRadius("12px"),
    backgroundColor: "#f0f4e8",
    marginBottom: tokens.spacingVerticalM,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    marginTop: tokens.spacingVerticalM,
  },
  tripInfo: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  tripInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  amountInput: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
  },
});

const AddValeModal: React.FC<AddValeModalProps> = ({
  isOpen,
  onClose,
  tripData,
  onValeCreated,
}) => {
  const styles = useStyles();
  const [saving, setSaving] = useState(false);

  const [amount, setAmount] = useState("");
  const [concepto, setConcepto] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setAmount("");
    setConcepto("");
    setFormErrors({});
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      errs.amount = "Ingresa un monto válido mayor a $0";
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await valesService.requestVale({
        amount: parseFloat(amount),
        request_notes: concepto.trim(),
      });

      showSuccessAlert(
        "Vale solicitado",
        "Tu solicitud de vale fue enviada correctamente",
        () => {
          onValeCreated?.();
          onClose();
        },
      );
    } catch (err: any) {
      log.error("Error creating vale:", err);
      showErrorAlert("Error", err?.message || "No se pudo solicitar el vale");
    } finally {
      setSaving(false);
    }
  };

  const tripId = tripData?.["ID Viaje"] || tripData?._tripData?.trip_id || "-";
  const cliente = tripData?.Cliente || "-";

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle
            action={
              <Button
                appearance="subtle"
                aria-label="cerrar"
                icon={<Dismiss24Regular />}
                onClick={onClose}
              />
            }
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div className={styles.headerIcon}>
                <GasPumpRegular fontSize={24} style={{ color: "#5a7a2d" }} />
              </div>
              Solicitar Vale
            </div>
          </DialogTitle>

          <DialogContent>
            <div className={styles.form}>
              {/* Trip context — only shown when launched from a trip */}
              {tripData && (
                <div className={styles.tripInfo}>
                  <div className={styles.tripInfoRow}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      Viaje
                    </Text>
                    <Text weight="semibold">#{tripId}</Text>
                  </div>
                  <div className={styles.tripInfoRow}>
                    <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
                      Cliente
                    </Text>
                    <Text>{cliente}</Text>
                  </div>
                </div>
              )}

              {/* Monto */}
              <Field
                label="Monto ($)"
                required
                validationMessage={formErrors.amount}
                validationState={formErrors.amount ? "error" : "none"}
              >
                <Input
                  type="number"
                  value={amount}
                  onChange={(_, d) => {
                    setAmount(d.value);
                    setFormErrors((p) => ({ ...p, amount: "" }));
                  }}
                  placeholder="0.00"
                  contentBefore={<Text weight="semibold">$</Text>}
                  appearance="outline"
                />
              </Field>

              {/* Concepto */}
              <Field
                label="Concepto (opcional)"
                validationMessage={formErrors.concepto}
                validationState={formErrors.concepto ? "error" : "none"}
              >
                <Textarea
                  value={concepto}
                  onChange={(_, d) => {
                    setConcepto(d.value);
                    setFormErrors((p) => ({ ...p, concepto: "" }));
                  }}
                  placeholder="Ej. Caseta autopista México-Cuernavaca, gasolina, etc."
                  resize="vertical"
                  rows={3}
                />
              </Field>
            </div>
          </DialogContent>

          <DialogActions>
            <Button
              appearance="secondary"
              onClick={onClose}
              disabled={saving}
              style={{ color: "#96781a", borderColor: "#96781a" }}
            >
              Cancelar
            </Button>
            <Button
              appearance="primary"
              onClick={handleSubmit}
              disabled={saving}
              icon={saving ? <Spinner size="tiny" /> : undefined}
              style={{ backgroundColor: "#96781a", borderColor: "#96781a" }}
            >
              {saving ? "Enviando..." : "Solicitar Vale"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default AddValeModal;
