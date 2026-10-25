"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface SearchResult {
  QueryId?: string;
  QueryString?: string;
  ResourceCount?: number;
  Status?: string;
  CreatedAt?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<SearchResult>[] = [
  {
    id: "id",
    header: "Query ID",
    cell: (item) => <CopyableText value={String(item.QueryId || "")} />,
    sortingField: "QueryId",
    isRowHeader: true,
  },
  {
    id: "query",
    header: "Query",
    cell: (item) => item.QueryString || "—",
  },
  {
    id: "status",
    header: "Status",
    cell: (item) => {
      let status: "success" | "warning" | "error" | "info" = "info";
      if (item.Status === "SUCCEEDED") status = "success";
      else if (item.Status === "RUNNING") status = "warning";
      else if (item.Status === "FAILED") status = "error";
      return <StatusBadge status={status} label={item.Status || "unknown"} />;
    },
    sortingField: "Status",
  },
  {
    id: "count",
    header: "Resources",
    cell: (item) => item.ResourceCount ?? 0,
    sortingField: "ResourceCount",
  },
  {
    id: "created",
    header: "Created",
    cell: (item) => (item.CreatedAt ? new Date(item.CreatedAt).toLocaleString() : "—"),
    sortingField: "CreatedAt",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["id", "query", "status", "count", "created"];

export default function ResourceExplorerPage() {
  const [items, setItems] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SearchResult[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/resource-explorer");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.searches) ? data.searches : []);
    } catch (_err: unknown) {
      setError(null);
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  return (
    <ServiceLayout
      serviceName="AWS Resource Explorer"
      serviceHref="/resource-explorer"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Resource Explorer", href: "/resource-explorer" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "resource-explorer",
          resourceName: "Searches",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "QueryId",
          createLabel: "Create search",
          filterPlaceholder: "Filter searches",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as SearchResult[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
