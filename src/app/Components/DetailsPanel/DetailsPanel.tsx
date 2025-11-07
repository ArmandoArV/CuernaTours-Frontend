"use client";
import React from "react";
import styles from "./DetailsPanel.module.css";

interface DetailsPanelProps {
  data: any;
  loading?: boolean;
  error?: string | null;
  onClose?: () => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({
  data,
  loading,
  error,
  onClose,
}) => {
  if (loading) return <div className={styles.loading}>Cargando detalles...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!data) return <div className={styles.error}>No hay datos disponibles</div>;

  // Check if this is detailed API data (has contract_id) or simple row data (has Spanish field names)
  const isDetailedData = data.hasOwnProperty('contract_id');
  
  console.log("🎨 DetailsPanel received data:", data);
  console.log("🎨 Is detailed data (has contract_id):", isDetailedData);
  console.log("🎨 Available data keys:", Object.keys(data));
  
  // Extract data based on the structure
  const extractedData = isDetailedData ? {
    // API response structure
    client_name: data.client_name,
    client_type_name: data.client_type_name,
    payment_type_name: data.payment_type_name,
    contract_status_name: data.contract_status_name,
    coordinator_name: data.coordinator_name,
    coordinator_lastname: data.coordinator_lastname,
    creator_name: data.creator_name,
    creator_lastname: data.creator_lastname,
    amount: data.amount,
    IVA: data.IVA,
    internal_observations: data.internal_observations,
    observations: data.observations,
    trips: data.trips || [],
    contract_id: data.contract_id,
    created_at: data.created_at,
  } : {
    // Simple row data structure (Spanish field names)
    client_name: data["Empresa o Cliente"] || data["Cliente"],
    client_type_name: null,
    payment_type_name: null,
    contract_status_name: data["Estatus"],
    coordinator_name: null,
    coordinator_lastname: null,
    creator_name: null,
    creator_lastname: null,
    amount: null,
    IVA: null,
    internal_observations: null,
    observations: null,
    trips: [],
    // Additional simple data
    origin: data["Origen"],
    destination: data["Destino"],
    date: data["Fecha"],
    unit: data["Unidad"],
    driver: data["Chofer"],
  };

  const {
    client_name,
    client_type_name,
    payment_type_name,
    contract_status_name,
    coordinator_name,
    coordinator_lastname,
    creator_name,
    creator_lastname,
    amount,
    IVA,
    internal_observations,
    observations,
    trips,
    contract_id,
    created_at,
    // Simple data fields
    origin,
    destination,
    date,
    unit,
    driver,
  } = extractedData;

  console.log("🎨 Extracted data for display:", {
    client_name,
    contract_status_name,
    contract_id,
    tripsCount: trips ? trips.length : 0,
    isDetailedData,
    // Show a few key fields for debugging
    amount,
    internal_observations: internal_observations ? "Present" : "Not present",
    observations: observations ? "Present" : "Not present",
  });

  return (
    <div className={styles.detailsPanel}>
      <div className={styles.detailsHeader}>
        <h3 className={styles.detailsTitle}>Detalles del contrato</h3>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>

      {/* General Contract Info */}
      <div className={styles.detailsGrid}>
        <div className={styles.detailItem}>
          <span className={styles.detailKey}>Cliente</span>
          <span className={styles.detailValue}>{client_name || 'N/A'}</span>
        </div>
        
        {isDetailedData ? (
          <>
            <div className={styles.detailItem}>
              <span className={styles.detailKey}>Tipo Cliente</span>
              <span className={styles.detailValue}>{client_type_name || 'N/A'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailKey}>Tipo Pago</span>
              <span className={styles.detailValue}>{payment_type_name || 'N/A'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailKey}>Coordinador</span>
              <span className={styles.detailValue}>
                {coordinator_name && coordinator_lastname 
                  ? `${coordinator_name} ${coordinator_lastname}` 
                  : 'N/A'}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailKey}>Creado Por</span>
              <span className={styles.detailValue}>
                {creator_name && creator_lastname 
                  ? `${creator_name} ${creator_lastname}` 
                  : 'N/A'}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailKey}>Monto</span>
              <span className={styles.detailValue}>{amount ? `$${amount}` : 'N/A'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailKey}>IVA</span>
              <span className={styles.detailValue}>{IVA === 0 ? "No" : IVA === 1 ? "Sí" : 'N/A'}</span>
            </div>
            {contract_id && (
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>ID Contrato</span>
                <span className={styles.detailValue}>{contract_id}</span>
              </div>
            )}
            {created_at && (
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>Fecha Creación</span>
                <span className={styles.detailValue}>
                  {new Date(created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            )}
          </>
        ) : (
          <>
            {origin && (
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>Origen</span>
                <span className={styles.detailValue}>{origin}</span>
              </div>
            )}
            {destination && (
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>Destino</span>
                <span className={styles.detailValue}>{destination}</span>
              </div>
            )}
            {date && (
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>Fecha</span>
                <span className={styles.detailValue}>{date}</span>
              </div>
            )}
            {unit && (
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>Unidad</span>
                <span className={styles.detailValue}>{unit}</span>
              </div>
            )}
            {driver && (
              <div className={styles.detailItem}>
                <span className={styles.detailKey}>Chofer</span>
                <span className={styles.detailValue}>{driver}</span>
              </div>
            )}
          </>
        )}
        
        <div className={styles.detailItem}>
          <span className={styles.detailKey}>Estatus</span>
          <span className={styles.detailValue}>{contract_status_name || 'N/A'}</span>
        </div>
      </div>

      {/* Notes - only show for detailed data */}
      {isDetailedData && (
        <>
          {internal_observations && internal_observations.trim() !== "" && (
            <div className={styles.compactArrayItem}>
              <strong>Observaciones Internas:</strong>
              <p className={styles.detailValue}>{internal_observations}</p>
            </div>
          )}
          {observations && observations.trim() !== "" && (
            <div className={styles.compactArrayItem}>
              <strong>Observaciones Cliente:</strong>
              <p className={styles.detailValue}>{observations}</p>
            </div>
          )}
        </>
      )}

      {/* Trips - only show for detailed data */}
      {isDetailedData && trips && trips.length > 0 && (
        <div className={styles.compactArrayContainer}>
          <h4>Servicios / Viajes</h4>
          {trips.map((trip: any, index: number) => {
            console.log(`🚗 Trip ${index + 1} data:`, trip);
            return (
            <div key={index} className={styles.compactArrayItem}>
              <div className={styles.arrayItemHeader}>
                <strong>
                  Viaje {index + 1}: {new Date(trip.service_date).toLocaleDateString('es-ES')} - {trip.unit_type} 
                  {trip.origin_time && ` (${trip.origin_time})`}
                </strong>
              </div>

              <div className={styles.compactNestedGrid}>
                <div className={styles.compactDetailItem}>
                  <span className={styles.compactDetailKey}>Pasajeros</span>
                  <span className={styles.compactDetailValue}>{trip.passengers}</span>
                </div>

                <div className={styles.compactDetailItem}>
                  <span className={styles.compactDetailKey}>Estado</span>
                  <span className={styles.compactDetailValue}>{trip.status?.name || 'N/A'}</span>
                </div>

                <div className={styles.compactDetailItem}>
                  <span className={styles.compactDetailKey}>Origen</span>
                  <span className={styles.compactDetailValue}>{trip.origin?.name || 'N/A'}</span>
                </div>

                <div className={styles.compactDetailItem}>
                  <span className={styles.compactDetailKey}>Destino</span>
                  <span className={styles.compactDetailValue}>{trip.destination?.name || 'N/A'}</span>
                </div>

                <div className={styles.compactDetailItem}>
                  <span className={styles.compactDetailKey}>Conductor</span>
                  <span className={styles.compactDetailValue}>
                    {trip.driver?.name && trip.driver?.lastname 
                      ? `${trip.driver.name} ${trip.driver.lastname}` 
                      : 'No asignado'}
                  </span>
                </div>

                {trip.driver?.phone && (
                  <div className={styles.compactDetailItem}>
                    <span className={styles.compactDetailKey}>Teléfono</span>
                    <span className={styles.compactDetailValue}>{trip.driver.phone}</span>
                  </div>
                )}

                <div className={styles.compactDetailItem}>
                  <span className={styles.compactDetailKey}>Unidad</span>
                  <span className={styles.compactDetailValue}>
                    {trip.vehicle?.alias && trip.vehicle?.license_plate 
                      ? `${trip.vehicle.alias} (${trip.vehicle.license_plate})` 
                      : 'No asignada'}
                  </span>
                </div>

                {trip.flight && (
                  <>
                    <div className={styles.compactDetailItem}>
                      <span className={styles.compactDetailKey}>Vuelo</span>
                      <span className={styles.compactDetailValue}>
                        {trip.flight.flight_number} - {trip.flight.airline}
                      </span>
                    </div>
                    <div className={styles.compactDetailItem}>
                      <span className={styles.compactDetailKey}>Llegada</span>
                      <span className={styles.compactDetailValue}>
                        {new Date(trip.flight.arrival_time).toLocaleString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {trip.flight.flight_origin && (
                      <div className={styles.compactDetailItem}>
                        <span className={styles.compactDetailKey}>Origen Vuelo</span>
                        <span className={styles.compactDetailValue}>{trip.flight.flight_origin}</span>
                      </div>
                    )}
                    {trip.flight.notes && trip.flight.notes.trim() !== "" && (
                      <div className={styles.compactDetailItem}>
                        <span className={styles.compactDetailKey}>Notas Vuelo</span>
                        <span className={styles.compactDetailValue}>{trip.flight.notes}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {trip.notes && trip.notes.trim() !== "" && (
                <p className={styles.compactDetailValue}><strong>Notas:</strong> {trip.notes}</p>
              )}
              {trip.internal_notes && trip.internal_notes.trim() !== "" && (
                <p className={styles.compactDetailValue}><strong>Notas Internas:</strong> {trip.internal_notes}</p>
              )}
              
              {trip.driver_accepted !== null && (
                <p className={styles.compactDetailValue}>
                  <strong>Estado Chofer:</strong> {trip.driver_accepted === 1 ? 'Aceptado' : 'Pendiente'}
                </p>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DetailsPanel;
