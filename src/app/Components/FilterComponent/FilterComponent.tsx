import React, { useState, useCallback, useMemo, useRef } from "react";
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
  IDatePickerStyles,
  Calendar,
  Callout,
  DirectionalHint,
} from "@fluentui/react";
import { FilterRegular, CalendarLtrRegular } from "@fluentui/react-icons";
import { FilterConfig, FilterComponentProps } from "./FilterTypes";
import { formatDateStandard } from "@/app/Utils/FormatUtil";

// --- Styles ---
const containerStyles: IStackStyles = {
  root: {
    padding: "0",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 8,
    "@media (max-width: 600px)": {
      flexDirection: "column",
    },
  },
};

const filterItemStyles: IStackStyles = {
  root: {
    minWidth: 140,
    maxWidth: 300,
    flexBasis: "140px",
    flexGrow: 1,
    display: "flex",
    alignItems: "center",
    height: 40,
    "@media (max-width: 600px)": {
      minWidth: "100%",
      maxWidth: "100%",
      flexBasis: "100%",
    },
  },
};

const dropdownStylesFunction = (
  props: IDropdownStyleProps,
): Partial<IDropdownStyles> => {
  const { isOpen } = props;
  return {
    root: { minWidth: 200, marginBottom: 0, width: "100%" },
    title: {
      borderRadius: "6px",
      border: "1px solid #ADADAD",
      height: 40,
      display: "flex",
      alignItems: "center",
      paddingLeft: 40, // Space for icon
      backgroundColor: "transparent",
    },
    dropdown: {
      selectors: {
        ":focus::after": {
          borderRadius: "6px",
          borderColor: "#6366f1",
        },
        ":hover .ms-Dropdown-title": {
          borderColor: "#d1d5db",
          backgroundColor: "transparent",
        },
      },
    },
    caretDownWrapper: {
      right: 12,
      top: 0,
      height: 40,
      color: "#9ca3af",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.1s linear",
    },
    dropdownItem: { minHeight: 40 },
    dropdownOptionText: { fontSize: 14 },
  };
};

const comboBoxStyles: Partial<IComboBoxStyles> = {
  root: {
    minWidth: 200,
    height: 40,
    marginBottom: 0,
    borderRadius: "6px",
    paddingLeft: 40, // Space for icon
    border: "1px solid #ADADAD",
    backgroundColor: "transparent",
    selectors: {
      "::after": { borderRadius: "6px" },
      ":hover": { borderColor: "#d1d5db", backgroundColor: "transparent" },
      "&.is-open .ms-ComboBox-CaretDown-button": {
        transform: "rotate(180deg)",
      },
      ".ms-ComboBox-CaretDown-button": {
        height: 38,
        width: 32,
        backgroundColor: "transparent",
        color: "#9ca3af",
        right: 4,
        transition: "transform 0.1s linear",
        selectors: {
          ":hover": { backgroundColor: "transparent", color: "#6b7280" },
        },
      },
    },
  },
  input: {
    height: 38,
    backgroundColor: "transparent",
    lineHeight: "38px", // Center text vertically in input
    boxSizing: "border-box",
  },
  container: { height: 40 },
};

const datePickerStyles: Partial<IDatePickerStyles> = {
  root: { minWidth: 200, marginBottom: 0, marginTop: 0, width: "100%" },
  textField: {
    selectors: {
      ".ms-TextField-wrapper": {
        margin: 0,
        padding: 0,
      },
      ".ms-TextField-fieldGroup": {
        borderRadius: "6px",
        border: "1px solid #ADADAD",
        height: 40,
        paddingLeft: 40,
        backgroundColor: "transparent",
        display: "flex",
        alignItems: "center",
        selectors: {
          ":hover": { borderColor: "#d1d5db", backgroundColor: "transparent" },
        },
      },
      ".ms-TextField-field": {
        paddingTop: 0,
        paddingBottom: 0,
        height: "100%",
        lineHeight: "38px",
        display: "block",
        flex: 1,
      },
    },
  },
  icon: {
    color: "#9ca3af",
    fontSize: 14,
    position: "relative" as const,
    top: "auto",
    right: "auto",
    bottom: "auto",
    transform: "none",
    marginRight: 12,
    display: "flex",
    alignItems: "center",
    height: "100%",
  },
};

const iconWrapperClass = mergeStyles({
  position: "absolute",
  left: 16,
  top: "50%",
  transform: "translateY(-50%)",
  color: "#6b7280",
  fontSize: 16,
  zIndex: 1,
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: 16,
  width: 16,
});

const wrapperClass = mergeStyles({
  position: "relative",
  display: "flex",
  alignItems: "center",
  width: "100%",
  height: 40,
});

const activeFilterTagClass = mergeStyles({
  display: "flex",
  alignItems: "center",
  backgroundColor: "#F3F2F1", // NeutralLighter
  borderRadius: "6px",
  padding: "4px 8px",
  gap: "8px",
  border: "1px solid #E1DFDD",
});

// --- DateRange sub-component (single Calendar callout) ---
const DateRangeFilter: React.FC<{
  filter: FilterConfig;
  value: { start?: Date; end?: Date } | undefined;
  onChange: (value: any) => void;
}> = ({ filter, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  const handleSelectDate = (date: Date) => {
    if (!selectingEnd || !value?.start) {
      onChange({ start: date, end: undefined });
      setSelectingEnd(true);
    } else {
      if (date >= value.start) {
        onChange({ start: value.start, end: date });
        setIsOpen(false);
        setSelectingEnd(false);
      } else {
        onChange({ start: date, end: undefined });
        setSelectingEnd(true);
      }
    }
  };

  const displayText = value?.start
    ? `${value.start.toLocaleDateString("es-MX")}${value.end ? ` — ${value.end.toLocaleDateString("es-MX")}` : " — ..."}`
    : filter.placeholder || "Seleccionar periodo";

  return (
    <div ref={buttonRef} style={{ width: "100%" }}>
      <DefaultButton
        iconProps={{ iconName: "Calendar" }}
        onClick={() => { setIsOpen(!isOpen); setSelectingEnd(false); }}
        styles={{
          root: {
            height: 40,
            borderRadius: "6px",
            border: "1px solid #ADADAD",
            backgroundColor: "transparent",
            width: "100%",
            minWidth: 160,
          },
          label: { fontWeight: 400, color: value?.start ? "#323130" : "#605e5c" },
        }}
      >
        {displayText}
      </DefaultButton>
      {isOpen && (
        <Callout
          target={buttonRef}
          onDismiss={() => { setIsOpen(false); setSelectingEnd(false); }}
          directionalHint={DirectionalHint.bottomLeftEdge}
          directionalHintFixed={false}
          isBeakVisible={false}
          styles={{ root: { maxWidth: "min(320px, calc(100vw - 16px))" } }}
        >
          <div style={{ padding: "8px 12px 4px", textAlign: "center", fontSize: 12, color: "#605e5c", borderBottom: "1px solid #edebe9" }}>
            {selectingEnd ? "📅 Selecciona la fecha fin" : "📅 Selecciona la fecha inicio"}
          </div>
          <Calendar
            onSelectDate={handleSelectDate}
            value={selectingEnd ? value?.start : undefined}
            firstDayOfWeek={DayOfWeek.Monday}
            minDate={selectingEnd ? value?.start : undefined}
            isMonthPickerVisible={false}
            showGoToToday={false}
          />
          {(value?.start || value?.end) && (
            <div style={{ padding: "4px 12px 8px", borderTop: "1px solid #edebe9", display: "flex", justifyContent: "flex-end" }}>
              <DefaultButton
                text="Limpiar"
                iconProps={{ iconName: "Cancel" }}
                onClick={() => { onChange(undefined); setSelectingEnd(false); setIsOpen(false); }}
                styles={{ root: { height: 28, fontSize: 12 } }}
              />
            </div>
          )}
        </Callout>
      )}
    </div>
  );
};

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
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "object" && !Array.isArray(value) && !value?.start && !value?.end)
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
    [activeFilters, onFiltersChange, onFilterChange],
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
    [handleFilterChange],
  );

  // Get display text for active filter
  const getDisplayValue = useCallback((filter: FilterConfig, value: any) => {
    if (!value) return "";

    if (filter.formatDisplay) return filter.formatDisplay(value);

    if (filter.type === "dateRange" && value && typeof value === "object") {
      const parts = [];
      if (value.start) parts.push(new Date(value.start).toLocaleDateString());
      if (value.end) parts.push(new Date(value.end).toLocaleDateString());
      return parts.join(" — ");
    }

    if (filter.type === "date" && value instanceof Date) {
      return value.toLocaleDateString();
    }

    // If options exist, try to find the label
    if (filter.options) {
      if (Array.isArray(value)) {
        // For multi-select
        return value
          .map((v) => filter.options?.find((o) => o.value === v)?.label || v)
          .join(", ");
      }
      const option = filter.options.find((o) => o.value === value);
      return option ? option.label : value;
    }

    return String(value);
  }, []);

  const renderFilterInput = (filter: FilterConfig) => {
    const {
      key,
      label,
      placeholder,
      options = [],
      type = "dropdown",
      multiple,
    } = filter;
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
      [options],
    );

    switch (type) {
      case "dateRange":
        return (
          <DateRangeFilter
            filter={filter}
            value={value}
            onChange={(v) => handleFilterChange(key, v)}
          />
        );
      case "date":
        return (
          <div className={wrapperClass}>
            <div className={iconWrapperClass}>
              <FilterRegular />
            </div>
            <DatePicker
              placeholder={placeholder || "Seleccionar fechas"}
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
              <FilterRegular />
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
              <FilterRegular />
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
                <Icon iconName="ChevronDown" style={{ fontSize: 12 }} />
              )}
            />
          </div>
        );
    }
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  // Sort filters: Date filters first
  const sortedFilters = useMemo(() => {
    return [...filters].sort((a, b) => {
      if ((a.type === "date" || a.type === "dateRange") && b.type !== "date" && b.type !== "dateRange") return -1;
      if (a.type !== "date" && a.type !== "dateRange" && (b.type === "date" || b.type === "dateRange")) return 1;
      return 0;
    });
  }, [filters]);

  return (
    <Stack className={className || containerClassName}>
      {/* Filters Row */}
      <Stack
        horizontal
        horizontalAlign="start"
        verticalAlign="center"
        tokens={{ childrenGap: 8 }}
        styles={containerStyles}
      >
        {sortedFilters.map((filter) => (
          <Stack.Item
            key={filter.key}
            grow={filter.type === "dateRange" ? 1 : undefined}
            styles={filter.type === "dateRange"
              ? { root: { display: "flex", alignItems: "center", height: 40, minWidth: 160, flexBasis: "160px", "@media (max-width: 600px)": { minWidth: "100%", flexBasis: "100%" } } }
              : filterItemStyles}
          >
            {renderFilterInput(filter)}
          </Stack.Item>
        ))}

        {showClearButton && hasActiveFilters && (
          <Stack.Item styles={{ root: { marginLeft: "auto", display: "flex", alignItems: "center", "@media (max-width: 600px)": { marginLeft: 0, width: "100%" } } }}>
            <DefaultButton
              iconProps={{ iconName: "Cancel" }}
              text="Limpiar filtros"
              onClick={clearAllFilters}
              styles={{ root: { height: 40, "@media (max-width: 600px)": { width: "100%" } } }}
            />
          </Stack.Item>
        )}
      </Stack>

      {/* Active Filters Tags */}
      {showActiveFilters && hasActiveFilters && (
        <Stack
          horizontal
          wrap
          tokens={{ childrenGap: 8 }}
          style={{ marginTop: 8 }}
        >
          {filters.map((filter) => {
            if (!activeFilters[filter.key]) return null;

            return (
              <div key={filter.key} className={activeFilterTagClass}>
                <Text
                  variant="small"
                  style={{ fontWeight: 600, color: "#605E5C" }}
                >
                  {filter.label}:
                </Text>
                <Text variant="small" style={{ color: "#323130" }}>
                  {getDisplayValue(filter, activeFilters[filter.key])}
                </Text>
                <IconButton
                  iconProps={{ iconName: "Cancel" }}
                  title="Remove filter"
                  ariaLabel="Remove filter"
                  onClick={() => removeFilter(filter.key)}
                  styles={{
                    root: { height: 20, width: 20, marginLeft: 4 },
                    icon: { fontSize: 10, color: "#605E5C" },
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
