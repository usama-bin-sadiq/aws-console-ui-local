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
import StatusIndicator from "@cloudscape-design/components/status-indicator";

interface EKSCluster {
  name: string;
  version?: string;
  status?: string;
}

interface NodegroupSummary {
  nodegroupName?: string;
  clusterName?: string;
  status?: string;
  scalingConfig?: {
    desiredSize?: number;
    minSize?: number;
    maxSize?: number;
  };
  instanceTypes?: string[];
}

export default function EKSPPage() {
  const [clusters, setClusters] = useState<EKSCluster[]>([]);
  const [nodegroups, setNodegroups] = useState<NodegroupSummary[]>([]);
  const [loadingClusters, setLoadingClusters] = useState(true);
  const [loadingNodegroups, setLoadingNodegroups] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<string>("");

  // Nodegroup actions
  const [nodegroupModal, setNodegroupModal] = useState(false);
  const [nodegroupName, setNodegroupName] = useState("");
  const [nodegroupInstance, setNodegroupInstance] = useState("t3.medium");
  const [nodegroupDesired, setNodegroupDesired] = useState("2");
  const [nodegroupNameError, setNodegroupNameError] = useState<string | null>(null);

  const fetchClusters = async () => {
    setLoadingClusters(true);
    setError(null);
    try {
      const res = await apiFetch("/api/eks");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClusters(data.clusters || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load clusters");
    } finally {
      setLoadingClusters(false);
    }
  };

  const fetchNodegroups = async () => {
    if (!selectedCluster) return;
    setLoadingNodegroups(true);
    try {
      const res = await apiFetch("/api/eks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listNodegroups", clusterName: selectedCluster }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const groups: NodegroupSummary[] = (data.nodegroups || []).map(
        (ng: {
          nodegroupName?: string;
          status?: string;
          scalingConfig?: { desiredSize?: number; minSize?: number; maxSize?: number };
          instanceTypes?: string[];
        }) => ({
          nodegroupName: ng.nodegroupName,
          clusterName: selectedCluster,
          status: ng.status,
          scalingConfig: ng.scalingConfig,
          instanceTypes: ng.instanceTypes,
        }),
      );
      setNodegroups(groups);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load nodegroups");
    } finally {
      setLoadingNodegroups(false);
    }
  };

  const createNodegroup = async () => {
    if (!nodegroupName.trim() || !selectedCluster) {
      if (!nodegroupName.trim()) setNodegroupNameError("Nodegroup name is required");
      return;
    }
    setNodegroupNameError(null);
    try {
      await apiFetch("/api/eks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createNodegroup",
          clusterName: selectedCluster,
          nodegroupName: nodegroupName,
          instanceTypes: [nodegroupInstance],
          scalingConfig: {
            desiredSize: parseInt(nodegroupDesired) || 2,
            minSize: 1,
            maxSize: 5,
          },
        }),
      });
      setNodegroupModal(false);
      setNodegroupName("");
      fetchNodegroups();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create nodegroup");
    }
  };

  const deleteNodegroup = async (name: string) => {
    if (!selectedCluster) return;
    try {
      await apiFetch("/api/eks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteNodegroup",
          clusterName: selectedCluster,
          nodegroupName: name,
        }),
      });
      fetchNodegroups();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete nodegroup");
    }
  };

  useEffect(() => {
    fetchClusters();
    fetchNodegroups();
  }, []);

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">Amazon EKS — Kubernetes Clusters</Header>
        {error && (
          <Alert type="error" onDismiss={() => setError(null)} header="Error">
            {error}
          </Alert>
        )}

        <Table
          header={<Header variant="h2">Clusters</Header>}
          items={clusters}
          loading={loadingClusters}
          columnDefinitions={[
            { header: "Name", cell: (i: EKSCluster) => i.name },
            { header: "Version", cell: (i: EKSCluster) => i.version || "—" },
            {
              header: "Status",
              cell: (i: EKSCluster) => (
                <StatusIndicator
                  type={
                    i.status === "ACTIVE" ? "success" : i.status === "FAILED" ? "error" : "warning"
                  }
                >
                  {i.status || "—"}
                </StatusIndicator>
              ),
            },
            {
              header: "Actions",
              cell: (i: EKSCluster) => (
                <Button
                  variant="link"
                  formAction="none"
                  onClick={() => {
                    setSelectedCluster(i.name);
                    fetchNodegroups();
                  }}
                >
                  View nodegroups
                </Button>
              ),
            },
          ]}
          empty={<Box textAlign="center">No clusters found.</Box>}
        />

        {/* Nodegroups Section */}
        <Table
          header={
            <Header
              variant="h2"
              actions={
                <Button
                  variant="primary"
                  onClick={() => setNodegroupModal(true)}
                  disabled={!selectedCluster}
                >
                  Create nodegroup
                </Button>
              }
            >
              Nodegroups {selectedCluster ? `— ${selectedCluster}` : ""}
            </Header>
          }
          items={nodegroups}
          loading={loadingNodegroups}
          columnDefinitions={[
            { header: "Nodegroup name", cell: (i: NodegroupSummary) => i.nodegroupName || "—" },
            {
              header: "Status",
              cell: (i: NodegroupSummary) => (
                <StatusIndicator type={i.status === "ACTIVE" ? "success" : "warning"}>
                  {i.status || "—"}
                </StatusIndicator>
              ),
            },
            {
              header: "Instance types",
              cell: (i: NodegroupSummary) => (i.instanceTypes || []).join(", ") || "—",
            },
            {
              header: "Desired / Min / Max",
              cell: (i: NodegroupSummary) =>
                `${i.scalingConfig?.desiredSize ?? "—"} / ${i.scalingConfig?.minSize ?? "—"} / ${i.scalingConfig?.maxSize ?? "—"}`,
            },
            {
              header: "Actions",
              cell: (i: NodegroupSummary) => (
                <Button
                  onClick={() => deleteNodegroup(i.nodegroupName || "")}
                  formAction="none"
                  disabled={!selectedCluster}
                >
                  Delete
                </Button>
              ),
            },
          ]}
          empty={
            <Box textAlign="center">
              {selectedCluster
                ? "No nodegroups found."
                : "Select a cluster above to view nodegroups."}
            </Box>
          }
        />

        <Modal
          visible={nodegroupModal}
          onDismiss={() => setNodegroupModal(false)}
          header="Create nodegroup"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setNodegroupModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createNodegroup}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Cluster" description="Auto-selected">
              <Input value={selectedCluster} disabled />
            </FormField>
            <FormField
              label={
                <>
                  Nodegroup name <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={nodegroupNameError}
            >
              <Input
                value={nodegroupName}
                onChange={(e) => {
                  setNodegroupName(e.detail.value);
                  setNodegroupNameError(null);
                }}
                placeholder="my-nodegroup"
              />
            </FormField>
            <FormField label="Instance type">
              <Input
                value={nodegroupInstance}
                onChange={(e) => setNodegroupInstance(e.detail.value)}
                placeholder="t3.medium"
              />
            </FormField>
            <FormField label="Desired size">
              <Input
                value={nodegroupDesired}
                onChange={(e) => setNodegroupDesired(e.detail.value)}
                placeholder="2"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
