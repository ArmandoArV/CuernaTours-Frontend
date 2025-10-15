import React, { useState, useCallback, useMemo } from "react";
import styles from "./FilterComponent.module.css";
import { FilterFilled } from "@fluentui/react-icons";
import { FilterOption, FilterConfig, ActiveFilter, FilterComponentProps } from './FilterTypes';

const FilterComponent: React.FC<FilterComponentProps> = ({
    filters,
    onFiltersChange,
    onFilterChange,
    showActiveFilters = true,
    showClearButton = true,
    className,
    placeholder = "Filtros disponibles"
}) => {
    const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});

    // Format date for display
    const formatDate = useCallback((dateString: string): string => {
        try {
            return new Date(dateString).toLocaleDateString("es-ES", {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }, []);

    // Handle filter change
    const handleFilterChange = useCallback((filterKey: string, value: string) => {
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
    }, [activeFilters, onFiltersChange, onFilterChange]);

    // Clear all filters
    const clearAllFilters = useCallback(() => {
        setActiveFilters({});
        onFiltersChange({});
        
        if (onFilterChange) {
            filters.forEach(filter => {
                onFilterChange(filter.key, "");
            });
        }
    }, [filters, onFiltersChange, onFilterChange]);

    // Remove specific filter
    const removeFilter = useCallback((filterKey: string) => {
        handleFilterChange(filterKey, "");
    }, [handleFilterChange]);

    // Get active filter tags for display
    const activeFilterTags = useMemo(() => {
        const tags: ActiveFilter[] = [];
        
        Object.entries(activeFilters).forEach(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return;
            
            const filterConfig = filters.find(f => f.key === key);
            if (!filterConfig) return;
            
            const displayValue = filterConfig.formatDisplay 
                ? filterConfig.formatDisplay(value as string)
                : key === "fecha" || key.toLowerCase().includes("fecha")
                    ? formatDate(value as string)
                    : value as string;
            
            tags.push({
                key,
                value: value as string,
                label: filterConfig.label,
                displayValue
            });
        });
        
        return tags;
    }, [activeFilters, filters, formatDate]);

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
                        value={activeFilters[filter.key] as string || ""}
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

            {/* Active Filter Tags */}
            {showActiveFilters && activeFilterTags.length > 0 && (
                <div className={styles["active-filters"]}>
                    {activeFilterTags.map((tag) => (
                        <span key={tag.key} className={styles["filter-tag"]}>
                            {tag.label}: {tag.displayValue}
                            <button
                                className={styles["filter-tag-remove"]}
                                onClick={() => removeFilter(tag.key)}
                                aria-label={`Remover filtro ${tag.label}`}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FilterComponent;

// Re-export types for convenience
export type { FilterOption, FilterConfig, ActiveFilter, FilterComponentProps } from './FilterTypes';
export { FilterPresets } from './FilterTypes';