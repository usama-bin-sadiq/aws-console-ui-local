"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState, useCallback } from "react";
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
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface Parameter {
  Name: string;
  Type: string;
  Value?: string;
  Description?: string;
  LastModifiedDate?: string;
  Version?: number;
  Tier?: string;
  DataType?: string;
}

const PARAMETER_TYPES = ["String", "StringList", "SecureString"] as const;

export default function SSMParameterStorePage() {
  const router = useRouter();
  const [parameters, setParameters] = useState<Parameter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ name: string } | null>(null);
  const [newParam, setNewParam] = useState<{
    name: string;
    type: (typeof PARAMETER_TYPES)[number];
    value: string;
    description: string;
    tier: string;
  }>({
    name: "",
    type: "String",
    value: "",
    description: "",
    tier: "Standard",
  });

  const fetchParameters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/ssm");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setParameters(data.parameters || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch parameters");
      setParameters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParameters();
  }, [fetchParameters]);

  const createParameter = async () => {
    try {
      const res = await apiFetch("/api/ssm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newParam.name,
          value: newParam.value,
          type: newParam.type,
          description: newParam.description,
        }),
      });
      if (!res.ok) throw new Error("Failed to create parameter");
      setCreateModal(false);
      setNewParam({ name: "", type: "String", value: "", description: "", tier: "Standard" });
      fetchParameters();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create parameter");
    }
  };

  const deleteParameter = async (name: string) => {
    try {
      const res = await apiFetch(`/api/ssm?name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete parameter");
      setDeleteModal(null);
      fetchParameters();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete parameter");
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Systems Manager Parameter Store"
          serviceIcon={SERVICE_ICONS["/ssm"]?.small}
          counter={parameters.length}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => {
                setNewParam({ name: "", type: "String", value: "", description: "", tier: "Standard" });
                setCreateModal(true);
              }}
            >
              Create parameter
            </button>
          }
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container className="aws-table-card">
          <Table
            header={
              <SpaceBetween direction="horizontal" size="xs">
                <Box variant="h2">Parameters ({parameters.length})</Box>
              </SpaceBetween>
            }
            items={parameters}
            loading={loading}
            columnDefinitions={[
              {
                id: "name",
                header: "Name",
                cell: (item) => item.Name || "—",
                sortingField: "Name",
                isRowHeader: true,
              },
              {
                id: "type",
                header: "Type",
                cell: (item) => item.Type || "—",
                sortingField: "Type",
              },
              {
                id: "tier",
                header: "Tier",
                cell: (item) => item.Tier || "Standard",
              },
              {
                id: "version",
                header: "Version",
                cell: (item) => item.Version ?? "—",
                sortingField: "Version",
              },
              {
                id: "lastModified",
                header: "Last Modified",
                cell: (item) => item.LastModifiedDate || "—",
                sortingField: "LastModifiedDate",
              },
              {
                id: "actions",
                header: "Actions",
                cell: (item) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      variant="inline-link"
                      onClick={() => setDeleteModal({ name: item.Name })}
                      formAction="none"
                    >
                      Delete
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
            empty={<Box textAlign="center">No parameters found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create parameter"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createParameter} disabled={!newParam.name.trim()}>
                Create parameter
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Name">
            <Input
              value={newParam.name}
              onChange={(e) => setNewParam({ ...newParam, name: e.detail.value })}
              placeholder="my-parameter"
            />
          </FormField>
          <FormField label="Type">
            <Select
              selectedOption={{ label: newParam.type, value: newParam.type }}
              options={PARAMETER_TYPES.map((t) => ({ label: t, value: t }))}
              onChange={(e) => setNewParam({ ...newParam, type: e.detail.selectedOption.value as "String" | "StringList" | "SecureString" })}
            />
          </FormField>
          <FormField label="Value">
            <Input
              value={newParam.value}
              onChange={(e) => setNewParam({ ...newParam, value: e.detail.value })}
              placeholder="parameter value"
            />
          </FormField>
          <FormField label="Description">
            <Input
              value={newParam.description}
              onChange={(e) => setNewParam({ ...newParam, description: e.detail.value })}
              placeholder="optional description"
            />
          </FormField>
        </Modal>

        {deleteModal && (
          <Modal
            visible
            onDismiss={() => setDeleteModal(null)}
            header="Delete parameter"
            footer={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setDeleteModal(null)}>Cancel</Button>
                <Button variant="primary" onClick={() => deleteParameter(deleteModal.name)}>
                  Delete
                </Button>
              </SpaceBetween>
            }
          >
            <Box variant="p">
              Are you sure you want to delete the parameter <strong>{deleteModal.name}</strong>?
            </Box>
          </Modal>
        )}
      </SpaceBetween>
    </div>
  );
}
