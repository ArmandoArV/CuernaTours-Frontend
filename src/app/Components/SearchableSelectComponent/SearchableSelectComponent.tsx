'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './SearchableSelectComponent.module.css';
import { Search20Regular, Add20Regular, ChevronDown20Regular } from '@fluentui/react-icons';

export interface SearchableSelectOption {
  value: string;
  label: string;
  data?: any; // Additional data for auto-fill
}

interface SearchableSelectComponentProps {
  value: string;
  onChange: (value: string, option?: SearchableSelectOption) => void | Promise<void>;
  onSearch: (query: string) => Promise<SearchableSelectOption[]>;
  onCreate?: () => void; // Callback for "Create New" button
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  containerClassName?: string;
  createButtonText?: string; // Text for create button (e.g., "Create New Client")
  noResultsText?: string;
  loadingText?: string;
  debounceMs?: number;
}

export default function SearchableSelectComponent({
  value,
  onChange,
  onSearch,
  onCreate,
  placeholder = 'Search or select...',
  label,
  disabled = false,
  required = false,
  id,
  className = '',
  containerClassName = '',
  createButtonText = 'Crear nuevo',
  noResultsText = 'No results found',
  loadingText = 'Loading...',
  debounceMs = 300,
}: SearchableSelectComponentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [displayValue, setDisplayValue] = useState('');
  const [options, setOptions] = useState<SearchableSelectOption[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update display value when external value changes
  useEffect(() => {
    if (value && options.length > 0) {
      const selectedOption = options.find(opt => opt.value === value);
      if (selectedOption) {
        setDisplayValue(selectedOption.label);
      }
    } else if (!value) {
      setDisplayValue('');
      setSearchQuery('');
    }
  }, [value, options]);

  // Debounced search
  const performSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setOptions([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const results = await onSearch(query);
        setOptions(results);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
        setOptions([]);
      } finally {
        setIsLoading(false);
      }
    },
    [onSearch]
  );

  // Handle search input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setDisplayValue(query);
    setIsOpen(true);

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);
  };

  // Handle option selection
  const handleSelectOption = (option: SearchableSelectOption) => {
    setDisplayValue(option.label);
    setSearchQuery(option.label);
    setIsOpen(false);
    onChange(option.value, option);
  };

  // Handle create new button click
  const handleCreateNew = () => {
    setIsOpen(false);
    if (onCreate) {
      onCreate();
    }
  };

  // Handle input focus
  const handleFocus = () => {
    setIsOpen(true);
    if (searchQuery && !isLoading) {
      performSearch(searchQuery);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay to allow click events on dropdown items
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        if (searchQuery) {
          performSearch(searchQuery);
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < options.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && options[selectedIndex]) {
          handleSelectOption(options[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`${styles.container} ${containerClassName}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        <div className={styles.inputContainer}>
          <Search20Regular className={styles.searchIcon} />
          <input
            ref={inputRef}
            type="text"
            id={id}
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`${styles.input} ${className}`}
            autoComplete="off"
          />
          <ChevronDown20Regular 
            className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
            onClick={() => !disabled && setIsOpen(!isOpen)}
          />
        </div>

        {isOpen && (
          <div className={styles.dropdown}>
            {isLoading ? (
              <div className={styles.loadingMessage}>{loadingText}</div>
            ) : options.length > 0 ? (
              <>
                {options.map((option, index) => (
                  <div
                    key={option.value}
                    className={`${styles.option} ${
                      index === selectedIndex ? styles.optionSelected : ''
                    } ${option.value === value ? styles.optionActive : ''}`}
                    onClick={() => handleSelectOption(option)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    {option.label}
                  </div>
                ))}
                {onCreate && (
                  <div className={styles.createButtonWrapper}>
                    <button
                      type="button"
                      className={styles.createButton}
                      onClick={handleCreateNew}
                    >
                      <Add20Regular className={styles.createIcon} />
                      {createButtonText}
                    </button>
                  </div>
                )}
              </>
            ) : searchQuery.trim() ? (
              <div className={styles.noResults}>
                <div className={styles.noResultsText}>{noResultsText}</div>
                {onCreate && (
                  <button
                    type="button"
                    className={styles.createButton}
                    onClick={handleCreateNew}
                  >
                    <Add20Regular className={styles.createIcon} />
                    {createButtonText}
                  </button>
                )}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
