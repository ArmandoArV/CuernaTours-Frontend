import React, { useState, useCallback, useMemo } from "react";
import {
  Stack,
  Dropdown,
  IDropdownOption,
  IDropdownStyleProps,
  IDropdownStyles,
  IStackStyles,
  Text,
  IconButton,
  PrimaryButton,
  IIconProps,
  Icon,
  ComboBox,
  IComboBoxOption,
  IComboBoxStyles,
  DatePicker,
  DayOfWeek,
  mergeStyles,
  FontWeights,
  DefaultButton,
} from "@fluentui/react";
import { FilterFilled } from "@fluentui/react-icons";
import { FilterConfig, FilterComponentProps } from "./FilterTypes";
import { formatDateStandard } from "@/app/Utils/FormatUtil";

// --- Styles ---
const containerStyles: IStackStyles = {
  root: {
    padding: "0",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 12,
  },
};

const filterItemStyles: IStackStyles = {
  root: {
    minWidth: 150,
    maxWidth: 300,
  },
};

const dropdownStylesFunction = (props: IDropdownStyleProps): Partial<IDropdownStyles> => {
    const { isOpen } = props;
    return {
        root: { minWidth: 200 },
        title: {
            borderRadius: "25px",
            border: "1px solid #ADADAD",
            height: 40,
            display: "flex",
            alignItems: "center",
            paddingLeft: 40, // Space for icon
            backgroundColor: "transparent",
            lineHeight: 38, // Vertically center text
        },
        dropdown: {
            selectors: {
                ":focus::after": {
                    borderRadius: "25px",
                    borderColor: "#6366f1",
                },
                ":hover .ms-Dropdown-title": {
                    borderColor: "#d1d5db",
                    backgroundColor: "#f9fafb"
                }
            }
        },
        caretDownWrapper: {
            right: 12,
            lineHeight: 38, // Center arrow
            top: 0,
            height: 40,
            color: "#9ca3af",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.1s linear',
        },
        dropdownItem: { minHeight: 40 },
        dropdownOptionText: { fontSize: 14 }
    };
};

const comboBoxStyles: Partial<IComboBoxStyles> = {
  root: { 
      minWidth: 200, 
      height: 40,
      borderRadius: "25px",
      paddingLeft: 40, // Space for icon
      border: "1px solid #ADADAD",
      selectors: {
        "::after": { borderRadius: "25px" },
        ":hover": { borderColor: "#d1d5db", backgroundColor: "#f9fafb" },
        "&.is-open .ms-ComboBox-CaretDown-button": { transform: "rotate(180deg)" },
        '.ms-ComboBox-CaretDown-button': {
            height: 38,
            width: 32,
            backgroundColor: 'transparent',
            color: "#9ca3af",
            right: 4,
            transition: 'transform 0.1s linear',
            selectors: {
                ':hover': { backgroundColor: 'transparent', color: "#6b7280" }
            }
        }
      }
  },
  input: { 
      height: 38, 
      backgroundColor: "transparent",
  },
  container: { height: 40 },
};

const datePickerStyles = {
    root: { minWidth: 200 },
    textField: {
        selectors: {
            '.ms-TextField-fieldGroup': {
                borderRadius: "25px",
                border: "1px solid #ADADAD",
                height: 40,
                paddingLeft: 40, // Space for icon
                selectors: {
                    ':hover': { borderColor: "#d1d5db", backgroundColor: "#f9fafb" }
                }
            },
            '.ms-TextField-field': {
                 paddingTop: 8, 
            }
        }
    }
};

const iconWrapperClass = mergeStyles({
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7280',
    fontSize: 16,
    zIndex: 1,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
});

const wrapperClass = mergeStyles({
    position: 'relative',
    display: 'inline-block',
    width: '100%',
});

const activeFilterTagClass = mergeStyles({
  display: "flex",
  alignItems: "center",
  backgroundColor: "#F3F2F1", // NeutralLighter
  borderRadius: "4px",
  padding: "4px 8px",
  gap: "8px",
  border: "1px solid #E1DFDD",
});

// --- Component ---
const FilterComponent: React.FC<FilterComponentProps> = ({
  filters,
  onFiltersChange,
  onFilterChange,
  showActiveFilters = true,
  showClearButton = true,
  className,
  containerClassName,
}) => {
  // State for active filters
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // Helper to format dates
  const formatDate = useCallback((date: Date | string): string => {
    if (date instanceof Date) {
        return date.toLocaleDateString(); 
    }
    return formatDateStandard(date) || date;
  }, []);

  // Handle generic filter change
  const handleFilterChange = useCallback(
    (key: string, value: any) => {
      const newActiveFilters = { ...activeFilters };

      // If value is null, undefined, or empty string/array, remove the key
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        delete newActiveFilters[key];
      } else {
        newActiveFilters[key] = value;
      }

      setActiveFilters(newActiveFilters);
      onFiltersChange(newActiveFilters);

      if (onFilterChange) {
        onFilterChange(key, value);
      }
    },
    [activeFilters, onFiltersChange, onFilterChange]
  );

  // Clear all
  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
    onFiltersChange({});
    if (onFilterChange) {
      filters.forEach((f) => onFilterChange(f.key, undefined));
    }
  }, [filters, onFiltersChange, onFilterChange]);

  // Remove single filter
  const removeFilter = useCallback(
    (key: string) => {
      handleFilterChange(key, undefined);
    },
    [handleFilterChange]
  );

  // Get display text for active filter
  const getDisplayValue = useCallback(
    (filter: FilterConfig, value: any) => {
      if (!value) return "";
      
      if (filter.formatDisplay) return filter.formatDisplay(value);

      if (filter.type === 'date' && value instanceof Date) {
          return value.toLocaleDateString();
      }

      // If options exist, try to find the label
      if (filter.options) {
        if (Array.isArray(value)) {
           // For multi-select
           return value.map(v => filter.options?.find(o => o.value === v)?.label || v).join(', ');
        }
        const option = filter.options.find((o) => o.value === value);
        return option ? option.label : value;
      }

      return String(value);
    },
    []
  );

  const renderFilterInput = (filter: FilterConfig) => {
    const { key, label, placeholder, options = [], type = "dropdown", multiple } = filter;
    const value = activeFilters[key];

    // Map options to FluentUI format
    const fluentOptions: IDropdownOption[] | IComboBoxOption[] = useMemo(
      () =>
        options.map((opt) => ({
          key: opt.value,
          text: opt.label,
          disabled: opt.disabled,
          data: opt.data,
        })),
      [options]
    );

    switch (type) {
      case "date":
        return (
          <div className={wrapperClass}>
            <div className={iconWrapperClass}>
              <FilterFilled />
            </div>
            <DatePicker
              placeholder={placeholder || "Select date"}
              value={value ? new Date(value) : undefined}
              onSelectDate={(date) => handleFilterChange(key, date)}
              minDate={filter.minDate}
              maxDate={filter.maxDate}
              firstDayOfWeek={DayOfWeek.Monday}
              styles={datePickerStyles}
            />
          </div>
        );
      case "combobox":
        return (
          <div className={wrapperClass}>
            <div className={iconWrapperClass}>
              <FilterFilled />
            </div>
            <ComboBox
              placeholder={placeholder}
              options={fluentOptions as IComboBoxOption[]}
              selectedKey={value}
              onChange={(_, option) => {
                if (option) handleFilterChange(key, option.key);
              }}
              styles={comboBoxStyles}
              allowFreeform={false}
              autoComplete="on"
              useComboBoxAsMenuWidth
            />
          </div>
        );
      case "dropdown":
      default:
        return (
          <div className={wrapperClass}>
            <div className={iconWrapperClass}>
              <FilterFilled />
            </div>
            <Dropdown
              placeholder={placeholder}
              options={fluentOptions as IDropdownOption[]}
              selectedKey={value || (multiple ? [] : undefined)}
              onChange={(_, option) => {
                if (!option) return;
                if (multiple) {
                  const current = (activeFilters[key] as any[]) || [];
                  const newValue = option.selected
                    ? [...current, option.key]
                    : current.filter((k) => k !== option.key);
                  handleFilterChange(key, newValue);
                } else {
                  handleFilterChange(key, option.key);
                }
              }}
              multiSelect={multiple}
              styles={dropdownStylesFunction}
              onRenderCaretDown={() => (
                  <Icon 
                    iconName="ChevronDown" 
                    style={{ fontSize: 12 }} 
                  />
              )}
            />
          </div>
        );
    }
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <Stack className={className || containerClassName}>
      {/* Filters Row */}
      <Stack
        horizontal
        horizontalAlign="start"
        verticalAlign="end"
        tokens={{ childrenGap: 16 }}
        styles={containerStyles}
      >
        {filters.map((filter) => (
          <Stack.Item key={filter.key} styles={filterItemStyles}>
            {renderFilterInput(filter)}
          </Stack.Item>
        ))}

        {showClearButton && hasActiveFilters && (
          <Stack.Item>
             <DefaultButton
              iconProps={{ iconName: 'Cancel' }} // Using standard Fluent icon name
              text="Limpiar filtros"
              onClick={clearAllFilters}
              styles={{ root: { height: 36, marginTop: 29 } }} // Align with inputs (label ~29px)
             />
          </Stack.Item>
        )}
      </Stack>

      {/* Active Filters Tags */}
      {showActiveFilters && hasActiveFilters && (
        <Stack horizontal wrap tokens={{ childrenGap: 8 }} style={{ marginTop: 8 }}>
          {filters.map((filter) => {
            if (!activeFilters[filter.key]) return null;
            
            return (
              <div key={filter.key} className={activeFilterTagClass}>
                <Text variant="small" style={{ fontWeight: 600, color: '#605E5C' }}>
                  {filter.label}:
                </Text>
                <Text variant="small" style={{ color: '#323130' }}>
                   {getDisplayValue(filter, activeFilters[filter.key])}
                </Text>
                <IconButton
                  iconProps={{ iconName: 'Cancel' }}
                  title="Remove filter"
                  ariaLabel="Remove filter"
                  onClick={() => removeFilter(filter.key)}
                  styles={{
                    root: { height: 20, width: 20, marginLeft: 4 },
                    icon: { fontSize: 10, color: '#605E5C' }
                  }}
                />
              </div>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
};

export default FilterComponent;

// Re-export types for convenience
export type {
  FilterOption,
  FilterConfig,
  FilterComponentProps,
} from "./FilterTypes";
