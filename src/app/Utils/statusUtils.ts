/**
 * Status utilities — shared status mapping and color logic
 */

/** Maps contract status IDs to display names */
export const CONTRACT_STATUS_MAP: Record<number, string> = {
  1: "Agendado",
  2: "Por asignar",
  3: "Próximo",
  4: "En curso",
  5: "Por pagar",
  6: "Finalizado",
  7: "Cancelado",
};

/** Maps trip status IDs to display names (driver-facing) */
export const TRIP_STATUS_MAP: Record<number, string> = {
  1: "Agendado",
  2: "Por asignar",
  3: "Próximo",
  4: "En curso",
  5: "Por pagar",
  6: "Finalizado",
  7: "Cancelado",
};

/** Background colors for status badges */
const STATUS_BG_MAP: Record<string, string> = {
  pendiente: "#E2F5FF",
  agendado: "#E2F5FF",
  "por asignar": "#FFECE2",
  proximo: "#FFF9E4",
  "en curso": "#E7EBFF",
  "por pagar": "#FFF1E1",
  finalizado: "#E9FBE1",
  cancelado: "#F0F0F5",
};

/** Text colors for status badges */
const STATUS_TEXT_MAP: Record<string, string> = {
  pendiente: "#19A5EB",
  agendado: "#19A5EB",
  "por asignar": "#F86E24",
  proximo: "#C89600",
  "en curso": "#4D5DBC",
  "por pagar": "#F59A31",
  finalizado: "#4FA835",
  cancelado: "#6B6B80",
};

const DEFAULT_BG_COLOR = "#F0F0F5";
const DEFAULT_TEXT_COLOR = "#6B6B80";

/** Normalizes a status string for map lookup */
function normalizeStatus(status: string): string {
  return status
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/**
 * Returns the background hex color for a given status string.
 * Handles accented characters (e.g. "Próximo") and is case-insensitive.
 */
export function getStatusColor(status: string): string {
  if (!status) return DEFAULT_BG_COLOR;
  return STATUS_BG_MAP[normalizeStatus(status)] ?? DEFAULT_BG_COLOR;
}

/**
 * Returns the text color for a given status string.
 */
export function getStatusTextColor(status: string): string {
  if (!status) return DEFAULT_TEXT_COLOR;
  return STATUS_TEXT_MAP[normalizeStatus(status)] ?? DEFAULT_TEXT_COLOR;
}
