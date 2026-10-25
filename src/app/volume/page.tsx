"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState, useCallback } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Alert from "@cloudscape-design/components/alert";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import TruncatedText from "@/components/TruncatedText";
import { EC2Volume } from "@/types/ec2";
import { EC2_VOLUME_TYPES } from "@/constants/ec2-constants";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

export default function VolumePage() {
  const [volumes, setVolumes] = useState<EC2Volume[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<EC2Volume[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [createModal, setCreateModal] = useState(false);
  const [attachModal, setAttachModal] = useState(false);
  const [formSize, setFormSize] = useState("20");
  const [formType, setFormType] = useState("gp3");
  const [formAZ, setFormAZ] = useState("us-east-1a");
  const [attachInstance, setAttachInstance] = useState("");
  const [attachDevice, setAttachDevice] = useState("/dev/xvdf");
  const [runningInstances, setRunningInstances] = useState<
    Array<{ InstanceId?: string; Name?: string }>
  >([]);

  const fetchVolumes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/volume");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVolumes(
        (data.volumes || []).map((v: any) => ({
          ...v,
          Size: v.Size || 0,
          VolumeType: v.VolumeType || "gp3",
        })),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch volumes");
    }
    setLoading(false);
  }, []);

  const fetchRunningInstances = useCallback(async () => {
    try {
      const res = await apiFetch("/api/volume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listInstances" }),
      });
      const data = await res.json();
      setRunningInstances(data.instances || []);
    } catch {
      setRunningInstances([]);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchVolumes();
    });
    queueMicrotask(() => {
      fetchRunningInstances();
    });
  }, [fetchVolumes, fetchRunningInstances]);

  const handleCreate = useCallback(async () => {
    try {
      const res = await apiFetch("/api/volume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          size: parseInt(formSize, 10) || 20,
          volumeType: formType,
          availabilityZone: formAZ,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to create volume");
      setCreateModal(false);
      setFormSize("20");
      setFormType("gp3");
      fetchVolumes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create volume");
    }
  }, [formSize, formType, formAZ, fetchVolumes]);

  const handleDelete = useCallback(async () => {
    const ids = selectedItems.map((v) => v.VolumeId).filter(Boolean) as string[];
    if (ids.length === 0) return;
    try {
      for (const id of ids) {
        await apiFetch(`/api/volume`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete", volumeId: id }),
        });
      }
      setSelectedItems([]);
      fetchVolumes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete volume");
    }
  }, [selectedItems, fetchVolumes]);

  const handleAttach = useCallback(async () => {
    const id = selectedItems[0]?.VolumeId;
    if (!id || !attachInstance) return;
    try {
      const res = await apiFetch("/api/volume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "attach",
          volumeId: id,
          instanceId: attachInstance,
          device: attachDevice,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to attach volume");
      setAttachModal(false);
      setAttachInstance("");
      fetchVolumes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to attach volume");
    }
  }, [selectedItems, attachInstance, attachDevice, fetchVolumes]);

  const handleDetach = useCallback(async () => {
    const id = selectedItems[0]?.VolumeId;
    if (!id) return;
    try {
      const res = await apiFetch("/api/volume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "detach", volumeId: id }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to detach volume");
      fetchVolumes();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to detach volume");
    }
  }, [selectedItems, fetchVolumes]);

  const filteredItems = volumes.filter((v) => {
    if (!filteringText.trim()) return true;
    return v.VolumeId?.toLowerCase().includes(filteringText.toLowerCase());
  });

  const pageSize = 25;
  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selectedIds = selectedItems.map((v) => v.VolumeId).filter(Boolean) as string[];

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="EBS Volume"
          serviceIcon={SERVICE_ICONS["/volume"]?.small}
          counter={volumes?.length ?? 0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/volume/create")}
            >
              Create volume
            </button>
          }
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Table
          columnDefinitions={[
            {
              id: "volumeId",
              header: "Volume ID",
              cell: (item) => item.VolumeId,
              sortingField: "VolumeId",
            },
            {
              id: "size",
              header: "Size",
              cell: (item) => `${item.Size || 0} GiB`,
              sortingField: "Size",
            },
            { id: "type", header: "Volume Type", cell: (item) => item.VolumeType || "gp3" },
            {
              id: "state",
              header: "State",
              cell: (item) => (
                <StatusIndicator
                  type={
                    item.State === "available"
                      ? "success"
                      : item.State === "in-use"
                        ? "info"
                        : "warning"
                  }
                >
                  {item.State || "—"}
                </StatusIndicator>
              ),
            },
            { id: "az", header: "Availability Zone", cell: (item) => item.AvailabilityZone || "—" },
            { id: "iops", header: "IOPS", cell: (item) => (item.Iops ? String(item.Iops) : "—") },
            {
              id: "attachments",
              header: "Attachments",
              cell: (item) => (
                <TruncatedText>
                  {item.Attachments && item.Attachments.length > 0
                    ? item.Attachments.map((a) => a.InstanceId).join(", ")
                    : "—"}
                </TruncatedText>
              ),
            },
          ]}
          items={pagedItems}
          loading={loading}
          loadingText="Loading volumes..."
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems as EC2Volume[])}
          trackBy="VolumeId"
          filter={
            <TextFilter
              filteringText={filteringText}
              filteringPlaceholder="Filter volumes"
              filteringAriaLabel="Filter volumes"
              onChange={({ detail }) => {
                setFilteringText(detail.filteringText);
                setCurrentPage(1);
              }}
            />
          }
          pagination={
            <Pagination
              currentPageIndex={currentPage}
              pagesCount={Math.ceil(filteredItems.length / pageSize)}
              onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
            />
          }
          empty={
            <Box textAlign="center" color="inherit">
              <Box variant="strong" textAlign="center" color="inherit">
                No volumes found
              </Box>
              <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                Create a new EBS volume to attach to your instances.
              </Box>
              <Button onClick={() => setCreateModal(true)}>Create volume</Button>
            </Box>
          }
        />
      </SpaceBetween>

      <Modal
        visible={createModal}
        onDismiss={() => setCreateModal(false)}
        header="Create volume"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setCreateModal(false)} formAction="none">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Create
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Size (GiB)">
            <Input
              value={formSize}
              onChange={({ detail }) => setFormSize(detail.value)}
              type="number"
              placeholder="20"
            />
          </FormField>
          <FormField label="Volume Type">
            <Select
              selectedOption={{
                value: formType,
                label: EC2_VOLUME_TYPES.find((t) => t.value === formType)?.label || formType,
              }}
              options={EC2_VOLUME_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              onChange={({ detail }) => setFormType(detail.selectedOption.value || "gp3")}
            />
          </FormField>
          <FormField label="Availability Zone">
            <Input
              value={formAZ}
              onChange={({ detail }) => setFormAZ(detail.value)}
              placeholder="us-east-1a"
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      <Modal
        visible={attachModal}
        onDismiss={() => setAttachModal(false)}
        header="Attach Volume"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setAttachModal(false)} formAction="none">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleAttach} disabled={!attachInstance}>
              Attach
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <Box variant="small" color="text-label">
            Select running instance
          </Box>
          <Select
            selectedOption={{
              value: attachInstance,
              label:
                runningInstances.find((i) => i.InstanceId === attachInstance)?.Name ||
                attachInstance ||
                "Select instance",
            }}
            options={[
              { value: "", label: "Select instance" },
              ...runningInstances.map((i) => ({
                value: i.InstanceId || "",
                label: `${i.Name || i.InstanceId} (${i.InstanceId})`,
              })),
            ]}
            onChange={({ detail }) => setAttachInstance(detail.selectedOption.value || "")}
          />
          <FormField label="Device name">
            <Input
              value={attachDevice}
              onChange={({ detail }) => setAttachDevice(detail.value)}
              placeholder="/dev/xvdf"
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
