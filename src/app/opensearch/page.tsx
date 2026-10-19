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

interface OpenSearchDomain {
  DomainName: string;
  EngineVersion?: string;
}

interface PipelineInfo {
  PipelineName?: string;
  PipelineStatus?: string;
  Description?: string;
}

export default function OpenSearchPage() {
  const [domains, setDomains] = useState<OpenSearchDomain[]>([]);
  const [pipelines, setPipelines] = useState<PipelineInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [engineVersion, setEngineVersion] = useState("");
  const [creating, setCreating] = useState(false);
  const [domainNameError, setDomainNameError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/opensearch");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch OpenSearch data");
      setDomains(data.domains || []);
      setPipelines(data.pipelines || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch OpenSearch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createDomain = async () => {
    if (!domainName.trim()) {
      setDomainNameError("Domain name is required");
      return;
    }
    setDomainNameError(null);
    setCreating(true);
    try {
      const res = await apiFetch("/api/opensearch", {
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
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create domain");
    } finally {
      setCreating(false);
    }
  };

  const deleteDomain = async (name: string) => {
    try {
      const res = await apiFetch(`/api/opensearch?domainName=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete domain");
      }
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete domain");
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">OpenSearch Service</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container className="aws-table-card">
          <Tabs
            tabs={[
              {
                label: "Domains",
                id: "domains",
                content: (
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
                      { header: "Domain name", cell: (item: OpenSearchDomain) => item.DomainName },
                      {
                        header: "Engine version",
                        cell: (item: OpenSearchDomain) => item.EngineVersion || "—",
                      },
                      {
                        header: "Actions",
                        cell: (item: OpenSearchDomain) => (
                          <Button onClick={() => deleteDomain(item.DomainName)} formAction="none">
                            Delete
                          </Button>
                        ),
                      },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No domains found.</Box>}
                  />
                ),
              },
              {
                label: "Pipelines",
                id: "pipelines",
                content: (
                  <Table
                    header={<Header variant="h2">Pipelines ({pipelines.length})</Header>}
                    items={pipelines}
                    columnDefinitions={[
                      {
                        header: "Pipeline name",
                        cell: (item: PipelineInfo) => item.PipelineName || "—",
                      },
                      {
                        header: "Status",
                        cell: (item: PipelineInfo) => item.PipelineStatus || "—",
                      },
                      {
                        header: "Description",
                        cell: (item: PipelineInfo) => item.Description || "—",
                      },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No pipelines found.</Box>}
                  />
                ),
              },
            ]}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => {
            setCreateModal(false);
            setDomainName("");
            setEngineVersion("");
          }}
          header="Create OpenSearch domain"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setCreateModal(false);
                  setDomainName("");
                  setEngineVersion("");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={createDomain} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField
              label={
                <>
                  Domain name <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={domainNameError}
            >
              <Input
                value={domainName}
                onChange={(e) => {
                  setDomainName(e.detail.value);
                  setDomainNameError(null);
                }}
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
