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
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { ContractTrip } from "@/app/backend_models/trip.model";
import { TripCollection, TripData } from "@/app/Types/TripTypes";
import {
  referenceService,
  DriverReference,
  VehicleReference,
} from "@/services/api/reference.service";
import { tripsService } from "@/services/api/trips.service";
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from "@/app/Utils/AlertUtil";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("AssignDriverModal");

interface AssignDriverModalProps{
  isOpen: boolean;
  onClose: () => void;
  tripData: ContractTrip | TripCollection | TripData | null;
  onAssign: (assignment: any) => void;
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
  tripInfo: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
    ...shorthands.padding(tokens.spacingVerticalM),
    backgroundColor: tokens.colorNeutralBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  infoItem: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  radioGroup: {
    display: "flex",
    flexDirection: "row",
    gap: tokens.spacingHorizontalL,
  },
  formSection: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    ...shorthands.padding(tokens.spacingVerticalM, 0),
    borderTop: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  unitSection: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: tokens.spacingHorizontalM,
    alignItems: "end",
  },
  currentAssignment: {
    gridColumn: "1 / -1",
    marginTop: tokens.spacingVerticalS,
    ...shorthands.padding(tokens.spacingVerticalS),
    backgroundColor: tokens.colorBrandBackground2,
    ...shorthands.borderRadius(tokens.borderRadiusSmall),
    borderLeft: `3px solid ${tokens.colorBrandBackground}`,
  },
});

const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  isOpen,
  onClose,
  tripData,
  onAssign,
}) => {
  const styles = useStyles();
  const [driverType, setDriverType] = useState<"internal" | "external">("internal");
  const [sameDriver, setSameDriver] = useState<"yes" | "no">("yes");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Options
  const [drivers, setDrivers] = useState<DriverReference[]>([]);
  const [vehicles, setVehicles] = useState<VehicleReference[]>([]);
  
  // Internal Driver Form
  const [driverId, setDriverId] = useState<string>("");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [plate, setPlate] = useState<string>("");

  // External Driver Form
  const [providerName, setProviderName] = useState<string>("");
  const [externalDriverName, setExternalDriverName] = useState<string>("");
  const [externalContact, setExternalContact] = useState<string>("");
  const [externalVehicleType, setExternalVehicleType] = useState<string>("");

  // Trip Data
  const [fullTripData, setFullTripData] = useState<ContractTrip | null>(null);

  // Helper to extract ID
  const getTripId = (): number | null => {
    if (!tripData) return null;
    const data = tripData as any;
    
    // If tripData itself is the trip object (has origin/destination directly)
    if ((tripData as any).origin || (tripData as any).destination) {
        return data.contract_trip_id || data.trip_id || data.tripId || data.id || data.ID || null;
    }

    // If it's a contract row with _trips, use the first trip's ID
    if (data._trips && Array.isArray(data._trips) && data._trips.length > 0) {
        const firstTrip = data._trips[0];
        return firstTrip.contract_trip_id || firstTrip.trip_id || firstTrip.id;
    }

    // Common ID fields for direct trip objects
    return data.contract_trip_id || data.trip_id || data.tripId || data.id || data.ID || null;
  };

  useEffect(() => {
    if (isOpen && tripData) {
      const id = getTripId();
      if (id) {
        loadTripData(id);
      }
      // Load references
      fetchReferences();
    } else {
      resetForm();
    }
  }, [isOpen, tripData]);

  const loadTripData = async (id: number) => {
    setIsLoading(true);
    try {
      // Pre-fill form based on current assignment
      let data: any; // Use any to allow enriched data structure
      
      // If tripData passed as prop already has enriched details (origin object, etc), use it
      // Otherwise fetch from API
      if (tripData && (tripData as any).origin && (tripData as any).destination) {
         log.debug("Using provided enriched trip data");
         data = tripData;
      } else {
         log.debug("Fetching trip data from API");
         data = await tripsService.getById(id);
      }
      
      log.debug("Trip Data Loaded:", data);
      
      setFullTripData(data);
      
      // Check for driver_id or nested driver object
      let currentDriverId: number | undefined;
      let currentVehicleId: number | undefined;

      // Check flat properties
      if (data.driver_id) currentDriverId = data.driver_id;
      if (data.vehicle_id) currentVehicleId = data.vehicle_id;

      // Check nested objects if flat properties are missing
      if (!currentDriverId && (data as any).driver) {
         currentDriverId = (data as any).driver.user_id || (data as any).driver.id;
      }
      if (!currentVehicleId && (data as any).vehicle) {
         currentVehicleId = (data as any).vehicle.vehicle_id || (data as any).vehicle.id;
      }
      
      log.debug("Extracted IDs - Driver:", currentDriverId, "Vehicle:", currentVehicleId);

      // Set Driver State
      if (currentDriverId) {
        setDriverType("internal");
        setDriverId(currentDriverId.toString());
      } else if (data.external_driver_id || (data as any).external_driver) {
        setDriverType("external");
        const ext = (data as any).external_driver || {};
        const prov = (data as any).external_provider || {};
        setExternalDriverName(ext.driver_name || ext.name || "");
        setExternalContact(ext.phone || ext.contact || "");
        setProviderName(prov.provider_name || prov.name || "");
      }

      // Set Vehicle State
      if (currentVehicleId) {
        setVehicleId(currentVehicleId.toString());
      }
    } catch (error) {
      log.error("Error loading trip:", error);
      showErrorAlert("Error", "No se pudo cargar la información del viaje.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReferences = async () => {
    try {
      const [driversData, vehiclesData] = await Promise.all([
        referenceService.getDrivers(),
        referenceService.getVehicles(),
      ]);
      setDrivers(driversData);
      setVehicles(vehiclesData);
      
      // If vehicleId is set, update plate
      // Check both flat ID and object ID
      const currentVehicleId = fullTripData?.vehicle_id || (fullTripData as any)?.vehicle?.vehicle_id || (fullTripData as any)?.vehicle?.id;
      
      if (currentVehicleId) {
        const v = vehiclesData.find((vh) => vh.vehicle_id === currentVehicleId || vh.id === currentVehicleId);
        if (v) setPlate(v.license_plate || v.placa || "");
      }
    } catch (error) {
      log.error("Error loading references:", error);
    }
  };

  const resetForm = () => {
    setDriverType("internal");
    setSameDriver("yes");
    setDriverId("");
    setVehicleId("");
    setPlate("");
    setProviderName("");
    setExternalDriverName("");
    setExternalContact("");
    setExternalVehicleType("");
    setFullTripData(null);
  };

  const handleVehicleChange = (id: string) => {
    setVehicleId(id);
    const vehicle = vehicles.find((v) => (v.vehicle_id || v.id).toString() === id);
    setPlate(vehicle?.license_plate || "");
  };

  const handleSave = async () => {
    const id = getTripId();
    if (!id) {
      log.error("No trip ID found for assignment");
      return;
    }

    // Validation
    if (driverType === "internal") {
        if (!driverId) {
            showErrorAlert("Validación", "Seleccione un chofer.");
            return;
        }
        if (!vehicleId) {
            showErrorAlert("Validación", "Seleccione una unidad.");
            return;
        }
    } else {
        if (!providerName || !externalDriverName) {
            showErrorAlert("Validación", "Ingrese proveedor y nombre del chofer.");
            return;
        }
    }
    
    log.debug("Showing confirmation alert...");

    showConfirmAlert(
      "Confirmar Asignación",
      "¿Está seguro de asignar este chofer al viaje?",
      "Asignar",
      async () => {
        log.debug("Confirmation accepted, saving...");
        setIsSaving(true);
        try {
          if (driverType === "internal") {
            const result = await tripsService.assignTripResources(
              id,
              parseInt(driverId),
              parseInt(vehicleId)
            );
            log.info("Assignment result:", result);
          } else {
             // ... external driver logic ...
             showErrorAlert("Aviso", "La asignación de choferes externos requiere endpoints adicionales.");
             return; 
          }

          showSuccessAlert("Asignación Exitosa", "El chofer ha sido asignado correctamente.", () => {
            onAssign({ driverId, vehicleId });
            onClose();
          });
        } catch (error: any) {
          log.error("Error assigning driver:", error);
          showErrorAlert("Error", error.message || "No se pudo asignar el chofer.");
        } finally {
          setIsSaving(false);
        }
      }
    );
  };

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
            Asignar Chofer
          </DialogTitle>

          <DialogContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Spinner label="Cargando información del viaje..." />
              </div>
            ) : (
              <div className={styles.contentContainer}>
                {/* Trip Info Summary */}
                <div className={styles.tripInfo}>
                   <div className={styles.infoItem}>
                     <Label weight="semibold">Origen</Label>
                     <span>{fullTripData?.origin_time?.toString().slice(0,5) || "--:--"} - {(fullTripData as any)?.origin?.name || "N/A"}</span>
                   </div>
                   <div className={styles.infoItem}>
                     <Label weight="semibold">Destino</Label>
                     <span>{(fullTripData as any)?.destination?.name || "N/A"}</span>
                   </div>
                   <div className={styles.infoItem}>
                     <Label weight="semibold">Pasajeros</Label>
                     <span>{fullTripData?.passengers || 0}</span>
                   </div>
                   {/* Current Assignment */}
                   {(fullTripData?.driver_id || fullTripData?.external_driver_id) && (
                      <div className={styles.currentAssignment}>
                        <Label weight="semibold">Asignación Actual:</Label>
                        <div>
                          {fullTripData?.driver_id 
                            ? `Chofer: ${(fullTripData as any).driver?.name || "ID: " + fullTripData.driver_id}` 
                            : `Externo: ${(fullTripData as any).external_driver?.driver_name || "N/A"}`
                          }
                        </div>
                        <div>
                           Unidad: {(fullTripData as any).vehicle?.alias || fullTripData?.vehicle_id || "N/A"}
                        </div>
                      </div>
                   )}
                </div>

                {/* Driver Type Selection */}
                <Field label="Tipo de Chofer">
                  <RadioGroup
                    layout="horizontal"
                    value={driverType}
                    onChange={(_, data) => setDriverType(data.value as "internal" | "external")}
                    className={styles.radioGroup}
                  >
                    <Radio value="internal" label="Interno (Nómina)" />
                    <Radio value="external" label="Externo (Proveedor)" />
                  </RadioGroup>
                </Field>

                {/* Internal Driver Form */}
                {driverType === "internal" && (
                  <div className={styles.formSection}>
                    <Field label="Seleccionar Chofer" required>
                      <Select
                        value={driverId}
                        onChange={(_, data) => setDriverId(data.value)}
                      >
                        <option value="">Seleccione un chofer</option>
                        {drivers.map((d) => (
                          <option key={d.user_id} value={d.user_id}>
                            {d.name} {d.first_lastname}
                          </option>
                        ))}
                      </Select>
                    </Field>

                    <div className={styles.unitSection}>
                      <Field label="Unidad" required>
                        <Select
                          value={vehicleId}
                          onChange={(_, data) => handleVehicleChange(data.value)}
                        >
                          <option value="">Seleccione unidad</option>
                          {vehicles.map((v) => (
                            <option key={v.vehicle_id} value={v.vehicle_id}>
                              {v.alias} ({v.type || v.tipo})
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Placa">
                        <Input value={plate} readOnly disabled />
                      </Field>
                    </div>
                  </div>
                )}

                {/* External Driver Form */}
                {driverType === "external" && (
                  <div className={styles.formSection}>
                    <Field label="Proveedor" required>
                      <Input 
                        value={providerName}
                        onChange={(e) => setProviderName(e.target.value)}
                        placeholder="Nombre de la empresa o proveedor"
                      />
                    </Field>
                    <Field label="Nombre del Chofer" required>
                      <Input 
                        value={externalDriverName}
                        onChange={(e) => setExternalDriverName(e.target.value)}
                        placeholder="Nombre completo"
                      />
                    </Field>
                    <Field label="Contacto">
                      <Input 
                        value={externalContact}
                        onChange={(e) => setExternalContact(e.target.value)}
                        placeholder="Teléfono o email"
                      />
                    </Field>
                    <Field label="Tipo de Unidad">
                      <Input 
                        value={externalVehicleType}
                        onChange={(e) => setExternalVehicleType(e.target.value)}
                        placeholder="Ej. Sprinter, Sedan..."
                      />
                    </Field>
                  </div>
                )}
              </div>
            )}
          </DialogContent>

          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              appearance="primary" 
              onClick={handleSave}
              disabled={isLoading || isSaving}
            >
              {isSaving ? <Spinner size="tiny" /> : "Guardar Asignación"}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
};

export default AssignDriverModal;
