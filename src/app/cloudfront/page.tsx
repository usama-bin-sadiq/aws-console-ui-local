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

interface CloudFrontDistribution {
  Id: string;
  DomainName: string;
  Status: string;
  Comment?: string;
}

export default function CloudFrontPage() {
  const [distributions, setDistributions] = useState<CloudFrontDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);

  const fetchDistributions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cloudfront");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDistributions(data.distributions || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributions();
  }, []);

  const createDistribution = async () => {
    await fetch("/api/cloudfront", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create" }),
    });
    setCreateModal(false);
    fetchDistributions();
  };

  const deleteDistribution = async (id: string) => {
    await fetch(`/api/cloudfront?id=${encodeURIComponent(id)}&etag=dummy`, { method: "DELETE" });
    fetchDistributions();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">CloudFront</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <Table
            header={
              <Header
                variant="h2"
                actions={<Button onClick={() => setCreateModal(true)}>Create distribution</Button>}
              >
                Distributions ({distributions.length})
              </Header>
            }
            items={distributions}
            loading={loading}
            columnDefinitions={[
              { header: "ID", cell: (item) => item.Id },
              { header: "Domain Name", cell: (item) => item.DomainName },
              { header: "Status", cell: (item) => item.Status },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteDistribution(item.Id)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            empty={<Box textAlign="center">No distributions found.</Box>}
          />
        </Container>
        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create distribution"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createDistribution}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <Box>Create distribution with default settings.</Box>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
