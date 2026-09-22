"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Alert from "@cloudscape-design/components/alert";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";

interface DynamoTable {
  TableName?: string;
  TableStatus?: string;
  ItemCount?: number;
  TableSizeBytes?: number;
  ReadCapacityUnits?: number;
  WriteCapacityUnits?: number;
}

export default function DynamoDBPage() {
  const router = useRouter();
  const [tables, setTables] = useState<DynamoTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [newTable, setNewTable] = useState("");
  const [partitionKeyName, setPartitionKeyName] = useState("id");
  const [partitionKeyType, setPartitionKeyType] = useState<{ label: string; value: string }>({ label: "String (S)", value: "S" });
  const [sortKeyName, setSortKeyName] = useState("");
  const [sortKeyType, setSortKeyType] = useState<{ label: string; value: string }>({ label: "String (S)", value: "S" });
  const [billingMode, setBillingMode] = useState<{ label: string; value: string }>({ label: "On-demand (PAY_PER_REQUEST)", value: "PAY_PER_REQUEST" });
  const [createLoading, setCreateLoading] = useState(false);

  // Delete confirmation
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

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dynamodb");
      const data = await res.json();
      setTables(data.tables || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tables");
    }
    setLoading(false);
  };

  useEffect(() => { fetchTables(); }, []);

  const createTable = async () => {
    if (!newTable.trim()) return;
    setCreateLoading(true);
    try {
      const attrDefs: any[] = [
        { AttributeName: partitionKeyName, AttributeType: partitionKeyType.value },
      ];
      const keySchema: any[] = [
        { AttributeName: partitionKeyName, KeyType: "HASH" },
      ];
      if (sortKeyName.trim()) {
        attrDefs.push({ AttributeName: sortKeyName, AttributeType: sortKeyType.value });
        keySchema.push({ AttributeName: sortKeyName, KeyType: "RANGE" });
      }
      const res = await fetch("/api/dynamodb", {
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

  const openDeleteModal = (name: string) => {
    setDeleteTarget(name);
    setDeleteConfirmName("");
    setDeleteModal(true);
  };

  const deleteTable = async () => {
    if (deleteConfirmName !== deleteTarget) return;
    try {
      const res = await fetch(`/api/dynamodb?tableName=${deleteTarget}`, { method: "DELETE" });
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

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <Button variant="primary" onClick={() => setCreateModal(true)} ariaLabel="Create DynamoDB table">
              Create Table
            </Button>
          }
        >
          DynamoDB
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            header={<Header variant="h2">Tables ({tables.length})</Header>}
            items={tables}
            columnDefinitions={[
              { header: "Name", cell: (item) => (
                <a href={`/dynamodb/${encodeURIComponent(item.TableName || "")}`} style={{ color: "var(--awsui-color-text-interactive-default)", textDecoration: "underline" }}>
                  {item.TableName}
                </a>
              ) },
              { header: "Status", cell: (item) => item.TableStatus },
              { header: "Items", cell: (item) => item.ItemCount || 0 },
              {
                header: "Size",
                cell: (item) => {
                  const bytes = item.TableSizeBytes;
                  if (!bytes || bytes === 0) return "—";
                  if (bytes < 1024) return `${bytes} B`;
                  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                },
              },
              { header: "Read capacity", cell: (item) => item.ReadCapacityUnits ?? "—" },
              { header: "Write capacity", cell: (item) => item.WriteCapacityUnits ?? "—" },
              {
                header: "Actions",
                cell: (item) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => router.push(`/dynamodb/${encodeURIComponent(item.TableName!)}`)} formAction="none" ariaLabel={`View DynamoDB table ${item.TableName}`}>View</Button>
                    <Button onClick={() => openDeleteModal(item.TableName!)} formAction="none" ariaLabel={`Delete DynamoDB table ${item.TableName}`}>Delete</Button>
                  </SpaceBetween>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No tables found. Create one to get started.</Box>}
          />
        </Container>

        {/* Create Table Modal */}
        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create DynamoDB Table"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createTable} loading={createLoading}>Create</Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m" direction="vertical">
            <FormField label="Table Name">
              <Input value={newTable} onChange={(e) => setNewTable(e.detail.value)} placeholder="my-table" />
            </FormField>
            <FormField label="Partition Key">
              <SpaceBetween size="s" direction="vertical">
                <Input value={partitionKeyName} onChange={(e) => setPartitionKeyName(e.detail.value)} placeholder="id" />
                <Select
                  selectedOption={partitionKeyType}
                  onChange={(e) => {
                    const opt = e.detail.selectedOption;
                    setPartitionKeyType({ label: String(opt.label || ""), value: String(opt.value || "S") });
                  }}
                  options={typeOptions}
                  ariaLabel="Partition key type"
                />
              </SpaceBetween>
            </FormField>
            <FormField label="Sort Key (optional)">
              <SpaceBetween size="s" direction="vertical">
                <Input value={sortKeyName} onChange={(e) => setSortKeyName(e.detail.value)} placeholder="Leave empty for no sort key" />
                <Select
                  selectedOption={sortKeyType}
                  onChange={(e) => {
                    const opt = e.detail.selectedOption;
                    setSortKeyType({ label: String(opt.label || ""), value: String(opt.value || "S") });
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
                  setBillingMode({ label: String(opt.label || ""), value: String(opt.value || "PAY_PER_REQUEST") });
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
              <Button variant="primary" onClick={deleteTable} disabled={deleteConfirmName !== deleteTarget} ariaLabel="Confirm delete table">Delete</Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m" direction="vertical">
            <Alert type="warning">
              This action cannot be undone. The table <strong>{deleteTarget}</strong> and all its data will be permanently deleted.
            </Alert>
            <FormField label={`Type the table name "${deleteTarget}" to confirm deletion.`}>
              <Input value={deleteConfirmName} onChange={(e) => setDeleteConfirmName(e.detail.value)} placeholder={deleteTarget} />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>

      <CrossServiceLinks links={CROSS_SERVICE_LINKS["/dynamodb"] || []} />
    </div>
  );
}
