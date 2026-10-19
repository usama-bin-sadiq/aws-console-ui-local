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

interface FirehoseStream {
  name: string;
  status?: string;
  deliveryStreamType?: string;
  destinations?: number;
}

export default function FirehosePage() {
  const [streams, setStreams] = useState<FirehoseStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [streamName, setStreamName] = useState("");
  const [deliveryType, setDeliveryType] = useState("DirectPut");
  const [creating, setCreating] = useState(false);
  const [streamNameError, setStreamNameError] = useState<string | null>(null);

  const fetchStreams = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/firehose");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch delivery streams");
      const names: string[] = data.deliveryStreamNames || [];
      const details = data.streamDetails || {};
      setStreams(
        names.map((n: string) => ({
          name: n,
          status: details[n]?.DeliveryStreamStatus || "ACTIVE",
          deliveryStreamType: details[n]?.DeliveryStreamType || "DirectPut",
          destinations: details[n]?.Destinations ? details[n].Destinations.length : 0,
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch delivery streams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreams();
  }, []);

  const createStream = async () => {
    if (!streamName.trim()) {
      setStreamNameError("Delivery stream name is required");
      return;
    }
    setStreamNameError(null);
    setCreating(true);
    try {
      const res = await apiFetch("/api/firehose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryStreamName: streamName, deliveryStreamType: deliveryType }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create delivery stream");
      }
      setCreateModal(false);
      setStreamName("");
      setDeliveryType("DirectPut");
      fetchStreams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create delivery stream");
    } finally {
      setCreating(false);
    }
  };

  const deleteStream = async (name: string) => {
    try {
      const res = await apiFetch(`/api/firehose?streamName=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete delivery stream");
      }
      fetchStreams();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete delivery stream");
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">Amazon Data Firehose</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container className="aws-table-card">
          <Tabs
            tabs={[
              {
                label: "Delivery streams",
                id: "delivery-streams",
                content: (
                  <Table
                    header={
                      <Header
                        variant="h2"
                        actions={
                          <Button variant="primary" onClick={() => setCreateModal(true)}>
                            Create delivery stream
                          </Button>
                        }
                      >
                        Delivery streams ({streams.length})
                      </Header>
                    }
                    items={streams}
                    columnDefinitions={[
                      { header: "Delivery stream name", cell: (item: FirehoseStream) => item.name },
                      { header: "Status", cell: (item: FirehoseStream) => item.status || "—" },
                      {
                        header: "Type",
                        cell: (item: FirehoseStream) => item.deliveryStreamType || "—",
                      },
                      {
                        header: "Destinations",
                        cell: (item: FirehoseStream) => String(item.destinations || 0),
                      },
                      {
                        header: "Actions",
                        cell: (item: FirehoseStream) => (
                          <Button onClick={() => deleteStream(item.name)} formAction="none">
                            Delete
                          </Button>
                        ),
                      },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No delivery streams found.</Box>}
                  />
                ),
              },
              {
                label: "Configuration",
                id: "config",
                content: (
                  <Box padding="m" color="text-body-secondary">
                    <Header variant="h2">Firehose configuration</Header>
                    <SpaceBetween size="s">
                      <Box>
                        Configure delivery streams for S3, Redshift, OpenSearch, or custom
                        destinations.
                      </Box>
                      <Box>
                        Adapter SDK handles endpoint routing and authentication automatically.
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
            setDeliveryType("DirectPut");
          }}
          header="Create delivery stream"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setCreateModal(false);
                  setStreamName("");
                  setDeliveryType("DirectPut");
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
                  Delivery stream name <span style={{ color: "red" }}>*</span>
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
                placeholder="my-delivery-stream"
              />
            </FormField>
            <FormField label="Delivery stream type">
              <Input
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.detail.value)}
                placeholder="DirectPut"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
