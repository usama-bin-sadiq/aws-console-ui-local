"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface Gateway {
  GatewayId?: string;
  Name?: string;
  State?: string;
  Type?: string;
  IpAddress?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Gateway>[] = [
  {
    id: "name",
    header: "Name",
    cell: (item) => item.Name || "—",
    sortingField: "Name",
    isRowHeader: true,
  },
  {
    id: "id",
    header: "Gateway ID",
    cell: (item) => <CopyableText value={String(item.GatewayId || "")} />,
    sortingField: "GatewayId",
  },
  {
    id: "state",
    header: "State",
    cell: (item) => {
      let status: "success" | "warning" | "error" | "info" = "info";
      if (item.State === "ACTIVE") status = "success";
      else if (item.State === "INITIALIZING") status = "warning";
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
    id: "ip",
    header: "IP Address",
    cell: (item) => item.IpAddress || "—",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["name", "id", "state", "type", "ip"];

export default function StorageGatewayPage() {
  const [items, setItems] = useState<Gateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Gateway[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/storage-gateway");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.gateways) ? data.gateways : []);
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
      serviceName="AWS Storage Gateway"
      serviceHref="/storage-gateway"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Storage Gateway", href: "/storage-gateway" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "storage-gateway",
          resourceName: "Gateways",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "GatewayId",
          createLabel: "Create gateway",
          filterPlaceholder: "Filter gateways",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as Gateway[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
