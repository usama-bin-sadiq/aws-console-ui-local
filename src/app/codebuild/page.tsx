"use client";
import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
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
import Tabs from "@cloudscape-design/components/tabs";
import Textarea from "@cloudscape-design/components/textarea";
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface CodeBuildProject {
  name: string;
  description?: string;
  serviceRole?: string;
  created?: string;
}

interface CodeBuildBuild {
  id?: string;
  buildNumber?: number;
  projectName?: string;
  buildStatus?: string;
  currentPhase?: string;
  startTime?: string;
  endTime?: string;
}

export default function CodeBuildPage() {
  const [projects, setProjects] = useState<CodeBuildProject[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);

  const [createModal, setCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [builds, setBuilds] = useState<CodeBuildBuild[]>([]);
  const [buildLoading, setBuildLoading] = useState(false);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [viewLogsModal, setViewLogsModal] = useState(false);
  const [logText, setLogText] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/codebuild");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setProjects(data.projects || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const createProject = async () => {
    try {
      await apiFetch("/api/codebuild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: projectName }),
      });
    } finally {
      setCreateModal(false);
      setProjectName("");
      fetchProjects();
    }
  };

  const startBuild = async (name: string) => {
    try {
      await apiFetch("/api/codebuild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "startBuild", projectName: name }),
      });
      fetchBuilds(name);
    } catch (err: unknown) {
      setBuildError(err instanceof Error ? err.message : "Failed to start build");
    }
  };

  const stopBuild = async (buildId: string) => {
    try {
      await apiFetch("/api/codebuild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stopBuild", buildId }),
      });
      if (selectedProject) fetchBuilds(selectedProject);
    } catch (err: unknown) {
      setBuildError(err instanceof Error ? err.message : "Failed to stop build");
    }
  };

  const deleteProject = async (name: string) => {
    await apiFetch(`/api/codebuild?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchProjects();
  };

  const fetchBuilds = async (projectName: string) => {
    setBuildLoading(true);
    setBuildError(null);
    setSelectedProject(projectName);
    try {
      const res = await apiFetch(
        `/api/codebuild?action=builds&projectName=${encodeURIComponent(projectName)}`,
      );
      const data = await res.json();
      const ids = (data.builds || []) as string[];
      if (ids.length === 0) {
        setBuilds([]);
        setBuildLoading(false);
        return;
      }
      const batchRes = await apiFetch(
        `/api/codebuild?action=batchGetBuilds&ids=${encodeURIComponent(ids.join(","))}`,
      );
      const batchData = await batchRes.json();
      setBuilds(batchData.builds || []);
    } catch (err: unknown) {
      setBuildError(err instanceof Error ? err.message : "Failed to load builds");
      setBuilds([]);
    } finally {
      setBuildLoading(false);
    }
  };

  const viewLogs = async (buildId: string) => {
    try {
      const res = await apiFetch(
        `/api/codebuild?action=batchGetBuildLogs&buildId=${encodeURIComponent(buildId)}`,
      );
      const data = await res.json();
      const logs = data.buildLogs || [];
      const text =
        (logs as unknown[])
          .map((l: any) =>
            (l?.logLines || []).map((line: any) => `${line?.message || line || ""}`).join("\n"),
          )
          .join("\n---\n") || "No logs available.";
      setLogText(text);
      setViewLogsModal(true);
    } catch (err: unknown) {
      setLogText("Failed to load logs.");
      setViewLogsModal(true);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="CodeBuild"
          serviceIcon={SERVICE_ICONS["/codebuild"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/codebuild/create")}>
            Create project
        </button>

        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}

        <Container className="aws-table-card">
          <Tabs
            tabs={[
              { label: "Projects", id: "projects", content: null },
              { label: "Builds", id: "builds", content: null },
            ]}
          />

          <SpaceBetween size="m">
            <Table
              header={
                <Header
                  variant="h2"
                  actions={<Button onClick={() => setCreateModal(true)}>Create project</Button>}
                >
                  Projects ({projects.length})
                </Header>
              }
              items={projects}
              loading={loading}
              columnDefinitions={[
                { header: "Name", cell: (item) => item.name },
                { header: "Service role", cell: (item) => item.serviceRole ?? "—" },
                { header: "Created", cell: (item) => item.created ?? "—" },
                {
                  header: "Actions",
                  cell: (item) => (
                    <ButtonDropdown
                      items={[
                        { id: "start", text: "Start build" },
                        { id: "builds", text: "View builds" },
                        { id: "delete", text: "Delete project" },
                      ]}
                      ariaLabel={`Actions for project ${item.name}`}
                      onItemClick={({ detail }) => {
                        if (detail.id === "start") startBuild(item.name);
                        if (detail.id === "builds") fetchBuilds(item.name);
                        if (detail.id === "delete") deleteProject(item.name);
                      }}
                    >
                      Actions
                    </ButtonDropdown>
                  ),
                },
              ]}
              empty={<Box textAlign="center">No projects found.</Box>}
            />
          </SpaceBetween>

          {selectedProject && (
            <SpaceBetween size="m">
              <Header variant="h2">Builds for {selectedProject}</Header>
              {buildError && (
                <Alert type="error" header="Error">
                  {buildError}
                </Alert>
              )}
              <Table
                items={builds}
                loading={buildLoading}
                columnDefinitions={[
                  { header: "Build ID", cell: (item) => item.id || "—" },
                  { header: "Status", cell: (item) => item.buildStatus ?? "—" },
                  { header: "Phase", cell: (item) => item.currentPhase ?? "—" },
                  { header: "Started", cell: (item) => item.startTime ?? "—" },
                  {
                    header: "Actions",
                    cell: (item) => (
                      <SpaceBetween direction="horizontal" size="xs">
                        {item.buildStatus === "IN_PROGRESS" && (
                          <Button onClick={() => stopBuild(item.id || "")} formAction="none">
                            Stop
                          </Button>
                        )}
                        <Button onClick={() => viewLogs(item.id || "")} formAction="none">
                          View logs
                        </Button>
                      </SpaceBetween>
                    ),
                  },
                ]}
                empty={<Box textAlign="center">No builds found.</Box>}
              />
            </SpaceBetween>
          )}
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create project"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createProject}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Project name">
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.detail.value)}
              placeholder="my-build-project"
            />
          </FormField>
        </Modal>

        <Modal
          visible={viewLogsModal}
          onDismiss={() => setViewLogsModal(false)}
          header="Build Logs"
        >
          <Textarea
            readOnly
            value={logText}
            rows={20}
            onChange={() => undefined}
            ariaLabel="Build logs"
          />
        </Modal>
      </SpaceBetween>
    </div>
  );
}
