"use client";
import { apiFetch } from "@/lib/api-client";
import React, { useCallback, useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";

// Application shape per @aws-sdk/client-appconfig Application:
// { Id?, Name?, Description? } — the SDK type has no CreationTime field.
interface AppConfigApplication {
  Id?: string;
  Name?: string;
  Description?: string;
}

async function postAppConfig(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await apiFetch("/api/appconfig", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const d = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((d && (d.error || d.message)) || `Request failed with status ${res.status}`);
  }
  return d || {};
}

export default function AppConfigPage() {
  const [applications, setApplications] = useState<AppConfigApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [message, setMessage] = useState("");

  // Create modal
  const [createVisible, setCreateVisible] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // View modal
  const [viewVisible, setViewVisible] = useState(false);
  const [viewApp, setViewApp] = useState<AppConfigApplication | null>(null);

  // Edit modal
  const [editVisible, setEditVisible] = useState(false);
  const [editApp, setEditApp] = useState<AppConfigApplication | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm modal
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteApp, setDeleteApp] = useState<AppConfigApplication | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await apiFetch("/api/appconfig");
      const d = await r.json().catch(() => null);
      if (!r.ok) {
        setApplications([]);
        setError((d && (d.error || d.message)) || `Request failed with status ${r.status}`);
      } else {
        // Array-safe: only ever store a real array.
        const items = Array.isArray(d && d.applications)
          ? d.applications
          : Array.isArray(d && d.items)
            ? d.items
            : [];
        setApplications(items);
        if (d && typeof d.message === "string" && d.message.length > 0 && items.length === 0) {
          setMessage(d.message);
        } else {
          setMessage("");
        }
      }
    } catch {
      setApplications([]);
      setError("Failed to load applications from adapter SDK (LocalStack / MiniStack)");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreate() {
    if (!createName.trim()) return;
    setCreateLoading(true);
    setError("");
    try {
      await postAppConfig({
        action: "createApplication",
        name: createName.trim(),
        description: createDescription,
      });
      setCreateVisible(false);
      setCreateName("");
      setCreateDescription("");
      setSuccess(`Application "${createName.trim()}" created.`);
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create application");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleView(app: AppConfigApplication) {
    setError("");
    try {
      const d = await postAppConfig({ action: "getApplication", applicationId: app.Id });
      setViewApp((d.application as AppConfigApplication) || app);
      setViewVisible(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load application details");
    }
  }

  function openEdit(app: AppConfigApplication) {
    setEditApp(app);
    setEditName(app.Name || "");
    setEditDescription(app.Description || "");
    setEditVisible(true);
  }

  async function handleSaveEdit() {
    if (!editApp?.Id || !editName.trim()) return;
    setEditLoading(true);
    setError("");
    try {
      await postAppConfig({
        action: "updateApplication",
        applicationId: editApp.Id,
        name: editName.trim(),
        description: editDescription,
      });
      setEditVisible(false);
      setEditApp(null);
      setSuccess(`Application "${editName.trim()}" updated.`);
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update application");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteApp?.Id) return;
    setDeleteLoading(true);
    setError("");
    try {
      await postAppConfig({ action: "deleteApplication", applicationId: deleteApp.Id });
      setDeleteVisible(false);
      const name = deleteApp.Name || deleteApp.Id;
      setDeleteApp(null);
      setSuccess(`Application "${name}" deleted.`);
      await loadData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete application");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <ServiceLayout
      serviceName="AppConfig"
      serviceCategory="Services"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "AppConfig", href: "/appconfig" },
      ]}

      headingLevel="h2"
    >
      <SpaceBetween size="l" direction="vertical">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={loadData} loading={loading} iconName="refresh">
                Refresh
              </Button>
              <Button
                variant="primary"
                iconName="add-plus"
                onClick={() => {
                  setCreateName("");
                  setCreateDescription("");
                  setCreateVisible(true);
                }}
              >
                Create application
              </Button>
            </SpaceBetween>
          }
        >
          AWS AppConfig — Applications
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert type="success" dismissible onDismiss={() => setSuccess("")}>
            {success}
          </Alert>
        )}
        {message && !error && (
          <Alert type="info" dismissible onDismiss={() => setMessage("")}>
            {message}
          </Alert>
        )}

        <Table
          loading={loading}
          loadingText="Loading applications..."
          trackBy="Id"
          items={applications}
          columnDefinitions={[
            { id: "name", header: "Name", cell: (item) => item.Name || "—" },
            { id: "id", header: "Id", cell: (item) => item.Id || "—" },
            { id: "description", header: "Description", cell: (item) => item.Description || "—" },
            {
              id: "actions",
              header: "Actions",
              cell: (item) => (
                <ButtonDropdown
                  ariaLabel={`Actions for ${item.Name || item.Id || "application"}`}
                  items={[
                    { id: "view", text: "View" },
                    { id: "edit", text: "Edit" },
                    { id: "delete", text: "Delete" },
                  ]}
                  onItemClick={({ detail }) => {
                    if (detail.id === "view") handleView(item);
                    else if (detail.id === "edit") openEdit(item);
                    else if (detail.id === "delete") {
                      setDeleteApp(item);
                      setDeleteVisible(true);
                    }
                  }}
                >
                  Actions
                </ButtonDropdown>
              ),
            },
          ]}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No applications</b>
              <Box variant="p" color="inherit">
                No AppConfig applications found. Use &quot;Create application&quot; to get started.
              </Box>
            </Box>
          }
        />
      </SpaceBetween>

      {/* Create application */}
      <Modal
        visible={createVisible}
        onDismiss={() => setCreateVisible(false)}
        header="Create application"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateVisible(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={createLoading}
                disabled={!createName.trim()}
                onClick={handleCreate}
              >
                Create
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Name" constraintText="Required">
            <Input
              value={createName}
              onChange={({ detail }) => setCreateName(detail.value)}
              placeholder="my-application"
            />
          </FormField>
          <FormField label="Description">
            <Input
              value={createDescription}
              onChange={({ detail }) => setCreateDescription(detail.value)}
              placeholder="Optional description"
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* View application */}
      <Modal
        visible={viewVisible}
        onDismiss={() => setViewVisible(false)}
        header="Application details"
        footer={
          <Box float="right">
            <Button onClick={() => setViewVisible(false)}>Close</Button>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box variant="small" color="text-label">
            Name
          </Box>
          <Box>{viewApp?.Name || "—"}</Box>
          <Box variant="small" color="text-label">
            Id
          </Box>
          <Box>{viewApp?.Id || "—"}</Box>
          <Box variant="small" color="text-label">
            Description
          </Box>
          <Box>{viewApp?.Description || "—"}</Box>
          <Box>
            <StatusIndicator type="success">Loaded via getApplication</StatusIndicator>
          </Box>
        </SpaceBetween>
      </Modal>

      {/* Edit application */}
      <Modal
        visible={editVisible}
        onDismiss={() => setEditVisible(false)}
        header={`Edit application${editApp?.Name ? `: ${editApp.Name}` : ""}`}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setEditVisible(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={editLoading}
                disabled={!editName.trim()}
                onClick={handleSaveEdit}
              >
                Save
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Name" constraintText="Required">
            <Input value={editName} onChange={({ detail }) => setEditName(detail.value)} />
          </FormField>
          <FormField label="Description">
            <Input
              value={editDescription}
              onChange={({ detail }) => setEditDescription(detail.value)}
              placeholder="Optional description"
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        visible={deleteVisible}
        onDismiss={() => setDeleteVisible(false)}
        header="Delete application"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setDeleteVisible(false)}>Cancel</Button>
              <Button variant="primary" loading={deleteLoading} onClick={handleDelete}>
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <Box>
          Permanently delete application <strong>{deleteApp?.Name || deleteApp?.Id}</strong>? This
          cannot be undone.
        </Box>
      </Modal>
    </ServiceLayout>
  );
}
