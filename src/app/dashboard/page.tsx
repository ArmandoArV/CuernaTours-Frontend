"use client";
import { LateralNavbarType } from "../Types/LateralNavbarType";
import LateralNavbarComponent from "../Components/LateralNavbarComponent/LateralNavbarComponent";
import { HomeFilled } from "@fluentui/react-icons";
import styles from "./dashboard.module.css";
import TableComponent from "../Components/TableComponent/TableComponent";
export default function Home() {
  const navItems: LateralNavbarType[] = [
    { title: "Home", link: "/", icon: <HomeFilled /> }, // Visible to all
    { title: "Profile", link: "/profile" }, // Visible to all
    { title: "Admin Panel", link: "/admin", isAdmin: true }, // Only admin and owner
    { title: "User Management", link: "/users", isAdmin: true }, // Only admin and owner
    { title: "System Settings", link: "/settings", isOwner: true }, // Only owner
  ];

  // Sample data for the table
  const sampleData = [
    {
      "Empresa o Cliente": "Empresa ABC",
      "Origen": "Madrid",
      "Destino": "Barcelona",
      "Fecha": "15/10/2024",
      "Unidad": "Autobús",
      "Chofer": "Juan Pérez",
      "Estatus": "Agendado"
    },
    {
      "Empresa o Cliente": "Cliente XYZ",
      "Origen": "Sevilla",
      "Destino": "Valencia",
      "Fecha": "20/10/2024",
      "Unidad": "Minibús",
      "Chofer": "María García",
      "Estatus": "Por asignar"
    },
    {
      "Empresa o Cliente": "Turismo DEF",
      "Origen": "Bilbao",
      "Destino": "San Sebastián",
      "Fecha": "25/10/2024",
      "Unidad": "Autobús",
      "Chofer": "Carlos López",
      "Estatus": "Próximo"
    }
  ];

  const columns = ["Empresa o Cliente", "Origen", "Destino", "Fecha", "Unidad", "Chofer", "Estatus"];

  const handleViewDetails = (rowData: any) => {
    console.log("Ver detalles de:", rowData);
    // Here you would typically open a modal or navigate to a details page
    alert(`Ver detalles de: ${rowData["Empresa o Cliente"]}`);
  };

  const handleEdit = (rowData: any) => {
    console.log("Editar:", rowData);
    // Here you would typically open an edit form or navigate to an edit page
    alert(`Editar: ${rowData["Empresa o Cliente"]}`);
  };
  return (
    <div className={styles.dashboardLayout}>
      <LateralNavbarComponent
        items={navItems}
        userIsAdmin={true}
        userIsOwner={false}
      />
      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <TableComponent
            title="Lista de Viajes"
            description="Gestión de viajes y tours disponibles"
            data={sampleData}
            columns={columns}
            showActions={true}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            emptyMessage="No hay viajes disponibles"
          />
        </div>
      </main>
    </div>
  );
}
