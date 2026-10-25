"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface Quota {
  QuotaCode?: string;
  QuotaName?: string;
  Value?: number;
  Unit?: string;
  Status?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Quota>[] = [
  {
    id: "name",
    header: "Quota Name",
    cell: (item) => item.QuotaName || "—",
    sortingField: "QuotaName",
    isRowHeader: true,
  },
  {
    id: "code",
    header: "Quota Code",
    cell: (item) => item.QuotaCode || "—",
    sortingField: "QuotaCode",
  },
  {
    id: "value",
    header: "Value",
    cell: (item) => item.Value ?? 0,
    sortingField: "Value",
  },
  {
    id: "unit",
    header: "Unit",
    cell: (item) => item.Unit || "—",
    sortingField: "Unit",
  },
  {
    id: "status",
    header: "Status",
    cell: (item) => {
      let status: "success" | "warning" | "error" | "info" = "info";
      if (item.Status === "normal") status = "success";
      else if (item.Status === "at-risk") status = "warning";
      else if (item.Status === "critical") status = "error";
      return <StatusBadge status={status} label={item.Status || "unknown"} />;
    },
    sortingField: "Status",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["name", "code", "value", "unit", "status"];

export default function ServiceQuotasPage() {
  const [items, setItems] = useState<Quota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Quota[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/service-quotas");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.quotas) ? data.quotas : []);
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
      serviceName="AWS Service Quotas"
      serviceHref="/service-quotas"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Service Quotas", href: "/service-quotas" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "service-quotas",
          resourceName: "Quotas",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "QuotaCode",
          filterPlaceholder: "Filter quotas",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as Quota[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
