"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface Workspace {
  WorkspaceId?: string;
  DirectoryId?: string;
  UserName?: string;
  State?: string;
  IpAddress?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Workspace>[] = [
  {
    id: "name",
    header: "User",
    cell: (item) => item.UserName || "—",
    sortingField: "UserName",
    isRowHeader: true,
  },
  {
    id: "id",
    header: "Workspace ID",
    cell: (item) => <CopyableText value={String(item.WorkspaceId || "")} />,
    sortingField: "WorkspaceId",
  },
  {
    id: "state",
    header: "State",
    cell: (item) => {
      let status: "success" | "warning" | "error" | "info" = "info";
      if (item.State === "AVAILABLE") status = "success";
      else if (item.State === "PENDING") status = "warning";
      else if (item.State === "TERMINATED") status = "error";
      return <StatusBadge status={status} label={item.State || "unknown"} />;
    },
    sortingField: "State",
  },
  {
    id: "ip",
    header: "IP Address",
    cell: (item) => item.IpAddress || "—",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["name", "id", "state", "ip"];

export default function WorkSpacesPage() {
  const [items, setItems] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Workspace[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/workspaces");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.workspaces) ? data.workspaces : []);
    } catch (_err: unknown) {
      setError(null);
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchItems();
    });
  }, [fetchItems]);

  return (
    <ServiceLayout
      serviceName="AWS WorkSpaces"
      serviceHref="/workspaces"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "WorkSpaces", href: "/workspaces" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "workspaces",
          resourceName: "Workspaces",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "WorkspaceId",
          createLabel: "Launch workspace",
          filterPlaceholder: "Filter workspaces",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as Workspace[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
