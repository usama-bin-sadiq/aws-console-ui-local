"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface Job {
  JobId?: string;
  Name?: string;
  State?: string;
  Type?: string;
  Progress?: number;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Job>[] = [
  {
    id: "name",
    header: "Name",
    cell: (item) => item.Name || "—",
    sortingField: "Name",
    isRowHeader: true,
  },
  {
    id: "id",
    header: "Job ID",
    cell: (item) => <CopyableText value={String(item.JobId || "")} />,
    sortingField: "JobId",
  },
  {
    id: "state",
    header: "State",
    cell: (item) => {
      let status: "success" | "warning" | "error" | "info" = "info";
      if (item.State === "COMPLETED") status = "success";
      else if (item.State === "RUNNING" || item.State === "PENDING") status = "warning";
      else if (item.State === "FAILED") status = "error";
      return <StatusBadge status={status} label={item.State || "unknown"} />;
    },
    sortingField: "State",
  },
  {
    id: "type",
    header: "Type",
    cell: (item) => item.Type || "—",
    sortingField: "Type",
  },
  {
    id: "progress",
    header: "Progress",
    cell: (item) => `${item.Progress ?? 0}%`,
    sortingField: "Progress",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["name", "id", "state", "type", "progress"];

export default function MigrationHubPage() {
  const [items, setItems] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Job[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/migration-hub");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.jobs) ? data.jobs : []);
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
      serviceName="AWS Migration Hub"
      serviceHref="/migration-hub"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Migration Hub", href: "/migration-hub" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "migration-hub",
          resourceName: "Migration jobs",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "JobId",
          createLabel: "Create migration job",
          filterPlaceholder: "Filter migration jobs",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as Job[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
