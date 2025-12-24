"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FilterableTableComponent from "@/app/Components/FilterableTable/FilterableTableComponent";
import { FilterConfig, FilterPresets } from "@/app/Components/FilterComponent";
import { contractsService, ApiError } from "@/services/api";
import { getCookie } from "@/app/Utils/CookieUtil";
import LoadingComponent from "@/app/Components/LoadingComponent/LoadingComponent";
import styles from "./DriverHistoricalContent.module.css";

// Status mapping
const STATUS_MAP: Record<number, string> = {
  1: "Agendado",
  2: "Por asignar",
  3: "Próximo",
  4: "En curso",
  5: "Por pagar",
  6: "Finalizado",
  7: "Cancelado",
};

// Transform API data to show only historical trips (Finalizado or Cancelado)
function transformDriverHistoricalData(apiData: any[], driverId: number): any[] {
  const historicalTrips: any[] = [];
  
  apiData.forEach((contract) => {
    const trips = contract.trips || [];
    
    // Filter trips assigned to this driver that are completed or cancelled
    trips.forEach((trip: any) => {
      const tripDriverId = trip.driver?.id || trip.driver_id;
      
      if (tripDriverId === driverId) {
        const contractStatusId = contract.contract_status_id || contract.status?.id;
        const contractStatus = STATUS_MAP[contractStatusId] || contract.contract_status_name || contract.status?.name || "";
        
        // Only show completed or cancelled trips
        if (contractStatusId === 6 || contractStatusId === 7) {
          historicalTrips.push({
            "ID Viaje": trip.trip_id,
            "ID Contrato": contract.contract_id,
            "Cliente": contract.client_name || "",
            "Fecha": trip.service_date
              ? new Date(trip.service_date).toLocaleDateString()
              : "",
            "Hora": trip.service_time || "",
            "Origen": trip.origin?.name || trip.origin_name || "",
            "Destino": trip.destination?.name || trip.destination_name || "",
            "Unidad": trip.vehicle?.plates || trip.vehicle_plates || "No asignada",
            "Estatus": contractStatus,
            // Store for details
            trip_id: trip.trip_id,
            contract_id: contract.contract_id,
            _tripData: trip,
            _contractData: contract,
          });
        }
      }
    });
  });
  
  // Sort by date descending (most recent first)
  return historicalTrips.sort((a, b) => {
    const dateA = new Date(a._tripData.service_date);
    const dateB = new Date(b._tripData.service_date);
    return dateB.getTime() - dateA.getTime();
  });
}

export default function DriverHistoricalContent() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [contractsData, setContractsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<number | null>(null);

  // Get driver ID from user cookie
  useEffect(() => {
    try {
      const userCookie = getCookie("user");
      if (userCookie) {
        const userData = JSON.parse(userCookie);
        // Try multiple possible ID fields
        const userId = userData.id || userData.user_id || userData.userId;
        
        if (userId) {
          setDriverId(userId);
        } else {
          console.error("No user ID found in cookie");
          setError("No se pudo identificar el usuario");
          setLoading(false);
        }
      } else {
        console.error("No user cookie found");
        setError("Sesión no encontrada");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error getting user data:", error);
      setError("Error al obtener datos del usuario");
      setLoading(false);
    }
  }, []);

  // Fetch contracts and filter historical trips
  useEffect(() => {
    const fetchHistoricalTrips = async () => {
      if (!driverId) return;
      
      try {
        setLoading(true);
        const data = await contractsService.getAll();
        setContractsData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching historical trips:", err);
        
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError(err instanceof Error ? err.message : "Error al cargar el histórico");
        }
        
        setContractsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalTrips();
  }, [driverId]);

  // Transform API data for the table (only trips for this driver)
  const historicalData = driverId ? transformDriverHistoricalData(contractsData, driverId) : [];

  const handleRowClick = (row: any) => {
    // Navigate to trip details
    if (row.contract_id && row.trip_id) {
      router.push(`/dashboard/order/${row.contract_id}`);
    }
  };

  const filterConfigs: FilterConfig[] = [
    FilterPresets.createStatusFilter(
      "Estatus",
      ["Finalizado", "Cancelado"],
      "Filtrar por Estatus"
    ),
    FilterPresets.createSelectFilter(
      "Cliente",
      "Cliente",
      Array.from(
        new Set(historicalData.map((item) => item.Cliente).filter(Boolean))
      ),
      "Filtrar por Cliente"
    ),
    FilterPresets.createSelectFilter(
      "Origen",
      "Ciudad de Origen",
      Array.from(
        new Set(historicalData.map((item) => item.Origen).filter(Boolean))
      ),
      "Filtrar por Origen"
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
        title="Histórico de Viajes"
        description="Viajes de contratos finalizados y cancelados"
        originalData={historicalData}
        columns={["ID Viaje", "Cliente", "Fecha", "Hora", "Origen", "Destino", "Unidad", "Estatus"]}
        filterConfigs={filterConfigs}
        enableFiltering={true}
        enableSearch={true}
        showActions={false}
        onRowClick={handleRowClick}
        onSearch={handleSearch}
        emptyMessage="No tienes viajes completados aún"
        enablePagination={true}
        itemsPerPage={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onFiltersChange={handleFiltersChange}
      />
    </div>
  );
}
