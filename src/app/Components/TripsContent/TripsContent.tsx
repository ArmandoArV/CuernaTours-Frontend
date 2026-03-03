"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { contractsService, tripsService } from "@/services/api";
import { useAsyncData } from "@/app/hooks/useAsyncData";
import LoadingComponent from "@/app/Components/LoadingComponent/LoadingComponent";
import ButtonComponent from "@/app/Components/ButtonComponent/ButtonComponent";
import { useUserRole } from "@/app/hooks/useUserRole";
import AssignDriverModal from "@/app/Components/AssignDriverModal/AssignDriverModal";
import DriverPaymentModal from "@/app/Components/DriverPaymentModal/DriverPaymentModal";
import ContractDetailsPanel from "@/app/Components/ContractDetailsPanel/ContractDetailsPanel";
import {
  ArrowLeftRegular,
  Edit24Regular,
  EyeFilled,
  PersonSettingsRegular,
  MoneyHandRegular,
  MoreVerticalFilled,
} from "@fluentui/react-icons";
import styles from "./TripsContent.module.css";
import { Contract } from "@/app/Types/ContractTypes";
import { Logger } from "@/app/Utils/Logger";
import { CONTRACT_STATUS_MAP, getStatusColor } from "@/app/Utils/statusUtils";

const log = Logger.getLogger("TripsContent");

const STATUS_COLORS: Record<string, string> = {
  Pendiente: getStatusColor("Pendiente"),
  Agendado: getStatusColor("Agendado"),
  "Por asignar": getStatusColor("Por asignar"),
  Próximo: getStatusColor("Próximo"),
  "En curso": getStatusColor("En curso"),
  Finalizado: getStatusColor("Finalizado"),
  Cancelado: getStatusColor("Cancelado"),
};

interface TripsContentProps {
  contractId: string;
}

export default function TripsContent({ contractId }: TripsContentProps) {
  const router = useRouter();
  const { canAssignResources, isChofer } = useUserRole();

  const { data: contractData, loading, error, setData: setContractData } = useAsyncData(
    () => contractsService.getContractDetails(Number(contractId)),
    null as any,
    [contractId],
  );
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
    log.debug("Driver assigned:", assignmentData);
    // Refresh contract data
    try {
      const data = await contractsService.getContractDetails(
        Number(contractId),
      );
      setContractData(data);
    } catch (err) {
      log.error("Error refreshing contract:", err);
    }
    setIsAssignDriverModalOpen(false);
    setSelectedTripData(null);
  };

  const toggleTripDetails = (tripId: number) => {
    setShowDetailsPanelForTrip(
      showDetailsPanelForTrip === tripId ? null : tripId,
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
    CONTRACT_STATUS_MAP[contractData?.contract_status_id] ||
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
      <ContractDetailsPanel contract={new Contract(contractData)} />
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
