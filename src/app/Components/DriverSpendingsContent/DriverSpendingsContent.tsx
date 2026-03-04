"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import FilterableTableComponent from "@/app/Components/FilterableTable/FilterableTableComponent";
import FilterComponent, { FilterConfig, FilterPresets } from "@/app/Components/FilterComponent";
import { AddFilled, ArrowClockwiseRegular } from "@fluentui/react-icons";
import { Button } from "@fluentui/react-components";
import LoadingComponent from "@/app/Components/LoadingComponent/LoadingComponent";
import ButtonComponent from "@/app/Components/ButtonComponent/ButtonComponent";
import DriverSpendingsCard from "@/app/Components/DriverSpendingsCard/DriverSpendingsCard";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { useAsyncData } from "@/app/hooks/useAsyncData";
import { useDriverId } from "@/app/hooks/useDriverId";
import { spendingsService } from "@/services/api";
import { formatDateStandard } from "@/app/Utils/FormatUtil";
import styles from "./DriverSpendingsContent.module.css";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("DriverSpendingsContent");

function transformSpendingsData(spendings: any[]): any[] {
  const statusMap: Record<string, string> = {
    pending: "Pendiente",
    approved: "Aprobado",
    denied: "Rechazado",
  };

  return spendings.map((s) => ({
    ID: s.spending_id,
    Fecha: formatDateStandard(s.submitted_at),
    Categoría: s.spending_type || "",
    Monto: `$${Number(s.spending_amount || 0).toFixed(2)}`,
    Estatus: statusMap[s.approved_status] || "Pendiente",
    Descripción: s.comments || "",
    // keep raw data for detail navigation
    _raw: s,
  }));
}

export default function DriverSpendingsContent({ createRoute = "/chofer/gastos/crear" }: { createRoute?: string }) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { driverId, error: driverError, loading: driverLoading } = useDriverId();
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileColumnFilters, setMobileColumnFilters] = useState<Record<string, any>>({});

  const { data: rawSpendings, loading, error, refresh } = useAsyncData(
    () => driverId ? spendingsService.getByDriver(driverId) : Promise.resolve([]),
    [] as any[],
    [driverId],
  );

  const spendingsData = useMemo(() => transformSpendingsData(rawSpendings), [rawSpendings]);

  const handleCreateSpending = () => {
    router.push(createRoute);
  };

  const handleRowClick = (_row: any) => {
    // TODO: Navigate to spending details when available
  };

  const filterConfigs: FilterConfig[] = useMemo(() => [
    FilterPresets.createStatusFilter(
      "Estatus",
      ["Pendiente", "Aprobado", "Rechazado"],
      "Filtrar por Estatus",
    ),
    FilterPresets.createSelectFilter(
      "Categoría",
      "Categoría",
      Array.from(new Set(spendingsData.map((s) => s.Categoría).filter(Boolean))),
      "Filtrar por Categoría",
    ),
  ], [spendingsData]);

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
    if (Object.keys(mobileColumnFilters).length === 0) return spendingsData;

    return spendingsData.filter((item) => {
      return Object.entries(mobileColumnFilters).every(([key, value]) => {
        if (!value) return true;
        const itemValue = item[key];
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        return String(itemValue) === String(value);
      });
    });
  }, [spendingsData, mobileColumnFilters]);

  if (driverLoading) {
    return <LoadingComponent message="Verificando sesión..." />;
  }

  if (driverError) {
    return <div>{driverError}</div>;
  }

  if (loading) {
    return <LoadingComponent message="Cargando gastos..." />;
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p style={{ color: "red" }}>Error: {error}</p>
        <ButtonComponent text="Reintentar" onClick={refresh} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div
        className={`${styles.header} ${isMobile ? styles.headerMobile : ""}`}
      >
        <div>
          <h1 className={styles.title}>Mis Gastos</h1>
          <p className={styles.subtitle}>
            {spendingsData.length}{" "}
            {spendingsData.length === 1
              ? "gasto registrado"
              : "gastos registrados"}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <ButtonComponent
            text="Actualizar"
            icon={<ArrowClockwiseRegular />}
            onClick={refresh}
            appearance="outline"
          />
          <Button
            appearance="primary"
            icon={<AddFilled />}
            onClick={handleCreateSpending}
            style={{ backgroundColor: "#1a2e47", borderColor: "#1a2e47" }}
          >
            Registrar Gasto
          </Button>
        </div>
      </div>

      {isMobile ? (
        <div>
          <div className={styles.mobileFilters}>
            <FilterComponent
              filters={filterConfigs}
              onFiltersChange={handleFiltersChange}
              showActiveFilters={false}
              showClearButton={true}
              containerClassName={styles.mobileFilterContainer}
            />
          </div>

          {mobileFilteredData.length === 0 ? (
            <p style={{ textAlign: "center", color: "#888", padding: 24 }}>
              No has registrado gastos aún.
            </p>
          ) : (
            mobileFilteredData.map((spending, index) => (
              <DriverSpendingsCard
                key={spending.ID || index}
                spending={spending}
                onClick={handleRowClick}
              />
            ))
          )}
        </div>
      ) : (
        <FilterableTableComponent
          title="Gastos Registrados"
          originalData={spendingsData}
          columns={[
            "ID",
            "Fecha",
            "Categoría",
            "Monto",
            "Estatus",
            "Descripción",
          ]}
          filterConfigs={filterConfigs}
          enableFiltering
          enableSearch
          showActions={false}
          enablePagination
          itemsPerPage={10}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onFiltersChange={handleFiltersChange}
        />
      )}
    </div>
  );
}
