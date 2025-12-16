"use client";
import { useState, useEffect, useRef } from "react";
import FilterableTableComponent from "../FilterableTable/FilterableTableComponent";
import { FilterConfig, FilterPresets } from "../FilterComponent";
import { AddFilled, DocumentAddRegular, ArrowRepeatAllRegular } from "@fluentui/react-icons";
import { useRouter } from "next/navigation";
import { contractsService, ApiError } from "@/services/api";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import { useUserRole } from "@/app/hooks/useUserRole";
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

// Function to transform API data to table format
function transformApiData(apiData: any[]): any[] {
  const rows: any[] = [];
  apiData.forEach((contract) => {
    (contract.trips || []).forEach((trip: any) => {
      rows.push({
        "Empresa o Cliente": contract.client_name,
        Origen: trip.origin?.name || "",
        Destino: trip.destination?.name || "",
        Fecha: trip.service_date
          ? new Date(trip.service_date).toLocaleDateString()
          : "",
        Unidad: trip.vehicle?.type || trip.unit_type || "",
        Chofer: trip.driver
          ? `${trip.driver.name} ${trip.driver.lastname}`
          : "",
        Estatus: STATUS_MAP[trip.status?.id] || trip.status?.name || "",
        // Include contract_id for the details functionality
        contract_id: contract.contract_id,
      });
    });
  });
  return rows;
}

export default function DashboardContent() {
  const router = useRouter();
  const { hasFullAccess } = useUserRole();
  const [currentPage, setCurrentPage] = useState(1);
  const [contractsData, setContractsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    "Origen",
    "Destino",
    "Fecha",
    "Unidad",
    "Chofer",
    "Estatus",
  ];

  // Configure filters for the table
  const filterConfigs: FilterConfig[] = [
    FilterPresets.createSelectFilter(
      "Chofer",
      "Chofer",
      Array.from(new Set(sampleData.map((item) => item.Chofer))),
      "Filtrar por Chofer"
    ),
    FilterPresets.createStatusFilter(
      "Estatus",
      Array.from(new Set(sampleData.map((item) => item.Estatus))),
      "Filtrar por Estatus"
    ),
    FilterPresets.createSelectFilter(
      "Unidad",
      "Tipo de Unidad",
      Array.from(new Set(sampleData.map((item) => item.Unidad))),
      "Filtrar por Unidad"
    ),
    FilterPresets.createSelectFilter(
      "Origen",
      "Ciudad de Origen",
      Array.from(new Set(sampleData.map((item) => item.Origen))),
      "Filtrar por Origen"
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

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Cargando viajes...</p>
      </div>
    );
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
        title="Lista de viajes"
        originalData={sampleData}
        columns={columns}
        filterConfigs={filterConfigs}
        enableFiltering={true}
        enableSearch={true}
        showActions={true}
        onSearch={handleSearch}
        emptyMessage="No hay viajes disponibles"
        enablePagination={true}
        itemsPerPage={5}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onFiltersChange={handleFiltersChange}
        actionButtons={
          hasFullAccess ? (
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
    </div>
  );
}
