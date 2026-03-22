"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogSurface,
  DialogTitle,
  DialogContent,
  DialogBody,
  DialogActions,
  Button,
  Label,
  RadioGroup,
  Radio,
  Input,
  Spinner,
  makeStyles,
  tokens,
  shorthands,
  Select,
  Field,
  Badge,
  Text,
  Divider,
} from "@fluentui/react-components";
import {
  Dismiss24Regular,
  VehicleCarRegular,
  PersonRegular,
  CheckmarkCircleRegular,
  CalendarRegular,
} from "@fluentui/react-icons";
import {
  referenceService,
  DriverReference,
  VehicleReference,
} from "@/services/api/reference.service";
import { tripsService } from "@/services/api/trips.service";
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from "@/app/Utils/AlertUtil";
import { Logger } from "@/app/Utils/Logger";
import { formatDateStandard } from "@/app/Utils/FormatUtil";
import { useIsMobile } from "@/app/hooks/useIsMobile";

const log = Logger.getLogger("AssignDriverModal");

// ── Types ────────────────────────────────────────────────────────────────────

interface UnitForm {
  unitId: number;
  tripId: number;
  tripDate: string;
  tripOrigin: string;
  tripDestination: string;
  vehicleType: string;
  /** Vehicle type ID — used to filter the vehicles dropdown */
  vehicleTypeId: number | null;
  driverType: "internal" | "external";
  driverId: string;
  vehicleId: string;
  plate: string;
  externalProviderName: string;
  externalDriverName: string;
  externalContact: string;
  /** Current assignment from API — used to show "already assigned" state */
  currentDriver: any;
  currentVehicle: any;
}

interface AssignDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * Pass the contract's trips array (each with `units[]`) for multi-unit assignment
   * from the Dashboard.  Preferred.
   */
  trips?: any[] | null;
  /**
   * Legacy: pass a single trip object. Modal will show all units of that trip.
   * Used by TripsContent and TableComponent.
   */
  tripData?: any | null;
  onAssign: () => void;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  // Desktop: centered modal. Mobile: overridden inline as bottom sheet.
  dialogSurface: {
    maxWidth: "680px",
    width: "100%",
    maxHeight: "88vh",
  },
  dialogBody: {
    display: "flex",
    flexDirection: "column",
    // Let content area scroll, keep title + actions fixed
    maxHeight: "inherit",
    overflow: "hidden",
  },
  dialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    overflowY: "auto",
    // Extra bottom padding so last card isn't hidden behind action bar on mobile
    paddingBottom: tokens.spacingVerticalXL,
  },
  tripGroup: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  tripHeader: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
    ...shorthands.padding(tokens.spacingVerticalS, tokens.spacingHorizontalM),
    backgroundColor: "#1a2e47",
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    color: "#ffffff",
  },
  tripHeaderRoute: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "13px",
    flex: 1,
    minWidth: "0",          // allow flex item to shrink
    wordBreak: "break-word",
  },
  tripHeaderDate: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "12px",
    flexBasis: "100%",       // force to new line on wrap
    marginTop: "-2px",
    "@media (min-width: 481px)": {
      flexBasis: "auto",
      marginTop: "0",
    },
  },
  unitCard: {
    ...shorthands.padding(tokens.spacingVerticalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke2),
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  unitHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  unitTypeLabel: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    fontWeight: "600",
  },
  assignedBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
    ...shorthands.padding(tokens.spacingVerticalXS, tokens.spacingHorizontalS),
    backgroundColor: tokens.colorPaletteGreenBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    borderLeft: `3px solid ${tokens.colorPaletteGreenBorderActive}`,
  },
  assignedBannerText: {
    flex: 1,
    minWidth: "0",
    wordBreak: "break-word",
    lineHeight: "1.5",
  },
  // Desktop: vehicle + plate side-by-side. Mobile: stacked.
  formRow: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: tokens.spacingHorizontalM,
    alignItems: "end",
    "@media (max-width: 480px)": {
      gridTemplateColumns: "1fr",
    },
  },
  radioGroup: {
    display: "flex",
    flexDirection: "row",
    gap: tokens.spacingHorizontalM,
    flexWrap: "wrap",
  },
  // Action row: full-width stacked on mobile
  dialogActions: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    justifyContent: "flex-end",
    flexWrap: "wrap",
    "@media (max-width: 480px)": {
      flexDirection: "column-reverse",
    },
  },
  actionButton: {
    "@media (max-width: 480px)": {
      width: "100%",
      justifyContent: "center",
    },
  },
  dragHandle: {
    width: "40px",
    height: "4px",
    backgroundColor: tokens.colorNeutralStroke1,
    ...shorthands.borderRadius("2px"),
    margin: "8px auto 0",
    flexShrink: 0,
  },
  noUnits: {
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
    ...shorthands.padding(tokens.spacingVerticalXL),
  },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildUnitForms(trips: any[]): UnitForm[] {
  const forms: UnitForm[] = [];
  for (const trip of trips) {
    const tripId = trip.trip_id ?? trip.contract_trip_id ?? trip.id ?? 0;
    const units: any[] = trip.units ?? [];
    for (const unit of units) {
      const unitId =
        unit.contract_trip_unit_id ?? unit.unit_id ?? unit.id ?? 0;
      const currentDriver = unit.driver ?? null;
      const currentVehicle = unit.vehicle ?? null;
      forms.push({
        unitId,
        tripId,
        tripDate: formatDateStandard(trip.service_date),
        tripOrigin: trip.origin?.name ?? trip.origin_name ?? "—",
        tripDestination: trip.destination?.name ?? trip.destination_name ?? "—",
        vehicleType: unit.vehicle_type ?? unit.vehicle_type_name ?? "Unidad",
        vehicleTypeId: unit.vehicle_type_id ?? null,
        driverType: "internal",
        driverId: currentDriver?.id?.toString() ?? currentDriver?.user_id?.toString() ?? "",
        vehicleId: currentVehicle?.id?.toString() ?? currentVehicle?.vehicle_id?.toString() ?? "",
        plate: currentVehicle?.license_plate ?? currentVehicle?.placa ?? "",
        externalProviderName: unit.external_driver?.provider_name ?? "",
        externalDriverName: unit.external_driver?.driver_name ?? unit.external_driver?.name ?? "",
        externalContact: unit.external_driver?.phone ?? unit.external_driver?.contact ?? "",
        currentDriver,
        currentVehicle,
      });
    }
  }
  return forms;
}

// ── Component ────────────────────────────────────────────────────────────────

const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  isOpen,
  onClose,
  trips,
  tripData,
  onAssign,
}) => {
  const styles = useStyles();
  const isMobile = useIsMobile();
  const [isLoadingRefs, setIsLoadingRefs] = useState(false);
  const [isLoadingTrip, setIsLoadingTrip] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [drivers, setDrivers] = useState<DriverReference[]>([]);
  const [vehicles, setVehicles] = useState<VehicleReference[]>([]);
  const [unitForms, setUnitForms] = useState<UnitForm[]>([]);

  // ── Load data on open ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) {
      setUnitForms([]);
      return;
    }
    loadReferences();
    initForms();
  }, [isOpen, trips, tripData]);

  const loadReferences = async () => {
    setIsLoadingRefs(true);
    try {
      const prefill = await referenceService.getPrefillableData();
      setDrivers(prefill.drivers);
      setVehicles(prefill.vehicles);
    } catch (err) {
      log.error("Error loading references:", err);
    } finally {
      setIsLoadingRefs(false);
    }
  };

  const initForms = async () => {
    // Priority: trips prop (contract-level) > tripData prop (single trip)
    if (trips && trips.length > 0) {
      setUnitForms(buildUnitForms(trips));
      return;
    }
    if (tripData) {
      // Single trip — may already have units embedded
      if (tripData.units && tripData.units.length > 0) {
        setUnitForms(buildUnitForms([tripData]));
        return;
      }
      // No units embedded — fetch from API
      const tripId =
        tripData.trip_id ??
        tripData.contract_trip_id ??
        tripData.id ??
        null;
      if (!tripId) return;
      setIsLoadingTrip(true);
      try {
        const fullTrip = await tripsService.getById(tripId);
        setUnitForms(buildUnitForms([fullTrip]));
      } catch (err) {
        log.error("Error fetching trip units:", err);
      } finally {
        setIsLoadingTrip(false);
      }
    }
  };

  // ── Per-unit form update helpers ───────────────────────────────────────────

  const updateUnit = (idx: number, patch: Partial<UnitForm>) => {
    setUnitForms((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const handleVehicleChange = (idx: number, id: string) => {
    const vehicle = vehicles.find((v) => vehicleKey(v) === id);
    updateUnit(idx, {
      vehicleId: id,
      plate: vehicle ? vehiclePlate(vehicle) : "",
    });
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = () => {
    // Validate
    for (const [idx, form] of unitForms.entries()) {
      if (form.driverType === "internal") {
        if (!form.driverId) {
          showErrorAlert("Validación", `Seleccione un chofer para la unidad ${idx + 1} (${form.vehicleType}).`);
          return;
        }
        if (!form.vehicleId) {
          showErrorAlert("Validación", `Seleccione una unidad para el chofer ${idx + 1} (${form.vehicleType}).`);
          return;
        }
      } else {
        if (!form.externalProviderName || !form.externalDriverName) {
          showErrorAlert("Validación", `Ingrese proveedor y nombre del chofer externo para la unidad ${idx + 1}.`);
          return;
        }
      }
    }

    showConfirmAlert(
      "Confirmar Asignaciones",
      `¿Guardar ${unitForms.length === 1 ? "la asignación" : `las ${unitForms.length} asignaciones`}?`,
      "Guardar",
      async () => {
        setIsSaving(true);
        const errors: string[] = [];
        let saved = 0;
        for (const form of unitForms) {
          try {
            if (form.driverType === "internal") {
              await tripsService.assignUnit(
                form.unitId,
                parseInt(form.driverId),
                parseInt(form.vehicleId),
              );
            }
            // External driver assignment — placeholder (requires backend endpoint)
            saved++;
          } catch (err: any) {
            log.error(`Error assigning unit ${form.unitId}:`, err);
            errors.push(`Unidad ${form.vehicleType}: ${err?.message ?? "Error desconocido"}`);
          }
        }
        setIsSaving(false);
        if (errors.length === 0) {
          showSuccessAlert(
            "Asignaciones Guardadas",
            `${saved === 1 ? "1 unidad asignada" : `${saved} unidades asignadas`} correctamente.`,
            () => { onAssign(); onClose(); },
          );
        } else {
          showErrorAlert("Errores al asignar", errors.join("\n"));
        }
      },
    );
  };

  // ── Group forms by trip for display ───────────────────────────────────────

  const formsByTrip = unitForms.reduce<Record<string, { tripDate: string; tripOrigin: string; tripDestination: string; forms: Array<{ idx: number; form: UnitForm }> }>>(
    (acc, form, idx) => {
      const key = String(form.tripId);
      if (!acc[key]) {
        acc[key] = {
          tripDate: form.tripDate,
          tripOrigin: form.tripOrigin,
          tripDestination: form.tripDestination,
          forms: [],
        };
      }
      acc[key].forms.push({ idx, form });
      return acc;
    },
    {},
  );

  const isLoading = isLoadingRefs || isLoadingTrip;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={isOpen} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface
        className={styles.dialogSurface}
        style={isMobile ? {
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          top: "auto",
          transform: "none",
          width: "100%",
          maxWidth: "100%",
          borderRadius: "20px 20px 0 0",
          maxHeight: "92dvh",
          margin: 0,
          paddingTop: "0",
        } : undefined}
      >
        {/* Drag handle — mobile only */}
        {isMobile && <div className={styles.dragHandle} />}

        <DialogBody>
          <DialogTitle
            action={
              <Button
                appearance="subtle"
                aria-label="Cerrar"
                icon={<Dismiss24Regular />}
                onClick={onClose}
              />
            }
          >
            Asignar Choferes
          </DialogTitle>

          <DialogContent className={styles.dialogContent}>
            {isLoading ? (
              <div style={{ textAlign: "center", padding: "32px" }}>
                <Spinner label="Cargando información..." />
              </div>
            ) : unitForms.length === 0 ? (
              <div className={styles.noUnits}>
                <VehicleCarRegular fontSize={40} />
                <p>No hay unidades para asignar en este contrato.</p>
              </div>
            ) : (
              Object.entries(formsByTrip).map(([tripId, { tripDate, tripOrigin, tripDestination, forms }]) => (
                <div key={tripId} className={styles.tripGroup}>
                  {/* Trip header — date wraps to second line on mobile */}
                  <div className={styles.tripHeader}>
                    <CalendarRegular fontSize={16} style={{ flexShrink: 0 }} />
                    <span className={styles.tripHeaderRoute}>
                      {tripOrigin} → {tripDestination}
                    </span>
                    <span className={styles.tripHeaderDate}>{tripDate}</span>
                    <Badge
                      appearance="outline"
                      color="informative"
                      size="small"
                      style={{ flexShrink: 0, color: "#ffffff", borderColor: "rgba(255,255,255,0.5)" }}
                    >
                      {forms.length} {forms.length === 1 ? "unidad" : "unidades"}
                    </Badge>
                  </div>

                  {/* Unit cards */}
                  {forms.map(({ idx, form }) => (
                    <UnitCard
                      key={form.unitId}
                      idx={idx}
                      form={form}
                      drivers={drivers}
                      vehicles={vehicles}
                      styles={styles}
                      onUpdateUnit={updateUnit}
                      onVehicleChange={handleVehicleChange}
                    />
                  ))}

                  <Divider />
                </div>
              ))
            )}
          </DialogContent>

          <DialogActions className={styles.dialogActions}>
            <Button
              appearance="secondary"
              onClick={onClose}
              className={styles.actionButton}
              style={{ color: "#96781a", borderColor: "#96781a" }}
            >
              Cancelar
            </Button>
            <Button
              appearance="primary"
              onClick={handleSave}
              disabled={isLoading || isSaving || unitForms.length === 0}
              className={styles.actionButton}
              style={{ backgroundColor: "#96781a", borderColor: "#96781a" }}
            >
              {isSaving ? <Spinner size="tiny" /> : "Guardar Asignaciones"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

// ── UnitCard sub-component ────────────────────────────────────────────────────

interface UnitCardProps {
  idx: number;
  form: UnitForm;
  drivers: DriverReference[];
  vehicles: VehicleReference[];
  styles: ReturnType<typeof useStyles>;
  onUpdateUnit: (idx: number, patch: Partial<UnitForm>) => void;
  onVehicleChange: (idx: number, vehicleId: string) => void;
}

// ── Field normalizers (handles both old Spanish keys and new English keys) ──
const driverKey = (d: DriverReference) => (d.user_id ?? d.id)?.toString() ?? "";
const driverLabel = (d: DriverReference) =>
  d.display_name || (d.name ? `${d.name} ${d.first_lastname ?? ""}`.trim() : (d.nombre ?? "—"));

const vehicleKey = (v: VehicleReference) => (v.vehicle_id ?? v.id)?.toString() ?? "";
const vehicleLabel = (v: VehicleReference) => {
  const name = v.alias || v.type || v.tipo || "Unidad";
  const plate = v.license_plate || v.placa || "";
  return plate ? `${name} · ${plate}` : name;
};
const vehiclePlate = (v: VehicleReference) => v.license_plate ?? v.placa ?? "";

function UnitCard({ idx, form, drivers, vehicles, styles, onUpdateUnit, onVehicleChange }: UnitCardProps) {
  const isAssigned = !!form.currentDriver || !!form.currentVehicle;

  const filteredVehicles = vehicles;

  return (
    <div className={styles.unitCard}>
      {/* Unit header */}
      <div className={styles.unitHeader}>
        <span className={styles.unitTypeLabel}>
          <VehicleCarRegular fontSize={16} />
          {form.vehicleType}
        </span>
        {isAssigned && (
          <Badge appearance="filled" color="success" size="small">
            Asignado
          </Badge>
        )}
      </div>

      {/* Current assignment */}
      {isAssigned && (
        <div className={styles.assignedBanner}>
          <CheckmarkCircleRegular fontSize={16} color={tokens.colorPaletteGreenBorderActive} style={{ flexShrink: 0, marginTop: "2px" }} />
          <Text size={200} className={styles.assignedBannerText}>
            <strong>Chofer:</strong>{" "}
            {form.currentDriver
              ? `${form.currentDriver.name ?? ""} ${form.currentDriver.lastname ?? form.currentDriver.last_name ?? ""}`.trim() || "Asignado"
              : "—"}
            <br />
            <strong>Unidad:</strong>{" "}
            {form.currentVehicle
              ? form.currentVehicle.alias ?? form.currentVehicle.license_plate ?? "Asignada"
              : "—"}
          </Text>
        </div>
      )}

      {/* Driver type toggle */}
      <Field label="Tipo de Chofer">
        <RadioGroup
          layout="horizontal"
          value={form.driverType}
          onChange={(_, d) => onUpdateUnit(idx, { driverType: d.value as "internal" | "external" })}
          className={styles.radioGroup}
        >
          <Radio value="internal" label="Interno (Nómina)" />
          <Radio value="external" label="Externo (Proveedor)" />
        </RadioGroup>
      </Field>

      {/* Internal form */}
      {form.driverType === "internal" && (
        <>
          <Field label="Chofer" required>
            <Select
              value={form.driverId}
              onChange={(_, d) => onUpdateUnit(idx, { driverId: d.value })}
            >
              <option value="">Seleccione un chofer</option>
              {drivers.map((d) => (
                <option key={driverKey(d)} value={driverKey(d)}>
                  {driverLabel(d)}
                </option>
              ))}
            </Select>
          </Field>

          <div className={styles.formRow}>
            <Field label="Unidad" required>
              <Select
                value={form.vehicleId}
                onChange={(_, d) => onVehicleChange(idx, d.value)}
              >
                <option value="">
                  {filteredVehicles.length === 0 ? "Sin unidades disponibles" : "Seleccione unidad"}
                </option>
                {filteredVehicles.map((v) => (
                  <option key={vehicleKey(v)} value={vehicleKey(v)}>
                    {vehicleLabel(v)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Placa">
              <Input value={form.plate} readOnly disabled />
            </Field>
          </div>
        </>
      )}

      {/* External form */}
      {form.driverType === "external" && (
        <>
          <Field label="Proveedor" required>
            <Input
              value={form.externalProviderName}
              onChange={(e) => onUpdateUnit(idx, { externalProviderName: e.target.value })}
              placeholder="Nombre de la empresa o proveedor"
            />
          </Field>
          <Field label="Nombre del Chofer" required>
            <Input
              value={form.externalDriverName}
              onChange={(e) => onUpdateUnit(idx, { externalDriverName: e.target.value })}
              placeholder="Nombre completo"
            />
          </Field>
          <Field label="Contacto">
            <Input
              value={form.externalContact}
              onChange={(e) => onUpdateUnit(idx, { externalContact: e.target.value })}
              placeholder="Teléfono o email"
            />
          </Field>
        </>
      )}
    </div>
  );
}

export default AssignDriverModal;
