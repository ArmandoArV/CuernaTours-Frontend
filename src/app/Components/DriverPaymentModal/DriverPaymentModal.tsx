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
  Label,
  RadioGroup,
  Radio,
  Text,
  Spinner,
  makeStyles,
  tokens,
  shorthands,
} from "@fluentui/react-components";
import {
  Dismiss24Regular,
  ChevronLeft24Regular,
  ChevronRight24Regular,
} from "@fluentui/react-icons";
import { tripsService, usersService } from "@/services/api";
import { contractsService, ContractWithDetails } from "@/services/api/contracts.service";
import { ContractTrip } from "@/app/backend_models/trip.model";
import { User } from "@/app/backend_models/user.model";
import { showSuccessAlert, showErrorAlert } from "@/app/Utils/AlertUtil";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("DriverPaymentModal");

interface DriverPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string | null;
}

const useStyles = makeStyles({
  dialogSurface: {
    maxWidth: "600px",
    width: "100%",
  },
  contentContainer: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
    ...shorthands.padding(tokens.spacingVerticalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  summaryItem: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  paginationContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    ...shorthands.margin(tokens.spacingVerticalL, 0),
  },
  radioGroup: {
    display: "flex",
    flexDirection: "row",
    gap: tokens.spacingHorizontalL,
  },
});

const DriverPaymentModal: React.FC<DriverPaymentModalProps> = ({
  isOpen,
  onClose,
  tripId,
}) => {
  const styles = useStyles();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [tripData, setTripData] = useState<ContractTrip | null>(null);
  const [contractData, setContractData] = useState<ContractWithDetails | null>(null);
  const [driverData, setDriverData] = useState<User | null>(null);

  // Form states - Step 1 (Internal Driver)
  const [internalCashReceived, setInternalCashReceived] = useState<"yes" | "no">("yes");
  const [internalCashAmount, setInternalCashAmount] = useState("");
  const [internalPaymentAmount, setInternalPaymentAmount] = useState("");

  // Form states - Step 2 (External Provider)
  const [externalCashReceived, setExternalCashReceived] = useState<"yes" | "no">("yes");
  const [externalCashAmount, setExternalCashAmount] = useState("");
  const [externalPaymentAmount, setExternalPaymentAmount] = useState("");

  useEffect(() => {
    if (isOpen && tripId) {
      loadData(tripId);
    } else {
      resetState();
    }
  }, [isOpen, tripId]);

  const resetState = () => {
    setStep(1);
    setTripData(null);
    setContractData(null);
    setDriverData(null);
    
    setInternalCashReceived("yes");
    setInternalCashAmount("");
    setInternalPaymentAmount("");
    
    setExternalCashReceived("yes");
    setExternalCashAmount("");
    setExternalPaymentAmount("");
    
    setError(null);
  };

  const loadData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      let trip: ContractTrip | null = null;

      // Try fetching as trip ID first
      try {
        trip = await tripsService.getById(Number(id));
      } catch {
        // If that fails, try fetching trips by contract ID
        try {
          const trips = await tripsService.getByContractId(Number(id));
          if (trips && trips.length > 0) {
            trip = trips[0];
          }
        } catch {
          // Both approaches failed
        }
      }

      if (!trip) {
        setError("No se encontró el viaje asociado");
        return;
      }

      setTripData(trip);

      // Fetch contract details for cost
      if (trip.contract_id) {
        try {
          const contract = await contractsService.getById(trip.contract_id);
          setContractData(contract);
        } catch (contractErr: any) {
          log.error("Error loading contract:", contractErr);
        }
      }

      // Fetch driver details
      const driverId = trip.driver_id; 
      if (driverId) {
        try {
          const driver = await usersService.getById(driverId);
          setDriverData(driver);
        } catch (driverErr: any) {
          log.error("Error loading driver:", driverErr);
        }
      }
      
    } catch (err: any) {
      log.error("Error loading data:", err);
      setError(err.message || "Error al cargar los datos del viaje");
    } finally {
      setLoading(false);
    }
  };

  const getDriverName = () => {
    if (driverData) {
      return `${driverData.name} ${driverData.first_lastname || ""}`.trim();
    }
    return "Sin asignar";
  };

  const getExternalDriverName = () => {
    if (tripData && (tripData as any).external_driver) {
        return (tripData as any).external_driver.driver_name;
    }
    return "N/A";
  };

  const handleNext = () => {
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSave = async () => {
    if (!tripData || !tripData.contract_id) return;

    setLoading(true);
    try {
      const contractId = tripData.contract_id;
      const payments: { driver_id: number; driver_type: "internal" | "external"; amount: number }[] = [];
      
      // Process Internal Driver Payment
      if (internalPaymentAmount && parseFloat(internalPaymentAmount) > 0) {
        if (!tripData.driver_id) {
          showErrorAlert("Error", "No se puede registrar el pago: no hay chofer interno asignado al viaje.");
          setLoading(false);
          return;
        }
        payments.push({
          driver_id: tripData.driver_id,
          driver_type: "internal" as const,
          amount: parseFloat(internalPaymentAmount),
        });
      }

      // Process External Provider Payment
      if (externalPaymentAmount && parseFloat(externalPaymentAmount) > 0) {
        const extId = tripData.external_driver_id || (tripData as any).external_driver?.id;
        if (!extId) {
          showErrorAlert("Error", "No se puede registrar el pago: no hay proveedor externo asignado al viaje.");
          setLoading(false);
          return;
        }
        payments.push({
          driver_id: extId,
          driver_type: "external" as const,
          amount: parseFloat(externalPaymentAmount),
        });
      }

      if (payments.length === 0) {
        showErrorAlert("Validación", "Debe ingresar al menos un monto de pago válido.");
        setLoading(false);
        return;
      }

      // 1. Process Payments
      await contractsService.payDrivers(contractId, {
        payments,
        payment_date: new Date().toISOString(),
      });

      // 2. Process Cash Received (Internal)
      if (internalCashReceived === "yes" && internalCashAmount) {
        await contractsService.receiveMoneyFromDriver(contractId, {
          amount_received: parseFloat(internalCashAmount),
          received_date: new Date().toISOString(),
          notes: "Efectivo recibido del chofer interno",
        });
      }

      // 3. Process Cash Received (External)
      if (externalCashReceived === "yes" && externalCashAmount) {
        await contractsService.receiveMoneyFromDriver(contractId, {
          amount_received: parseFloat(externalCashAmount),
          received_date: new Date().toISOString(),
          notes: "Efectivo recibido del proveedor externo",
        });
      }

      showSuccessAlert("Éxito", "Operación registrada correctamente", () => {
        onClose();
      });

    } catch (err: any) {
      log.error("Error saving payment:", err);
      showErrorAlert("Error", err.message || "No se pudo registrar el pago.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className={styles.contentContainer}>
       <Text size={400} weight="semibold">Pago del chofer (Interno)</Text>
       <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <Text weight="semibold">Costo del viaje:</Text>
            <Text>${(contractData?.amount || 0).toFixed(2)}</Text>
          </div>
          <div className={styles.summaryItem}>
            <Text weight="semibold">Vales:</Text>
            <Text>$0.00</Text> 
          </div>
          <div className={styles.summaryItem}>
            <Text weight="semibold">Gastos del chofer:</Text>
            <Text>$0.00</Text> 
          </div>
       </div>

      <div className={styles.inputGroup}>
          <Label required>¿Se recibió efectivo del chofer?</Label>
          <RadioGroup
            layout="horizontal"
            value={internalCashReceived}
            onChange={(_, data) => setInternalCashReceived(data.value as "yes" | "no")}
            className={styles.radioGroup}
          >
            <Radio value="yes" label="Si" />
            <Radio value="no" label="No" />
          </RadioGroup>
      </div>
      
      <div className={styles.inputGroup}>
          <Label>Monto del efectivo</Label>
           <Input
              type="number"
              min="0"
              value={internalCashAmount}
              onChange={(_, d) => setInternalCashAmount(d.value.replace(/-/g, ""))}
              placeholder="0.00"
              contentBefore="$"
              disabled={internalCashReceived === "no"}
              style={{ opacity: internalCashReceived === "no" ? 0.5 : 1 }}
            />
      </div>

      <div className={styles.inputGroup}>
        <Label>Nombre del chofer</Label>
        <Input value={getDriverName()} readOnly disabled />
      </div>

      <div className={styles.inputGroup}>
        <Label required>Monto de pago del chofer</Label>
        <Input
          type="number"
          min="0"
          value={internalPaymentAmount}
          onChange={(_, d) => setInternalPaymentAmount(d.value.replace(/-/g, ""))}
          placeholder="0.00"
          contentBefore="$"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className={styles.contentContainer}>
      <Text size={400} weight="semibold">Pago del Proveedor (Externo)</Text>

      <div className={styles.summaryGrid}>
        <div className={styles.summaryItem}>
           <Text weight="semibold">Costo del viaje:</Text>
           <Text>${(contractData?.amount || 0).toFixed(2)}</Text>
        </div>
      </div>

      <div className={styles.inputGroup}>
          <Label required>¿Se recibió efectivo del proveedor?</Label>
          <RadioGroup
            layout="horizontal"
            value={externalCashReceived}
            onChange={(_, data) => setExternalCashReceived(data.value as "yes" | "no")}
            className={styles.radioGroup}
          >
            <Radio value="yes" label="Si" />
            <Radio value="no" label="No" />
          </RadioGroup>
      </div>
      
      <div className={styles.inputGroup}>
          <Label>Monto del efectivo</Label>
           <Input
              type="number"
              min="0"
              value={externalCashAmount}
              onChange={(_, d) => setExternalCashAmount(d.value.replace(/-/g, ""))}
              placeholder="0.00"
              contentBefore="$"
              disabled={externalCashReceived === "no"}
              style={{ opacity: externalCashReceived === "no" ? 0.5 : 1 }}
            />
      </div>

      <div className={styles.inputGroup}>
        <Label>Nombre del proveedor</Label>
        <Input value={getExternalDriverName() || "N/A"} readOnly disabled />
      </div>

      <div className={styles.inputGroup}>
        <Label required>Monto de pago del proveedor</Label>
        <Input
          type="number"
          min="0"
          value={externalPaymentAmount}
          onChange={(_, d) => setExternalPaymentAmount(d.value.replace(/-/g, ""))}
          placeholder="0.00"
          contentBefore="$"
        />
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface className={styles.dialogSurface}>
        <DialogBody>
          <DialogTitle
            action={
              <Button
                appearance="subtle"
                aria-label="close"
                icon={<Dismiss24Regular />}
                onClick={onClose}
              />
            }
          >
            Pago del chofer
          </DialogTitle>
          
          <DialogContent>
            {loading && !tripData ? (
              <div className="flex justify-center p-8">
                <Spinner label="Cargando información..." />
              </div>
            ) : error ? (
              <div className="text-red-500 p-4">{error}</div>
            ) : (
              <>
                {step === 1 ? renderStep1() : renderStep2()}
                
                <div className={styles.paginationContainer}>
                  <Button
                    icon={<ChevronLeft24Regular />}
                    appearance="transparent"
                    disabled={step === 1}
                    onClick={handleBack}
                    aria-label="Paso anterior"
                  />
                  <Text>{step} de 2</Text>
                  <Button
                    icon={<ChevronRight24Regular />}
                    appearance="transparent"
                    disabled={step === 2}
                    onClick={handleNext}
                    aria-label="Siguiente paso"
                  />
                </div>
              </>
            )}
          </DialogContent>
          
          <DialogActions>
            <Button
              appearance="secondary"
              onClick={onClose}
              style={{ color: "#96781a", borderColor: "#96781a" }}
            >
              Cancelar
            </Button>
            {step === 1 ? (
              <Button
                appearance="primary"
                onClick={handleNext}
                style={{ backgroundColor: "#96781a", borderColor: "#96781a" }}
              >
                Siguiente
              </Button>
            ) : (
              <Button
                appearance="primary"
                onClick={handleSave}
                disabled={loading}
                style={{ backgroundColor: "#96781a", borderColor: "#96781a" }}
              >
                {loading ? <Spinner size="tiny" /> : "Guardar"}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default DriverPaymentModal;
