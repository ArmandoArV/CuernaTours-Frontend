// FilterComponent Types
import { formatDateStandard } from "@/app/Utils/FormatUtil";

export type FilterType = 'dropdown' | 'combobox' | 'date' | 'text';

export interface FilterOption {
    value: string | number;
    label: string;
    disabled?: boolean;
    data?: any;
}

export interface FilterConfig {
    key: string;
    label: string;
    placeholder?: string;
    type?: FilterType; // Defaults to 'dropdown' if not specified
    options?: FilterOption[]; // Required for dropdown/combobox
    multiple?: boolean;
    searchable?: boolean; // For combobox
    formatDisplay?: (value: any) => string;
    minDate?: Date; // For date type
    maxDate?: Date; // For date type
    defaultValue?: any;
    isExternal?: boolean; // If true, FilterableTableComponent will skip internal filtering logic for this filter
}

export interface FilterComponentProps {
    filters: FilterConfig[];
    onFiltersChange: (activeFilters: Record<string, any>) => void;
    onFilterChange?: (filterKey: string, filterValue: any) => void;
    showActiveFilters?: boolean;
    showClearButton?: boolean;
    className?: string;
    containerClassName?: string;
}

// Utility type for creating filter configurations
export type CreateFilterConfig = Omit<FilterConfig, 'options'> & {
    options: (string | FilterOption)[];
};

// Common filter presets
export const FilterPresets = {
    // Date filter configuration (Dropdown style)
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

    // Date Picker configuration (Calendar style)
    createDatePickerFilter: (
        key: string = "fecha",
        label: string = "Fecha",
        placeholder: string = "Seleccionar fecha"
    ): FilterConfig => ({
        key,
        label,
        placeholder,
        type: 'date',
        formatDisplay: (value: any) => {
             if (value instanceof Date) return value.toLocaleDateString();
             return formatDateStandard(value) || value;
        }
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