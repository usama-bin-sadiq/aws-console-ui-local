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
import Tabs from "@cloudscape-design/components/tabs";

interface ConfigRule {
  ConfigRuleName: string;
  ConfigRuleState?: string;
  Source?: { Owner?: string; SourceIdentifier?: string };
}

interface ConfigurationRecorder {
  name?: string;
  roleARN?: string;
}

export default function ConfigPage() {
  const [recorders, setRecorders] = useState<ConfigurationRecorder[]>([]);
  const [rules, setRules] = useState<ConfigRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [sourceIdentifier, setSourceIdentifier] = useState("");
  const [creating, setCreating] = useState(false);
  const [ruleNameError, setRuleNameError] = useState<string | null>(null);

  // Recorder management
  const [recorderModal, setRecorderModal] = useState(false);
  const [recorderName, setRecorderName] = useState("");
  const [recorderRoleARN, setRecorderRoleARN] = useState("");
  const [creatingRecorder, setCreatingRecorder] = useState(false);
  const [recorderNameError, setRecorderNameError] = useState<string | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/config");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch config");
      setRecorders(data.recorders || []);
      setRules(data.rules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const createRule = async () => {
    if (!ruleName.trim()) {
      setRuleNameError("Rule name is required");
      return;
    }
    setRuleNameError(null);
    setCreating(true);
    try {
      const res = await apiFetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleName, sourceIdentifier }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create rule");
      }
      setCreateModal(false);
      setRuleName("");
      setSourceIdentifier("");
      fetchConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rule");
    } finally {
      setCreating(false);
    }
  };

  const deleteRule = async (name: string) => {
    try {
      const res = await apiFetch(`/api/config?ruleName=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete rule");
      }
      fetchConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete rule");
    }
  };

  const createRecorder = async () => {
    if (!recorderName.trim()) {
      setRecorderNameError("Recorder name is required");
      return;
    }
    setRecorderNameError(null);
    setCreatingRecorder(true);
    try {
      const res = await apiFetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createRecorder",
          recorderName: recorderName,
          roleARN: recorderRoleARN,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create recorder");
      }
      setRecorderModal(false);
      setRecorderName("");
      setRecorderRoleARN("");
      fetchConfig();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create recorder");
    } finally {
      setCreatingRecorder(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Config</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container className="aws-table-card">
          <Tabs
            tabs={[
              {
                label: "Recorders",
                id: "recorders",
                content: (
                  <Table
                    header={
                      <Header
                        variant="h2"
                        actions={
                          <Button variant="primary" onClick={() => setRecorderModal(true)}>
                            Create recorder
                          </Button>
                        }
                      >
                        Configuration recorders ({recorders.length})
                      </Header>
                    }
                    items={recorders}
                    columnDefinitions={[
                      { header: "Name", cell: (item) => item.name || "—" },
                      { header: "Role ARN", cell: (item) => item.roleARN || "—" },
                      {
                        header: "Actions",
                        cell: (item: ConfigurationRecorder) => (
                          <Button
                            onClick={() => {
                              const name = item.name || "default";
                              apiFetch(
                                `/api/config?action=deleteRecorder&recorderName=${encodeURIComponent(name)}`,
                                { method: "DELETE" },
                              ).then(() => fetchConfig());
                            }}
                            formAction="none"
                          >
                            Delete
                          </Button>
                        ),
                      },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No recorders found.</Box>}
                  />
                ),
              },
              {
                label: "Config rules",
                id: "rules",
                content: (
                  <Table
                    header={
                      <Header
                        variant="h2"
                        actions={
                          <Button variant="primary" onClick={() => setCreateModal(true)}>
                            Add rule
                          </Button>
                        }
                      >
                        Config rules ({rules.length})
                      </Header>
                    }
                    items={rules}
                    columnDefinitions={[
                      { header: "Rule name", cell: (item) => item.ConfigRuleName },
                      { header: "State", cell: (item) => item.ConfigRuleState || "—" },
                      {
                        header: "Source identifier",
                        cell: (item) => item.Source?.SourceIdentifier || "—",
                      },
                      {
                        header: "Actions",
                        cell: (item) => (
                          <Button onClick={() => deleteRule(item.ConfigRuleName)} formAction="none">
                            Delete
                          </Button>
                        ),
                      },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No config rules found.</Box>}
                  />
                ),
              },
            ]}
          />
        </Container>

        <Modal
          visible={recorderModal}
          onDismiss={() => {
            setRecorderModal(false);
            setRecorderName("");
            setRecorderRoleARN("");
          }}
          header="Create configuration recorder"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setRecorderModal(false);
                  setRecorderName("");
                  setRecorderRoleARN("");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={createRecorder} loading={creatingRecorder}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField
              label={
                <>
                  Recorder name <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={recorderNameError}
            >
              <Input
                value={recorderName}
                onChange={(e) => {
                  setRecorderName(e.detail.value);
                  setRecorderNameError(null);
                }}
                placeholder="default"
              />
            </FormField>
            <FormField label="Role ARN">
              <Input
                value={recorderRoleARN}
                onChange={(e) => setRecorderRoleARN(e.detail.value)}
                placeholder="arn:aws:iam::123456789012:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig"
              />
            </FormField>
          </SpaceBetween>
        </Modal>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Add config rule"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createRule} loading={creating}>
                Add
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
                placeholder="my-config-rule"
              />
            </FormField>
            <FormField label="Source identifier">
              <Input
                value={sourceIdentifier}
                onChange={(e) => setSourceIdentifier(e.detail.value)}
                placeholder="REQUIRED_TAGS"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
