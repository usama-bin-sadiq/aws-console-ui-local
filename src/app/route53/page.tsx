"use client";
import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Cards from "@cloudscape-design/components/cards";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Alert from "@cloudscape-design/components/alert";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { AWACS_DESIGN_TOKENS } from "@/constants/design-tokens";

interface Route53Zone {
  Id?: string;
  Name?: string;
  records?: Array<{ Name?: string; Type?: string; TTL?: number; ResourceRecords?: Array<{ Value?: string }> }>
}

interface Route53HealthCheck {
  Id?: string;
  HealthCheckConfig?: { IPAddress?: string; Port?: number; Type?: string; ResourcePath?: string; FullyQualifiedDomainName?: string };
}

export default function Page() {
  const [zones, setZones] = useState<Route53Zone[]>([]);
  const [healthChecks, setHealthChecks] = useState<Route53HealthCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const zonesRes = await fetch("/api/route53");
      const zonesData = await zonesRes.json();
      if (zonesData.error) throw new Error(zonesData.error);
      setZones(zonesData.zones || []);

      const healthRes = await fetch("/api/route53?healthOnly=true");
      const healthData = await healthRes.json();
      if (healthData.error) throw new Error(healthData.error);
      setHealthChecks(healthData.healthChecks || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ServiceLayout
      serviceName="Amazon Route 53"
      serviceCategory="Networking"
      breadcrumbs={[{ text: "Services", href: "/" }, { text: "Route 53", href: "/route53" }]}
    >
      <SpaceBetween size="m" direction="vertical">
        <Container header={<Header variant="h2">Overview</Header>}>
          <Cards
            cardDefinition={{
              header: (item: any) => <Header variant="h3">{item.name}</Header>,
              sections: [{ id: "status", header: "Status", content: (item: any) => item.status }],
            }}
            items={[
              { name: "Service Status", status: <StatusIndicator type="success">Operational (F-028)</StatusIndicator> },
              { name: "Adapter Mode", status: <StatusIndicator type="info">LocalStack (F-001)</StatusIndicator> },
              { name: "SDK Client", status: <StatusIndicator type="info">Adapter SDK route53 (F-003)</StatusIndicator> },
            ]}
          />
        </Container>

        {error && <Alert type="error" header="Error">{error}</Alert>}

        <Container header={<Header variant="h2">Hosted Zones</Header>}>
          <SpaceBetween size="s" direction="vertical">
            <Button onClick={() => fetchData()}>Refresh zones</Button>
            <Table
              items={zones}
              loading={loading}
              columnDefinitions={[
                { header: "Zone ID", cell: (item) => item.Id || "—" },
                { header: "Name", cell: (item) => item.Name || "—" },
                { header: "Record Count", cell: (item) => (item.records ? item.records.length : 0).toString() },
              ]}
              empty={<Box textAlign="center">No hosted zones found.</Box>}
            />
          </SpaceBetween>
        </Container>

        <Container header={<Header variant="h2">Health Checks</Header>}>
          <Table
            items={healthChecks}
            loading={loading}
            columnDefinitions={[
              { header: "Health Check ID", cell: (item) => item.Id || "—" },
              { header: "Type", cell: (item) => item.HealthCheckConfig?.Type || "—" },
              { header: "IP Address", cell: (item) => item.HealthCheckConfig?.IPAddress || "—" },
              { header: "FQDN", cell: (item) => item.HealthCheckConfig?.FullyQualifiedDomainName || "—" },
            ]}
            empty={<Box textAlign="center">No health checks found.</Box>}
          />
        </Container>

        <Container header={<Header variant="h2">Adapter SDK Usage</Header>}>
          <Box style={{ padding: AWACS_DESIGN_TOKENS.spacing.m, color: AWACS_DESIGN_TOKENS.colors.textSecondary }}>
            This console uses adapter SDK clients ({" "}
            <code>route53</code> from{" "}
            <code>@/lib/aws-clients</code>) for all actions. APIs include{" "}
            <code>ListHostedZonesCommand</code>,{" "}
            <code>ChangeResourceRecordSetsCommand</code>,{" "}
            <code>CreateHealthCheckCommand</code>,{" "}
            <code>UpdateHealthCheckCommand</code>,{" "}
            <code>DeleteHealthCheckCommand</code>,{" "}
            <code>CreateHostedZoneCommand</code>,{" "}
            <code>DeleteHostedZoneCommand</code>,{" "}
            and <code>ListHealthChecksCommand</code> via adapter endpoint resolution and dummy credentials.
          </Box>
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
