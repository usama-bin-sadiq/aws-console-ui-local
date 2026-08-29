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

interface OpenSearchDomain {
  DomainName: string;
}

export default function OpenSearchPage() {
  const [domains, setDomains] = useState<OpenSearchDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [engineVersion, setEngineVersion] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchDomains = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/opensearch");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch domains");
      setDomains(data.domains || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch domains");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDomains();
  }, []);

  const createDomain = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/opensearch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainName, engineVersion }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create domain");
      }
      setCreateModal(false);
      setDomainName("");
      setEngineVersion("");
      fetchDomains();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create domain");
    } finally {
      setCreating(false);
    }
  };

  const deleteDomain = async (name: string) => {
    try {
      const res = await fetch(`/api/opensearch?domainName=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete domain");
      }
      fetchDomains();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete domain");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">OpenSearch Service</Header>

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
                    Create domain
                  </Button>
                }
              >
                Domains ({domains.length})
              </Header>
            }
            items={domains}
            columnDefinitions={[
              { header: "Domain name", cell: (item) => item.DomainName },
              {
                header: "Actions",
                cell: (item) => (
                  <Button
                    onClick={() => deleteDomain(item.DomainName)}
                    formAction="none"
                  >
                    Delete
                  </Button>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No domains found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create OpenSearch domain"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createDomain} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Domain name" constraintText="Required">
              <Input
                value={domainName}
                onChange={(e) => setDomainName(e.detail.value)}
                placeholder="my-domain"
              />
            </FormField>
            <FormField label="Engine version">
              <Input
                value={engineVersion}
                onChange={(e) => setEngineVersion(e.detail.value)}
                placeholder="OpenSearch_2.11"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
