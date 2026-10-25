"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface Task {
  TaskId?: string;
  Name?: string;
  Status?: string;
  Type?: string;
  CreatedAt?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Task>[] = [
  {
    id: "name",
    header: "Name",
    cell: (item) => item.Name || "—",
    sortingField: "Name",
    isRowHeader: true,
  },
  {
    id: "id",
    header: "Task ID",
    cell: (item) => <CopyableText value={String(item.TaskId || "")} />,
    sortingField: "TaskId",
  },
  {
    id: "status",
    header: "Status",
    cell: (item) => {
      let status: "success" | "warning" | "error" | "info" = "info";
      if (item.Status === "available") status = "success";
      else if (item.Status === "creating") status = "warning";
      else if (item.Status === "failed") status = "error";
      return <StatusBadge status={status} label={item.Status || "unknown"} />;
    },
    sortingField: "Status",
  },
  {
    id: "type",
    header: "Type",
    cell: (item) => item.Type || "—",
    sortingField: "Type",
  },
  {
    id: "created",
    header: "Created",
    cell: (item) => (item.CreatedAt ? new Date(item.CreatedAt).toLocaleString() : "—"),
    sortingField: "CreatedAt",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["name", "id", "status", "type", "created"];

export default function DataSyncPage() {
  const [items, setItems] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Task[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/datasync");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.tasks) ? data.tasks : []);
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
      serviceName="AWS DataSync"
      serviceHref="/datasync"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "DataSync", href: "/datasync" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "datasync",
          resourceName: "Tasks",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "TaskId",
          createLabel: "Create task",
          filterPlaceholder: "Filter tasks",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as Task[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
