"use client";
import { useState } from "react";
import TableComponent from "../TableComponent/TableComponent";
import SearchComponent from "../SearchComponent/SearchComponent";

export default function DashboardContent() {
  const [currentPage, setCurrentPage] = useState(1);

  // Sample data for the table
  const sampleData = [
    {
      "Empresa o Cliente": "Empresa ABC",
      Origen: "Madrid",
      Destino: "Barcelona",
      Fecha: "15/10/2024",
      Unidad: "Autobús",
      Chofer: "Juan Pérez",
      Estatus: "Agendado",
    },
    {
      "Empresa o Cliente": "Cliente XYZ",
      Origen: "Sevilla",
      Destino: "Valencia",
      Fecha: "20/10/2024",
      Unidad: "Minibús",
      Chofer: "María García",
      Estatus: "Por asignar",
    },
    {
      "Empresa o Cliente": "Turismo DEF",
      Origen: "Bilbao",
      Destino: "San Sebastián",
      Fecha: "25/10/2024",
      Unidad: "Autobús",
      Chofer: "Carlos López",
      Estatus: "Próximo",
    },
    {
      "Empresa o Cliente": "Tours GHI",
      Origen: "Granada",
      Destino: "Córdoba",
      Fecha: "28/10/2024",
      Unidad: "Minibús",
      Chofer: "Ana Rodríguez",
      Estatus: "En curso",
    },
    {
      "Empresa o Cliente": "Viajes JKL",
      Origen: "Toledo",
      Destino: "Segovia",
      Fecha: "30/10/2024",
      Unidad: "Autobús",
      Chofer: "Luis Martín",
      Estatus: "Por pagar",
    },
    {
      "Empresa o Cliente": "Excursiones MNO",
      Origen: "Salamanca",
      Destino: "Ávila",
      Fecha: "02/11/2024",
      Unidad: "Minibús",
      Chofer: "Carmen Jiménez",
      Estatus: "Finalizado",
    },
    {
      "Empresa o Cliente": "Turismo PQR",
      Origen: "Cáceres",
      Destino: "Badajoz",
      Fecha: "05/11/2024",
      Unidad: "Autobús",
      Chofer: "Roberto Silva",
      Estatus: "Agendado",
    },
    {
      "Empresa o Cliente": "Transportes STU",
      Origen: "León",
      Destino: "Astorga",
      Fecha: "08/11/2024",
      Unidad: "Minibús",
      Chofer: "Elena Vega",
      Estatus: "Por asignar",
    },
    {
      "Empresa o Cliente": "Viajes VWX",
      Origen: "Palencia",
      Destino: "Burgos",
      Fecha: "10/11/2024",
      Unidad: "Autobús",
      Chofer: "Francisco Moreno",
      Estatus: "Próximo",
    },
    {
      "Empresa o Cliente": "Tours YZ",
      Origen: "Soria",
      Destino: "Logroño",
      Fecha: "12/11/2024",
      Unidad: "Minibús",
      Chofer: "Isabel Ruiz",
      Estatus: "En curso",
    },
  ];

  const columns = [
    "Empresa o Cliente",
    "Origen",
    "Destino",
    "Fecha",
    "Unidad",
    "Chofer",
    "Estatus",
  ];

  const handleViewDetails = (rowData: any) => {
    console.log("Ver detalles de:", rowData);
    alert(`Ver detalles de: ${rowData["Empresa o Cliente"]}`);
  };

  const handleEdit = (rowData: any) => {
    console.log("Editar:", rowData);
    alert(`Editar: ${rowData["Empresa o Cliente"]}`);
  };

  return (
    <div>
      <TableComponent
        title="Lista de Viajes"
        // description="Gestión de viajes y tours disponibles"
        data={sampleData}
        columns={columns}
        showActions={true}
        onViewDetails={handleViewDetails}
        onEdit={handleEdit}
        emptyMessage="No hay viajes disponibles"
        enablePagination={true}
        itemsPerPage={5}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
      
    </div>
  );
}
