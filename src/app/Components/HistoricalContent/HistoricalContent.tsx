"use client";
import { useState, useEffect } from "react";
import FilterableTableComponent from "../FilterableTable/FilterableTableComponent";
import { FilterConfig, FilterPresets } from "../FilterComponent";
import { contractsService, ApiError } from "@/services/api";
import { useUserRole } from "@/app/hooks/useUserRole";
import { formatDateStandard, formatPersonName } from "@/app/Utils/FormatUtil";
import styles from "./HistoricalContent.module.css";

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

// Function to transform API data to table format (historical trips from finished/cancelled contracts)
function transformHistoricalData(apiData: any[]): any[] {
  // Filter to get only "Finalizado" (6) and "Cancelado" (7) contracts
  const historicalContracts = apiData.filter((contract) => {
    const statusId = contract.contract_status_id || contract.status?.id;
    return statusId === 6 || statusId === 7;
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
  const [currentPage, setCurrentPage] = useState(1);
  const [contractsData, setContractsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        setContractsData([]);
      } finally {
        setLoading(false);
      }
    };

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
  const filterConfigs: FilterConfig[] = [
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
    FilterPresets.createDateFilter(
      "Fecha",
      Array.from(
        new Set(historicalData.map((item) => item.Fecha).filter(Boolean))
      ),
      "Filtrar por Fecha"
    ),
    FilterPresets.createSelectFilter(
      "Unidad",
      "Unidad",
      Array.from(
        new Set(historicalData.map((item) => item.Unidad).filter(Boolean))
      ),
      "Filtrar por Unidad"
    ),
  ];

  const handleFiltersChange = (
    activeFilters: Record<string, string | string[]>
  ) => {
    console.log("Filtros aplicados:", activeFilters);
  };

  const handleSearch = (searchTerm: string) => {
    console.log("Búsqueda:", searchTerm);
  };

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div>
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
    </div>
  );
}
