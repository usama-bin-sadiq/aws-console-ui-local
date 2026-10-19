"use client";
import { apiFetch } from "@/lib/api-client";
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

interface TransferServer {
  ServerId: string;
  State: string;
  EndpointType: string;
  Protocols?: string[];
}

export default function TransferPage() {
  const [servers, setServers] = useState<TransferServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createModal, setCreateModal] = useState(false);
  const [protocols, setProtocols] = useState("SFTP");
  const [endpointType, setEndpointType] = useState("PUBLIC");

  const fetchServers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/transfer");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setServers(data.servers || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, []);

  const createServer = async () => {
    try {
      await apiFetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          protocols: protocols.split(",").map((p) => p.trim()),
          endpointType,
        }),
      });
    } finally {
      setCreateModal(false);
      setProtocols("SFTP");
      setEndpointType("PUBLIC");
      fetchServers();
    }
  };

  const deleteServer = async (id: string) => {
    await apiFetch(`/api/transfer?serverId=${encodeURIComponent(id)}`, { method: "DELETE" });
    fetchServers();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">Transfer Family</Header>
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Table
          header={
            <Header
              variant="h2"
              actions={<Button onClick={() => setCreateModal(true)}>Create server</Button>}
            >
              Servers ({servers.length})
            </Header>
          }
          items={servers}
          loading={loading}
          columnDefinitions={[
            { header: "Server ID", cell: (item) => item.ServerId },
            { header: "State", cell: (item) => item.State },
            { header: "Endpoint type", cell: (item) => item.EndpointType },
            {
              header: "Protocols",
              cell: (item) => (item.Protocols ? item.Protocols.join(", ") : "—"),
            },
            {
              header: "Actions",
              cell: (item) => (
                <Button onClick={() => deleteServer(item.ServerId)} formAction="none">
                  Delete
                </Button>
              ),
            },
          ]}
          empty={<Box textAlign="center">No Transfer Family servers found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create server"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createServer}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField
              label="Protocols"
              description="Comma-separated list of protocols (e.g. SFTP, FTP)"
            >
              <Input
                value={protocols}
                onChange={(e) => setProtocols(e.detail.value)}
                placeholder="SFTP"
              />
            </FormField>
            <FormField label="Endpoint type">
              <Input
                value={endpointType}
                onChange={(e) => setEndpointType(e.detail.value)}
                placeholder="PUBLIC"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
