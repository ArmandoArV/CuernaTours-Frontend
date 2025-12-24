"use client";
import { useState, useEffect } from "react";
import FilterableTableComponent from "../FilterableTable/FilterableTableComponent";
import { FilterConfig, FilterPresets } from "../FilterComponent";
import { useRouter } from "next/navigation";
import { contractsService, ApiError } from "@/services/api";
import { getCookie } from "@/app/Utils/CookieUtil";
import LoadingComponent from "../LoadingComponent/LoadingComponent";
import DetailsPanel from "../DetailsPanel/DetailsPanel";
import styles from "./DriverDashboardContent.module.css";

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

// Transform API data to show only trips assigned to the current driver
function transformDriverTripsData(apiData: any[], driverId: number): any[] {
  const driverTrips: any[] = [];

  apiData.forEach((contract) => {
    const trips = contract.trips || [];

    // Filter trips assigned to this driver
    trips.forEach((trip: any) => {
      const tripDriverId = trip.driver?.id || trip.driver_id;

      if (tripDriverId === driverId) {
        const contractStatusId =
          contract.contract_status_id || contract.status?.id;
        const contractStatus =
          STATUS_MAP[contractStatusId] ||
          contract.contract_status_name ||
          contract.status?.name ||
          "";

        // Only show active trips (not Finalizado or Cancelado)
        if (contractStatusId !== 6 && contractStatusId !== 7) {
          driverTrips.push({
            "ID Viaje": trip.trip_id,
            "ID Contrato": contract.contract_id,
            Cliente: contract.client_name || "",
            Fecha: trip.service_date
              ? new Date(trip.service_date).toLocaleDateString()
              : "",
            Hora: trip.service_time || "",
            Origen: trip.origin?.name || trip.origin_name || "",
            Destino: trip.destination?.name || trip.destination_name || "",
            Unidad:
              trip.vehicle?.plates || trip.vehicle_plates || "No asignada",
            Estatus: contractStatus,
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

  // Sort by date and time
  return driverTrips.sort((a, b) => {
    const dateA = new Date(a._tripData.service_date);
    const dateB = new Date(b._tripData.service_date);
    return dateA.getTime() - dateB.getTime();
  });
}

export default function DriverDashboardContent() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [tripsData, setTripsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [selectedRowForDetails, setSelectedRowForDetails] = useState<
    any | null
  >(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

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
          setLoading(false);
          setError("No se pudo identificar al usuario");
        }
      } else {
        console.error("No user cookie found");
        setLoading(false);
        setError("Sesión no válida");
      }
    } catch (error) {
      console.error("Error getting user data:", error);
      setLoading(false);
      setError("Error al obtener datos del usuario");
    }
  }, []);

  // Fetch contracts and filter driver trips
  useEffect(() => {
    const fetchDriverTrips = async () => {
      if (!driverId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await contractsService.getAll();
        const transformed = transformDriverTripsData(response, driverId);
        setTripsData(transformed);
      } catch (err) {
        console.error("Error fetching driver trips:", err);
        setError(
          err instanceof ApiError ? err.message : "Error al cargar tus viajes"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDriverTrips();
  }, [driverId]);

  const handleRefresh = async () => {
    if (!driverId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await contractsService.getAll();
      const transformed = transformDriverTripsData(response, driverId);
      setTripsData(transformed);
    } catch (err) {
      console.error("Error refreshing driver trips:", err);
      setError(
        err instanceof ApiError ? err.message : "Error al actualizar tus viajes"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (row: any) => {
    // For drivers, expand details instead of redirecting
    handleViewDetails(row);
  };

  const handleViewDetails = async (row: any) => {
    if (!row.contract_id) return;

    setDetailsLoading(true);
    setDetailsError(null);

    try {
      const contractDetails = await contractsService.getContractDetails(
        Number(row.contract_id)
      );
      setSelectedRowForDetails(contractDetails);
    } catch (err) {
      console.error("Error fetching contract details:", err);
      setDetailsError(
        err instanceof ApiError ? err.message : "Error al cargar los detalles"
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleAddPayment = () => {
    router.push("/chofer/gastos/crear");
  };

  const filterConfigs: FilterConfig[] = [
    FilterPresets.createStatusFilter(
      "Estatus",
      Object.values(STATUS_MAP).filter(
        (status) => status !== "Finalizado" && status !== "Cancelado"
      ),
      "Filtrar por Estatus"
    ),
  ];

  if (loading) {
    return <LoadingComponent message="Cargando tus viajes..." />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button onClick={handleRefresh} className={styles.retryButton}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mis Viajes</h1>
        <p className={styles.subtitle}>
          {tripsData.length}{" "}
          {tripsData.length === 1 ? "viaje asignado" : "viajes asignados"}
        </p>
      </div>

      <FilterableTableComponent
        title="Viajes Asignados"
        originalData={tripsData}
        columns={[
          "ID Viaje",
          "Cliente",
          "Fecha",
          "Hora",
          "Origen",
          "Destino",
          "Unidad",
          "Estatus",
        ]}
        filterConfigs={filterConfigs}
        enableFiltering={true}
        enableSearch={true}
        showActions={true}
        onRowClick={handleRowClick}
        onViewDetails={handleViewDetails}
        onPayDriver={handleAddPayment}
        emptyMessage="No tienes viajes asignados en este momento"
        enablePagination={true}
        itemsPerPage={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
