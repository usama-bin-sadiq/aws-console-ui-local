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

interface Volume {
  VolumeId: string;
  Size: number;
  State?: string;
  VolumeType?: string;
  AvailabilityZone?: string;
}

export default function VolumePage() {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [size, setSize] = useState("20");
  const [volumeType, setVolumeType] = useState("gp3");
  const [az, setAz] = useState("us-east-1a");
  const [creating, setCreating] = useState(false);

  const fetchVolumes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/volume");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch volumes");
      setVolumes(data.volumes || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch volumes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolumes();
  }, []);

  const createVolume = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/volume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ size: parseInt(size, 10) || 20, volumeType, az }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create volume");
      }
      setCreateModal(false);
      setSize("20");
      setVolumeType("gp3");
      setAz("us-east-1a");
      fetchVolumes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create volume");
    } finally {
      setCreating(false);
    }
  };

  const deleteVolume = async (volumeId: string) => {
    try {
      const res = await fetch(`/api/volume?volumeId=${encodeURIComponent(volumeId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete volume");
      }
      fetchVolumes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete volume");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">EBS Volumes</Header>

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
                    Create volume
                  </Button>
                }
              >
                Volumes ({volumes.length})
              </Header>
            }
            items={volumes}
            columnDefinitions={[
              { header: "Volume ID", cell: (item) => item.VolumeId },
              { header: "Size (GB)", cell: (item) => item.Size },
              { header: "Volume type", cell: (item) => item.VolumeType || "-" },
              { header: "State", cell: (item) => item.State || "-" },
              { header: "Availability Zone", cell: (item) => item.AvailabilityZone || "-" },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteVolume(item.VolumeId)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No volumes found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create volume"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createVolume} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Size (GiB)" constraintText="Required">
              <Input
                value={size}
                onChange={(e) => setSize(e.detail.value)}
                type="number"
                placeholder="20"
              />
            </FormField>
            <FormField label="Volume type">
              <Input
                value={volumeType}
                onChange={(e) => setVolumeType(e.detail.value)}
                placeholder="gp3"
              />
            </FormField>
            <FormField label="Availability Zone">
              <Input
                value={az}
                onChange={(e) => setAz(e.detail.value)}
                placeholder="us-east-1a"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
