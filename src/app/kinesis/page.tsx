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

interface KinesisStream {
  name: string;
}

export default function KinesisPage() {
  const [streams, setStreams] = useState<KinesisStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [streamName, setStreamName] = useState("");
  const [shardCount, setShardCount] = useState("1");
  const [creating, setCreating] = useState(false);

  const fetchStreams = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/kinesis");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch streams");
      const names: string[] = data.streams || [];
      setStreams(names.map((n) => ({ name: n })));
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
    setCreating(true);
    try {
      const res = await fetch("/api/kinesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamName, shardCount: parseInt(shardCount, 10) || 1 }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create stream");
      }
      setCreateModal(false);
      setStreamName("");
      setShardCount("1");
      fetchStreams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create stream");
    } finally {
      setCreating(false);
    }
  };

  const deleteStream = async (name: string) => {
    try {
      const res = await fetch(`/api/kinesis?streamName=${encodeURIComponent(name)}`, {
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
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Kinesis Data Streams</Header>

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
                    Create data stream
                  </Button>
                }
              >
                Data streams ({streams.length})
              </Header>
            }
            items={streams}
            columnDefinitions={[
              { header: "Stream name", cell: (item) => item.name },
              {
                header: "Actions",
                cell: (item) => (
                  <Button
                    onClick={() => deleteStream(item.name)}
                    formAction="none"
                  >
                    Delete
                  </Button>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No streams found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create data stream"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createStream} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Data stream name" constraintText="Required">
              <Input
                value={streamName}
                onChange={(e) => setStreamName(e.detail.value)}
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
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
