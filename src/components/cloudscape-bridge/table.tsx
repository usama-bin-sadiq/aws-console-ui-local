"use client";

/**
 * Table.
 *
 * The canvases' list archetype is:
 *
 *   .card > header (.cardTitle + .btns)   -- the title, "(n)", and actions
 *          > .toolbar (filter + right-aligned controls)
 *          > .tablewrap > table (th 10px 20px / td 12px 20px, --border2 rules)
 *
 * Cloudscape's Table carries a lot of behaviour this emulator-backed console
 * does not exercise: resizable columns, drag-to-reorder, per-cell editors,
 * server-side sticky pagination. What the app actually passes is
 * columnDefinitions + items + a header/actions/filter/selection surface, and
 * that is what this implements.
 *
 * The one thing worth calling out: Cloudscape's `Table` puts the card chrome in
 * the *page*, not in the Table -- but nearly every route here renders
 * `<Table header=... actions=... filter=.../>` with no wrapping Container, so
 * the shim has to own that chrome to match the canvases.
 */

import React from "react";
import s from "../design/design.module.css";

type AnyItem = any;

/**
 * Cloudscape's `TableProps` is both a type and a namespace carrying
 * `ColumnDefinition<T>`, `SelectionChangeDetail<T>` and friends. Pages annotate
 * their column arrays as `TableProps.ColumnDefinition<X>[]`, so the shim has to
 * provide the same nested member -- without it the annotation resolves to any
 * and every inline `cell: (item) => item.Foo` becomes an implicit-any error.
 */
export namespace TableProps {
  export type ColumnDefinition<T = AnyItem> = {
    id: string;
    header: string;
    cell: (item: T, index?: number) => React.ReactNode;
    sortingField?: string;
    sortingComparator?: (a: T, b: T) => number;
    /** Real Cloudscape passes (item, index); mirror that so call sites match. */
    ariaLabel?: string | ((item: T, index?: number) => string);
    minWidth?: number;
    width?: number;
    isRowHeader?: boolean;
    editConfig?: { editing?: boolean; readonly?: boolean; onCellEdit?: (item: T) => void };
    onCellContextMenu?: (event: { detail: { item: T } }) => void;
  };

  export type SelectionChangeDetail<T = AnyItem> = { selectedItems: T[] };
  export type SelectionType = "none" | "single" | "multi";
}

export type TableProps<T = AnyItem> = {
  columnDefinitions: readonly {
    id: string;
    header: string;
    cell: (item: T, index?: number) => React.ReactNode;
    /** Sorted client-side when set to the item's field name. */
    sortingField?: string;
    ariaLabel?: string | ((item: T, index?: number) => string);
    minWidth?: number;
    width?: number;
    /** Renders the cell as a row header for screen readers. */
    isRowHeader?: boolean;
    /** Marks the cell as the row's edit control. Unused here but typed. */
    editConfig?: { editing?: boolean; readonly?: boolean };
    /** Undo the last cell edit. Present on some pages. */
    onCellContextMenu?: (event: { detail: { item: T } }) => void;
  }[];
  items: readonly T[];
  /** Card title. Also accepts a node and an optional count is rendered after it. */
  header?: React.ReactNode;
  actions?: React.ReactNode;
  counter?: string | number;
  /** Rendered in the toolbar between the filter and the right-hand controls. */
  secondaryHeader?: React.ReactNode;
  /** Inline search box, immediately under the card header. */
  filter?: React.ReactNode;
  filterPlaceholder?: string;
  loading?: boolean;
  loadingText?: string;
  empty?: React.ReactNode;
  trackBy?: string | ((item: T) => string);
  selectionType?: "none" | "single" | "multi";
  selectedItems?: readonly T[];
  onSelectionChange?: (event: { detail: { selectedItems: T[] } }) => void;
  selectionLabel?: (item: T, index?: number) => string;
  allItemsSelectionLabel?: string;
  variant?: "container" | "embedded" | "borderless";
  pagination?: React.ReactNode;
  preferences?: React.ReactNode;
  wrapLines?: boolean;
  stripedRows?: boolean;
  resizableColumns?: boolean;
  onRowClick?: (event: { detail: { item: T } }) => void;
  onClick?: (event: { detail: { item?: AnyItem } }) => void;
  ariaLabels?: Record<string, string>;
  stickyColumns?: { first?: number; last?: number };
  columnDefinitionsMemo?: unknown;
  [key: string]: unknown;
};

const CHECK = (
  props: React.InputHTMLAttributes<HTMLInputElement> & { indeterminate?: boolean },
) => {
  const ref = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(props.indeterminate);
  }, [props.indeterminate]);
  return (
    <input
      {...props}
      ref={ref}
      type="checkbox"
      style={{ width: 16, height: 16, accentColor: "#006ce0", flex: "none" }}
    />
  );
};

export function Table<T = AnyItem>(props: TableProps<T>) {
  const {
    columnDefinitions,
    items,
    header,
    actions,
    counter,
    filter,
    filterPlaceholder = "Filter",
    loading = false,
    loadingText = "Loading",
    empty,
    trackBy = "id",
    selectionType = "none",
    selectedItems = [],
    onSelectionChange,
    selectionLabel,
    allItemsSelectionLabel,
    pagination,
    preferences,
    onRowClick,
    ariaLabels,
  } = props;

  const rows = React.useMemo(() => [...items], [items]);
  const selected = React.useMemo(() => [...selectedItems], [selectedItems]);

  const keyOf = React.useCallback(
    (item: T) =>
      typeof trackBy === "function" ? trackBy(item) : String((item as AnyItem)[trackBy] ?? ""),
    [trackBy],
  );

  const isSelected = React.useCallback(
    (item: T) => selected.some((i) => keyOf(i) === keyOf(item)),
    [selected, keyOf],
  );

  const toggle = (item: T) => {
    if (selectionType === "single") {
      onSelectionChange?.({ detail: { selectedItems: isSelected(item) ? [] : [item] } });
      return;
    }
    onSelectionChange?.({
      detail: {
        selectedItems: isSelected(item)
          ? selected.filter((i) => keyOf(i) !== keyOf(item))
          : [...selected, item],
      },
    });
  };

  const allSelected = rows.length > 0 && selected.length === rows.length;
  const someSelected = selected.length > 0 && !allSelected;

  const columns = React.useMemo(() => [...columnDefinitions], [columnDefinitions]);
  const hasChrome =
    header || actions || counter !== undefined || filter || pagination || preferences;

  const table = (
    <div className={s.tablewrap}>
      <table className={s.table}>
        <thead>
          <tr>
            {selectionType !== "none" ? (
              <th scope="col" className={s.th} style={{ width: 40 }}>
                {selectionType === "multi" ? (
                  <CHECK
                    aria-label={allItemsSelectionLabel ?? "Select all"}
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={() =>
                      onSelectionChange?.({
                        detail: { selectedItems: allSelected || someSelected ? [] : [...rows] },
                      })
                    }
                  />
                ) : null}
              </th>
            ) : null}
            {columns.map((c) => (
              <th
                key={c.id}
                scope="col"
                className={s.th}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item, index) => {
            const chosen = isSelected(item);
            return (
              <tr
                key={keyOf(item) || index}
                className={s.tr}
                onClick={onRowClick ? () => onRowClick({ detail: { item } }) : undefined}
              >
                {selectionType !== "none" ? (
                  <th scope="row" className={s.th} style={{ width: 40 }}>
                    <CHECK
                      aria-label={selectionLabel?.(item, index) ?? "Select row"}
                      checked={chosen}
                      onChange={() => toggle(item)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </th>
                ) : null}
                {columns.map((c) => (
                  <td key={c.id} className={s.td}>
                    {typeof c.ariaLabel === "function" ? (
                      <span aria-label={c.ariaLabel(item, index)} />
                    ) : typeof c.ariaLabel === "string" ? (
                      <span aria-label={c.ariaLabel} />
                    ) : null}
                    {c.cell(item, index)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const body = (() => {
    if (loading) {
      return (
        <div className={s.loadRow} role="status">
          <span className={s.spin} aria-label="Loading" />
          {loadingText}
        </div>
      );
    }
    if (rows.length === 0 && empty) return <div className={s.empty}>{empty}</div>;
    return table;
  })();

  if (!hasChrome) return body;

  return (
    <section className={s.card}>
      {header || actions ? (
        <header className={s.cardHeader}>
          <h2 className={s.cardTitle}>
            {header}
            {counter !== undefined && counter !== null ? (
              <span className={s.cardTitleSmall}>({counter})</span>
            ) : null}
          </h2>
          {actions || preferences ? (
            <div className={s.btns}>
              {preferences}
              {actions}
            </div>
          ) : null}
        </header>
      ) : null}

      {filter ? (
        <div className={s.toolbar}>
          <span style={{ flex: "1 1 220px", minWidth: 0, maxWidth: 360 }}>{filter}</span>
          {pagination}
        </div>
      ) : null}

      <div style={{ overflowX: "auto" }}>{body}</div>

      {!filter && pagination ? (
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--d-border2, #e9ebed)" }}>
          {pagination}
        </div>
      ) : null}
    </section>
  );
}

export default Table;
