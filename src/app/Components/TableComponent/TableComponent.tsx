"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import styles from "./TableComponent.module.css";

import {
  Button,
  Tooltip,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  MenuDivider,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
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
  PlayFilled,
  CheckmarkCircleFilled,
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
  showConfirmAlert,
} from "@/app/Utils/AlertUtil";
import { Logger } from "@/app/Utils/Logger";
import { getStatusColor, getStatusTextColor } from "@/app/Utils/statusUtils";
import ChangeStatusModal from "@/app/Components/ChangeStatusModal/ChangeStatusModal";

const log = Logger.getLogger("TableComponent");

export type TableComponentProps = {
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
  groupBy?: (row: any) => string;
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
  groupBy,
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

  const [isClientPaymentModalOpen, setIsClientPaymentModalOpen] =
    useState(false);
  const [clientPaymentContractId, setClientPaymentContractId] = useState<
    number | null
  >(null);

  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    contractId: number | null;
    currentStatus?: string;
  }>({ open: false, contractId: null });



  const activePage =
    currentPage !== undefined ? currentPage : internalCurrentPage;
  const sortedData = useMemo(() => [...data], [data]);

  const { paginatedData, totalPages } = useMemo(() => {
    if (!enablePagination) return { paginatedData: sortedData, totalPages: 1 };
    const startIndex = (activePage - 1) * itemsPerPage;
    return {
      paginatedData: sortedData.slice(startIndex, startIndex + itemsPerPage),
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
      "No, mantener",
    );
    if (reason) {
      try {
        await contractsService.cancelContract(id, reason);
        showSuccessAlert(
          "Servicio cancelado",
          "El contrato ha sido cancelado exitosamente.",
          () => {
            window.location.reload();
          },
        );
      } catch (error) {
        log.error("Error cancelling contract:", error);
        showErrorAlert(
          "Error",
          "No se pudo cancelar el contrato. Inténtalo de nuevo.",
        );
      }
    }
  };

  const handleChangeStatus = (id: number, currentStatus?: string) => {
    setStatusModal({ open: true, contractId: id, currentStatus });
  };

  const handleStatusConfirm = async (value: string) => {
    if (!statusModal.contractId) return;
    setStatusModal((prev) => ({ ...prev, open: false }));
    try {
      await contractsService.updateStatus(
        statusModal.contractId,
        parseInt(value, 10),
      );
      showSuccessAlert(
        "Estatus actualizado",
        "El estatus del contrato ha sido actualizado exitosamente.",
        () => {
          window.location.reload();
        },
      );
    } catch (error) {
      log.error("Error updating contract status:", error);
      showErrorAlert(
        "Error",
        "No se pudo actualizar el estatus. Inténtalo de nuevo.",
      );
    }
  };

  const handleDriverStatusChange = (row: any, statusId: number) => {
    const contractId = getRowId(row);
    if (!contractId) return;
    const label = statusId === 4 ? "En curso" : "Finalizado";
    showConfirmAlert(
      "Cambiar estatus",
      `¿Cambiar el estatus del servicio a "${label}"?`,
      "Sí, cambiar",
      async () => {
        try {
          await contractsService.updateStatus(Number(contractId), statusId);
          showSuccessAlert("Estatus actualizado", `El servicio ahora está "${label}"`, () => {
            window.location.reload();
          });
        } catch (error) {
          log.error("Error updating status:", error);
          showErrorAlert("Error", "No se pudo actualizar el estatus. Inténtalo de nuevo.");
        }
      },
    );
  };

  /* ─────────────────────────────────────────────────────────────────── */

  return (
    <div className={styles.tableContainer}>
      {title && <div className={styles.title}>{title}</div>}
      {description && <div className={styles.description}>{description}</div>}

      <Table className={styles.table} noNativeElements={false}>
        {/* ── Header ── */}
        <TableHeader className={styles.tableHeader}>
          <TableRow className={styles.headerRow}>
            {columns.map((col, index) => (
              <TableHeaderCell
                key={col}
                className={`${styles.headerCell} ${index === 0 ? styles.headerCellFirst : ""} ${index === columns.length - 1 && !showActions ? styles.headerCellLast : ""}`}
              >
                {col}
              </TableHeaderCell>
            ))}
            {showActions && (
              <TableHeaderCell
                className={`${styles.headerCell} ${styles.headerCellLast} ${styles.actionsHeaderCell}`}
              />
            )}
          </TableRow>
        </TableHeader>

        {/* ── Body ── */}
        <TableBody>
          {paginatedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (showActions ? 1 : 0)}
                className={styles.emptyMessage}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            paginatedData.map((row, paginatedIndex) => {
              const globalRowIndex = enablePagination
                ? (activePage - 1) * itemsPerPage + paginatedIndex
                : paginatedIndex;

              const isSelected = selectedRowIndex === globalRowIndex;
              const status = getStatusFromRow(row);
              const id = getRowId(row);

              // Group header: render when groupBy is set and this is the first row of a new group
              const groupLabel = groupBy ? groupBy(row) : null;
              const prevRow =
                paginatedIndex > 0 ? paginatedData[paginatedIndex - 1] : null;
              const prevGroupLabel =
                prevRow && groupBy ? groupBy(prevRow) : null;
              const showGroupHeader =
                groupBy && groupLabel && groupLabel !== prevGroupLabel;

              return (
                <React.Fragment key={globalRowIndex}>
                  {showGroupHeader && (
                    <TableRow className={styles.groupHeaderRow}>
                      <TableCell
                        colSpan={columns.length + (showActions ? 1 : 0)}
                        className={styles.groupHeaderCell}
                      >
                        {groupLabel}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow
                    className={`${styles.tableRow} ${isSelected ? styles.selectedRow : ""}`}
                    style={
                      {
                        "--indicator-color": getStatusTextColor(status),
                        "--row-index": paginatedIndex,
                      } as React.CSSProperties
                    }
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
                        <TableCell
                          key={col}
                          className={
                            colIndex === 0 ? styles.firstCell : styles.cell
                          }
                        >
                          {isStatusColumn ? (
                            <span
                              className={
                                value === "En curso"
                                  ? "status-pulse"
                                  : ""
                              }
                              style={{
                                backgroundColor: getStatusColor(value),
                                color: getStatusTextColor(value),
                                padding: "4px 8px",
                                borderRadius: "4px",
                                display: "inline-block",
                                fontSize: "12px",
                                fontWeight: "600",
                                textAlign: "center",
                                minWidth: "80px",
                              }}
                            >
                              {value}
                            </span>
                          ) : (
                            (value || "---")
                          )}
                        </TableCell>
                      );
                    })}

                    {showActions && (
                      <TableCell className={styles.actionsContainer}>
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
                              if (canViewDetails && id)
                                router.push(`/dashboard/trips/${id}`);
                            }}
                          />
                        </Tooltip>

                        {isChofer && (() => {
                          const st = getStatusFromRow(row)?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                          const canStart = st !== "en curso" && st !== "finalizado" && st !== "cancelado";
                          const canFinish = st === "en curso";
                          return (
                            <>
                              {canStart && (
                                <Tooltip content="Iniciar Viaje" relationship="label">
                                  <Button
                                    appearance="subtle"
                                    icon={<PlayFilled />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDriverStatusChange(row, 4);
                                    }}
                                    style={{ color: "#2563eb" }}
                                  />
                                </Tooltip>
                              )}
                              {canFinish && (
                                <Tooltip content="Finalizar Viaje" relationship="label">
                                  <Button
                                    appearance="subtle"
                                    icon={<CheckmarkCircleFilled />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDriverStatusChange(row, 6);
                                    }}
                                    style={{ color: "#059669" }}
                                  />
                                </Tooltip>
                              )}
                            </>
                          );
                        })()}

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
                                    if (
                                      row._trips &&
                                      Array.isArray(row._trips) &&
                                      row._trips.length > 0
                                    ) {
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
                                    if (id)
                                      handleChangeStatus(
                                        Number(id),
                                        getStatusFromRow(row),
                                      );
                                  }}
                                >
                                  Cambiar Estatus
                                </MenuItem>

                                <MenuDivider />

                                <MenuItem
                                  icon={<MoneyRegular />}
                                  disabled={!row["Chofer"] || row["Chofer"] === "---" || row["Chofer"] === "—" || row["Chofer"] === "Sin asignar"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const trips = row._trips || [];
                                    const tripId = trips.length > 0
                                      ? (trips[0].trip_id || trips[0].contract_trip_id)
                                      : null;
                                    if (tripId) {
                                      setPaymentTripId(Number(tripId));
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
                                      setClientPaymentContractId(
                                        Number(contractId),
                                      );
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
                                    if (id) handleCancelContract(Number(id));
                                  }}
                                  style={{
                                    color: tokens.colorPaletteRedForeground1,
                                  }}
                                >
                                  Cancelar Servicio
                                </MenuItem>
                              </MenuList>
                            </MenuPopover>
                          </Menu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>

                  {/* Inline details for Chofer only */}
                  {isChofer && isSelected && (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length + (showActions ? 1 : 0)}
                        className={styles.detailsRowCell}
                      >
                        <DetailsPanel data={selectedRow} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })
          )}
        </TableBody>
      </Table>

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

      <ChangeStatusModal
        open={statusModal.open}
        currentStatus={statusModal.currentStatus}
        onClose={() => setStatusModal({ open: false, contractId: null })}
        onConfirm={handleStatusConfirm}
      />

    </div>
  );
};

export default TableComponent;
