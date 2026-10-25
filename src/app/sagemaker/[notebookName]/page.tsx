"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Header from "@cloudscape-design/components/header";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";
import { apiFetch } from "@/lib/api-client";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";

interface Notebook {
  NotebookInstanceName: string;
  NotebookInstanceArn: string;
  NotebookInstanceStatus: string;
  InstanceType: string;
  SubnetId: string;
  SecurityGroups: string[];
  RoleArn: string;
  CreationTime: string;
  LastModifiedTime: string;
}

export default function SageMakerNotebookDetailPage({
  params,
}: {
  params: Promise<{ notebookName: string }>;
}) {
  const router = useRouter();
  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notebookName, setNotebookName] = useState<string>("");

  useEffect(() => {
    params.then((p) => setNotebookName(p.notebookName));
  }, [params]);

  const fetchNotebook = useCallback(async () => {
    if (!notebookName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/sagemaker");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const found = (data.notebookInstances || []).find(
        (n: any) =>
          n.NotebookInstanceName === notebookName || n.NotebookInstanceArn === notebookName,
      );
      if (!found) throw new Error(`Notebook "${notebookName}" not found`);
      setNotebook(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load notebook");
    } finally {
      setLoading(false);
    }
  }, [notebookName]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchNotebook();
    });
  }, [fetchNotebook]);

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Notebook {notebookName || "Loading..."}</Header>
          <Box textAlign="center">Loading notebook details...</Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !notebook) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Notebook {notebookName || "Loading..."}</Header>
          <Alert type="error">{error || "Notebook not found"}</Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={fetchNotebook}>Refresh</Button>
            <Button onClick={() => router.push("/sagemaker")}>Back to SageMaker</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="SageMaker"
          serviceIcon={SERVICE_ICONS["/sagemaker"]?.small}
          counter={1}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/sagemaker/create")}
            >
              Create Notebook
            </button>
          }
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container header={<Header variant="h2">Details</Header>}>
          <SpaceBetween size="l">
            <Box padding="m">
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Notebook Name
                </Box>
                <Box>{notebook.NotebookInstanceName}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  ARN
                </Box>
                <Box>{notebook.NotebookInstanceArn}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Status
                </Box>
                <StatusIndicator
                  type={notebook.NotebookInstanceStatus === "InService" ? "success" : "warning"}
                >
                  {notebook.NotebookInstanceStatus}
                </StatusIndicator>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Instance Type
                </Box>
                <Box>{notebook.InstanceType}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Subnet ID
                </Box>
                <Box>{notebook.SubnetId}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Security Groups
                </Box>
                <Box>{notebook.SecurityGroups.join(", ")}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Role ARN
                </Box>
                <Box>{notebook.RoleArn}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Creation Time
                </Box>
                <Box>{notebook.CreationTime}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Last Modified
                </Box>
                <Box>{notebook.LastModifiedTime}</Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>

        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/sagemaker"] || []} />
      </SpaceBetween>
    </div>
  );
}
