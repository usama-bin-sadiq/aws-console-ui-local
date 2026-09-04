"use client";

/**
 * DynamoDB Table Detail — Phase 9: Tables + Items (Complete)
 * PRD Alignment: §9.2.3 (Database — DynamoDB), §15.8 (Table Creation Workflow)
 * Verification: docs/verification-gate-phase9-dynamodb.md
 */

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Tabs from "@cloudscape-design/components/tabs";
import Alert from "@cloudscape-design/components/alert";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import TextFilter from "@cloudscape-design/components/text-filter";
import Table from "@cloudscape-design/components/table";
import Link from "@cloudscape-design/components/link";
import Badge from "@cloudscape-design/components/badge";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import JsonEditor from "@/components/JsonEditor";

export default function DynamoDBTableDetailPage() {
  const params = useParams() as { tableName: string };
  const tableName = decodeURIComponent(params.tableName || "");
  const router = useRouter();

  // ─── State ────────────────────────────────────────────────────────────────────
  const [tableInfo, setTableInfo] = useState<Record<string, any> | null>(null);
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(null);
  const [itemJson, setItemJson] = useState("{}");

  // ─── Fetch table info ─────────────────────────────────────────────────────────
  const fetchTableInfo = useCallback(async () => {
    if (!tableName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dynamodb?tableName=${encodeURIComponent(tableName)}&action=describe`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTableInfo(data.table || null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load table info");
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    fetchTableInfo();
  }, [fetchTableInfo]);

  // ─── Fetch items (scan) ───────────────────────────────────────────────────────
  const fetchItems = useCallback(async () => {
    if (!tableName) return;
    setItemsLoading(true);
    try {
      const res = await fetch("/api/dynamodb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan", tableName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(data.items || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load items");
    } finally {
      setItemsLoading(false);
    }
  }, [tableName]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ─── Filtered items ────────────────────────────────────────────────────────────
  const filteredItems = React.useMemo(() => {
    if (!filterText.trim()) return items;
    const lower = filterText.toLowerCase();
    return items.filter((item) => {
      const jsonStr = JSON.stringify(item).toLowerCase();
      return jsonStr.includes(lower);
    });
  }, [items, filterText]);

  // ─── Item actions ─────────────────────────────────────────────────────────────
  const handleAddItem = async () => {
    try {
      const parsed = JSON.parse(itemJson);
      const res = await fetch("/api/dynamodb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "putItem", tableName, item: parsed }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAddModalOpen(false);
      setItemJson("{}");
      fetchItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    }
  };

  const handleEditItem = async () => {
    try {
      const parsed = JSON.parse(itemJson);
      const res = await fetch("/api/dynamodb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "putItem", tableName, item: parsed }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEditModalOpen(false);
      setSelectedItem(null);
      setItemJson("{}");
      fetchItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    try {
      // Extract partition key; for simplicity assume first key attribute
      const key = extractItemKey(selectedItem, tableInfo);
      const res = await fetch("/api/dynamodb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteItem", tableName, key }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDeleteModalOpen(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete item");
    }
  };

  const openEditModal = (item: Record<string, any>) => {
    setSelectedItem(item);
    setItemJson(JSON.stringify(item, null, 2));
    setEditModalOpen(true);
  };

  const openDeleteModal = (item: Record<string, any>) => {
    setSelectedItem(item);
    setDeleteModalOpen(true);
  };

  // ─── Helpers ───────────────────────────────────────────────────────────────────
  function extractItemKey(item: Record<string, any>, info: any): Record<string, any> {
    const schema = info?.KeySchema || info?.KeySchema || [];
    const hashAttr = schema.find((k: any) => k.KeyType === "HASH")?.AttributeName;
    const rangeAttr = schema.find((k: any) => k.KeyType === "RANGE")?.AttributeName;
    const key: Record<string, any> = {};
    if (hashAttr && item[hashAttr]) key[hashAttr] = item[hashAttr];
    if (rangeAttr && item[rangeAttr]) key[rangeAttr] = item[rangeAttr];
    // Fallback: if no key schema found, take first attribute
    if (Object.keys(key).length === 0 && item) {
      const firstAttr = Object.keys(item)[0];
      if (firstAttr) key[firstAttr] = item[firstAttr];
    }
    return key;
  }

  // ─── Columns ───────────────────────────────────────────────────────────────────
  const itemColumns = React.useMemo(() => {
    const baseColumns: any[] = [
      { id: "json", header: "Item (JSON)", cell: (item: Record<string, any>) => (
        <div style={{ fontFamily: "monospace", fontSize: "11px", maxWidth: "500px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {JSON.stringify(item)}
        </div>
      ) },
    ];
    baseColumns.push({
      id: "actions",
      header: "Actions",
      cell: (item: Record<string, any>) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="inline-link" onClick={() => openEditModal(item)} ariaLabel={`Edit item ${JSON.stringify(item)}`}>
            Edit
          </Button>
          <Button variant="inline-link" onClick={() => openDeleteModal(item)} ariaLabel={`Delete item ${JSON.stringify(item)}`}>
            Delete
          </Button>
        </SpaceBetween>
      ),
    });
    return baseColumns;
  }, []);

  // ─── Overview content ─────────────────────────────────────────────────────────
  const overviewContent = (
    <SpaceBetween size="l" direction="vertical">
      <Container header={<Header variant="h2">Table Overview</Header>}>
        <SpaceBetween size="m" direction="vertical">
          <Box>
            <Box variant="small" color="text-label">Table Name</Box>
            <Box fontWeight="bold">{tableName}</Box>
          </Box>
          <SpaceBetween size="xs" direction="horizontal">
            <Box>
              <Box variant="small" color="text-label">Status</Box>
              <StatusIndicator type="success">{tableInfo?.TableStatus || "ACTIVE"}</StatusIndicator>
            </Box>
            <Box>
              <Box variant="small" color="text-label">Item Count (approx)</Box>
              <Box>{tableInfo?.ItemCount ?? items.length}</Box>
            </Box>
            <Box>
              <Box variant="small" color="text-label">Table Size</Box>
              <Box>{tableInfo?.TableSizeBytes ? `${Math.round(tableInfo.TableSizeBytes / 1024)} KB` : "—"}</Box>
            </Box>
          </SpaceBetween>
          <Box>
            <Box variant="small" color="text-label">Partition Key</Box>
            <Box>{tableInfo?.KeySchema?.find((k: any) => k.KeyType === "HASH")?.AttributeName || "—"}</Box>
          </Box>
          <Box>
            <Box variant="small" color="text-label">Sort Key</Box>
            <Box>{tableInfo?.KeySchema?.find((k: any) => k.KeyType === "RANGE")?.AttributeName || "—"}</Box>
          </Box>
          <Box>
            <Box variant="small" color="text-label">Billing Mode</Box>
            <Box>{tableInfo?.BillingModeSummary?.BillingMode || tableInfo?.BillingMode || "PAY_PER_REQUEST"}</Box>
          </Box>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );

  // ─── Items tab content ─────────────────────────────────────────────────────────
  const itemsContent = (
    <SpaceBetween size="l" direction="vertical">
      <SpaceBetween direction="horizontal" size="m" alignItems="center">
        <TextFilter
          filteringPlaceholder="Filter items"
          filteringText={filterText}
          filteringAriaLabel="Filter DynamoDB items"
          onChange={({ detail }) => setFilterText(detail.filteringText)}
          countText={filterText ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}` : undefined}
        />
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="primary" onClick={() => setAddModalOpen(true)} ariaLabel="Add new item">
            Add item
          </Button>
          <Button iconName="refresh" onClick={fetchItems} ariaLabel="Refresh items" />
        </SpaceBetween>
      </SpaceBetween>

      {itemsLoading ? (
        <Box>Loading items...</Box>
      ) : (
        <Table
          items={filteredItems}
          columnDefinitions={itemColumns}
          loading={itemsLoading}
          empty={<Box textAlign="center">No items found. Try scanning again or add a new item.</Box>}
          header={<Header variant="h2">Items ({filteredItems.length})</Header>}
          ariaLabels={{ selectionGroupLabel: "Select item" }}
        />
      )}
    </SpaceBetween>
  );

  // ─── Main layout ───────────────────────────────────────────────────────────────
  return (
    <ServiceLayout
      serviceName={`Table: ${tableName}`}
      serviceCategory="Database"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Database", href: "#" },
        { text: "DynamoDB", href: "/dynamodb" },
        { text: tableName || "...", href: `#` },
      ]}
      headerActions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={() => router.push("/dynamodb")} formAction="none">
            Back to Tables
          </Button>
        </SpaceBetween>
      }
    >
      <SpaceBetween size="l" direction="vertical">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button variant="primary" onClick={() => setAddModalOpen(true)} ariaLabel="Add new DynamoDB item">
                Add item
              </Button>
              <Button onClick={() => router.push("/dynamodb")} formAction="none">
                Back to Tables
              </Button>
            </SpaceBetween>
          }
        >
          {tableName}
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box>Loading table details...</Box>
        ) : (
          <Tabs
            tabs={[
              { label: "Overview", id: "overview", content: overviewContent },
              { label: "Items", id: "items", content: itemsContent },
            ]}
          />
        )}
      </SpaceBetween>

      {/* Add / Edit Modal ───────────────────────────────────────────────────────── */}
      <Modal
        visible={addModalOpen || editModalOpen}
        onDismiss={() => {
          setAddModalOpen(false);
          setEditModalOpen(false);
          setSelectedItem(null);
          setItemJson("{}");
        }}
        header={addModalOpen ? "Add DynamoDB Item" : "Edit DynamoDB Item"}
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => {
              setAddModalOpen(false);
              setEditModalOpen(false);
              setSelectedItem(null);
              setItemJson("{}");
            }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={addModalOpen ? handleAddItem : handleEditItem} ariaLabel={addModalOpen ? "Confirm add item" : "Confirm edit item"}>
              {addModalOpen ? "Add" : "Save"}
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m" direction="vertical">
          <Box>
            <p>Edit the item as native DynamoDB JSON (e.g., <code>{`{"id":{"S":"123"},"name":{"S":"Alice"}}`}</code>).</p>
          </Box>
          <JsonEditor
            label={addModalOpen ? "Item JSON" : "Item JSON"}
            value={itemJson}
            onChange={(val) => setItemJson(val)}
            rows={16}
            placeholder='{"id":{"S":"value"}}'
          />
        </SpaceBetween>
      </Modal>

      {/* Delete Confirm Modal ───────────────────────────────────────────────────── */}
      <Modal
        visible={deleteModalOpen}
        onDismiss={() => {
          setDeleteModalOpen(false);
          setSelectedItem(null);
        }}
        header="Delete DynamoDB Item"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => {
              setDeleteModalOpen(false);
              setSelectedItem(null);
            }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleDeleteItem} ariaLabel="Confirm delete item">
              Delete
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m" direction="vertical">
          <Alert type="warning">
            This action cannot be undone. The item will be permanently deleted from <strong>{tableName}</strong>.
          </Alert>
          <Box>
            <pre style={{ background: "#f2f3f3", padding: "12px", borderRadius: "4px", fontFamily: "monospace", fontSize: "12px", overflow: "auto" }}>
              {selectedItem ? JSON.stringify(selectedItem, null, 2) : ""}
            </pre>
          </Box>
        </SpaceBetween>
      </Modal>
    </ServiceLayout>
  );
}
