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

interface ServiceDiscoveryNamespace {
  Id: string;
  Name: string;
  Type: string;
}

export default function ServiceDiscoveryPage() {
  const [namespaces, setNamespaces] = useState<ServiceDiscoveryNamespace[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [namespaceName, setNamespaceName] = useState("");

  const fetchNamespaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/servicediscovery");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNamespaces(data.namespaces || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchNamespaces();
    });
  }, []);

  const createNamespace = async () => {
    await apiFetch("/api/servicediscovery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createNamespace", name: namespaceName }),
    });
    setCreateModal(false);
    setNamespaceName("");
    fetchNamespaces();
  };

  const deleteNamespace = async (id: string) => {
    await apiFetch(`/api/servicediscovery?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    fetchNamespaces();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Service Discovery"
          serviceIcon={SERVICE_ICONS["/servicediscovery"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/servicediscovery/create")}
          >
            Create namespace
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
              actions={<Button onClick={() => setCreateModal(true)}>Create namespace</Button>}
            >
              Namespaces ({namespaces.length})
            </Header>
          }
          items={namespaces}
          loading={loading}
          columnDefinitions={[
            { header: "Name", cell: (item) => item.Name },
            { header: "ID", cell: (item) => item.Id },
            { header: "Type", cell: (item) => item.Type },
            {
              header: "Actions",
              cell: (item) => (
                <Button onClick={() => deleteNamespace(item.Id)} formAction="none">
                  Delete
                </Button>
              ),
            },
          ]}
          empty={<Box textAlign="center">No namespaces found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create namespace"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createNamespace}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Name">
            <Input
              value={namespaceName}
              onChange={(e) => setNamespaceName(e.detail.value)}
              placeholder="my-namespace"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
