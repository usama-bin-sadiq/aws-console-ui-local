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
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";
import { apiFetch } from "@/lib/api-client";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";

interface HostedZone {
  Id: string;
  Name: string;
  ResourceRecordSetCount?: number;
  Config?: { PrivateZone?: boolean };
  Comment?: string;
}

interface RecordSet {
  Name: string;
  Type: string;
  TTL?: number;
  ResourceRecords?: Array<{ Value?: string }>;
  AliasTarget?: { DNSName?: string; EvaluateTargetHealth?: boolean };
}

export default function Route53ZoneDetailPage({
  params,
}: {
  params: Promise<{ hostedZoneId: string }>;
}) {
  const router = useRouter();
  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<RecordSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoneId, setZoneId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setZoneId(p.hostedZoneId));
  }, [params]);

  const fetchZone = useCallback(async () => {
    if (!zoneId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/route53");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const found = (data.zones || []).find((z: any) => z.Id === zoneId);
      if (!found) throw new Error(`Hosted zone "${zoneId}" not found`);
      setZone(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load hosted zone");
    } finally {
      setLoading(false);
    }
  }, [zoneId]);

  const fetchRecords = useCallback(async () => {
    if (!zoneId) return;
    try {
      const res = await apiFetch(
        `/api/route53?action=listRecords&hostedZoneId=${encodeURIComponent(zoneId)}`,
      );
      if (!res.ok) throw new Error("Failed to fetch records");
      const data = await res.json();
      setRecords(data.ResourceRecordSets || []);
    } catch {
      setRecords([]);
    }
  }, [zoneId]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchZone();
    });
  }, [fetchZone]);

  useEffect(() => {
    if (zone) {
      queueMicrotask(() => {
        fetchRecords();
      });
    }
  }, [zone, fetchRecords]);

  const zoneName = zone?.Name || zoneId || "";
  const isPrivate = zone?.Config?.PrivateZone === true;

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Hosted Zone {zoneId || "Loading..."}</Header>
          <Box textAlign="center">Loading hosted zone details...</Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !zone) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Hosted Zone {zoneId || "Loading..."}</Header>
          <Alert type="error">{error || "Hosted zone not found"}</Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={fetchZone}>Refresh</Button>
            <Button onClick={() => router.push("/route53")}>Back to Route 53</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Route 53"
          serviceIcon={SERVICE_ICONS["/route53"]?.small}
          counter={1}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/route53/create")}
            >
              Create Hosted Zone
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
                  Hosted Zone ID
                </Box>
                <Box>{zone.Id}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Domain Name
                </Box>
                <Box>{zone.Name}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Type
                </Box>
                <Box>{isPrivate ? "Private" : "Public"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Record Count
                </Box>
                <Box>{zone.ResourceRecordSetCount || 0}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Comment
                </Box>
                <Box>{zone.Comment || "—"}</Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>

        <Container
          className="aws-table-card"
          header={<Header variant="h2">Record Sets ({records.length})</Header>}
        >
          <SpaceBetween size="m">
            <Table
              items={records}
              columnDefinitions={[
                { id: "name", header: "Name", cell: (item: any) => item.Name, isRowHeader: true },
                { id: "type", header: "Type", cell: (item: any) => item.Type },
                { id: "ttl", header: "TTL", cell: (item: any) => item.TTL || "—" },
                {
                  id: "value",
                  header: "Value",
                  cell: (item: any) =>
                    item.ResourceRecords?.[0]?.Value || item.AliasTarget?.DNSName || "—",
                },
              ]}
              empty={<Box textAlign="center">No record sets found.</Box>}
            />
          </SpaceBetween>
        </Container>

        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/route53"] || []} />
      </SpaceBetween>
    </div>
  );
}
