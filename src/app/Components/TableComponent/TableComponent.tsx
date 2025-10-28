"use client";
import React, { useState, useMemo, useEffect } from "react";
import styles from "./TableComponent.module.css";
import { EyeFilled, MoreVerticalFilled, Edit24Regular, AddFilled, Payment24Regular } from "@fluentui/react-icons";
import { Pagination } from "../../PaginationComponent/PaginationComponent";
// Remove SearchComponent import since it's now handled by FilterableTableComponent
// import SearchComponent from "../SearchComponent/SearchComponent";
// Remove FilterComponent import since it's now handled by FilterableTableComponent
// import FilterComponent from "../FilterComponent/FilterComponent";
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
}) => {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [internalCurrentPage, setInternalCurrentPage] = useState(currentPage || 1);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  // Sync internal state with external currentPage prop
  useEffect(() => {
    if (currentPage !== undefined) {
      setInternalCurrentPage(currentPage);
    }
  }, [currentPage]);

  // Use external currentPage if provided, otherwise use internal state
  const activePage = currentPage !== undefined ? currentPage : internalCurrentPage;

  // Close dropdown when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    const handleScroll = () => {
      setOpenDropdown(null);
    };

    if (openDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
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
        return "#F59A31";
      case "finalizado":
        return "#80C26C";
      default:
        return "#C7C7C7"; // default gray
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
                  <th key={col}>{col}</th>
                ))}
                {showActions && <th></th>}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{ cursor: onRowClick ? "pointer" : "default" }}
                >
                  {columns.map((col) => (
                    <td key={col}>
                      {col.toLowerCase() === "estatus" ? (
                        <div className={styles.statusCell}>
                          <span
                            className={styles.statusDot}
                            style={{ backgroundColor: getStatusColor(row[col]) }}
                          />
                          <span>{row[col]}</span>
                        </div>
                      ) : (
                        row[col]
                      )}
                    </td>
                  ))}
                  {showActions && (
                    <td>
                      <div className={styles.actionsContainer}>
                        <button
                          className={`${styles.actionButton} ${styles.viewButton}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails && onViewDetails(row);
                          }}
                          onMouseEnter={(e) => {
                            setHoveredButton(`details-${rowIndex}`);
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
                        <div className={styles.dropdownContainer}>
                          <button
                            className={`${styles.actionButton} ${styles.editButton}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (openDropdown === rowIndex) {
                                setOpenDropdown(null);
                              } else {
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
                                setOpenDropdown(rowIndex);
                              }
                            }}
                            onMouseEnter={(e) => {
                              if (openDropdown === null) {
                                setHoveredButton(`edit-${rowIndex}`);
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                setTooltipPosition({
                                  x: rect.left + rect.width / 2,
                                  y: rect.top - 10,
                                });
                              }
                            }}
                            onMouseLeave={() => {
                              if (openDropdown === null) {
                                setHoveredButton(null);
                              }
                            }}
                          >
                            <MoreVerticalFilled />
                          </button>
                          
                          {openDropdown === rowIndex && (
                            <div 
                              className={styles.dropdownMenu}
                              style={{
                                top: `${dropdownPosition.top}px`,
                                left: `${dropdownPosition.left}px`
                              }}
                            >
                              <button
                                className={styles.dropdownItem}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(null);
                                  onEditOrder && onEditOrder(row);
                                }}
                              >
                                <Edit24Regular className={styles.dropdownIcon} />
                                Editar Orden
                              </button>
                              <button
                                className={styles.dropdownItem}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(null);
                                  onAssignDriver && onAssignDriver(row);
                                }}
                              >
                                <AddFilled className={styles.dropdownIcon} />
                                Asignar chofer y unidad
                              </button>
                              <button
                                className={styles.dropdownItem}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdown(null);
                                  onPayDriver && onPayDriver(row);
                                }}
                              >
                                <Payment24Regular className={styles.dropdownIcon} />
                                Pagar al chofer
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tooltip */}
          {hoveredButton && openDropdown === null && (
            <div
              className={styles.tooltip}
              style={{
                left: `${tooltipPosition.x}px`,
                top: `${tooltipPosition.y}px`,
              }}
            >
              {hoveredButton.includes("details") ? "Ver detalles" : "Editar"}
            </div>
          )}

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
    </div>
  );
};
export default TableComponent;
