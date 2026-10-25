"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface Domain {
  DomainId?: string;
  Name?: string;
  Owner?: string;
  CreatedTime?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Domain>[] = [
  {
    id: "name",
    header: "Name",
    cell: (item) => item.Name || "—",
    sortingField: "Name",
    isRowHeader: true,
  },
  {
    id: "id",
    header: "Domain ID",
    cell: (item) => <CopyableText value={String(item.DomainId || "")} />,
    sortingField: "DomainId",
  },
  {
    id: "owner",
    header: "Owner",
    cell: (item) => item.Owner || "—",
    sortingField: "Owner",
  },
  {
    id: "created",
    header: "Created",
    cell: (item) => (item.CreatedTime ? new Date(item.CreatedTime).toLocaleString() : "—"),
    sortingField: "CreatedTime",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["name", "id", "owner", "created"];

export default function CodeArtifactPage() {
  const [items, setItems] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Domain[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/codeartifact");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.domains) ? data.domains : []);
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
      serviceName="AWS CodeArtifact"
      serviceHref="/codeartifact"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "CodeArtifact", href: "/codeartifact" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "codeartifact",
          resourceName: "Domains",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "DomainId",
          createLabel: "Create domain",
          filterPlaceholder: "Filter domains",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as Domain[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
