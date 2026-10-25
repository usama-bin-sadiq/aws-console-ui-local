"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface PermissionSet {
  PermissionSetArn?: string;
  Name?: string;
  Description?: string;
  SessionDuration?: string;
  CreatedDate?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<PermissionSet>[] = [
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
    cell: (item) => <CopyableText value={String(item.PermissionSetArn || "")} />,
    sortingField: "PermissionSetArn",
  },
  {
    id: "description",
    header: "Description",
    cell: (item) => item.Description || "—",
  },
  {
    id: "sessionDuration",
    header: "Session Duration",
    cell: (item) => item.SessionDuration || "—",
    sortingField: "SessionDuration",
  },
  {
    id: "created",
    header: "Created",
    cell: (item) => (item.CreatedDate ? new Date(item.CreatedDate).toLocaleString() : "—"),
    sortingField: "CreatedDate",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["name", "arn", "sessionDuration", "created"];

export default function IamIdentityCenterPage() {
  const [items, setItems] = useState<PermissionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<PermissionSet[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/iam-identity-center");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.permissionSets) ? data.permissionSets : []);
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
      serviceName="AWS IAM Identity Center"
      serviceHref="/iam-identity-center"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "IAM Identity Center", href: "/iam-identity-center" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "iam-identity-center",
          resourceName: "Permission sets",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "PermissionSetArn",
          createLabel: "Create permission set",
          filterPlaceholder: "Filter permission sets",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as PermissionSet[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
