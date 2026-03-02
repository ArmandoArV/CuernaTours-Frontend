"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import FilterableTableComponent from "../FilterableTable/FilterableTableComponent";
import { FilterConfig, FilterPresets } from "../FilterComponent";
import DateRangeFilter from "../DateRangeFilter/DateRangeFilter";

import {
  AddFilled,
  DocumentAddRegular,
  ArrowRepeatAllRegular,
  ArrowClockwiseRegular,
} from "@fluentui/react-icons";
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
} from "@fluentui/react-components";

import {
  MoreVerticalRegular,
  PersonAddRegular,
  EditRegular,
  MoneyRegular,
} from "@fluentui/react-icons";
import { useRouter } from "next/navigation";
import { contractsService, ApiError } from "@/services/api";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { useUserRole } from "@/app/hooks/useUserRole";
import AssignDriverModal from "../AssignDriverModal/AssignDriverModal";
import DriverPaymentModal from "../DriverPaymentModal/DriverPaymentModal";
import LoadingComponent from "../LoadingComponent/LoadingComponent";
import { formatDateStandard, formatPersonName } from "@/app/Utils/FormatUtil";
import styles from "./DashboardContent.module.css";

// Status mapping based on provided ids
const STATUS_MAP: Record<number, string> = {
  1: "Pendiente",
  2: "En curso",
  3: "Finalizado",
  4: "Cancelado",
};

// ✅ Prevent UTC parsing problems
const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

// ✅ Compare only calendar days (timezone-safe)
const toDayNumber = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

// Function to transform API data to table format (contract-based)
// Function to transform API data to table format (contract-based)
function transformApiData(apiData: any[]): any[] {
  // Filter out "Finalizado" (3) and "Cancelado" (4) contracts
  const activeContracts = apiData.filter((contract) => {
    const statusId = contract.contract_status_id || contract.status?.id;
    const statusName = contract.contract_status_name || contract.status?.name;
    return (
      statusId !== 3 &&
      statusId !== 4 &&
      statusName !== "Finalizado" &&
      statusName !== "Cancelado"
    );
  });

  const now = new Date();
  const nowTime = now.getTime();

  return activeContracts
    .map((contract) => {
      const trips = contract.trips || [];
      const firstTrip = trips[0] || {};

      // Get contract status
      const contractStatusId =
        contract.contract_status_id || contract.status?.id;
      const contractStatus =
        STATUS_MAP[contractStatusId] ||
        contract.contract_status_name ||
        contract.status?.name ||
        "";

      // Calculate trip count and assignment status
      const tripCount = trips.length;
      const assignedTrips = trips.filter((t: any) => {
        // Check for driver assignment (either nested driver object or direct driver_id)
        const hasDriver = t.driver?.id || t.driver_id || t.external_driver_id;
        // Check for vehicle assignment (either nested vehicle object or direct vehicle_id)
        const hasVehicle = t.vehicle?.id || t.vehicle_id;
        return hasDriver && hasVehicle;
      }).length;

      const assignmentStatus =
        tripCount > 0 ? `${assignedTrips}/${tripCount}` : "0/0";

      // Extract time from service_date or service_time
      let scheduleTime = "";
      if (firstTrip.service_date) {
        const serviceDate = new Date(firstTrip.service_date);
        scheduleTime = serviceDate.toLocaleTimeString("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      } else if (firstTrip.service_time) {
        scheduleTime = firstTrip.service_time;
      }

      // Parse the service date
      let serviceDateObj = null;
      if (firstTrip.service_date) {
        serviceDateObj = new Date(firstTrip.service_date);
      }

      return {
        "ID Contrato": contract.contract_id,
        "Empresa O Cliente": formatPersonName(contract.client_name) || "",
        Fecha: formatDateStandard(firstTrip.service_date),
        Horario: scheduleTime,
        Asignados: assignmentStatus,
        Monto: contract.amount ? `$${contract.amount.toLocaleString()}` : "",
        Estatus: contractStatus,
        "Estado de Pago":
          contract.payment_status === "paid" ? "Pagado" : "Pendiente",
        // Include IDs and data for functionality
        contract_id: contract.contract_id,
        // Store full contract object for details and modals
        _contractData: contract,
        _trips: trips,
        // Store raw date and timestamp for sorting
        _sortDate: serviceDateObj,
        _sortTimestamp: serviceDateObj ? serviceDateObj.getTime() : null,
        // Store absolute difference from current date for proximity sorting
        _proximity: serviceDateObj
          ? Math.abs(serviceDateObj.getTime() - nowTime)
          : Number.MAX_SAFE_INTEGER,
      };
    })
    .sort((a, b) => {
      // Sort by proximity to current date (closest first)

      // Handle cases where dates are missing
      if (!a._sortDate && !b._sortDate) return 0;
      if (!a._sortDate) return 1; // Items without dates go to the end
      if (!b._sortDate) return -1;

      // Calculate absolute difference from current date
      const diffA = Math.abs(a._sortDate.getTime() - nowTime);
      const diffB = Math.abs(b._sortDate.getTime() - nowTime);

      // Sort by closest date first (smallest difference)
      return diffA - diffB;
    });
}
export default function DashboardContent() {
  const router = useRouter();
  const { hasFullAccess, canCreateOrders, canAssignResources } = useUserRole();
  const [currentPage, setCurrentPage] = useState(1);
  const [contractsData, setContractsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = useState(false);
  const [isDriverPaymentModalOpen, setIsDriverPaymentModalOpen] =
    useState(false);
  const [selectedTripData, setSelectedTripData] = useState<any>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Date range filter states
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // Fetch data from API
  const fetchContracts = async () => {
    try {
      setLoading(true);
      const data = await contractsService.getAll();
      setContractsData(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching contracts:", err);

      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }

      // Fallback to empty array in case of error
      setContractsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // Transform API data for the table
  const transformedData = transformApiData(contractsData);

  const sampleData = useMemo(() => {
    // No filter applied
    if (!dateRangeStart || !dateRangeEnd) {
      return transformedData;
    }

    const startDate = parseLocalDate(dateRangeStart);
    const endDate = parseLocalDate(dateRangeEnd);

    const startDay = toDayNumber(startDate);
    const endDay = toDayNumber(endDate);

    return transformedData.filter((item) => {
      if (!item._sortDate) return false;

      const itemDay = toDayNumber(new Date(item._sortDate));

      return itemDay >= startDay && itemDay <= endDay;
    });
  }, [transformedData, dateRangeStart, dateRangeEnd]);

  const handleDateRangeChange = (start: string, end: string) => {
    setDateRangeStart(start);
    setDateRangeEnd(end);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const columns = [
    "Empresa O Cliente",
    "Fecha",
    "Horario",
    "Asignados",
    "Monto",
    "Estatus",
    "Estado de Pago",
  ];

  // Configure filters for the table (without date filter, using DateRangeFilter instead)
  const filterConfigs: FilterConfig[] = [
    FilterPresets.createSelectFilter(
      "Empresa O Cliente",
      "Cliente",
      Array.from(
        new Set(transformedData.map((item) => item["Empresa O Cliente"])),
      ),
      "Filtrar Por Cliente",
    ),

    FilterPresets.createSelectFilter(
      "Estado de Pago",
      "Pago",
      ["Pagado", "Pendiente"],
      "Filtrar Por Estado de Pago",
    ),
  ];

  // Handlers removed: table will show inline details when the eye button is clicked.

  const handleFiltersChange = (
    activeFilters: Record<string, string | string[]>,
  ) => {
    console.log("Filtros aplicados:", activeFilters);
  };

  const handleSearch = (searchTerm: string) => {
    console.log("Búsqueda:", searchTerm);
  };

  const handleButtonClick = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMenuItemClick = (path: string) => {
    setShowDropdown(false);
    router.push(path);
  };

  // Action handlers for table dropdown actions
  const handleEditOrder = (row: any) => {
    if (row.contract_id) {
      router.push(`/dashboard/order/${row.contract_id}`);
    }
  };

  const handleAssignDriver = (row: any) => {
    // Get the first unassigned trip from the contract
    const trips = row._trips || [];
    const unassignedTrip = trips.find(
      (t: any) => !t.driver_id && !t.external_driver_id,
    );
    const tripToAssign = unassignedTrip || trips[0];

    if (tripToAssign) {
      setSelectedTripData(tripToAssign);
      setIsAssignDriverModalOpen(true);
    } else {
      console.warn("No trips found in contract");
    }
  };

  const handlePayDriver = (row: any) => {
    // Get the first trip from the contract
    const trips = row._trips || [];
    if (trips.length > 0) {
      const tripId = trips[0].trip_id || trips[0].contract_trip_id;
      setSelectedTripId(tripId ? String(tripId) : null);
      setIsDriverPaymentModalOpen(true);
    } else {
      console.warn("No trips found in contract");
    }
  };

  const handleDriverAssignment = async (assignmentData: any) => {
    console.log("Driver assigned:", assignmentData);
    // Refresh table data after assignment
    try {
      const data = await contractsService.getAll();
      setContractsData(data);
    } catch (err) {
      console.error("Error refreshing contracts:", err);
    }
    setIsAssignDriverModalOpen(false);
    setSelectedTripData(null);
  };

  if (loading) {
    return <LoadingComponent message="Cargando Contratos..." />;
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ color: "red" }}>Error: {error}</p>
        <p>Mostrando datos de ejemplo como respaldo.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <DateRangeFilter
          onDateRangeChange={handleDateRangeChange}
          label="Rango De Fechas"
          placeholder="Seleccionar Fechas"
        />
      </div>

      <FilterableTableComponent
        title="Lista De Contratos"
        originalData={sampleData}
        columns={columns}
        filterConfigs={filterConfigs}
        enableFiltering={true}
        enableSearch={true}
        showActions={true}
        onSearch={handleSearch}
        enablePagination={true}
        itemsPerPage={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onFiltersChange={handleFiltersChange}
        actionButtons={
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <ButtonComponent
              text="Actualizar"
              icon={<ArrowClockwiseRegular width={16} height={16} />}
              onClick={fetchContracts}
              className={styles.refreshButton}
              appearance="outline"
            />

            {canCreateOrders ? (
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <ButtonComponent
                  text="Crear Orden"
                  icon={
                    <AddFilled
                      fontWeight={600}
                      color="white"
                      width={16}
                      height={16}
                    />
                  }
                  className={styles.createOrderButton}
                  onClick={handleButtonClick}
                />
                {showDropdown && (
                  <div className={styles.dropdownMenu}>
                    <ButtonComponent
                      text="Nuevo Viaje"
                      icon={<DocumentAddRegular width={16} height={16} />}
                      className={styles.dropdownItem}
                      onClick={() =>
                        handleMenuItemClick("/dashboard/createOrder")
                      }
                    />
                    <ButtonComponent
                      text="Viaje frecuente"
                      icon={<ArrowRepeatAllRegular width={16} height={16} />}
                      className={styles.dropdownItem}
                      onClick={() => handleMenuItemClick("/dashboard")}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        }
      />

      {/* Modals */}
      <AssignDriverModal
        isOpen={isAssignDriverModalOpen}
        onClose={() => {
          setIsAssignDriverModalOpen(false);
          setSelectedTripData(null);
        }}
        tripData={selectedTripData}
        onAssign={handleDriverAssignment}
      />

      <DriverPaymentModal
        isOpen={isDriverPaymentModalOpen}
        onClose={() => {
          setIsDriverPaymentModalOpen(false);
          setSelectedTripId(null);
        }}
        tripId={selectedTripId}
      />
    </div>
  );
}
