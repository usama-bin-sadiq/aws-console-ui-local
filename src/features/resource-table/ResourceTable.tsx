"use client";

import React, { useMemo, useCallback, useState, useEffect } from "react";
import Table from "@cloudscape-design/components/table";
import type { TableProps } from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import type { CollectionPreferencesProps } from "@cloudscape-design/components/collection-preferences";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import { useRouter } from "next/navigation";
import { useResourcePreferences } from "./hooks/useResourcePreferences";
import "./resource-table.css";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ResourceTableProps, ActionDefinition } from "./types";

export function ResourceTable<T extends Record<string, unknown> = Record<string, unknown>>({
  config,
  items,
  loading = false,
  selectedItems = [],
  onSelectionChange,
  onRefresh,
  actions,
  onCreateClick,
}: ResourceTableProps<T>) {
  const router = useRouter();
  const {
    serviceKey,
    resourceName,
    columnDefinitions,
    defaultVisibleColumns,
    trackBy,
    createLabel,
    createHref,
    filterPlaceholder,
    emptyTitle,
    emptyDescription,
  } = config;

  // ── Preferences ─────────────────────────────────────────────
  const { pageSize, visibleColumns, loaded, handlePreferencesConfirm } = useResourcePreferences(
    serviceKey,
    defaultVisibleColumns,
  );

  // ── Filter state ────────────────────────────────────────────
  const [filterText, setFilterText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText]);

  // ── Client-side filtering ───────────────────────────────────
  const filteredItems = useMemo(() => {
    if (!filterText.trim()) return items;
    const lower = filterText.toLowerCase();
    return items.filter((item) =>
      Object.values(item).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(lower);
      }),
    );
  }, [items, filterText]);

  // ── Sorting state ───────────────────────────────────────────
  const [sortingColumn, setSortingColumn] = useState<TableProps.SortingColumn<T> | null>(null);
  const [sortingDescending, setSortingDescending] = useState(false);

  // ── Sorted items ────────────────────────────────────────────
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

  // ── Pagination ──────────────────────────────────────────────
  const pagesCount = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const currentPageClamped = Math.min(currentPage, pagesCount);

  const pagedItems = useMemo(() => {
    const start = (currentPageClamped - 1) * pageSize;
    return sortedItems.slice(start, start + pageSize);
  }, [sortedItems, currentPageClamped, pageSize]);

  // ── Visible column definitions ───────────────────────────────
  const visibleColumnDefs = useMemo(
    () =>
      loaded
        ? columnDefinitions.filter((c) => c.id === undefined || visibleColumns.includes(c.id))
        : columnDefinitions,
    [columnDefinitions, visibleColumns, loaded],
  );

  // ── Selection counter ────────────────────────────────────────
  const selCount = selectedItems.length;
  const totalCount = items.length;

  /*
   * The bare count for the card header, formatted with its own separator.
   * Header renders `counter` immediately after the title with no space, so it
   * has to carry one; and it must not be the assembled label, which is what
   * produced "UsersUsers (0)".
   */
  const headerCounter = selCount > 0 ? `${selCount} of ${totalCount}` : ` (${totalCount})`;

  // ── Action dropdown items ────────────────────────────────────
  const actionItems = useMemo(() => {
    if (!actions) return [];
    return actions.map((action) => ({
      text: action.label,
      id: action.id,
      disabled:
        typeof action.disabled === "function" ? action.disabled(selectedItems) : action.disabled,
      variant: action.danger ? ("danger" as const) : undefined,
    }));
  }, [actions, selectedItems]);

  const handleActionClick = useCallback(
    ({ detail }: { detail: { id: string } }) => {
      const action = actions?.find((a) => a.id === detail.id);
      if (action) {
        action.onClick(selectedItems);
      }
    },
    [actions, selectedItems],
  );

  // ── Create button ───────────────────────────────────────────
  const handleCreate = useCallback(() => {
    if (createHref) {
      router.push(createHref);
    } else if (onCreateClick) {
      onCreateClick();
    }
  }, [createHref, onCreateClick, router]);

  const showCreateButton = createHref || onCreateClick;

  // ── Header actions ──────────────────────────────────────────
  const headerActions = (
    <SpaceBetween direction="horizontal" size="xs">
      {onRefresh && (
        <Button key="refresh" iconName="refresh" onClick={onRefresh} ariaLabel="Refresh" />
      )}
      {actionItems.length > 0 && (
        <ButtonDropdown
          key="actions"
          items={actionItems}
          onItemClick={handleActionClick}
          disabled={selectedItems.length === 0}
          ariaLabel={`${resourceName} actions`}
        >
          Actions
        </ButtonDropdown>
      )}
      {showCreateButton && (
        <Button key="create" variant="primary" onClick={handleCreate}>
          {createLabel ?? `Create ${resourceName}`}
        </Button>
      )}
    </SpaceBetween>
  );

  // ── Empty state ─────────────────────────────────────────────
  const emptyContent = (
    <EmptyState
      title={emptyTitle ?? `No ${resourceName.toLowerCase()} found`}
      description={
        emptyDescription ??
        (filterText
          ? "No resources match your filter. Try a different search."
          : `To get started, create a new ${resourceName.toLowerCase().slice(0, -1) || "resource"}.`)
      }
      action={
        !filterText && showCreateButton
          ? {
              label:
                createLabel ?? `Create ${resourceName.toLowerCase().slice(0, -1) || "resource"}`,
              onClick: handleCreate,
            }
          : undefined
      }
    />
  );

  // ── Preferences ─────────────────────────────────────────────
  const preferences: CollectionPreferencesProps.Preferences = {
    pageSize,
    contentDisplay: defaultVisibleColumns.map((id) => ({
      id,
      visible: visibleColumns.includes(id),
    })),
  };

  // ── Render ──────────────────────────────────────────────────
  return (
    <div className="awsui_resource-table">
      <Table<T>
        trackBy={trackBy as TableProps.TrackBy<T>}
        columnDefinitions={visibleColumnDefs}
        items={pagedItems}
        loading={loading}
        loadingText={`Loading ${resourceName.toLowerCase()}...`}
        // Cells wrap instead of being nowrap, so no single value can force the
        // table wider than the card it lives in.
        wrapLines
        selectionType="multi"
        /*
          Names the selection column header. Without it the select-all checkbox
          in that header sits inside a label with no text, so it has no
          accessible name (WCAG 2.1 SC 4.1.2). This belongs to `ariaLabels`,
          not `i18nStrings`.
        */
        ariaLabels={{ selectionGroupLabel: `Select all ${resourceName.toLowerCase()}` }}
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) => onSelectionChange?.(detail.selectedItems as T[])}
        sortingColumn={sortingColumn ?? undefined}
        sortingDescending={sortingDescending}
        onSortingChange={({ detail }) => {
          setSortingColumn(detail.sortingColumn);
          setSortingDescending(detail.isDescending ?? false);
          setCurrentPage(1);
        }}
        filter={
          <TextFilter
            filteringText={filterText}
            filteringPlaceholder={filterPlaceholder ?? `Filter ${resourceName.toLowerCase()}`}
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
            currentPageIndex={currentPageClamped}
            pagesCount={pagesCount}
            onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
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
            onConfirm={({ detail }) => {
              const newPageSize = detail.pageSize ?? 25;
              const newVisible =
                (detail.contentDisplay as string[] | undefined) ?? defaultVisibleColumns;
              handlePreferencesConfirm(newPageSize, newVisible);
            }}
            pageSizePreference={{
              title: "Page size",
              options: [
                { value: 10, label: "10 resources" },
                { value: 25, label: "25 resources" },
                { value: 50, label: "50 resources" },
                { value: 100, label: "100 resources" },
              ],
            }}
            contentDisplayPreference={{
              title: "Select visible columns",
              options: defaultVisibleColumns.map((id) => ({
                id,
                label: columnDefinitions.find((c) => c.id === id)?.header?.toString() ?? id,
                editable: true,
              })),
            }}
          />
        }
        header={
          /*
           * `counter` is the bare count, not the assembled label: Header writes
           * it straight after the title, so passing "{name} (0)" produced
           * "UsersUsers (0)". The label itself is only meaningful as overlay
           * text, which is what the caller reads.
           */
          <Header counter={headerCounter} actions={headerActions}>
            {resourceName}
          </Header>
        }
        empty={emptyContent}
      />
    </div>
  );
}
