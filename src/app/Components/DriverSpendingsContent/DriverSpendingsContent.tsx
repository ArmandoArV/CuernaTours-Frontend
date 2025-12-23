"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FilterableTableComponent from "@/app/Components/FilterableTable/FilterableTableComponent";
import { FilterConfig, FilterPresets } from "@/app/Components/FilterComponent";
import ButtonComponent from "@/app/Components/ButtonComponent/ButtonComponent";
import { AddFilled } from "@fluentui/react-icons";
import LoadingComponent from "@/app/Components/LoadingComponent/LoadingComponent";
import { getCookie } from "@/app/Utils/CookieUtil";
import styles from "./DriverSpendingsContent.module.css";

export default function DriverSpendingsContent() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [spendingsData, setSpendingsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Error getting user data:", error);
      setLoading(false);
    }
  }, []);

  // Fetch spendings (mock data for now)
  useEffect(() => {
    if (!driverId) return;

    setLoading(true);
    
    // TODO: Replace with actual API call
    // const spendings = await spendingsService.getByDriver(driverId);
    
    // Mock data
    setTimeout(() => {
      setSpendingsData([
        {
          "ID": 1,
          "Fecha": new Date().toLocaleDateString(),
          "Categoría": "Combustible",
          "Monto": "$500.00",
          "Estatus": "Pendiente",
          "Descripción": "Carga de combustible en viaje a CDMX",
        },
      ]);
      setLoading(false);
    }, 500);
  }, [driverId]);

  const handleCreateSpending = () => {
    router.push("/chofer/gastos/crear");
  };

  const handleRowClick = (row: any) => {
    // Navigate to spending details if needed
    console.log("Clicked spending:", row);
  };

  const filterConfigs: FilterConfig[] = [
    FilterPresets.createStatusFilter(
      "Estatus",
      ["Pendiente", "Aprobado", "Rechazado"],
      "Filtrar por Estatus"
    ),
  ];

  if (loading) {
    return <LoadingComponent message="Cargando gastos..." />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Mis Gastos</h1>
          <p className={styles.subtitle}>
            {spendingsData.length} {spendingsData.length === 1 ? "gasto registrado" : "gastos registrados"}
          </p>
        </div>
        <ButtonComponent
          text="Registrar Gasto"
          icon={<AddFilled />}
          onClick={handleCreateSpending}
          className={styles.createButton}
        />
      </div>

      <FilterableTableComponent
        title="Gastos Registrados"
        originalData={spendingsData}
        columns={["ID", "Fecha", "Categoría", "Monto", "Estatus", "Descripción"]}
        filterConfigs={filterConfigs}
        enableFiltering={true}
        enableSearch={true}
        showActions={false}
        onRowClick={handleRowClick}
        emptyMessage="No has registrado gastos aún"
        enablePagination={true}
        itemsPerPage={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
