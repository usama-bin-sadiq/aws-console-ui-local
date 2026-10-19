"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Tabs from "@cloudscape-design/components/tabs";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";

interface KinesisStream {
  name: string;
  status?: string;
  shards?: number;
  retentionHours?: number;
}

export default function KinesisPage() {
  const [streams, setStreams] = useState<KinesisStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [streamName, setStreamName] = useState("");
  const [shardCount, setShardCount] = useState("1");
  const [retentionHours, setRetentionHours] = useState("24");
  const [creating, setCreating] = useState(false);
  const [streamNameError, setStreamNameError] = useState<string | null>(null);

  const fetchStreams = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/kinesis");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch streams");
      const names: string[] = data.streams || [];
      setStreams(
        names.map((n: string) => ({
          name: n,
          status:
            data.streamDetails && data.streamDetails[n]
              ? data.streamDetails[n].StreamStatus
              : "ACTIVE",
          shards:
            data.streamDetails && data.streamDetails[n]
              ? data.streamDetails[n].Shards
                ? data.streamDetails[n].Shards.length
                : 1
              : 1,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch streams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  const createStream = async () => {
    if (!streamName.trim()) {
      setStreamNameError("Stream name is required");
      return;
    }
    setStreamNameError(null);
    setCreating(true);
    try {
      const res = await apiFetch("/api/kinesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamName,
          shardCount: parseInt(shardCount, 10) || 1,
          retentionHours: parseInt(retentionHours, 10) || 24,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create stream");
      }
      setCreateModal(false);
      setStreamName("");
      setShardCount("1");
      setRetentionHours("24");
      fetchStreams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create stream");
    } finally {
      setCreating(false);
    }
  };

  const deleteStream = async (name: string) => {
    try {
      const res = await apiFetch(`/api/kinesis?streamName=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete stream");
      }
      fetchStreams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete stream");
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">Kinesis Data Streams</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container className="aws-table-card">
          <Tabs
            tabs={[
              {
                label: "Data streams",
                id: "streams",
                content: (
                  <Table
                    header={
                      <Header
                        variant="h2"
                        actions={
                          <Button variant="primary" onClick={() => setCreateModal(true)}>
                            Create data stream
                          </Button>
                        }
                      >
                        Data streams ({streams.length})
                      </Header>
                    }
                    items={streams}
                    columnDefinitions={[
                      { header: "Stream name", cell: (item: KinesisStream) => item.name },
                      { header: "Status", cell: (item: KinesisStream) => item.status || "—" },
                      {
                        header: "Shards",
                        cell: (item: KinesisStream) => String(item.shards || "—"),
                      },
                      {
                        header: "Actions",
                        cell: (item: KinesisStream) => (
                          <Button onClick={() => deleteStream(item.name)} formAction="none">
                            Delete
                          </Button>
                        ),
                      },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No streams found.</Box>}
                  />
                ),
              },
              {
                label: "Analytics",
                id: "analytics",
                content: (
                  <Box padding="m" color="text-body-secondary">
                    <Header variant="h2">Analytics overview</Header>
                    <SpaceBetween size="s">
                      <Box>
                        Stream analytics and metrics available through adapter SDK integration.
                      </Box>
                      <Box>Use the query editor or analytics APIs to process stream records.</Box>
                    </SpaceBetween>
                  </Box>
                ),
              },
              {
                label: "Video Streams",
                id: "video",
                content: (
                  <Box padding="m" color="text-body-secondary">
                    <Header variant="h2">Video streams</Header>
                    <SpaceBetween size="s">
                      <Box>
                        Kinesis Video Streams support is available through the adapter SDK layer.
                      </Box>
                      <Box>
                        Manage video ingestion and retrieval via adapter-compatible endpoints.
                      </Box>
                    </SpaceBetween>
                  </Box>
                ),
              },
            ]}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => {
            setCreateModal(false);
            setStreamName("");
            setShardCount("1");
            setRetentionHours("24");
          }}
          header="Create data stream"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setCreateModal(false);
                  setStreamName("");
                  setShardCount("1");
                  setRetentionHours("24");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={createStream} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField
              label={
                <>
                  Data stream name <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={streamNameError}
            >
              <Input
                value={streamName}
                onChange={(e) => {
                  setStreamName(e.detail.value);
                  setStreamNameError(null);
                }}
                placeholder="my-stream"
              />
            </FormField>
            <FormField label="Number of shards">
              <Input
                value={shardCount}
                onChange={(e) => setShardCount(e.detail.value)}
                type="number"
                placeholder="1"
              />
            </FormField>
            <FormField label="Retention period (hours)">
              <Input
                value={retentionHours}
                onChange={(e) => setRetentionHours(e.detail.value)}
                type="number"
                placeholder="24"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
