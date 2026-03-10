"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./TableComponent.module.css";

import {
  Button,
  Tooltip,
  Badge,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
  tokens,
} from "@fluentui/react-components";

import {
  MoreVerticalRegular,
  PersonAddRegular,
  EditRegular,
  MoneyRegular,
  EyeFilled,
  DismissRegular,
  WalletRegular,
  ArrowSyncRegular,
} from "@fluentui/react-icons";

import { Pagination } from "@/app/PaginationComponent/PaginationComponent";
import DetailsPanel from "@/app/Components/DetailsPanel/DetailsPanel";
import AssignDriverModal from "@/app/Components/AssignDriverModal/AssignDriverModal";
import DriverPaymentModal from "@/app/Components/DriverPaymentModal/DriverPaymentModal";
import ClientPaymentModal from "@/app/Components/ClientPaymentModal/ClientPaymentModal";
import { useUserRole } from "@/app/hooks/useUserRole";
import { contractsService } from "@/services/api/contracts.service";
import { 
  showInputAlert, 
  showSuccessAlert, 
  showErrorAlert,
  showSelectAlert,
} from "@/app/Utils/AlertUtil";
import { Logger } from "@/app/Utils/Logger";
import { getStatusColor, getStatusTextColor } from "@/app/Utils/statusUtils";

const log = Logger.getLogger("TableComponent");

export type TableComponentProps= {
  data: Array<{ [key: string]: any }>;
  columns: string[];
  showActions?: boolean;
  enablePagination?: boolean;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (rowData: any) => void;
  title?: string;
  description?: string;
  emptyMessage?: string;
};

const TableComponent: React.FC<TableComponentProps> = ({
  data,
  columns,
  showActions = false,
  enablePagination = false,
  itemsPerPage = 10,
  currentPage,
  onPageChange,
  onRowClick,
  title,
  description,
  emptyMessage = "No se encontraron datos",
}) => {
  const router = useRouter();
  const { isChofer, isAdmin, isMaestro, isOficina } = useUserRole();
  const canManage = isAdmin || isMaestro;
  const canViewDetails = canManage || isOficina;

  const [internalCurrentPage, setInternalCurrentPage] = useState(
    currentPage || 1,
  );

  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignRow, setAssignRow] = useState<any | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTripId, setPaymentTripId] = useState<number | null>(null);

  const [isClientPaymentModalOpen, setIsClientPaymentModalOpen] = useState(false);
  const [clientPaymentContractId, setClientPaymentContractId] = useState<number | null>(null);

  const activePage =
    currentPage !== undefined ? currentPage : internalCurrentPage;

  const sortedData = useMemo(() => [...data], [data]);

  const { paginatedData, totalPages } = useMemo(() => {
    if (!enablePagination) {
      return { paginatedData: sortedData, totalPages: 1 };
    }

    const startIndex = (activePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      paginatedData: sortedData.slice(startIndex, endIndex),
      totalPages: Math.ceil(sortedData.length / itemsPerPage),
    };
  }, [sortedData, activePage, itemsPerPage, enablePagination]);

  const handlePageChange = (page: number) => {
    if (onPageChange) onPageChange(page);
    else setInternalCurrentPage(page);

    setSelectedRow(null);
    setSelectedRowIndex(null);
  };

  const getRowId = (row: any) => row?.contract_id || row?.id || row?.ID || null;

  const getStatusFromRow = (row: any) =>
    row.Estatus || row.status || row.estatus || "";

  const handleRowToggle = async (row: any, rowIndex: number) => {
    if (selectedRowIndex === rowIndex) {
      setSelectedRow(null);
      setSelectedRowIndex(null);
      return;
    }

    setSelectedRowIndex(rowIndex);

    const id = getRowId(row);

    if (!id) {
      setSelectedRow(row);
      return;
    }

    try {
      const contractData = await contractsService.getContractDetails(
        Number(id),
      );
      setSelectedRow(contractData);
    } catch (err) {
      log.error("Error fetching contract details:", err);
      setSelectedRow(row);
    }
  };

  const handleCancelContract = async (id: number) => {
    const reason = await showInputAlert(
      "¿Estás seguro de cancelar este contrato?",
      "Esta acción no se puede deshacer. Por favor ingresa el motivo de la cancelación:",
      "Motivo de cancelación",
      "Escribe el motivo aquí...",
      "Sí, cancelar contrato",
      "No, mantener"
    );

    if (reason) {
      try {
        await contractsService.cancelContract(id, reason);
        showSuccessAlert(
          "Contrato cancelado", 
          "El contrato ha sido cancelado exitosamente.", 
          () => {
             window.location.reload(); 
          }
        );
      } catch (error) {
        log.error("Error cancelling contract:", error);
        showErrorAlert("Error", "No se pudo cancelar el contrato. Inténtalo de nuevo.");
      }
    }
  };

  const handleChangeStatus = async (id: number) => {
    const statusOptions = [
      { value: "2", label: "Por asignar" },
      { value: "3", label: "Próximo" },
      { value: "4", label: "En curso" },
      { value: "5", label: "Por pagar" },
      { value: "6", label: "Finalizado" },
    ];

    const selected = await showSelectAlert(
      "Cambiar estatus del contrato",
      "Selecciona el nuevo estatus:",
      statusOptions,
      "Cambiar",
      "Cancelar",
    );

    if (selected) {
      try {
        await contractsService.updateStatus(id, parseInt(selected, 10));
        showSuccessAlert(
          "Estatus actualizado",
          "El estatus del contrato ha sido actualizado exitosamente.",
          () => { window.location.reload(); },
        );
      } catch (error) {
        log.error("Error updating contract status:", error);
        showErrorAlert("Error", "No se pudo actualizar el estatus. Inténtalo de nuevo.");
      }
    }
  };

  return (
    <div className={styles.tableContainer}>
      {title && <div className={styles.title}>{title}</div>}
      {description && <div className={styles.description}>{description}</div>}
      <table className={styles.table}>
        <thead className={styles.tableHeader}>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
            {showActions && <th />}
          </tr>
        </thead>

        <tbody>
          {paginatedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (showActions ? 1 : 0)}
                className={styles.emptyMessage}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            paginatedData.map((row, paginatedIndex) => {
              const globalRowIndex = enablePagination
                ? (activePage - 1) * itemsPerPage + paginatedIndex
                : paginatedIndex;

              const isSelected = selectedRowIndex === globalRowIndex;
              const status = getStatusFromRow(row);
              const id = getRowId(row);

              return (
                <React.Fragment key={globalRowIndex}>
                  <tr
                    className={`${styles.rowWithColorIndicator} ${
                      isSelected ? styles.selectedRow : ""
                    }`}
                    onClick={() => {
                      if (isChofer) {
                        handleRowToggle(row, globalRowIndex);
                        return;
                      }

                      if (canViewDetails && id) {
                        router.push(`/dashboard/trips/${id}`);
                        return;
                      }

                      if (onRowClick) onRowClick(row);
                    }}
                  >
                    {columns.map((col, colIndex) => {
                      const value = row[col];
                      const isStatusColumn =
                        col.toLowerCase() === "estatus" ||
                        col.toLowerCase() === "status";

                      return (
                        <td
                          key={col}
                          style={
                            colIndex === 0
                              ? ({
                                  "--indicator-color": getStatusTextColor(status),
                                } as React.CSSProperties)
                              : undefined
                          }
                        >
                          {isStatusColumn ? (
                            <span
                              style={{
                                backgroundColor: getStatusColor(value),
                                color: getStatusTextColor(value),
                                padding: "4px 8px",
                                borderRadius: "4px",
                                display: "inline-block",
                                fontSize: "12px",
                                fontWeight: "600",
                                textAlign: "center",
                                minWidth: "80px"
                              }}
                            >
                              {value}
                            </span>
                          ) : (
                            value
                          )}
                        </td>
                      );
                    })}

                    {showActions && (
                      <td className={styles.actionsContainer}>
                        {/* Ver Detalles for ALL roles */}
                        <Tooltip content="Ver Detalles" relationship="label">
                          <Button
                            appearance="subtle"
                            icon={<EyeFilled />}
                            onClick={(e) => {
                              e.stopPropagation();

                              if (isChofer) {
                                handleRowToggle(row, globalRowIndex);
                                return;
                              }

                              if (canViewDetails && id) {
                                router.push(`/dashboard/trips/${id}`);
                              }
                            }}
                          />
                        </Tooltip>

                        {/* 3-dot menu for Admin/Maestro */}
                        {canManage && (
                          <Menu>
                            <MenuTrigger disableButtonEnhancement>
                              <Button
                                appearance="subtle"
                                icon={<MoreVerticalRegular />}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </MenuTrigger>

                            <MenuPopover>
                              <MenuList>
                                <MenuItem
                                  icon={<PersonAddRegular />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (row._trips && Array.isArray(row._trips) && row._trips.length > 0) {
                                       setAssignRow(row._trips[0]);
                                    } else {
                                       setAssignRow(row);
                                    }
                                    setIsAssignModalOpen(true);
                                  }}
                                >
                                  Asignar Chofer
                                </MenuItem>

                                <MenuItem
                                  icon={<EditRegular />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (id)
                                      router.push(`/dashboard/order/${id}`);
                                  }}
                                >
                                  Editar Orden
                                </MenuItem>

                                <MenuItem
                                  icon={<ArrowSyncRegular />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (id) handleChangeStatus(Number(id));
                                  }}
                                >
                                  Cambiar Estatus
                                </MenuItem>

                                <MenuDivider />

                                <MenuItem
                                  icon={<MoneyRegular />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (id) {
                                      setPaymentTripId(Number(id));
                                      setIsPaymentModalOpen(true);
                                    }
                                  }}
                                >
                                  Pagar Chofer
                                </MenuItem>

                                <MenuItem
                                  icon={<WalletRegular />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const contractId = row.contract_id || id;
                                    if (contractId) {
                                      setClientPaymentContractId(Number(contractId));
                                      setIsClientPaymentModalOpen(true);
                                    }
                                  }}
                                >
                                  Registrar Pago
                                </MenuItem>

                                <MenuDivider />

                                <MenuItem
                                  icon={<DismissRegular />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (id) {
                                      handleCancelContract(Number(id));
                                    }
                                  }}
                                  style={{ color: tokens.colorPaletteRedForeground1 }}
                                >
                                  Cancelar Contrato
                                </MenuItem>
                              </MenuList>
                            </MenuPopover>
                          </Menu>
                        )}
                      </td>
                    )}
                  </tr>

                  {/* Inline details only for Chofer */}
                  {isChofer && isSelected && (
                    <tr>
                      <td
                        colSpan={columns.length + (showActions ? 1 : 0)}
                        className={styles.detailsRowCell}
                      >
                        <DetailsPanel data={selectedRow} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>

      {enablePagination && totalPages > 1 && (
        <div className={styles.paginationWrapper}>
          <Pagination
            currentPage={activePage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      <AssignDriverModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssignRow(null);
        }}
        tripData={assignRow}
        onAssign={() => setIsAssignModalOpen(false)}
      />

      <DriverPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentTripId(null);
        }}
        tripId={paymentTripId !== null ? String(paymentTripId) : null}
      />

      <ClientPaymentModal
        isOpen={isClientPaymentModalOpen}
        onClose={() => {
          setIsClientPaymentModalOpen(false);
          setClientPaymentContractId(null);
        }}
        contractId={clientPaymentContractId}
      />
    </div>
  );
};

export default TableComponent;
