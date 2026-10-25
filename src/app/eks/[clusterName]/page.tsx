"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Table from "@cloudscape-design/components/table";
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

interface Cluster {
  clusterName: string;
  clusterArn: string;
  status: string;
  version: string;
  endpoint: string;
  createdAt: string;
  roleArn: string;
  resourcesVpcConfig: {
    subnetIds: string[];
    securityGroupIds: string[];
    vpcId: string;
  };
}

export default function EKSClusterDetailPage({
  params,
}: {
  params: Promise<{ clusterName: string }>;
}) {
  const router = useRouter();
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clusterName, setClusterName] = useState<string>("");

  useEffect(() => {
    params.then((p) => setClusterName(p.clusterName));
  }, [params]);

  const fetchCluster = useCallback(async () => {
    if (!clusterName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/eks");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const found = (data.clusters || []).find((c: any) => c.clusterName === clusterName || c.clusterArn === clusterName);
      if (!found) throw new Error(`Cluster "${clusterName}" not found`);
      setCluster(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load cluster");
    } finally {
      setLoading(false);
    }
  }, [clusterName]);

  useEffect(() => {
    fetchCluster();
  }, [fetchCluster]);

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Cluster {clusterName || "Loading..."}</Header>
          <Box textAlign="center">
            Loading cluster details...
          </Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !cluster) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Cluster {clusterName || "Loading..."}</Header>
          <Alert type="error">{error || "Cluster not found"}</Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={fetchCluster}>Refresh</Button>
            <Button onClick={() => router.push("/eks")}>Back to EKS</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="EKS"
          serviceIcon={SERVICE_ICONS["/eks"]?.small}
          counter={1}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/eks/create")}
            >
              Create Cluster
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
            <Box padding="m" >
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Cluster Name</Box>
                <Box>{cluster.clusterName}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">ARN</Box>
                <Box>{cluster.clusterArn}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Status</Box>
                <StatusIndicator type={cluster.status === "ACTIVE" ? "success" : "warning"}>{cluster.status}</StatusIndicator>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Kubernetes Version</Box>
                <Box>{cluster.version}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Endpoint</Box>
                <Box>{cluster.endpoint}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Creation Time</Box>
                <Box>{cluster.createdAt}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">VPC ID</Box>
                <Box>{cluster.resourcesVpcConfig.vpcId}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Subnets</Box>
                <Box>{cluster.resourcesVpcConfig.subnetIds.join(", ")}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Security Groups</Box>
                <Box>{cluster.resourcesVpcConfig.securityGroupIds.join(", ")}</Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>

        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/eks"] || []} />
      </SpaceBetween>
    </div>
  );
}
