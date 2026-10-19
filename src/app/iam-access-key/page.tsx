"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Alert from "@cloudscape-design/components/alert";

interface AccessKey {
  AccessKeyId: string;
  UserName?: string;
  Status: string;
  CreateDate?: string;
}

export default function IAMAccessKeyPage() {
  const [userName, setUserName] = useState("");
  const [loadedUser, setLoadedUser] = useState("");
  const [accessKeys, setAccessKeys] = useState<AccessKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyInfo, setNewKeyInfo] = useState<{
    AccessKeyId: string;
    SecretAccessKey: string;
  } | null>(null);

  const loadKeys = async () => {
    if (!userName) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/iam-access-key?userName=${encodeURIComponent(userName)}`);
      const data = await res.json();
      setAccessKeys(data.accessKeys || []);
      setLoadedUser(userName);
    } catch {}
    setLoading(false);
  };

  const createKey = async () => {
    if (!loadedUser) return;
    try {
      const res = await apiFetch("/api/iam-access-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: loadedUser }),
      });
      const data = await res.json();
      if (data.accessKey) {
        setNewKeyInfo({
          AccessKeyId: data.accessKey.AccessKeyId,
          SecretAccessKey: data.accessKey.SecretAccessKey,
        });
        loadKeys();
      }
    } catch {}
  };

  const deactivateKey = async (accessKeyId: string) => {
    await apiFetch("/api/iam-access-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deactivate", userName: loadedUser, accessKeyId }),
    });
    loadKeys();
  };

  const deleteKey = async (accessKeyId: string) => {
    await apiFetch(
      `/api/iam-access-key?userName=${encodeURIComponent(loadedUser)}&accessKeyId=${encodeURIComponent(accessKeyId)}`,
      { method: "DELETE" },
    );
    loadKeys();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">IAM Access Keys</Header>

        <Container header={<Header variant="h2">Load Access Keys by User</Header>}>
          <SpaceBetween size="m">
            <FormField label="IAM Username">
              <SpaceBetween direction="horizontal" size="xs">
                <Input
                  value={userName}
                  onChange={(e) => setUserName(e.detail.value)}
                  placeholder="Enter IAM username"
                />
                <Button onClick={loadKeys} loading={loading}>
                  Load Keys
                </Button>
              </SpaceBetween>
            </FormField>
          </SpaceBetween>
        </Container>

        {newKeyInfo && (
          <Alert
            type="success"
            header="Access Key Created — Save the secret now"
            onDismiss={() => setNewKeyInfo(null)}
            dismissible
          >
            <SpaceBetween size="xs">
              <Box>
                <strong>Access Key ID:</strong> {newKeyInfo.AccessKeyId}
              </Box>
              <Box>
                <strong>Secret Access Key:</strong> {newKeyInfo.SecretAccessKey}
              </Box>
            </SpaceBetween>
          </Alert>
        )}

        <Container
          header={
            <Header
              variant="h2"
              actions={
                <Button onClick={createKey} disabled={!loadedUser}>
                  Create Key
                </Button>
              }
            >
              {loadedUser ? `Access Keys for "${loadedUser}"` : "Access Keys"}
            </Header>
          }
          className="aws-table-card"
        >
          <Table
            items={accessKeys}
            loading={loading}
            columnDefinitions={[
              { header: "Access Key ID", cell: (item) => item.AccessKeyId },
              { header: "Status", cell: (item) => item.Status },
              {
                header: "Created",
                cell: (item) =>
                  item.CreateDate ? new Date(item.CreateDate).toLocaleString() : "—",
              },
              {
                header: "Actions",
                cell: (item) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      onClick={() => deactivateKey(item.AccessKeyId)}
                      formAction="none"
                      disabled={item.Status === "Inactive"}
                    >
                      Deactivate
                    </Button>
                    <Button onClick={() => deleteKey(item.AccessKeyId)} formAction="none">
                      Delete
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
            empty={
              <Box>
                {loadedUser ? "No access keys found." : "Enter a username and click Load Keys."}
              </Box>
            }
          />
        </Container>
      </SpaceBetween>
    </div>
  );
}
