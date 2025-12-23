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
  const [tripsData, setTripsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<number | null>(null);

  // Get driver ID from user cookie
  useEffect(() => {
    try {
      const userCookie = getCookie("user");
      if (userCookie) {
        const userData = JSON.parse(userCookie);
        setDriverId(userData.id);
      }
    } catch (error) {
      console.error("Error getting user data:", error);
    }
  }, []);

  // Fetch contracts and filter historical trips
  useEffect(() => {
    const fetchHistoricalTrips = async () => {
      if (!driverId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await contractsService.getAll();
        const transformed = transformDriverHistoricalData(response, driverId);
        setTripsData(transformed);
      } catch (err) {
        console.error("Error fetching historical trips:", err);
        setError(err instanceof ApiError ? err.message : "Error al cargar el histórico");
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalTrips();
  }, [driverId]);

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
  ];

  if (loading) {
    return <LoadingComponent message="Cargando histórico..." />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Histórico de Viajes</h1>
        <p className={styles.subtitle}>
          {tripsData.length} {tripsData.length === 1 ? "viaje completado" : "viajes completados"}
        </p>
      </div>

      <FilterableTableComponent
        title="Viajes Completados"
        originalData={tripsData}
        columns={["ID Viaje", "Cliente", "Fecha", "Hora", "Origen", "Destino", "Unidad", "Estatus"]}
        filterConfigs={filterConfigs}
        enableFiltering={true}
        enableSearch={true}
        showActions={false}
        onRowClick={handleRowClick}
        emptyMessage="No tienes viajes completados aún"
        enablePagination={true}
        itemsPerPage={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
