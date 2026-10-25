"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface SavingsPlan {
  SavingsPlanId?: string;
  Description?: string;
  State?: string;
  Type?: string;
  Commitment?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<SavingsPlan>[] = [
  {
    id: "id",
    header: "Savings Plan ID",
    cell: (item) => <CopyableText value={String(item.SavingsPlanId || "")} />,
    sortingField: "SavingsPlanId",
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
    id: "commitment",
    header: "Commitment",
    cell: (item) => item.Commitment || "—",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["id", "description", "state", "type", "commitment"];

export default function SavingsPlansPage() {
  const [items, setItems] = useState<SavingsPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SavingsPlan[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/savings-plans");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.savingsPlans) ? data.savingsPlans : []);
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
      serviceName="AWS Savings Plans"
      serviceHref="/savings-plans"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Savings Plans", href: "/savings-plans" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "savings-plans",
          resourceName: "Savings plans",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "SavingsPlanId",
          createLabel: "Create savings plan",
          filterPlaceholder: "Filter savings plans",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as SavingsPlan[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
