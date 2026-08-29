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
import StatusIndicator from "@cloudscape-design/components/status-indicator";

interface EKSCluster {
  name: string;
  version: string;
  status: string;
  endpoint?: string;
}

export default function EKSClusterPage() {
  const [clusters, setClusters] = useState<EKSCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [clusterName, setClusterName] = useState("");
  const [version, setVersion] = useState("1.29");

  const fetchClusters = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/eks");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClusters(data.clusters || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchClusters(); }, []);

  const createCluster = async () => {
    await fetch("/api/eks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: clusterName, version }) });
    setCreateModal(false); setClusterName(""); setVersion("1.29"); fetchClusters();
  };

  const deleteCluster = async (name: string) => {
    await fetch(`/api/eks?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchClusters();
  };

  const stateToStatus = (status: string): "success" | "warning" | "error" | "in-progress" => {
    if (status === "ACTIVE") return "success";
    if (status === "FAILED" || status === "DELETE_FAILED") return "error";
    if (status === "DELETING") return "warning";
    return "in-progress";
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">EKS — Clusters</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <Table
            header={<Header variant="h2" actions={<Button onClick={() => setCreateModal(true)}>Create cluster</Button>}>Clusters ({clusters.length})</Header>}
            items={clusters}
            loading={loading}
            columnDefinitions={[
              { header: "Name", cell: (i) => i.name },
              { header: "Version", cell: (i) => i.version },
              { header: "Status", cell: (i) => <StatusIndicator type={stateToStatus(i.status)}>{i.status}</StatusIndicator> },
              { header: "Endpoint", cell: (i) => i.endpoint || "—" },
              { header: "Actions", cell: (i) => <Button onClick={() => deleteCluster(i.name)} formAction="none">Delete</Button> },
            ]}
            empty={<Box textAlign="center">No clusters found.</Box>}
          />
        </Container>
        <Modal visible={createModal} onDismiss={() => setCreateModal(false)} header="Create cluster"
          footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setCreateModal(false)}>Cancel</Button><Button variant="primary" onClick={createCluster}>Create</Button></SpaceBetween>}>
          <SpaceBetween size="m">
            <FormField label="Cluster name"><Input value={clusterName} onChange={e => setClusterName(e.detail.value)} /></FormField>
            <FormField label="Kubernetes version"><Input value={version} onChange={e => setVersion(e.detail.value)} placeholder="1.29" /></FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
