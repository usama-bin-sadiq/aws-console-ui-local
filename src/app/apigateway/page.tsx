"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import Modal from "@cloudscape-design/components/modal";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Table from "@cloudscape-design/components/table";
import { apiFetch } from "@/lib/api-client";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface RestApi {
  id?: string;
  name?: string;
  description?: string;
  createdDate?: Date;
  apiKeySource?: string;
}

export default function ApiGatewayPage() {
  const [apis, setApis] = useState<RestApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createVisible, setCreateVisible] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const fetchApis = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch("/api/apigateway");
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || `Request failed (${response.status})`);
      }
      setApis(Array.isArray(payload.apis) ? payload.apis : []);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to load REST APIs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchApis();
  }, [fetchApis]);

  const createApi = async () => {
    if (!name.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const response = await apiFetch("/api/apigateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || `Request failed (${response.status})`);
      }
      setCreateVisible(false);
      setName("");
      setDescription("");
      await fetchApis();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to create REST API");
    } finally {
      setCreating(false);
    }
  };

  const deleteApi = async (restApiId: string) => {
    setError(null);
    try {
      const response = await apiFetch(
        `/api/apigateway?restApiId=${encodeURIComponent(restApiId)}`,
        { method: "DELETE" },
      );
      const payload = await response.json();
      if (!response.ok || payload.error) {
        throw new Error(payload.error || `Request failed (${response.status})`);
      }
      await fetchApis();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Unable to delete REST API");
    }
  };

  return (
    <SpaceBetween size="l">
      <AwsServiceHeader
        serviceName="API Gateway"
        serviceIcon={SERVICE_ICONS["/api"]?.small}
        counter={apis.length}
        primaryAction={
          <button
            type="button"
            className="aws-service-page__create"
            onClick={() => setCreateVisible(true)}
          >
            Create REST API
          </button>
        }
      />
      <Container className="aws-table-card">
        <Table
          items={apis}
          loading={loading}
          trackBy="id"
          variant="embedded"
          header={<Box>REST APIs available through the configured emulator.</Box>}
          empty={<Box textAlign="center">No REST APIs found.</Box>}
          columnDefinitions={[
            {
              header: "Name",
              cell: (item) => item.name || "—",
              sortingField: "name",
              isRowHeader: true,
            },
            { header: "ID", cell: (item) => item.id || "—" },
            { header: "Description", cell: (item) => item.description || "—" },
            {
              header: "Created",
              cell: (item) =>
                item.createdDate ? new Date(item.createdDate).toLocaleString() : "—",
            },
            {
              header: "Actions",
              cell: (item) =>
                item.id ? (
                  <Button onClick={() => void deleteApi(item.id!)} formAction="none">
                    Delete
                  </Button>
                ) : (
                  "—"
                ),
            },
          ]}
        />
      </Container>
      <Modal
        visible={createVisible}
        onDismiss={() => setCreateVisible(false)}
        header="Create REST API"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setCreateVisible(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={creating}
              disabled={!name.trim()}
              onClick={() => void createApi()}
            >
              Create
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Name" description="A unique name for the REST API.">
            <Input value={name} onChange={({ detail }) => setName(detail.value)} />
          </FormField>
          <FormField label="Description">
            <Input value={description} onChange={({ detail }) => setDescription(detail.value)} />
          </FormField>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
}
