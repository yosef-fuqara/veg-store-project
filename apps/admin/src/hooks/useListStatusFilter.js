import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Syncs a list status filter with URL search params (e.g. ?status=new).
 * Survives remount, refresh, and browser back/forward.
 */
export function useListStatusFilter(validOptions, { paramKey = "status", defaultValue = "all" } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = useMemo(() => {
    const raw = searchParams.get(paramKey);
    if (raw && validOptions.includes(raw)) return raw;
    return defaultValue;
  }, [searchParams, paramKey, validOptions, defaultValue]);

  const setStatusFilter = useCallback(
    (value) => {
      const next =
        value === defaultValue || !validOptions.includes(value) ? defaultValue : value;
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === defaultValue) {
            params.delete(paramKey);
          } else {
            params.set(paramKey, next);
          }
          return params;
        },
        { replace: false }
      );
    },
    [setSearchParams, paramKey, defaultValue, validOptions]
  );

  const listSearch = searchParams.toString();

  return { statusFilter, setStatusFilter, listSearch };
}

/** Location state for detail/edit links so explicit "back" restores the list query. */
export function adminListLinkState(listSearch) {
  return listSearch ? { listSearch } : undefined;
}

/** React Router `to` for returning to a filtered list. */
export function adminListBackTo(pathname, listSearch) {
  return listSearch ? { pathname, search: listSearch } : pathname;
}
