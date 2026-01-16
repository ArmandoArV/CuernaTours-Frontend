// FilterComponent Types
import { formatDateStandard } from "@/app/Utils/FormatUtil";

export interface FilterOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface FilterConfig {
    key: string;
    label: string;
    placeholder: string;
    options: FilterOption[];
    multiple?: boolean;
    searchable?: boolean;
    formatDisplay?: (value: string) => string;
}

export interface ActiveFilter {
    key: string;
    value: string;
    label: string;
    displayValue: string;
}

export interface FilterComponentProps {
    filters: FilterConfig[];
    onFiltersChange: (activeFilters: Record<string, string | string[]>) => void;
    onFilterChange?: (filterKey: string, filterValue: string | string[]) => void;
    showActiveFilters?: boolean;
    showClearButton?: boolean;
    className?: string;
    placeholder?: string;
}

// Utility type for creating filter configurations
export type CreateFilterConfig = Omit<FilterConfig, 'options'> & {
    options: (string | FilterOption)[];
};

// Common filter presets
export const FilterPresets = {
    // Date filter configuration
    createDateFilter: (
        key: string = "fecha",
        dates: string[] = [],
        placeholder: string = "Filtrar por Fecha"
    ): FilterConfig => ({
        key,
        label: "Fecha",
        placeholder,
        options: dates.map(date => ({
            value: date,
            label: formatDateStandard(date) || date
        })),
        formatDisplay: (value: string) => formatDateStandard(value) || value
    }),

    // Status filter configuration
    createStatusFilter: (
        key: string = "estatus",
        statuses: string[] = [],
        placeholder: string = "Filtrar por Estatus"
    ): FilterConfig => ({
        key,
        label: "Estatus",
        placeholder,
        options: statuses.map(status => ({
            value: status,
            label: status
        }))
    }),

    // Generic select filter
    createSelectFilter: (
        key: string,
        label: string,
        options: (string | FilterOption)[],
        placeholder?: string
    ): FilterConfig => ({
        key,
        label,
        placeholder: placeholder || `Filtrar por ${label}`,
        options: options.map(option => 
            typeof option === 'string' 
                ? { value: option, label: option }
                : option
        )
    })
};