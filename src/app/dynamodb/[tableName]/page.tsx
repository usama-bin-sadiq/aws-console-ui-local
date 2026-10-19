"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { CodeView } from "@cloudscape-design/code-view";
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
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import FormField from "@cloudscape-design/components/form-field";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import JsonEditor from "@/components/JsonEditor";

export default function DynamoDBTableDetailPage() {
  const params = useParams() as { tableName: string };
  const tableName = decodeURIComponent(params.tableName || "");
  const router = useRouter();

  const [tableInfo, setTableInfo] = useState<Record<string, any> | null>(null);
  const [items, setItems] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Record<string, any> | null>(null);
  const [itemJson, setItemJson] = useState("{}");

  // Query state
  const [queryMode, setQueryMode] = useState(false);
  const [queryPartitionKey, setQueryPartitionKey] = useState("");
  const [queryPartitionValue, setQueryPartitionValue] = useState("");
  const [querySortKey, setQuerySortKey] = useState("");
  const [querySortValue, setQuerySortValue] = useState("");
  const [querySortBeginsWith, setQuerySortBeginsWith] = useState(false);

  // Backups state
  const [backups, setBackups] = useState<any[]>([]);
  const [backupsLoading, setBackupsLoading] = useState(false);

  // Tags state
  const [tags, setTags] = useState<{ Key: string; Value: string }[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  const fetchTableInfo = useCallback(async () => {
    if (!tableName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/api/dynamodb?tableName=${encodeURIComponent(tableName)}&action=describe`,
      );
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

  const fetchItems = useCallback(async () => {
    if (!tableName) return;
    setItemsLoading(true);
    try {
      const res = await apiFetch("/api/dynamodb", {
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

  const filteredItems = React.useMemo(() => {
    if (!filterText.trim()) return items;
    const lower = filterText.toLowerCase();
    return items.filter((item) => JSON.stringify(item).toLowerCase().includes(lower));
  }, [items, filterText]);

  // Query items
  const handleQuery = async () => {
    if (!queryPartitionKey.trim() || !queryPartitionValue.trim()) {
      setError("Partition key and value are required for query");
      return;
    }
    setItemsLoading(true);
    setError(null);
    try {
      const body: any = {
        action: "query",
        tableName,
        keyConditionExpression: `#pk = :pk`,
        expressionAttributeNames: { "#pk": queryPartitionKey },
        expressionAttributeValues: { ":pk": { S: queryPartitionValue } },
      };
      if (querySortKey.trim() && querySortValue.trim()) {
        const sortExpr = querySortBeginsWith ? "begins_with(#sk, :sk)" : "#sk = :sk";
        body.keyConditionExpression += ` AND ${sortExpr}`;
        body.expressionAttributeNames["#sk"] = querySortKey;
        body.expressionAttributeValues[":sk"] = { S: querySortValue };
      }
      const res = await apiFetch("/api/dynamodb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItems(data.items || []);
      setQueryMode(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setItemsLoading(false);
    }
  };

  const handleScan = () => {
    setQueryMode(false);
    setQueryPartitionKey("");
    setQueryPartitionValue("");
    setQuerySortKey("");
    setQuerySortValue("");
    fetchItems();
  };

  // Fetch backups
  const fetchBackups = useCallback(async () => {
    if (!tableName) return;
    setBackupsLoading(true);
    try {
      const res = await apiFetch(
        `/api/dynamodb?tableName=${encodeURIComponent(tableName)}&action=describe`,
      );
      const data = await res.json();
      const table = data.table || {};
      const pits = table.ContinuousBackupsDescription?.PointInTimeRecoveryDescription;
      setBackups([
        {
          type: "Point-in-Time Recovery (PITR)",
          status: pits?.PointInTimeRecoveryStatus || "DISABLED",
          earliestRestore: pits?.EarliestRestorableDateTime || "—",
          latestRestore: pits?.LatestRestorableDateTime || "—",
        },
      ]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load backups info");
    }
    setBackupsLoading(false);
  }, [tableName]);

  // Fetch tags
  const fetchTags = useCallback(async () => {
    if (!tableName) return;
    setTagsLoading(true);
    try {
      const res = await apiFetch(
        `/api/dynamodb?tableName=${encodeURIComponent(tableName)}&action=describe`,
      );
      const data = await res.json();
      setTags(data.table?.Tags || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tags");
    }
    setTagsLoading(false);
  }, [tableName]);

  // Item actions
  const handleAddItem = async () => {
    try {
      const parsed = JSON.parse(itemJson);
      const res = await apiFetch("/api/dynamodb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "putItem", tableName, item: parsed }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAddModalOpen(false);
      setItemJson("{}");
      queryMode ? handleQuery() : fetchItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    }
  };

  const handleEditItem = async () => {
    try {
      const parsed = JSON.parse(itemJson);
      const res = await apiFetch("/api/dynamodb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "putItem", tableName, item: parsed }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEditModalOpen(false);
      setSelectedItem(null);
      setItemJson("{}");
      queryMode ? handleQuery() : fetchItems();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update item");
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    try {
      const key = extractItemKey(selectedItem, tableInfo);
      const res = await apiFetch("/api/dynamodb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteItem", tableName, key }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDeleteModalOpen(false);
      setSelectedItem(null);
      queryMode ? handleQuery() : fetchItems();
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

  function extractItemKey(item: Record<string, any>, info: any): Record<string, any> {
    const schema = info?.KeySchema || [];
    const hashAttr = schema.find((k: any) => k.KeyType === "HASH")?.AttributeName;
    const rangeAttr = schema.find((k: any) => k.KeyType === "RANGE")?.AttributeName;
    const key: Record<string, any> = {};
    if (hashAttr && item[hashAttr]) key[hashAttr] = item[hashAttr];
    if (rangeAttr && item[rangeAttr]) key[rangeAttr] = item[rangeAttr];
    if (Object.keys(key).length === 0 && item) {
      const firstAttr = Object.keys(item)[0];
      if (firstAttr) key[firstAttr] = item[firstAttr];
    }
    return key;
  }

  const itemColumns = React.useMemo(() => {
    const baseColumns: any[] = [
      {
        id: "json",
        header: "Item (JSON)",
        cell: (item: Record<string, any>) => (
          <div
            style={{
              fontFamily: "var(--awsui-font-family-code)",
              fontSize: "var(--awsui-font-size-xs)",
              maxWidth: "500px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {JSON.stringify(item)}
          </div>
        ),
      },
    ];
    baseColumns.push({
      id: "actions",
      header: "Actions",
      cell: (item: Record<string, any>) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            variant="inline-link"
            onClick={() => openEditModal(item)}
            ariaLabel={`Edit item ${JSON.stringify(item)}`}
          >
            Edit
          </Button>
          <Button
            variant="inline-link"
            onClick={() => openDeleteModal(item)}
            ariaLabel={`Delete item ${JSON.stringify(item)}`}
          >
            Delete
          </Button>
        </SpaceBetween>
      ),
    });
    return baseColumns;
  }, []);

  // Key schema helpers
  const partitionKeyAttr =
    tableInfo?.KeySchema?.find((k: any) => k.KeyType === "HASH")?.AttributeName || "";
  const sortKeyAttr =
    tableInfo?.KeySchema?.find((k: any) => k.KeyType === "RANGE")?.AttributeName || "";
  const keySchema = tableInfo?.KeySchema || [];

  // Overview content
  const overviewContent = (
    <SpaceBetween size="l" direction="vertical">
      <Container header={<Header variant="h2">Table Overview</Header>}>
        <SpaceBetween size="m" direction="vertical">
          <Box>
            <Box variant="small" color="text-label">
              Table Name
            </Box>
            <Box fontWeight="bold">{tableName}</Box>
          </Box>
          <SpaceBetween size="xs" direction="horizontal">
            <Box>
              <Box variant="small" color="text-label">
                Status
              </Box>
              <StatusIndicator type="success">{tableInfo?.TableStatus || "ACTIVE"}</StatusIndicator>
            </Box>
            <Box>
              <Box variant="small" color="text-label">
                Item Count (approx)
              </Box>
              <Box>{tableInfo?.ItemCount ?? items.length}</Box>
            </Box>
            <Box>
              <Box variant="small" color="text-label">
                Table Size
              </Box>
              <Box>
                {tableInfo?.TableSizeBytes
                  ? `${Math.round(tableInfo.TableSizeBytes / 1024)} KB`
                  : "—"}
              </Box>
            </Box>
          </SpaceBetween>
          <Box>
            <Box variant="small" color="text-label">
              Partition Key
            </Box>
            <Box>{partitionKeyAttr || "—"}</Box>
          </Box>
          <Box>
            <Box variant="small" color="text-label">
              Sort Key
            </Box>
            <Box>{sortKeyAttr || "—"}</Box>
          </Box>
          <Box>
            <Box variant="small" color="text-label">
              Billing Mode
            </Box>
            <Box>
              {tableInfo?.BillingModeSummary?.BillingMode ||
                tableInfo?.BillingMode ||
                "PAY_PER_REQUEST"}
            </Box>
          </Box>
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );

  // Query UI
  const queryContent = (
    <SpaceBetween size="l" direction="vertical">
      <Container header={<Header variant="h2">Query</Header>}>
        <SpaceBetween size="m" direction="vertical">
          <SpaceBetween direction="horizontal" size="m" alignItems="center">
            <Button onClick={handleScan} formAction="none">
              Scan
            </Button>
            <Button variant="primary" onClick={handleQuery} formAction="none">
              Run Query
            </Button>
          </SpaceBetween>
          <FormField label={`Partition Key (${partitionKeyAttr})`}>
            <SpaceBetween size="xs" direction="horizontal" alignItems="center">
              <Input
                value={queryPartitionKey}
                onChange={(e) => setQueryPartitionKey(e.detail.value)}
                placeholder={partitionKeyAttr}
              />
              <Box>=</Box>
              <Input
                value={queryPartitionValue}
                onChange={(e) => setQueryPartitionValue(e.detail.value)}
                placeholder="Value"
              />
            </SpaceBetween>
          </FormField>
          {sortKeyAttr && (
            <FormField label={`Sort Key (${sortKeyAttr})`}>
              <SpaceBetween size="xs" direction="vertical">
                <SpaceBetween size="xs" direction="horizontal" alignItems="center">
                  <Select
                    selectedOption={
                      querySortBeginsWith
                        ? { label: "begins_with", value: "begins_with" }
                        : { label: "=", value: "=" }
                    }
                    onChange={(e) =>
                      setQuerySortBeginsWith(e.detail.selectedOption.value === "begins_with")
                    }
                    options={[
                      { label: "=", value: "=" },
                      { label: "begins_with", value: "begins_with" },
                    ]}
                    ariaLabel="Sort key condition"
                  />
                  <Input
                    value={querySortValue}
                    onChange={(e) => setQuerySortValue(e.detail.value)}
                    placeholder="Value"
                  />
                </SpaceBetween>
              </SpaceBetween>
            </FormField>
          )}
        </SpaceBetween>
      </Container>

      <TextFilter
        filteringPlaceholder="Filter items"
        filteringText={filterText}
        filteringAriaLabel="Filter DynamoDB items"
        onChange={({ detail }) => setFilterText(detail.filteringText)}
        countText={
          filterText
            ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
            : undefined
        }
      />

      <Table
        items={filteredItems}
        columnDefinitions={itemColumns}
        loading={itemsLoading}
        empty={<Box textAlign="center">No items found. Try scanning again or add a new item.</Box>}
        header={<Header variant="h2">Items ({filteredItems.length})</Header>}
        ariaLabels={{ selectionGroupLabel: "Select item" }}
      />
    </SpaceBetween>
  );

  // Metrics content
  const metricsContent = (
    <Container header={<Header variant="h2">Consumed Capacity</Header>}>
      <SpaceBetween size="m" direction="vertical">
        <Box>
          <Box variant="small" color="text-label">
            Read Capacity Units
          </Box>
          <Box>{tableInfo?.ProvisionedThroughput?.ReadCapacityUnits ?? "N/A (on-demand)"}</Box>
        </Box>
        <Box>
          <Box variant="small" color="text-label">
            Write Capacity Units
          </Box>
          <Box>{tableInfo?.ProvisionedThroughput?.WriteCapacityUnits ?? "N/A (on-demand)"}</Box>
        </Box>
        <Box>
          <Box variant="small" color="text-label">
            Last Increase Time
          </Box>
          <Box>{tableInfo?.ProvisionedThroughput?.LastIncreaseDateTime || "—"}</Box>
        </Box>
        <Box>
          <Box variant="small" color="text-label">
            Last Decrease Time
          </Box>
          <Box>{tableInfo?.ProvisionedThroughput?.LastDecreaseDateTime || "—"}</Box>
        </Box>
        <Box>
          <Box variant="small" color="text-label">
            Number of Decreases Today
          </Box>
          <Box>{tableInfo?.ProvisionedThroughput?.NumberOfDecreasesToday ?? 0}</Box>
        </Box>
        <Box>
          <Box variant="small" color="text-label">
            Table Size
          </Box>
          <Box>
            {tableInfo?.TableSizeBytes
              ? `${Math.round(tableInfo.TableSizeBytes / 1024)} KB (${tableInfo.TableSizeBytes} bytes)`
              : "—"}
          </Box>
        </Box>
        <Box>
          <Box variant="small" color="text-label">
            Item Count (approx)
          </Box>
          <Box>{tableInfo?.ItemCount ?? "—"}</Box>
        </Box>
        <Box>
          <Box variant="small" color="text-label">
            Index Size
          </Box>
          <Box>
            {tableInfo?.GlobalSecondaryIndexes?.length
              ? `${tableInfo.GlobalSecondaryIndexes.length} GSI(s)`
              : "None"}
          </Box>
        </Box>
      </SpaceBetween>
    </Container>
  );

  // Backups content
  const backupsContent = (
    <Container header={<Header variant="h2">Backups</Header>} className="aws-table-card">
      <SpaceBetween size="m" direction="vertical">
        {backupsLoading ? (
          <Box>Loading backup information...</Box>
        ) : (
          <>
            {backups.length === 0 ? (
              <Box>No backup information available.</Box>
            ) : (
              <Table
                items={backups}
                columnDefinitions={[
                  { header: "Type", cell: (item: any) => item.type },
                  {
                    header: "Status",
                    cell: (item: any) => (
                      <StatusIndicator type={item.status === "ENABLED" ? "success" : "info"}>
                        {item.status}
                      </StatusIndicator>
                    ),
                  },
                  { header: "Earliest Restore", cell: (item: any) => item.earliestRestore },
                  { header: "Latest Restore", cell: (item: any) => item.latestRestore },
                ]}
                header={<Header variant="h2">Continuous Backups</Header>}
                empty={<Box>No backups configured.</Box>}
              />
            )}
          </>
        )}
      </SpaceBetween>
    </Container>
  );

  // Tags content
  const tagsContent = (
    <Container header={<Header variant="h2">Tags</Header>} className="aws-table-card">
      <SpaceBetween size="m" direction="vertical">
        {tagsLoading ? (
          <Box>Loading tags...</Box>
        ) : (
          <>
            {tags.length === 0 ? (
              <Box>No tags configured for this table.</Box>
            ) : (
              <Table
                items={tags}
                columnDefinitions={[
                  { header: "Key", cell: (item: any) => item.Key },
                  { header: "Value", cell: (item: any) => item.Value },
                ]}
                header={<Header variant="h2">Table Tags</Header>}
                empty={<Box>No tags.</Box>}
              />
            )}
          </>
        )}
      </SpaceBetween>
    </Container>
  );

  // Items tab content (backward-compatible)
  const itemsContent = (
    <SpaceBetween size="l" direction="vertical">
      <SpaceBetween direction="horizontal" size="m" alignItems="center">
        <TextFilter
          filteringPlaceholder="Filter items"
          filteringText={filterText}
          filteringAriaLabel="Filter DynamoDB items"
          onChange={({ detail }) => setFilterText(detail.filteringText)}
          countText={
            filterText
              ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
              : undefined
          }
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
          empty={
            <Box textAlign="center">No items found. Try scanning again or add a new item.</Box>
          }
          header={<Header variant="h2">Items ({filteredItems.length})</Header>}
          ariaLabels={{ selectionGroupLabel: "Select item" }}
        />
      )}
    </SpaceBetween>
  );

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

      headingLevel="h2"
    >
      <SpaceBetween size="l" direction="vertical">
        <Header
          variant="h2"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="primary"
                onClick={() => setAddModalOpen(true)}
                ariaLabel="Add new DynamoDB item"
              >
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
            onChange={({ detail }) => {
              if (detail.activeTabId === "backups") fetchBackups();
              if (detail.activeTabId === "tags") fetchTags();
            }}
            tabs={[
              { label: "Overview", id: "overview", content: overviewContent },
              { label: "Items", id: "items", content: itemsContent },
              { label: "Query", id: "query", content: queryContent },
              { label: "Metrics", id: "metrics", content: metricsContent },
              { label: "Backups", id: "backups", content: backupsContent },
              { label: "Tags", id: "tags", content: tagsContent },
            ]}
          />
        )}
      </SpaceBetween>

      {/* Add / Edit Modal */}
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
            <Button
              variant="link"
              onClick={() => {
                setAddModalOpen(false);
                setEditModalOpen(false);
                setSelectedItem(null);
                setItemJson("{}");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={addModalOpen ? handleAddItem : handleEditItem}
              ariaLabel={addModalOpen ? "Confirm add item" : "Confirm edit item"}
            >
              {addModalOpen ? "Add" : "Save"}
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m" direction="vertical">
          <Box>
            <p>
              Edit the item as native DynamoDB JSON (e.g.,{" "}
              <code>{`{"id":{"S":"123"},"name":{"S":"Alice"}}`}</code>).
            </p>
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

      {/* Delete Confirm Modal */}
      <Modal
        visible={deleteModalOpen}
        onDismiss={() => {
          setDeleteModalOpen(false);
          setSelectedItem(null);
        }}
        header="Delete DynamoDB Item"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="link"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedItem(null);
              }}
            >
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
            This action cannot be undone. The item will be permanently deleted from{" "}
            <strong>{tableName}</strong>.
          </Alert>
          <Box>
            <CodeView
              content={selectedItem ? JSON.stringify(selectedItem, null, 2) : ""}
              lineNumbers
              wrapLines
            />
          </Box>
        </SpaceBetween>
      </Modal>
    </ServiceLayout>
  );
}
