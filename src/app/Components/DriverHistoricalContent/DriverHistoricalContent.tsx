"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import FilterableTableComponent from "@/app/Components/FilterableTable/FilterableTableComponent";
import FilterComponent, { FilterConfig, FilterPresets } from "@/app/Components/FilterComponent";
import { ArrowClockwiseRegular } from "@fluentui/react-icons";
import { contractsService } from "@/services/api";
import { useAsyncData } from "@/app/hooks/useAsyncData";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { getCookie } from "@/app/Utils/CookieUtil";
import { formatDateStandard, formatPersonName } from "@/app/Utils/FormatUtil";
import LoadingComponent from "@/app/Components/LoadingComponent/LoadingComponent";
import ButtonComponent from "@/app/Components/ButtonComponent/ButtonComponent";
import DriverTripCard from "@/app/Components/DriverTripCard/DriverTripCard";
import styles from "./DriverHistoricalContent.module.css";
import { Logger } from "@/app/Utils/Logger";
import { CONTRACT_STATUS_MAP } from "@/app/Utils/statusUtils";

const log = Logger.getLogger("DriverHistoricalContent");

// Transform API data to show only historical trips (Finalizado or Cancelado)
function transformDriverHistoricalData(apiData: any[], driverId: number): any[] {
  const historicalTrips: any[] = [];
  
  apiData.forEach((contract) => {
    const trips = contract.trips || [];
    
    // Filter trips assigned to this driver that are completed or cancelled
    trips.forEach((trip: any) => {
      // Driver is now assigned at the unit level
      const driverUnit = (trip.units || []).find(
        (u: any) => u.driver_id === driverId || u.driver?.id === driverId
      );
      const hasThisDriver = !!driverUnit;

      if (hasThisDriver) {
        const contractStatusId = contract.contract_status_id || contract.status?.id;
        const contractStatus = CONTRACT_STATUS_MAP[contractStatusId] || contract.contract_status_name || contract.status?.name || "";

        // Only show completed or cancelled trips
        if (contractStatusId === 6 || contractStatusId === 7) {
          const vehiclePlate = driverUnit?.vehicle_license_plate
            || driverUnit?.vehicle?.license_plate
            || "No asignada";

          historicalTrips.push({
            "ID Viaje": trip.trip_id,
            "ID Servicio": contract.contract_id,
            "Cliente": formatPersonName(contract.client_name) || "",
            "Fecha": formatDateStandard(trip.service_date),
            "Hora": trip.service_time || "",
            "Origen": trip.origin?.name || trip.origin_name || "",
            "Destino": trip.destination?.name || trip.destination_name || "",
            "Unidad": vehiclePlate,
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
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const [driverId, setDriverId] = useState<number | null>(null);
  const [mobileColumnFilters, setMobileColumnFilters] = useState<Record<string, any>>({});

  // Get driver ID from user cookie
  useEffect(() => {
    try {
      const userCookie = getCookie("user");
      if (userCookie) {
        const userData = JSON.parse(userCookie);
        const userId = userData.id || userData.user_id || userData.userId;
        
        if (userId) {
          setDriverId(userId);
        } else {
          log.error("No user ID found in cookie");
        }
      } else {
        log.error("No user cookie found");
      }
    } catch (error) {
      log.error("Error getting user data:", error);
    }
  }, []);

  const { data: contractsData, loading, error, refresh } = useAsyncData(
    () => driverId ? contractsService.getAll() : Promise.resolve([]),
    [] as any[],
    [driverId],
  );

  // Transform API data for the table (only trips for this driver)
  const historicalData = driverId ? transformDriverHistoricalData(contractsData, driverId) : [];

  const handleRowClick = (row: any) => {
    // Navigate to trip details
    if (row.contract_id && row.trip_id) {
      router.push(`/dashboard/order/${row.contract_id}`);
    }
  };

  const filterConfigs: FilterConfig[] = useMemo(() => [
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
            <h2 className={styles.mobileTitle}>Histórico de Viajes</h2>
            <ButtonComponent
              text="Actualizar"
              icon={<ArrowClockwiseRegular width={16} height={16} />}
              onClick={refresh}
              className={styles.refreshButton}
              appearance="outline"
            />
          </div>

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
                No tienes viajes completados aún.
              </p>
            ) : (
              mobileFilteredData.map((trip, idx) => (
                <DriverTripCard
                  key={`${trip.contract_id}-${trip.trip_id}-${idx}`}
                  trip={trip}
                  onClick={handleRowClick}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        /* ─── DESKTOP VIEW: Table ─── */
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
          emptyMessage="No tienes viajes completados aún"
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
