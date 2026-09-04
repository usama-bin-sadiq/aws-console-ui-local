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

interface LaunchTemplate {
  LaunchTemplateId: string;
  LaunchTemplateName?: string;
  DefaultVersionNumber?: number;
  LatestVersionNumber?: number;
}

export default function LaunchTemplatePage() {
  const [templates, setTemplates] = useState<LaunchTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [imageId, setImageId] = useState("ami-12345678");
  const [instanceType, setInstanceType] = useState("t3.micro");
  const [creating, setCreating] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/launch-template");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch launch templates");
      setTemplates(data.launchTemplates || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch launch templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const createTemplate = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/launch-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, imageId, instanceType }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create launch template");
      }
      setCreateModal(false);
      setName("");
      setImageId("ami-12345678");
      setInstanceType("t3.micro");
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create launch template");
    } finally {
      setCreating(false);
    }
  };

  const deleteTemplate = async (ltId: string) => {
    try {
      const res = await fetch(`/api/launch-template?ltId=${encodeURIComponent(ltId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete launch template");
      }
      fetchTemplates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete launch template");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">EC2 Launch Templates</Header>

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
                    Create launch template
                  </Button>
                }
              >
                Launch templates ({templates.length})
              </Header>
            }
            items={templates}
            columnDefinitions={[
              { header: "Name", cell: (item) => item.LaunchTemplateName || "-" },
              { header: "Template ID", cell: (item) => item.LaunchTemplateId },
              { header: "Default version", cell: (item) => item.DefaultVersionNumber ?? "-" },
              { header: "Latest version", cell: (item) => item.LatestVersionNumber ?? "-" },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteTemplate(item.LaunchTemplateId)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No launch templates found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create launch template"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createTemplate} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Template name" constraintText="Required">
              <Input
                value={name}
                onChange={(e) => setName(e.detail.value)}
                placeholder="my-launch-template"
              />
            </FormField>
            <FormField label="AMI ID">
              <Input
                value={imageId}
                onChange={(e) => setImageId(e.detail.value)}
                placeholder="ami-12345678"
              />
            </FormField>
            <FormField label="Instance type">
              <Input
                value={instanceType}
                onChange={(e) => setInstanceType(e.detail.value)}
                placeholder="t3.micro"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
