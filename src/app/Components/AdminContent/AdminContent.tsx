"use client";
import TableComponent from "../TableComponent/TableComponent";

export default function AdminContent() {
  // Admin-specific data
  const adminData = [
    {
      "Usuario": "Juan Pérez",
      "Rol": "Chofer",
      "Email": "juan@example.com",
      "Estado": "Activo",
      "Último Login": "10/10/2024"
    },
    {
      "Usuario": "María García",
      "Rol": "Administrador",
      "Email": "maria@example.com", 
      "Estado": "Activo",
      "Último Login": "11/10/2024"
    }
  ];

  const adminColumns = ["Usuario", "Rol", "Email", "Estado", "Último Login"];

  // Handlers removed: use TableComponent's inline selection (click eye) or pass callbacks from parent if needed

  return (
    <TableComponent
      title="Gestión de Usuarios"
      description="Administración de usuarios del sistema"
      data={adminData}
      columns={adminColumns}
  showActions={true}
      emptyMessage="No hay usuarios registrados"
    />
  );
}