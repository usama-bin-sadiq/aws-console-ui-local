"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface LandingZone {
  LandingZoneId?: string;
  Name?: string;
  Status?: string;
  CreatedAt?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<LandingZone>[] = [
  {
    id: "name",
    header: "Name",
    cell: (item) => item.Name || "—",
    sortingField: "Name",
    isRowHeader: true,
  },
  {
    id: "id",
    header: "Landing Zone ID",
    cell: (item) => <CopyableText value={String(item.LandingZoneId || "")} />,
    sortingField: "LandingZoneId",
  },
  {
    id: "status",
    header: "Status",
    cell: (item) => {
      let status: "success" | "warning" | "error" | "info" = "info";
      if (item.Status === "active") status = "success";
      else if (item.Status === "creating") status = "warning";
      else if (item.Status === "failed") status = "error";
      return <StatusBadge status={status} label={item.Status || "unknown"} />;
    },
    sortingField: "Status",
  },
  {
    id: "created",
    header: "Created",
    cell: (item) => (item.CreatedAt ? new Date(item.CreatedAt).toLocaleString() : "—"),
    sortingField: "CreatedAt",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["name", "id", "status", "created"];

export default function ControlTowerPage() {
  const [items, setItems] = useState<LandingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<LandingZone[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/control-tower");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.landingZones) ? data.landingZones : []);
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
      serviceName="AWS Control Tower"
      serviceHref="/control-tower"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Control Tower", href: "/control-tower" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "control-tower",
          resourceName: "Landing zones",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "LandingZoneId",
          createLabel: "Create landing zone",
          filterPlaceholder: "Filter landing zones",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as LandingZone[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
