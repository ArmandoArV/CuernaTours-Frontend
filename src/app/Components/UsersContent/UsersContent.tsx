"use client";
import TableComponent from "../TableComponent/TableComponent";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("UsersContent");

export default function UsersContent() {
  // Users management data
  const usersData = [
    {
      "ID": "001",
      "Nombre": "Juan Pérez",
      "Email": "juan.perez@example.com",
      "Rol": "Chofer",
      "Estado": "Activo",
      "Fecha Registro": "15/09/2024"
    },
    {
      "ID": "002", 
      "Nombre": "María García",
      "Email": "maria.garcia@example.com",
      "Rol": "Administrador", 
      "Estado": "Activo",
      "Fecha Registro": "10/09/2024"
    },
    {
      "ID": "003",
      "Nombre": "Carlos López", 
      "Email": "carlos.lopez@example.com",
      "Rol": "Chofer",
      "Estado": "Inactivo",
      "Fecha Registro": "05/09/2024"
    },
    {
      "ID": "004",
      "Nombre": "Ana Martínez",
      "Email": "ana.martinez@example.com", 
      "Rol": "Usuario",
      "Estado": "Activo",
      "Fecha Registro": "01/10/2024"
    }
  ];

  const usersColumns = ["ID", "Nombre", "Email", "Rol", "Estado", "Fecha Registro"];

  const handleViewUser = (rowData: any) => {
    log.debug("Ver usuario:", rowData);
    alert(`Ver detalles del usuario: ${rowData["Nombre"]}`);
  };

  const handleEditUser = (rowData: any) => {
    log.debug("Editar usuario:", rowData);
    alert(`Editar usuario: ${rowData["Nombre"]}`);
  };

  const handleAddUser = () => {
    alert("Agregar nuevo usuario - esta funcionalidad se implementará próximamente");
  };

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <button 
          onClick={handleAddUser}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Agregar Nuevo Usuario
        </button>
      </div>
      
      <TableComponent
        data={usersData}
        columns={usersColumns}
        showActions={true}
      />
    </>
  );
}