import type { TableProps } from "@cloudscape-design/components/table";
import type { CollectionPreferencesProps } from "@cloudscape-design/components/collection-preferences";

/**
 * Action definition for table header buttons
 */
export interface ActionDefinition<T> {
  id: string;
  label: string;
  disabled?: boolean | ((selectedItems: T[]) => boolean);
  danger?: boolean;
  onClick: (selectedItems: T[]) => void;
}

/**
 * ResourceTable configuration
 */
export interface ResourceTableConfig<T> {
  /** Unique key for localStorage persistence */
  serviceKey: string;

  /** Human-readable resource name (e.g., "Instances", "Buckets") */
  resourceName: string;

  /** Column definitions for Cloudscape Table */
  columnDefinitions: ReadonlyArray<TableProps.ColumnDefinition<T>>;

  /** All visible column IDs */
  defaultVisibleColumns: string[];

  /** TrackBy field for selection */
  trackBy: keyof T;

  /** Create button label */
  createLabel?: string;

  /** Create button href */
  createHref?: string;

  /** Placeholder text for filter */
  filterPlaceholder?: string;

  /** Empty state title */
  emptyTitle?: string;

  /** Empty state description */
  emptyDescription?: string;
}

/**
 * ResourceTable props
 */
export interface ResourceTableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  config: ResourceTableConfig<T>;

  /** All items (unfiltered, unpaginated) */
  items: T[];

  /** Loading state */
  loading?: boolean;

  /** Selected items */
  selectedItems?: T[];

  /** Selection change handler */
  onSelectionChange?: (items: T[]) => void;

  /** Refresh handler */
  onRefresh?: () => void;

  /** Action buttons */
  actions?: ActionDefinition<T>[];

  /** Create button click handler (if not using createHref) */
  onCreateClick?: () => void;

  /** Custom filter function */
  filterFunction?: (item: T, text: string) => void;
}

/**
 * Persisted table preferences
 */
export interface PersistedPrefs {
  pageSize: number;
  visibleColumns: string[];
}
