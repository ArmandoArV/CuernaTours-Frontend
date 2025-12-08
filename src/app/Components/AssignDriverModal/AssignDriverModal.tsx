"use client";
import React, { useState, useEffect, useCallback } from "react";
import styles from "./AssignDriverModal.module.css";
import SelectComponent from "../SelectComponent/SelectComponent";
import InputComponent from "../InputComponent/InputComponent";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { ContractTrip } from "@/app/backend_models/trip.model";
import { TripCollection, TripData } from "@/app/Types/TripTypes";
import {
  referenceService,
  DriverReference,
  VehicleReference,
} from "@/services/api/reference.service";
import { tripsService } from "@/services/api/trips.service";

interface AssignDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripData: ContractTrip | TripCollection | TripData | null;
  onAssign: (assignment: any) => void;
}

const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  isOpen,
  onClose,
  tripData,
  onAssign,
}) => {
  const [driverType, setDriverType] = useState<"internal" | "external">(
    "internal"
  );
  const [sameDriver, setSameDriver] = useState<"yes" | "no">("yes");

  // Driver and vehicle options (formatted for select)
  const [driverOptions, setDriverOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [vehicleOptions, setVehicleOptions] = useState<
    Array<{ value: string; label: string; licensePlate?: string }>
  >([]);

  // Raw data for matching
  const [driversData, setDriversData] = useState<DriverReference[]>([]);
  const [vehiclesData, setVehiclesData] = useState<VehicleReference[]>([]);

  // Form state
  const [driverId, setDriverId] = useState<string>("");
  const [vehicleId, setVehicleId] = useState<string>("");
  const [plate, setPlate] = useState<string>("");

  const [returnDriverId, setReturnDriverId] = useState<string>("");
  const [returnVehicleId, setReturnVehicleId] = useState<string>("");
  const [returnPlate, setReturnPlate] = useState<string>("");

  const [providerName, setProviderName] = useState<string>("");
  const [externalDriverName, setExternalDriverName] = useState<string>("");
  const [externalContact, setExternalContact] = useState<string>("");
  const [externalVehicleType, setExternalVehicleType] = useState<string>("");

  // Full trip data fetched from API
  const [fullTripData, setFullTripData] = useState<ContractTrip | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to get trip ID from tripData
  const getTripId = (): number | null => {
    if (!tripData) return null;
    const data = tripData as Record<string, any>;

    // Check for various ID property names
    const idKeys = ["contract_trip_id", "trip_id", "tripId", "id", "ID", "Id"];
    for (const key of idKeys) {
      if (key in data && data[key]) {
        const id = parseInt(data[key].toString(), 10);
        if (!isNaN(id)) return id;
      }
    }

    // Check for TripCollection
    if ("firstTrip" in tripData && (tripData as TripCollection).firstTrip) {
      const firstTrip = (tripData as TripCollection).firstTrip as Record<
        string,
        any
      >;
      if (firstTrip && "contract_trip_id" in firstTrip) {
        return firstTrip.contract_trip_id as number;
      }
    }

    return null;
  };

  // Use fullTripData if available, otherwise fall back to tripData
  const getActiveData = (): Record<string, any> | null => {
    return fullTripData || (tripData as Record<string, any>) || null;
  };

  // Helper function to get current assigned driver ID
  const getCurrentDriverId = (): string => {
    const data = getActiveData();
    if (!data) return "";

    // Check for driver_id property
    const driverIdKeys = ["driver_id", "driverId", "chofer_id"];
    for (const key of driverIdKeys) {
      if (key in data && data[key]) {
        return data[key].toString();
      }
    }

    // Check for nested driver object
    if ("driver" in data && data.driver) {
      if (
        typeof data.driver === "object" &&
        ("id" in data.driver || "user_id" in data.driver)
      ) {
        return (data.driver.id || data.driver.user_id).toString();
      }
    }

    return "";
  };

  // Helper function to get current assigned vehicle ID
  const getCurrentVehicleId = (): string => {
    const data = getActiveData();
    if (!data) return "";

    // Check for vehicle_id property
    const vehicleIdKeys = ["vehicle_id", "vehicleId", "unidad_id"];
    for (const key of vehicleIdKeys) {
      if (key in data && data[key]) {
        return data[key].toString();
      }
    }

    // Check for nested vehicle object
    if ("vehicle" in data && data.vehicle) {
      if (
        typeof data.vehicle === "object" &&
        ("id" in data.vehicle || "vehicle_id" in data.vehicle)
      ) {
        return (data.vehicle.id || data.vehicle.vehicle_id).toString();
      }
    }

    return "";
  };

  // Helper function to get current license plate
  const getCurrentPlate = (): string => {
    const data = getActiveData();
    if (!data) return "";

    // Check for nested vehicle object with license_plate
    if ("vehicle" in data && data.vehicle && typeof data.vehicle === "object") {
      if ("license_plate" in data.vehicle) {
        return data.vehicle.license_plate;
      }
    }

    // Check for direct plate properties
    const plateKeys = ["Placa", "placa", "license_plate", "licensePlate"];
    for (const key of plateKeys) {
      if (key in data && data[key] && typeof data[key] === "string") {
        return data[key];
      }
    }

    return "";
  };

  // Helper function to check if external driver is assigned
  const hasExternalDriver = (): boolean => {
    const data = getActiveData();
    if (!data) return false;

    const externalDriverKeys = [
      "external_driver_id",
      "externalDriverId",
      "external_driver",
    ];
    for (const key of externalDriverKeys) {
      if (key in data && data[key]) {
        return true;
      }
    }
    return false;
  };

  // Helper function to get external provider info
  const getExternalProviderInfo = (): {
    providerName: string;
    driverName: string;
    contact: string;
    vehicleType: string;
  } => {
    const data = getActiveData();
    if (!data)
      return { providerName: "", driverName: "", contact: "", vehicleType: "" };

    let providerName = "";
    let driverName = "";
    let contact = "";
    let vehicleType = "";

    // Check for external_provider object
    if ("external_provider" in data && data.external_provider) {
      const provider = data.external_provider;
      providerName = provider.provider_name || provider.name || "";
      contact = provider.phone || provider.contact || "";
    }

    // Check for external_driver object
    if ("external_driver" in data && data.external_driver) {
      const extDriver = data.external_driver;
      driverName = extDriver.driver_name || extDriver.name || "";
      if (!contact) contact = extDriver.phone || "";
    }

    // Check direct properties
    const providerKeys = [
      "Proveedor",
      "proveedor",
      "provider_name",
      "providerName",
    ];
    const driverNameKeys = [
      "Chofer externo",
      "chofer_externo",
      "external_driver_name",
      "externalDriverName",
    ];
    const contactKeys = ["Contacto", "contacto", "contact", "phone"];
    const vehicleTypeKeys = [
      "Tipo de unidad",
      "tipo_unidad",
      "vehicleType",
      "unit_type",
    ];

    for (const key of providerKeys) {
      if (!providerName && key in data && data[key]) providerName = data[key];
    }
    for (const key of driverNameKeys) {
      if (!driverName && key in data && data[key]) driverName = data[key];
    }
    for (const key of contactKeys) {
      if (!contact && key in data && data[key]) contact = data[key];
    }
    for (const key of vehicleTypeKeys) {
      if (!vehicleType && key in data && data[key]) vehicleType = data[key];
    }

    return { providerName, driverName, contact, vehicleType };
  };

  // Helper function to get driver name from tripData (for matching)
  const getDriverNameFromData = (): string | null => {
    const d = getActiveData();
    if (!d) return null;

    // Check for nested driver object first (from API response)
    if ("driver" in d && d.driver && typeof d.driver === "object") {
      const driver = d.driver;
      if ("name" in driver && "lastname" in driver)
        return `${driver.name} ${driver.lastname}`;
      if ("name" in driver && "first_lastname" in driver)
        return `${driver.name} ${driver.first_lastname}`;
      if ("name" in driver) return driver.name;
    }

    // Check for direct driver name properties (for table row data)
    const driverNameKeys = [
      "Chofer",
      "chofer",
      "driver_name",
      "driverName",
      "Driver",
    ];
    for (const key of driverNameKeys) {
      if (key in d && d[key] && typeof d[key] === "string") {
        return d[key];
      }
    }
    return null;
  };

  // Helper function to get vehicle name from tripData (for matching)
  const getVehicleNameFromData = (): string | null => {
    const d = getActiveData();
    if (!d) return null;

    // Check for nested vehicle object first (from API response)
    if ("vehicle" in d && d.vehicle && typeof d.vehicle === "object") {
      const vehicle = d.vehicle;
      if ("alias" in vehicle && vehicle.alias) return vehicle.alias;
      if ("type" in vehicle && vehicle.type) return vehicle.type;
    }

    // Check for direct vehicle name properties (for table row data)
    const vehicleKeys = [
      "Unidad",
      "unidad",
      "vehicle_name",
      "vehicleName",
      "Vehicle",
    ];
    for (const key of vehicleKeys) {
      if (key in d && d[key] && typeof d[key] === "string") {
        return d[key];
      }
    }
    return null;
  };

  // Fetch drivers using referenceService (like CreateTripContent)
  const fetchChoferes = useCallback(async () => {
    try {
      const data = await referenceService.getDrivers();
      setDriversData(data);
      const options = referenceService.transformDriversForSelect(data);
      setDriverOptions(options);

      // Return the data for chaining
      return data;
    } catch (error) {
      console.error("Error fetching choferes:", error);
      return [];
    }
  }, []);

  // Fetch vehicles using referenceService (like CreateTripContent)
  const fetchUnidades = useCallback(async () => {
    try {
      const data = await referenceService.getVehicles();
      setVehiclesData(data);
      const options = referenceService.transformVehiclesForSelect(data);
      setVehicleOptions(options);

      // Return the data for chaining
      return data;
    } catch (error) {
      console.error("Error fetching unidades:", error);
      return [];
    }
  }, []);

  // Match driver by name and return ID
  const matchDriverByName = (
    driverName: string,
    drivers: DriverReference[]
  ): string | null => {
    if (!driverName || !drivers.length) return null;
    const matchedDriver = drivers.find((d) => {
      const fullName = d.name
        ? `${d.name} ${d.first_lastname || ""}`.trim().toLowerCase()
        : d.nombre?.toLowerCase() || "";
      return (
        fullName === driverName.toLowerCase() ||
        fullName.includes(driverName.toLowerCase()) ||
        driverName.toLowerCase().includes(fullName)
      );
    });
    return matchedDriver
      ? (matchedDriver.user_id || matchedDriver.id)?.toString() || null
      : null;
  };

  // Match vehicle by name and return ID and plate
  const matchVehicleByName = (
    vehicleName: string,
    vehicles: VehicleReference[]
  ): { id: string | null; plate: string } => {
    if (!vehicleName || !vehicles.length) return { id: null, plate: "" };
    const matchedVehicle = vehicles.find((v) => {
      const alias = v.alias?.toLowerCase() || "";
      const type = (v.type || v.tipo)?.toLowerCase() || "";
      const plate = (v.license_plate || v.placa)?.toLowerCase() || "";
      const searchName = vehicleName.toLowerCase();
      return (
        alias === searchName ||
        type === searchName ||
        plate === searchName ||
        alias.includes(searchName) ||
        searchName.includes(alias)
      );
    });
    return matchedVehicle
      ? {
          id:
            (matchedVehicle.vehicle_id || matchedVehicle.id)?.toString() ||
            null,
          plate: matchedVehicle.license_plate || matchedVehicle.placa || "",
        }
      : { id: null, plate: "" };
  };

  useEffect(() => {
    if (isOpen && tripData) {
      // Fetch full trip data from API, then fetch drivers and vehicles
      const initializeForm = async () => {
        setIsLoading(true);

        try {
          // First, try to get the trip ID and fetch full data from API
          const tripId = getTripId();
          let fetchedTripData: ContractTrip | null = null;

          if (tripId) {
            try {
              fetchedTripData = await tripsService.getById(tripId);
              setFullTripData(fetchedTripData);
              console.log("Fetched full trip data from API:", fetchedTripData);
            } catch (error) {
              console.error("Error fetching trip by ID:", error);
              // Continue with tripData if API call fails
            }
          }

          // Fetch drivers and vehicles
          const [drivers, vehicles] = await Promise.all([
            fetchChoferes(),
            fetchUnidades(),
          ]);

          // Transform vehicles to get options with licensePlate
          const vehicleOpts =
            referenceService.transformVehiclesForSelect(vehicles);

          // Use fetched data if available, otherwise use tripData
          const activeData =
            fetchedTripData || (tripData as Record<string, any>);

          // Get existing IDs from active data
          let existingDriverId = "";
          let existingVehicleId = "";
          let existingPlate = "";

          if (activeData) {
            // Check for driver_id
            if ("driver_id" in activeData && activeData.driver_id) {
              existingDriverId = activeData.driver_id.toString();
            } else if (
              "driver" in activeData &&
              activeData.driver &&
              typeof activeData.driver === "object"
            ) {
              existingDriverId =
                (
                  activeData.driver.user_id || activeData.driver.id
                )?.toString() || "";
            }

            // Check for vehicle_id
            if ("vehicle_id" in activeData && activeData.vehicle_id) {
              existingVehicleId = activeData.vehicle_id.toString();
            } else if (
              "vehicle" in activeData &&
              activeData.vehicle &&
              typeof activeData.vehicle === "object"
            ) {
              existingVehicleId =
                (
                  activeData.vehicle.vehicle_id || activeData.vehicle.id
                )?.toString() || "";
            }

            // Check for license_plate
            if (
              "vehicle" in activeData &&
              activeData.vehicle &&
              typeof activeData.vehicle === "object"
            ) {
              existingPlate = activeData.vehicle.license_plate || "";
            } else if ("Placa" in activeData) {
              existingPlate = activeData.Placa || "";
            }
          }

          console.log("Active data for form:", {
            existingDriverId,
            existingVehicleId,
            existingPlate,
          });

          // Get names for matching (when we only have names, not IDs)
          const driverName = getDriverNameFromData();
          const vehicleName = getVehicleNameFromData();

          // Set driver ID - either from existing ID or by matching name
          if (existingDriverId) {
            setDriverId(existingDriverId);
          } else if (driverName && drivers.length > 0) {
            const matchedDriverId = matchDriverByName(driverName, drivers);
            if (matchedDriverId) {
              setDriverId(matchedDriverId);
            } else {
              setDriverId("");
            }
          } else {
            setDriverId("");
          }

          // Set vehicle ID and plate - either from existing ID or by matching name
          if (existingVehicleId) {
            setVehicleId(existingVehicleId);
            // Find plate from vehicle options
            const vehicleOpt = vehicleOpts.find(
              (v) => v.value === existingVehicleId
            );
            setPlate(vehicleOpt?.licensePlate || existingPlate || "");
          } else if (vehicleName && vehicles.length > 0) {
            const matchedVehicle = matchVehicleByName(vehicleName, vehicles);
            if (matchedVehicle.id) {
              setVehicleId(matchedVehicle.id);
              // Find plate from vehicle options using the matched ID
              const vehicleOpt = vehicleOpts.find(
                (v) => v.value === matchedVehicle.id
              );
              setPlate(vehicleOpt?.licensePlate || matchedVehicle.plate || "");
            } else {
              setVehicleId("");
              setPlate(existingPlate || "");
            }
          } else {
            setVehicleId("");
            setPlate(existingPlate || "");
          }

          // Set driver type based on existing assignment
          if (hasExternalDriver()) {
            setDriverType("external");
            // Pre-fill external provider info
            const externalInfo = getExternalProviderInfo();
            setProviderName(externalInfo.providerName);
            setExternalDriverName(externalInfo.driverName);
            setExternalContact(externalInfo.contact);
            setExternalVehicleType(externalInfo.vehicleType);
          } else {
            setDriverType("internal");
            // Reset external provider fields
            setProviderName("");
            setExternalDriverName("");
            setExternalContact("");
            setExternalVehicleType("");
          }

          // Reset return trip fields
          setReturnDriverId("");
          setReturnVehicleId("");
          setReturnPlate("");

          // Reset user selection tracking
          setIsUserVehicleSelection(false);
          setIsUserReturnVehicleSelection(false);
          setInitialPlateSet(false);
        } catch (error) {
          console.error("Error initializing form:", error);
        } finally {
          setIsLoading(false);
        }
      };

      // Reset fullTripData when modal opens with new tripData
      setFullTripData(null);
      initializeForm();
    } else if (!isOpen) {
      // Reset when modal closes
      setFullTripData(null);
    }
  }, [isOpen, tripData, fetchChoferes, fetchUnidades]);

  // Track if vehicle selection was user-initiated
  const [isUserVehicleSelection, setIsUserVehicleSelection] = useState(false);

  // Track if the initial plate has been set
  const [initialPlateSet, setInitialPlateSet] = useState(false);

  // Set initial plate when vehicleOptions are loaded and vehicleId is set
  useEffect(() => {
    if (!initialPlateSet && vehicleId && vehicleOptions.length > 0 && !plate) {
      const selectedVehicle = vehicleOptions.find((v) => v.value === vehicleId);
      if (selectedVehicle?.licensePlate) {
        setPlate(selectedVehicle.licensePlate);
        setInitialPlateSet(true);
      }
    }
  }, [vehicleId, vehicleOptions, plate, initialPlateSet]);

  useEffect(() => {
    // Only update plate from vehicle selection if user explicitly selected a new vehicle
    if (isUserVehicleSelection && vehicleId && vehicleOptions.length > 0) {
      const selectedVehicle = vehicleOptions.find((v) => v.value === vehicleId);
      setPlate(selectedVehicle?.licensePlate || "");
    }
  }, [vehicleId, vehicleOptions, isUserVehicleSelection]);

  // Track if return vehicle selection was user-initiated
  const [isUserReturnVehicleSelection, setIsUserReturnVehicleSelection] =
    useState(false);

  useEffect(() => {
    // Only update plate from vehicle selection if user explicitly selected a new vehicle
    if (
      isUserReturnVehicleSelection &&
      returnVehicleId &&
      vehicleOptions.length > 0
    ) {
      const selectedReturnVehicle = vehicleOptions.find(
        (v) => v.value === returnVehicleId
      );
      setReturnPlate(selectedReturnVehicle?.licensePlate || "");
    }
  }, [returnVehicleId, vehicleOptions, isUserReturnVehicleSelection]);

  if (!isOpen || !tripData) return null;

  // DEBUG: Log the raw tripData to see what we're receiving
  console.log("=== AssignDriverModal Debug ===");
  console.log("Raw tripData:", tripData);
  console.log("tripData type:", typeof tripData);
  console.log("tripData keys:", Object.keys(tripData));
  console.log("tripData JSON:", JSON.stringify(tripData, null, 2));

  // Cast tripData to allow dynamic property access
  const data = tripData as Record<string, any>;

  // Helper functions to safely access trip data
  const getTripType = (): string => {
    // Check for various trip type property names
    const tripTypeKeys = [
      "Tipo de viaje",
      "Tipo",
      "tipo",
      "Trip Type",
      "tripType",
      "trip_type",
      "type",
      "TipoViaje",
    ];
    for (const key of tripTypeKeys) {
      if (key in data && data[key] && typeof data[key] === "string") {
        return data[key];
      }
    }
    // Check for TripCollection
    if (
      "tripType" in tripData &&
      typeof (tripData as TripCollection).tripType === "string"
    ) {
      return (tripData as TripCollection).tripType;
    }
    return "Sencillo";
  };

  const getOriginName = (): string => {
    // Check for nested origin object
    if (
      "origin" in data &&
      data.origin &&
      typeof data.origin === "object" &&
      "name" in data.origin
    ) {
      return data.origin.name;
    }
    // Check for direct origin properties
    const originKeys = [
      "Origen",
      "origen",
      "Origin",
      "origin_name",
      "originName",
      "origin",
    ];
    for (const key of originKeys) {
      if (key in data && data[key] && typeof data[key] === "string") {
        return data[key];
      }
    }
    // Check for TripCollection
    if ("firstTrip" in tripData && (tripData as TripCollection).firstTrip) {
      return (tripData as TripCollection).firstTrip!.originName;
    }
    return "N/A";
  };

  const getDestinationName = (): string => {
    // Check for nested destination object
    if (
      "destination" in data &&
      data.destination &&
      typeof data.destination === "object" &&
      "name" in data.destination
    ) {
      return data.destination.name;
    }
    // Check for direct destination properties
    const destinationKeys = [
      "Destino",
      "destino",
      "Destination",
      "destination_name",
      "destinationName",
      "destination",
    ];
    for (const key of destinationKeys) {
      if (key in data && data[key] && typeof data[key] === "string") {
        return data[key];
      }
    }
    // Check for TripCollection
    if ("firstTrip" in tripData && (tripData as TripCollection).firstTrip) {
      return (tripData as TripCollection).firstTrip!.destinationName;
    }
    return "N/A";
  };

  const getServiceDate = (): Date => {
    // Check for various date property names
    const dateKeys = [
      "Fecha",
      "fecha",
      "Date",
      "service_date",
      "serviceDate",
      "departure_date",
      "departureDate",
      "date",
      "Fecha de Servicio",
      "Fecha de salida",
    ];
    for (const key of dateKeys) {
      if (key in data && data[key]) {
        const dateValue = data[key];
        if (
          typeof dateValue === "string" ||
          typeof dateValue === "number" ||
          dateValue instanceof Date
        ) {
          const parsedDate = new Date(dateValue);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate;
          }
        }
      }
    }
    // Check for TripCollection
    if ("firstTrip" in tripData && (tripData as TripCollection).firstTrip) {
      return (tripData as TripCollection).firstTrip!.formattedServiceDate;
    }
    return new Date();
  };

  const getPassengers = (): number => {
    // Check for various passenger property names
    const passengerKeys = [
      "Pasajeros",
      "pasajeros",
      "Passengers",
      "passengers",
      "No. de Pasajeros",
      "No. Pasajeros",
      "passenger_count",
      "passengerCount",
    ];
    for (const key of passengerKeys) {
      if (key in data && data[key]) {
        const passengerValue = data[key];
        if (typeof passengerValue === "number") {
          return passengerValue;
        }
        if (typeof passengerValue === "string") {
          const parsed = parseInt(passengerValue, 10);
          if (!isNaN(parsed) && parsed > 0) {
            return parsed;
          }
        }
      }
    }
    // Check for TripCollection
    if (
      "totalPassengers" in tripData &&
      typeof (tripData as TripCollection).totalPassengers === "number"
    ) {
      return (tripData as TripCollection).totalPassengers;
    }
    return 1;
  };

  // Get current assignment info for display
  const getCurrentDriverName = (): string | null => {
    // Check for direct driver name properties FIRST (for table row data like "Chofer": "Alfredo Rosas")
    const driverNameKeys = [
      "Chofer",
      "chofer",
      "driver_name",
      "driverName",
      "Driver",
    ];
    for (const key of driverNameKeys) {
      if (key in data && data[key] && typeof data[key] === "string") {
        return data[key];
      }
    }
    // Check for nested driver object
    if ("driver" in data && data.driver && typeof data.driver === "object") {
      const driver = data.driver;
      if ("name" in driver && "lastname" in driver) {
        return `${driver.name} ${driver.lastname}`;
      }
      if ("name" in driver && "first_lastname" in driver) {
        return `${driver.name} ${driver.first_lastname}`;
      }
      if ("name" in driver) {
        return driver.name;
      }
    }
    return null;
  };

  const getCurrentVehicleInfo = (): string | null => {
    // Check for direct vehicle properties FIRST (for table row data like "Unidad": "RAV")
    const vehicleKeys = [
      "Unidad",
      "unidad",
      "vehicle_name",
      "vehicleName",
      "Vehicle",
    ];
    for (const key of vehicleKeys) {
      if (key in data && data[key] && typeof data[key] === "string") {
        return data[key];
      }
    }
    // Check for nested vehicle object
    if ("vehicle" in data && data.vehicle && typeof data.vehicle === "object") {
      const vehicle = data.vehicle;
      const parts = [];
      if ("alias" in vehicle && vehicle.alias) parts.push(vehicle.alias);
      else if ("brand" in vehicle && vehicle.brand) parts.push(vehicle.brand);
      if ("type" in vehicle && vehicle.type) parts.push(vehicle.type);
      if ("license_plate" in vehicle && vehicle.license_plate)
        parts.push(`(${vehicle.license_plate})`);
      if (parts.length > 0) return parts.join(" ");
    }
    return null;
  };

  const currentDriverName = getCurrentDriverName();
  const currentVehicleInfo = getCurrentVehicleInfo();
  const currentPlate = getCurrentPlate();

  // DEBUG: Log extracted values
  console.log("=== Extracted Values ===");
  console.log("Origin:", getOriginName());
  console.log("Destination:", getDestinationName());
  console.log("Trip Type:", getTripType());
  console.log("Service Date:", getServiceDate());
  console.log("Passengers:", getPassengers());
  console.log("Current Driver ID:", getCurrentDriverId());
  console.log("Current Vehicle ID:", getCurrentVehicleId());
  console.log("Current Driver Name:", currentDriverName);
  console.log("Current Vehicle Info:", currentVehicleInfo);
  console.log("Current Plate:", currentPlate);
  console.log("Has External Driver:", hasExternalDriver());
  console.log("Driver Options:", driverOptions);
  console.log("Vehicle Options:", vehicleOptions);
  console.log("========================");

  const handleAssign = () => {
    let assignmentData = {};
    if (driverType === "internal") {
      assignmentData = {
        driverType,
        sameDriver,
        driverId,
        vehicleId,
        plate,
        ...(sameDriver === "no" && {
          returnDriverId,
          returnVehicleId,
          returnPlate,
        }),
      };
    } else {
      assignmentData = {
        driverType,
        providerName,
        externalDriverName,
        externalContact,
        externalVehicleType,
      };
    }
    onAssign(assignmentData);
  };

  const isRoundTrip = getTripType() === "Redondo";

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeButton} onClick={onClose}>
          &times;
        </button>
        <h2>Asignar chofer y unidad</h2>

        {isLoading ? (
          <div className={styles.loading}>
            <p>Cargando información del viaje...</p>
          </div>
        ) : (
          <>
            <div className={styles.tripInfo}>
              <p>
                <strong>Origen:</strong> {getOriginName()}
              </p>
              <p>
                <strong>Destino:</strong> {getDestinationName()}
              </p>
              <p>
                <strong>Tipo de viaje:</strong> {getTripType()}
              </p>
              <p>
                <strong>Fecha:</strong> {getServiceDate().toLocaleString()}
              </p>
              <p>
                <strong>No. de pasajeros:</strong> {getPassengers()}
              </p>
              {(currentDriverName || currentVehicleInfo || currentPlate) && (
                <div className={styles.currentAssignment}>
                  <p>
                    <strong>Asignación actual:</strong>
                  </p>
                  {currentDriverName && (
                    <p>
                      <strong>Chofer:</strong> {currentDriverName}
                    </p>
                  )}
                  {currentVehicleInfo && (
                    <p>
                      <strong>Unidad:</strong> {currentVehicleInfo}
                    </p>
                  )}
                  {currentPlate &&
                    !currentVehicleInfo?.includes(currentPlate) && (
                      <p>
                        <strong>Placa:</strong> {currentPlate}
                      </p>
                    )}
                </div>
              )}
            </div>

            <div className={styles.driverTypeSelector}>
              <label>
                <input
                  type="radio"
                  name="driverType"
                  value="internal"
                  checked={driverType === "internal"}
                  onChange={() => setDriverType("internal")}
                />
                Chofer interno
              </label>
              <label>
                <input
                  type="radio"
                  name="driverType"
                  value="external"
                  checked={driverType === "external"}
                  onChange={() => setDriverType("external")}
                />
                Proveedor externo
              </label>
            </div>

            {driverType === "internal" ? (
              <>
                {/* Always show same driver question for ida/vuelta */}
                <div className={styles.sameDriverSelector}>
                  <p>¿Mismo chofer para ida y regreso? *</p>
                  <label>
                    <input
                      type="radio"
                      name="sameDriver"
                      value="yes"
                      checked={sameDriver === "yes"}
                      onChange={() => setSameDriver("yes")}
                    />
                    Sí
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="sameDriver"
                      value="no"
                      checked={sameDriver === "no"}
                      onChange={() => setSameDriver("no")}
                    />
                    No
                  </label>
                </div>

                {sameDriver === "yes" ? (
                  <div className={styles.formSection}>
                    <SelectComponent
                      label="Nombre del chofer"
                      value={driverId}
                      options={driverOptions}
                      onChange={(e) => setDriverId(e.target.value)}
                    />
                    <div className={styles.unitSection}>
                      <SelectComponent
                        label="Unidad asignada"
                        value={vehicleId}
                        options={vehicleOptions}
                        onChange={(e) => {
                          setIsUserVehicleSelection(true);
                          setVehicleId(e.target.value);
                        }}
                      />
                      <InputComponent
                        label="Placa"
                        type="text"
                        value={plate}
                        placeholder="Placa"
                        disabled
                        onChange={() => {}} // Disabled input doesn't need functional onChange
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.formSection}>
                      <h4>Chofer ida</h4>
                      <SelectComponent
                        label="Nombre del chofer"
                        value={driverId}
                        options={driverOptions}
                        onChange={(e) => setDriverId(e.target.value)}
                      />
                      <div className={styles.unitSection}>
                        <SelectComponent
                          label="Unidad asignada"
                          value={vehicleId}
                          options={vehicleOptions}
                          onChange={(e) => {
                            setIsUserVehicleSelection(true);
                            setVehicleId(e.target.value);
                          }}
                        />
                        <InputComponent
                          label="Placa"
                          type="text"
                          value={plate}
                          placeholder="Placa"
                          disabled
                          onChange={() => {}} // Disabled input doesn't need functional onChange
                        />
                      </div>
                    </div>
                    <div className={styles.formSection}>
                      <h4>Chofer regreso</h4>
                      <SelectComponent
                        label="Nombre del chofer"
                        value={returnDriverId}
                        options={driverOptions}
                        onChange={(e) => setReturnDriverId(e.target.value)}
                      />
                      <div className={styles.unitSection}>
                        <SelectComponent
                          label="Unidad asignada"
                          value={returnVehicleId}
                          options={vehicleOptions}
                          onChange={(e) => {
                            setIsUserReturnVehicleSelection(true);
                            setReturnVehicleId(e.target.value);
                          }}
                        />
                        <InputComponent
                          label="Placa"
                          type="text"
                          value={returnPlate}
                          placeholder="Placa"
                          disabled
                          onChange={() => {}} // Disabled input doesn't need functional onChange
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className={styles.formSection}>
                <InputComponent
                  label="Nombre del proveedor"
                  type="text"
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="Nombre del proveedor"
                />
                <div className={styles.unitSection}>
                  <InputComponent
                    label="Nombre del chofer"
                    type="text"
                    value={externalDriverName}
                    onChange={(e) => setExternalDriverName(e.target.value)}
                    placeholder="Nombre del chofer"
                  />
                  <InputComponent
                    label="Contacto"
                    type="text"
                    value={externalContact}
                    onChange={(e) => setExternalContact(e.target.value)}
                    placeholder="Contacto"
                  />
                </div>
                <SelectComponent
                  label="Tipo de unidad"
                  value={externalVehicleType}
                  options={[
                    { value: "auto", label: "Auto" },
                    { value: "camioneta", label: "Camioneta" },
                    { value: "autobus", label: "Autobús" },
                  ]}
                  onChange={(e) => setExternalVehicleType(e.target.value)}
                />
              </div>
            )}

            <div className={styles.modalActions}>
              <ButtonComponent
                type="cancel"
                onClick={onClose}
                text="Cancelar"
              />
              <ButtonComponent
                type="button"
                onClick={handleAssign}
                text="Asignar"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AssignDriverModal;
