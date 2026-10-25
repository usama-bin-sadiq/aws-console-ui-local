"use client";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Header from "@cloudscape-design/components/header";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { useRouter } from "next/navigation";

interface IoTAnalyticsChannel {
  name?: string;
  arn?: string;
  status?: string;
  creationTime?: string;
  lastMessageArrivalTime?: string;
}

export default function IotAnalyticsPage() {
  const [channels, setChannels] = useState<IoTAnalyticsChannel[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [channelName, setChannelName] = useState("");
  const [deleteChannelName, setDeleteChannelName] = useState<string | null>(null);

  const fetchChannels = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/iot-analytics");
      const payload = (await response.json()) as {
        channels?: IoTAnalyticsChannel[];
        error?: string;
      };
      if (!response.ok || payload.error)
        throw new Error(payload.error || "Failed to load channels");
      setChannels(payload.channels ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load channels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      void fetchChannels();
    });
  }, []);

  const createChannel = async (): Promise<void> => {
    try {
      const response = await apiFetch("/api/iot-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: channelName }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok || payload.error)
        throw new Error(payload.error || "Failed to create channel");
      setCreateModalOpen(false);
      setChannelName("");
      await fetchChannels();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create channel");
    }
  };

  const deleteChannel = async (): Promise<void> => {
    if (!deleteChannelName) return;
    try {
      const response = await apiFetch(
        `/api/iot-analytics?name=${encodeURIComponent(deleteChannelName)}`,
        { method: "DELETE" },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok || payload.error)
        throw new Error(payload.error || "Failed to delete channel");
      setDeleteChannelName(null);
      await fetchChannels();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete channel");
    }
  };

  return (
    <ServiceLayout
      serviceName="IoT Analytics"
      serviceCategory="Services"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "IoT Analytics", href: "/iot-analytics" },
      ]}
    >
      <SpaceBetween size="l" direction="vertical">
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Table
          header={
            <Header
              counter={`(${channels.length})`}
              actions={
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    iconName="refresh"
                    ariaLabel="Refresh channels"
                    onClick={() => void fetchChannels()}
                  />
                  <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
                    Create channel
                  </Button>
                </SpaceBetween>
              }
            >
              Channels
            </Header>
          }
          items={channels}
          loading={loading}
          loadingText="Loading channels"
          trackBy="name"
          columnDefinitions={[
            {
              id: "name",
              header: "Channel name",
              cell: (item) => item.name || "—",
              isRowHeader: true,
            },
            { id: "arn", header: "ARN", cell: (item) => item.arn || "—" },
            { id: "status", header: "Status", cell: (item) => item.status || "—" },
            {
              id: "created",
              header: "Created",
              cell: (item) =>
                item.creationTime ? new Date(item.creationTime).toLocaleString() : "—",
            },
            {
              id: "actions",
              header: "Actions",
              cell: (item) => (
                <Button formAction="none" onClick={() => setDeleteChannelName(item.name || null)}>
                  Delete
                </Button>
              ),
            },
          ]}
          empty={
            <Box textAlign="center" padding="l">
              <Box variant="strong">No channels found</Box>
              <Box variant="p" padding={{ top: "s" }}>
                Create a channel to start ingesting IoT data.
              </Box>
            </Box>
          }
        />
      </SpaceBetween>
      <Modal
        visible={createModalOpen}
        onDismiss={() => setCreateModalOpen(false)}
        header="Create channel"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button formAction="none" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!channelName.trim()}
              onClick={() => void createChannel()}
            >
              Create
            </Button>
          </SpaceBetween>
        }
      >
        <FormField label="Channel name" constraintText="Use a unique channel name.">
          <Input value={channelName} onChange={({ detail }) => setChannelName(detail.value)} />
        </FormField>
      </Modal>
      <Modal
        visible={deleteChannelName !== null}
        onDismiss={() => setDeleteChannelName(null)}
        header="Delete channel"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button formAction="none" onClick={() => setDeleteChannelName(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => void deleteChannel()}>
              Delete
            </Button>
          </SpaceBetween>
        }
      >
        <Box>
          Delete channel <strong>{deleteChannelName}</strong>? This action cannot be undone.
        </Box>
      </Modal>
    </ServiceLayout>
  );
}
