"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import type { TableProps } from "@cloudscape-design/components/table";

interface Group {
  GroupId?: string;
  Name?: string;
  State?: string;
  RoleArn?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Group>[] = [
  {
    id: "name",
    header: "Name",
    cell: (item) => item.Name || "—",
    sortingField: "Name",
    isRowHeader: true,
  },
  {
    id: "id",
    header: "Group ID",
    cell: (item) => <CopyableText value={String(item.GroupId || "")} />,
    sortingField: "GroupId",
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
    id: "roleArn",
    header: "Role ARN",
    cell: (item) => item.RoleArn || "—",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["name", "id", "state", "roleArn"];

export default function IotGreengrassPage() {
  const [items, setItems] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Group[]>([]);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/iot-greengrass");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.groups) ? data.groups : []);
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
      serviceName="AWS IoT Greengrass"
      serviceHref="/iot-greengrass"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "IoT Greengrass", href: "/iot-greengrass" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <ResourceTable
        config={{
          serviceKey: "iot-greengrass",
          resourceName: "Groups",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "GroupId",
          createLabel: "Create group",
          filterPlaceholder: "Filter groups",
        }}
        items={items as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as Group[])}
        onRefresh={fetchItems}
      />
    </ServiceLayout>
  );
}
