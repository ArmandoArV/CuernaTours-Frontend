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
} from "@fluentui/react-components";

import {
  MoreVerticalRegular,
  PersonAddRegular,
  EditRegular,
  MoneyRegular,
  EyeFilled,
} from "@fluentui/react-icons";

import { Pagination } from "@/app/PaginationComponent/PaginationComponent";
import DetailsPanel from "@/app/Components/DetailsPanel/DetailsPanel";
import AssignDriverModal from "@/app/Components/AssignDriverModal/AssignDriverModal";
import DriverPaymentModal from "@/app/Components/DriverPaymentModal/DriverPaymentModal";
import { useUserRole } from "@/app/hooks/useUserRole";
import { contractsService } from "@/services/api/contracts.service";

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
  const { isChofer, isAdmin, isMaestro } = useUserRole();
  const canManage = isAdmin || isMaestro;

  const [internalCurrentPage, setInternalCurrentPage] = useState(
    currentPage || 1,
  );

  const [selectedRow, setSelectedRow] = useState<any | null>(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignRow, setAssignRow] = useState<any | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTripId, setPaymentTripId] = useState<number | null>(null);

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

  const getStatusColor = (statusValue: string): string => {
    if (!statusValue) return "#C7C7C7";

    const key = statusValue
      .toString()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

    switch (key) {
      case "agendado":
        return "#19A5EB";
      case "por asignar":
        return "#F6573E";
      case "proximo":
        return "#EFCF5B";
      case "en curso":
        return "#4D5DBC";
      case "por pagar":
        return "#E53E7C";
      case "finalizado":
        return "#80C26C";
      default:
        return "#C7C7C7";
    }
  };

  const getBadgeColor = (status: string) => {
    if (!status) return "informative";

    switch (status.toLowerCase()) {
      case "agendado":
        return "brand";
      case "finalizado":
        return "success";
      case "por pagar":
        return "warning";
      case "cancelado":
        return "danger";
      default:
        return "informative";
    }
  };

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
      console.error("Error fetching contract details:", err);
      setSelectedRow(row);
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

                      if (canManage && id) {
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
                                  "--indicator-color": getStatusColor(status),
                                } as React.CSSProperties)
                              : undefined
                          }
                        >
                          {isStatusColumn ? (
                            <Badge
                              appearance="filled"
                              color={getBadgeColor(value)}
                            >
                              {value}
                            </Badge>
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

                              if (canManage && id) {
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
                                    setAssignRow(row);
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
    </div>
  );
};

export default TableComponent;
