"use client";
import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
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
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface SSMParameter {
  Name: string;
  Type: string;
  LastModifiedDate?: string;
}

const TYPE_OPTIONS = [
  { label: "String", value: "String" },
  { label: "SecureString", value: "SecureString" },
  { label: "StringList", value: "StringList" },
];

export default function SSMParameterStorePage() {
  const [parameters, setParameters] = useState<SSMParameter[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);

  const [createModal, setCreateModal] = useState(false);
  const [paramName, setParamName] = useState("");
  const [paramValue, setParamValue] = useState("");
  const [paramType, setParamType] = useState(TYPE_OPTIONS[0]);

  const fetchParameters = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/ssm");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setParameters(data.parameters || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParameters();
  }, []);

  const putParameter = async () => {
    try {
      await apiFetch("/api/ssm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "put",
          name: paramName,
          value: paramValue,
          type: paramType.value,
        }),
      });
    } finally {
      setCreateModal(false);
      setParamName("");
      setParamValue("");
      setParamType(TYPE_OPTIONS[0]);
      fetchParameters();
    }
  };

  const deleteParameter = async (name: string) => {
    await apiFetch(`/api/ssm?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchParameters();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Systems Manager — Parameter Store"
          serviceIcon={SERVICE_ICONS["/systems-manager-parameter-store"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/systems-manager-parameter-store/create")}>
            Create parameter
        </button>

        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Table
          header={
            <Header
              variant="h2"
              actions={<Button onClick={() => setCreateModal(true)}>Create parameter</Button>}
            >
              Parameters ({parameters.length})
            </Header>
          }
          items={parameters}
          loading={loading}
          columnDefinitions={[
            { header: "Name", cell: (item) => item.Name },
            { header: "Type", cell: (item) => item.Type },
            { header: "Last modified", cell: (item) => item.LastModifiedDate ?? "—" },
            {
              header: "Actions",
              cell: (item) => (
                <Button onClick={() => deleteParameter(item.Name)} formAction="none">
                  Delete
                </Button>
              ),
            },
          ]}
          empty={<Box textAlign="center">No parameters found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create parameter"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={putParameter}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input
                value={paramName}
                onChange={(e) => setParamName(e.detail.value)}
                placeholder="/my-app/config/key"
              />
            </FormField>
            <FormField label="Value">
              <Input
                value={paramValue}
                onChange={(e) => setParamValue(e.detail.value)}
                placeholder="parameter value"
              />
            </FormField>
            <FormField label="Type">
              <Select
                selectedOption={paramType}
                onChange={(e) => setParamType(e.detail.selectedOption as (typeof TYPE_OPTIONS)[0])}
                options={TYPE_OPTIONS}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
