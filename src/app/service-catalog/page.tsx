"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface Portfolio {
  PortfolioId?: string;
  DisplayName?: string;
  Description?: string;
  CreatedTime?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Portfolio>[] = [
  {
    id: "name",
    header: "Name",
    cell: (item) => item.DisplayName || "—",
    sortingField: "DisplayName",
    isRowHeader: true,
  },
  {
    id: "id",
    header: "Portfolio ID",
    cell: (item) => <CopyableText value={String(item.PortfolioId || "")} />,
    sortingField: "PortfolioId",
  },
  {
    id: "description",
    header: "Description",
    cell: (item) => item.Description || "—",
  },
  {
    id: "created",
    header: "Created",
    cell: (item) => (item.CreatedTime ? new Date(item.CreatedTime).toLocaleString() : "—"),
    sortingField: "CreatedTime",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["name", "id", "description", "created"];

export default function ServiceCatalogPage() {
  const [items, setItems] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Portfolio[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/service-catalog");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.portfolios) ? data.portfolios : []);
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
      serviceName="AWS Service Catalog"
      serviceHref="/service-catalog"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Service Catalog", href: "/service-catalog" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "service-catalog",
          resourceName: "Portfolios",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "PortfolioId",
          createLabel: "Create portfolio",
          filterPlaceholder: "Filter portfolios",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as Portfolio[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
