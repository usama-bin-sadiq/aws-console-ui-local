"use client";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
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
import Tabs from "@cloudscape-design/components/tabs";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Badge from "@cloudscape-design/components/badge";
import Header from "@cloudscape-design/components/header";
import TruncatedText from "@/components/TruncatedText";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface EventRule {
  Name?: string;
  Arn?: string;
  State?: string;
  EventBusName?: string;
  ScheduleExpression?: string;
  EventPattern?: string;
}

interface RuleTarget {
  Id?: string;
  Arn?: string;
  RoleArn?: string;
  Input?: string;
}

interface EventBus {
  Name?: string;
  Arn?: string;
}

export default function EventBridgePage() {
  const [rules, setRules] = useState<EventRule[]>([]);
  const [eventBuses, setEventBuses] = useState<EventBus[]>([]);
  const [targets, setTargets] = useState<Record<string, RuleTarget[]>>({});
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [targetsModal, setTargetsModal] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [busName, setBusName] = useState("default");
  const [scheduleExpression, setScheduleExpression] = useState("");
  const [eventPattern, setEventPattern] = useState("");
  const [selectedRule, setSelectedRule] = useState<string>("");
  const [targetArn, setTargetArn] = useState("");
  const [targetInput, setTargetInput] = useState("");
  const [ruleNameError, setRuleNameError] = useState<string | null>(null);
  const [targetArnError, setTargetArnError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/eventbridge");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch data");
      setEventBuses(data.eventBuses || []);
      setRules(data.rules || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchData();
    });
  }, []);

  const fetchTargetsForRule = async (name: string, bus: string) => {
    try {
      const res = await apiFetch(
        `/api/eventbridge?action=listTargets&ruleName=${encodeURIComponent(name)}&eventBusName=${encodeURIComponent(bus)}`,
      );
      const data = await res.json();
      if (res.ok && data.targets) {
        setTargets((prev) => ({ ...prev, [name]: data.targets }));
      }
    } catch {
      // ignore target fetch errors
    }
  };

  const createRule = async () => {
    if (!ruleName.trim()) {
      setRuleNameError("Rule name is required");
      return;
    }
    setRuleNameError(null);
    try {
      const res = await apiFetch("/api/eventbridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createRule",
          name: ruleName,
          eventBusName: busName || "default",
          scheduleExpression,
          eventPattern: eventPattern ? JSON.parse(eventPattern) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create rule");
      setCreateModal(false);
      setRuleName("");
      setBusName("default");
      setScheduleExpression("");
      setEventPattern("");
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create rule");
    }
  };

  const deleteRule = async (name: string, bus: string) => {
    try {
      const res = await apiFetch(
        `/api/eventbridge?action=deleteRule&ruleName=${encodeURIComponent(name)}&eventBusName=${encodeURIComponent(bus)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete rule");
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete rule");
    }
  };

  const toggleRuleState = async (name: string, bus: string, currentState: string) => {
    try {
      const action = currentState === "ENABLED" ? "disableRule" : "enableRule";
      const res = await apiFetch("/api/eventbridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ruleName: name, eventBusName: bus || "default" }),
      });
      if (!res.ok) throw new Error("Failed to update rule state");
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update rule state");
    }
  };

  const addTarget = async () => {
    if (!selectedRule || !targetArn) {
      if (!targetArn) setTargetArnError("Target ARN is required");
      return;
    }
    setTargetArnError(null);
    const bus = rules.find((r) => r.Name === selectedRule)?.EventBusName || "default";
    try {
      const res = await apiFetch("/api/eventbridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "putTargets",
          ruleName: selectedRule,
          eventBusName: bus,
          targets: [
            { Id: `target-${Date.now()}`, Arn: targetArn, Input: targetInput || undefined },
          ],
        }),
      });
      if (!res.ok) throw new Error("Failed to add target");
      const prevRule = selectedRule;
      setTargetsModal(false);
      setSelectedRule("");
      setTargetArn("");
      setTargetInput("");
      if (prevRule) fetchTargetsForRule(prevRule, bus);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add target");
    }
  };

  const openTargets = (name: string) => {
    setSelectedRule(name);
    const bus = rules.find((r) => r.Name === name)?.EventBusName || "default";
    fetchTargetsForRule(name, bus);
    setTargetsModal(true);
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Amazon EventBridge"
          serviceIcon={SERVICE_ICONS["/eventbridge"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/eventbridge/create")}
          >
            Create event bus
          </button>
        />
        {error && (
          <Alert type="error" onDismiss={() => setError(null)} header="Error">
            {error}
          </Alert>
        )}
        <Container className="aws-table-card">
          <Tabs
            tabs={[
              {
                label: "Rules",
                id: "rules",
                content: (
                  <div>
                    <Table
                      header={
                        <Header
                          variant="h2"
                          actions={
                            <Button variant="primary" onClick={() => setCreateModal(true)}>
                              Create rule
                            </Button>
                          }
                        >
                          Rules ({rules.length})
                        </Header>
                      }
                      items={rules}
                      loading={loading}
                      columnDefinitions={[
                        { header: "Name", cell: (i: EventRule) => i.Name || "—" },
                        {
                          header: "State",
                          cell: (i: EventRule) =>
                            i.State === "ENABLED" ? (
                              <StatusIndicator type="success">Enabled</StatusIndicator>
                            ) : (
                              <StatusIndicator type="warning">Disabled</StatusIndicator>
                            ),
                        },
                        {
                          header: "Event Bus",
                          cell: (i: EventRule) => i.EventBusName || "default",
                        },
                        {
                          header: "Schedule",
                          cell: (i: EventRule) =>
                            i.ScheduleExpression || (i.EventPattern ? "Event pattern" : "—"),
                        },
                        {
                          header: "Targets",
                          cell: (i: EventRule) => (
                            <Badge color={targets[i.Name || ""] ? "green" : "grey"}>
                              {targets[i.Name || ""]?.length || 0}
                            </Badge>
                          ),
                        },
                        {
                          header: "Actions",
                          cell: (i: EventRule) => (
                            <SpaceBetween direction="horizontal" size="xs">
                              <Button onClick={() => openTargets(i.Name || "")} formAction="none">
                                Targets
                              </Button>
                              <Button
                                onClick={() =>
                                  toggleRuleState(
                                    i.Name || "",
                                    i.EventBusName || "default",
                                    i.State || "",
                                  )
                                }
                                formAction="none"
                                variant={i.State === "ENABLED" ? "normal" : "primary"}
                              >
                                {i.State === "ENABLED" ? "Disable" : "Enable"}
                              </Button>
                              <Button
                                onClick={() =>
                                  deleteRule(i.Name || "", i.EventBusName || "default")
                                }
                                formAction="none"
                              >
                                Delete
                              </Button>
                            </SpaceBetween>
                          ),
                        },
                      ]}
                      empty={<Box textAlign="center">No rules found.</Box>}
                    />
                  </div>
                ),
              },
              {
                label: "Event Buses",
                id: "buses",
                content: (
                  <Table
                    header={<Header variant="h2">Event Buses ({eventBuses.length})</Header>}
                    items={eventBuses}
                    loading={loading}
                    columnDefinitions={[
                      { header: "Name", cell: (i: EventBus) => i.Name || "—" },
                      {
                        header: "ARN",
                        cell: (i: EventBus) => <TruncatedText>{i.Arn || "—"}</TruncatedText>,
                      },
                    ]}
                    empty={<Box textAlign="center">No event buses found.</Box>}
                  />
                ),
              },
            ]}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create rule"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createRule}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField
              label={
                <>
                  Rule name <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={ruleNameError}
            >
              <Input
                value={ruleName}
                onChange={(e) => {
                  setRuleName(e.detail.value);
                  setRuleNameError(null);
                }}
              />
            </FormField>
            <FormField label="Event bus">
              <Input
                value={busName}
                onChange={(e) => setBusName(e.detail.value)}
                placeholder="default"
              />
            </FormField>
            <FormField label="Schedule expression (optional)">
              <Input
                value={scheduleExpression}
                onChange={(e) => setScheduleExpression(e.detail.value)}
                placeholder="rate(5 minutes)"
              />
            </FormField>
            <FormField label="Event pattern (JSON, optional)">
              <Textarea
                value={eventPattern}
                onChange={(e) => setEventPattern(e.detail.value)}
                placeholder='{"source":["aws.ec2"]}'
                rows={3}
              />
            </FormField>
          </SpaceBetween>
        </Modal>

        <Modal
          visible={targetsModal}
          onDismiss={() => setTargetsModal(false)}
          header={`Targets — ${selectedRule || "Rule"}`}
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setTargetsModal(false)}>Close</Button>
              <Button variant="primary" onClick={addTarget}>
                Add target
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <Table
              header={<Header variant="h3">Current targets</Header>}
              items={targets[selectedRule] || []}
              columnDefinitions={[
                { header: "Target ID", cell: (t: RuleTarget) => t.Id || "—" },
                {
                  header: "ARN",
                  cell: (t: RuleTarget) => <TruncatedText>{t.Arn || "—"}</TruncatedText>,
                },
                { header: "Input", cell: (t: RuleTarget) => t.Input || "—" },
              ]}
              empty={<Box textAlign="center">No targets configured.</Box>}
            />
            <SpaceBetween size="xs" direction="vertical">
              <FormField
                label={
                  <>
                    Target ARN <span style={{ color: "red" }}>*</span>
                  </>
                }
                errorText={targetArnError}
              >
                <Input
                  value={targetArn}
                  onChange={(e) => {
                    setTargetArn(e.detail.value);
                    setTargetArnError(null);
                  }}
                  placeholder="arn:aws:lambda:us-east-1:000000000000:function:myFunction"
                />
              </FormField>
              <FormField label="Input (JSON, optional)">
                <Textarea
                  value={targetInput}
                  onChange={(e) => setTargetInput(e.detail.value)}
                  placeholder='{"key":"value"}'
                  rows={2}
                />
              </FormField>
            </SpaceBetween>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
