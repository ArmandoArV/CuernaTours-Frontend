/**
 * Status utilities — shared status mapping and color logic
 */

/** Maps contract status IDs to display names */
export const CONTRACT_STATUS_MAP: Record<number, string> = {
  1: "Pendiente",
  2: "En curso",
  3: "Finalizado",
  4: "Cancelado",
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

/** Color palette for status badges, bars, and indicators */
const STATUS_COLOR_MAP: Record<string, string> = {
  pendiente: "#19A5EB",
  agendado: "#19A5EB",
  "por asignar": "#F86E24",
  proximo: "#C89600",
  "en curso": "#4D5DBC",
  "por pagar": "#C89600",
  finalizado: "#80C26C",
  cancelado: "#C7C7C7",
};

const DEFAULT_STATUS_COLOR = "#C7C7C7";

/**
 * Returns the hex color for a given status string.
 * Handles accented characters (e.g. "Próximo") and is case-insensitive.
 */
export function getStatusColor(status: string): string {
  if (!status) return DEFAULT_STATUS_COLOR;

  const key = status
    .toString()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return STATUS_COLOR_MAP[key] ?? DEFAULT_STATUS_COLOR;
}
