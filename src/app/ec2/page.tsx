"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@cloudscape-design/components";
import type { TableProps } from "@cloudscape-design/components/table";
import { ResourceTable, type ActionDefinition } from "@/features/resource-table";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CopyableText } from "@/components/ui/CopyableText";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";
import { apiFetch } from "@/lib/api-client";
import { EC2Instance } from "@/types/ec2";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

// ── Table Configuration ───────────────────────────────────────────────────

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<EC2Instance>[] = [
  {
    id: "name",
    header: "Name",
    cell: (item) => item.Name || item.InstanceId,
    sortingField: "Name",
    isRowHeader: true,
  },
  {
    id: "instanceId",
    header: "Instance ID",
    cell: (item) => <CopyableText value={String(item.InstanceId)} />,
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
      let status: "success" | "warning" | "error" | "info" = "info";
      if (stateName === "running") status = "success";
      else if (stateName === "pending" || stateName === "rebooting") status = "warning";
      else if (stateName === "terminated" || stateName === "shutting-down") status = "error";
      else if (stateName === "stopped" || stateName === "stopping") status = "warning";
      return <StatusBadge status={status} label={stateName ?? "unknown"} />;
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
        return <StatusBadge status="success" label="2/2 checks passed" />;
      }
      return <StatusBadge status="warning" label="N/A" />;
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
    cell: (item) => (item.LaunchTime ? new Date(item.LaunchTime).toLocaleString() : "—"),
    sortingField: "LaunchTime",
  },
];

const DEFAULT_VISIBLE_COLUMNS = [
  "name",
  "instanceId",
  "instanceType",
  "state",
  "publicIp",
  "privateIp",
  "az",
  "launchTime",
];

// ── Page Component ────────────────────────────────────────────────────────

export default function EC2Page() {
  const router = useRouter();
  const [instances, setInstances] = useState<EC2Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<EC2Instance[]>([]);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant: "warning" | "error";
    onConfirm: () => void;
  }>({ visible: false, title: "", message: "", variant: "warning", onConfirm: () => {} });

  // ── Data Fetching ───────────────────────────────────────────────────────
  const fetchInstances = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/ec2");
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
    queueMicrotask(() => {
      fetchInstances();
    });
  }, [fetchInstances]);

  // ── Actions ─────────────────────────────────────────────────────────────
  const executeAction = useCallback(
    async (action: string, instanceIds: string[]) => {
      try {
        const res = await apiFetch("/api/ec2", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, instanceIds }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || `Action ${action} failed`);
        }
        fetchInstances();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : `Failed to ${action}`);
      }
    },
    [fetchInstances],
  );

  const getSelectedIds = useCallback(() => {
    return selectedItems.map((i) => i.InstanceId!).filter(Boolean);
  }, [selectedItems]);

  const handleStart = useCallback(() => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    executeAction("start", ids);
    setSelectedItems([]);
  }, [getSelectedIds, executeAction]);

  const handleStop = useCallback(() => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    setConfirmModal({
      visible: true,
      title: `Stop ${ids.length} instance(s)?`,
      message:
        "Stopping instances will cause them to be unavailable temporarily. Any data on ephemeral storage will be lost.",
      variant: "warning",
      onConfirm: () => {
        executeAction("stop", ids);
        setSelectedItems([]);
        setConfirmModal((prev) => ({ ...prev, visible: false }));
      },
    });
  }, [getSelectedIds, executeAction]);

  const handleReboot = useCallback(() => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    executeAction("reboot", ids);
    setSelectedItems([]);
  }, [getSelectedIds, executeAction]);

  const handleTerminate = useCallback(() => {
    const ids = getSelectedIds();
    if (ids.length === 0) return;
    setConfirmModal({
      visible: true,
      title: `Terminate ${ids.length} instance(s)?`,
      message:
        "Terminating instances will permanently delete them and all associated EBS volumes that have DeleteOnTermination set to true. This action cannot be undone.",
      variant: "error",
      onConfirm: () => {
        executeAction("terminate", ids);
        setSelectedItems([]);
        setConfirmModal((prev) => ({ ...prev, visible: false }));
      },
    });
  }, [getSelectedIds, executeAction]);

  // ── Action Definitions ───────────────────────────────────────────────────
  const actions: ActionDefinition<EC2Instance>[] = [
    {
      id: "start",
      label: "Start instances",
      disabled: (items: EC2Instance[]) => !items.some((i) => i.State?.Name !== "running"),
      onClick: handleStart,
    },
    {
      id: "stop",
      label: "Stop instances",
      disabled: (items: EC2Instance[]) => !items.some((i) => i.State?.Name === "running"),
      onClick: handleStop,
    },
    {
      id: "reboot",
      label: "Reboot instances",
      disabled: (items: EC2Instance[]) => !items.some((i) => i.State?.Name === "running"),
      onClick: handleReboot,
    },
    {
      id: "terminate",
      label: "Terminate instances",
      onClick: handleTerminate,
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="aws-service-page">
      <AwsServiceHeader
        serviceName="EC2"
        serviceIcon={SERVICE_ICONS["/ec2"]?.small}
        counter={instances.length}
        primaryAction={
          <button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/ec2/launch")}
          >
            Launch instances
          </button>
        }
      />

      {/* Error Alert */}
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Resource Table */}
      <ResourceTable
        config={{
          serviceKey: "ec2",
          resourceName: "Instances",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "InstanceId",
          createLabel: "Launch instances",
          createHref: "/ec2/launch",
          filterPlaceholder: "Filter instances",
        }}
        items={instances as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as EC2Instance[])}
        onRefresh={fetchInstances}
        actions={actions as unknown as ActionDefinition<Record<string, unknown>>[]}
      />

      {/* Cross-Service Links */}
      <CrossServiceLinks links={CROSS_SERVICE_LINKS["/ec2"] || []} />

      {/* Confirmation Modal */}
      <ConfirmDialog
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmLabel="Confirm"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
}
