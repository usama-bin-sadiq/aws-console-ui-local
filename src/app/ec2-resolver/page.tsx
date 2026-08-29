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

interface ResolverEndpoint {
  Id: string;
  Name?: string;
  Direction: string;
  Status: string;
  IpAddressCount: number;
}

export default function Route53ResolverPage() {
  const [endpoints, setEndpoints] = useState<ResolverEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [endpointName, setEndpointName] = useState("");

  const fetchEndpoints = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/route53resolver");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEndpoints(data.endpoints || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEndpoints();
  }, []);

  const createEndpoint = async () => {
    await fetch("/api/route53resolver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createEndpoint", name: endpointName }),
    });
    setCreateModal(false);
    setEndpointName("");
    fetchEndpoints();
  };

  const deleteEndpoint = async (id: string) => {
    await fetch(`/api/route53resolver?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    fetchEndpoints();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Route 53 Resolver</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <Table
            header={
              <Header
                variant="h2"
                actions={<Button onClick={() => setCreateModal(true)}>Create endpoint</Button>}
              >
                Resolver Endpoints ({endpoints.length})
              </Header>
            }
            items={endpoints}
            loading={loading}
            columnDefinitions={[
              { header: "ID", cell: (item) => item.Id },
              { header: "Direction", cell: (item) => item.Direction },
              { header: "Status", cell: (item) => item.Status },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteEndpoint(item.Id)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            empty={<Box textAlign="center">No resolver endpoints found.</Box>}
          />
        </Container>
        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create resolver endpoint"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createEndpoint}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Name">
            <Input
              value={endpointName}
              onChange={(e) => setEndpointName(e.detail.value)}
              placeholder="my-resolver-endpoint"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
