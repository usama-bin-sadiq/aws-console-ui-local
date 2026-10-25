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
import Tabs from "@cloudscape-design/components/tabs";
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface NotebookInstance {
  NotebookInstanceName: string;
  InstanceType: string;
  NotebookInstanceStatus: string;
}
interface SageMakerEndpoint {
  EndpointName: string;
  EndpointStatus: string;
}

export default function SageMakerPage() {
  const [notebooks, setNotebooks] = useState<NotebookInstance[]>([]);
  const [endpoints, setEndpoints] = useState<SageMakerEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [nbName, setNbName] = useState("");
  const [instanceType, setInstanceType] = useState("ml.t2.medium");

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/sagemaker");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNotebooks(data.notebookInstances || []);
      setEndpoints(data.endpoints || []);
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

  const createNotebook = async () => {
    await apiFetch("/api/sagemaker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notebookInstanceName: nbName, instanceType }),
    });
    setCreateModal(false);
    setNbName("");
    fetchData();
  };

  const startNotebook = async (name: string) => {
    await apiFetch("/api/sagemaker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "startNotebook", name }),
    });
    fetchData();
  };

  const stopNotebook = async (name: string) => {
    await apiFetch("/api/sagemaker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "stopNotebook", name }),
    });
    fetchData();
  };

  const deleteNotebook = async (name: string) => {
    await apiFetch(`/api/sagemaker?type=notebook&name=${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    fetchData();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Amazon SageMaker"
          serviceIcon={SERVICE_ICONS["/sagemaker"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/sagemaker/create")}
          >
            Create notebook
          </button>
        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Container className="aws-table-card">
          <Tabs
            tabs={[
              {
                id: "notebooks",
                label: `Notebook Instances (${notebooks.length})`,
                content: (
                  <Table
                    header={
                      <Header
                        variant="h2"
                        actions={
                          <Button onClick={() => setCreateModal(true)}>Create notebook</Button>
                        }
                      >
                        Notebook Instances
                      </Header>
                    }
                    items={notebooks}
                    loading={loading}
                    columnDefinitions={[
                      { header: "Name", cell: (i) => i.NotebookInstanceName },
                      { header: "Instance type", cell: (i) => i.InstanceType },
                      { header: "Status", cell: (i) => i.NotebookInstanceStatus },
                      {
                        header: "Actions",
                        cell: (i) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            {i.NotebookInstanceStatus === "InService" && (
                              <Button
                                onClick={() => stopNotebook(i.NotebookInstanceName)}
                                formAction="none"
                              >
                                Stop
                              </Button>
                            )}
                            {i.NotebookInstanceStatus === "Stopped" && (
                              <Button
                                onClick={() => startNotebook(i.NotebookInstanceName)}
                                formAction="none"
                              >
                                Start
                              </Button>
                            )}
                            <Button
                              onClick={() => deleteNotebook(i.NotebookInstanceName)}
                              formAction="none"
                            >
                              Delete
                            </Button>
                          </SpaceBetween>
                        ),
                      },
                    ]}
                    empty={<Box textAlign="center">No notebook instances.</Box>}
                  />
                ),
              },
              {
                id: "endpoints",
                label: `Endpoints (${endpoints.length})`,
                content: (
                  <Table
                    header={<Header variant="h2">Endpoints</Header>}
                    items={endpoints}
                    loading={loading}
                    columnDefinitions={[
                      { header: "Name", cell: (i) => i.EndpointName },
                      { header: "Status", cell: (i) => i.EndpointStatus },
                    ]}
                    empty={<Box textAlign="center">No endpoints.</Box>}
                  />
                ),
              },
            ]}
          />
        </Container>
        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create notebook instance"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createNotebook}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Notebook instance name">
              <Input value={nbName} onChange={(e) => setNbName(e.detail.value)} />
            </FormField>
            <FormField label="Instance type">
              <Input
                value={instanceType}
                onChange={(e) => setInstanceType(e.detail.value)}
                placeholder="ml.t2.medium"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
