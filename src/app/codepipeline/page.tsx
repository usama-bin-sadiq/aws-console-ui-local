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
import Textarea from "@cloudscape-design/components/textarea";

interface Pipeline {
  name: string;
  version: number;
  created: string;
}

export default function CodePipelinePage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createModal, setCreateModal] = useState(false);
  const [pipelineConfig, setPipelineConfig] = useState(
    JSON.stringify(
      {
        pipeline: {
          name: "my-pipeline",
          roleArn: "arn:aws:iam::000000000000:role/pipeline-role",
          artifactStore: { type: "S3", location: "my-bucket" },
          stages: [],
        },
      },
      null,
      2
    )
  );

  const fetchPipelines = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/codepipeline");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPipelines(data.pipelines || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelines();
  }, []);

  const createPipeline = async () => {
    try {
      await fetch("/api/codepipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", config: JSON.parse(pipelineConfig) }),
      });
    } finally {
      setCreateModal(false);
      fetchPipelines();
    }
  };

  const startExecution = async (name: string) => {
    await fetch("/api/codepipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "startExecution", name }),
    });
  };

  const deletePipeline = async (name: string) => {
    await fetch(`/api/codepipeline?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchPipelines();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">CodePipeline</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <Table
            header={
              <Header
                variant="h2"
                actions={<Button onClick={() => setCreateModal(true)}>Create pipeline</Button>}
              >
                Pipelines ({pipelines.length})
              </Header>
            }
            items={pipelines}
            loading={loading}
            columnDefinitions={[
              { header: "Name", cell: (item) => item.name },
              { header: "Version", cell: (item) => String(item.version) },
              { header: "Created", cell: (item) => item.created },
              {
                header: "Actions",
                cell: (item) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => startExecution(item.name)} formAction="none">
                      Start execution
                    </Button>
                    <Button onClick={() => deletePipeline(item.name)} formAction="none">
                      Delete
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
            empty={<Box textAlign="center">No pipelines found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create pipeline"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createPipeline}>Create</Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <Alert type="info">
              Pipeline creation requires a full pipeline configuration in JSON format. Edit the
              template below to define your pipeline stages, artifact store, and role ARN.
            </Alert>
            <FormField label="Pipeline configuration (JSON)">
              <Textarea
                value={pipelineConfig}
                onChange={(e) => setPipelineConfig(e.detail.value)}
                rows={12}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
