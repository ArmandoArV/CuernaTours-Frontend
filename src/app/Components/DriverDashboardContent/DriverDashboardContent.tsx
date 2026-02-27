"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import FilterableTableComponent from "../FilterableTable/FilterableTableComponent";
import LoadingComponent from "@/app/Components/LoadingComponent/LoadingComponent";
import DriverTripCard from "@/app/Components/DriverTripCard/DriverTripCard";
import ErrorBlock from "@/app/Components/ErrorBlock/ErrorBlock";
import { FilterConfig, FilterPresets } from "../FilterComponent";
import { useDriverId } from "@/app/hooks/useDriverId";
import { useDriverTrips } from "@/app/hooks/useDriverTrips";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import styles from "./DriverDashboardContent.module.css";

const STATUS_MAP: Record<number, string> = {
  1: "Agendado",
  2: "Por asignar",
  3: "Próximo",
  4: "En curso",
  5: "Por pagar",
  6: "Finalizado",
  7: "Cancelado",
};

export default function DriverDashboardContent() {
  const router = useRouter();
  const { driverId, error: driverError } = useDriverId();
  const { trips, loading, error, refresh } = useDriverTrips(driverId);
  const isMobile = useIsMobile();
  const [currentPage, setCurrentPage] = useState(1);

  const handleRowClick = (row: any) => {
    console.log("Row clicked:", row);
  };

  const handleAddPayment = () => {
    router.push("/chofer/gastos/crear");
  };

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      FilterPresets.createStatusFilter(
        "Estatus",
        Object.values(STATUS_MAP).filter(
          (status) => status !== "Finalizado" && status !== "Cancelado",
        ),
        "Filtrar por Estatus",
      ),
      FilterPresets.createDateFilter(
        "Fecha",
        Array.from(new Set(trips.map((item) => item.Fecha).filter(Boolean))),
        "Filtrar por Fecha",
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
          {trips.length}{" "}
          {trips.length === 1 ? "viaje asignado" : "viajes asignados"}
        </p>
      </div>

      {isMobile ? (
        <div className={styles.mobileList}>
          {trips.length === 0 ? (
            <p>No tienes viajes asignados</p>
          ) : (
            trips.map((trip) => (
              <DriverTripCard
                key={trip.trip_id ?? trip["ID Viaje"]}
                trip={trip}
                onClick={handleRowClick}
              />
            ))
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
          onPayDriver={handleAddPayment}
          enablePagination
          itemsPerPage={10}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
