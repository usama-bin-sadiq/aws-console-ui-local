"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface Lake {
  LakeArn?: string;
  Name?: string;
  State?: string;
  CreatedAt?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Lake>[] = [
  {
    id: "name",
    header: "Name",
    cell: (item) => item.Name || "—",
    sortingField: "Name",
    isRowHeader: true,
  },
  {
    id: "arn",
    header: "ARN",
    cell: (item) => <CopyableText value={String(item.LakeArn || "")} />,
    sortingField: "LakeArn",
  },
  {
    id: "state",
    header: "State",
    cell: (item) => {
      let status: "success" | "warning" | "error" | "info" = "info";
      if (item.State === "AVAILABLE") status = "success";
      else if (item.State === "CREATING") status = "warning";
      else if (item.State === "FAILED") status = "error";
      return <StatusBadge status={status} label={item.State || "unknown"} />;
    },
    sortingField: "State",
  },
  {
    id: "created",
    header: "Created",
    cell: (item) => (item.CreatedAt ? new Date(item.CreatedAt).toLocaleString() : "—"),
    sortingField: "CreatedAt",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["name", "arn", "state", "created"];

export default function LakeFormationPage() {
  const [items, setItems] = useState<Lake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Lake[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/lake-formation");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.lakes) ? data.lakes : []);
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
      serviceName="AWS Lake Formation"
      serviceHref="/lake-formation"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Lake Formation", href: "/lake-formation" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "lake-formation",
          resourceName: "Data lakes",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "LakeArn",
          createLabel: "Create data lake",
          filterPlaceholder: "Filter data lakes",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as Lake[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
