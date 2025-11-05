import React, { useState, useCallback, useMemo } from "react";
import styles from "./FilterComponent.module.css";
import { FilterFilled } from "@fluentui/react-icons";
import {
  FilterOption,
  FilterConfig,
  ActiveFilter,
  FilterComponentProps,
} from "./FilterTypes";

const FilterComponent: React.FC<FilterComponentProps> = ({
  filters,
  onFiltersChange,
  onFilterChange,
  showActiveFilters = true,
  showClearButton = true,
  className,
  placeholder = "Filtros disponibles",
}) => {
  const [activeFilters, setActiveFilters] = useState<
    Record<string, string | string[]>
  >({});

  // Format date for display
  const formatDate = useCallback((dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback(
    (filterKey: string, value: string) => {
      const newActiveFilters = { ...activeFilters };

      if (value === "" || value === null) {
        delete newActiveFilters[filterKey];
      } else {
        newActiveFilters[filterKey] = value;
      }

      setActiveFilters(newActiveFilters);
      onFiltersChange(newActiveFilters);

      if (onFilterChange) {
        onFilterChange(filterKey, value);
      }
    },
    [activeFilters, onFiltersChange, onFilterChange]
  );

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
    onFiltersChange({});

    if (onFilterChange) {
      filters.forEach((filter) => {
        onFilterChange(filter.key, "");
      });
    }
  }, [filters, onFiltersChange, onFilterChange]);

  // Remove specific filter
  const removeFilter = useCallback(
    (filterKey: string) => {
      handleFilterChange(filterKey, "");
    },
    [handleFilterChange]
  );

  // Helper to get formatted display value for a given filter
  const getDisplayValueFor = useCallback(
    (filter: FilterConfig, value: string | string[] | undefined) => {
      if (!value || (Array.isArray(value) && value.length === 0)) return "";
      const v = Array.isArray(value) ? value.join(", ") : (value as string);

      if (filter.formatDisplay) return filter.formatDisplay(v);
      if (filter.key === "fecha" || filter.key.toLowerCase().includes("fecha"))
        return formatDate(v);
      return v;
    },
    [formatDate]
  );

  // Check if any filters are active
  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className={`${styles["filter-container"]} ${className || ""}`}>
      {/* Filter Selects with individual icons - styled like buttons */}
      {filters.map((filter) => (
        <div key={filter.key} className={styles["filter-wrapper"]}>
          <FilterFilled className={styles["filter-icon"]} />
          <select
            className={styles["filter-select"]}
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
            value={(activeFilters[filter.key] as string) || ""}
            aria-label={filter.label}
          >
            <option value="">{filter.placeholder}</option>
            {filter.options.map((option, index) => (
              <option
                key={`${filter.key}-${index}`}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>

          {/* Show the active filter immediately below its select */}
          {activeFilters[filter.key] && (
            <div className={styles["active-filter-inline"]}>
              <span className={styles["filter-tag"]}>
                {filter.label}: {getDisplayValueFor(filter, activeFilters[filter.key] as string)}
                <button
                  className={styles["filter-tag-remove"]}
                  onClick={() => removeFilter(filter.key)}
                  aria-label={`Remover filtro ${filter.label}`}
                >
                  ×
                </button>
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Clear Filters Button */}
      {showClearButton && (
        <button
          className={styles["clear-filters-btn"]}
          onClick={clearAllFilters}
          disabled={!hasActiveFilters}
          aria-label="Limpiar todos los filtros"
        >
          Limpiar filtros
        </button>
      )}

      {/* Previously there was an aggregated active-filters area here. Active filters
          are now rendered inline under each select. */}
    </div>
  );
};

export default FilterComponent;

// Re-export types for convenience
export type {
  FilterOption,
  FilterConfig,
  ActiveFilter,
  FilterComponentProps,
} from "./FilterTypes";
export { FilterPresets } from "./FilterTypes";
