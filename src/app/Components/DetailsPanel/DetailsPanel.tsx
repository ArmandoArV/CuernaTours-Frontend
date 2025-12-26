"use client";
import React from "react";
import styles from "./DetailsPanel.module.css";
import DateDisplayComponent from "@/app/Components/DateDisplayComponent";
import { TripCollection, type TripData } from "@/app/Types/TripTypes";
import { Contract, type ContractData } from "@/app/Types/ContractTypes";

export interface DetailsPanelProps {
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

  // Create Contract instance if detailed data, otherwise use TripCollection for simple data
  let contract: Contract | null = null;
  let tripCollection: TripCollection;
  let extractedData: any = {};

  if (isDetailedData) {
    // Use Contract class for detailed API data
    contract = new Contract(data as ContractData);
    tripCollection = contract.trips;
  } else {
    // Fallback to simple data structure
    extractedData = {
      client_name: data["Empresa o Cliente"] || data["Cliente"],
      contract_status_name: data["Estatus"],
      origin: data["Origen"],
      destination: data["Destino"],
      date: data["Fecha"],
      unit: data["Unidad"],
      driver: data["Chofer"],
    };
    tripCollection = new TripCollection([]);
  }

  return (
    <div className={styles.detailsPanel}>
      <div className={styles.topSection}>
        <div className={styles.topLeftSection}>
          <div className={styles.sectionsTop}>
            {((contract && contract.clientName) ||
              extractedData.client_name) && (
              <div className={styles.field}>
                <h1>
                  {contract ? contract.clientName : extractedData.client_name}
                </h1>
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
          <div className={styles.sectionsTop}>
            <>
              <div className={styles.field}>
                <div className={styles.label}>Costo del viaje:</div>
                <strong className={styles.value}>
                  {contract ? contract.formattedAmount : "N/A"}
                </strong>
              </div>
            </>
          </div>
          <div className={styles.sectionsTop}>
            <div className={styles.field}>
              <div className={styles.label}>Tipo de viaje:</div>
              <strong className={styles.value}>
                {contract ? contract.tripTypeSummary : tripCollection.tripType}
              </strong>
            </div>
          </div>
          <div className={styles.sectionsTop}>
            <div className={styles.datesContainer}>
              <div className={styles.dateField}>
                <div className={styles.label}>{""}</div>
                <DateDisplayComponent
                  className={styles.value}
                  date={
                    contract
                      ? contract.serviceDate.start?.toISOString() ||
                        contract.createdAt
                      : extractedData.date || data.created_at
                  }
                />
              </div>
              {((contract &&
                contract.serviceDate.end &&
                contract.tripCount > 1) ||
                (tripCollection.dateRange.end && tripCollection.count > 1)) && (
                <>
                  <div className={styles.dateFieldSeparator} />
                  <div className={styles.dateFieldRight}>
                    <div className={styles.label}> </div>
                    <DateDisplayComponent
                      date={
                        contract
                          ? contract.serviceDate.end!.toISOString()
                          : tripCollection.dateRange.end!.toISOString()
                      }
                    />
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
            <div className={styles.tripDetails}>
              <div className={styles.tripInfo}>
                <div className={styles.label}>No. Pasajeros:</div>
                <div className={styles.value}>
                  {tripCollection.totalPassengers}
                </div>
              </div>
              <div className={styles.tripInfo}>
                <div className={styles.label}>No. unidades:</div>
                <div className={styles.value}>
                  {contract
                    ? contract.vehicleCount
                    : tripCollection.vehicles.length}
                </div>
              </div>
              <div className={styles.tripInfo}>
                <div className={styles.label}>Coordinador:</div>
                <div className={styles.value}>
                  {contract ? contract.coordinatorName : "N/A"}
                </div>
              </div>
              <div className={styles.tripInfo}>
                <div className={styles.label}>Tipo de pago:</div>
                <div className={styles.value}>
                  {contract ? contract.paymentTypeName : "N/A"}
                </div>
              </div>
              <div className={styles.tripInfo}>
                <div className={styles.label}>Fecha del pago:</div>
                <div className={styles.value}></div>
              </div>
            </div>
          </div>
        )}
        {!tripCollection.isEmpty &&
          tripCollection.trips.map((trip, index) => (
            <div key={trip.tripId} className={styles.section}>
              <div className={styles.tripHeader}>
                <h4>Viaje {index + 1}</h4>
              </div>
              <div className={styles.tripDetails}>
                <div className={styles.tripInfo}>
                  <div className={styles.label}>Origen:</div>
                  <div className={styles.value}>
                    {trip.originName}, {trip.originAddress}
                  </div>
                </div>
                <div className={styles.tripInfo}>
                  <div className={styles.label}>Destino:</div>
                  <div className={styles.value}>
                    {trip.destinationName}, {trip.destinationAddress}
                  </div>
                </div>
              </div>
            </div>
          ))}

        {!tripCollection.isEmpty &&
          tripCollection.trips.map(
            (trip, index) =>
              trip.hasFlightInfo && (
                <div key={`flight-${index}`} className={styles.section}>
                  <p className={styles.label}>Es Vuelo:</p>
                  <br />
                  <strong className={styles.value}>
                    {trip.flightInfo}, {trip.flightOrigin},{" "}
                    {trip.flightNotes || "N/A"}
                  </strong>
                  {contract && contract.hasInternalObservations && (
                    <div style={{ marginTop: "16px" }}>
                      <div className={styles.label}>Observaciones</div>
                      <div className={styles.value}>
                        {contract.internalObservations}
                      </div>
                    </div>
                  )}
                  {contract && contract.hasObservations && (
                    <div style={{ marginTop: "12px" }}>
                      <div className={styles.label}>Observaciones</div>
                      <div className={styles.value}>
                        {contract.observations}
                      </div>
                    </div>
                  )}
                </div>
              )
          )}
      </div>
    </div>
  );
};

export default DetailsPanel;
