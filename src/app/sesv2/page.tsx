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
import StatusIndicator from "@cloudscape-design/components/status-indicator";

interface SESv2Identity {
  IdentityName: string;
  IdentityType: string;
  SendingEnabled: boolean;
}

export default function SESv2Page() {
  const [identities, setIdentities] = useState<SESv2Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [identityName, setIdentityName] = useState("");

  const fetchIdentities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/sesv2");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIdentities(data.identities || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentities();
  }, []);

  const createIdentity = async () => {
    await apiFetch("/api/sesv2", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createIdentity", identityName }),
    });
    setCreateModal(false);
    setIdentityName("");
    fetchIdentities();
  };

  const deleteIdentity = async (name: string) => {
    await apiFetch(`/api/sesv2?identityName=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchIdentities();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">SES v2 — Simple Email Service</Header>
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Table
          header={
            <Header
              variant="h2"
              actions={<Button onClick={() => setCreateModal(true)}>Create identity</Button>}
            >
              Email Identities ({identities.length})
            </Header>
          }
          items={identities}
          loading={loading}
          columnDefinitions={[
            { header: "Identity Name", cell: (item) => item.IdentityName },
            { header: "Identity Type", cell: (item) => item.IdentityType },
            {
              header: "Sending Enabled",
              cell: (item) => (
                <StatusIndicator type={item.SendingEnabled ? "success" : "stopped"}>
                  {item.SendingEnabled ? "Enabled" : "Disabled"}
                </StatusIndicator>
              ),
            },
            {
              header: "Actions",
              cell: (item) => (
                <Button onClick={() => deleteIdentity(item.IdentityName)} formAction="none">
                  Delete
                </Button>
              ),
            },
          ]}
          empty={<Box textAlign="center">No email identities found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create email identity"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createIdentity}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Identity name">
            <Input
              value={identityName}
              onChange={(e) => setIdentityName(e.detail.value)}
              placeholder="user@example.com"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
