"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Combobox,
  Option,
  Spinner,
  Field,
  Button,
} from "@fluentui/react-components";
import { Add20Regular } from "@fluentui/react-icons";
import type {
  OptionOnSelectData,
  SelectionEvents,
} from "@fluentui/react-combobox";

export interface SearchableSelectOption {
  value: string;
  label: string;
  data?: any;
}

interface Props {
  value: string;
  onChange: (
    value: string,
    option?: SearchableSelectOption,
  ) => void | Promise<void>;
  onSearch: (query: string) => Promise<SearchableSelectOption[]>;
  onCreate?: () => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  createButtonText?: string;
  noResultsText?: string;
  loadingText?: string;
  debounceMs?: number;
  hasError?: boolean;
  errorMessage?: string;
  className?: string;
}

export default function SearchableSelectComponent({
  value,
  onChange,
  onSearch,
  onCreate,
  placeholder = "Search or select...",
  label,
  disabled = false,
  required = false,
  id,
  createButtonText = "Crear nuevo",
  noResultsText = "No results found",
  loadingText = "Loading...",
  debounceMs = 300,
  hasError = false,
  errorMessage = "",
  className = "",
}: Props) {
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedValue, setSelectedValue] = useState<string | undefined>(
    value || undefined,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  /* ---------------------------------------
     Sync external value
  --------------------------------------- */
  useEffect(() => {
    setSelectedValue(value || undefined);
  }, [value]);

  /* ---------------------------------------
     Debounced Search
  --------------------------------------- */
  const performSearch = useCallback(
    async (query: string) => {
      try {
        setIsLoading(true);
        const results = await onSearch(query);
        setOptions(results);
        setSearchPerformed(true);
      } catch (err) {
        console.error("Search error:", err);
        setOptions([]);
        setSearchPerformed(true);
      } finally {
        setIsLoading(false);
      }
    },
    [onSearch],
  );

  const handleInputChange: React.FormEventHandler<HTMLInputElement> = (
    event,
  ) => {
    const newValue = event.currentTarget.value;
    setInputValue(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const query = newValue.trim();

      if (query.length === 0) {
        setOptions([]);
        setSearchPerformed(false);
        return;
      }

      performSearch(query);
    }, debounceMs);
  };

  /* ---------------------------------------
     Load full dataset on open
  --------------------------------------- */
  const handleOpenChange = async (_: any, data: { open: boolean }) => {
    setIsOpen(data.open);

    if (data.open) {
      await performSearch(inputValue.trim());
    } else {
      // Reset when closing
      setSearchPerformed(false);
    }
  };

  /* ---------------------------------------
     Option Selection
  --------------------------------------- */
  const handleOptionSelect = async (
    _: SelectionEvents,
    data: OptionOnSelectData,
  ) => {
    if (!data.optionValue) return;

    const selected = options.find((opt) => opt.value === data.optionValue);

    setSelectedValue(data.optionValue);
    setInputValue(selected?.label || "");
    await onChange(data.optionValue, selected);
  };

  return (
    <Field
      label={label}
      required={required}
      validationMessage={hasError ? errorMessage : undefined}
      validationState={hasError ? "error" : undefined}
    >
      <div style={{ display: "flex", gap: 8 }} className={className}>
        <Combobox
          id={id}
          placeholder={placeholder}
          value={inputValue}
          selectedOptions={selectedValue ? [selectedValue] : []}
          onInput={handleInputChange}
          onOptionSelect={handleOptionSelect}
          onOpenChange={handleOpenChange}
          disabled={disabled}
          style={{ flex: 1 }}
        >
          {isLoading && (
            <Option value="loading" text={loadingText} disabled>
              <Spinner size="tiny" /> {loadingText}
            </Option>
          )}

          {!isLoading &&
            options.map((opt) => (
              <Option key={opt.value} value={opt.value} text={opt.label}>
                {opt.label}
              </Option>
            ))}

          {!isLoading && searchPerformed && options.length === 0 && (
            <Option value="no-results" text={noResultsText} disabled>
              {noResultsText}
            </Option>
          )}
        </Combobox>

        {onCreate && (
          <Button
            appearance="primary"
            icon={<Add20Regular />}
            onClick={onCreate}
            disabled={disabled}
            style={{
              backgroundColor: "var(--Main-96781A)",
              borderColor: "var(--Main-96781A)",
              color: "#ffffff",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#7e6315";
              e.currentTarget.style.borderColor = "#7e6315";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--Main-96781A)";
              e.currentTarget.style.borderColor = "var(--Main-96781A)";
            }}
          >
            {createButtonText}
          </Button>
        )}
      </div>
    </Field>
  );
}
