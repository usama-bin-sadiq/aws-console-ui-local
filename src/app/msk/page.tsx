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

interface MSKCluster {
  ClusterName: string;
  ClusterArn: string;
  State: string;
  ClusterType: string;
}

export default function MSKPage() {
  const [clusters, setClusters] = useState<MSKCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [clusterName, setClusterName] = useState("");
  const [creating, setCreating] = useState(false);
  const [clusterNameError, setClusterNameError] = useState<string | null>(null);

  const fetchClusters = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/msk");
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
    if (!clusterName.trim()) {
      setClusterNameError("Cluster name is required");
      return;
    }
    setClusterNameError(null);
    setCreating(true);
    try {
      const res = await apiFetch("/api/msk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clusterName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create cluster");
      }
      setCreateModal(false);
      setClusterName("");
      fetchClusters();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create cluster");
    } finally {
      setCreating(false);
    }
  };

  const deleteCluster = async (arn: string) => {
    try {
      const res = await apiFetch(`/api/msk?clusterArn=${encodeURIComponent(arn)}`, {
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
        <Header variant="h1">Amazon MSK</Header>

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
            { header: "Cluster name", cell: (item) => item.ClusterName },
            { header: "State", cell: (item) => item.State },
            { header: "Cluster type", cell: (item) => item.ClusterType },
            {
              header: "Actions",
              cell: (item) => (
                <Button onClick={() => deleteCluster(item.ClusterArn)} formAction="none">
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
          header="Create MSK cluster"
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
                  Cluster name <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={clusterNameError}
            >
              <Input
                value={clusterName}
                onChange={(e) => {
                  setClusterName(e.detail.value);
                  setClusterNameError(null);
                }}
                placeholder="my-cluster"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
