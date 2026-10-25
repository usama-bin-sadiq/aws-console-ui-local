"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Alert from "@cloudscape-design/components/alert";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface BedrockAgent {
  agentId: string;
  agentName: string;
  agentStatus: string;
}

export default function BedrockAgentPage() {
  const [agents, setAgents] = useState<BedrockAgent[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [agentName, setAgentName] = useState("");
  const [foundationModel, setFoundationModel] = useState("anthropic.claude-v2");
  const [creating, setCreating] = useState(false);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/bedrock-agent");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch agents");
      setAgents(data.agentSummaries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const createAgent = async () => {
    setCreating(true);
    try {
      const res = await apiFetch("/api/bedrock-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", agentName, foundationModel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create agent");
      setCreateModal(false);
      setAgentName("");
      setFoundationModel("anthropic.claude-v2");
      fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  };

  const deleteAgent = async (agentId: string) => {
    try {
      const res = await apiFetch(`/api/bedrock-agent?agentId=${encodeURIComponent(agentId)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete agent");
      fetchAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Amazon Bedrock Agents"
          serviceIcon={SERVICE_ICONS["/bedrock-agent"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/bedrock-agent/create")}>
            Create agent
        </button>

        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Table
          header={
            <Header
              variant="h2"
              actions={
                <Button variant="primary" onClick={() => setCreateModal(true)}>
                  Create agent
                </Button>
              }
            >
              Agents ({agents.length})
            </Header>
          }
          items={agents}
          columnDefinitions={[
            { header: "Name", cell: (item) => item.agentName },
            { header: "Agent ID", cell: (item) => item.agentId },
            {
              header: "Status",
              cell: (item) => (
                <StatusIndicator type={item.agentStatus === "AVAILABLE" ? "success" : "pending"}>
                  {item.agentStatus}
                </StatusIndicator>
              ),
            },
            {
              header: "Actions",
              cell: (item) => (
                <Button onClick={() => deleteAgent(item.agentId)} formAction="none">
                  Delete
                </Button>
              ),
            },
          ]}
          loading={loading}
          empty={<Box textAlign="center">No agents found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create Bedrock Agent"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={createAgent}
                loading={creating}
                disabled={!agentName.trim()}
              >
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Agent Name">
              <Input
                value={agentName}
                onChange={(e) => setAgentName(e.detail.value)}
                placeholder="my-bedrock-agent"
              />
            </FormField>
            <FormField label="Foundation Model">
              <Input
                value={foundationModel}
                onChange={(e) => setFoundationModel(e.detail.value)}
                placeholder="anthropic.claude-v2"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
