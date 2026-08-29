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

interface CodeBuildProject {
  name: string;
  description?: string;
  serviceRole?: string;
  created?: string;
}

export default function CodeBuildPage() {
  const [projects, setProjects] = useState<CodeBuildProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createModal, setCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");

  const fetchProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/codebuild");
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
      await fetch("/api/codebuild", {
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
    await fetch("/api/codebuild", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "startBuild", projectName: name }),
    });
  };

  const deleteProject = async (name: string) => {
    await fetch(`/api/codebuild?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchProjects();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">CodeBuild</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
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
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => startBuild(item.name)} formAction="none">
                      Start build
                    </Button>
                    <Button onClick={() => deleteProject(item.name)} formAction="none">
                      Delete
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
            empty={<Box textAlign="center">No projects found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create project"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createProject}>Create</Button>
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
      </SpaceBetween>
    </div>
  );
}
