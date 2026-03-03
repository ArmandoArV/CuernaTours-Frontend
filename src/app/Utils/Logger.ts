/**
 * Centralized Logger Utility
 *
 * Provides structured, leveled logging with module tags.
 * Logs are suppressed in production unless explicitly enabled.
 *
 * Usage:
 *   import { Logger } from "@/app/Utils/Logger";
 *   const log = Logger.getLogger("MyComponent");
 *   log.info("Something happened", { detail: 123 });
 *   log.error("Failed to fetch", error);
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_STYLES: Record<LogLevel, { emoji: string; color: string }> = {
  debug: { emoji: "🔍", color: "#8c8c8c" },
  info: { emoji: "ℹ️", color: "#2196f3" },
  warn: { emoji: "⚠️", color: "#ff9800" },
  error: { emoji: "❌", color: "#f44336" },
};

interface LoggerConfig {
  /** Minimum log level to output. Default: "debug" in dev, "error" in prod */
  minLevel: LogLevel;
  /** Whether logging is enabled at all */
  enabled: boolean;
  /** Show timestamps in log output */
  showTimestamp: boolean;
}

const IS_DEV =
  typeof process !== "undefined" && process.env.NODE_ENV === "development";
const IS_BROWSER = typeof window !== "undefined";

const defaultConfig: LoggerConfig = {
  minLevel: IS_DEV ? "debug" : "error",
  enabled: IS_DEV,
  showTimestamp: true,
};

let globalConfig: LoggerConfig = { ...defaultConfig };

function shouldLog(level: LogLevel): boolean {
  if (!globalConfig.enabled) return false;
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[globalConfig.minLevel];
}

function formatTimestamp(): string {
  return new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS
}

function buildPrefix(level: LogLevel, module: string): string {
  const { emoji } = LOG_STYLES[level];
  const ts = globalConfig.showTimestamp ? `${formatTimestamp()} ` : "";
  return `${emoji} ${ts}[${module}]`;
}

class ModuleLogger {
  constructor(private module: string) {}

  debug(message: string, ...args: unknown[]): void {
    this.log("debug", message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log("info", message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log("warn", message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log("error", message, ...args);
  }

  /** Grouped log — collapsible in browser devtools */
  group(label: string, fn: () => void): void {
    if (!shouldLog("debug")) return;
    const prefix = buildPrefix("info", this.module);
    if (IS_BROWSER) {
      console.groupCollapsed(`${prefix} ${label}`);
      fn();
      console.groupEnd();
    } else {
      console.log(`${prefix} ── ${label} ──`);
      fn();
    }
  }

  /** Measure execution time */
  time<T>(label: string, fn: () => T): T {
    if (!shouldLog("debug")) return fn();
    const start = performance.now();
    const result = fn();
    const elapsed = (performance.now() - start).toFixed(2);
    this.debug(`${label} completed in ${elapsed}ms`);
    return result;
  }

  /** Measure async execution time */
  async timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!shouldLog("debug")) return fn();
    const start = performance.now();
    try {
      const result = await fn();
      const elapsed = (performance.now() - start).toFixed(2);
      this.debug(`${label} completed in ${elapsed}ms`);
      return result;
    } catch (err) {
      const elapsed = (performance.now() - start).toFixed(2);
      this.error(`${label} failed after ${elapsed}ms`, err);
      throw err;
    }
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (!shouldLog(level)) return;

    const prefix = buildPrefix(level, this.module);
    const { color } = LOG_STYLES[level];
    const consoleFn =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : level === "debug"
            ? console.debug
            : console.log;

    if (IS_BROWSER) {
      consoleFn(
        `%c${prefix}%c ${message}`,
        `color: ${color}; font-weight: bold`,
        "color: inherit",
        ...args
      );
    } else {
      consoleFn(`${prefix} ${message}`, ...args);
    }
  }
}

const loggerCache = new Map<string, ModuleLogger>();

export const Logger = {
  /** Get a named logger instance (cached per module name) */
  getLogger(module: string): ModuleLogger {
    if (!loggerCache.has(module)) {
      loggerCache.set(module, new ModuleLogger(module));
    }
    return loggerCache.get(module)!;
  },

  /** Override global config at runtime */
  configure(config: Partial<LoggerConfig>): void {
    globalConfig = { ...globalConfig, ...config };
  },

  /** Enable all logging (useful for debugging production) */
  enableAll(): void {
    globalConfig.enabled = true;
    globalConfig.minLevel = "debug";
  },

  /** Disable all logging */
  disableAll(): void {
    globalConfig.enabled = false;
  },

  /** Reset to default config */
  reset(): void {
    globalConfig = { ...defaultConfig };
  },
};

// Expose on window for quick runtime toggling in browser devtools:
//   window.__logger.enableAll()
//   window.__logger.configure({ minLevel: "warn" })
if (IS_BROWSER) {
  (window as unknown as Record<string, unknown>).__logger = Logger;
}
