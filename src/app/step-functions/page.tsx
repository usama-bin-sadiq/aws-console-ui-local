"use client";
import React, { useEffect, useState } from "react";
import { CodeView } from "@cloudscape-design/code-view";
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
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import TruncatedText from "@/components/TruncatedText";

interface StateMachine {
  stateMachineArn?: string;
  name?: string;
  type?: string;
  status?: string;
  creationDate?: string;
}

interface Execution {
  executionArn?: string;
  stateMachineArn?: string;
  name?: string;
  status?: string;
  startDate?: string;
  stopDate?: string;
  input?: string;
}

const DEFAULT_DEFINITION = JSON.stringify(
  { Comment: "A simple state machine", StartAt: "HelloWorld", States: { HelloWorld: { Type: "Pass", End: true } } },
  null, 2
);

export default function StepFunctionsPage() {
  const [machines, setMachines] = useState<StateMachine[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [startModal, setStartModal] = useState(false);
  const [smName, setSmName] = useState("");
  const [definition, setDefinition] = useState(DEFAULT_DEFINITION);
  const [executionName, setExecutionName] = useState("");
  const [executionInput, setExecutionInput] = useState("{}");
  const [executionDetail, setExecutionDetail] = useState<Record<string, unknown>>({});

  const fetchMachines = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sfn");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch state machines");
      setMachines(data.stateMachines || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch state machines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchExecutions = async (arn: string) => {
    try {
      const res = await fetch(`/api/sfn?arn=${encodeURIComponent(arn)}&action=listExecutions`);
      const data = await res.json();
      if (res.ok) {
        setExecutions(data.executions || []);
        setSelectedMachine(arn);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch executions");
    }
  };

  const describeExecution = async (executionArn: string) => {
    try {
      const res = await fetch(`/api/sfn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeExecution", executionArn }),
      });
      const data = await res.json();
      if (res.ok && data.execution) {
        setExecutionDetail(data.execution);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to describe execution");
    }
  };

  const createMachine = async () => {
    try {
      const res = await fetch("/api/sfn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: smName, definition }),
      });
      if (!res.ok) throw new Error("Failed to create state machine");
      setCreateModal(false);
      setSmName("");
      setDefinition(DEFAULT_DEFINITION);
      fetchMachines();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create state machine");
    }
  };

  const deleteMachine = async (arn: string) => {
    try {
      const res = await fetch(`/api/sfn?arn=${encodeURIComponent(arn)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete state machine");
      fetchMachines();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete state machine");
    }
  };

  const startExecution = async () => {
    const arn = selectedMachine || machines[0]?.stateMachineArn || "";
    if (!arn) {
      setError("Select a state machine first");
      return;
    }
    try {
      const res = await fetch("/api/sfn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "startExecution",
          stateMachineArn: arn,
          input: executionInput || "{}",
          executionName: executionName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start execution");
      setStartModal(false);
      setExecutionName("");
      setExecutionInput("{}");
      fetchExecutions(arn);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start execution");
    }
  };

  const stopExecution = async (executionArn: string) => {
    try {
      const res = await fetch("/api/sfn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stopExecution", executionArn }),
      });
      if (!res.ok) throw new Error("Failed to stop execution");
      if (selectedMachine) fetchExecutions(selectedMachine);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to stop execution");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Step Functions</Header>
        {error && (
          <Alert type="error" onDismiss={() => setError(null)} header="Error">
            {error}
          </Alert>
        )}
        <Container>
          <SpaceBetween size="l">
            <div>
              <Table
                header={
                  <Header variant="h2" actions={<Button variant="primary" onClick={() => setCreateModal(true)}>Create state machine</Button>}>
                    State Machines ({machines.length})
                  </Header>
                }
                items={machines}
                loading={loading}
                columnDefinitions={[
                  { header: "Name", cell: (i: StateMachine) => i.name || "—" },
                  { header: "Type", cell: (i: StateMachine) => i.type || "—" },
                  { header: "Status", cell: (i: StateMachine) => (i.status === "ACTIVE" ? <StatusIndicator type="success">Active</StatusIndicator> : <StatusIndicator type="warning">Inactive</StatusIndicator>) },
                  { header: "ARN", cell: (i: StateMachine) => <TruncatedText>{i.stateMachineArn || "—"}</TruncatedText> },
                  {
                    header: "Actions",
                    cell: (i: StateMachine) => (
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button onClick={() => { setSelectedMachine(i.stateMachineArn || ""); fetchExecutions(i.stateMachineArn || ""); }} formAction="none">Executions</Button>
                        <Button onClick={() => setStartModal(true)} formAction="none">Start</Button>
                        <Button onClick={() => deleteMachine(i.stateMachineArn || "")} formAction="none">Delete</Button>
                      </SpaceBetween>
                    ),
                  },
                ]}
                empty={<Box textAlign="center">No state machines found.</Box>}
              />
            </div>

            {selectedMachine && (
              <div>
                <Header variant="h2">Execution History — {machines.find((m) => m.stateMachineArn === selectedMachine)?.name || selectedMachine}</Header>
                <Table
                  items={executions}
                  columnDefinitions={[
                    { header: "Name", cell: (e: Execution) => e.name || "—" },
                    { header: "Status", cell: (e: Execution) => (e.status === "RUNNING" ? <StatusIndicator type="in-progress">Running</StatusIndicator> : e.status === "SUCCEEDED" ? <StatusIndicator type="success">Succeeded</StatusIndicator> : e.status === "FAILED" ? <StatusIndicator type="error">Failed</StatusIndicator> : <StatusIndicator type="stopped">Stopped</StatusIndicator>) },
                    { header: "Started", cell: (e: Execution) => e.startDate ? new Date(e.startDate).toLocaleString() : "—" },
                    { header: "Stopped", cell: (e: Execution) => e.stopDate ? new Date(e.stopDate).toLocaleString() : "—" },
                    {
                      header: "Actions",
                      cell: (e: Execution) => (
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button onClick={() => describeExecution(e.executionArn || "")} formAction="none">Describe</Button>
                          {e.status === "RUNNING" && <Button onClick={() => stopExecution(e.executionArn || "")} formAction="none">Stop</Button>}
                        </SpaceBetween>
                      ),
                    },
                  ]}
                  empty={<Box textAlign="center">No executions found.</Box>}
                />
                {Object.keys(executionDetail).length > 0 && (
                  <Container header={<Header variant="h3">Execution Details</Header>}>
                    <CodeView content={JSON.stringify(executionDetail, null, 2)} lineNumbers wrapLines />
                  </Container>
                )}
              </div>
            )}
          </SpaceBetween>
        </Container>

        <Modal visible={createModal} onDismiss={() => setCreateModal(false)} header="Create state machine" footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={createMachine}>Create</Button>
          </SpaceBetween>
        }>
          <SpaceBetween size="m">
            <FormField label="Name"><Input value={smName} onChange={e => setSmName(e.detail.value)} /></FormField>
            <FormField label="Definition (JSON)"><Textarea value={definition} onChange={e => setDefinition(e.detail.value)} rows={10} /></FormField>
          </SpaceBetween>
        </Modal>

        <Modal visible={startModal} onDismiss={() => setStartModal(false)} header="Start execution" footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setStartModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={startExecution}>Start</Button>
          </SpaceBetween>
        }>
          <SpaceBetween size="m">
            <FormField label="Execution name (optional)"><Input value={executionName} onChange={e => setExecutionName(e.detail.value)} /></FormField>
            <FormField label="Input (JSON)"><Textarea value={executionInput} onChange={e => setExecutionInput(e.detail.value)} rows={6} /></FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
