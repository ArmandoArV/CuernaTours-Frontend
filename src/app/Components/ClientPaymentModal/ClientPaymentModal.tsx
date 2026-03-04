"use client";

import React, { useEffect, useState } from "react";
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
  Dropdown,
  Option,
  Spinner,
  Text,
  makeStyles,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { paymentsService } from "@/services/api/payments.service";
import { contractsService, ContractWithDetails } from "@/services/api/contracts.service";
import { referenceService, type PaymentTypeReference } from "@/services/api/reference.service";
import { showSuccessAlert, showErrorAlert } from "@/app/Utils/AlertUtil";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("ClientPaymentModal");

interface ClientPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: number | null;
  onPaymentRegistered?: () => void;
}

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: "520px",
    width: "100%",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
  },
  summaryCard: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    ...shorthands.padding(tokens.spacingVerticalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  remaining: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightBold,
  },
});

const ClientPaymentModal: React.FC<ClientPaymentModalProps> = ({
  isOpen,
  onClose,
  contractId,
  onPaymentRegistered,
}) => {
  const styles = useStyles();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contractData, setContractData] = useState<ContractWithDetails | null>(null);
  const [paymentTypes, setPaymentTypes] = useState<PaymentTypeReference[]>([]);
  const [existingPayments, setExistingPayments] = useState<{ total_paid: number }>({ total_paid: 0 });

  // Form
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentTypeId, setPaymentTypeId] = useState<number>(0);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && contractId) {
      loadData(contractId);
    } else {
      resetForm();
    }
  }, [isOpen, contractId]);

  const resetForm = () => {
    setAmount("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentTypeId(0);
    setReferenceNumber("");
    setNotes("");
    setFormErrors({});
    setError(null);
    setContractData(null);
  };

  const loadData = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const [contract, prefillable] = await Promise.all([
        contractsService.getById(id),
        referenceService.getPrefillableData(),
      ]);
      setContractData(contract);
      setPaymentTypes(prefillable.payment_types || []);

      // Try to load payment summary
      try {
        const summary = await paymentsService.getSummary(id);
        setExistingPayments({ total_paid: summary.total_paid || 0 });
      } catch {
        // Summary endpoint may not exist — default to 0
        setExistingPayments({ total_paid: 0 });
      }
    } catch (err: any) {
      log.error("Error loading contract data:", err);
      setError(err.message || "Error al cargar datos del contrato");
    } finally {
      setLoading(false);
    }
  };

  const contractAmount = Number(contractData?.amount || 0);
  const totalPaid = existingPayments.total_paid;
  const remaining = contractAmount - totalPaid;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      errs.amount = "Ingresa un monto válido";
    }
    if (!paymentDate) {
      errs.paymentDate = "Selecciona una fecha";
    }
    if (!paymentTypeId) {
      errs.paymentTypeId = "Selecciona un tipo de pago";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !contractId) return;
    setSaving(true);
    try {
      await paymentsService.create(contractId, {
        payment_amount: parseFloat(amount),
        payment_date: paymentDate,
        payment_type_id: paymentTypeId,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
      });
      showSuccessAlert("Pago registrado", "El pago del cliente fue registrado correctamente", () => {
        onPaymentRegistered?.();
        onClose();
      });
    } catch (err: any) {
      log.error("Error saving payment:", err);
      showErrorAlert("Error", err?.message || "No se pudo registrar el pago");
    } finally {
      setSaving(false);
    }
  };

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
            Registrar Pago del Cliente
          </DialogTitle>

          <DialogContent>
            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                <Spinner label="Cargando información..." />
              </div>
            ) : error ? (
              <Text style={{ color: "red" }}>{error}</Text>
            ) : (
              <div className={styles.form}>
                {/* Contract Summary */}
                <div className={styles.summaryCard}>
                  <div className={styles.summaryRow}>
                    <Text weight="semibold">Contrato:</Text>
                    <Text>#{contractId}</Text>
                  </div>
                  <div className={styles.summaryRow}>
                    <Text weight="semibold">Monto total:</Text>
                    <Text>${contractAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</Text>
                  </div>
                  <div className={styles.summaryRow}>
                    <Text weight="semibold">Pagado:</Text>
                    <Text>${totalPaid.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</Text>
                  </div>
                  <div className={styles.summaryRow}>
                    <Text weight="semibold">Restante:</Text>
                    <Text
                      className={styles.remaining}
                      style={{ color: remaining > 0 ? "#dc2626" : "#059669" }}
                    >
                      ${remaining.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                    </Text>
                  </div>
                </div>

                {/* Amount */}
                <Field
                  label="Monto del pago"
                  required
                  validationMessage={formErrors.amount}
                >
                  <Input
                    type="number"
                    value={amount}
                    onChange={(_, d) => {
                      setAmount(d.value);
                      setFormErrors((p) => ({ ...p, amount: "" }));
                    }}
                    placeholder="0.00"
                    contentBefore={<Text>$</Text>}
                  />
                </Field>

                {/* Date + Payment Type */}
                <div className={styles.row}>
                  <Field
                    label="Fecha de pago"
                    required
                    validationMessage={formErrors.paymentDate}
                  >
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(_, d) => {
                        setPaymentDate(d.value);
                        setFormErrors((p) => ({ ...p, paymentDate: "" }));
                      }}
                    />
                  </Field>
                  <Field
                    label="Tipo de pago"
                    required
                    validationMessage={formErrors.paymentTypeId}
                  >
                    <Dropdown
                      value={
                        paymentTypes.find((pt) => pt.payment_type_id === paymentTypeId)?.name || ""
                      }
                      placeholder="Seleccionar"
                      onOptionSelect={(_, d) => {
                        setPaymentTypeId(Number(d.optionValue));
                        setFormErrors((p) => ({ ...p, paymentTypeId: "" }));
                      }}
                    >
                      {paymentTypes.map((pt) => (
                        <Option key={pt.payment_type_id} value={String(pt.payment_type_id)}>
                          {pt.name}
                        </Option>
                      ))}
                    </Dropdown>
                  </Field>
                </div>

                {/* Reference Number */}
                <Field label="Número de referencia">
                  <Input
                    value={referenceNumber}
                    onChange={(_, d) => setReferenceNumber(d.value)}
                    placeholder="Ej. transferencia, folio, etc."
                  />
                </Field>

                {/* Notes */}
                <Field label="Notas">
                  <Input
                    value={notes}
                    onChange={(_, d) => setNotes(d.value)}
                    placeholder="Notas adicionales..."
                  />
                </Field>
              </div>
            )}
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
              onClick={handleSave}
              disabled={saving || loading || !!error}
              style={{ backgroundColor: "#96781a", borderColor: "#96781a" }}
            >
              {saving ? <Spinner size="tiny" /> : "Registrar Pago"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default ClientPaymentModal;
