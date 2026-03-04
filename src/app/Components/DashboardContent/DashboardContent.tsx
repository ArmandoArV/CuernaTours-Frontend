"use client";
import { useState, useMemo } from "react";
import FilterableTableComponent from "../FilterableTable/FilterableTableComponent";
import FilterComponent, { FilterConfig, FilterPresets } from "../FilterComponent";

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
  Button,
} from "@fluentui/react-components";

import {
  MoreVerticalRegular,
  PersonAddRegular,
  EditRegular,
  MoneyRegular,
} from "@fluentui/react-icons";
import { useRouter } from "next/navigation";
import { contractsService } from "@/services/api";
import { useAsyncData } from "@/app/hooks/useAsyncData";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { useUserRole } from "@/app/hooks/useUserRole";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import AssignDriverModal from "../AssignDriverModal/AssignDriverModal";
import DriverPaymentModal from "../DriverPaymentModal/DriverPaymentModal";
import ClientPaymentModal from "../ClientPaymentModal/ClientPaymentModal";
import LoadingComponent from "../LoadingComponent/LoadingComponent";
import ContractCard from "../ContractCard/ContractCard";
import { formatDateStandard, formatPersonName } from "@/app/Utils/FormatUtil";
import styles from "./DashboardContent.module.css";
import { Logger } from "@/app/Utils/Logger";
import {
  showInputAlert,
  showSuccessAlert,
  showErrorAlert,
} from "@/app/Utils/AlertUtil";
import { CONTRACT_STATUS_MAP } from "@/app/Utils/statusUtils";

const log = Logger.getLogger("DashboardContent");

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
    const statusId = Number(contract.contract_status_id || contract.status?.id);
    const statusName = (contract.contract_status_name || contract.status?.name || "").toLowerCase();
    return (
      statusId !== 3 &&
      statusId !== 4 &&
      statusName !== "finalizado" &&
      statusName !== "cancelado"
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
        CONTRACT_STATUS_MAP[contractStatusId] ||
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
        IDA: (firstTrip as any).origin_name || (firstTrip as any).origin?.name || "",
        REGRESO: (firstTrip as any).destination_name || (firstTrip as any).destination?.name || "",
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
  const { hasFullAccess, canCreateOrders, canAssignResources, isChofer } = useUserRole();
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: contractsData, loading, error, setData: setContractsData, refresh: fetchContracts } = useAsyncData(
    () => contractsService.getAll(),
    [] as any[],
  );

  // Modal states
  const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = useState(false);
  const [isDriverPaymentModalOpen, setIsDriverPaymentModalOpen] =
    useState(false);
  const [isClientPaymentModalOpen, setIsClientPaymentModalOpen] = useState(false);
  const [selectedTripData, setSelectedTripData] = useState<any>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  // Date range filter states
  const [dateRangeStart, setDateRangeStart] = useState("");
  const [dateRangeEnd, setDateRangeEnd] = useState("");
  // Mobile column filter state (non-date filters)
  const [mobileColumnFilters, setMobileColumnFilters] = useState<Record<string, any>>({});

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
    setCurrentPage(1);
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

  // Configure filters for the table
  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "dateRange",
        label: "Periodo",
        type: "dateRange" as any,
        isExternal: true,
      },
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
    ],
    [transformedData],
  );

  // Handlers removed: table will show inline details when the eye button is clicked.

  const handleFiltersChange = (activeFilters: Record<string, any>) => {
    // Handle external date range filter
    if (activeFilters.dateRange) {
      const { start, end } = activeFilters.dateRange;
      if (start) {
        const d = new Date(start);
        setDateRangeStart(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
      } else {
        setDateRangeStart("");
      }
      if (end) {
        const d = new Date(end);
        setDateRangeEnd(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
      } else {
        setDateRangeEnd("");
      }
    } else {
      setDateRangeStart("");
      setDateRangeEnd("");
    }

    // Track non-date filters for mobile card filtering
    const columnFilters: Record<string, any> = {};
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (key !== "dateRange" && value != null) {
        columnFilters[key] = value;
      }
    });
    setMobileColumnFilters(columnFilters);

    setCurrentPage(1);
  };

  // Filtered data for mobile (applies column filters on top of date-filtered sampleData)
  const mobileFilteredData = useMemo(() => {
    if (Object.keys(mobileColumnFilters).length === 0) return sampleData;

    return sampleData.filter((item) => {
      return Object.entries(mobileColumnFilters).every(([key, value]) => {
        if (!value) return true;
        const itemValue = item[key];
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        return String(itemValue) === String(value);
      });
    });
  }, [sampleData, mobileColumnFilters]);

  const handleSearch = (searchTerm: string) => {
    log.debug("Búsqueda:", searchTerm);
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
      log.warn("No trips found in contract");
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
      log.warn("No trips found in contract");
    }
  };

  const handleRegisterClientPayment = (row: any) => {
    const id = row.contract_id || row.id;
    if (id) {
      setSelectedContractId(Number(id));
      setIsClientPaymentModalOpen(true);
    }
  };

  const handleDriverAssignment= async (assignmentData: any) => {
    log.info("Driver assigned:", assignmentData);
    // Refresh table data after assignment
    try {
      const data = await contractsService.getAll();
      setContractsData(data);
    } catch (err) {
      log.error("Error refreshing contracts:", err);
    }
    setIsAssignDriverModalOpen(false);
    setSelectedTripData(null);
  };

  // Navigate to details page (admin/maestro)
  const handleViewDetails = (row: any) => {
    const id = row.contract_id || row.id;
    if (id) {
      router.push(`/dashboard/trips/${id}`);
    }
  };

  // Cancel contract handler
  const handleCancelContract = async (row: any) => {
    const id = row.contract_id || row.id;
    if (!id) return;

    const reason = await showInputAlert(
      "¿Estás seguro de cancelar este contrato?",
      "Esta acción no se puede deshacer. Por favor ingresa el motivo de la cancelación:",
      "Motivo de cancelación",
      "Escribe el motivo aquí...",
      "Sí, cancelar contrato",
      "No, mantener"
    );

    if (reason) {
      try {
        await contractsService.cancelContract(Number(id), reason);
        showSuccessAlert(
          "Contrato cancelado",
          "El contrato ha sido cancelado exitosamente.",
          () => { window.location.reload(); }
        );
      } catch (error) {
        log.error("Error cancelling contract:", error);
        showErrorAlert("Error", "No se pudo cancelar el contrato. Inténtalo de nuevo.");
      }
    }
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
      {isMobile ? (
        /* ─── MOBILE VIEW: Cards ─── */
        <div className={styles.mobileContainer}>
          <div className={styles.mobileHeader}>
            <h2 className={styles.mobileTitle}>Lista De Contratos</h2>
            <div className={styles.mobileActions}>
              <ButtonComponent
                text="Actualizar"
                icon={<ArrowClockwiseRegular width={16} height={16} />}
                onClick={fetchContracts}
                className={styles.refreshButton}
                appearance="outline"
              />
              {canCreateOrders && (
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Button
                      appearance="primary"
                      icon={<AddFilled />}
                      className={styles.createOrderButton}
                      style={{ backgroundColor: "#1a2e47", borderColor: "#1a2e47" }}
                    >
                      Crear
                    </Button>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem
                        icon={<DocumentAddRegular />}
                        onClick={() => router.push("/dashboard/createOrder")}
                      >
                        Nuevo Viaje
                      </MenuItem>
                      <MenuItem
                        icon={<ArrowRepeatAllRegular />}
                        onClick={() => router.push("/dashboard")}
                      >
                        Viaje frecuente
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              )}
            </div>
          </div>

          {/* Mobile Filters */}
          <div className={styles.mobileFilters}>
            <FilterComponent
              filters={filterConfigs}
              onFiltersChange={handleFiltersChange}
              showActiveFilters={false}
              showClearButton={true}
              containerClassName={styles.mobileFilterContainer}
            />
          </div>

          <div className={styles.mobileList}>
            {mobileFilteredData.length === 0 ? (
              <p style={{ textAlign: "center", color: "#888", padding: 24 }}>
                No hay contratos disponibles.
              </p>
            ) : (
              mobileFilteredData.map((contract, idx) => (
                <ContractCard
                  key={contract.contract_id || idx}
                  contract={contract}
                  showActions={canAssignResources || hasFullAccess}
                  showViewDetails={true}
                  onViewDetails={!isChofer ? handleViewDetails : undefined}
                  onEdit={handleEditOrder}
                  onAssignDriver={canAssignResources ? handleAssignDriver : undefined}
                  onPayDriver={hasFullAccess ? handlePayDriver : undefined}
                  onRegisterPayment={hasFullAccess ? handleRegisterClientPayment : undefined}
                  onCancel={hasFullAccess ? handleCancelContract : undefined}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        /* ─── DESKTOP VIEW: Table ─── */
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
                <Menu>
                  <MenuTrigger disableButtonEnhancement>
                    <Button
                      appearance="primary"
                      icon={<AddFilled />}
                      className={styles.createOrderButton}
                      style={{ backgroundColor: "#96781a", borderColor: "#96781a", color: "white" }}
                    >
                      Crear Orden
                    </Button>
                  </MenuTrigger>
                  <MenuPopover>
                    <MenuList>
                      <MenuItem
                        icon={<DocumentAddRegular />}
                        onClick={() => router.push("/dashboard/createOrder")}
                      >
                        Nuevo Viaje
                      </MenuItem>
                      <MenuItem
                        icon={<ArrowRepeatAllRegular />}
                        onClick={() => router.push("/dashboard")}
                      >
                        Viaje frecuente
                      </MenuItem>
                    </MenuList>
                  </MenuPopover>
                </Menu>
              ) : null}
            </div>
          }
        />
      )}

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

      <ClientPaymentModal
        isOpen={isClientPaymentModalOpen}
        onClose={() => {
          setIsClientPaymentModalOpen(false);
          setSelectedContractId(null);
        }}
        contractId={selectedContractId}
        onPaymentRegistered={fetchContracts}
      />
    </div>
  );
}
