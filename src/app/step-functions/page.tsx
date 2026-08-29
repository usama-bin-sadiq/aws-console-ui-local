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
import Textarea from "@cloudscape-design/components/textarea";

interface StateMachine { stateMachineArn: string; name: string; type: string; status: string; }

const DEFAULT_DEFINITION = JSON.stringify(
  { Comment: "A simple state machine", StartAt: "HelloWorld", States: { HelloWorld: { Type: "Pass", End: true } } },
  null, 2
);

export default function StepFunctionsPage() {
  const [machines, setMachines] = useState<StateMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [smName, setSmName] = useState("");
  const [definition, setDefinition] = useState(DEFAULT_DEFINITION);

  const fetchMachines = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/sfn");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMachines(data.stateMachines || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchMachines(); }, []);

  const createMachine = async () => {
    await fetch("/api/sfn", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: smName, definition }),
    });
    setCreateModal(false); setSmName(""); setDefinition(DEFAULT_DEFINITION); fetchMachines();
  };

  const deleteMachine = async (arn: string) => {
    await fetch(`/api/sfn?arn=${encodeURIComponent(arn)}`, { method: "DELETE" });
    fetchMachines();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Step Functions</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <Table
            header={<Header variant="h2" actions={<Button onClick={() => setCreateModal(true)}>Create state machine</Button>}>State Machines ({machines.length})</Header>}
            items={machines} loading={loading}
            columnDefinitions={[
              { header: "Name", cell: (i) => i.name },
              { header: "Type", cell: (i) => i.type },
              { header: "Status", cell: (i) => i.status },
              { header: "Actions", cell: (i) => <Button onClick={() => deleteMachine(i.stateMachineArn)} formAction="none">Delete</Button> },
            ]}
            empty={<Box textAlign="center">No state machines found.</Box>}
          />
        </Container>
        <Modal visible={createModal} onDismiss={() => setCreateModal(false)} header="Create state machine"
          footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setCreateModal(false)}>Cancel</Button><Button variant="primary" onClick={createMachine}>Create</Button></SpaceBetween>}>
          <SpaceBetween size="m">
            <FormField label="Name"><Input value={smName} onChange={e => setSmName(e.detail.value)} /></FormField>
            <FormField label="Definition (JSON)"><Textarea value={definition} onChange={e => setDefinition(e.detail.value)} rows={10} /></FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
