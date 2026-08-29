"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  memo,
} from "react";
import Table, { TableProps } from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences, {
  CollectionPreferencesProps,
} from "@cloudscape-design/components/collection-preferences";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResourceTableProps<T extends object> {
  /**
   * Used as the localStorage key: `"prefs_{serviceKey}"`
   */
  serviceKey: string;

  /** Column definitions forwarded to Cloudscape Table */
  columnDefinitions: ReadonlyArray<TableProps.ColumnDefinition<T>>;

  /** All items (unfiltered, unpaginated) */
  items: T[];

  /** Whether the table is in a loading state */
  loading?: boolean;

  // ── Selection ─────────────────────────────────────────────────────────────
  selectedItems?: T[];
  onSelectionChange?: (items: T[]) => void;

  // ── Filtering ─────────────────────────────────────────────────────────────
  /** Controlled filter text. Table manages its own if this is omitted. */
  filteringText?: string;
  onFilteringChange?: (text: string) => void;
  filteringPlaceholder?: string;

  // ── Pagination (external control — table manages its own if omitted) ──────
  currentPageIndex?: number;
  pagesCount?: number;
  onPageChange?: (page: number) => void;

  // ── Column preferences (external — table manages its own if omitted) ──────
  preferences?: CollectionPreferencesProps.Preferences;
  onPreferencesChange?: (prefs: CollectionPreferencesProps.Preferences) => void;

  // ── Header ────────────────────────────────────────────────────────────────
  /**
   * Custom header node. When omitted the table generates a default header
   * from `resourceName`, `actionButtons`, and the selection count.
   */
  header?: React.ReactNode;
  /** Human-readable resource name used in the generated header and empty state. */
  resourceName?: string;
  /** Action buttons rendered in the generated header. */
  actionButtons?: React.ReactNode;

  // ── Refresh ───────────────────────────────────────────────────────────────
  onRefresh?: () => void;

  // ── Empty state ───────────────────────────────────────────────────────────
  emptyTitle?: string;
  emptyDescription?: string;
  createButtonLabel?: string;
  onCreateClick?: () => void;

  /** trackBy prop forwarded to Cloudscape Table */
  trackBy?: TableProps.TrackBy<T>;
}

// ─── Persistence helpers ──────────────────────────────────────────────────────

const DEFAULT_PAGE_SIZE = 25;

interface PersistedPrefs {
  pageSize: number;
  visibleColumns: string[];
}

function loadPrefs(serviceKey: string, allIds: string[]): PersistedPrefs {
  if (typeof window === "undefined") {
    return { pageSize: DEFAULT_PAGE_SIZE, visibleColumns: allIds };
  }
  try {
    const raw = localStorage.getItem(`prefs_${serviceKey}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedPrefs>;
      return {
        pageSize: parsed.pageSize ?? DEFAULT_PAGE_SIZE,
        visibleColumns:
          parsed.visibleColumns && parsed.visibleColumns.length > 0
            ? parsed.visibleColumns
            : allIds,
      };
    }
  } catch {
    // ignore corrupt data
  }
  return { pageSize: DEFAULT_PAGE_SIZE, visibleColumns: allIds };
}

function savePrefs(serviceKey: string, prefs: PersistedPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`prefs_${serviceKey}`, JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

function ResourceTableInner<T extends object>({
  serviceKey,
  columnDefinitions,
  items,
  loading = false,
  selectedItems = [],
  onSelectionChange,
  filteringText: externalFilterText,
  onFilteringChange: externalOnFilteringChange,
  filteringPlaceholder = "Search",
  currentPageIndex: externalPageIndex,
  pagesCount: externalPagesCount,
  onPageChange: externalOnPageChange,
  preferences: externalPreferences,
  onPreferencesChange: externalOnPreferencesChange,
  header: customHeader,
  resourceName = "Resources",
  actionButtons,
  onRefresh,
  emptyTitle,
  emptyDescription,
  createButtonLabel,
  onCreateClick,
  trackBy,
}: ResourceTableProps<T>) {
  // ── Column ID list ─────────────────────────────────────────────────────────
  const allColumnIds = useMemo(
    () =>
      columnDefinitions
        .map((c) => c.id)
        .filter((id): id is string => id !== undefined),
    [columnDefinitions]
  );

  // ── Internal preferences (used when caller does not control them) ──────────
  const [internalPageSize, setInternalPageSize] =
    useState<number>(DEFAULT_PAGE_SIZE);
  const [internalVisibleColumns, setInternalVisibleColumns] =
    useState<string[]>(allColumnIds);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  useEffect(() => {
    const saved = loadPrefs(serviceKey, allColumnIds);
    setInternalPageSize(saved.pageSize);
    setInternalVisibleColumns(
      saved.visibleColumns.length > 0 ? saved.visibleColumns : allColumnIds
    );
    setPrefsLoaded(true);
    // allColumnIds is derived from columnDefinitions; serviceKey never changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceKey]);

  const isPrefsControlled = externalPreferences !== undefined;

  const pageSize = isPrefsControlled
    ? (externalPreferences?.pageSize ?? DEFAULT_PAGE_SIZE)
    : internalPageSize;

  const visibleColumns = isPrefsControlled
    ? ((externalPreferences?.visibleContent as string[] | undefined) ??
      allColumnIds)
    : internalVisibleColumns;

  const handlePreferencesConfirm = useCallback(
    ({ detail }: { detail: CollectionPreferencesProps.Preferences }) => {
      const newPageSize = detail.pageSize ?? DEFAULT_PAGE_SIZE;
      const newVisible =
        (detail.visibleContent as string[] | undefined) ?? allColumnIds;

      if (isPrefsControlled && externalOnPreferencesChange) {
        externalOnPreferencesChange(detail);
      } else {
        setInternalPageSize(newPageSize);
        setInternalVisibleColumns(newVisible);
        savePrefs(serviceKey, {
          pageSize: newPageSize,
          visibleColumns: newVisible,
        });
      }
      setInternalCurrentPage(1);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serviceKey, allColumnIds, isPrefsControlled, externalOnPreferencesChange]
  );

  // ── Internal filter state ──────────────────────────────────────────────────
  const [internalFilterText, setInternalFilterText] = useState("");
  const filterText =
    externalFilterText !== undefined ? externalFilterText : internalFilterText;

  const setFilterText = useCallback(
    (text: string) => {
      if (externalOnFilteringChange) {
        externalOnFilteringChange(text);
      } else {
        setInternalFilterText(text);
      }
    },
    [externalOnFilteringChange]
  );

  // ── Sorting state ──────────────────────────────────────────────────────────
  const [sortingColumn, setSortingColumn] =
    useState<TableProps.SortingColumn<T> | null>(null);
  const [sortingDescending, setSortingDescending] = useState(false);

  // ── Internal pagination state ──────────────────────────────────────────────
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);

  // Reset to page 1 on filter change
  useEffect(() => {
    setInternalCurrentPage(1);
  }, [filterText]);

  // ── Client-side filtering ──────────────────────────────────────────────────
  const filteredItems = useMemo(() => {
    if (!filterText.trim()) return items;
    const lower = filterText.toLowerCase();
    return items.filter((item) =>
      Object.values(item as Record<string, unknown>).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lower);
      })
    );
  }, [items, filterText]);

  // ── Client-side sorting ────────────────────────────────────────────────────
  const sortedItems = useMemo(() => {
    if (!sortingColumn) return filteredItems;

    const field = sortingColumn.sortingField as keyof T | undefined;
    const comparator = sortingColumn.sortingComparator;

    if (!field && !comparator) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      let cmp = 0;
      if (comparator) {
        cmp = comparator(a, b);
      } else if (field) {
        const aVal = a[field];
        const bVal = b[field];
        if (aVal === bVal) cmp = 0;
        else if (aVal === null || aVal === undefined) cmp = -1;
        else if (bVal === null || bVal === undefined) cmp = 1;
        else cmp = aVal < bVal ? -1 : 1;
      }
      return sortingDescending ? -cmp : cmp;
    });
  }, [filteredItems, sortingColumn, sortingDescending]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const computedPagesCount = Math.max(
    1,
    Math.ceil(sortedItems.length / pageSize)
  );

  // Resolve whether pagination is externally controlled
  const isPaginationControlled =
    externalPageIndex !== undefined && externalPagesCount !== undefined;

  const pagesCount = isPaginationControlled
    ? externalPagesCount!
    : computedPagesCount;

  const rawCurrentPage = isPaginationControlled
    ? externalPageIndex!
    : internalCurrentPage;

  const currentPage = Math.min(rawCurrentPage, pagesCount);

  const pagedItems = useMemo(() => {
    // When pagination is externally controlled the caller is responsible for
    // passing pre-paginated items, so we render them as-is.
    if (isPaginationControlled) return sortedItems;
    const start = (currentPage - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPage, pageSize, isPaginationControlled]);

  const handlePageChange = useCallback(
    (page: number) => {
      if (isPaginationControlled && externalOnPageChange) {
        externalOnPageChange(page);
      } else {
        setInternalCurrentPage(page);
      }
    },
    [isPaginationControlled, externalOnPageChange]
  );

  // ── Visible column definitions ─────────────────────────────────────────────
  const visibleColumnDefs = useMemo(
    () =>
      prefsLoaded || isPrefsControlled
        ? columnDefinitions.filter(
            (c) => c.id === undefined || visibleColumns.includes(c.id)
          )
        : columnDefinitions,
    [columnDefinitions, visibleColumns, prefsLoaded, isPrefsControlled]
  );

  // ── CollectionPreferences shape ────────────────────────────────────────────
  const preferences: CollectionPreferencesProps.Preferences = {
    pageSize,
    visibleContent: visibleColumns,
  };

  // ── Generated header (used when caller does not supply `header`) ───────────
  const selCount = selectedItems.length;
  const totalCount = items.length;
  const counterLabel =
    selCount > 0
      ? `${resourceName} (${selCount} of ${totalCount} selected)`
      : `${resourceName} (${totalCount})`;

  const generatedHeader = (
    <Header
      counter={counterLabel}
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          {onRefresh && (
            <Button
              iconName="refresh"
              onClick={onRefresh}
              ariaLabel="Refresh"
            />
          )}
          {actionButtons}
        </SpaceBetween>
      }
    >
      {resourceName}
    </Header>
  );

  // ── Empty state ────────────────────────────────────────────────────────────
  const emptyContent = (
    <Box textAlign="center" color="inherit">
      <Box variant="strong" textAlign="center" color="inherit">
        {emptyTitle ?? `No ${resourceName.toLowerCase()} found`}
      </Box>
      {emptyDescription && (
        <Box variant="p" padding={{ bottom: "s" }} color="inherit">
          {emptyDescription}
        </Box>
      )}
      {createButtonLabel && onCreateClick && (
        <Button onClick={onCreateClick}>{createButtonLabel}</Button>
      )}
    </Box>
  );

  return (
    <Table<T>
      trackBy={trackBy}
      columnDefinitions={visibleColumnDefs}
      items={pagedItems}
      loading={loading}
      loadingText={`Loading ${resourceName.toLowerCase()}…`}
      selectionType="multi"
      selectedItems={selectedItems}
      onSelectionChange={({ detail }) =>
        onSelectionChange?.(detail.selectedItems as T[])
      }
      sortingColumn={sortingColumn ?? undefined}
      sortingDescending={sortingDescending}
      onSortingChange={({ detail }) => {
        setSortingColumn(detail.sortingColumn);
        setSortingDescending(detail.isDescending ?? false);
        setInternalCurrentPage(1);
      }}
      filter={
        <TextFilter
          filteringText={filterText}
          filteringPlaceholder={filteringPlaceholder}
          filteringAriaLabel={`Filter ${resourceName.toLowerCase()}`}
          onChange={({ detail }) => setFilterText(detail.filteringText)}
          countText={
            filterText
              ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
              : undefined
          }
        />
      }
      pagination={
        <Pagination
          currentPageIndex={currentPage}
          pagesCount={pagesCount}
          onChange={({ detail }) =>
            handlePageChange(detail.currentPageIndex)
          }
          ariaLabels={{
            nextPageLabel: "Next page",
            previousPageLabel: "Previous page",
            pageLabel: (n) => `Page ${n}`,
          }}
        />
      }
      preferences={
        <CollectionPreferences
          title="Preferences"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          preferences={preferences}
          onConfirm={handlePreferencesConfirm}
          pageSizePreference={{
            title: "Page size",
            options: [
              { value: 10, label: "10 resources" },
              { value: 25, label: "25 resources" },
              { value: 50, label: "50 resources" },
              { value: 100, label: "100 resources" },
            ],
          }}
          visibleContentPreference={{
            title: "Select visible columns",
            options: [
              {
                label: "Columns",
                options: allColumnIds.map((id) => ({
                  id,
                  label:
                    columnDefinitions
                      .find((c) => c.id === id)
                      ?.header?.toString() ?? id,
                  editable: true,
                })),
              },
            ],
          }}
        />
      }
      header={customHeader ?? generatedHeader}
      empty={emptyContent}
    />
  );
}

/**
 * Generic paginated, filterable, sortable, multi-select Cloudscape table.
 *
 * Supports both fully managed (internal state) and controlled (external props)
 * modes for filtering, pagination, and column preferences.
 *
 * Column visibility and page size are persisted to
 * `localStorage["prefs_{serviceKey}"]` when running in internal mode.
 */
const ResourceTable = memo(ResourceTableInner) as <T extends object>(
  props: ResourceTableProps<T>
) => React.ReactElement;

export default ResourceTable;
