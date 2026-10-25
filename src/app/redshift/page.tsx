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

interface RedshiftCluster {
  ClusterIdentifier: string;
  ClusterStatus: string;
  NodeType: string;
  NumberOfNodes: number;
}

export default function RedshiftPage() {
  const [clusters, setClusters] = useState<RedshiftCluster[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [nodeType, setNodeType] = useState("dc2.large");
  const [creating, setCreating] = useState(false);
  const [identifierError, setIdentifierError] = useState<string | null>(null);

  const fetchClusters = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/redshift");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch clusters");
      setClusters(data.clusters || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch clusters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClusters();
  }, []);

  const createCluster = async () => {
    if (!identifier.trim()) {
      setIdentifierError("Cluster identifier is required");
      return;
    }
    setIdentifierError(null);
    setCreating(true);
    try {
      const res = await apiFetch("/api/redshift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clusterIdentifier: identifier, nodeType }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create cluster");
      }
      setCreateModal(false);
      setIdentifier("");
      setNodeType("dc2.large");
      fetchClusters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create cluster");
    } finally {
      setCreating(false);
    }
  };

  const deleteCluster = async (id: string) => {
    try {
      const res = await apiFetch(`/api/redshift?identifier=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete cluster");
      }
      fetchClusters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete cluster");
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Amazon Redshift"
          serviceIcon={SERVICE_ICONS["/redshift"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/redshift/create")}>
            Create cluster
        </button>

        />

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Table
          header={
            <Header
              variant="h2"
              actions={
                <Button variant="primary" onClick={() => setCreateModal(true)}>
                  Create cluster
                </Button>
              }
            >
              Clusters ({clusters.length})
            </Header>
          }
          items={clusters}
          columnDefinitions={[
            { header: "Cluster identifier", cell: (item) => item.ClusterIdentifier },
            { header: "Status", cell: (item) => item.ClusterStatus },
            { header: "Node type", cell: (item) => item.NodeType },
            { header: "Nodes", cell: (item) => String(item.NumberOfNodes) },
            {
              header: "Actions",
              cell: (item) => (
                <Button onClick={() => deleteCluster(item.ClusterIdentifier)} formAction="none">
                  Delete
                </Button>
              ),
            },
          ]}
          loading={loading}
          empty={<Box textAlign="center">No clusters found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create Redshift cluster"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createCluster} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField
              label={
                <>
                  Cluster identifier <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={identifierError}
            >
              <Input
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.detail.value);
                  setIdentifierError(null);
                }}
                placeholder="my-redshift-cluster"
              />
            </FormField>
            <FormField label="Node type">
              <Input
                value={nodeType}
                onChange={(e) => setNodeType(e.detail.value)}
                placeholder="dc2.large"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
