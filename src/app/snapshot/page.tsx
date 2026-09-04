"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";

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
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [volumeId, setVolumeId] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchSnapshots = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/snapshot");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch snapshots");
      setSnapshots(data.snapshots || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch snapshots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, []);

  const createSnapshot = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/snapshot", {
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
      const res = await fetch(`/api/snapshot?snapshotId=${encodeURIComponent(snapshotId)}`, {
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

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">EBS Snapshots</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            header={
              <Header
                variant="h2"
                actions={
                  <Button variant="primary" onClick={() => setCreateModal(true)}>
                    Create snapshot
                  </Button>
                }
              >
                Snapshots ({snapshots.length})
              </Header>
            }
            items={snapshots}
            columnDefinitions={[
              { header: "Snapshot ID", cell: (item) => item.SnapshotId },
              { header: "Volume ID", cell: (item) => item.VolumeId || "-" },
              { header: "State", cell: (item) => item.State || "-" },
              { header: "Description", cell: (item) => item.Description || "-" },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteSnapshot(item.SnapshotId)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No snapshots found.</Box>}
          />
        </Container>

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
            <FormField label="Volume ID" constraintText="Required">
              <Input
                value={volumeId}
                onChange={(e) => setVolumeId(e.detail.value)}
                placeholder="vol-0123456789abcdef0"
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
