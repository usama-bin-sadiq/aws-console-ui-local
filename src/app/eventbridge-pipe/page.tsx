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

interface EventBridgePipe { Name: string; CurrentState: string; Source?: string; Target?: string; }

export default function EventBridgePipePage() {
  const [pipes, setPipes] = useState<EventBridgePipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [pipeName, setPipeName] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");

  const fetchPipes = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/pipes");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPipes(data.pipes || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchPipes(); }, []);

  const createPipe = async () => {
    await fetch("/api/pipes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: pipeName, source, target }),
    });
    setCreateModal(false); setPipeName(""); setSource(""); setTarget(""); fetchPipes();
  };

  const deletePipe = async (name: string) => {
    await fetch(`/api/pipes?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchPipes();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">EventBridge Pipes</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <Table
            header={<Header variant="h2" actions={<Button onClick={() => setCreateModal(true)}>Create pipe</Button>}>Pipes ({pipes.length})</Header>}
            items={pipes} loading={loading}
            columnDefinitions={[
              { header: "Name", cell: (i) => i.Name },
              { header: "State", cell: (i) => i.CurrentState },
              { header: "Source", cell: (i) => i.Source || "—" },
              { header: "Target", cell: (i) => i.Target || "—" },
              { header: "Actions", cell: (i) => <Button onClick={() => deletePipe(i.Name)} formAction="none">Delete</Button> },
            ]}
            empty={<Box textAlign="center">No pipes found.</Box>}
          />
        </Container>
        <Modal visible={createModal} onDismiss={() => setCreateModal(false)} header="Create pipe"
          footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setCreateModal(false)}>Cancel</Button><Button variant="primary" onClick={createPipe}>Create</Button></SpaceBetween>}>
          <SpaceBetween size="m">
            <FormField label="Pipe name"><Input value={pipeName} onChange={e => setPipeName(e.detail.value)} /></FormField>
            <FormField label="Source ARN"><Input value={source} onChange={e => setSource(e.detail.value)} placeholder="arn:aws:sqs:..." /></FormField>
            <FormField label="Target ARN"><Input value={target} onChange={e => setTarget(e.detail.value)} placeholder="arn:aws:lambda:..." /></FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
