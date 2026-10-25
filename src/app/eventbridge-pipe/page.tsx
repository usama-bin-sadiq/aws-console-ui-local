"use client";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface EventBridgePipe {
  Name: string;
  CurrentState: string;
  Source?: string;
  Target?: string;
}

export default function EventBridgePipePage() {
  const [pipes, setPipes] = useState<EventBridgePipe[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [pipeName, setPipeName] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");

  const fetchPipes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/pipes");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPipes(data.pipes || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchPipes();
    });
  }, []);

  const createPipe = async () => {
    await apiFetch("/api/pipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: pipeName, source, target }),
    });
    setCreateModal(false);
    setPipeName("");
    setSource("");
    setTarget("");
    fetchPipes();
  };

  const deletePipe = async (name: string) => {
    await apiFetch(`/api/pipes?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchPipes();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="EventBridge Pipes"
          serviceIcon={SERVICE_ICONS["/eventbridge-pipe"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/eventbridge-pipe/create")}
          >
            Create pipe
          </button>
        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Table
          header={
            <Header
              variant="h2"
              actions={<Button onClick={() => setCreateModal(true)}>Create pipe</Button>}
            >
              Pipes ({pipes.length})
            </Header>
          }
          items={pipes}
          loading={loading}
          columnDefinitions={[
            { header: "Name", cell: (i) => i.Name },
            { header: "State", cell: (i) => i.CurrentState },
            { header: "Source", cell: (i) => i.Source || "—" },
            { header: "Target", cell: (i) => i.Target || "—" },
            {
              header: "Actions",
              cell: (i) => (
                <Button onClick={() => deletePipe(i.Name)} formAction="none">
                  Delete
                </Button>
              ),
            },
          ]}
          empty={<Box textAlign="center">No pipes found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create pipe"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createPipe}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Pipe name">
              <Input value={pipeName} onChange={(e) => setPipeName(e.detail.value)} />
            </FormField>
            <FormField label="Source ARN">
              <Input
                value={source}
                onChange={(e) => setSource(e.detail.value)}
                placeholder="arn:aws:sqs:..."
              />
            </FormField>
            <FormField label="Target ARN">
              <Input
                value={target}
                onChange={(e) => setTarget(e.detail.value)}
                placeholder="arn:aws:lambda:..."
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
