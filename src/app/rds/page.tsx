"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import Modal from "@cloudscape-design/components/modal";
import Alert from "@cloudscape-design/components/alert";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import { RDSInstance } from "@/types/rds";
import TruncatedText from "@/components/TruncatedText";
import { RDS_ENGINE_OPTIONS } from "@/constants/rds-constants";

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<RDSInstance>[] = [
  {
    id: "identifier",
    header: "DB Identifier",
    cell: (item) => (
      <TruncatedText>
        {String(
          <Button
            variant="link"
            onClick={() => window.location.href = `/rds/${item.DBInstanceIdentifier}`}
            formAction="none"
          >
            {item.DBInstanceIdentifier || "—"}
          </Button>
        )}
      </TruncatedText>
    ),
    sortingField: "DBInstanceIdentifier",
    isRowHeader: true,
  },
  {
    id: "engine",
    header: "Engine",
    cell: (item) => item.Engine || "—",
    sortingField: "Engine",
  },
  {
    id: "status",
    header: "Status",
    cell: (item) => {
      const status = item.DBInstanceStatus || "—";
      const isAvailable = status === "available";
      return (
        <StatusIndicator type={isAvailable ? "success" : "warning"}>
          {status}
        </StatusIndicator>
      );
    },
    sortingField: "DBInstanceStatus",
  },
  {
    id: "class",
    header: "Class",
    cell: (item) => item.DBInstanceClass || "—",
    sortingField: "DBInstanceClass",
  },
  {
    id: "endpoint",
    header: "Endpoint",
    cell: (item) => item.Endpoint?.Address || "—",
  },
  {
    id: "multiAZ",
    header: "Multi-AZ",
    cell: (item) => (item.MultiAZ ? "Yes" : "No"),
    sortingField: "MultiAZ",
  },
  {
    id: "storage",
    header: "Allocated Storage (GB)",
    cell: (item) => (item.AllocatedStorage ? `${item.AllocatedStorage}` : "—"),
    sortingField: "AllocatedStorage",
  },
  {
    id: "created",
    header: "Created",
    cell: (item) => (item.InstanceCreateTime ? new Date(item.InstanceCreateTime).toLocaleString() : "—"),
    sortingField: "InstanceCreateTime",
  },
];

const VISIBLE_COLUMNS = ["identifier", "engine", "status", "class", "endpoint", "multiAZ", "storage", "created"];

export default function RDSPage() {
  const router = useRouter();
  const [instances, setInstances] = useState<RDSInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<RDSInstance[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [preferences, setPreferences] = useState({
    pageSize: 25,
    visibleContent: VISIBLE_COLUMNS,
  });
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    onConfirm: () => void;
    content: React.ReactNode;
  }>({ visible: false, title: "", onConfirm: () => { }, content: null });

  // Create instance modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    DBInstanceIdentifier: "",
    Engine: "mysql",
    DBInstanceClass: "db.t3.micro",
    MasterUsername: "admin",
    MasterUserPassword: "",
    AllocatedStorage: 20,
  });
  const [creating, setCreating] = useState(false);

  // Snapshot creation state
  const [showSnapshot, setShowSnapshot] = useState(false);
  const [snapshotId, setSnapshotId] = useState("");
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rds");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInstances(data.instances || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch RDS instances");
      setInstances([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const executeInstanceAction = useCallback(
    async (action: string, dbInstanceIdentifiers: string[], extra?: Record<string, unknown>) => {
      try {
        await Promise.all(dbInstanceIdentifiers.map(async (dbInstanceIdentifier) => {
          const res = await fetch("/api/rds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, dbInstanceIdentifier, ...extra }),
          });
          const data = await res.json();
          if (!res.ok || data.error) throw new Error(data.error || `Action ${action} failed for ${dbInstanceIdentifier}`);
        }));
        fetchInstances();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : `Failed to ${action}`);
      }
    },
    [fetchInstances]
  );

  const handleStart = useCallback(() => {
    const ids = selectedItems.map((i) => i.DBInstanceIdentifier!).filter(Boolean);
    if (ids.length === 0) return;
    executeInstanceAction("startInstance", ids);
    setSelectedItems([]);
  }, [selectedItems, executeInstanceAction]);

  const handleStop = useCallback(() => {
    const ids = selectedItems.map((i) => i.DBInstanceIdentifier!).filter(Boolean);
    if (ids.length === 0) return;
    setConfirmModal({
      visible: true,
      title: `Stop ${ids.length} DB instance(s)?`,
      onConfirm: () => {
        executeInstanceAction("stopInstance", ids);
        setSelectedItems([]);
        setConfirmModal((prev) => ({ ...prev, visible: false }));
      },
      content: (
        <Box>
          <StatusIndicator type="warning">
            Stopping DB instances will make them unavailable temporarily.
          </StatusIndicator>
        </Box>
      ),
    });
  }, [selectedItems, executeInstanceAction]);

  const handleReboot = useCallback(() => {
    const ids = selectedItems.map((i) => i.DBInstanceIdentifier!).filter(Boolean);
    if (ids.length === 0) return;
    executeInstanceAction("rebootInstance", ids);
    setSelectedItems([]);
  }, [selectedItems, executeInstanceAction]);

  const handleDelete = useCallback(() => {
    const ids = selectedItems.map((i) => i.DBInstanceIdentifier!).filter(Boolean);
    if (ids.length === 0) return;
    setConfirmModal({
      visible: true,
      title: `Delete ${ids.length} DB instance(s)?`,
      onConfirm: () => {
        void Promise.all(ids.map(async (id) => {
          const response = await fetch("/api/rds", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "deleteInstance", dbInstanceIdentifier: id, skipFinalSnapshot: true }),
          });
          const data = await response.json();
          if (!response.ok || data.error) throw new Error(data.error || `Failed to delete ${id}`);
        })).then(() => fetchInstances()).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Failed to delete DB instances"));
        setSelectedItems([]);
        setConfirmModal((prev) => ({ ...prev, visible: false }));
      },
      content: (
        <Box>
          <StatusIndicator type="error">
            Deleting DB instances is permanent and will remove the database.
            This action cannot be undone.
          </StatusIndicator>
        </Box>
      ),
    });
  }, [selectedItems, fetchInstances]);

  const handleCreateSnapshot = useCallback(() => {
    const ids = selectedItems.map((i) => i.DBInstanceIdentifier!).filter(Boolean);
    if (ids.length === 0) return;
    setSnapshotId(ids[0] ? `${ids[0]}-snap-${Date.now()}` : "");
    setShowSnapshot(true);
  }, [selectedItems]);

  const confirmSnapshot = useCallback(async () => {
    const ids = selectedItems.map((i) => i.DBInstanceIdentifier!).filter(Boolean);
    if (ids.length === 0 || !snapshotId.trim()) return;
    setCreatingSnapshot(true);
    try {
      const res = await fetch("/api/rds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createSnapshot",
          dbInstanceIdentifier: ids[0],
          snapshotIdentifier: snapshotId,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Snapshot creation failed");
      setShowSnapshot(false);
      setSnapshotId("");
      setSelectedItems([]);
      fetchInstances();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create snapshot");
    } finally {
      setCreatingSnapshot(false);
    }
  }, [selectedItems, snapshotId, fetchInstances]);

  const handleCreateInstance = useCallback(async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/rds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createInstance",
          params: {
            DBInstanceIdentifier: createForm.DBInstanceIdentifier,
            DBInstanceClass: createForm.DBInstanceClass,
            Engine: createForm.Engine,
            MasterUsername: createForm.MasterUsername,
            MasterUserPassword: createForm.MasterUserPassword,
            AllocatedStorage: createForm.AllocatedStorage,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Create instance failed");
      setShowCreate(false);
      setCreateForm({ DBInstanceIdentifier: "", Engine: "mysql", DBInstanceClass: "db.t3.micro", MasterUsername: "admin", MasterUserPassword: "", AllocatedStorage: 20 });
      fetchInstances();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create instance");
    } finally {
      setCreating(false);
    }
  }, [createForm, fetchInstances]);

  const filteredItems = instances.filter((instance) => {
    if (!filteringText.trim()) return true;
    const lower = filteringText.toLowerCase();
    return (
      instance.DBInstanceIdentifier?.toLowerCase().includes(lower) ||
      instance.Engine?.toLowerCase().includes(lower) ||
      instance.DBInstanceStatus?.toLowerCase().includes(lower) ||
      instance.DBInstanceClass?.toLowerCase().includes(lower) ||
      instance.Endpoint?.Address?.toLowerCase().includes(lower)
    );
  });

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const headerActions = (
    <SpaceBetween direction="horizontal" size="xs">
      <Button iconName="refresh" onClick={fetchInstances} ariaLabel="Refresh" />
      <ButtonDropdown
        items={[
          { text: "Start instance", id: "start", disabled: selectedItems.length !== 1 || selectedItems[0]?.DBInstanceStatus === "available" },
          { text: "Stop instance", id: "stop", disabled: selectedItems.length !== 1 || selectedItems[0]?.DBInstanceStatus !== "available" },
          { text: "Reboot instance", id: "reboot", disabled: selectedItems.length !== 1 || selectedItems[0]?.DBInstanceStatus !== "available" },
          { text: "Create DB snapshot", id: "snapshot", disabled: selectedItems.length === 0 },
          { text: "Delete instance", id: "delete", disabled: selectedItems.length === 0 },
        ]}
        onItemClick={({ detail }) => {
          if (detail.id === "start") handleStart();
          else if (detail.id === "stop") handleStop();
          else if (detail.id === "reboot") handleReboot();
          else if (detail.id === "snapshot") handleCreateSnapshot();
          else if (detail.id === "delete") handleDelete();
        }}
        disabled={selectedItems.length === 0}
        ariaLabel="Instance actions"
      >
        Actions
      </ButtonDropdown>
      <Button variant="primary" onClick={() => setShowCreate(true)}>
        Create DB instance
      </Button>
    </SpaceBetween>
  );

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1" counter={`(${instances.length})`} actions={headerActions}>
          RDS — Relational Database Service
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            columnDefinitions={COLUMN_DEFINITIONS}
            items={pagedItems}
            loading={loading}
            loadingText="Loading DB instances..."
            selectionType="multi"
            selectedItems={selectedItems}
            onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems as RDSInstance[])}
            trackBy="DBInstanceIdentifier"
            sortingColumn={COLUMN_DEFINITIONS[0]}
            sortingDescending
            filter={
              <TextFilter
                filteringText={filteringText}
                filteringPlaceholder="Filter DB instances"
                filteringAriaLabel="Filter DB instances"
                onChange={({ detail }) => {
                  setFilteringText(detail.filteringText);
                  setCurrentPage(1);
                }}
                countText={
                  filteringText
                    ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                    : `${instances.length} DB instances`
                }
              />
            }
            pagination={
              <Pagination
                currentPageIndex={currentPage}
                pagesCount={Math.ceil(filteredItems.length / pageSize)}
                onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
                ariaLabels={{
                  nextPageLabel: "Next page",
                  previousPageLabel: "Previous page",
                  pageLabel: (n) => `Page ${n}`,
                }}
              />
            }
            preferences={
              <CollectionPreferences
                title="Preferences"
                confirmLabel="Confirm"
                cancelLabel="Cancel"
                preferences={preferences}
                pageSizePreference={{
                  title: "Page size",
                  options: [
                    { value: 10, label: "10 instances" },
                    { value: 25, label: "25 instances" },
                    { value: 50, label: "50 instances" },
                    { value: 100, label: "100 instances" },
                  ],
                }}
                visibleContentPreference={{
                  title: "Select visible columns",
                  options: [
                    {
                      label: "Columns",
                      options: COLUMN_DEFINITIONS.map((col) => ({
                        id: col.id!,
                        label: col.header?.toString() ?? col.id!,
                        editable: true,
                      })),
                    },
                  ],
                }}
                onConfirm={({ detail }) => {
                  setPageSize(detail.pageSize ?? 25);
                  setPreferences({
                    pageSize: detail.pageSize ?? 25,
                    visibleContent: (detail.visibleContent as string[]) ?? VISIBLE_COLUMNS,
                  });
                }}
              />
            }
            empty={
              <Box textAlign="center" color="inherit">
                <Box variant="strong" textAlign="center" color="inherit">
                  No DB instances found
                </Box>
                <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                  {filteringText
                    ? "No instances match your filter. Try a different search."
                    : "To get started, create a DB instance."}
                </Box>
                {!filteringText && <Button onClick={() => setShowCreate(true)}>Create DB instance</Button>}
              </Box>
            }
          />
        </Container>
      </SpaceBetween>

      {/* Confirm Modal */}
      <Modal
        visible={confirmModal.visible}
        onDismiss={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
        header={confirmModal.title}
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setConfirmModal((prev) => ({ ...prev, visible: false }))} formAction="none">
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmModal.onConfirm}>
              Confirm
            </Button>
          </SpaceBetween>
        }
      >
        {confirmModal.content}
      </Modal>

      {/* Create Instance Modal */}
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create DB instance"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setShowCreate(false)} formAction="none">Cancel</Button>
            <Button variant="primary" loading={creating} onClick={handleCreateInstance} formAction="none">
              Create DB instance
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField label="DB instance identifier">
            <Input
              value={createForm.DBInstanceIdentifier}
              onChange={({ detail }) => setCreateForm({ ...createForm, DBInstanceIdentifier: detail.value })}
              placeholder="my-db-instance"
            />
          </FormField>
          <FormField label="Engine">
            <Select
              selectedOption={{ label: createForm.Engine, value: createForm.Engine }}
              options={RDS_ENGINE_OPTIONS.map((e) => ({ label: e, value: e }))}
              onChange={({ detail }) => setCreateForm({ ...createForm, Engine: detail.selectedOption.value as string })}
            />
          </FormField>
          <FormField label="DB instance class">
            <Input
              value={createForm.DBInstanceClass}
              onChange={({ detail }) => setCreateForm({ ...createForm, DBInstanceClass: detail.value })}
              placeholder="db.t3.micro"
            />
          </FormField>
          <FormField label="Master username">
            <Input
              value={createForm.MasterUsername}
              onChange={({ detail }) => setCreateForm({ ...createForm, MasterUsername: detail.value })}
              placeholder="admin"
            />
          </FormField>
          <FormField label="Master user password">
            <Input
              value={createForm.MasterUserPassword}
              type="password"
              onChange={({ detail }) => setCreateForm({ ...createForm, MasterUserPassword: detail.value })}
              placeholder="Enter password"
            />
          </FormField>
          <FormField label="Allocated storage (GB)">
            <Input
              value={String(createForm.AllocatedStorage)}
              onChange={({ detail }) => setCreateForm({ ...createForm, AllocatedStorage: parseInt(detail.value || "20", 10) })}
              placeholder="20"
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* Snapshot Modal */}
      <Modal
        visible={showSnapshot}
        onDismiss={() => { setShowSnapshot(false); setSnapshotId(""); }}
        header="Create DB snapshot"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => { setShowSnapshot(false); setSnapshotId(""); }} formAction="none">Cancel</Button>
            <Button variant="primary" loading={creatingSnapshot} onClick={confirmSnapshot} formAction="none">
              Create snapshot
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <Box>
            <Box variant="small" color="text-label">DB Instance</Box>
            <Box>{selectedItems.map((i) => i.DBInstanceIdentifier).filter(Boolean).join(", ")}</Box>
          </Box>
          <FormField label="Snapshot identifier">
            <Input
              value={snapshotId}
              onChange={({ detail }) => setSnapshotId(detail.value)}
              placeholder="my-snapshot"
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
