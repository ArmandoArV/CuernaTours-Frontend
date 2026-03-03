import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("FormatUtil");

// Utility functions for formatting data

/**
 * Formats a date to the standard format: DD/MMM/YYYY
 * Example: 10/Ene/2025
 * @param date - Date string or Date object
 * @returns Formatted date string
 */
export const formatDateStandard = (date: string | Date | null | undefined): string => {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return "";
    }

    const day = String(dateObj.getDate()).padStart(2, '0');
    const monthNames = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];
    const month = monthNames[dateObj.getMonth()];
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    log.error("Error formatting date:", error);
    return "";
  }
};

/**
 * Formats a date and time to the standard format: DD/MMM/YYYY HH:MM
 * Example: 10/Ene/2025 14:30
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 */
export const formatDateTimeStandard = (date: string | Date | null | undefined): string => {
  if (!date) return "";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return "";
    }

    const dateStr = formatDateStandard(dateObj);
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');

    return `${dateStr} ${hours}:${minutes}`;
  } catch (error) {
    log.error("Error formatting date-time:", error);
    return "";
  }
};

/**
 * Converts a string to Camel Case (first letter of each word capitalized)
 * Example: "JUAN PÉREZ" -> "Juan Pérez"
 * @param str - String to convert
 * @returns Camel case string
 */
export const toCamelCase = (str: string | null | undefined): string => {
  if (!str) return "";
  
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Formats a person's name to Camel Case
 * Handles full names, first names, and last names
 * @param name - Name to format
 * @returns Formatted name in Camel Case
 */
export const formatPersonName = (name: string | null | undefined): string => {
  return toCamelCase(name);
};

/**
 * Formats time from 24-hour format to 12-hour format with AM/PM
 * @param time - Time string in HH:MM or HH:MM:SS format
 * @returns Formatted time string
 */
export const formatTime12Hour = (time: string | null | undefined): string => {
  if (!time) return "";
  
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  } catch (error) {
    return time;
  }
};
