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
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface LogGroup {
  logGroupName: string;
  retentionInDays?: number;
  storedBytes?: number;
  creationTime?: number;
}

export default function CloudWatchLogsPage() {
  const [logGroups, setLogGroups] = useState<LogGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);

  const [createModal, setCreateModal] = useState(false);
  const [logGroupName, setLogGroupName] = useState("");

  const fetchLogGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/cloudwatch-logs");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setLogGroups(data.logGroups || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogGroups();
  }, []);

  const createLogGroup = async () => {
    try {
      await apiFetch("/api/cloudwatch-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createGroup", logGroupName }),
      });
    } finally {
      setCreateModal(false);
      setLogGroupName("");
      fetchLogGroups();
    }
  };

  const deleteLogGroup = async (name: string) => {
    await apiFetch(`/api/cloudwatch-logs?logGroupName=${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    fetchLogGroups();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="CloudWatch Logs"
          serviceIcon={SERVICE_ICONS["/cloudwatch-logs"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/cloudwatch-logs/create")}>
            Create log group
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
              actions={<Button onClick={() => setCreateModal(true)}>Create log group</Button>}
            >
              Log Groups ({logGroups.length})
            </Header>
          }
          items={logGroups}
          loading={loading}
          columnDefinitions={[
            { header: "Log group name", cell: (item) => item.logGroupName },
            {
              header: "Retention (days)",
              cell: (item) =>
                item.retentionInDays != null ? String(item.retentionInDays) : "Never expire",
            },
            {
              header: "Stored bytes",
              cell: (item) => (item.storedBytes != null ? item.storedBytes.toLocaleString() : "—"),
            },
            {
              header: "Actions",
              cell: (item) => (
                <Button onClick={() => deleteLogGroup(item.logGroupName)} formAction="none">
                  Delete
                </Button>
              ),
            },
          ]}
          empty={<Box textAlign="center">No log groups found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create log group"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createLogGroup}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Log group name">
            <Input
              value={logGroupName}
              onChange={(e) => setLogGroupName(e.detail.value)}
              placeholder="/aws/lambda/my-function"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
