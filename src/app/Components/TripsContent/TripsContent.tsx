"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { contractsService, tripsService } from "@/services/api";
import LoadingComponent from "@/app/Components/LoadingComponent/LoadingComponent";
import ButtonComponent from "@/app/Components/ButtonComponent/ButtonComponent";
import { useUserRole } from "@/app/hooks/useUserRole";
import AssignDriverModal from "@/app/Components/AssignDriverModal/AssignDriverModal";
import DriverPaymentModal from "@/app/Components/DriverPaymentModal/DriverPaymentModal";
import DetailsPanel from "@/app/Components/DetailsPanel/DetailsPanel";
import {
  ArrowLeftRegular,
  Edit24Regular,
  EyeFilled,
  PersonSettingsRegular,
  MoneyHandRegular,
  MoreVerticalFilled,
} from "@fluentui/react-icons";
import styles from "./TripsContent.module.css";

// Status mapping
const STATUS_MAP: Record<number, string> = {
  1: "Agendado",
  2: "Por asignar",
  3: "Próximo",
  4: "En curso",
  5: "Por pagar",
  6: "Finalizado",
  7: "Cancelado",
};

const STATUS_COLORS: Record<string, string> = {
  Agendado: "#0078D4",
  "Por asignar": "#F7630C",
  Próximo: "#8764B8",
  "En curso": "#FFC83D",
  "Por pagar": "#D13438",
  Finalizado: "#107C10",
  Cancelado: "#605E5C",
};

interface TripsContentProps {
  contractId: string;
}

export default function TripsContent({ contractId }: TripsContentProps) {
  const router = useRouter();
  const { canAssignResources, isChofer } = useUserRole();

  const [contractData, setContractData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTrip, setExpandedTrip] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Modal states
  const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = useState(false);
  const [isDriverPaymentModalOpen, setIsDriverPaymentModalOpen] =
    useState(false);
  const [showDetailsPanelForTrip, setShowDetailsPanelForTrip] = useState<
    number | null
  >(null);
  const [selectedTripData, setSelectedTripData] = useState<any>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(`.${styles.dropdownMenu}`) &&
        !target.closest(`.${styles.moreActionsButton}`)
      ) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown !== null) {
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);
      return () => {
        document.removeEventListener("click", handleClickOutside);
      };
    }
  }, [openDropdown]);

  useEffect(() => {
    const fetchContractData = async () => {
      if (!contractId) return;

      try {
        setLoading(true);
        const data = await contractsService.getContractDetails(
          Number(contractId)
        );
        setContractData(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching contract data:", err);
        setError(
          err instanceof Error ? err.message : "Error al cargar los datos"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchContractData();
  }, [contractId]);

  const handleEditTrip = (tripId: number) => {
    router.push(`/dashboard/order/${contractId}?tripId=${tripId}`);
  };

  const handleAssignDriver = (trip: any) => {
    setSelectedTripData(trip);
    setIsAssignDriverModalOpen(true);
  };

  const handlePayDriver = (trip: any) => {
    const tripId = trip.trip_id || trip.contract_trip_id;
    setSelectedTripId(tripId ? String(tripId) : null);
    setIsDriverPaymentModalOpen(true);
  };

  const handleDriverAssignment = async (assignmentData: any) => {
    console.log("Driver assigned:", assignmentData);
    // Refresh contract data
    try {
      const data = await contractsService.getContractDetails(
        Number(contractId)
      );
      setContractData(data);
    } catch (err) {
      console.error("Error refreshing contract:", err);
    }
    setIsAssignDriverModalOpen(false);
    setSelectedTripData(null);
  };

  const toggleTripDetails = (tripId: number) => {
    setShowDetailsPanelForTrip(
      showDetailsPanelForTrip === tripId ? null : tripId
    );
  };

  const handleDropdownClick = (e: React.MouseEvent, tripIndex: number) => {
    e.stopPropagation();
    if (openDropdown === tripIndex) {
      setOpenDropdown(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const dropdownWidth = 200;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = rect.right - dropdownWidth;
      let top = rect.bottom + 4;

      if (left < 10) {
        left = rect.left;
      }
      if (left + dropdownWidth > viewportWidth - 10) {
        left = viewportWidth - dropdownWidth - 10;
      }

      const dropdownHeight = 150;
      if (top + dropdownHeight > viewportHeight - 10) {
        top = rect.top - dropdownHeight - 4;
      }

      setDropdownPosition({ top, left });
      setOpenDropdown(tripIndex);
    }
  };

  if (loading) {
    return <LoadingComponent message="Cargando viajes..." />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Error: {error}</p>
        <ButtonComponent
          text="Volver"
          icon={<ArrowLeftRegular />}
          onClick={() => router.back()}
        />
      </div>
    );
  }

  const trips = contractData?.trips || [];
  const contractStatus =
    STATUS_MAP[contractData?.contract_status_id] ||
    contractData?.contract_status_name ||
    "";

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <ButtonComponent
          text="Volver"
          icon={<ArrowLeftRegular />}
          onClick={() => router.back()}
          className={styles.backButton}
        />
        <h1 className={styles.title}>Orden #{contractId}</h1>
      </div>

      {/* Contract Summary */}
      <div className={styles.contractSummary}>
        <div className={styles.summaryRow}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Cliente:</span>
            <span className={styles.summaryValue}>
              {contractData?.client_name}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Estatus:</span>
            <span
              className={styles.statusPill}
              style={{
                backgroundColor: `${STATUS_COLORS[contractStatus]}20`,
                color: STATUS_COLORS[contractStatus],
              }}
            >
              {contractStatus}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Estado de Pago:</span>
            <span
              className={styles.statusPill}
              style={{
                backgroundColor: contractData?.payment_status === 'paid' ? '#107C1020' : '#D1343820',
                color: contractData?.payment_status === 'paid' ? '#107C10' : '#D13438',
              }}
            >
              {contractData?.payment_status === 'paid' ? 'Pagado' : 'Pendiente de pago'}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Monto:</span>
            <span className={styles.summaryValue}>
              ${contractData?.amount?.toLocaleString()}
            </span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Total de Viajes:</span>
            <span className={styles.summaryValue}>{trips.length}</span>
          </div>
        </div>
      </div>

      {/* Trips List */}
      <div className={styles.tripsContainer}>
        {trips.length === 0 ? (
          <div className={styles.emptyMessage}>
            No hay viajes registrados para este contrato
          </div>
        ) : (
          trips.map((trip: any, index: number) => {
            const tripId = trip.trip_id || trip.contract_trip_id;
            const isExpanded = expandedTrip === tripId;
            const tripStatus =
              STATUS_MAP[trip.contract_trip_status_id] ||
              trip.status?.name ||
              "";

            return (
              <div key={tripId} className={styles.tripCard}>
                <div className={styles.tripHeader}>
                  <div className={styles.tripInfo}>
                    <h3 className={styles.tripTitle}>Viaje #{index + 1}</h3>
                    <div className={styles.tripMeta}>
                      <span className={styles.tripDate}>
                        {trip.service_date
                          ? new Date(trip.service_date).toLocaleDateString(
                              "es-MX",
                              {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              }
                            )
                          : "Fecha no disponible"}
                      </span>
                      {trip.unit_type && (
                        <span className={styles.vehicleType}>
                          🚐 {trip.unit_type}
                        </span>
                      )}
                      {tripStatus && (
                        <span
                          className={styles.statusPill}
                          style={{
                            backgroundColor: `${STATUS_COLORS[tripStatus]}20`,
                            color: STATUS_COLORS[tripStatus],
                          }}
                        >
                          {tripStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.tripActions}>
                    <ButtonComponent
                      text=""
                      icon={<EyeFilled />}
                      onClick={() => toggleTripDetails(tripId)}
                      className={styles.actionButton}
                    />
                    <div className={styles.dropdownContainer}>
                      <ButtonComponent
                        icon={<MoreVerticalFilled />}
                        text=""
                        onClick={(e) => e && handleDropdownClick(e, index)}
                        className={styles.moreActionsButton}
                      />
                      {openDropdown === index && (
                        <div
                          className={styles.dropdownMenu}
                          style={{
                            position: "fixed",
                            top: dropdownPosition.top,
                            left: dropdownPosition.left,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ButtonComponent
                            text="Editar Orden"
                            icon={<Edit24Regular />}
                            onClick={(e) => {
                              e?.stopPropagation();
                              handleEditTrip(tripId);
                              setOpenDropdown(null);
                            }}
                            className={styles.dropdownItem}
                          />
                          {canAssignResources && (
                            <ButtonComponent
                              text="Asignar Chofer"
                              icon={<PersonSettingsRegular />}
                              onClick={(e) => {
                                e?.stopPropagation();
                                handleAssignDriver(trip);
                                setOpenDropdown(null);
                              }}
                              className={styles.dropdownItem}
                            />
                          )}
                          {isChofer && (
                            <ButtonComponent
                              text="Pagar a Chofer"
                              icon={<MoneyHandRegular />}
                              onClick={(e) => {
                                e?.stopPropagation();
                                handlePayDriver(trip);
                                setOpenDropdown(null);
                              }}
                              className={styles.dropdownItem}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {showDetailsPanelForTrip === tripId && (
                  <div className={styles.detailsPanelContainer}>
                    <DetailsPanel
                      data={contractData}
                      onClose={() => setShowDetailsPanelForTrip(null)}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <AssignDriverModal
        isOpen={isAssignDriverModalOpen}
        onClose={() => {
          setIsAssignDriverModalOpen(false);
          setSelectedTripData(null);
        }}
        tripData={selectedTripData}
        onAssign={handleDriverAssignment}
      />

      <DriverPaymentModal
        isOpen={isDriverPaymentModalOpen}
        onClose={() => {
          setIsDriverPaymentModalOpen(false);
          setSelectedTripId(null);
        }}
        tripId={selectedTripId}
      />
    </div>
  );
}
