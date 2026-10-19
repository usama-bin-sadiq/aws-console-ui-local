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

interface Application {
  applicationName: string;
}

interface DeploymentGroup {
  applicationName?: string;
  deploymentGroupName?: string;
  deploymentConfigName?: string;
  serviceRoleArn?: string;
}

interface Deployment {
  deploymentId?: string;
  applicationName?: string;
  deploymentGroupName?: string;
  status?: string;
  createTime?: string;
}

export default function CodeDeployPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [appName, setAppName] = useState("");
  const [creating, setCreating] = useState(false);
  const [appNameError, setAppNameError] = useState<string | null>(null);

  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [deploymentGroups, setDeploymentGroups] = useState<DeploymentGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState("");

  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [deploymentsLoading, setDeploymentsLoading] = useState(false);
  const [deploymentsError, setDeploymentsError] = useState("");

  const [groupModal, setGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupCreating, setGroupCreating] = useState(false);
  const [groupNameError, setGroupNameError] = useState<string | null>(null);

  const [deployModal, setDeployModal] = useState(false);
  const [deployBucket, setDeployBucket] = useState("code-deploy-bucket");
  const [deployKey, setDeployKey] = useState("app.zip");
  const [deployCreating, setDeployCreating] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/code-deploy");
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
    if (!appName.trim()) {
      setAppNameError("Application name is required");
      return;
    }
    setAppNameError(null);
    setCreating(true);
    try {
      const res = await apiFetch("/api/code-deploy", {
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
      const res = await apiFetch(`/api/code-deploy?appName=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete application");
      }
      fetchApplications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete application");
    }
  };

  const fetchDeploymentGroups = async (appName: string) => {
    setSelectedApp(appName);
    setGroupsLoading(true);
    setGroupsError("");
    try {
      const res = await apiFetch(
        `/api/code-deploy?action=deploymentGroups&appName=${encodeURIComponent(appName)}`,
      );
      const data = await res.json();
      setDeploymentGroups(data.deploymentGroups || []);
    } catch (err) {
      setGroupsError(err instanceof Error ? err.message : "Failed to load groups");
    } finally {
      setGroupsLoading(false);
    }
  };

  const fetchDeployments = async (appName: string) => {
    setDeploymentsLoading(true);
    setDeploymentsError("");
    try {
      const res = await apiFetch(
        `/api/code-deploy?action=deployments&appName=${encodeURIComponent(appName)}`,
      );
      const data = await res.json();
      setDeployments(data.deployments || []);
    } catch (err) {
      setDeploymentsError(err instanceof Error ? err.message : "Failed to load deployments");
    } finally {
      setDeploymentsLoading(false);
    }
  };

  const createDeploymentGroup = async () => {
    if (!groupName.trim()) {
      setGroupNameError("Deployment group name is required");
      return;
    }
    setGroupNameError(null);
    setGroupCreating(true);
    try {
      const res = await apiFetch("/api/code-deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createDeploymentGroup",
          applicationName: selectedApp,
          deploymentGroupName: groupName,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create deployment group");
      }
      setGroupModal(false);
      setGroupName("");
      if (selectedApp) fetchDeploymentGroups(selectedApp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    } finally {
      setGroupCreating(false);
    }
  };

  const createDeployment = async () => {
    setDeployCreating(true);
    try {
      const res = await apiFetch("/api/code-deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createDeployment",
          applicationName: selectedApp,
          deploymentGroupName: groupName || deploymentGroups[0]?.deploymentGroupName || "default",
          bucket: deployBucket,
          key: deployKey,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create deployment");
      }
      setDeployModal(false);
      setDeployBucket("code-deploy-bucket");
      setDeployKey("app.zip");
      if (selectedApp) fetchDeployments(selectedApp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create deployment");
    } finally {
      setDeployCreating(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS CodeDeploy</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

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
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    onClick={() => fetchDeploymentGroups(item.applicationName)}
                    formAction="none"
                  >
                    Groups
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedApp(item.applicationName);
                      fetchDeploymentGroups(item.applicationName);
                      fetchDeployments(item.applicationName);
                    }}
                    formAction="none"
                  >
                    Deployments
                  </Button>
                  <Button onClick={() => deleteApplication(item.applicationName)} formAction="none">
                    Delete
                  </Button>
                </SpaceBetween>
              ),
            },
          ]}
          loading={loading}
          empty={<Box textAlign="center">No applications found.</Box>}
        />

        {selectedApp && (
          <SpaceBetween size="m">
            <Container className="aws-table-card">
              <Header variant="h2">Deployment Groups — {selectedApp}</Header>
              {groupsError && <Alert type="error">{groupsError}</Alert>}
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="primary" onClick={() => setGroupModal(true)}>
                  Create group
                </Button>
                <Button variant="primary" onClick={() => setDeployModal(true)}>
                  Create deployment
                </Button>
              </SpaceBetween>
              <Table
                items={deploymentGroups}
                loading={groupsLoading}
                columnDefinitions={[
                  { header: "Group name", cell: (item) => item.deploymentGroupName || "—" },
                  { header: "Config", cell: (item) => item.deploymentConfigName || "—" },
                ]}
                empty={<Box textAlign="center">No deployment groups found.</Box>}
              />
            </Container>

            <Container className="aws-table-card">
              <Header variant="h2">Deployments — {selectedApp}</Header>
              {deploymentsError && <Alert type="error">{deploymentsError}</Alert>}
              <Table
                items={deployments}
                loading={deploymentsLoading}
                columnDefinitions={[
                  { header: "Deployment ID", cell: (item) => item.deploymentId || "—" },
                  { header: "Status", cell: (item) => item.status || "—" },
                  { header: "Created", cell: (item) => item.createTime || "—" },
                ]}
                empty={<Box textAlign="center">No deployments found.</Box>}
              />
            </Container>
          </SpaceBetween>
        )}

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
          <FormField
            label={
              <>
                Application name <span style={{ color: "red" }}>*</span>
              </>
            }
            constraintText="Required"
            errorText={appNameError}
          >
            <Input
              value={appName}
              onChange={(e) => {
                setAppName(e.detail.value);
                setAppNameError(null);
              }}
              placeholder="my-app"
            />
          </FormField>
        </Modal>

        <Modal
          visible={groupModal}
          onDismiss={() => setGroupModal(false)}
          header="Create deployment group"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setGroupModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createDeploymentGroup} loading={groupCreating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField
            label={
              <>
                Deployment group name <span style={{ color: "red" }}>*</span>
              </>
            }
            constraintText="Required"
            errorText={groupNameError}
          >
            <Input
              value={groupName}
              onChange={(e) => {
                setGroupName(e.detail.value);
                setGroupNameError(null);
              }}
              placeholder="my-group"
            />
          </FormField>
        </Modal>

        <Modal
          visible={deployModal}
          onDismiss={() => setDeployModal(false)}
          header="Create deployment"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setDeployModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createDeployment} loading={deployCreating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="S3 bucket">
              <Input value={deployBucket} onChange={(e) => setDeployBucket(e.detail.value)} />
            </FormField>
            <FormField label="S3 key">
              <Input value={deployKey} onChange={(e) => setDeployKey(e.detail.value)} />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
