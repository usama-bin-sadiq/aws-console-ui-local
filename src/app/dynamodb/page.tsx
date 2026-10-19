"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Alert from "@cloudscape-design/components/alert";
import type { TableProps } from "@cloudscape-design/components/table";
import { ResourceTable } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";

// ── Types ──────────────────────────────────────────────────────────────────

interface DynamoTable {
  TableName?: string;
  TableStatus?: string;
  ItemCount?: number;
  TableSizeBytes?: number;
  ReadCapacityUnits?: number;
  WriteCapacityUnits?: number;
}

// ── Table Configuration ────────────────────────────────────────────────────

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Record<string, unknown>>[] = [
  {
    id: "name",
    header: "Name",
    cell: (item) => (
      <a
        href={`/dynamodb/${encodeURIComponent(String(item.TableName || ""))}`}
        style={{
          color: "var(--awsui-color-text-interactive-default)",
          textDecoration: "underline",
        }}
      >
        {String(item.TableName)}
      </a>
    ),
    sortingField: "TableName",
    isRowHeader: true,
  },
  {
    id: "status",
    header: "Status",
    cell: (item) => {
      const status = String(item.TableStatus);
      let badgeStatus: "success" | "warning" | "error" | "info" = "info";
      if (status === "ACTIVE") badgeStatus = "success";
      else if (status === "CREATING" || status === "UPDATING" || status === "DELETING")
        badgeStatus = "warning";
      else if (status === "FAILED") badgeStatus = "error";
      return <StatusBadge status={badgeStatus} label={status ?? "unknown"} />;
    },
    sortingField: "TableStatus",
  },
  {
    id: "items",
    header: "Items",
    cell: (item) => Number(item.ItemCount) || 0,
    sortingField: "ItemCount",
  },
  {
    id: "size",
    header: "Size",
    cell: (item) => {
      const bytes = Number(item.TableSizeBytes) || 0;
      if (bytes === 0) return "—";
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    },
  },
  {
    id: "readCapacity",
    header: "Read capacity",
    cell: (item) => (item.ReadCapacityUnits !== undefined ? String(item.ReadCapacityUnits) : "—"),
  },
  {
    id: "writeCapacity",
    header: "Write capacity",
    cell: (item) => (item.WriteCapacityUnits !== undefined ? String(item.WriteCapacityUnits) : "—"),
  },
];

const DEFAULT_VISIBLE_COLUMNS = [
  "name",
  "status",
  "items",
  "size",
  "readCapacity",
  "writeCapacity",
];

// ── Page Component ─────────────────────────────────────────────────────────

export default function DynamoDBPage() {
  const router = useRouter();
  const [tables, setTables] = useState<DynamoTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<DynamoTable[]>([]);

  // Create modal state
  const [createModal, setCreateModal] = useState(false);
  const [newTable, setNewTable] = useState("");
  const [partitionKeyName, setPartitionKeyName] = useState("id");
  const [partitionKeyType, setPartitionKeyType] = useState<{ label: string; value: string }>({
    label: "String (S)",
    value: "S",
  });
  const [sortKeyName, setSortKeyName] = useState("");
  const [sortKeyType, setSortKeyType] = useState<{ label: string; value: string }>({
    label: "String (S)",
    value: "S",
  });
  const [billingMode, setBillingMode] = useState<{ label: string; value: string }>({
    label: "On-demand (PAY_PER_REQUEST)",
    value: "PAY_PER_REQUEST",
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string>("");
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const typeOptions = [
    { label: "String (S)", value: "S" },
    { label: "Number (N)", value: "N" },
    { label: "Binary (B)", value: "B" },
  ];

  const billingOptions = [
    { label: "On-demand (PAY_PER_REQUEST)", value: "PAY_PER_REQUEST" },
    { label: "Provisioned (PROVISIONED)", value: "PROVISIONED" },
  ];

  // ── Data Fetching ──────────────────────────────────────────────────────

  const fetchTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/dynamodb");
      const data = await res.json();
      setTables(data.tables || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tables");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  // ── Create Table ───────────────────────────────────────────────────────

  const createTable = async () => {
    if (!newTable.trim()) return;
    setCreateLoading(true);
    try {
      const attrDefs: any[] = [
        { AttributeName: partitionKeyName, AttributeType: partitionKeyType.value },
      ];
      const keySchema: any[] = [{ AttributeName: partitionKeyName, KeyType: "HASH" }];
      if (sortKeyName.trim()) {
        attrDefs.push({ AttributeName: sortKeyName, AttributeType: sortKeyType.value });
        keySchema.push({ AttributeName: sortKeyName, KeyType: "RANGE" });
      }
      const res = await apiFetch("/api/dynamodb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TableName: newTable,
          KeySchema: keySchema,
          AttributeDefinitions: attrDefs,
          BillingMode: billingMode.value,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCreateModal(false);
      setNewTable("");
      setPartitionKeyName("id");
      setPartitionKeyType({ label: "String (S)", value: "S" });
      setSortKeyName("");
      setSortKeyType({ label: "String (S)", value: "S" });
      setBillingMode({ label: "On-demand (PAY_PER_REQUEST)", value: "PAY_PER_REQUEST" });
      fetchTables();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create table");
    }
    setCreateLoading(false);
  };

  // ── Delete Table ───────────────────────────────────────────────────────

  const openDeleteModal = useCallback((name: string) => {
    setDeleteTarget(name);
    setDeleteConfirmName("");
    setDeleteModal(true);
  }, []);

  const deleteTable = async () => {
    if (deleteConfirmName !== deleteTarget) return;
    try {
      const res = await apiFetch(`/api/dynamodb?tableName=${deleteTarget}`, { method: "DELETE" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDeleteModal(false);
      setDeleteTarget("");
      setDeleteConfirmName("");
      fetchTables();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete table");
    }
  };

  // ── Bulk Delete Action ─────────────────────────────────────────────────

  const handleBulkDelete = useCallback(() => {
    if (selectedItems.length === 0) return;
    const names = selectedItems.map((t) => t.TableName).filter(Boolean);
    if (names.length === 1) {
      openDeleteModal(names[0]!);
    } else {
      // For multiple tables, use the first as target for confirmation
      openDeleteModal(names[0]!);
    }
  }, [selectedItems, openDeleteModal]);

  // ── Action Definitions ─────────────────────────────────────────────────

  const actions = [
    {
      id: "delete",
      label: "Delete tables",
      disabled: (items: DynamoTable[]) => items.length === 0,
      danger: true,
      onClick: handleBulkDelete,
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <ResourceTable
          config={{
            serviceKey: "dynamodb",
            resourceName: "Tables",
            columnDefinitions: COLUMN_DEFINITIONS,
            defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
            trackBy: "TableName",
            createLabel: "Create table",
            createHref: "/dynamodb/create",
            filterPlaceholder: "Filter tables",
          }}
          items={tables as unknown as Record<string, unknown>[]}
          loading={loading}
          selectedItems={selectedItems as unknown as Record<string, unknown>[]}
          onSelectionChange={(items) => setSelectedItems(items as unknown as DynamoTable[])}
          onRefresh={fetchTables}
          actions={actions as any}
        />

        {/* Create Table Modal */}
        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create DynamoDB Table"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createTable} loading={createLoading}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m" direction="vertical">
            <FormField label="Table Name">
              <Input
                value={newTable}
                onChange={(e) => setNewTable(e.detail.value)}
                placeholder="my-table"
              />
            </FormField>
            <FormField label="Partition Key">
              <SpaceBetween size="s" direction="vertical">
                <Input
                  value={partitionKeyName}
                  onChange={(e) => setPartitionKeyName(e.detail.value)}
                  placeholder="id"
                />
                <Select
                  selectedOption={partitionKeyType}
                  onChange={(e) => {
                    const opt = e.detail.selectedOption;
                    setPartitionKeyType({
                      label: String(opt.label || ""),
                      value: String(opt.value || "S"),
                    });
                  }}
                  options={typeOptions}
                  ariaLabel="Partition key type"
                />
              </SpaceBetween>
            </FormField>
            <FormField label="Sort Key (optional)">
              <SpaceBetween size="s" direction="vertical">
                <Input
                  value={sortKeyName}
                  onChange={(e) => setSortKeyName(e.detail.value)}
                  placeholder="Leave empty for no sort key"
                />
                <Select
                  selectedOption={sortKeyType}
                  onChange={(e) => {
                    const opt = e.detail.selectedOption;
                    setSortKeyType({
                      label: String(opt.label || ""),
                      value: String(opt.value || "S"),
                    });
                  }}
                  options={typeOptions}
                  ariaLabel="Sort key type"
                />
              </SpaceBetween>
            </FormField>
            <FormField label="Billing Mode">
              <Select
                selectedOption={billingMode}
                onChange={(e) => {
                  const opt = e.detail.selectedOption;
                  setBillingMode({
                    label: String(opt.label || ""),
                    value: String(opt.value || "PAY_PER_REQUEST"),
                  });
                }}
                options={billingOptions}
                ariaLabel="Billing mode"
              />
            </FormField>
          </SpaceBetween>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={deleteModal}
          onDismiss={() => setDeleteModal(false)}
          header={`Delete table ${deleteTarget}`}
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setDeleteModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={deleteTable}
                disabled={deleteConfirmName !== deleteTarget}
                ariaLabel="Confirm delete table"
              >
                Delete
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m" direction="vertical">
            <Alert type="warning">
              This action cannot be undone. The table <strong>{deleteTarget}</strong> and all its
              data will be permanently deleted.
            </Alert>
            <FormField label={`Type the table name "${deleteTarget}" to confirm deletion.`}>
              <Input
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.detail.value)}
                placeholder={deleteTarget}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>

      <CrossServiceLinks links={CROSS_SERVICE_LINKS["/dynamodb"] || []} />
    </div>
  );
}
