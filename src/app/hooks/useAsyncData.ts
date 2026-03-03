import { useState, useEffect, useCallback, useRef } from "react";
import { Logger } from "@/app/Utils/Logger";

const log = Logger.getLogger("useAsyncData");

interface AsyncDataState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

interface UseAsyncDataReturn<T> extends AsyncDataState<T> {
  /** Manually set data (e.g. after optimistic update) */
  setData: React.Dispatch<React.SetStateAction<T>>;
  /** Re-execute the fetch function */
  refresh: () => Promise<void>;
}

/**
 * Generic hook for async data fetching with loading/error state.
 *
 * @param fetchFn  Async function that returns data
 * @param initialData  Initial value before first fetch resolves
 * @param deps  Dependencies that trigger a re-fetch (like useEffect deps)
 */
export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  initialData: T,
  deps: React.DependencyList = [],
): UseAsyncDataReturn<T> {
  const [state, setState] = useState<AsyncDataState<T>>({
    data: initialData,
    loading: true,
    error: null,
  });

  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await fetchFn();
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: null });
      }
    } catch (err) {
      log.error("Fetch error:", err);
      if (mountedRef.current) {
        const message =
          err instanceof Error ? err.message : "An error occurred";
        setState((prev) => ({
          ...prev,
          loading: false,
          error: message,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    execute();
    return () => {
      mountedRef.current = false;
    };
  }, [execute]);

  const setData: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (action) => {
      setState((prev) => ({
        ...prev,
        data: typeof action === "function"
          ? (action as (prev: T) => T)(prev.data)
          : action,
      }));
    },
    [],
  );

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    setData,
    refresh: execute,
  };
}
