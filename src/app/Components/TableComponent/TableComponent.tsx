"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "@/app/Utils/CookieUtil";
import styles from "./TableComponent.module.css";
import {
  EyeFilled,
  MoreVerticalFilled,
  Edit24Regular,
  AddFilled,
  Payment24Regular,
  MoneyHandRegular,
  PersonSettingsRegular,
} from "@fluentui/react-icons";
import { Pagination } from "@/app/PaginationComponent/PaginationComponent";
import DetailsPanel from "@/app/Components/DetailsPanel/DetailsPanel";
import AssignDriverModal from "@/app/Components/AssignDriverModal/AssignDriverModal";
import { ContractTrip } from "@/app/backend_models/trip.model";
import { TripCollection, TripData } from "@/app/Types/TripTypes";
import DriverPaymentModal from "@/app/Components/DriverPaymentModal/DriverPaymentModal";
import { useUserRole } from "@/app/hooks/useUserRole";
import { contractsService } from "@/services/api/contracts.service";
export type TableComponentProps = {
  data: Array<{ [key: string]: any }>;
  columns: string[];
  title?: string;
  description?: string;
  onRowClick?: (rowData: { [key: string]: any }) => void;
  className?: string;
  style?: React.CSSProperties;
  emptyMessage?: string;
  loading?: boolean;
  error?: string;
  showActions?: boolean;
  onViewDetails?: (rowData: { [key: string]: any }) => void;
  onEdit?: (rowData: { [key: string]: any }) => void;
  onEditOrder?: (rowData: { [key: string]: any }) => void;
  onAssignDriver?: (rowData: { [key: string]: any }) => void;
  onPayDriver?: (rowData: { [key: string]: any }) => void;
  // Pagination props
  enablePagination?: boolean;
  itemsPerPage?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  // Details fetching and rendering
  /** If provided, component will try to fetch contract details using this key on each row */
  detailsIdKey?: string;
  /** When true, the component will prefetch details for visible rows (paginatedData) */
  prefetchDetails?: boolean;
  /** If provided, only these fields (keys) will be shown in the details panel, in this order */
  detailsFields?: string[];
  /** Optional custom fetch function: (id) => Promise<any> */
  fetchDetails?: (id: any) => Promise<any>;
};

const TableComponent: React.FC<TableComponentProps> = ({
  data,
  columns,
  title,
  description,
  onRowClick,
  className,
  style,
  emptyMessage = "No data available",
  loading = false,
  error,
  showActions = false,
  onViewDetails,
  onEdit,
  onEditOrder,
  onAssignDriver,
  onPayDriver,
  // Pagination props
  enablePagination = false,
  itemsPerPage = 10,
  currentPage,
  onPageChange,
  // Details fetching and rendering
  detailsIdKey,
  prefetchDetails = false,
  detailsFields,
  fetchDetails,
}) => {
  const router = useRouter();
  const { isChofer, isOficina, roleId, roleName } = useUserRole();
  console.log(
    "🔑 User Role - roleId:",
    roleId,
    "roleName:",
    roleName,
    "isOficina:",
    isOficina,
    "isChofer:",
    isChofer
  );
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [internalCurrentPage, setInternalCurrentPage] = useState(
    currentPage || 1
  );
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  // Selected row to show details for (shown below the table)
  const [selectedRow, setSelectedRow] = useState<{ [key: string]: any } | null>(
    null
  );
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);
  const [selectedRowLoading, setSelectedRowLoading] = useState<boolean>(false);
  const [selectedRowError, setSelectedRowError] = useState<string | null>(null);
  // Cache of fetched details keyed by id
  const [detailsCache, setDetailsCache] = useState<Record<string, any>>({});
  const [detailsLoadingMap, setDetailsLoadingMap] = useState<
    Record<string, boolean>
  >({});
  const [detailsErrorMap, setDetailsErrorMap] = useState<
    Record<string, string>
  >({});

  // AssignDriverModal state
  const [isAssignDriverModalOpen, setIsAssignDriverModalOpen] =
    useState<boolean>(false);
  const [selectedRowForDriver, setSelectedRowForDriver] = useState<
    ContractTrip | TripCollection | TripData | null
  >(null);

  // DriverPaymentModal state
  const [isDriverPaymentModalOpen, setIsDriverPaymentModalOpen] =
    useState<boolean>(false);
  const [selectedTripIdForPayment, setSelectedTripIdForPayment] = useState<
    string | null
  >(null);

  // Helper to determine id of a row
  const getRowId = (row: { [key: string]: any }): any => {
    if (!row) return null;
    if (detailsIdKey && row[detailsIdKey] !== undefined)
      return row[detailsIdKey];
    const idKeys = ["contract_id", "contractId", "id", "ID", "contract_id"];
    for (const k of idKeys) {
      if (
        Object.prototype.hasOwnProperty.call(row, k) &&
        row[k] !== undefined &&
        row[k] !== null &&
        row[k] !== ""
      ) {
        return row[k];
      }
    }
    return null;
  };

  // Default fetch implementation used when fetchDetails prop not provided
  const defaultFetchDetails = async (id: any) => {
    const contractId = parseInt(String(id), 10);
    if (isNaN(contractId)) throw new Error("Invalid contract ID");
    return await contractsService.getContractDetails(contractId);
  };

  // Sync internal state with external currentPage prop
  useEffect(() => {
    if (currentPage !== undefined) {
      setInternalCurrentPage(currentPage);
    }
  }, [currentPage]);

  // Use external currentPage if provided, otherwise use internal state
  const activePage =
    currentPage !== undefined ? currentPage : internalCurrentPage;

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    console.log(
      "⚡ useEffect for dropdown running, openDropdown:",
      openDropdown
    );
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      console.log("👆 Click outside detected, target:", target);
      // Don't close if clicking inside a dropdown or dropdown button
      if (
        target.closest(`.${styles.dropdownMenu}`) ||
        target.closest(`.${styles.editButton}`)
      ) {
        console.log("✋ Click was on dropdown or button, ignoring");
        return;
      }
      console.log("❌ Closing dropdown from click outside");
      setOpenDropdown(null);
    };

    const handleScroll = () => {
      setOpenDropdown(null);
    };

    if (openDropdown !== null) {
      // Add listener on next tick to avoid immediate closure
      console.log("📡 Adding click listener with setTimeout");
      setTimeout(() => {
        console.log("📡 Click listener added to document");
        document.addEventListener("click", handleClickOutside);
      }, 0);
      window.addEventListener("scroll", handleScroll, true);
      return () => {
        document.removeEventListener("click", handleClickOutside);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }
  }, [openDropdown]);

  // Calculate pagination data
  const { paginatedData, totalPages } = useMemo(() => {
    if (!enablePagination) {
      return { paginatedData: data, totalPages: 1 };
    }

    const startIndex = (activePage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    const totalPages = Math.ceil(data.length / itemsPerPage);

    return { paginatedData, totalPages };
  }, [data, activePage, itemsPerPage, enablePagination]);

  // Prefetch details for visible rows when enabled
  useEffect(() => {
    if (!prefetchDetails) return;
    // For each row in current paginatedData, if it has an id and not cached, fetch it
    paginatedData.forEach((row) => {
      const id = getRowId(row);
      if (!id) return;
      const idKey = String(id);
      if (detailsCache[idKey] || detailsLoadingMap[idKey]) return;
      // mark loading
      setDetailsLoadingMap((m) => ({ ...m, [idKey]: true }));
      const fn = fetchDetails || defaultFetchDetails;
      fn(id)
        .then((data) => {
          setDetailsCache((c) => ({ ...c, [idKey]: data }));
        })
        .catch((err: any) => {
          setDetailsErrorMap((m) => ({
            ...m,
            [idKey]: err?.message || String(err),
          }));
        })
        .finally(() => {
          setDetailsLoadingMap((m) => ({ ...m, [idKey]: false }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginatedData, prefetchDetails]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    } else {
      setInternalCurrentPage(page);
    }
  };

  // Map status text to its corresponding color
  const getStatusColor = (statusValue: string): string => {
    if (!statusValue) return "#C7C7C7";
    const key = statusValue
      .toString()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove accents
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
        return "#C7C7C7"; // default gray
    }
  };

  const getStatusFromRow = (row: { [key: string]: any }): string => {
    const statusKeys = [
      "status",
      "estatus",
      "Status",
      "Estatus",
      "state",
      "State",
    ];
    for (const key of statusKeys) {
      if (row[key]) {
        return row[key];
      }
    }
    return "";
  };

  const handleRowClick = async (
    row: { [key: string]: any },
    rowIndex: number
  ) => {
    // Close dropdown on row click
    setOpenDropdown(null);

    // Toggle details view for the clicked row
    if (selectedRowIndex === rowIndex) {
      setSelectedRow(null);
      setSelectedRowIndex(null);
      setSelectedRowError(null);
      setSelectedRowLoading(false);
    } else {
      setSelectedRowIndex(rowIndex);
      setSelectedRow(null);
      setSelectedRowError(null);
      setSelectedRowLoading(true);

      // Determine if row contains an identifier we can use to fetch full details
      const idKeys = [
        "contract_id",
        "contractId",
        "id",
        "ID",
        "ID_CONTRACT",
        "Contract ID",
        "ID de Contrato", // Spanish version
      ];
      let foundId: any = null;
      for (const k of idKeys) {
        if (
          Object.prototype.hasOwnProperty.call(row, k) &&
          row[k] !== undefined &&
          row[k] !== null &&
          row[k] !== ""
        ) {
          foundId = row[k];
          break;
        }
      }

      if (!foundId) {
        // If no id found, just select the row object we already have
        setSelectedRow(row);
        setSelectedRowLoading(false);
        onViewDetails && onViewDetails(row);
        return;
      }

      // Fetch details using the contracts service
      try {
        const contractId = parseInt(String(foundId), 10);
        if (isNaN(contractId)) {
          throw new Error("Invalid contract ID");
        }

        const contractData = await contractsService.getContractDetails(
          contractId
        );
        setSelectedRow(contractData);
        onViewDetails && onViewDetails(contractData);
      } catch (err: any) {
        setSelectedRowError(err?.message || String(err));
        // Set fallback data for error display
        setSelectedRow(row);
      } finally {
        setSelectedRowLoading(false);
      }
    }
  };

  const handleDropdownClick = (e: React.MouseEvent, rowIndex: number) => {
    console.log("🔵 Dropdown button clicked for row:", rowIndex);
    console.log("🔵 Current openDropdown state:", openDropdown);
    if (openDropdown === rowIndex) {
      console.log("🔴 Closing dropdown");
      setOpenDropdown(null);
    } else {
      console.log("🟢 Opening dropdown");
      const rect = e.currentTarget.getBoundingClientRect();
      const dropdownWidth = 200;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let left = rect.right - dropdownWidth;
      let top = rect.bottom + 4;

      // Adjust if dropdown goes off-screen horizontally
      if (left < 10) {
        left = rect.left;
      }
      if (left + dropdownWidth > viewportWidth - 10) {
        left = viewportWidth - dropdownWidth - 10;
      }

      // Adjust if dropdown goes off-screen vertically
      const dropdownHeight = 150; // Approximate height
      if (top + dropdownHeight > viewportHeight - 10) {
        top = rect.top - dropdownHeight - 4;
      }

      setDropdownPosition({ top, left });
      console.log("🟢 Setting dropdown position:", { top, left });
      console.log("🟢 Setting openDropdown to:", rowIndex);
      setOpenDropdown(rowIndex);
    }
  };

  return (
    <div
      className={`${styles.tableContainer} ${className || ""}`}
      style={style}
    >
      {title && <h2 className={styles.title}>{title}</h2>}
      {description && <p className={styles.description}>{description}</p>}
      {/* Remove SearchComponent from here since it's now in FilterableTableComponent */}
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : data.length === 0 ? (
        <div className={styles.emptyMessage}>{emptyMessage}</div>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    // Make the id of each th to be assigned as the column name in lowercase without spaces
                    id={col.toLowerCase().replace(/\s+/g, "-")}
                  >
                    {col}
                  </th>
                ))}
                {showActions && <th></th>}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => {
                const rowId = getRowId(row);
                const isSelected =
                  selectedRowIndex === rowIndex && selectedRow !== null;
                const status = getStatusFromRow(row);
                const statusColor = getStatusColor(status);

                return (
                  <React.Fragment key={rowId || rowIndex}>
                    <tr
                      onClick={() => {
                        if (onRowClick) onRowClick(row);
                        handleRowClick(row, rowIndex);
                      }}
                      className={`${styles.rowWithColorIndicator} ${
                        isSelected ? styles.selectedRow : ""
                      }`}
                      style={{ borderLeftColor: statusColor }}
                    >
                      {columns.map((col) => {
                        const cellValue = row[col];
                        const isStatusColumn =
                          col.toLowerCase() === "estatus" ||
                          col.toLowerCase() === "status";

                        return (
                          <td
                            key={col}
                            id={`cell-${rowId || rowIndex}-${col
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {isStatusColumn ? (
                              <span
                                className={styles.statusPill}
                                style={{
                                  backgroundColor: `${statusColor}20`, // 20 for 12.5% opacity
                                  color: statusColor,
                                }}
                              >
                                {cellValue}
                              </span>
                            ) : (
                              cellValue
                            )}
                          </td>
                        );
                      })}
                      {showActions && (
                        <td className={styles.actionsContainer}>
                          <button
                            className={styles.viewButton}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onViewDetails) {
                                onViewDetails(row);
                              } else {
                                handleRowClick(row, rowIndex);
                              }
                            }}
                            onMouseEnter={(e) => {
                              setHoveredButton("view");
                              const rect =
                                e.currentTarget.getBoundingClientRect();
                              setTooltipPosition({
                                x: rect.left + rect.width / 2,
                                y: rect.top - 10,
                              });
                            }}
                            onMouseLeave={() => setHoveredButton(null)}
                          >
                            <EyeFilled />
                          </button>
                          {hoveredButton === "view" && (
                            <div
                              className={styles.tooltip}
                              style={{
                                left: tooltipPosition.x,
                                top: tooltipPosition.y,
                              }}
                            >
                              Ver Detalles
                            </div>
                          )}

                          <div className={styles.dropdownContainer}>
                            <button
                              className={styles.editButton}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDropdownClick(e, rowIndex);
                              }}
                              onMouseEnter={(e) => {
                                setHoveredButton(`actions-${rowIndex}`);
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                setTooltipPosition({
                                  x: rect.left + rect.width / 2,
                                  y: rect.top - 10,
                                });
                              }}
                              onMouseLeave={() => setHoveredButton(null)}
                            >
                              <MoreVerticalFilled />
                            </button>
                            {hoveredButton === `actions-${rowIndex}` &&
                              openDropdown !== rowIndex && (
                                <div
                                  className={styles.tooltip}
                                  style={{
                                    left: tooltipPosition.x,
                                    top: tooltipPosition.y,
                                  }}
                                >
                                  Más Acciones
                                </div>
                              )}
                          </div>

                          {openDropdown === rowIndex && (
                            <div
                              className={styles.dropdownMenu}
                              style={{
                                top: dropdownPosition.top,
                                left: dropdownPosition.left,
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {isOficina && (
                                <button
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    if (onEditOrder) onEditOrder(row);
                                    setOpenDropdown(null);
                                  }}
                                >
                                  <Edit24Regular />
                                  Editar Orden
                                </button>
                              )}
                              {isOficina && (
                                <button
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    if (onAssignDriver) onAssignDriver(row);
                                    setOpenDropdown(null);
                                  }}
                                >
                                  <PersonSettingsRegular />
                                  Asignar Chofer
                                </button>
                              )}
                              {isOficina && (
                                <button
                                  className={styles.dropdownItem}
                                  onClick={() => {
                                    if (onPayDriver) onPayDriver(row);
                                    setOpenDropdown(null);
                                  }}
                                >
                                  <MoneyHandRegular />
                                  Pagar a Chofer
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                    {isSelected && (
                      <tr>
                        <td
                          colSpan={columns.length + (showActions ? 1 : 0)}
                          className={styles.detailsRowCell}
                        >
                          <DetailsPanel
                            data={selectedRow}
                            loading={selectedRowLoading}
                            error={selectedRowError}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {enablePagination && totalPages > 1 && (
            <div className={styles.paginationWrapper}>
              <Pagination
                currentPage={activePage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}

      {/* AssignDriverModal */}
      <AssignDriverModal
        isOpen={isAssignDriverModalOpen}
        onClose={() => {
          setIsAssignDriverModalOpen(false);
          setSelectedRowForDriver(null);
        }}
        tripData={selectedRowForDriver}
        onAssign={(assignmentData) => {
          console.log("Driver assignment:", assignmentData);
          // TODO: Implement the actual assignment logic here
          // This could involve calling an API to save the assignment
          setIsAssignDriverModalOpen(false);
          setSelectedRowForDriver(null);
        }}
      />

      {/* DriverPaymentModal */}
      <DriverPaymentModal
        isOpen={isDriverPaymentModalOpen}
        onClose={() => {
          setIsDriverPaymentModalOpen(false);
          setSelectedTripIdForPayment(null);
        }}
        tripId={selectedTripIdForPayment}
      />
    </div>
  );
};
export default TableComponent;
