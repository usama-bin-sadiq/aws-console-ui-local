"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Tabs from "@cloudscape-design/components/tabs";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Button from "@cloudscape-design/components/button";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Alert from "@cloudscape-design/components/alert";
import Spinner from "@cloudscape-design/components/spinner";
import Table from "@cloudscape-design/components/table";
import Modal from "@cloudscape-design/components/modal";
import { RDSInstance, RDSDBSnapshot } from "@/types/rds";
import { apiFetch } from "@/lib/api-client";

export default function RDSInstanceDetailsPage({
  params,
}: {
  params: { dbInstanceIdentifier: string };
}) {
  const router = useRouter();
  const [instance, setInstance] = useState<RDSInstance | null>(null);
  const [snapshots, setSnapshots] = useState<RDSDBSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);

  const fetchInstance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/rds");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const found = (data.instances || []).find(
        (i: RDSInstance) => i.DBInstanceIdentifier === params.dbInstanceIdentifier
      );
      if (!found) throw new Error("DB instance not found");
      setInstance(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load DB instance");
    }
    setLoading(false);
  }, [params.dbInstanceIdentifier]);

  const fetchSnapshots = useCallback(async () => {
    setLoadingSnapshots(true);
    try {
      const res = await apiFetch("/api/rds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeSnapshots", dbInstanceIdentifier: params.dbInstanceIdentifier }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to load snapshots");
      setSnapshots(data.snapshots || []);
    } catch {
      setSnapshots([]);
    }
    setLoadingSnapshots(false);
  }, [params.dbInstanceIdentifier]);

  useEffect(() => {
    fetchInstance();
    fetchSnapshots();
  }, [fetchInstance, fetchSnapshots]);

  const executeAction = useCallback(
    async (action: string, extra?: Record<string, unknown>) => {
      try {
        const res = await apiFetch("/api/rds", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            dbInstanceIdentifier: params.dbInstanceIdentifier,
            ...extra,
          }),
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || `Action ${action} failed`);
        fetchInstance();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : `Failed to ${action}`);
      }
    },
    [params.dbInstanceIdentifier, fetchInstance]
  );

  const isAvailable = instance?.DBInstanceStatus === "available";

  if (loading) {
    return (
      <div style={{ padding: "16px" }}>
        <SpaceBetween size="l">
          <Header variant="h1">DB Instance {params.dbInstanceIdentifier}</Header>
          <Box textAlign="center">
            <Spinner size="large" />
            <Box variant="p" padding={{ top: "s" }}>
              Loading DB instance details...
            </Box>
          </Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div style={{ padding: "16px" }}>
        <SpaceBetween size="l">
          <Header variant="h1">DB Instance {params.dbInstanceIdentifier}</Header>
          <Alert type="error">{error || "DB instance not found"}</Alert>
          <Button onClick={() => router.push("/rds")}>Back to RDS</Button>
        </SpaceBetween>
      </div>
    );
  }

  const overviewContent = (
    <Container header={<Header variant="h2">Overview</Header>}>
      <ColumnLayout columns={3} variant="default">
        <div>
          <Box variant="small" color="text-label">
            DB Instance Identifier
          </Box>
          <Box>{instance.DBInstanceIdentifier}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Status
          </Box>
          <StatusIndicator type={isAvailable ? "success" : "warning"}>
            {instance.DBInstanceStatus || "—"}
          </StatusIndicator>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Engine
          </Box>
          <Box>{instance.Engine || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            DB Instance Class
          </Box>
          <Box>{instance.DBInstanceClass || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Master Username
          </Box>
          <Box>{instance.MasterUsername || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            DB Name
          </Box>
          <Box>{instance.DBName || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Endpoint
          </Box>
          <Box>{instance.Endpoint?.Address || "—"}:{instance.Endpoint?.Port || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Multi-AZ
          </Box>
          <Box>{instance.MultiAZ ? "Yes" : "No"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Allocated Storage (GB)
          </Box>
          <Box>{instance.AllocatedStorage ? `${instance.AllocatedStorage}` : "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Storage Encrypted
          </Box>
          <Box>{instance.StorageEncrypted ? "Yes" : "No"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Created
          </Box>
          <Box>
            {instance.InstanceCreateTime ? new Date(instance.InstanceCreateTime).toLocaleString() : "—"}
          </Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Availability Zone
          </Box>
          <Box>{instance.AvailabilityZone || "—"}</Box>
        </div>
      </ColumnLayout>
    </Container>
  );

  const configurationContent = (
    <Container header={<Header variant="h2">Configuration</Header>}>
      <ColumnLayout columns={2} variant="default">
        <div>
          <Box variant="small" color="text-label">DB Instance Class</Box>
          <Box>{instance.DBInstanceClass || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Engine</Box>
          <Box>{instance.Engine || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Allocated Storage (GB)</Box>
          <Box>{instance.AllocatedStorage ? `${instance.AllocatedStorage}` : "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Multi-AZ</Box>
          <Box>{instance.MultiAZ ? "Yes" : "No"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Storage Encrypted</Box>
          <Box>{instance.StorageEncrypted ? "Yes" : "No"}</Box>
        </div>
      </ColumnLayout>
      <SpaceBetween size="m" direction="horizontal">
        <Button onClick={() => executeAction("modifyInstance", { DBInstanceClass: instance.DBInstanceClass })} formAction="none">
          Modify instance
        </Button>
      </SpaceBetween>
    </Container>
  );

  const tagsContent = (
    <Container header={<Header variant="h2">Tags</Header>}>
      {instance.Tags && instance.Tags.length > 0 ? (
        <Table
          columnDefinitions={[
            { header: "Key", cell: (item: { Key?: string; Value?: string }) => item.Key || "—" },
            { header: "Value", cell: (item: { Key?: string; Value?: string }) => item.Value || "—" },
          ]}
          items={instance.Tags}
          header={<Header variant="h3">Tags ({instance.Tags.length})</Header>}
        />
      ) : (
        <Box>No tags</Box>
      )}
    </Container>
  );

  const snapshotsContent = (
    <Container header={<Header variant="h2">DB Snapshots</Header>}>
      {loadingSnapshots ? (
        <Spinner />
      ) : snapshots.length > 0 ? (
        <Table
          columnDefinitions={[
            {
              header: "Snapshot Identifier",
              cell: (item: RDSDBSnapshot) => item.DBSnapshotIdentifier || "—",
            },
            { header: "Status", cell: (item: RDSDBSnapshot) => item.Status || "—" },
            {
              header: "Engine",
              cell: (item: RDSDBSnapshot) => item.Engine || "—",
            },
            {
              header: "Created",
              cell: (item: RDSDBSnapshot) =>
                item.SnapshotCreateTime ? new Date(item.SnapshotCreateTime).toLocaleString() : "—",
            },
          ]}
          items={snapshots}
          header={<Header variant="h3">Snapshots ({snapshots.length})</Header>}
        />
      ) : (
        <Box>No DB snapshots found.</Box>
      )}
    </Container>
  );

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              {isAvailable && (
                <Button onClick={() => executeAction("startInstance")} formAction="none">
                  Start
                </Button>
              )}
              {isAvailable && (
                <Button onClick={() => executeAction("stopInstance")} formAction="none">
                  Stop
                </Button>
              )}
              {isAvailable && (
                <Button onClick={() => executeAction("rebootInstance")} formAction="none">
                  Reboot
                </Button>
              )}
              <Button
                onClick={() =>
                  apiFetch("/api/rds", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "createSnapshot",
                      dbInstanceIdentifier: params.dbInstanceIdentifier,
                      snapshotIdentifier: `${params.dbInstanceIdentifier}-snap-${Date.now()}`,
                    }),
                  })
                    .then((r) => r.json())
                    .then((d) => {
                      if (d.error) throw new Error(d.error);
                      fetchSnapshots();
                    })
                    .catch((err) => setError(err instanceof Error ? err.message : "Snapshot creation failed"))
                }
                formAction="none"
              >
                Create snapshot
              </Button>
              <Button onClick={() => router.push("/rds")} formAction="none">
                Back to RDS
              </Button>
            </SpaceBetween>
          }
        >
          DB Instance {instance.DBInstanceIdentifier}
        </Header>

        <Tabs
          tabs={[
            { label: "Overview", id: "overview", content: overviewContent },
            { label: "Configuration", id: "configuration", content: configurationContent },
            { label: "Tags", id: "tags", content: tagsContent },
            { label: "Snapshots", id: "snapshots", content: snapshotsContent },
          ]}
        />
      </SpaceBetween>
    </div>
  );
}
