"use client";

import React, { useEffect, useState } from "react";
import {
  Header,
  Container,
  Box,
  Card,
  SpaceBetween,
  StatusIndicator,
  Table,
  Button,
  Alert,
  Badge,
  ColumnLayout,
  ExpandableSection,
  Divider,
} from "@cloudscape-design/components";
import { AdapterMode, EmulatorHealthStatus } from "@/constants/service-compatibility";
import { SERVICE_REGISTRY } from "@/constants/service-compatibility";

interface HealthData {
  status: EmulatorHealthStatus;
  provider: string;
  endpoint: string;
  edition?: string;
  readiness?: string;
  services?: Record<string, unknown>;
  error?: string;
}

interface ServiceHealth {
  serviceKey: string;
  serviceName: string;
  status: string;
  enabled: boolean;
  reason: string;
  category: string;
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [filter, setFilter] = useState<"all" | "available" | "partial" | "unavailable" | "unknown">("all");

  const fetchHealth = async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
      processServiceHealth(data);
    } catch (err) {
      setHealth({ status: "unreachable", provider: "unknown", endpoint: "", error: err instanceof Error ? err.message : "Failed to fetch" });
      setServiceHealth([]);
    } finally {
      setLoading(false);
    }
  };

  const processServiceHealth = (data: HealthData) => {
    const activeMode = data.provider === "ministack" ? AdapterMode.MINSTACK : AdapterMode.LOCALSTACK;
    const healthStatus = data.status;
    const healthServices = data.services || {};

    const services: ServiceHealth[] = SERVICE_REGISTRY.map((svc) => {
      const compatibility = activeMode === AdapterMode.MINSTACK ? svc.adapterStatusMinStack : svc.adapterStatusLocalStack;
      const healthKeys = Object.keys(healthServices);
      const matchingHealthKey = healthKeys.find((key) => {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
        return normalizedKey === svc.routeDir.toLowerCase().replace(/[^a-z0-9]/g, '')
          || normalizedKey === svc.serviceName.toLowerCase().replace(/[^a-z0-9]/g, '');
      });
      const healthEnabled = matchingHealthKey === undefined ? false : 
        (healthServices[matchingHealthKey] === true || healthServices[matchingHealthKey] === "available" || healthServices[matchingHealthKey] === "healthy" || healthServices[matchingHealthKey] === "running" || healthServices[matchingHealthKey] === "true");

      let status: "available" | "partial" | "unavailable" | "unknown" = "unknown";
      let enabled = false;
      let reason = "";

      if (healthStatus === "unreachable") {
        status = "unavailable";
        enabled = false;
        reason = "The emulator endpoint is unreachable.";
      } else if (matchingHealthKey === undefined) {
        status = "unknown";
        enabled = false;
        reason = "The emulator has not reported this service capability.";
      } else if (healthStatus === "healthy" && !healthEnabled) {
        status = "unavailable";
        enabled = false;
        reason = "The emulator reports this service as unavailable.";
      } else if (compatibility === "not-supported") {
        status = "unavailable";
        enabled = false;
        reason = `${activeMode} does not support this service.`;
      } else if (compatibility === "partial") {
        status = "partial";
        enabled = healthEnabled;
        reason = `${activeMode} provides partial support for this service.`;
      } else {
        status = "available";
        enabled = healthEnabled;
        reason = "Service is enabled by the active emulator.";
      }

      return {
        serviceKey: svc.routeDir,
        serviceName: svc.serviceName,
        status,
        enabled,
        reason,
        category: svc.commonDifferentNote.split(" ")[0] || "Other",
      };
    });

    setServiceHealth(services);
  };

  useEffect(() => {
    fetchHealth();
    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const filteredServices = serviceHealth.filter((s) => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  const statusCounts = {
    available: serviceHealth.filter(s => s.status === "available").length,
    partial: serviceHealth.filter(s => s.status === "partial").length,
    unavailable: serviceHealth.filter(s => s.status === "unavailable").length,
    unknown: serviceHealth.filter(s => s.status === "unknown").length,
  };

  const getStatusType = (status: string) => {
    switch (status) {
      case "available": return "success" as const;
      case "partial": return "warning" as const;
      case "unavailable": return "error" as const;
      default: return "info" as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available": return "Available";
      case "partial": return "Partial";
      case "unavailable": return "Unavailable";
      default: return "Unknown";
    }
  };

  if (loading) {
    return (
      <Container style={{ maxWidth: "1200px", paddingTop: "24px" }}>
        <Header variant="h1">Emulator Health</Header>
        <Box textAlign="center" padding="xxl">Loading health data...</Box>
      </Container>
    );
  }

  return (
    <Container style={{ maxWidth: "1200px", paddingTop: "24px" }}>
      <SpaceBetween size="l" direction="horizontal">
        <Header variant="h1">Emulator Health</Header>
        <SpaceBetween size="s" direction="horizontal">
          <Button onClick={fetchHealth} loading={loading} iconName="refresh" ariaLabel="Refresh health">
            Refresh
          </Button>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <span>Auto-refresh (30s)</span>
          </label>
        </SpaceBetween>
      </SpaceBetween>

      {health && health.error && (
        <Alert type="error" marginBottom="l">
          <strong>Error:</strong> {health.error}
        </Alert>
      )}

      <SpaceBetween size="l" direction="vertical">
        {/* Overview Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
          <Card>
            <Box padding="l">
              <SpaceBetween size="s" direction="horizontal">
                <Box>
                  <Box variant="strong" color="text-body-secondary">Overall Status</Box>
                  <StatusIndicator type={getStatusType(health?.status || "unknown")} style={{ marginTop: "4px" }}>
                    {health?.status || "unknown"}
                  </StatusIndicator>
                </Box>
                <Box textAlign="right">
                  <Box variant="strong" color="text-body-secondary">Provider</Box>
                  <Box variant="h2">{health?.provider?.toUpperCase() || "UNKNOWN"}</Box>
                </Box>
              </SpaceBetween>
            </Box>
          </Card>

          <Card>
            <Box padding="l">
              <Box variant="strong" color="text-body-secondary">Endpoint</Box>
              <Box variant="body-m" fontFamily="monospace" style={{ wordBreak: "break-all", marginTop: "4px" }}>
                {health?.endpoint || "—"}
              </Box>
            </Box>
          </Card>

          <Card>
            <Box padding="l">
              <Box variant="strong" color="text-body-secondary">Edition</Box>
              <Box variant="h2" style={{ marginTop: "4px" }}>{health?.edition || "—"}</Box>
            </Box>
          </Card>

          <Card>
            <Box padding="l">
              <Box variant="strong" color="text-body-secondary">Readiness</Box>
              <Box variant="h2" style={{ marginTop: "4px", textTransform: "capitalize" }}>{health?.readiness || "—"}</Box>
            </Box>
          </Card>
        </div>

        {/* Status Summary */}
        <Card>
          <Box padding="l">
            <Header variant="h3">Service Capability Summary</Header>
            <SpaceBetween size="m" direction="horizontal" style={{ flexWrap: "wrap", gap: "12px" }}>
              <Badge variant="success" style={{ fontSize: "14px" }}>
                ✅ Available: {statusCounts.available}
              </Badge>
              <Badge variant="warning" style={{ fontSize: "14px" }}>
                ⚠️ Partial: {statusCounts.partial}
              </Badge>
              <Badge variant="error" style={{ fontSize: "14px" }}>
                ❌ Unavailable: {statusCounts.unavailable}
              </Badge>
              <Badge variant="info" style={{ fontSize: "14px" }}>
                ❓ Unknown: {statusCounts.unknown}
              </Badge>
              <Badge style={{ fontSize: "14px" }}>
                Total: {serviceHealth.length}
              </Badge>
            </SpaceBetween>
          </Box>
        </Card>

        {/* Filter Tabs */}
        <Card>
          <Box padding="l">
            <SpaceBetween size="m" direction="horizontal">
              <Box variant="strong" color="text-body-secondary">Filter:</Box>
              <SpaceBetween size="xs" direction="horizontal">
                {["all", "available", "partial", "unavailable", "unknown"].map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "primary" : "link"}
                    onClick={() => setFilter(f as typeof filter)}
                    style={{ textTransform: "capitalize" }}
                  >
                    {f} ({statusCounts[f as keyof typeof statusCounts]})
                  </Button>
                ))}
              </SpaceBetween>
            </SpaceBetween>
          </Box>
        </Card>

        {/* Service Table */}
        <Card>
          <Box padding="l">
            <Header variant="h3">Service Capabilities ({filteredServices.length})</Header>
            <Table
              items={filteredServices}
              selectionType="none"
              columnDefinitions={[
                {
                  id: "serviceName",
                  header: "Service",
                  cell: (item) => (
                    <Box>
                      <Box variant="strong">{item.serviceName}</Box>
                      <Box variant="body-s" color="text-body-secondary" fontFamily="monospace">
                        {item.serviceKey}
                      </Box>
                    </Box>
                  ),
                },
                {
                  id: "category",
                  header: "Category",
                  cell: (item) => item.category,
                },
                {
                  id: "status",
                  header: "Status",
                  cell: (item) => (
                    <StatusIndicator type={getStatusType(item.status)}>
                      {getStatusLabel(item.status)}
                    </StatusIndicator>
                  ),
                },
                {
                  id: "enabled",
                  header: "Enabled",
                  cell: (item) => (
                    <StatusIndicator type={item.enabled ? "success" : "error"}>
                      {item.enabled ? "Yes" : "No"}
                    </StatusIndicator>
                  ),
                },
                {
                  id: "reason",
                  header: "Reason / Details",
                  cell: (item) => (
                    <Box variant="body-s" color="text-body-secondary" style={{ maxWidth: "400px" }}>
                      {item.reason}
                    </Box>
                  ),
                },
              ]}
              empty={
                <Box textAlign="center" padding="l" color="text-body-secondary">
                  No services match the current filter.
                </Box>
              }
            />
          </Box>
        </Card>

        {/* Raw Health Data */}
        <ExpandableSection header="Raw Health Response" defaultExpanded={false}>
          <Box padding="m" fontFamily="monospace" fontSize="body-s" style={{ background: "#f6f8fa", borderRadius: "4px", overflow: "auto", maxHeight: "400px" }}>
            <pre>{JSON.stringify(health, null, 2)}</pre>
          </Box>
        </ExpandableSection>
      </SpaceBetween>
    </Container>
  );
}