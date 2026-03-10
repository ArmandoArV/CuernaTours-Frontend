"use client";

import { useState, useMemo } from "react";
import FilterableTableComponent from "../FilterableTable/FilterableTableComponent";
import LoadingComponent from "@/app/Components/LoadingComponent/LoadingComponent";
import DriverTripCard from "@/app/Components/DriverTripCard/DriverTripCard";
import ErrorBlock from "@/app/Components/ErrorBlock/ErrorBlock";
import FilterComponent from "../FilterComponent/FilterComponent";
import { FilterConfig, FilterPresets } from "../FilterComponent";
import { useDriverId } from "@/app/hooks/useDriverId";
import { useDriverTrips } from "@/app/hooks/useDriverTrips";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import styles from "./DriverDashboardContent.module.css";
import { Logger } from "@/app/Utils/Logger";
import { CONTRACT_STATUS_MAP } from "@/app/Utils/statusUtils";

const log = Logger.getLogger("DriverDashboardContent");

export default function DriverDashboardContent() {
  const { driverId, error: driverError } = useDriverId();
  const { trips, loading, error, refresh } = useDriverTrips(driverId);
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  const handleRowClick = (row: any) => {
    log.info("Row clicked:", row);
  };

  const groupByDate = (row: any): string => {
    const serviceDate = row._tripData?.service_date;
    if (!serviceDate) return "Futuros servicios";
    const rowDate = new Date(serviceDate);
    const today = new Date();
    const todayDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    ).getTime();
    const tomorrowDay = todayDay + 86400000;
    const rowDay = new Date(
      rowDate.getFullYear(),
      rowDate.getMonth(),
      rowDate.getDate(),
    ).getTime();

    const months = [
      "ene",
      "feb",
      "mar",
      "abr",
      "may",
      "jun",
      "jul",
      "ago",
      "sep",
      "oct",
      "nov",
      "dic",
    ];
    const dayNum = rowDate.getDate();
    const monthStr = months[rowDate.getMonth()];

    if (rowDay === todayDay) return `${dayNum} ${monthStr} (Hoy)`;
    if (rowDay === tomorrowDay) return `${dayNum} ${monthStr} (Mañana)`;
    if (rowDay < todayDay) return `${dayNum} ${monthStr} (Pasado)`;
    return "Futuros servicios";
  };

  const handleFiltersChange = (filters: Record<string, any>) => {
    if (filters.Fecha && typeof filters.Fecha === "object") {
      setDateRange({ start: filters.Fecha.start, end: filters.Fecha.end });
    } else {
      setDateRange({});
    }
    setActiveFilters(filters);
    setCurrentPage(1);
  };

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "Fecha",
        label: "Periodo",
        type: "dateRange" as any,
        isExternal: true,
      },
      FilterPresets.createStatusFilter(
        "Estatus",
        Object.values(CONTRACT_STATUS_MAP).filter(
          (status) => status !== "Finalizado" && status !== "Cancelado",
        ),
        "Filtrar por Estatus",
      ),
      FilterPresets.createSelectFilter(
        "Unidad",
        "Unidad",
        Array.from(new Set(trips.map((item) => item.Unidad).filter(Boolean))),
        "Filtrar por Unidad",
      ),
    ],
    [trips],
  );

  // Filter trips for mobile cards
  const filteredTrips = useMemo(() => {
    return trips.filter((trip) => {
      // Date range filter
      if (dateRange.start || dateRange.end) {
        const tripDate = trip._tripData?.service_date
          ? new Date(trip._tripData.service_date)
          : null;
        if (!tripDate) return false;
        const tripDay = new Date(
          tripDate.getFullYear(),
          tripDate.getMonth(),
          tripDate.getDate(),
        ).getTime();
        if (dateRange.start) {
          const s = dateRange.start;
          const startDay = new Date(
            s.getFullYear(),
            s.getMonth(),
            s.getDate(),
          ).getTime();
          if (tripDay < startDay) return false;
        }
        if (dateRange.end) {
          const e = dateRange.end;
          const endDay = new Date(
            e.getFullYear(),
            e.getMonth(),
            e.getDate(),
          ).getTime();
          if (tripDay > endDay) return false;
        }
      }
      // Other active filters (Estatus, Unidad)
      for (const [key, value] of Object.entries(activeFilters)) {
        if (key === "Fecha") continue;
        if (!value) continue;
        if (
          String(trip[key] ?? "")
            .toLowerCase()
            .trim() !== String(value).toLowerCase().trim()
        )
          return false;
      }
      return true;
    });
  }, [trips, dateRange, activeFilters]);

  if (driverError) {
    return <ErrorBlock message={driverError} onRetry={refresh} />;
  }

  if (loading) {
    return <LoadingComponent message="Cargando tus viajes..." />;
  }

  if (error) {
    return <ErrorBlock message={error} onRetry={refresh} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Mis Viajes</h1>
        <p>
          {filteredTrips.length}{" "}
          {filteredTrips.length === 1 ? "viaje asignado" : "viajes asignados"}
        </p>
      </div>

      {isMobile ? (
        <div className={styles.mobileList}>
          <FilterComponent
            filters={filterConfigs}
            onFiltersChange={handleFiltersChange}
          />
          {filteredTrips.length === 0 ? (
            <p>No tienes viajes asignados</p>
          ) : (
            filteredTrips.map((trip, idx) => {
              const prevLabel =
                idx > 0 ? groupByDate(filteredTrips[idx - 1]) : null;
              const currentLabel = groupByDate(trip);
              const showHeader = currentLabel !== prevLabel;
              return (
                <div key={trip.trip_id ?? trip["ID Viaje"]}>
                  {showHeader && (
                    <div className={styles.mobileGroupHeader}>
                      {currentLabel}
                    </div>
                  )}
                  <DriverTripCard
                    trip={trip}
                    animationIndex={idx}
                    onClick={handleRowClick}
                  />
                </div>
              );
            })
          )}
        </div>
      ) : (
        <FilterableTableComponent
          title="Viajes Asignados"
          originalData={trips}
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
          enableFiltering
          enableSearch
          showActions
          onRowClick={handleRowClick}
          onFiltersChange={handleFiltersChange}
          groupBy={groupByDate}
          enablePagination
          itemsPerPage={10}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
