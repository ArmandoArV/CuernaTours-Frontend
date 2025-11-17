"use client";
import React from "react";
import styles from "./DetailsPanel.module.css";
import DateDisplayComponent from "@/app/Components/DateDisplayComponent";
import { TripCollection, type TripData } from "@/app/Types/TripTypes";

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
  if (loading)
    return <div className={styles.loading}>Cargando detalles...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!data)
    return <div className={styles.error}>No hay datos disponibles</div>;

  // Check if this is detailed API data (has contract_id) or simple row data (has Spanish field names)
  const isDetailedData = data.hasOwnProperty("contract_id");

  console.log("🎨 DetailsPanel received data:", data);
  console.log("🎨 Is detailed data (has contract_id):", isDetailedData);
  console.log("🎨 Available data keys:", Object.keys(data));

  // Extract data based on the structure
  const extractedData = isDetailedData
    ? {
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
      }
    : {
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

  // Create TripCollection instance
  const tripCollection = new TripCollection(trips as TripData[] || []);
  
  // Get trip information using the Trip classes
  const tripType = tripCollection.tripType;
  const dateRange = tripCollection.dateRange;
  const arrivalDate = dateRange.start ? dateRange.start.toISOString() : null;
  const returnDate = dateRange.end && tripCollection.count > 1 ? dateRange.end.toISOString() : null;

  console.log("🎨 Extracted data for display:", {
    client_name,
    contract_status_name,
    contract_id,
    tripsCount: trips ? trips.length : 0,
    tripType,
    isDetailedData,
    // Show a few key fields for debugging
    amount,
    internal_observations: internal_observations ? "Present" : "Not present",
    observations: observations ? "Present" : "Not present",
  });

  return (
    <div className={styles.detailsPanel}>
      <div
        className={styles.closeButton}
        onClick={onClose}
        title="Cerrar panel de detalles"
      >
        &times;
      </div>
      <div className={styles.topSection}>
        <div className={styles.topLeftSection}>
          <div className={styles.section}>
            {client_name && (
              <div className={styles.field}>
                <h1>{client_name}</h1>
              </div>
            )}
            <div className={styles.field}></div>
            {(() => {
              const phone =
                data?.phone ||
                data?.contact_phone ||
                data?.telefono ||
                data?.["Teléfono"] ||
                data?.contactNumber;
              const email =
                data?.email ||
                data?.contact_email ||
                data?.correo ||
                data?.["Correo"] ||
                data?.contactEmail;

              if (!phone && !email) {
                return (
                  <div className={styles.contactItem}>
                    Sin contacto disponible
                  </div>
                );
              }

              return (
                <div className={styles.contactInfo}>
                  {phone && (
                    <div className={styles.contactItem}>
                      <strong>Tel:</strong>{" "}
                      <a href={`tel:${phone}`} className={styles.contactLink}>
                        {phone}
                      </a>
                    </div>
                  )}
                  |
                  {email && (
                    <div className={styles.contactItem}>
                      <strong>Email:</strong>{" "}
                      <a
                        href={`mailto:${email}`}
                        className={styles.contactLink}
                      >
                        {email}
                      </a>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
        <div className={styles.topRightSection}>
          <div className={styles.section}>
            <>
              <div className={styles.field}>
                <div className={styles.label}>Costo del viaje:</div>
                <strong className={styles.value}>
                  {amount !== null && amount !== undefined
                    ? `$${amount.toFixed(2)}`
                    : "N/A"}
                </strong>
              </div>
            </>
          </div>
          <div className={styles.section}>
            <div className={styles.field}>
              <div className={styles.label}>Tipo de viaje:</div>
              <strong className={styles.value}>{tripType}</strong>
            </div>
          </div>
          <div className={styles.section}>
            <div className={styles.datesContainer}>
              <div className={styles.dateField}>
                <div className={styles.label}>Fecha de llegada:</div>
                <DateDisplayComponent date={arrivalDate || created_at} />
              </div>
              {returnDate && (
                <>
                  <div className={styles.dateFieldSeparator} />
                  <div className={styles.dateFieldRight}>
                    <div className={styles.label}>Fecha de regreso:</div>
                    <DateDisplayComponent date={returnDate} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.bottomSection}>
        {!tripCollection.isEmpty && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Detalles del Viaje</div>
            <div className={styles.tripDetails}>
              <div className={styles.tripInfo}>
                <div className={styles.label}>Pasajeros:</div>
                <div className={styles.value}>{tripCollection.totalPassengers}</div>
              </div>
              <div className={styles.tripInfo}>
                <div className={styles.label}>Vehículos:</div>
                <div className={styles.value}>
                  {tripCollection.vehicles.map(vehicle => vehicle.alias).join(", ")}
                </div>
              </div>
              <div className={styles.tripInfo}>
                <div className={styles.label}>Conductores:</div>
                <div className={styles.value}>
                  {tripCollection.drivers.map(driver => `${driver.name} ${driver.lastname}`).join(", ")}
                </div>
              </div>
            </div>
            {tripCollection.trips.map((trip, index) => (
              <div key={trip.tripId} className={styles.tripCard}>
                <div className={styles.tripHeader}>
                  <h4>Viaje {index + 1}</h4>
                  <span className={styles.tripStatus}>{trip.statusName}</span>
                </div>
                <div className={styles.tripRoute}>
                  <div className={styles.routeInfo}>
                    <strong>Ruta:</strong> {trip.routeSummary}
                  </div>
                  <div className={styles.routeTime}>
                    <strong>Hora:</strong> {trip.originTime}
                  </div>
                </div>
                {trip.hasFlightInfo && (
                  <div className={styles.flightInfo}>
                    <strong>Vuelo:</strong> {trip.flightInfo}
                    <br />
                    <strong>Origen:</strong> {trip.flightOrigin}
                    {trip.flightNotes && (
                      <>
                        <br />
                        <strong>Terminal:</strong> {trip.flightNotes}
                      </>
                    )}
                  </div>
                )}
                {trip.notes && (
                  <div className={styles.tripNotes}>
                    <strong>Notas:</strong> {trip.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {internal_observations && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Observaciones internas</div>
            <div className={styles.sectionContent}>{internal_observations}</div>
          </div>
        )}
        {observations && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Observaciones</div>
            <div className={styles.sectionContent}>{observations}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsPanel;
