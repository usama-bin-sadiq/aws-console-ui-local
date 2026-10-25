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

interface RDSInstance {
  DBInstanceIdentifier: string;
  DBInstanceStatus: string;
  DBInstanceClass: string;
  Engine: string;
  Endpoint?: { Address?: string; Port?: number };
  AllocatedStorage?: number;
  MultiAZ?: boolean;
}

export default function RDSDetailPage({
  params,
}: {
  params: Promise<{ dbInstanceIdentifier: string }>;
}) {
  const router = useRouter();
  const [instance, setInstance] = useState<RDSInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dbInstanceIdentifier, setDBInstanceIdentifier] = useState<string>("");

  useEffect(() => {
    params.then((p) => setDBInstanceIdentifier(p.dbInstanceIdentifier));
  }, [params]);

  const fetchDBInstance = useCallback(async () => {
    if (!dbInstanceIdentifier) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/rds");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const found = (data.instances || []).find(
        (i: any) => i.DBInstanceIdentifier === dbInstanceIdentifier,
      );
      if (!found) throw new Error(`DB instance "${dbInstanceIdentifier}" not found`);
      setInstance(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load DB instance");
    } finally {
      setLoading(false);
    }
  }, [dbInstanceIdentifier]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchDBInstance();
    });
  }, [fetchDBInstance]);

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">DB Instance {dbInstanceIdentifier || "Loading..."}</Header>
          <Box textAlign="center">
            <Box
              nativeAttributes={{
                style: { fontSize: "18px", color: "#545b64", marginBottom: "12px" },
              }}
            >
              Loading instance details...
            </Box>
          </Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">DB Instance {dbInstanceIdentifier || "Loading..."}</Header>
          <Alert type="error">{error || "Instance not found"}</Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={fetchDBInstance}>Refresh</Button>
            <Button onClick={() => router.push("/rds")}>Back to RDS</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="RDS"
          serviceIcon={SERVICE_ICONS["/rds"]?.small}
          counter={1}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/rds/create")}
            >
              Create Database
            </button>
          }
        />

        <Container header={<Header variant="h2">Details</Header>}>
          <SpaceBetween size="l">
            <Box padding="m">
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  DB Instance Identifier
                </Box>
                <Box>{instance.DBInstanceIdentifier}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Status
                </Box>
                <StatusIndicator
                  type={instance.DBInstanceStatus === "available" ? "success" : "warning"}
                >
                  {instance.DBInstanceStatus}
                </StatusIndicator>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Engine
                </Box>
                <Box>{instance.Engine}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Instance Class
                </Box>
                <Box>{instance.DBInstanceClass}</Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>

        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/rds"] || []} />
      </SpaceBetween>
    </div>
  );
}
