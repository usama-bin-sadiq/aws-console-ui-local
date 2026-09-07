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
  const [nameError, setNameError] = useState<string | null>(null);

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
    if (!name.trim()) {
      setNameError("Template name is required");
      return;
    }
    setNameError(null);
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
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div>
          <Header variant="h1">EC2 Launch Templates</Header>
        </div>

        {error && (
          <div>
            <Alert type="error" onDismiss={() => setError("")}>
              {error}
            </Alert>
          </div>
        )}

        <div>
          <Container>
            <Table
              header={
                <Header variant="h2" actions={<Button variant="primary" onClick={() => setCreateModal(true)}>Create launch template</Button>}>
                  Launch templates ({templates.length})
                </Header>
              }
              items={templates}
              columnDefinitions={[
                { id: "name", header: "Name", cell: (item: LaunchTemplate) => item.LaunchTemplateName || "-" },
                { id: "templateId", header: "Template ID", cell: (item: LaunchTemplate) => item.LaunchTemplateId },
                { id: "defaultVersion", header: "Default version", cell: (item: LaunchTemplate) => item.DefaultVersionNumber ?? "-" },
                { id: "latestVersion", header: "Latest version", cell: (item: LaunchTemplate) => item.LatestVersionNumber ?? "-" },
                {
                  id: "actions",
                  header: "Actions",
                  cell: (item: LaunchTemplate) => (
                    <Button onClick={() => deleteTemplate(item.LaunchTemplateId)} formAction="none">Delete</Button>
                  ),
                },
              ]}
              loading={loading}
              trackBy="LaunchTemplateId"
              empty={<Box textAlign="center">No launch templates found.</Box>}
            />
          </Container>
        </div>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create launch template"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createTemplate} loading={creating}>Create</Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label={<>Template name <span style={{ color: "red" }}>*</span></>} constraintText="Required" errorText={nameError}>
              <Input value={name} onChange={(e: any) => { setName(e.detail.value); setNameError(null); }} placeholder="my-launch-template" />
            </FormField>
            <FormField label="AMI ID">
              <Input value={imageId} onChange={(e: any) => setImageId(e.detail.value)} placeholder="ami-12345678" />
            </FormField>
            <FormField label="Instance type">
              <Input value={instanceType} onChange={(e: any) => setInstanceType(e.detail.value)} placeholder="t3.micro" />
            </FormField>
          </SpaceBetween>
        </Modal>
      </div>
    </div>
  );
}
