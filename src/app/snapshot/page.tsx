"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState, useCallback } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import TruncatedText from "@/components/TruncatedText";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface Snapshot {
  SnapshotId: string;
  VolumeId?: string;
  State?: string;
  Progress?: string;
  Description?: string;
  StartTime?: string;
}

export default function SnapshotPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [volumeId, setVolumeId] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Snapshot[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [volumeIdError, setVolumeIdError] = useState<string | null>(null);

  // Volumes for dropdown
  const [volumes, setVolumes] = useState<
    Array<{ VolumeId?: string; Size?: number; State?: string }>
  >([]);

  const fetchSnapshots = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/snapshot");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch snapshots");
      setSnapshots(data.snapshots || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch snapshots");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVolumes = useCallback(async () => {
    try {
      const res = await apiFetch("/api/volume");
      const data = await res.json();
      setVolumes((data.volumes || []).filter((v: { State?: string }) => v.State === "available"));
    } catch {
      // Volumes will be empty
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchSnapshots();
    });
    queueMicrotask(() => {
      fetchVolumes();
    });
  }, [fetchSnapshots, fetchVolumes]);

  const createSnapshot = async () => {
    if (!volumeId) {
      setVolumeIdError("Volume ID is required");
      return;
    }
    setVolumeIdError(null);
    setCreating(true);
    try {
      const res = await apiFetch("/api/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volumeId, description }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create snapshot");
      }
      setCreateModal(false);
      setVolumeId("");
      setDescription("");
      fetchSnapshots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create snapshot");
    } finally {
      setCreating(false);
    }
  };

  const deleteSnapshot = async (snapshotId: string) => {
    try {
      const res = await apiFetch(`/api/snapshot?snapshotId=${encodeURIComponent(snapshotId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete snapshot");
      }
      fetchSnapshots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete snapshot");
    }
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const snap of selected) {
        await deleteSnapshot(snap.SnapshotId);
      }
      setSelected([]);
      fetchSnapshots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete snapshots");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Refresh Delete setCreateModal(true)}> Create snaps"
          serviceIcon={SERVICE_ICONS["/snapshot"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/snapshot/create")}
          >
            Create snapshot
          </button>
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={fetchSnapshots} iconName="refresh" formAction="none">
                Refresh
              </Button>
            </SpaceBetween>
          }
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Table
          items={snapshots}
          loading={loading}
          loadingText="Loading snapshots..."
          selectionType="multi"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems as Snapshot[])}
          trackBy="SnapshotId"
          columnDefinitions={[
            { id: "snapshotId", header: "Snapshot ID", cell: (item) => item.SnapshotId },
            { id: "volumeId", header: "Volume ID", cell: (item) => item.VolumeId || "—" },
            {
              id: "state",
              header: "State",
              cell: (item) => (
                <StatusIndicator
                  type={
                    item.State === "completed"
                      ? "success"
                      : item.State === "pending"
                        ? "pending"
                        : "error"
                  }
                >
                  {item.State || "—"}
                </StatusIndicator>
              ),
            },
            { id: "progress", header: "Progress", cell: (item) => item.Progress || "—" },
            {
              id: "description",
              header: "Description",
              cell: (item) => <TruncatedText>{item.Description || "—"}</TruncatedText>,
            },
            {
              id: "startTime",
              header: "Start Time",
              cell: (item) => (item.StartTime ? new Date(item.StartTime).toLocaleString() : "—"),
            },
            {
              id: "actions",
              header: "Actions",
              cell: (item) => (
                <Button
                  variant="link"
                  onClick={() => deleteSnapshot(item.SnapshotId)}
                  formAction="none"
                >
                  Delete
                </Button>
              ),
            },
          ]}
          empty={<Box textAlign="center">No snapshots found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create snapshot"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createSnapshot} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField
              label={
                <>
                  Volume ID <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={volumeIdError}
            >
              <Select
                selectedOption={
                  volumeId
                    ? {
                        value: volumeId,
                        label: `${volumeId} (${volumes.find((v) => v.VolumeId === volumeId)?.Size || ""} GiB)`,
                      }
                    : null
                }
                options={volumes.map((v) => ({
                  value: v.VolumeId || "",
                  label: `${v.VolumeId} (${v.Size || 0} GiB) - ${v.State}`,
                }))}
                placeholder="Select a volume"
                onChange={(e) => {
                  setVolumeId(e.detail.selectedOption.value || "");
                  setVolumeIdError(null);
                }}
              />
            </FormField>
            <FormField label="Description">
              <Input
                value={description}
                onChange={(e) => setDescription(e.detail.value)}
                placeholder="My snapshot"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
