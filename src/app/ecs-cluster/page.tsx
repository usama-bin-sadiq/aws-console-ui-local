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
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface ECSCluster {
  clusterName: string;
  clusterArn: string;
  status: string;
  runningTasksCount: number;
  activeServicesCount: number;
}

export default function ECSClusterPage() {
  const [clusters, setClusters] = useState<ECSCluster[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [clusterName, setClusterName] = useState("");

  const fetchClusters = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/ecs");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClusters(data.clusters || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const createCluster = async () => {
    await apiFetch("/api/ecs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clusterName }),
    });
    setCreateModal(false);
    setClusterName("");
    fetchClusters();
  };

  const deleteCluster = async (name: string) => {
    await apiFetch(`/api/ecs?cluster=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchClusters();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="ECS — Clusters"
          serviceIcon={SERVICE_ICONS["/ecs-cluster"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/ecs-cluster/create")}>
            Create cluster
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
              actions={<Button onClick={() => setCreateModal(true)}>Create cluster</Button>}
            >
              Clusters ({clusters.length})
            </Header>
          }
          items={clusters}
          loading={loading}
          columnDefinitions={[
            { header: "Name", cell: (i) => i.clusterName },
            {
              header: "Status",
              cell: (i) => (
                <StatusIndicator type={i.status === "ACTIVE" ? "success" : "warning"}>
                  {i.status}
                </StatusIndicator>
              ),
            },
            { header: "Running tasks", cell: (i) => i.runningTasksCount },
            { header: "Active services", cell: (i) => i.activeServicesCount },
            {
              header: "Actions",
              cell: (i) => (
                <Button onClick={() => deleteCluster(i.clusterName)} formAction="none">
                  Delete
                </Button>
              ),
            },
          ]}
          empty={<Box textAlign="center">No clusters found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create cluster"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createCluster}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Cluster name">
            <Input value={clusterName} onChange={(e) => setClusterName(e.detail.value)} />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
