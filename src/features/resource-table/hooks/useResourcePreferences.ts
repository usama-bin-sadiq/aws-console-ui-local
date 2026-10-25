"use client";

import { useState, useCallback, useEffect } from "react";
import type { PersistedPrefs } from "../types";

const DEFAULT_PAGE_SIZE = 25;

/**
 * Hook for managing table preferences (page size, visible columns)
 * with localStorage persistence
 */
export function useResourcePreferences(serviceKey: string, defaultVisibleColumns: string[]) {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisibleColumns);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem(`prefs_${serviceKey}`);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedPrefs>;
        queueMicrotask(() => {
          setPageSize(parsed.pageSize ?? DEFAULT_PAGE_SIZE);
        });
        queueMicrotask(() => {
          setVisibleColumns(
            parsed.visibleColumns && parsed.visibleColumns.length > 0
              ? parsed.visibleColumns
              : defaultVisibleColumns,
          );
        });
      }
    } catch {
      // Ignore corrupt data
    }
    queueMicrotask(() => {
      setLoaded(true);
    });
  }, [serviceKey, defaultVisibleColumns]);

  // Save to localStorage
  const savePrefs = useCallback(
    (newPageSize: number, newVisibleColumns: string[]) => {
      if (typeof window === "undefined") return;

      try {
        localStorage.setItem(
          `prefs_${serviceKey}`,
          JSON.stringify({
            pageSize: newPageSize,
            visibleColumns: newVisibleColumns,
          }),
        );
      } catch {
        // Ignore storage errors
      }
    },
    [serviceKey],
  );

  const handlePageSizeChange = useCallback(
    (newSize: number) => {
      setPageSize(newSize);
      savePrefs(newSize, visibleColumns);
    },
    [visibleColumns, savePrefs],
  );

  const handleVisibleColumnsChange = useCallback(
    (newColumns: string[]) => {
      setVisibleColumns(newColumns);
      savePrefs(pageSize, newColumns);
    },
    [pageSize, savePrefs],
  );

  const handlePreferencesConfirm = useCallback(
    (newPageSize: number, newVisibleColumns: string[]) => {
      setPageSize(newPageSize);
      setVisibleColumns(newVisibleColumns);
      savePrefs(newPageSize, newVisibleColumns);
    },
    [savePrefs],
  );

  return {
    pageSize,
    visibleColumns,
    loaded,
    handlePageSizeChange,
    handleVisibleColumnsChange,
    handlePreferencesConfirm,
  };
}
