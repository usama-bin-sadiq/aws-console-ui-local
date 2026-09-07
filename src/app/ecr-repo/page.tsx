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

interface Repository {
  repositoryName: string;
  repositoryUri?: string;
  createdAt?: string;
  imageTagMutability?: string;
}

export default function ECRRepoPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [repositoryName, setRepositoryName] = useState("");
  const [creating, setCreating] = useState(false);
  const [repositoryNameError, setRepositoryNameError] = useState<string | null>(null);

  const fetchRepositories = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ecr");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch repositories");
      setRepositories(data.repositories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch repositories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepositories();
  }, []);

  const createRepository = async () => {
    if (!repositoryName.trim()) {
      setRepositoryNameError("Repository name is required");
      return;
    }
    setRepositoryNameError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/ecr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create repository");
      }
      setCreateModal(false);
      setRepositoryName("");
      fetchRepositories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create repository");
    } finally {
      setCreating(false);
    }
  };

  const deleteRepository = async (name: string) => {
    try {
      const res = await fetch(`/api/ecr?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete repository");
      }
      fetchRepositories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete repository");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Amazon ECR Repositories</Header>

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
                    Create repository
                  </Button>
                }
              >
                Repositories ({repositories.length})
              </Header>
            }
            items={repositories}
            columnDefinitions={[
              { header: "Repository name", cell: (item) => item.repositoryName },
              { header: "URI", cell: (item) => item.repositoryUri || "-" },
              {
                header: "Created at",
                cell: (item) =>
                  item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
              },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteRepository(item.repositoryName)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No repositories found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create repository"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createRepository} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label={<>Repository name <span style={{ color: "red" }}>*</span></>} constraintText="Required" errorText={repositoryNameError}>
              <Input
                value={repositoryName}
                onChange={(e) => { setRepositoryName(e.detail.value); setRepositoryNameError(null); }}
                placeholder="my-repo"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
