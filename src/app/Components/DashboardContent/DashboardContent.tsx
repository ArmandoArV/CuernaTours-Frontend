"use client";
import { useState, useEffect, useRef } from "react";
import FilterableTableComponent from "../FilterableTable/FilterableTableComponent";
import { FilterConfig, FilterPresets } from "../FilterComponent";
import { AddFilled, DocumentAddRegular, ArrowRepeatAllRegular } from "@fluentui/react-icons";
import { useRouter } from "next/navigation";
import { contractsService, ApiError } from "@/services/api";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { useUserRole } from "@/app/hooks/useUserRole";
import AssignDriverModal from "../AssignDriverModal/AssignDriverModal";
import DriverPaymentModal from "../DriverPaymentModal/DriverPaymentModal";
import LoadingComponent from "../LoadingComponent/LoadingComponent";
import styles from "./DashboardContent.module.css";

// Status mapping based on provided ids
const STATUS_MAP: Record<number, string> = {
  1: "Agendado",
  2: "Por asignar",
  3: "Próximo",
  4: "En curso",
  5: "Por pagar",
  6: "Finalizado",
  7: "Cancelado",
};

// Function to transform API data to table format (contract-based)
function transformApiData(apiData: any[]): any[] {
  // Filter out "Finalizado" (6) and "Cancelado" (7) contracts
  const activeContracts = apiData.filter((contract) => {
    const statusId = contract.contract_status_id || contract.status?.id;
    const statusName = contract.contract_status_name || contract.status?.name;
    return statusId !== 6 && statusId !== 7 && 
           statusName !== "Finalizado" && statusName !== "Cancelado";
  });

  return activeContracts.map((contract) => {
    const trips = contract.trips || [];
    const firstTrip = trips[0] || {};
    
    // Get contract status
    const contractStatusId = contract.contract_status_id || contract.status?.id;
    const contractStatus = STATUS_MAP[contractStatusId] || contract.contract_status_name || contract.status?.name || "";
    
    // Calculate trip count and assignment status
    const tripCount = trips.length;
    const assignedTrips = trips.filter((t: any) => 
      (t.driver_id || t.external_driver_id) && t.vehicle_id
    ).length;
    const assignmentStatus = tripCount > 0 
      ? `${assignedTrips}/${tripCount}` 
      : "0/0";
    
    return {
      "ID Contrato": contract.contract_id,
      "Empresa o Cliente": contract.client_name || "",
      "Fecha": firstTrip.service_date
        ? new Date(firstTrip.service_date).toLocaleDateString()
        : "",
      "Viajes": tripCount,
      "Asignados": assignmentStatus,
      "Monto": contract.amount ? `$${contract.amount.toLocaleString()}` : "",
      "Estatus": contractStatus,
      // Include IDs and data for functionality
      contract_id: contract.contract_id,
      // Store full contract object for details and modals
      _contractData: contract,
      _trips: trips,
    };
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
  const [isDriverPaymentModalOpen, setIsDriverPaymentModalOpen] = useState(false);
  const [selectedTripData, setSelectedTripData] = useState<any>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
  useEffect(() => {
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

    fetchContracts();
  }, []);

  // Transform API data for the table
  const sampleData = transformApiData(contractsData);

  const columns = [
    "Empresa o Cliente",
    "Fecha",
    "Viajes",
    "Asignados",
    "Monto",
    "Estatus",
  ];

  // Configure filters for the table
  const filterConfigs: FilterConfig[] = [
    FilterPresets.createSelectFilter(
      "Empresa o Cliente",
      "Cliente",
      Array.from(new Set(sampleData.map((item) => item["Empresa o Cliente"]).filter(Boolean))),
      "Filtrar por Cliente"
    ),
    FilterPresets.createStatusFilter(
      "Estatus",
      Array.from(new Set(sampleData.map((item) => item.Estatus).filter(Boolean))),
      "Filtrar por Estatus"
    ),
    FilterPresets.createSelectFilter(
      "Viajes",
      "Cantidad de Viajes",
      Array.from(new Set(sampleData.map((item) => String(item.Viajes)))),
      "Filtrar por Cantidad"
    ),
  ];

  // Handlers removed: table will show inline details when the eye button is clicked.

  const handleFiltersChange = (
    activeFilters: Record<string, string | string[]>
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
    const unassignedTrip = trips.find((t: any) => 
      !t.driver_id && !t.external_driver_id
    );
    const tripToAssign = unassignedTrip || trips[0];
    
    if (tripToAssign) {
      setSelectedTripData(tripToAssign);
      setIsAssignDriverModalOpen(true);
    } else {
      console.warn('No trips found in contract');
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
      console.warn('No trips found in contract');
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
    return <LoadingComponent message="Cargando contratos..." />;
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
      <FilterableTableComponent
        title="Lista de contratos"
        originalData={sampleData}
        columns={columns}
        filterConfigs={filterConfigs}
        enableFiltering={true}
        enableSearch={true}
        showActions={true}
        onSearch={handleSearch}
        emptyMessage="No hay contratos disponibles"
        enablePagination={true}
        itemsPerPage={5}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onFiltersChange={handleFiltersChange}
        onEditOrder={handleEditOrder}
        onAssignDriver={canAssignResources ? handleAssignDriver : undefined}
        onPayDriver={canAssignResources ? handlePayDriver : undefined}
        actionButtons={
          canCreateOrders ? (
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
                    onClick={() => handleMenuItemClick("/dashboard/createOrder")}
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
          ) : null
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
