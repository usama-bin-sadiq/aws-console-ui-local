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

interface Cluster {
  CacheClusterId: string;
  CacheClusterStatus: string;
  Engine: string;
  EngineVersion: string;
  CacheNodeType: string;
  NumCacheNodes: number;
  AvailabilityZone?: string;
  CreationTime?: string;
}

export default function ElastiCacheDetailPage({
  params,
}: {
  params: Promise<{ clusterId: string }>;
}) {
  const router = useRouter();
  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clusterId, setClusterId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setClusterId(p.clusterId));
  }, [params]);

  const fetchCluster = useCallback(async () => {
    if (!clusterId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/elasticache");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const found = (data.clusters || []).find((c: any) => c.CacheClusterId === clusterId);
      if (!found) throw new Error(`Cluster "${clusterId}" not found`);
      setCluster(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load cluster");
    } finally {
      setLoading(false);
    }
  }, [clusterId]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchCluster();
    });
  }, [fetchCluster]);

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Cluster {clusterId || "Loading..."}</Header>
          <Box textAlign="center">Loading cluster details...</Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !cluster) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Cluster {clusterId || "Loading..."}</Header>
          <Alert type="error">{error || "Cluster not found"}</Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={fetchCluster}>Refresh</Button>
            <Button onClick={() => router.push("/elasticache")}>Back to ElastiCache</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="ElastiCache"
          serviceIcon={SERVICE_ICONS["/elasticache"]?.small}
          counter={1}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/elasticache/create")}
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
            <Box padding="m">
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Cluster ID
                </Box>
                <Box>{cluster.CacheClusterId}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Engine
                </Box>
                <Box>{cluster.Engine}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Engine Version
                </Box>
                <Box>{cluster.EngineVersion}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Node Type
                </Box>
                <Box>{cluster.CacheNodeType}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Number of Nodes
                </Box>
                <Box>{cluster.NumCacheNodes}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Availability Zone
                </Box>
                <Box>{cluster.AvailabilityZone || "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  State
                </Box>
                <StatusIndicator
                  type={cluster.CacheClusterStatus === "available" ? "success" : "warning"}
                >
                  {cluster.CacheClusterStatus}
                </StatusIndicator>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Creation Time
                </Box>
                <Box>{cluster.CreationTime || "—"}</Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>

        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/elasticache"] || []} />
      </SpaceBetween>
    </div>
  );
}
