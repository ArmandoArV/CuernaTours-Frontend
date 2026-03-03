"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import FilterableTableComponent from "../FilterableTable/FilterableTableComponent";
import FilterComponent, { FilterConfig, FilterPresets } from "../FilterComponent";
import { ArrowClockwiseRegular } from "@fluentui/react-icons";
import { contractsService, ApiError } from "@/services/api";
import { useUserRole } from "@/app/hooks/useUserRole";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import ButtonComponent from "../ButtonComponent/ButtonComponent";
import HistoricalCard from "../HistoricalCard/HistoricalCard";
import LoadingComponent from "../LoadingComponent/LoadingComponent";
import { formatDateStandard, formatPersonName } from "@/app/Utils/FormatUtil";
import styles from "./HistoricalContent.module.css";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("HistoricalContent");

// Status mapping based on provided ids
const STATUS_MAP: Record<number, string> = {
  1: "Pendiente",
  2: "En curso",
  3: "Finalizado",
  4: "Cancelado",
};

// Function to transform API data to table format (historical trips from finished/cancelled contracts)
function transformHistoricalData(apiData: any[]): any[] {
  // Filter to get only "Finalizado" (3) and "Cancelado" (4) contracts
  const historicalContracts = apiData.filter((contract) => {
    const statusId = contract.contract_status_id || contract.status?.id;
    return statusId === 3 || statusId === 4;
  });

  // Transform to trip-based rows
  const rows: any[] = [];
  historicalContracts.forEach((contract) => {
    const contractStatusId = contract.contract_status_id || contract.status?.id;
    const contractStatus =
      STATUS_MAP[contractStatusId] ||
      contract.contract_status_name ||
      contract.status?.name ||
      "";

    (contract.trips || []).forEach((trip: any) => {
      rows.push({
        "Empresa o Cliente": formatPersonName(contract.client_name),
        Origen: trip.origin?.name || "",
        Destino: trip.destination?.name || "",
        Fecha: formatDateStandard(trip.service_date),
        Unidad: trip.vehicle?.type || trip.unit_type || "",
        Chofer: trip.driver
          ? formatPersonName(`${trip.driver.name} ${trip.driver.lastname}`)
          : trip.external_driver
          ? formatPersonName(trip.external_driver.name)
          : "",
        Estatus: contractStatus,
        // Include IDs for functionality
        contract_id: contract.contract_id,
        trip_id: trip.trip_id,
        // Store full trip and contract objects
        _tripData: trip,
        _contractData: contract,
      });
    });
  });

  return rows;
}

export default function HistoricalContent() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { hasFullAccess } = useUserRole();
  const [currentPage, setCurrentPage] = useState(1);
  const [contractsData, setContractsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileColumnFilters, setMobileColumnFilters] = useState<Record<string, any>>({});

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const data = await contractsService.getAll();
      setContractsData(data);
      setError(null);
    } catch (err) {
      log.error("Error fetching contracts:", err);

      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }

      setContractsData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  // Transform API data for the table
  const historicalData = transformHistoricalData(contractsData);

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
  const filterConfigs: FilterConfig[] = useMemo(() => [
    FilterPresets.createSelectFilter(
      "Empresa o Cliente",
      "Cliente",
      Array.from(
        new Set(
          historicalData
            .map((item) => item["Empresa o Cliente"])
            .filter(Boolean)
        )
      ),
      "Filtrar por Cliente"
    ),
    FilterPresets.createStatusFilter(
      "Estatus",
      ["Finalizado", "Cancelado"],
      "Filtrar por Estatus"
    ),
    FilterPresets.createSelectFilter(
      "Chofer",
      "Chofer",
      Array.from(
        new Set(historicalData.map((item) => item.Chofer).filter(Boolean))
      ),
      "Filtrar por Chofer"
    ),
    FilterPresets.createSelectFilter(
      "Origen",
      "Ciudad de Origen",
      Array.from(
        new Set(historicalData.map((item) => item.Origen).filter(Boolean))
      ),
      "Filtrar por Origen"
    ),
  ], [historicalData]);

  const handleFiltersChange = (activeFilters: Record<string, any>) => {
    const columnFilters: Record<string, any> = {};
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value != null) {
        columnFilters[key] = value;
      }
    });
    setMobileColumnFilters(columnFilters);
    setCurrentPage(1);
  };

  // Filtered data for mobile cards
  const mobileFilteredData = useMemo(() => {
    if (Object.keys(mobileColumnFilters).length === 0) return historicalData;

    return historicalData.filter((item) => {
      return Object.entries(mobileColumnFilters).every(([key, value]) => {
        if (!value) return true;
        const itemValue = item[key];
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        return String(itemValue) === String(value);
      });
    });
  }, [historicalData, mobileColumnFilters]);

  const handleSearch = (searchTerm: string) => {
    log.debug("Búsqueda:", searchTerm);
  };

  const handleViewDetails = (row: any) => {
    const id = row.contract_id;
    if (id) {
      router.push(`/dashboard/trips/${id}`);
    }
  };

  if (loading) {
    return <LoadingComponent message="Cargando historial..." />;
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
      {isMobile ? (
        /* ─── MOBILE VIEW: Cards ─── */
        <div className={styles.mobileContainer}>
          <div className={styles.mobileHeader}>
            <h2 className={styles.mobileTitle}>Historial de Viajes</h2>
            <ButtonComponent
              text="Actualizar"
              icon={<ArrowClockwiseRegular width={16} height={16} />}
              onClick={fetchContracts}
              className={styles.refreshButton}
              appearance="outline"
            />
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
                No hay viajes en el historial.
              </p>
            ) : (
              mobileFilteredData.map((trip, idx) => (
                <HistoricalCard
                  key={`${trip.contract_id}-${trip.trip_id}-${idx}`}
                  trip={trip}
                  onViewDetails={hasFullAccess ? handleViewDetails : undefined}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        /* ─── DESKTOP VIEW: Table ─── */
        <FilterableTableComponent
          title="Historial de viajes"
          description="Viajes de contratos finalizados y cancelados"
          originalData={historicalData}
          columns={columns}
          filterConfigs={filterConfigs}
          enableFiltering={true}
          enableSearch={true}
          showActions={false}
          onSearch={handleSearch}
          emptyMessage="No hay viajes en el historial"
          enablePagination={true}
          itemsPerPage={10}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onFiltersChange={handleFiltersChange}
        />
      )}
    </div>
  );
}
