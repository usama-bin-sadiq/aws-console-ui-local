"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface Reservation {
  ReservationId?: string;
  Description?: string;
  State?: string;
  Type?: string;
  Count?: number;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Reservation>[] = [
  {
    id: "id",
    header: "Reservation ID",
    cell: (item) => <CopyableText value={String(item.ReservationId || "")} />,
    sortingField: "ReservationId",
    isRowHeader: true,
  },
  {
    id: "description",
    header: "Description",
    cell: (item) => item.Description || "—",
  },
  {
    id: "state",
    header: "State",
    cell: (item) => {
      let status: "success" | "warning" | "error" | "info" = "info";
      if (item.State === "active") status = "success";
      else if (item.State === "pending") status = "warning";
      else if (item.State === "retired") status = "error";
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
    id: "count",
    header: "Count",
    cell: (item) => item.Count ?? 0,
    sortingField: "Count",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["id", "description", "state", "type", "count"];

export default function ReservedInstancesPage() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Reservation[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/reserved-instances");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.reservations) ? data.reservations : []);
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
      serviceName="AWS Reserved Instances"
      serviceHref="/reserved-instances"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Reserved Instances", href: "/reserved-instances" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "reserved-instances",
          resourceName: "Reservations",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "ReservationId",
          createLabel: "Create reservation",
          filterPlaceholder: "Filter reservations",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as Reservation[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
