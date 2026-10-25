"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface Fleet {
  FleetId?: string;
  Name?: string;
  State?: string;
  Type?: string;
  CreatedTime?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Fleet>[] = [
  {
    id: "name",
    header: "Name",
    cell: (item) => item.Name || "—",
    sortingField: "Name",
    isRowHeader: true,
  },
  {
    id: "id",
    header: "Fleet ID",
    cell: (item) => <CopyableText value={String(item.FleetId || "")} />,
    sortingField: "FleetId",
  },
  {
    id: "state",
    header: "State",
    cell: (item) => {
      let status: "success" | "warning" | "error" | "info" = "info";
      if (item.State === "RUNNING") status = "success";
      else if (item.State === "STARTING") status = "warning";
      else if (item.State === "STOPPED") status = "error";
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
    id: "created",
    header: "Created",
    cell: (item) => (item.CreatedTime ? new Date(item.CreatedTime).toLocaleString() : "—"),
    sortingField: "CreatedTime",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["name", "id", "state", "type", "created"];

export default function AppStreamPage() {
  const [items, setItems] = useState<Fleet[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Fleet[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/appstream");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.fleets) ? data.fleets : []);
    } catch {
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
      serviceName="AWS AppStream"
      serviceHref="/appstream"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "AppStream", href: "/appstream" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "appstream",
          resourceName: "Fleets",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "FleetId",
          createLabel: "Create fleet",
          filterPlaceholder: "Filter fleets",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as Fleet[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
