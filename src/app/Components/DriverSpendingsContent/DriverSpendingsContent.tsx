"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FilterableTableComponent from "@/app/Components/FilterableTable/FilterableTableComponent";
import { FilterConfig, FilterPresets } from "@/app/Components/FilterComponent";
import { AddFilled } from "@fluentui/react-icons";
import { Button } from "@fluentui/react-components";
import LoadingComponent from "@/app/Components/LoadingComponent/LoadingComponent";
import DriverSpendingsCard from "@/app/Components/DriverSpendingsCard/DriverSpendingsCard";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import styles from "./DriverSpendingsContent.module.css";
import { useDriverId } from "@/app/hooks/useDriverId";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("DriverSpendingsContent");

export default function DriverSpendingsContent() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const { driverId, error, loading: driverLoading } = useDriverId();
  const [currentPage, setCurrentPage] = useState(1);
  const [spendingsData, setSpendingsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  /* ------------------ Fetch Spendings ------------------ */
  useEffect(() => {
    if (!driverId) return;

    setLoading(true);

    const timer = setTimeout(() => {
      setSpendingsData([
        {
          ID: 1,
          Fecha: new Date().toLocaleDateString(),
          Categoría: "Combustible",
          Monto: "$500.00",
          Estatus: "Pendiente",
          Descripción: "Carga de combustible en viaje a CDMX",
        },
      ]);
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [driverId]);

  const handleCreateSpending = () => {
    router.push("/chofer/gastos/crear");
  };

  const handleRowClick = (_row: any) => {
    // TODO: Navigate to spending details when available
  };

  const filterConfigs: FilterConfig[] = [
    FilterPresets.createStatusFilter(
      "Estatus",
      ["Pendiente", "Aprobado", "Rechazado"],
      "Filtrar por Estatus",
    ),
  ];

  if (driverLoading) {
    return <LoadingComponent message="Verificando sesión..." />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (loading) {
    return <LoadingComponent message="Cargando gastos..." />;
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

        <Button
          appearance="primary"
          icon={<AddFilled />}
          onClick={handleCreateSpending}
        >
          Registrar Gasto
        </Button>
      </div>

      {isMobile ? (
        <div>
          {spendingsData.length === 0 ? (
            <p>No has registrado gastos aún</p>
          ) : (
            spendingsData.map((spending, index) => (
              <DriverSpendingsCard
                key={index}
                spending={spending}
                onClick={(row) => handleRowClick(row)}
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
        />
      )}
    </div>
  );
}
