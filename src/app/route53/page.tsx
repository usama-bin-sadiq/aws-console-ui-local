"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Cards from "@cloudscape-design/components/cards";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import { apiFetch } from "@/lib/api-client";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { AWACS_DESIGN_TOKENS } from "@/constants/design-tokens";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface Route53Zone {
  Id?: string;
  Name?: string;
  records?: Array<{
    Name?: string;
    Type?: string;
    TTL?: number;
    ResourceRecords?: Array<{ Value?: string }>;
  }>;
}

interface Route53HealthCheck {
  Id?: string;
  HealthCheckConfig?: {
    IPAddress?: string;
    Port?: number;
    Type?: string;
    ResourcePath?: string;
    FullyQualifiedDomainName?: string;
  };
}

// Normalize list payloads: a bare array or a wrapper object with an array under
// a known key (including the Cloudscape/AWS-cased `HostedZones`). Anything else renders [].
function toArray<T = Record<string, unknown>>(d: unknown): T[] {
  if (Array.isArray(d)) return d as T[];
  if (d && typeof d === "object") {
    const o = d as Record<string, unknown>;
    for (const k of [
      "zones",
      "hostedZones",
      "HostedZones",
      "healthChecks",
      "items",
      "data",
      "results",
    ]) {
      if (Array.isArray(o[k])) return o[k] as T[];
    }
  }
  return [];
}

export default function Page() {
  const [zones, setZones] = useState<Route53Zone[]>([]);
  const [healthChecks, setHealthChecks] = useState<Route53HealthCheck[]>([]);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ zoneId: string; zoneName: string } | null>(null);
  // Live emulator state, so the overview cards report what is actually running.
  const [provider, setProvider] = useState<string>("");
  const [route53State, setRoute53State] = useState<string>("");

  useEffect(() => {
    let alive = true;
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        setProvider(d?.provider || "");
        setRoute53State(d?.services?.route53 || "");
      })
      .catch(() => {
        if (alive) setRoute53State("unknown");
      });
    return () => {
      alive = false;
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const zonesRes = await fetch("/api/route53");
      const zonesData = await zonesRes.json().catch(() => null);
      if (zonesData === null) throw new Error(`Invalid response (HTTP ${zonesRes.status})`);
      if (!zonesRes.ok || zonesData.error) {
        throw new Error(zonesData.message || zonesData.error || `HTTP ${zonesRes.status}`);
      }
      setZones(toArray<Route53Zone>(zonesData));

      const healthRes = await fetch("/api/route53?healthOnly=true");
      const healthData = await healthRes.json().catch(() => null);
      if (healthData === null) throw new Error(`Invalid response (HTTP ${healthRes.status})`);
      if (!healthRes.ok || healthData.error) {
        throw new Error(healthData.message || healthData.error || `HTTP ${healthRes.status}`);
      }
      setHealthChecks(toArray<Route53HealthCheck>(healthData));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const deleteHostedZone = (zoneId: string) => {
    apiFetch("/api/route53", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteZone", hostedZoneId: zoneId }),
    })
      .then(async (res: Response) => {
        if (!res.ok) throw new Error("Failed to delete hosted zone");
        setDeleteModal(null);
        fetchData();
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to delete hosted zone");
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ServiceLayout
      serviceName="Amazon Route 53"
      showServiceHeader={false}
      serviceCategory="Networking"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Route 53", href: "/route53" },
      ]}
    >
      <SpaceBetween size="m" direction="vertical">
        <AwsServiceHeader
          serviceName="Route 53"
          serviceIcon={SERVICE_ICONS["/route53"]?.small}
          counter={zones.length}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/route53/create")}
            >
              Create hosted zone
            </button>
          }
        />
        <Container>
          <Cards
            cardDefinition={{
              header: (item: any) => <Header variant="h3">{item.name}</Header>,
              sections: [{ id: "status", header: "Status", content: (item: any) => item.status }],
            }}
            items={[
              {
                name: "Service Status",
                // Live from /api/health. The previous hardcoded value read
                // "Operational (F-028)" and leaked an internal build ID.
                status: (
                  <StatusIndicator type={route53State === "running" ? "success" : "info"}>
                    {route53State === "running" ? "Operational" : route53State}
                  </StatusIndicator>
                ),
              },
              {
                name: "Adapter Mode",
                // The stack runs LocalEmu, so reporting "LocalStack" was wrong.
                status: (
                  <StatusIndicator type={provider === "unknown" ? "warning" : "info"}>
                    {provider || "Detecting"}
                  </StatusIndicator>
                ),
              },
            ]}
          />
        </Container>

        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}

        <Container className="aws-table-card" header={<Header variant="h2">Hosted Zones</Header>}>
          <SpaceBetween size="s" direction="vertical">
            <Button onClick={() => fetchData()}>Refresh zones</Button>
            <Table
              items={zones}
              loading={loading}
              columnDefinitions={[
                { header: "Zone ID", cell: (item) => item.Id || "—" },
                { header: "Name", cell: (item) => item.Name || "—" },
                {
                  header: "Record Count",
                  cell: (item) => (item.records ? item.records.length : 0).toString(),
                },
                {
                  header: "Actions",
                  cell: (item) => (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button
                        variant="inline-link"
                        onClick={() => {
                          if (item.Id && item.Name) {
                            setDeleteModal({ zoneId: item.Id, zoneName: item.Name });
                          }
                        }}
                        formAction="none"
                      >
                        Delete
                      </Button>
                    </SpaceBetween>
                  ),
                },
              ]}
              empty={<Box textAlign="center">No hosted zones found.</Box>}
            />
          </SpaceBetween>
        </Container>

        <Container className="aws-table-card" header={<Header variant="h2">Health Checks</Header>}>
          <Table
            items={healthChecks}
            loading={loading}
            columnDefinitions={[
              { header: "Health Check ID", cell: (item) => item.Id || "—" },
              { header: "Type", cell: (item) => item.HealthCheckConfig?.Type || "—" },
              { header: "IP Address", cell: (item) => item.HealthCheckConfig?.IPAddress || "—" },
              {
                header: "FQDN",
                cell: (item) => item.HealthCheckConfig?.FullyQualifiedDomainName || "—",
              },
            ]}
            empty={<Box textAlign="center">No health checks found.</Box>}
          />
        </Container>

        <Container header={<Header variant="h2">Adapter SDK Usage</Header>}>
          <Box padding="m" color="text-body-secondary">
            This console uses adapter SDK clients ( <code>route53</code> from{" "}
            <code>@/lib/aws-clients</code>) for all actions. APIs include{" "}
            <code>ListHostedZonesCommand</code>, <code>ChangeResourceRecordSetsCommand</code>,{" "}
            <code>CreateHealthCheckCommand</code>, <code>UpdateHealthCheckCommand</code>,{" "}
            <code>DeleteHealthCheckCommand</code>, <code>CreateHostedZoneCommand</code>,{" "}
            <code>DeleteHostedZoneCommand</code>, and <code>ListHealthChecksCommand</code> via
            adapter endpoint resolution and dummy credentials.
          </Box>
        </Container>
      </SpaceBetween>

        {deleteModal && (
          <Modal
            visible
            onDismiss={() => setDeleteModal(null)}
            header="Delete hosted zone"
            footer={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setDeleteModal(null)}>Cancel</Button>
                <Button variant="primary" onClick={() => deleteHostedZone(deleteModal.zoneId)}>
                  Delete
                </Button>
              </SpaceBetween>
            }
          >
            <Box variant="p">
              Are you sure you want to delete the hosted zone{" "}
              <strong>{deleteModal.zoneName}</strong>?
            </Box>
          </Modal>
        )}
      </ServiceLayout>
  );
}
