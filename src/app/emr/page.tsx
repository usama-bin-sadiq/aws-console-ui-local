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

interface EMRCluster {
  Id: string;
  Name: string;
  Status: { State: string };
}

export default function EMRPage() {
  const [clusters, setClusters] = useState<EMRCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [clusterName, setClusterName] = useState("");

  const fetchClusters = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/emr");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setClusters(data.clusters || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchClusters(); }, []);

  const createCluster = async () => {
    await fetch("/api/emr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: clusterName }) });
    setCreateModal(false); setClusterName(""); fetchClusters();
  };

  const deleteCluster = async (id: string) => {
    await fetch(`/api/emr?clusterId=${encodeURIComponent(id)}`, { method: "DELETE" });
    fetchClusters();
  };

  const stateToStatus = (state: string): "success" | "warning" | "error" | "in-progress" => {
    if (state === "RUNNING" || state === "WAITING") return "success";
    if (state === "TERMINATED_WITH_ERRORS") return "error";
    if (state === "TERMINATING" || state === "TERMINATED") return "warning";
    return "in-progress";
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">EMR — Clusters</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <Table
            header={<Header variant="h2" actions={<Button onClick={() => setCreateModal(true)}>Create cluster</Button>}>Clusters ({clusters.length})</Header>}
            items={clusters}
            loading={loading}
            columnDefinitions={[
              { header: "Name", cell: (i) => i.Name },
              { header: "ID", cell: (i) => i.Id },
              { header: "Status", cell: (i) => <StatusIndicator type={stateToStatus(i.Status.State)}>{i.Status.State}</StatusIndicator> },
              { header: "Actions", cell: (i) => <Button onClick={() => deleteCluster(i.Id)} formAction="none">Delete</Button> },
            ]}
            empty={<Box textAlign="center">No clusters found.</Box>}
          />
        </Container>
        <Modal visible={createModal} onDismiss={() => setCreateModal(false)} header="Create cluster"
          footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setCreateModal(false)}>Cancel</Button><Button variant="primary" onClick={createCluster}>Create</Button></SpaceBetween>}>
          <FormField label="Cluster name"><Input value={clusterName} onChange={e => setClusterName(e.detail.value)} /></FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
