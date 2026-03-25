"use client";
import { useState, useMemo } from "react";
import {
  Card,
  Text,
  Badge,
  Divider,
  makeStyles as fluentMakeStyles,
  tokens,
} from "@fluentui/react-components";
import FilterableTableComponent from "@/app/Components/FilterableTable/FilterableTableComponent";
import FilterComponent, { FilterConfig, FilterPresets } from "@/app/Components/FilterComponent";
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

const useCardStyles = fluentMakeStyles({
  wrapper: {
    display: "flex",
    borderRadius: "12px",
    overflow: "hidden",
    marginBottom: "16px",
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
    ":hover": {
      transform: "translateY(-1px)",
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
    },
    ":active": {
      transform: "translateY(0)",
    },
  },
  statusBar: {
    width: "6px",
  },
  pending: {
    backgroundColor: tokens.colorPaletteYellowBackground3,
  },
  approved: {
    backgroundColor: tokens.colorPaletteGreenBackground3,
  },
  rejected: {
    backgroundColor: tokens.colorPaletteRedBackground3,
  },
  paid: {
    backgroundColor: tokens.colorPaletteBlueBorderActive,
  },
  card: {
    flex: 1,
    backgroundColor: tokens.colorNeutralBackground2,
    padding: "16px",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  footerRow: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "12px",
  },
});

function DriverValeCard({ vale, onClick }: { vale: any; onClick: (v: any) => void }) {
  const cs = useCardStyles();

  const getStatusClass = () => {
    switch (vale.Estatus) {
      case "Pagado":
        return cs.paid;
      case "Rechazado":
        return cs.rejected;
      case "Aprobado":
        return cs.approved;
      default:
        return cs.pending;
    }
  };

  const getBadgeColor = (): "warning" | "success" | "danger" | "informative" => {
    switch (vale.Estatus) {
      case "Pagado":
        return "informative";
      case "Rechazado":
        return "danger";
      case "Aprobado":
        return "success";
      default:
        return "warning";
    }
  };

  return (
    <div className={cs.wrapper} onClick={() => onClick(vale)}>
      <div className={`${cs.statusBar} ${getStatusClass()}`} />
      <Card className={cs.card} appearance="subtle">
        <div className={cs.headerRow}>
          <Text weight="semibold" size={500}>{vale.Monto}</Text>
          <Badge appearance="filled" color={getBadgeColor()}>
            {vale.Estatus}
          </Badge>
        </div>

        <div className={cs.section}>
          <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
            Concepto
          </Text>
          <Text>{vale.Concepto}</Text>
        </div>

        <Divider />

        <div className={cs.footerRow}>
          <div className={cs.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Fecha
            </Text>
            <Text>{vale.Fecha}</Text>
          </div>
          <div className={cs.section}>
            <Text size={200} style={{ color: tokens.colorNeutralForeground3 }}>
              Tipo de Pago
            </Text>
            <Text>{vale["Tipo de Pago"]}</Text>
          </div>
        </div>
      </Card>
    </div>
  );
}

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
  const [mobileColumnFilters, setMobileColumnFilters] = useState<Record<string, any>>({});

  const { data: rawVales, loading, error, refresh } = useAsyncData(
    () => (driverId ? valesService.getByDriver(driverId) : Promise.resolve([])),
    [] as ValeWithDetails[],
    [driverId],
  );

  const valesData = useMemo(() => transformValesData(rawVales), [rawVales]);

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
    if (Object.keys(mobileColumnFilters).length === 0) return valesData;
    return valesData.filter((item) => {
      return Object.entries(mobileColumnFilters).every(([key, value]) => {
        if (!value) return true;
        const itemValue = item[key as keyof typeof item];
        if (Array.isArray(value)) {
          return value.includes(itemValue);
        }
        return String(itemValue) === String(value);
      });
    });
  }, [valesData, mobileColumnFilters]);

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
            Solicitar Vale
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
              No tienes vales registrados aún.
            </p>
          ) : (
            mobileFilteredData.map((vale, index) => (
              <DriverValeCard
                key={vale.ID || index}
                vale={vale}
                onClick={() => {}}
              />
            ))
          )}
        </div>
      ) : (
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
          onFiltersChange={handleFiltersChange}
        />
      )}

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
