import { useCallback, useEffect, useRef } from "react";

/**
 * Standalone debounce function (non-React).
 *
 * Returns a debounced version of `fn` that delays invocation until
 * `delay` ms have elapsed since the last call. Includes `.cancel()`.
 *
 * Usage:
 *   const save = debounce((val: string) => api.save(val), 500);
 *   save("a"); save("b"); // only the "b" call fires after 500ms
 *   save.cancel();        // cancel pending invocation
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number,
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}

/**
 * React hook: returns a debounced version of `callback`.
 *
 * The debounced function is stable across renders (same ref) and
 * auto-cancels on unmount. Always uses the latest callback.
 *
 * Usage:
 *   const debouncedSearch = useDebounce((query: string) => {
 *     api.search(query);
 *   }, 300);
 *
 *   <input onChange={e => debouncedSearch(e.target.value)} />
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
): (...args: Parameters<T>) => void {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Always point at latest callback without re-creating the debounced fn
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cancel on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        callbackRef.current(...args);
      }, delay);
    },
    [delay],
  );
}

/**
 * React hook: returns a debounced *value*.
 *
 * Useful when you want to delay reacting to a rapidly changing value
 * (e.g., search input text).
 *
 * Usage:
 *   const [text, setText] = useState("");
 *   const debouncedText = useDebouncedValue(text, 400);
 *
 *   useEffect(() => { api.search(debouncedText); }, [debouncedText]);
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

// Need useState for useDebouncedValue
import { useState } from "react";
