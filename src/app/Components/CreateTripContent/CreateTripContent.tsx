"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import styles from "./CreateTripContent.module.css";
import InputComponent from "../InputComponent/InputComponent";
import SelectComponent from "../SelectComponent/SelectComponent";
import SearchableSelectComponent, {
  SearchableSelectOption,
} from "../SearchableSelectComponent/SearchableSelectComponent";
import CreatePlaceModal from "../CreatePlaceModal/CreatePlaceModal";
import ConfirmationModal from "../ConfirmationModal/ConfirmationModal";
import {
  ArrowHookUpLeftRegular,
  ChevronUpRegular,
  AddFilled,
  Edit24Regular,
  Save24Regular,
} from "@fluentui/react-icons";
import DatePickerComponent from "../DatePickerComponent/DatePickerComponent";
import { Field } from "@fluentui/react-components";
import Link from "next/link";
import { showErrorAlert, showSuccessAlert } from "@/app/Utils/AlertUtil";
import {
  mapCompleteOrderToPayload,
  OrderFormData,
} from "@/app/Types/OrderTripTypes";
import { useOrderContext } from "@/app/Contexts/OrderContext";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import ParadaItem from "../ParadaItem/ParadaItem";
import { useRouter } from "next/navigation";
import { useUserRole } from "@/app/hooks/useUserRole";
import {
  referenceService,
  contractsService,
  tripsService,
  ApiError,
} from "@/services/api";
import { useOrderForm } from "@/app/hooks/useOrderForm";
import type { TripFormData } from "@/app/Types/OrderTripTypes";
import { useTripDropdowns } from "@/app/hooks/useTripDropdowns";
import { usePlaceSelection } from "@/app/hooks/usePlaceSelection";
import { useParadas, Parada } from "@/app/hooks/useParadas";
import { useUnidades } from "@/app/hooks/useUnidades";
import { useAddressEditor } from "@/app/hooks/useAddressEditor";
import UnidadItem from "../UnidadItem/UnidadItem";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("CreateTripContent");

interface CreateTripContentProps {
  contractId?: string;
}

export default function CreateTripContent({
  contractId,
}: CreateTripContentProps) {
  const isEdit = !!contractId;
  const { orderData, tripData, setTripData, clearData } = useOrderContext();
  const router = useRouter();
  const { canAssignResources } = useUserRole();

  // Loading state for trip data
  const [isLoadingTrip, setIsLoadingTrip] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTripId, setEditingTripId] = useState<number | null>(null);

  const tripForm = useOrderForm({
    ...tripData,
    numeroPasajeros: tripData.regresoPasajeros || "",
    idaFecha: tripData.idaFecha || "",
    regresoFecha: tripData.regresoFecha || "",
  });

  const {
    formData: tripFormData,
    setFormData: setTripFormData,
    errors,
    setErrors,
    showErrors,
    setShowErrors,
    input,
    select,
    updateField,
  } = tripForm;

  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);

  const origenEditor = useAddressEditor({
    prefix: "origen",
    formData: tripFormData,
    setFormData: setTripFormData,
  });

  const destinoEditor = useAddressEditor({
    prefix: "destino",
    formData: tripFormData,
    setFormData: setTripFormData,
  });

  const {
    choferes,
    unidades,
    lugares,
    tiposUnidad,
    fetchLugares,
    fetchChoferes,
    fetchUnidades,
  } = useTripDropdowns();

  const handleFieldTouch = (field: string, value?: any) => {
      // Use provided value or fallback to current state
      const valueToCheck = value !== undefined ? value : tripFormData[field as keyof TripFormData];
      
      // Special validation for Place ID fields (can be empty if manual address is provided)
      if (field === "origenNombreLugar") {
        if (!valueToCheck && !tripFormData.origenCalle) {
             setErrors(prev => ({...prev, [field]: "Este campo es obligatorio"}));
             return;
        } else {
             setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[field];
                return newErrors;
             });
             return;
        }
      }
      
      if (field === "destinoNombreLugar") {
        if (!valueToCheck && !tripFormData.destinoCalle) {
             setErrors(prev => ({...prev, [field]: "Este campo es obligatorio"}));
             return;
        } else {
             setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors[field];
                return newErrors;
             });
             return;
        }
      }

      // Simple validation for required fields
      if (!valueToCheck) {
          setErrors(prev => ({...prev, [field]: "Este campo es obligatorio"}));
      } else {
          setErrors(prev => {
              const newErrors = {...prev};
              delete newErrors[field];
              return newErrors;
           });
      }
  };

  const {
    paradas,
    setParadas,
    handleAddParada,
    handleRemoveParada,
    handleParadaChange,
    handleParadaPlaceSelect,
  } = useParadas();

  const {
    paradas: returnParadas,
    setParadas: setReturnParadas,
    handleAddParada: handleAddReturnParada,
    handleRemoveParada: handleRemoveReturnParada,
    handleParadaChange: handleReturnParadaChange,
    handleParadaPlaceSelect: handleReturnParadaPlaceSelect,
  } = useParadas();

  const [returnStopOption, setReturnStopOption] = useState<"none" | "reverse" | "custom">("none");

  const {
    typeSelections,
    setTypeSelections,
    assignments: unitAssignments,
    setAssignments: setUnitAssignments,
    handleAddTypeSelection,
    handleRemoveTypeSelection,
    handleTypeSelectionChange,
    handleAssignmentChange,
  } = useUnidades();

  const {
    isPlaceModalOpen,
    placeModalContext,
    setIsPlaceModalOpen,
    handlePlaceSearch,
    handlePlaceSelect: handlePlaceSelectHook,
    handleCreatePlace,
    handlePlaceCreated,
  } = usePlaceSelection({
    onPlaceSelect: (field, placeId, option) => {
      const prefix = field === "origenNombreLugar" ? "origen" : "destino";
      const displayName = option?.label || "";
      setTripFormData((prev) => ({
        ...prev,
        [field]: placeId,
        [`${prefix}NombreDisplay`]: displayName,
      }));
      handleFieldTouch(field, placeId);

      // Auto-fill address fields if available
      if (option?.data) {
        const placeData = option.data;
        const updates: Partial<TripFormData> = {
          [`${prefix}Calle`]: placeData.address || "",
          [`${prefix}Numero`]: placeData.number || "",
          [`${prefix}Colonia`]: placeData.colonia || "",
          [`${prefix}CodigoPostal`]: placeData.zip_code || "",
          [`${prefix}Ciudad`]: placeData.city || "",
          [`${prefix}Estado`]: placeData.state || "",
        };

        setTripFormData((prev) => ({ ...prev, ...updates }));
        Object.entries(updates).forEach(([key, value]) => handleFieldTouch(key, value));

        if (prefix === "origen") {
          origenEditor.setOriginalSnapshot({
            ...updates,
            origenNombreLugar: placeId.toString(),
            origenNombreDisplay: displayName,
          });
        } else {
          destinoEditor.setOriginalSnapshot({
            ...updates,
            destinoNombreLugar: placeId.toString(),
            destinoNombreDisplay: displayName,
          });
        }
      }
    },
    onPlaceCreated: (context, placeId, placeName, placeData) => {
      if (context === "origen") {
        const updates: Partial<TripFormData> = {
           origenNombreLugar: placeId.toString(),
           origenNombreDisplay: placeName,
           origenCalle: placeData?.address || "",
           origenNumero: placeData?.number || "",
           origenColonia: placeData?.colonia || "",
           origenCodigoPostal: placeData?.zip_code || "",
           origenCiudad: placeData?.city || "",
           origenEstado: placeData?.state || "",
        };
        
        setTripFormData((prev) => ({
          ...prev,
          ...updates,
        }));

        origenEditor.setOriginalSnapshot(updates);

        // Mark fields as touched with new values
        Object.entries(updates).forEach(([key, value]) => handleFieldTouch(key, value));
      } else if (context === "destino") {
        const updates: Partial<TripFormData> = {
           destinoNombreLugar: placeId.toString(),
           destinoNombreDisplay: placeName,
           destinoCalle: placeData?.address || "",
           destinoNumero: placeData?.number || "",
           destinoColonia: placeData?.colonia || "",

           destinoCodigoPostal: placeData?.zip_code || "",
           destinoCiudad: placeData?.city || "",
           destinoEstado: placeData?.state || "",
        };

        setTripFormData((prev) => ({
          ...prev,
          ...updates,
        }));

        destinoEditor.setOriginalSnapshot(updates);

        // Mark fields as touched with new values
        Object.entries(updates).forEach(([key, value]) => handleFieldTouch(key, value));
      }
    },
  });

  const handlePlaceSelect = handlePlaceSelectHook;

  useEffect(() => {
    const fetchTripData = async () => {
      if (!contractId) return;

      try {
        setIsLoadingTrip(true);

        // Fetch contract details to get trips
        const contractData = await contractsService.getContractDetails(
          parseInt(contractId),
        );

        // If there are trips, populate the form with the first trip's data
        if (contractData.trips && contractData.trips.length > 0) {
          const trip = contractData.trips[0];
          setEditingTripId(trip.id);

          // Parse the service date
          let idaFechaFormatted = "";
          if (trip.service_date) {
            const date = new Date(trip.service_date);
            const day = String(date.getDate()).padStart(2, "0");
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const year = date.getFullYear();
            idaFechaFormatted = `${day}/${month}/${year}`;
          }

          // Parse origin time (HH:MM:SS format)
          let idaHora: string | undefined = undefined;
          let idaMinutos: string | undefined = undefined;
          let idaAmPm: "AM" | "PM" | undefined = "AM";
          if (trip.origin_time) {
            const timeParts = trip.origin_time.split(":");
            let hour = parseInt(timeParts[0] || "0");
            let minutes = parseInt(timeParts[1] || "0");
            if (hour >= 12) {
              idaAmPm = "PM";
              if (hour > 12) hour -= 12;
            } else if (hour === 0) {
              hour = 12;
            }
            idaHora = hour.toString();
            idaMinutos = minutes.toString();
          }

          // Fetch place details for origin and destination
          let origenData: any = {};
          let destinoData: any = {};

          if (trip.origin?.id) {
            try {
              const originPlace = await referenceService.getPlaceById(
                trip.origin.id,
              );
              origenData = {
                origenNombreLugar: trip.origin.id.toString(),
                origenNombreDisplay: originPlace.name || originPlace.nombre || "",
                origenCalle: originPlace.address || "",
                origenNumero: originPlace.number || "",
                origenColonia: originPlace.colonia || "",
                origenCodigoPostal: originPlace.zip_code || "",
                origenCiudad: originPlace.city || "",
                origenEstado: originPlace.state || "",
              };
            } catch (e) {
              log.error("Error fetching origin place:", e);
              origenData = { origenNombreLugar: trip.origin.id.toString() };
            }
          }

          if (trip.destination?.id) {
            try {
              const destPlace = await referenceService.getPlaceById(
                trip.destination.id,
              );
              destinoData = {
                destinoNombreLugar: trip.destination.id.toString(),
                destinoNombreDisplay: destPlace.name || destPlace.nombre || "",
                destinoCalle: destPlace.address || "",
                destinoNumero: destPlace.number || "",
                destinoColonia: destPlace.colonia || "",
                destinoCodigoPostal: destPlace.zip_code || "",
                destinoCiudad: destPlace.city || "",
                destinoEstado: destPlace.state || "",
              };
            } catch (e) {
              log.error("Error fetching destination place:", e);
              destinoData = {
                destinoNombreLugar: trip.destination.id.toString(),
              };
            }
          }

          // Determine tipoViaje based on whether there's a return trip
          const tipoViajeValue: "sencillo" | "redondo" = trip.is_round_trip
            ? "redondo"
            : "sencillo";

          const tripUpdatedData: Partial<TripFormData> = {
            ...origenData,
            ...destinoData,
            idaFecha: idaFechaFormatted,
            idaHora,
            idaMinutos:
              idaMinutos !== undefined ? idaMinutos.toString() : undefined,
            idaAmPm,
            idaPasajeros: trip.passengers?.toString() || "",
            nombreChofer: trip.driver?.id?.toString() || "",
            observacionesChofer: trip.internal_notes || "",
            observacionesCliente: trip.notes || "",
            tipoViaje: tipoViajeValue,
            // Flight information
            origenEsVuelo: !!trip.flight,
            origenNumeroVuelo: trip.flight?.flight_number || "",
            origenAerolinea: trip.flight?.airline || "",
            origenLugarVuelo: trip.flight?.flight_origin || "",
          };

          // Load existing units into type selections
          if (trip.units && Array.isArray(trip.units) && trip.units.length > 0) {
            // Group by vehicle_type_id to create type selections
            const typeMap = new Map<string, { count: number; }>();
            trip.units.forEach((u: any) => {
              const typeId = (u.vehicle_type_id || u.vehicleTypeId || "").toString();
              if (typeId) {
                const existing = typeMap.get(typeId);
                typeMap.set(typeId, { count: (existing?.count || 0) + 1 });
              }
            });
            const selections = Array.from(typeMap.entries()).map(([typeId, data], i) => ({
              id: `${Date.now()}-${i}`,
              vehicleTypeId: typeId,
              quantity: data.count,
            }));
            if (selections.length > 0) {
              setTypeSelections(selections);
            }
          }

          setTripFormData((prev: any) => ({
            ...prev,
            ...tripUpdatedData,
          }));

          // Set original data for edit/cancel functionality
          origenEditor.setOriginalSnapshot(origenData);
          destinoEditor.setOriginalSnapshot(destinoData);

          setTripData({
            ...tripFormData, // Use current form data as base
            ...tripUpdatedData, // Apply updates
          } as TripFormData);
        }
      } catch (err) {
        log.error("Error fetching trip data:", err);
      } finally {
        setIsLoadingTrip(false);
      }
    };

    fetchTripData();
  }, [contractId, setTripData]);

  /* =============================
   COMPATIBILITY (DO NOT REMOVE)
   Keeps existing JSX working
============================= */

  const fieldErrors: Record<string, boolean> = Object.keys(errors).reduce(
    (acc, key) => {
      acc[key] = true;
      return acc;
    },
    {} as Record<string, boolean>,
  );

  const setFieldErrors = (
    errs:
      | Record<string, boolean>
      | ((prev: Record<string, boolean>) => Record<string, boolean>),
  ) => {
    const current: Record<string, boolean> = Object.keys(errors).reduce(
      (acc, key) => {
        acc[key] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    );

    const resolved = typeof errs === "function" ? errs(current) : errs;

    const formatted: Record<string, string> = {};

    Object.entries(resolved).forEach(([key, value]) => {
      if (value) formatted[key] = "Este campo es obligatorio";
    });

    setErrors(formatted);
  };
  const handleTripInputChange =
    (field: keyof typeof tripFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      updateField(field, newValue);

      // If we are updating address fields, check if we can clear the parent field error
      if (field.startsWith("origen") && field !== "origenNombreLugar") {
         if (tripFormData.origenCalle || newValue) { // Basic check
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors["origenNombreLugar"];
                return newErrors;
            });
         }
      }
      if (field.startsWith("destino") && field !== "destinoNombreLugar") {
         if (tripFormData.destinoCalle || newValue) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors["destinoNombreLugar"];
                return newErrors;
            });
         }
      }
    };

  const handleTripSelectChange =
    (field: keyof typeof tripFormData) =>
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      updateField(field, e.target.value);

  const handleRadioChange = (field: keyof typeof tripFormData, value: any) => {
    updateField(field, value);
  };

  // Parada handlers replaced by useParadas hook

  // Removed manual fetchLugares, fetchChoferes, fetchUnidades as they are in the hook

  // Load data and sync with context
  useEffect(() => {
    log.debug("CreateTripContent - OrderData:", orderData);
    log.debug("CreateTripContent - TripData:", tripData);

    const checkOrderData = () => {
      const localStorageData =
        typeof window !== "undefined"
          ? localStorage.getItem("orderData")
          : null;

      const hasOrderData =
        orderData &&
        (orderData.empresa || orderData.nombreContacto || orderData.costoViaje);

      if (!hasOrderData) {
        log.debug("No order data found, redirecting...");
        showErrorAlert(
          "Error",
          "No se encontraron datos del pedido. Redirigiendo...",
        );
        setTimeout(() => {
          router.push("/dashboard/createOrder");
        }, 2000);
        return;
      }

      log.debug("Order data validation passed, proceeding...");
    };

    const timeoutId = setTimeout(checkOrderData, 500);

    // Sync form data with context data, ensuring proper defaults
    setTripFormData((prev: any) => ({
      ...prev,
      ...tripData,
      numeroPasajeros: tripData.regresoPasajeros || prev.numeroPasajeros || "",
      idaFecha: tripData.idaFecha || prev.idaFecha || "",
      regresoFecha: tripData.regresoFecha || prev.regresoFecha || "",
    }));

    return () => clearTimeout(timeoutId);
  }, [orderData, tripData, router]);

  // Debug effect to monitor form data changes
  useEffect(() => {
    log.debug("Current tripFormData:", tripFormData);
  }, [tripFormData]);

  const handleCancel = () => {
    setTripData(tripFormData);
    router.push("/dashboard/createOrder");
  };

  const handleSaveDraft = () => {
    setTripData(tripFormData);
    showSuccessAlert("Guardado", "Borrador guardado correctamente");
  };

  const handleCreateTrip = () => {
    // Validate required fields before showing confirmation
    if (!orderData) {
      showErrorAlert("Error", "No se encontraron datos del pedido");
      return;
    }

    // Define required fields
    const requiredFields = [
      "origenNombreLugar",
      "origenCalle",
      "destinoNombreLugar",
      "destinoCalle",
      "idaFecha",
      "numeroPasajeros",
    ];

    // Check for missing fields
    const errors: Record<string, boolean> = {};
    let hasErrors = false;

    // Validate at least one unit has a vehicle type selected
    if (canAssignResources) {
      const hasValidUnit = unitAssignments.some(
        (u) => u.vehicleTypeId && !isNaN(parseInt(u.vehicleTypeId))
      );
      if (!hasValidUnit) {
        errors["tipoUnidad"] = true;
        hasErrors = true;
      }
    }

    requiredFields.forEach((field) => {
      // If manually editing origin (no Place ID), skip ID validation if address fields are present
      if (field === "origenNombreLugar" && !tripFormData.origenNombreLugar) {
        if (tripFormData.origenCalle) {
          return; // Valid custom address
        }
      }
      
      // If manually editing destination (no Place ID), skip ID validation if address fields are present
      if (field === "destinoNombreLugar" && !tripFormData.destinoNombreLugar) {
        if (tripFormData.destinoCalle) {
          return; // Valid custom address
        }
      }

      if (!tripFormData[field as keyof typeof tripFormData]) {
        errors[field] = true;
        hasErrors = true;
      }
    });

    // Update error state
    setFieldErrors(errors);

    if (hasErrors) {
      showErrorAlert(
        "Error",
        "Complete todos los campos obligatorios marcados en rojo",
      );
      return;
    }

    // Show confirmation modal
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmCreateTrip = async (sendNotification: boolean) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Close the confirmation modal
      setIsConfirmationModalOpen(false);

      if (isEdit && editingTripId) {
        // UPDATE EXISTING TRIP
         const convertDateFormat = (ddmmyyyy: string): string => {
            if (!ddmmyyyy) return "";
            const parts = ddmmyyyy.split("/");
            if (parts.length !== 3) return "";
            return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
          };

          const convertTimeFormat = (
            hour: string,
            minutes: string,
            ampm: "AM" | "PM",
          ): string => {
            let h = parseInt(hour, 10);
            const m = parseInt(minutes, 10);
            if (isNaN(h) || isNaN(m)) return "00:00";
            if (ampm === "PM" && h !== 12) h += 12;
            if (ampm === "AM" && h === 12) h = 0;
            return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
          };

        const updatePayload: Record<string, any> = {
          service_date: convertDateFormat(tripFormData.idaFecha || ""),
          origin_time: convertTimeFormat(
             tripFormData.idaHora || "0",
             tripFormData.idaMinutos || "0",
             tripFormData.idaAmPm || "AM"
          ),
          origin_id: parseInt(tripFormData.origenNombreLugar || "0"),
          destination_id: parseInt(tripFormData.destinoNombreLugar || "0"),
          passengers: parseInt(tripFormData.numeroPasajeros || tripFormData.idaPasajeros || "1"),
          driver_id: tripFormData.nombreChofer ? parseInt(tripFormData.nombreChofer) : undefined,
          observations: tripFormData.observacionesCliente,
          internal_observations: tripFormData.observacionesChofer,
        };

        // Add dynamic units
        const validUnits = unitAssignments
          .filter((u) => u.vehicleTypeId && !isNaN(parseInt(u.vehicleTypeId)))
          .map((u) => ({
            vehicle_type_id: parseInt(u.vehicleTypeId, 10),
            ...(u.notes ? { notes: u.notes } : {}),
          }));
        if (validUnits.length > 0) {
          updatePayload.units = validUnits;
        }

        await tripsService.update(editingTripId, updatePayload);
        showSuccessAlert("Éxito", "Viaje actualizado correctamente");
        
        // Go back to contract details
        router.push(`/dashboard/order/${contractId}`);

      } else {
        // CREATE NEW CONTRACT + TRIP
        const contractPayload = {
          ...mapCompleteOrderToPayload(orderData as OrderFormData, tripFormData, {
            paradas,
            returnParadas: returnStopOption === "custom" ? returnParadas : undefined,
            reverseStopsForReturn: returnStopOption === "reverse" ? true : undefined,
            unidades: unitAssignments,
          }),
          send_notification: sendNotification,
        };
        log.debug("Contract payload:", contractPayload);

        const result = await contractsService.createWithTrips(contractPayload);
        log.debug("Contract created:", result);

        showSuccessAlert("Éxito", "Contrato y viaje creados correctamente");

        // Clear all form data
        clearData();
        setParadas([]);
        setReturnParadas([]);
        setReturnStopOption("none");
        setFieldErrors({});

        router.push("/dashboard");
      }
    } catch (error) {
      log.error("Error creating contract and trip:", error);

      if (error instanceof ApiError) {
        showErrorAlert("Error", error.message);
      } else {
        showErrorAlert(
          "Error",
          error instanceof Error
            ? error.message
            : "Error al crear el contrato y viaje",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link
            href={isEdit ? `/dashboard/order/${contractId}` : "/dashboard/createOrder"}
            passHref
          >
            <button className={styles.backButton}>
              <ArrowHookUpLeftRegular color="black" />
            </button>
          </Link>
          <div>
            <h1 className={styles.title}>
              {isEdit ? "Editar viaje" : "Crear viaje"}
            </h1>
          </div>
        </div>
        <p style={{ color: "#dc2626", fontSize: "0.82rem", margin: "4px 0 0 0" }}>
          *Los campos marcados con un asterisco rojo son obligatorios
        </p>
        <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
          <div className={styles.divider}>
            <h2 className={styles.subsectionTitle}>Ida</h2>
          </div>
          <div className={styles.section}>
            <DatePickerComponent
              id="idaFecha"
              label="Fecha"
              value={tripFormData.idaFecha || ""}
              onChange={(value) => {
                log.debug("Date changed:", value);
                setTripFormData((prev) => ({
                  ...prev,
                  idaFecha: value,
                }));
              }}
              placeholder="dd/mm/yyyy"
              required
              hasError={fieldErrors.idaFecha}
              errorMessage={
                fieldErrors.idaFecha ? "Este campo es obligatorio" : ""
              }
            />
            <InputComponent
              type="number"
              value={String(tripFormData.idaHora ?? "")}
              onChange={handleTripInputChange("idaHora")}
              label="Hora"
              required
              className={styles.input}
            />
            <InputComponent
              type="number"
              value={String(tripFormData.idaMinutos ?? "")}
              onChange={handleTripInputChange("idaMinutos")}
              label="Minutos"
              required
              className={styles.input}
            />
            <SelectComponent
              label="AM/PM"
              options={[
                { value: "AM", label: "AM" },
                { value: "PM", label: "PM" },
              ]}
              value={tripFormData.idaAmPm || "AM"}
              onChange={handleTripSelectChange("idaAmPm")}
              className={styles.input}
            />
            <InputComponent
              type="number"
              value={String(tripFormData.idaPasajeros ?? "")}
              onChange={handleTripInputChange("idaPasajeros")}
              label="Pasajeros"
              required
              className={styles.input}
              hasError={fieldErrors.idaPasajeros}
              errorMessage={
                fieldErrors.idaPasajeros ? "Este campo es obligatorio" : ""
              }
            />
          </div>

          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Dirección De Origen</h2>
            {!origenEditor.isEditing && (
              <button
                type="button"
                onClick={origenEditor.handleEdit}
                className={styles.editButton}
                title="Editar dirección de origen"
              >
                <Edit24Regular />
              </button>
            )}
            {origenEditor.isEditing && origenEditor.hasOriginal && (
              <div className={styles.actionButtons}>
                <button
                  type="button"
                  onClick={origenEditor.handleCancel}
                  className={styles.cancelEditButton}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={origenEditor.handleSave}
                  className={styles.saveButton}
                  title="Guardar cambios"
                >
                  <Save24Regular /> Guardar
                </button>
              </div>
            )}
          </div>
          <div className={styles.section}>
            <SearchableSelectComponent
              label="Seleccionar Dirección"
              value={tripFormData.origenNombreLugar || ""}
              selectedLabel={tripFormData.origenNombreDisplay || ""}
              onChange={(value, option) =>
                handlePlaceSelect("origenNombreLugar", value, option)
              }
              onSearch={handlePlaceSearch}
              onCreate={() => handleCreatePlace("origen")}
              required
              placeholder="Buscar"
              disabled={!origenEditor.isEditing}
              className={styles.input}
              hasError={fieldErrors.origenNombreLugar}
              errorMessage={
                fieldErrors.origenNombreLugar ? "Este campo es obligatorio" : ""
              }
            />
          </div>
          <div className={styles.section}>
            <InputComponent
              type="text"
              value={tripFormData.origenCalle || ""}
              onChange={handleTripInputChange("origenCalle")}
              disabled={!origenEditor.isEditing}
              label="Calle"
              required
              containerClassName={styles.streetInputContainer}
              hasError={fieldErrors.origenCalle}
              errorMessage={
                fieldErrors.origenCalle ? "Este campo es obligatorio" : ""
              }
            />
            <InputComponent
              type="text"
              value={tripFormData.origenNumero || ""}
              onChange={handleTripInputChange("origenNumero")}
              disabled={!origenEditor.isEditing}
              label="Número"
              containerClassName={styles.numberInputContainer}
            />
          </div>
          <div className={styles.section}>
            <InputComponent
              type="text"
              value={tripFormData.origenColonia || ""}
              onChange={handleTripInputChange("origenColonia")}
              disabled={!origenEditor.isEditing}
              label="Colonia"
              className={styles.input}
              containerClassName={styles.streetInputContainer}
            />
            <InputComponent
              type="text"
              value={tripFormData.origenCodigoPostal || ""}
              onChange={handleTripInputChange("origenCodigoPostal")}
              disabled={!origenEditor.isEditing}
              label="Código Postal"
              className={styles.input}
              containerClassName={styles.numberInputContainer}
            />
          </div>
          <div className={styles.section}>
            <InputComponent
              type="text"
              value={tripFormData.origenCiudad || ""}
              onChange={handleTripInputChange("origenCiudad")}
              disabled={!origenEditor.isEditing}
              label="Ciudad"
              className={styles.input}
            />
            <InputComponent
              type="text"
              value={tripFormData.origenEstado || ""}
              onChange={handleTripInputChange("origenEstado")}
              disabled={!origenEditor.isEditing}
              label="Estado"
              className={styles.input}
            />
          </div>

          {/* Es un vuelo radio buttons */}
          <Field label="¿Es un vuelo?" required>
            <div className={styles.radioOptions}>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="origenEsVuelo"
                  value="yes"
                  checked={tripFormData.origenEsVuelo === true}
                  onChange={() => handleRadioChange("origenEsVuelo", true)}
                />
                Sí
              </label>
              <label className={styles.radioOption}>
                <input
                  type="radio"
                  name="origenEsVuelo"
                  value="no"
                  checked={tripFormData.origenEsVuelo === false}
                  onChange={() => handleRadioChange("origenEsVuelo", false)}
                />
                No
              </label>
            </div>
          </Field>

          {tripFormData.origenEsVuelo && (
            <div className={styles.section}>
              <InputComponent
                type="text"
                value={tripFormData.origenNumeroVuelo || ""}
                onChange={handleTripInputChange("origenNumeroVuelo")}
                label="Número de vuelo"
              required
                className={styles.input}
              />
              <InputComponent
                type="text"
                value={tripFormData.origenAerolinea || ""}
                onChange={handleTripInputChange("origenAerolinea")}
                label="Aerolínea"
                className={styles.input}
              />
              <InputComponent
                type="text"
                value={tripFormData.origenLugarVuelo || ""}
                onChange={handleTripInputChange("origenLugarVuelo")}
                label="Origen de vuelo"
                className={styles.input}
              />
            </div>
          )}

          {tripFormData.origenEsVuelo && (
            <div className={styles.section}>
              <InputComponent
                type="textarea"
                value={tripFormData.origenNotas || ""}
                onChange={handleTripInputChange("origenNotas")}
                label="Notas adicionales"
                className={styles.textarea}
                containerClassName={styles.textareaContainer}
                style={{ width: "100%" }}
              />
            </div>
          )}

          <div className={styles.divider} />
          
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Dirección De Destino</h2>
            {!destinoEditor.isEditing && (
              <button
                type="button"
                onClick={destinoEditor.handleEdit}
                className={styles.editButton}
                title="Editar dirección de destino"
              >
                <Edit24Regular />
              </button>
            )}
            {destinoEditor.isEditing && destinoEditor.hasOriginal && (
              <div className={styles.actionButtons}>
                <button
                  type="button"
                  onClick={destinoEditor.handleCancel}
                  className={styles.cancelEditButton}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={destinoEditor.handleSave}
                  className={styles.saveButton}
                  title="Guardar cambios"
                >
                  <Save24Regular /> Guardar
                </button>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <SearchableSelectComponent
              label="Seleccionar Dirección"
              value={tripFormData.destinoNombreLugar || ""}
              selectedLabel={tripFormData.destinoNombreDisplay || ""}
              onChange={(value, option) =>
                handlePlaceSelect("destinoNombreLugar", value, option)
              }
              onSearch={handlePlaceSearch}
              onCreate={() => handleCreatePlace("destino")}
              required
              placeholder="Buscar"
              disabled={!destinoEditor.isEditing}
              className={styles.input}
              hasError={fieldErrors.destinoNombreLugar}
              errorMessage={
                fieldErrors.destinoNombreLugar
                  ? "Este campo es obligatorio"
                  : ""
              }
            />
          </div>
          <div className={styles.section}>
            <InputComponent
              type="text"
              value={tripFormData.destinoCalle || ""}
              onChange={handleTripInputChange("destinoCalle")}
              disabled={!destinoEditor.isEditing}
              label="Calle"
              required
              containerClassName={styles.streetInputContainer}
              hasError={fieldErrors.destinoCalle}
              errorMessage={
                fieldErrors.destinoCalle ? "Este campo es obligatorio" : ""
              }
            />
            <InputComponent
              type="text"
              value={tripFormData.destinoNumero || ""}
              onChange={handleTripInputChange("destinoNumero")}
              disabled={!destinoEditor.isEditing}
              label="Número"
              containerClassName={styles.numberInputContainer}
            />
          </div>
          <div className={styles.section}>
            <InputComponent
              type="text"
              value={tripFormData.destinoColonia || ""}
              onChange={handleTripInputChange("destinoColonia")}
              disabled={!destinoEditor.isEditing}
              label="Colonia"
              className={styles.input}
              containerClassName={styles.streetInputContainer}
            />
            <InputComponent
              type="text"
              value={tripFormData.destinoCodigoPostal || ""}
              onChange={handleTripInputChange("destinoCodigoPostal")}
              disabled={!destinoEditor.isEditing}
              label="Código Postal"
              className={styles.input}
              containerClassName={styles.numberInputContainer}
            />
          </div>
          <div className={styles.section}>
            <InputComponent
              type="text"
              value={tripFormData.destinoCiudad || ""}
              onChange={handleTripInputChange("destinoCiudad")}
              disabled={!destinoEditor.isEditing}
              label="Ciudad"
              className={styles.input}
            />
            <InputComponent
              type="text"
              value={tripFormData.destinoEstado || ""}
              onChange={handleTripInputChange("destinoEstado")}
              disabled={!destinoEditor.isEditing}
              label="Estado"
              className={styles.input}
            />
          </div>

          <div className={styles.divider}>
            <h2 className={styles.sectionTitle}>Viaje</h2>
          </div>

          <div className={styles.section}>
            <InputComponent
              type="number"
              value={tripFormData.numeroPasajeros || ""}
              onChange={handleTripInputChange("numeroPasajeros")}
              label="No. de pasajeros"
              className={styles.input}
              hasError={fieldErrors.numeroPasajeros}
              errorMessage={
                fieldErrors.numeroPasajeros ? "Este campo es obligatorio" : ""
              }
            />
          </div>

          <div className={styles.section}>
            <Field label="Tipo de viaje" required>
              <div className={styles.radioOptions}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="tipoViaje"
                    value="sencillo"
                    checked={tripFormData.tipoViaje === "sencillo"}
                    onChange={() =>
                      setTripFormData((prev) => ({
                        ...prev,
                        tipoViaje: "sencillo",
                      }))
                    }
                  />
                  Sencillo
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="tipoViaje"
                    value="roundTrip"
                    checked={tripFormData.tipoViaje === "redondo"}
                    onChange={() =>
                      setTripFormData((prev) => ({
                        ...prev,
                        tipoViaje: "redondo",
                      }))
                    }
                  />
                  Redondo
                </label>
              </div>
            </Field>
          </div>

          {tripFormData.tipoViaje === "redondo" && (
            <>
              <div className={styles.divider}>
                <h2 className={styles.subsectionTitle}>Regreso</h2>
              </div>
              <div className={styles.section}>
                <DatePickerComponent
                  id="regresoFecha"
                  label="Fecha de regreso"
                  value={tripFormData.regresoFecha || ""}
                  onChange={(value) => {
                    log.debug("Return date changed:", value);
                    setTripFormData((prev) => ({
                      ...prev,
                      regresoFecha: value,
                    }));
                  }}
                  placeholder="dd/mm/yyyy"
                  required
                />
                <InputComponent
                  type="number"
                  value={String(tripFormData.regresoHora ?? "")}
                  onChange={handleTripInputChange("regresoHora")}
                  label="Hora"
                  required
                  className={styles.input}
                />
                <InputComponent
                  type="number"
                  value={String(tripFormData.regresoMinutos ?? "")}
                  onChange={handleTripInputChange("regresoMinutos")}
                  label="Minutos"
                  required
                  className={styles.input}
                />
                <SelectComponent
                  label="AM/PM"
                  options={[
                    { value: "AM", label: "AM" },
                    { value: "PM", label: "PM" },
                  ]}
                  value={tripFormData.regresoAmPm || "AM"}
                  onChange={handleTripSelectChange("regresoAmPm")}
                  className={styles.input}
                />
              </div>
            </>
          )}

          <div className={styles.divider}>
            <h2 className={styles.sectionTitle}>Paradas</h2>
          </div>

          <div className={styles.section}>
            <ButtonComponent
              type="button"
              onClick={handleAddParada}
              icon={<AddFilled />}
              className={`${styles.button} ${styles.addButton} ${styles.paradasAddButton}`}
              style={{ backgroundColor: "#1a2e47", borderColor: "#1a2e47", color: "white" }}
            />
          </div>

          {paradas.map((parada, index) => (
            <ParadaItem
              key={parada.id}
              parada={parada}
              index={index}
              onRemove={handleRemoveParada}
              onChange={handleParadaChange}
              onPlaceSelect={handleParadaPlaceSelect}
              onPlaceSearch={handlePlaceSearch}
              onCreatePlace={handleCreatePlace}
              onAdd={handleAddParada}
            />
          ))}

          {/* Return Stops - only for round trips with outbound stops */}
          {tripFormData.tipoViaje === "redondo" && paradas.length > 0 && (
            <>
              <div className={styles.divider}>
                <h2 className={styles.sectionTitle}>Paradas De Regreso</h2>
              </div>
              <div className={styles.buttonGroup}>
                <label className={styles.radioLabel}>
                  ¿Cómo manejar las paradas de regreso?
                </label>
                <div className={styles.radioOptions}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="returnStopOption"
                      value="none"
                      checked={returnStopOption === "none"}
                      onChange={() => setReturnStopOption("none")}
                    />
                    Sin paradas de regreso
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="returnStopOption"
                      value="reverse"
                      checked={returnStopOption === "reverse"}
                      onChange={() => setReturnStopOption("reverse")}
                    />
                    Mismas paradas en orden inverso
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="returnStopOption"
                      value="custom"
                      checked={returnStopOption === "custom"}
                      onChange={() => setReturnStopOption("custom")}
                    />
                    Paradas diferentes
                  </label>
                </div>
              </div>

              {returnStopOption === "custom" && (
                <>
                  <div className={styles.section}>
                    <ButtonComponent
                      type="button"
                      onClick={handleAddReturnParada}
                      icon={<AddFilled />}
                      className={`${styles.button} ${styles.addButton} ${styles.paradasAddButton}`}
                      style={{ backgroundColor: "#1a2e47", borderColor: "#1a2e47", color: "white" }}
                    />
                  </div>
                  {returnParadas.map((parada, index) => (
                    <ParadaItem
                      key={parada.id}
                      parada={parada}
                      index={index}
                      onRemove={handleRemoveReturnParada}
                      onChange={handleReturnParadaChange}
                      onPlaceSelect={handleReturnParadaPlaceSelect}
                      onPlaceSearch={handlePlaceSearch}
                      onCreatePlace={handleCreatePlace}
                      onAdd={handleAddReturnParada}
                    />
                  ))}
                </>
              )}
            </>
          )}

          {canAssignResources && (
            <>
              <div className={styles.divider}>
                <h2 className={styles.sectionTitle}>Asignación</h2>
              </div>

              <h3 className={styles.subsectionTitle}>Tipos de Unidad</h3>

              {typeSelections.map((sel, index) => (
                <UnidadItem
                  key={sel.id}
                  selection={sel}
                  index={index}
                  tiposUnidad={tiposUnidad}
                  onRemove={handleRemoveTypeSelection}
                  onChange={handleTypeSelectionChange}
                  onAdd={handleAddTypeSelection}
                  canDelete={typeSelections.length > 1}
                />
              ))}

              {unitAssignments.length > 0 && (
                <>
                  <h3 className={styles.subsectionTitle}>Asignación de Unidades</h3>

                  {unitAssignments.map((asgn, index) => {
                    const typeName = tiposUnidad.find(
                      (t) => t.value === asgn.vehicleTypeId
                    );
                    const typeLabel = typeName
                      ? typeName.capacity
                        ? `${typeName.label} (${typeName.capacity} pax)`
                        : typeName.label
                      : `Tipo ${asgn.vehicleTypeId}`;

                    return (
                      <div
                        key={asgn.id}
                        className={styles.assignmentCard}
                      >
                        <span className={styles.assignmentBadge}>
                          Unidad {index + 1}: {typeLabel}
                        </span>
                        <div className={styles.unitAssignmentRow}>
                          <div>
                            <SelectComponent
                              label="Chofer"
                              options={[
                                { value: "", label: "Por Asignar" },
                                ...choferes,
                              ]}
                              value={asgn.driverId}
                              onChange={(e) =>
                                handleAssignmentChange(asgn.id, "driverId", e.target.value)
                              }
                              className={styles.input}
                            />
                          </div>
                          <div>
                            <SelectComponent
                              label="Unidad"
                              options={[
                                { value: "", label: "Por Asignar" },
                                ...unidades,
                              ]}
                              value={asgn.vehicleId}
                              onChange={(e) =>
                                handleAssignmentChange(asgn.id, "vehicleId", e.target.value)
                              }
                              className={styles.input}
                            />
                          </div>
                          <div>
                            <InputComponent
                              type="text"
                              value={asgn.notes}
                              onChange={(e) =>
                                handleAssignmentChange(asgn.id, "notes", e.target.value)
                              }
                              label="Notas"
                              placeholder="Ej: SUV para directivos"
                              className={styles.input}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              <div className={styles.section}>
                <InputComponent
                  type="textarea"
                  value={tripFormData.observacionesChofer || ""}
                  onChange={handleTripInputChange("observacionesChofer")}
                  label="Notas Adicionales"
                  className={styles.textarea}
                  containerClassName={styles.textareaContainer}
                  style={{ width: "100%" }}
                />
              </div>
            </>
          )}
          <div className={styles.section}>
            <InputComponent
              type="textarea"
              value={tripFormData.observacionesCliente || ""}
              onChange={handleTripInputChange("observacionesCliente")}
              label="Observaciones Para El Cliente"
              className={styles.textarea}
              containerClassName={styles.textareaContainer}
              style={{ width: "100%" }}
            />
          </div>
          <div className={styles.sectionButtons}>
            <div className={styles.actionButtons}>
              <ButtonComponent
                type="button"
                onClick={handleCancel}
                text="Atrás"
                appearance="outline"
                className={`${styles.button} ${styles.cancelButton}`}
              />
              <ButtonComponent
                type="button"
                onClick={handleSaveDraft}
                text="Guardar y agregar otro viaje"
                appearance="outline"
                className={`${styles.button} ${styles.cancelButton}`}
              />
              <ButtonComponent
                type="button"
                onClick={handleCreateTrip}
                text="Finalizar"
                appearance="primary"
                className={`${styles.button} ${styles.createButton}`}
              />
            </div>
          </div>
        </form>
      </div>

      <CreatePlaceModal
        isOpen={isPlaceModalOpen}
        onClose={() => {
          setIsPlaceModalOpen(false);
        }}
        onPlaceCreated={handlePlaceCreated}
      />

      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={() => setIsConfirmationModalOpen(false)}
        onConfirm={handleConfirmCreateTrip}
        orderData={orderData}
        tripFormData={tripFormData}
        paradas={paradas}
        unitAssignments={unitAssignments}
        lugares={lugares}
      />
    </main>
  );
}
