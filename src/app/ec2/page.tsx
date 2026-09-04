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
import { EC2Instance, EC2InstanceState } from "@/types/ec2";

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<EC2Instance>[] = [
  {
    id: "name",
    header: "Name",
    cell: (item) => (
      <Button
        variant="link"
        onClick={() => window.location.href = `/ec2/${item.InstanceId}`}
        formAction="none"
      >
        {item.Name || item.InstanceId}
      </Button>
    ),
    sortingField: "Name",
    isRowHeader: true,
  },
  {
    id: "instanceId",
    header: "Instance ID",
    cell: (item) => item.InstanceId,
    sortingField: "InstanceId",
  },
  {
    id: "instanceType",
    header: "Instance Type",
    cell: (item) => item.InstanceType,
    sortingField: "InstanceType",
  },
  {
    id: "state",
    header: "Instance State",
    cell: (item) => {
      const stateName = item.State?.Name;
      let type: "success" | "warning" | "error" | "info" = "info";
      if (stateName === "running") type = "success";
      else if (stateName === "pending" || stateName === "rebooting") type = "warning";
      else if (stateName === "terminated" || stateName === "shutting-down") type = "error";
      else if (stateName === "stopped" || stateName === "stopping") type = "warning";
      return <StatusIndicator type={type}>{stateName}</StatusIndicator>;
    },
    sortingField: "State",
  },
  {
    id: "statusChecks",
    header: "Status Checks",
    cell: (item) => {
      const system = item.StatusChecks?.SystemStatus?.Status;
      const instance = item.StatusChecks?.InstanceStatus?.Status;
      if (system === "ok" && instance === "ok") {
        return <StatusIndicator type="success">2/2 checks passed</StatusIndicator>;
      }
      return <StatusIndicator type="warning">N/A</StatusIndicator>;
    },
  },
  {
    id: "publicIp",
    header: "Public IPv4 Address",
    cell: (item) => item.PublicIpAddress || "—",
  },
  {
    id: "privateIp",
    header: "Private IPv4 Address",
    cell: (item) => item.PrivateIpAddress || "—",
  },
  {
    id: "az",
    header: "Availability Zone",
    cell: (item) => item.AvailabilityZone || "—",
  },
  {
    id: "vpc",
    header: "VPC ID",
    cell: (item) => item.VpcId || "—",
  },
  {
    id: "subnet",
    header: "Subnet ID",
    cell: (item) => item.SubnetId || "—",
  },
  {
    id: "launchTime",
    header: "Launch Time",
    cell: (item) => item.LaunchTime ? new Date(item.LaunchTime).toLocaleString() : "—",
    sortingField: "LaunchTime",
  },
];

const VISIBLE_COLUMNS = ["name", "instanceId", "instanceType", "state", "publicIp", "privateIp", "az", "launchTime"];

export default function EC2Page() {
  const router = useRouter();
  const [instances, setInstances] = useState<EC2Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<EC2Instance[]>([]);
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
  }>({ visible: false, title: "", onConfirm: () => {}, content: null });

  const fetchInstances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ec2");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInstances(data.instances || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch instances");
      setInstances([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  const executeAction = useCallback(async (action: string, instanceIds: string[], extra?: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, instanceIds, ...extra }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || `Action ${action} failed`);
      }
      fetchInstances();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    }
  }, [fetchInstances]);

  const handleStart = useCallback(() => {
    const ids = selectedItems.map((i) => i.InstanceId!).filter(Boolean);
    if (ids.length === 0) return;
    executeAction("start", ids);
    setSelectedItems([]);
  }, [selectedItems, executeAction]);

  const handleStop = useCallback(() => {
    const ids = selectedItems.map((i) => i.InstanceId!).filter(Boolean);
    if (ids.length === 0) return;
    setConfirmModal({
      visible: true,
      title: `Stop ${ids.length} instance(s)?`,
      onConfirm: () => {
        executeAction("stop", ids);
        setSelectedItems([]);
        setConfirmModal((prev) => ({ ...prev, visible: false }));
      },
      content: (
        <Box>
          <StatusIndicator type="warning">
            Stopping instances will cause them to be unavailable temporarily.
            Any data on ephemeral storage will be lost.
          </StatusIndicator>
        </Box>
      ),
    });
  }, [selectedItems, executeAction]);

  const handleReboot = useCallback(() => {
    const ids = selectedItems.map((i) => i.InstanceId!).filter(Boolean);
    if (ids.length === 0) return;
    executeAction("reboot", ids);
    setSelectedItems([]);
  }, [selectedItems, executeAction]);

  const handleTerminate = useCallback(() => {
    const ids = selectedItems.map((i) => i.InstanceId!).filter(Boolean);
    if (ids.length === 0) return;
    setConfirmModal({
      visible: true,
      title: `Terminate ${ids.length} instance(s)?`,
      onConfirm: () => {
        executeAction("terminate", ids);
        setSelectedItems([]);
        setConfirmModal((prev) => ({ ...prev, visible: false }));
      },
      content: (
        <Box>
          <StatusIndicator type="error">
            Terminating instances will permanently delete them and all associated EBS volumes
            that have DeleteOnTermination set to true. This action cannot be undone.
          </StatusIndicator>
        </Box>
      ),
    });
  }, [selectedItems, executeAction]);

  const filteredItems = instances.filter((instance) => {
    if (!filteringText.trim()) return true;
    const lower = filteringText.toLowerCase();
    return (
      instance.InstanceId?.toLowerCase().includes(lower) ||
      instance.Name?.toLowerCase().includes(lower) ||
      instance.InstanceType?.toLowerCase().includes(lower) ||
      instance.State?.Name?.toLowerCase().includes(lower) ||
      instance.PublicIpAddress?.toLowerCase().includes(lower) ||
      instance.PrivateIpAddress?.toLowerCase().includes(lower)
    );
  });

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const headerActions = (
    <SpaceBetween direction="horizontal" size="xs">
      <Button iconName="refresh" onClick={fetchInstances} ariaLabel="Refresh" />
      <ButtonDropdown
        items={[
          { text: "Start instances", id: "start", disabled: !selectedItems.some((i) => i.State?.Name !== "running") },
          { text: "Stop instances", id: "stop", disabled: !selectedItems.some((i) => i.State?.Name === "running") },
          { text: "Reboot instances", id: "reboot", disabled: !selectedItems.some((i) => i.State?.Name === "running") },
          { text: "Terminate instances", id: "terminate", disabled: selectedItems.length === 0 },
        ]}
        onItemClick={({ detail }) => {
          if (detail.id === "start") handleStart();
          else if (detail.id === "stop") handleStop();
          else if (detail.id === "reboot") handleReboot();
          else if (detail.id === "terminate") handleTerminate();
        }}
        disabled={selectedItems.length === 0}
        ariaLabel="Instance actions"
      >
        Actions
      </ButtonDropdown>
      <Button
        variant="primary"
        onClick={() => router.push("/ec2/launch")}
        ariaLabel="Launch EC2 instances"
      >
        Launch instances
      </Button>
    </SpaceBetween>
  );

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          counter={`(${instances.length})`}
          actions={headerActions}
        >
          EC2 - Elastic Compute Cloud
        </Header>

        {error && (
          <Alert
            type="error"
            dismissible
            onDismiss={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <Container>
          <Table
            columnDefinitions={COLUMN_DEFINITIONS}
            items={pagedItems}
            loading={loading}
            loadingText="Loading instances..."
            selectionType="multi"
            selectedItems={selectedItems}
            onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems as EC2Instance[])}
            trackBy="InstanceId"
            sortingColumn={COLUMN_DEFINITIONS[0]}
            sortingDescending
            filter={
              <TextFilter
                filteringText={filteringText}
                filteringPlaceholder="Filter instances"
                filteringAriaLabel="Filter instances"
                onChange={({ detail }) => {
                  setFilteringText(detail.filteringText);
                  setCurrentPage(1);
                }}
                countText={
                  filteringText
                    ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                    : `${instances.length} instances`
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
                  No instances found
                </Box>
                <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                  {filteringText
                    ? "No instances match your filter. Try a different search."
                    : "To get started, launch an EC2 instance."}
                </Box>
                {!filteringText && (
                  <Button onClick={() => router.push("/ec2/launch")}>
                    Launch instances
                  </Button>
                )}
              </Box>
            }
          />
        </Container>
      </SpaceBetween>

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
    </div>
  );
}
