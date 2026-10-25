"use client";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface EFSFileSystem {
  FileSystemId: string;
  LifeCycleState: string;
  SizeInBytes?: { Value: number };
  Name?: string;
}

export default function EFSPage() {
  const [fileSystems, setFileSystems] = useState<EFSFileSystem[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);

  const fetchFileSystems = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/efs");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFileSystems(data.fileSystems || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchFileSystems();
    });
  }, []);

  const createFileSystem = async () => {
    await apiFetch("/api/efs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setCreateModal(false);
    fetchFileSystems();
  };

  const deleteFileSystem = async (id: string) => {
    await apiFetch(`/api/efs?fileSystemId=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    fetchFileSystems();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="EFS — Elastic File System"
          serviceIcon={SERVICE_ICONS["/efs"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/efs/create")}
          >
            Create file system
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
              actions={<Button onClick={() => setCreateModal(true)}>Create file system</Button>}
            >
              File Systems ({fileSystems.length})
            </Header>
          }
          items={fileSystems}
          loading={loading}
          columnDefinitions={[
            { header: "File System ID", cell: (i) => i.FileSystemId },
            {
              header: "State",
              cell: (i) => (
                <StatusIndicator type={i.LifeCycleState === "available" ? "success" : "pending"}>
                  {i.LifeCycleState}
                </StatusIndicator>
              ),
            },
            {
              header: "Size (bytes)",
              cell: (i) =>
                i.SizeInBytes?.Value != null ? i.SizeInBytes.Value.toLocaleString() : "—",
            },
            {
              header: "Actions",
              cell: (i) => (
                <Button onClick={() => deleteFileSystem(i.FileSystemId)} formAction="none">
                  Delete
                </Button>
              ),
            },
          ]}
          empty={<Box textAlign="center">No file systems found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create file system"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createFileSystem}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <Box>A new EFS file system will be created with default settings.</Box>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
