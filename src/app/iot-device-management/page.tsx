"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface Thing {
  ThingId?: string;
  ThingName?: string;
  Type?: string;
  State?: string;
  CreatedAt?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Thing>[] = [
  {
    id: "name",
    header: "Name",
    cell: (item) => item.ThingName || "—",
    sortingField: "ThingName",
    isRowHeader: true,
  },
  {
    id: "id",
    header: "Thing ID",
    cell: (item) => <CopyableText value={String(item.ThingId || "")} />,
    sortingField: "ThingId",
  },
  {
    id: "type",
    header: "Type",
    cell: (item) => item.Type || "—",
    sortingField: "Type",
  },
  {
    id: "state",
    header: "State",
    cell: (item) => {
      let status: "success" | "warning" | "error" | "info" = "info";
      if (item.State === "ACTIVE") status = "success";
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

const DEFAULT_VISIBLE_COLUMNS = ["name", "id", "type", "state", "created"];

export default function IotDeviceManagementPage() {
  const [items, setItems] = useState<Thing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Thing[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/iot-device-management");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.things) ? data.things : []);
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
      serviceName="AWS IoT Device Management"
      serviceHref="/iot-device-management"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "IoT Device Management", href: "/iot-device-management" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "iot-device-management",
          resourceName: "Things",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "ThingId",
          createLabel: "Create thing",
          filterPlaceholder: "Filter things",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as Thing[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
