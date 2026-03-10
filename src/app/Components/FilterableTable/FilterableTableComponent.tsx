// Integration of modular FilterComponent with TableComponent
import React, { useState, useMemo } from "react";
import TableComponent, {
  TableComponentProps,
} from "../TableComponent/TableComponent";
import FilterComponent, {
  FilterConfig,
  FilterPresets,
} from "../FilterComponent";
import SearchComponent from "../SearchComponent/SearchComponent";
import styles from "./FilterableTableComponent.module.css";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("FilterableTableComponent");

interface FilterableTableProps extends Omit<TableComponentProps, "data"> {
  originalData: Array<{ [key: string]: any }>;
  filterConfigs?: FilterConfig[];
  enableFiltering?: boolean;
  enableSearch?: boolean;
  onFiltersChange?: (filters: Record<string, string | string[]>) => void;
  onSearch?: (searchTerm: string) => void;
  actionButtons?: React.ReactNode;
  title?: string;
  description?: string;
  groupBy?: (row: any) => string;
}
const FilterableTableComponent: React.FC<FilterableTableProps> = ({
  originalData,
  filterConfigs = [],
  enableFiltering = true,
  enableSearch = true,
  onFiltersChange,
  onSearch,
  actionButtons,
  title,
  description,
  ...tableProps
}) => {
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string | string[]>
  >({});
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Generate filter configurations from data if not provided
  const defaultFilterConfigs = useMemo(() => {
    if (filterConfigs.length > 0) return filterConfigs;

    const configs: FilterConfig[] = [];

    // Auto-generate filters based on data
    if (originalData.length > 0) {
      const sampleRow = originalData[0];

      // Create filters for common columns
      Object.keys(sampleRow).forEach((key) => {
        const uniqueValues: string[] = Array.from(
          new Set(
            originalData
              .map((row: Record<string, any>) => row[key])
              .filter(
                (value: any) =>
                  value !== null && value !== undefined && value !== "",
              )
              .map((v: any) => String(v)),
          ),
        );

        if (uniqueValues.length > 1 && uniqueValues.length < 50) {
          if (
            key.toLowerCase().includes("fecha") ||
            key.toLowerCase().includes("date")
          ) {
            configs.push({
              key,
              label: key.charAt(0).toUpperCase() + key.slice(1),
              type: "dateRange" as any,
            });
          } else if (
            key.toLowerCase().includes("estatus") ||
            key.toLowerCase().includes("status")
          ) {
            configs.push(FilterPresets.createStatusFilter(key, uniqueValues));
          } else if (typeof uniqueValues[0] === "string") {
            configs.push(
              FilterPresets.createSelectFilter(
                key,
                key.charAt(0).toUpperCase() + key.slice(1),
                uniqueValues,
              ),
            );
          }
        }
      });
    }

    return configs.slice(0, 5); // Limit to 5 auto-generated filters
  }, [originalData, filterConfigs]);

  // Filter data based on active filters and search term
  const filteredData = useMemo(() => {
    let data = originalData;

    // Apply search filter
    if (searchTerm.trim()) {
      data = data.filter((row) => {
        return Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase().trim()),
        );
      });
    }

    // Apply column filters
    if (Object.keys(activeFilters).length > 0) {
      data = data.filter((row) => {
        return Object.entries(activeFilters).every(
          ([filterKey, filterValue]) => {
            // Find the filter config to check if it's external
            const filterConfig = defaultFilterConfigs.find(
              (f) => f.key === filterKey,
            );

            // Skip internal filtering if marked as external
            if (filterConfig?.isExternal) return true;

            if (!filterValue || filterValue === "") return true;

            // Handle dateRange filter type
            if (filterConfig?.type === ("dateRange" as any) && typeof filterValue === "object" && !Array.isArray(filterValue)) {
              const { start, end } = filterValue as any;
              if (!start && !end) return true;
              const rowDate = row[filterKey] ? new Date(row[filterKey]) : null;
              if (!rowDate) return false;
              const rowDay = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate()).getTime();
              if (start) {
                const s = new Date(start);
                const startDay = new Date(s.getFullYear(), s.getMonth(), s.getDate()).getTime();
                if (rowDay < startDay) return false;
              }
              if (end) {
                const e = new Date(end);
                const endDay = new Date(e.getFullYear(), e.getMonth(), e.getDate()).getTime();
                if (rowDay > endDay) return false;
              }
              return true;
            }

            const rowValue = row[filterKey];
            if (rowValue === null || rowValue === undefined) return false;

            // Handle array values (for multiple selection)
            if (Array.isArray(filterValue)) {
              return filterValue.includes(String(rowValue));
            }

            // Exact match for select filters (status, dates, etc.)
            return (
              String(rowValue).toLowerCase().trim() ===
              String(filterValue).toLowerCase().trim()
            );
          },
        );
      });
    }

    return data;
  }, [originalData, activeFilters, searchTerm]);

  const handleFiltersChange = (filters: Record<string, string | string[]>) => {
    setActiveFilters(filters);
    onFiltersChange?.(filters);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    onSearch?.(term);
  };

  return (
    <div className={styles.container}>
      {/* Title */}
      {title && <h2 className={styles.title}>{title}</h2>}
      {description && <p className={styles.description}>{description}</p>}
      {/* Search, Filter and Action Bar */}
      <div className={styles.searchFilterBar}>
        {enableFiltering && defaultFilterConfigs.length > 0 && (
          <div className={styles.filterSection}>
            <FilterComponent
              filters={defaultFilterConfigs} // Show ALL filters, not just the first one
              onFiltersChange={handleFiltersChange}
              showActiveFilters={true}
              showClearButton={true}
            />
          </div>
        )}
        {enableSearch && (
          <div className={styles.searchSection}>
            <SearchComponent onSearch={handleSearch} />
          </div>
        )}

        {actionButtons && (
          <div className={styles.actionSection}>{actionButtons}</div>
        )}
      </div>
      <TableComponent {...tableProps} data={filteredData} />{" "}
    </div>
  );
};

export default FilterableTableComponent;

// Example usage component
export const FilterableTableExample: React.FC = () => {
  const sampleData = [
    {
      id: 1,
      fecha: "2024-01-15",
      encargado: "Juan Pérez",
      estatus: "Agendado",
      precio: 1500,
    },
    {
      id: 2,
      fecha: "2024-02-10",
      encargado: "María García",
      estatus: "En Curso",
      precio: 2000,
    },
    {
      id: 3,
      fecha: "2024-03-05",
      encargado: "Carlos López",
      estatus: "Finalizado",
      precio: 1800,
    },
    {
      id: 4,
      fecha: "2024-01-20",
      encargado: "Juan Pérez",
      estatus: "Por Pagar",
      precio: 2200,
    },
    {
      id: 5,
      fecha: "2024-02-28",
      encargado: "María García",
      estatus: "Agendado",
      precio: 1700,
    },
  ];

  const columns = ["ID", "Fecha", "Encargado", "Estatus", "Precio"];

  // Custom filter configurations
  const customFilters: FilterConfig[] = [
    FilterPresets.createDateFilter(
      "fecha",
      sampleData.map((d) => d.fecha),
    ),
    FilterPresets.createSelectFilter("encargado", "Encargado", [
      "Juan Pérez",
      "María García",
      "Carlos López",
    ]),
    FilterPresets.createStatusFilter("estatus", [
      "Agendado",
      "En Curso",
      "Finalizado",
      "Por Pagar",
    ]),
    {
      key: "precio",
      label: "Rango de Precio",
      placeholder: "Filtrar por Precio",
      options: [
        { value: "0-1500", label: "Hasta $1,500" },
        { value: "1501-2000", label: "$1,501 - $2,000" },
        { value: "2001-3000", label: "Más de $2,000" },
      ],
    },
  ];

  return (
    <FilterableTableComponent
      originalData={sampleData}
      columns={columns}
      title="Tours y Reservaciones"
      filterConfigs={customFilters}
      enablePagination={true}
      itemsPerPage={5}
      showActions={true}
      onFiltersChange={(filters) => log.debug("Filters changed:", filters)}
    />
  );
};
