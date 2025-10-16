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

interface FilterableTableProps extends Omit<TableComponentProps, "data"> {
  originalData: Array<{ [key: string]: any }>;
  filterConfigs?: FilterConfig[];
  enableFiltering?: boolean;
  enableSearch?: boolean;
  onFiltersChange?: (filters: Record<string, string | string[]>) => void;
  onSearch?: (searchTerm: string) => void;
  actionButtons?: React.ReactNode;
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
        const uniqueValues = Array.from(
          new Set(
            originalData
              .map((row) => row[key])
              .filter(
                (value) => value !== null && value !== undefined && value !== ""
              )
          )
        );

        if (uniqueValues.length > 1 && uniqueValues.length < 50) {
          if (
            key.toLowerCase().includes("fecha") ||
            key.toLowerCase().includes("date")
          ) {
            configs.push(FilterPresets.createDateFilter(key, uniqueValues));
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
                uniqueValues
              )
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
          String(value).toLowerCase().includes(searchTerm.toLowerCase().trim())
        );
      });
    }

    // Apply column filters
    if (Object.keys(activeFilters).length > 0) {
      data = data.filter((row) => {
        return Object.entries(activeFilters).every(
          ([filterKey, filterValue]) => {
            if (!filterValue || filterValue === "") return true;

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
          }
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

      <TableComponent
        {...tableProps}
        data={filteredData}
        title={undefined} // Remove title from table since we show it above
        description={undefined} // Remove description from table since we show it above
      />
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
      sampleData.map((d) => d.fecha)
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
      onFiltersChange={(filters) => console.log("Filters changed:", filters)}
      onViewDetails={(row) => console.log("View details:", row)}
      onEdit={(row) => console.log("Edit:", row)}
    />
  );
};
