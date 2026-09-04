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

interface Application {
  applicationName: string;
}

export default function CodeDeployPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [appName, setAppName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/code-deploy");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch applications");
      setApplications(data.applications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const createApplication = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/code-deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: appName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create application");
      }
      setCreateModal(false);
      setAppName("");
      fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application");
    } finally {
      setCreating(false);
    }
  };

  const deleteApplication = async (name: string) => {
    try {
      const res = await fetch(`/api/code-deploy?appName=${encodeURIComponent(name)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete application");
      }
      fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete application");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS CodeDeploy</Header>

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
                    Create application
                  </Button>
                }
              >
                Applications ({applications.length})
              </Header>
            }
            items={applications}
            columnDefinitions={[
              { header: "Application name", cell: (item) => item.applicationName },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteApplication(item.applicationName)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No applications found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create application"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createApplication} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Application name" constraintText="Required">
            <Input
              value={appName}
              onChange={(e) => setAppName(e.detail.value)}
              placeholder="my-app"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
