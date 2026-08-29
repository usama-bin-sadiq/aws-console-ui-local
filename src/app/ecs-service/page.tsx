"use client";
import React, { useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";

export default function ECSServicePage() {
  const [clusterInput, setClusterInput] = useState("");
  const [cluster, setCluster] = useState<string | null>(null);
  const [serviceArns, setServiceArns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listServices = async () => {
    if (!clusterInput.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/ecs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "listServices", cluster: clusterInput }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setServiceArns(data.serviceArns || []);
      setCluster(clusterInput);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">ECS — Services</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <SpaceBetween size="s">
            <FormField label="Cluster name">
              <SpaceBetween direction="horizontal" size="xs">
                <Input value={clusterInput} onChange={e => setClusterInput(e.detail.value)} placeholder="my-cluster" />
                <Button onClick={listServices} loading={loading}>List services</Button>
              </SpaceBetween>
            </FormField>
          </SpaceBetween>
        </Container>
        {cluster && (
          <Container>
            <Table
              header={<Header variant="h2">Services in {cluster} ({serviceArns.length})</Header>}
              items={serviceArns.map(arn => ({ arn }))}
              loading={loading}
              columnDefinitions={[{ header: "Service ARN", cell: (i) => i.arn }]}
              empty={<Box textAlign="center">No services found.</Box>}
            />
          </Container>
        )}
      </SpaceBetween>
    </div>
  );
}
