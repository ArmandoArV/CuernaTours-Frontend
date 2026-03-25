"use client";
import { useState, useMemo } from "react";
import FilterableTableComponent from "@/app/Components/FilterableTable/FilterableTableComponent";
import { FilterConfig, FilterPresets } from "@/app/Components/FilterComponent";
import { AddFilled, ArrowClockwiseRegular } from "@fluentui/react-icons";
import { Button } from "@fluentui/react-components";
import LoadingComponent from "@/app/Components/LoadingComponent/LoadingComponent";
import ButtonComponent from "@/app/Components/ButtonComponent/ButtonComponent";
import AddValeModal from "@/app/Components/AddValeModal/AddValeModal";
import { useIsMobile } from "@/app/hooks/useIsMobile";
import { useAsyncData } from "@/app/hooks/useAsyncData";
import { useDriverId } from "@/app/hooks/useDriverId";
import { valesService } from "@/services/api/vales.service";
import type { ValeWithDetails } from "@/services/api/vales.service";
import { formatDateStandard } from "@/app/Utils/FormatUtil";
import styles from "./DriverValesContent.module.css";

const STATUS_MAP: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  denied: "Rechazado",
};

function transformValesData(vales: ValeWithDetails[]) {
  return vales.map((v) => ({
    ID: v.vale_id,
    Fecha: formatDateStandard(v.created_at),
    Monto: `$${Number(v.amount || 0).toFixed(2)}`,
    Concepto: v.request_notes || "—",
    Estatus: STATUS_MAP[v.status] || v.status,
    "Tipo de Pago": v.payment_type || "—",
    _raw: v,
  }));
}

export default function DriverValesContent() {
  const isMobile = useIsMobile();
  const { driverId, error: driverError, loading: driverLoading } = useDriverId();
  const [currentPage, setCurrentPage] = useState(1);
  const [isValeModalOpen, setIsValeModalOpen] = useState(false);

  const { data: rawVales, loading, error, refresh } = useAsyncData(
    () => (driverId ? valesService.getByDriver(driverId) : Promise.resolve([])),
    [] as ValeWithDetails[],
    [driverId],
  );

  const valesData = useMemo(() => transformValesData(rawVales), [rawVales]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      FilterPresets.createStatusFilter(
        "Estatus",
        ["Pendiente", "Pagado", "Rechazado"],
        "Filtrar por Estatus",
      ),
    ],
    [],
  );

  if (driverLoading) {
    return <LoadingComponent message="Verificando sesión..." />;
  }

  if (driverError) {
    return <div>{driverError}</div>;
  }

  if (loading) {
    return <LoadingComponent message="Cargando vales..." />;
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
      <div className={`${styles.header} ${isMobile ? styles.headerMobile : ""}`}>
        <div>
          <h1 className={styles.title}>Mis Vales</h1>
          <p className={styles.subtitle}>
            {valesData.length} {valesData.length === 1 ? "vale registrado" : "vales registrados"}
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
            onClick={() => setIsValeModalOpen(true)}
            style={{ backgroundColor: "#1a2e47", borderColor: "#1a2e47" }}
          >
            Asignar Vale
          </Button>
        </div>
      </div>

      <FilterableTableComponent
        title="Vales Registrados"
        originalData={valesData}
        columns={["ID", "Fecha", "Monto", "Concepto", "Estatus", "Tipo de Pago"]}
        filterConfigs={filterConfigs}
        enableFiltering
        enableSearch
        showActions={false}
        enablePagination
        itemsPerPage={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      <AddValeModal
        isOpen={isValeModalOpen}
        onClose={() => setIsValeModalOpen(false)}
        tripData={null}
        onValeCreated={() => {
          setIsValeModalOpen(false);
          refresh();
        }}
      />
    </div>
  );
}
