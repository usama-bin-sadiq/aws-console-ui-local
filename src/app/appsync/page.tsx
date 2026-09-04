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
import Select from "@cloudscape-design/components/select";

interface GraphQLApi {
  apiId: string;
  name: string;
  authenticationType: string;
}

const AUTH_TYPES = [
  { label: "API Key", value: "API_KEY" },
  { label: "Amazon Cognito User Pools", value: "AMAZON_COGNITO_USER_POOLS" },
  { label: "AWS IAM", value: "AWS_IAM" },
  { label: "OpenID Connect", value: "OPENID_CONNECT" },
  { label: "AWS Lambda", value: "AWS_LAMBDA" },
];

export default function AppSyncPage() {
  const [apis, setApis] = useState<GraphQLApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [apiName, setApiName] = useState("");
  const [authType, setAuthType] = useState({ label: "API Key", value: "API_KEY" });
  const [creating, setCreating] = useState(false);

  const fetchApis = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/appsync");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch APIs");
      setApis(data.graphqlApis || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch APIs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApis();
  }, []);

  const createApi = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/appsync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: apiName, authenticationType: authType.value }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create API");
      }
      setCreateModal(false);
      setApiName("");
      setAuthType({ label: "API Key", value: "API_KEY" });
      fetchApis();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create API");
    } finally {
      setCreating(false);
    }
  };

  const deleteApi = async (apiId: string) => {
    try {
      const res = await fetch(`/api/appsync?apiId=${encodeURIComponent(apiId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete API");
      }
      fetchApis();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete API");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">API Gateway / AppSync</Header>

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
                    Create API
                  </Button>
                }
              >
                GraphQL APIs ({apis.length})
              </Header>
            }
            items={apis}
            columnDefinitions={[
              { header: "Name", cell: (item) => item.name },
              { header: "API ID", cell: (item) => item.apiId },
              { header: "Authentication type", cell: (item) => item.authenticationType },
              {
                header: "Actions",
                cell: (item) => (
                  <Button formAction="none" onClick={() => deleteApi(item.apiId)}>
                    Delete
                  </Button>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No GraphQL APIs found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create GraphQL API"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createApi} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="API name" constraintText="Required">
              <Input
                value={apiName}
                onChange={(e) => setApiName(e.detail.value)}
                placeholder="my-graphql-api"
              />
            </FormField>
            <FormField label="Authentication type">
              <Select
                selectedOption={authType}
                onChange={(e) => setAuthType(e.detail.selectedOption as { label: string; value: string })}
                options={AUTH_TYPES}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
