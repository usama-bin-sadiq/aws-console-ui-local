"use client";
import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import { CodeView } from "@cloudscape-design/code-view";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Textarea from "@cloudscape-design/components/textarea";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Tabs from "@cloudscape-design/components/tabs";
import Header from "@cloudscape-design/components/header";
import TruncatedText from "@/components/TruncatedText";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

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

interface ExecutionHistoryEvent {
  timestamp?: string;
  type?: string;
  id?: string;
  previousEventId?: string;
  stateMachineEventDetails?: {
    name?: string;
    type?: string;
    input?: string;
    output?: string;
  };
  activityFailedEventDetails?: { name?: string; error?: string; cause?: string };
  executionFailedEventDetails?: { error?: string; cause?: string };
  executionSucceededEventDetails?: { output?: string };
  executionStartedEventDetails?: { input?: string };
  executionStoppedEventDetails?: { error?: string; cause?: string };
}

const DEFAULT_DEFINITION = JSON.stringify(
  {
    Comment: "A simple state machine",
    StartAt: "HelloWorld",
    States: { HelloWorld: { Type: "Pass", End: true } },
  },
  null,
  2,
);

const TYPE_OPTIONS = [
  { label: "STANDARD", value: "STANDARD" },
  { label: "EXPRESS", value: "EXPRESS" },
];

export default function StepFunctionsPage() {
  const [machines, setMachines] = useState<StateMachine[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [startModal, setStartModal] = useState(false);
  const [smName, setSmName] = useState("");
  const [smRoleArn, setSmRoleArn] = useState("");
  const [smType, setSmType] = useState<{ label: string; value: string }>(TYPE_OPTIONS[0]);
  const [smNameError, setSmNameError] = useState<string | null>(null);
  const [smRoleArnError, setSmRoleArnError] = useState<string | null>(null);
  const [definition, setDefinition] = useState(DEFAULT_DEFINITION);
  const [executionName, setExecutionName] = useState("");
  const [executionInput, setExecutionInput] = useState("{}");
  const [executionDetail, setExecutionDetail] = useState<Record<string, unknown>>({});
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistoryEvent[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState("details");
  const [deleteModal, setDeleteModal] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState("");
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const fetchMachines = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/sfn");
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
      const res = await apiFetch(`/api/sfn?arn=${encodeURIComponent(arn)}&action=listExecutions`);
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
      const res = await apiFetch(`/api/sfn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeExecution", executionArn }),
      });
      const data = await res.json();
      if (res.ok && data.execution) {
        setExecutionDetail(data.execution);
        setActiveDetailTab("details");
        fetchExecutionHistory(executionArn);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to describe execution");
    }
  };

  const fetchExecutionHistory = async (executionArn: string) => {
    setHistoryLoading(true);
    try {
      const res = await apiFetch(
        `/api/sfn?arn=${encodeURIComponent(executionArn)}&action=getExecutionHistory`,
      );
      const data = await res.json();
      if (res.ok) {
        setExecutionHistory(data.events || []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch execution history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const createMachine = async () => {
    let hasError = false;
    if (!smName.trim()) {
      setSmNameError("Name is required");
      hasError = true;
    }
    if (!smRoleArn.trim()) {
      setSmRoleArnError("IAM Role ARN is required");
      hasError = true;
    }
    if (hasError) return;

    try {
      const res = await apiFetch("/api/sfn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: smName, definition, roleArn: smRoleArn, type: smType.value }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create state machine");
      }
      setCreateModal(false);
      setSmName("");
      setSmRoleArn("");
      setSmType(TYPE_OPTIONS[0]);
      setDefinition(DEFAULT_DEFINITION);
      fetchMachines();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create state machine");
    }
  };

  const openDeleteModal = (arn: string) => {
    const machine = machines.find((m) => m.stateMachineArn === arn);
    setMachineToDelete(machine?.name || arn);
    setDeleteConfirmName("");
    setDeleteError("");
    setDeleteModal(true);
  };

  const deleteMachine = async () => {
    if (deleteConfirmName !== machineToDelete) {
      setDeleteError("State machine name does not match");
      return;
    }
    const machine = machines.find((m) => m.name === machineToDelete);
    const arn = machine?.stateMachineArn || machineToDelete;
    try {
      const res = await apiFetch(`/api/sfn?arn=${encodeURIComponent(arn)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete state machine");
      }
      setDeleteModal(false);
      if (selectedMachine === arn) {
        setSelectedMachine("");
        setExecutions([]);
        setExecutionDetail({});
        setExecutionHistory([]);
      }
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
      const res = await apiFetch("/api/sfn", {
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
      const res = await apiFetch("/api/sfn", {
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

  const getEventName = (event: ExecutionHistoryEvent) => {
    if (event.stateMachineEventDetails) return event.stateMachineEventDetails.name || "\u2014";
    if (event.activityFailedEventDetails) return event.activityFailedEventDetails.name || "\u2014";
    return "\u2014";
  };

  const getEventDetail = (event: ExecutionHistoryEvent) => {
    if (event.executionStartedEventDetails)
      return `Input: ${event.executionStartedEventDetails.input || "{}"}`;
    if (event.executionSucceededEventDetails)
      return `Output: ${event.executionSucceededEventDetails.output || "{}"}`;
    if (event.executionFailedEventDetails)
      return `Error: ${event.executionFailedEventDetails.error || ""} Cause: ${event.executionFailedEventDetails.cause || ""}`;
    if (event.executionStoppedEventDetails)
      return `Error: ${event.executionStoppedEventDetails.error || ""} Cause: ${event.executionStoppedEventDetails.cause || ""}`;
    if (event.stateMachineEventDetails) {
      const d = event.stateMachineEventDetails;
      return d.input ? `Input: ${d.input}` : d.output ? `Output: ${d.output}` : "\u2014";
    }
    return "\u2014";
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Step Functions"
          serviceIcon={SERVICE_ICONS["/step-functions"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/step-functions/create")}>
            Create state machine
        </button>

        />
        {error && (
          <Alert type="error" onDismiss={() => setError(null)} header="Error">
            {error}
          </Alert>
        )}
        <Container className="aws-table-card">
          <SpaceBetween size="l">
            <div>
              <Table
                header={
                  <Header
                    variant="h2"
                    actions={
                      <Button variant="primary" onClick={() => setCreateModal(true)}>
                        Create state machine
                      </Button>
                    }
                  >
                    State Machines ({machines.length})
                  </Header>
                }
                items={machines}
                loading={loading}
                columnDefinitions={[
                  { header: "Name", cell: (i: StateMachine) => i.name || "\u2014" },
                  { header: "Type", cell: (i: StateMachine) => i.type || "\u2014" },
                  {
                    header: "Status",
                    cell: (i: StateMachine) =>
                      i.status === "ACTIVE" ? (
                        <StatusIndicator type="success">Active</StatusIndicator>
                      ) : (
                        <StatusIndicator type="warning">Inactive</StatusIndicator>
                      ),
                  },
                  {
                    header: "Created",
                    cell: (i: StateMachine) =>
                      i.creationDate ? new Date(i.creationDate).toLocaleString() : "\u2014",
                  },
                  {
                    header: "ARN",
                    cell: (i: StateMachine) => (
                      <TruncatedText>{i.stateMachineArn || "\u2014"}</TruncatedText>
                    ),
                  },
                  {
                    header: "Actions",
                    cell: (i: StateMachine) => (
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button
                          onClick={() => {
                            setSelectedMachine(i.stateMachineArn || "");
                            fetchExecutions(i.stateMachineArn || "");
                          }}
                          formAction="none"
                        >
                          Executions
                        </Button>
                        <Button onClick={() => setStartModal(true)} formAction="none">
                          Start
                        </Button>
                        <Button
                          onClick={() => openDeleteModal(i.stateMachineArn || "")}
                          formAction="none"
                        >
                          Delete
                        </Button>
                      </SpaceBetween>
                    ),
                  },
                ]}
                empty={<Box textAlign="center">No state machines found.</Box>}
              />
            </div>

            {selectedMachine && (
              <div>
                <Header variant="h2">
                  Execution History &mdash;{" "}
                  {machines.find((m) => m.stateMachineArn === selectedMachine)?.name ||
                    selectedMachine}
                </Header>
                <Table
                  items={executions}
                  columnDefinitions={[
                    { header: "Name", cell: (e: Execution) => e.name || "\u2014" },
                    {
                      header: "Status",
                      cell: (e: Execution) =>
                        e.status === "RUNNING" ? (
                          <StatusIndicator type="in-progress">Running</StatusIndicator>
                        ) : e.status === "SUCCEEDED" ? (
                          <StatusIndicator type="success">Succeeded</StatusIndicator>
                        ) : e.status === "FAILED" ? (
                          <StatusIndicator type="error">Failed</StatusIndicator>
                        ) : (
                          <StatusIndicator type="stopped">Stopped</StatusIndicator>
                        ),
                    },
                    {
                      header: "Started",
                      cell: (e: Execution) =>
                        e.startDate ? new Date(e.startDate).toLocaleString() : "\u2014",
                    },
                    {
                      header: "Stopped",
                      cell: (e: Execution) =>
                        e.stopDate ? new Date(e.stopDate).toLocaleString() : "\u2014",
                    },
                    {
                      header: "Actions",
                      cell: (e: Execution) => (
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            onClick={() => describeExecution(e.executionArn || "")}
                            formAction="none"
                          >
                            Describe
                          </Button>
                          {e.status === "RUNNING" && (
                            <Button
                              onClick={() => stopExecution(e.executionArn || "")}
                              formAction="none"
                            >
                              Stop
                            </Button>
                          )}
                        </SpaceBetween>
                      ),
                    },
                  ]}
                  empty={<Box textAlign="center">No executions found.</Box>}
                />
                {Object.keys(executionDetail).length > 0 && (
                  <Container
                    header={
                      <Tabs
                        activeTabId={activeDetailTab}
                        onChange={(e) => setActiveDetailTab(e.detail.activeTabId)}
                        tabs={[
                          {
                            id: "details",
                            label: "Details",
                            content: (
                              <CodeView
                                content={JSON.stringify(executionDetail, null, 2)}
                                lineNumbers
                                wrapLines
                              />
                            ),
                          },
                          {
                            id: "history",
                            label: "Step-by-step history",
                            content: (
                              <Table
                                items={executionHistory}
                                loading={historyLoading}
                                columnDefinitions={[
                                  {
                                    header: "Timestamp",
                                    cell: (ev: ExecutionHistoryEvent) =>
                                      ev.timestamp
                                        ? new Date(ev.timestamp).toLocaleString()
                                        : "\u2014",
                                  },
                                  {
                                    header: "Type",
                                    cell: (ev: ExecutionHistoryEvent) => ev.type || "\u2014",
                                  },
                                  {
                                    header: "Name",
                                    cell: (ev: ExecutionHistoryEvent) => getEventName(ev),
                                  },
                                  {
                                    header: "Input / Output",
                                    cell: (ev: ExecutionHistoryEvent) => (
                                      <TruncatedText>{getEventDetail(ev)}</TruncatedText>
                                    ),
                                  },
                                  {
                                    header: "Event ID",
                                    cell: (ev: ExecutionHistoryEvent) => (
                                      <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                                        {ev.id || "\u2014"}
                                      </span>
                                    ),
                                  },
                                ]}
                                empty={<Box textAlign="center">No execution history found.</Box>}
                              />
                            ),
                          },
                        ]}
                      />
                    }
                  />
                )}
              </div>
            )}
          </SpaceBetween>
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create state machine"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createMachine}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField
              label={
                <>
                  Name <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={smNameError}
            >
              <Input
                value={smName}
                onChange={(e) => {
                  setSmName(e.detail.value);
                  setSmNameError(null);
                }}
                placeholder="my-state-machine"
              />
            </FormField>
            <FormField
              label={
                <>
                  IAM Role ARN <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={smRoleArnError}
            >
              <Input
                value={smRoleArn}
                onChange={(e) => {
                  setSmRoleArn(e.detail.value);
                  setSmRoleArnError(null);
                }}
                placeholder="arn:aws:iam::123456789012:role/my-role"
              />
            </FormField>
            <FormField label="Type">
              <Select
                selectedOption={smType}
                onChange={(e) =>
                  setSmType(e.detail.selectedOption as { label: string; value: string })
                }
                options={TYPE_OPTIONS}
              />
            </FormField>
            <FormField label="Definition (JSON)">
              <Textarea
                value={definition}
                onChange={(e) => setDefinition(e.detail.value)}
                rows={10}
              />
            </FormField>
          </SpaceBetween>
        </Modal>

        <Modal
          visible={startModal}
          onDismiss={() => setStartModal(false)}
          header="Start execution"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setStartModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={startExecution}>
                Start
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Execution name (optional)">
              <Input value={executionName} onChange={(e) => setExecutionName(e.detail.value)} />
            </FormField>
            <FormField label="Input (JSON)">
              <Textarea
                value={executionInput}
                onChange={(e) => setExecutionInput(e.detail.value)}
                rows={6}
              />
            </FormField>
          </SpaceBetween>
        </Modal>

        <Modal
          visible={deleteModal}
          onDismiss={() => setDeleteModal(false)}
          header="Delete state machine"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setDeleteModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={deleteMachine}
                disabled={deleteConfirmName !== machineToDelete}
              >
                Delete
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <Box>
              To confirm deletion, type <b>{machineToDelete}</b> in the field below.
            </Box>
            {deleteError && <Alert type="error">{deleteError}</Alert>}
            <FormField label="State machine name">
              <Input
                value={deleteConfirmName}
                onChange={(e) => {
                  setDeleteConfirmName(e.detail.value);
                  setDeleteError("");
                }}
                placeholder={machineToDelete}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>

      <CrossServiceLinks links={CROSS_SERVICE_LINKS["/step-functions"] || []} />
    </div>
  );
}
