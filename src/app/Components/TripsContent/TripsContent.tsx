"use client";
import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { contractsService } from "@/services/api";
import { useAsyncData } from "@/app/hooks/useAsyncData";
import LoadingComponent from "@/app/Components/LoadingComponent/LoadingComponent";
import ButtonComponent from "@/app/Components/ButtonComponent/ButtonComponent";
import { useUserRole } from "@/app/hooks/useUserRole";
import AssignDriverModal from "@/app/Components/AssignDriverModal/AssignDriverModal";
import DriverPaymentModal from "@/app/Components/DriverPaymentModal/DriverPaymentModal";
import ChangeStatusModal from "@/app/Components/ChangeStatusModal/ChangeStatusModal";
import ClientPaymentModal from "@/app/Components/ClientPaymentModal/ClientPaymentModal";
import ContractDetailsPanel from "@/app/Components/ContractDetailsPanel/ContractDetailsPanel";
import {
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  MoreVertical24Filled,
  PersonAdd24Regular,
  Edit24Regular,
  ArrowSync24Regular,
  Money24Regular,
  Wallet24Regular,
  Dismiss24Regular,
} from "@fluentui/react-icons";
import styles from "./TripsContent.module.css";
import { Contract } from "@/app/Types/ContractTypes";
import { Logger } from "@/app/Utils/Logger";
import { CONTRACT_STATUS_MAP } from "@/app/Utils/statusUtils";
import {
  showSuccessAlert,
  showErrorAlert,
  showInputAlert,
} from "@/app/Utils/AlertUtil";

const log = Logger.getLogger("TripsContent");

interface TripsContentProps {
  contractId: string;
}

export default function TripsContent({ contractId }: TripsContentProps) {
  const router = useRouter();
  const { canAssignResources, isChofer } = useUserRole();

  const {
    data: contractData,
    loading,
    error,
    setData: setContractData,
  } = useAsyncData(
    () => contractsService.getContractDetails(Number(contractId)),
    null as any,
    [contractId],
  );
  const [expandedTrip, setExpandedTrip] = useState<number | null>(null);

  // Modal states
  const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] = useState(false);
  const [isDriverPaymentModalOpen, setIsDriverPaymentModalOpen] =
    useState(false);
  const [isClientPaymentModalOpen, setIsClientPaymentModalOpen] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    currentStatus?: string;
  }>({ open: false });
  const [selectedTripData, setSelectedTripData] = useState<any>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const refreshContractData = useCallback(async () => {
    try {
      const data = await contractsService.getContractDetails(Number(contractId));
      setContractData(data);
    } catch (err) {
      log.error("Error refreshing contract:", err);
    }
  }, [contractId, setContractData]);

  const handleEditOrder = () => {
    router.push(`/dashboard/order/${contractId}`);
  };

  const handleAssignDriver = () => {
    const trips = contractData?.trips;
    if (trips && trips.length > 0) {
      setSelectedTripData(trips[0]);
    }
    setIsAssignDriverModalOpen(true);
  };

  const handleDriverAssignment = async () => {
    log.debug("Assignment saved — refreshing contract data");
    await refreshContractData();
    setIsAssignDriverModalOpen(false);
    setSelectedTripData(null);
  };

  const handleChangeStatus = () => {
    const currentStatus =
      CONTRACT_STATUS_MAP[contractData?.contract_status_id] ||
      contractData?.contract_status_name ||
      "";
    setStatusModal({ open: true, currentStatus });
  };

  const handleStatusConfirm = async (value: string) => {
    setStatusModal({ open: false });
    try {
      await contractsService.updateStatus(Number(contractId), parseInt(value, 10));
      showSuccessAlert("Estatus actualizado", "El estatus del contrato ha sido actualizado exitosamente.", () => {
        refreshContractData();
      });
    } catch (error) {
      log.error("Error updating contract status:", error);
      showErrorAlert("Error", "No se pudo actualizar el estatus. Inténtalo de nuevo.");
    }
  };

  const handlePayDriver = () => {
    const trips = contractData?.trips;
    const tripId = trips?.[0]?.trip_id || trips?.[0]?.contract_trip_id;
    setSelectedTripId(tripId ? String(tripId) : null);
    setIsDriverPaymentModalOpen(true);
  };

  const handleRegisterPayment = () => {
    setIsClientPaymentModalOpen(true);
  };

  const handleCancelContract = async () => {
    const reason = await showInputAlert(
      "¿Estás seguro de cancelar este contrato?",
      "Esta acción no se puede deshacer. Por favor ingresa el motivo de la cancelación:",
      "Motivo de cancelación",
      "Escribe el motivo aquí...",
      "Sí, cancelar contrato",
      "No, mantener",
    );
    if (reason) {
      try {
        await contractsService.cancelContract(Number(contractId), reason);
        showSuccessAlert("Servicio cancelado", "El contrato ha sido cancelado exitosamente.", () => {
          router.back();
        });
      } catch (error) {
        log.error("Error cancelling contract:", error);
        showErrorAlert("Error", "No se pudo cancelar el contrato. Inténtalo de nuevo.");
      }
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
          text=""
          icon={<ArrowLeftRegular />}
          onClick={() => router.back()}
          className={styles.backButton}
        />
        <h1 className={styles.title}>Detalles del servicio</h1>

        {canAssignResources && (
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance="subtle"
                icon={<MoreVertical24Filled />}
                aria-label="Acciones"
                className={styles.actionsMenuButton}
              />
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem icon={<PersonAdd24Regular />} onClick={handleAssignDriver}>
                  Asignar Chofer
                </MenuItem>
                <MenuItem icon={<Edit24Regular />} onClick={handleEditOrder}>
                  Editar Orden
                </MenuItem>
                <MenuItem icon={<ArrowSync24Regular />} onClick={handleChangeStatus}>
                  Cambiar Estatus
                </MenuItem>
                <MenuDivider />
                <MenuItem icon={<Money24Regular />} onClick={handlePayDriver}>
                  Pagar Chofer
                </MenuItem>
                <MenuItem icon={<Wallet24Regular />} onClick={handleRegisterPayment}>
                  Registrar Pago
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  icon={<Dismiss24Regular />}
                  onClick={handleCancelContract}
                  style={{ color: tokens.colorPaletteRedForeground1 }}
                >
                  Cancelar Servicio
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        )}
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

      <ChangeStatusModal
        open={statusModal.open}
        currentStatus={statusModal.currentStatus}
        onClose={() => setStatusModal({ open: false })}
        onConfirm={handleStatusConfirm}
      />

      <ClientPaymentModal
        isOpen={isClientPaymentModalOpen}
        onClose={() => setIsClientPaymentModalOpen(false)}
        contractId={Number(contractId)}
        onPaymentRegistered={refreshContractData}
      />
    </div>
  );
}
