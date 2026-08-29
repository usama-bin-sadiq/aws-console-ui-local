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

interface SESIdentityItem {
  identity: string;
}

export default function SESPage() {
  const [identities, setIdentities] = useState<SESIdentityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");

  const fetchIdentities = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ses");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setIdentities((data.identities || []).map((i: string) => ({ identity: i })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdentities();
  }, []);

  const verifyIdentity = async () => {
    await fetch("/api/ses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", emailAddress }),
    });
    setCreateModal(false);
    setEmailAddress("");
    fetchIdentities();
  };

  const deleteIdentity = async (identity: string) => {
    await fetch(`/api/ses?identity=${encodeURIComponent(identity)}`, { method: "DELETE" });
    fetchIdentities();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">SES — Simple Email Service</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <Table
            header={
              <Header
                variant="h2"
                actions={<Button onClick={() => setCreateModal(true)}>Verify identity</Button>}
              >
                Identities ({identities.length})
              </Header>
            }
            items={identities}
            loading={loading}
            columnDefinitions={[
              { header: "Identity", cell: (item) => item.identity },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteIdentity(item.identity)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            empty={<Box textAlign="center">No verified identities.</Box>}
          />
        </Container>
        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Verify email identity"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={verifyIdentity}>
                Verify
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Email address">
            <Input
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.detail.value)}
              placeholder="user@example.com"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
