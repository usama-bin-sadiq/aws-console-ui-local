"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Header,
  Container,
  Box,
  SpaceBetween,
  StatusIndicator,
  Table,
  Button,
  Alert,
  Badge,
  ExpandableSection,
} from "@cloudscape-design/components";
import {
  EmulatorHealthStatus,
  getAdapterStatusForMode,
  toAdapterMode,
} from "@/constants/service-compatibility";
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

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth[]>([]);
  const [filter, setFilter] = useState<"all" | "available" | "partial" | "unavailable" | "unknown">(
    "all",
  );

  const processServiceHealth = useCallback((data: HealthData) => {
    const activeMode = toAdapterMode(data.provider);
    const healthStatus = data.status;
    const healthServices = data.services || {};

    const services: ServiceHealth[] = SERVICE_REGISTRY.map((svc) => {
      const compatibility = getAdapterStatusForMode(svc, activeMode);
      const healthKeys = Object.keys(healthServices);
      const matchingHealthKey = healthKeys.find((key) => {
        const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
        return (
          normalizedKey === svc.routeDir.toLowerCase().replace(/[^a-z0-9]/g, "") ||
          normalizedKey === svc.serviceName.toLowerCase().replace(/[^a-z0-9]/g, "")
        );
      });
      const healthEnabled =
        matchingHealthKey === undefined
          ? false
          : healthServices[matchingHealthKey] === true ||
            healthServices[matchingHealthKey] === "available" ||
            healthServices[matchingHealthKey] === "healthy" ||
            healthServices[matchingHealthKey] === "running" ||
            healthServices[matchingHealthKey] === "true";

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
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      setHealth(data);
      processServiceHealth(data);
    } catch (err) {
      setHealth({
        status: "unreachable",
        provider: "unknown",
        endpoint: "",
        error: err instanceof Error ? err.message : "Failed to fetch",
      });
      setServiceHealth([]);
    } finally {
      setLoading(false);
    }
  }, [processServiceHealth]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchHealth();
    });
    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchHealth]);

  const filteredServices = serviceHealth.filter((s) => {
    if (filter === "all") return true;
    return s.status === filter;
  });

  const statusCounts = {
    available: serviceHealth.filter((s) => s.status === "available").length,
    partial: serviceHealth.filter((s) => s.status === "partial").length,
    unavailable: serviceHealth.filter((s) => s.status === "unavailable").length,
    unknown: serviceHealth.filter((s) => s.status === "unknown").length,
  };

  const getStatusType = (status: string) => {
    switch (status) {
      case "available":
        return "success" as const;
      case "partial":
        return "warning" as const;
      case "unavailable":
        return "error" as const;
      default:
        return "info" as const;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "available":
        return "Available";
      case "partial":
        return "Partial";
      case "unavailable":
        return "Unavailable";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1200px", paddingTop: "24px" }}>
        <Container>
          <Header variant="h1">Emulator Health</Header>
          <Box textAlign="center" padding="xxl">
            Loading health data...
          </Box>
        </Container>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", paddingTop: "24px" }}>
      <Container className="aws-table-card">
        <SpaceBetween size="l" direction="horizontal">
          <Header variant="h2">Emulator Health</Header>
          <SpaceBetween size="s" direction="horizontal">
            <Button
              onClick={fetchHealth}
              loading={loading}
              iconName="refresh"
              ariaLabel="Refresh health"
            >
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

        <SpaceBetween size="l" direction="vertical">
          {health && health.error && (
            <Alert type="error">
              <strong>Error:</strong> {health.error}
            </Alert>
          )}

          {/* Overview Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
            }}
          >
            <Container disableContentPaddings>
              <Box padding="l">
                <SpaceBetween size="s" direction="horizontal">
                  <SpaceBetween size="xxxs" direction="vertical">
                    <Box variant="strong" color="text-body-secondary">
                      Overall Status
                    </Box>
                    <StatusIndicator type={getStatusType(health?.status || "unknown")}>
                      {health?.status || "unknown"}
                    </StatusIndicator>
                  </SpaceBetween>
                  <Box textAlign="right">
                    <Box variant="strong" color="text-body-secondary">
                      Provider
                    </Box>
                    <Box variant="h2">{health?.provider?.toUpperCase() || "UNKNOWN"}</Box>
                  </Box>
                </SpaceBetween>
              </Box>
            </Container>

            <Container disableContentPaddings>
              <Box padding="l">
                <Box variant="strong" color="text-body-secondary">
                  Endpoint
                </Box>
                <div style={{ wordBreak: "break-all", marginTop: "4px" }}>
                  <Box variant="code">{health?.endpoint || "—"}</Box>
                </div>
              </Box>
            </Container>

            <Container disableContentPaddings>
              <Box padding="l">
                <Box variant="strong" color="text-body-secondary">
                  Edition
                </Box>
                <Box variant="h2" margin={{ top: "xxxs" }}>
                  {health?.edition || "—"}
                </Box>
              </Box>
            </Container>

            <Container disableContentPaddings>
              <Box padding="l">
                <Box variant="strong" color="text-body-secondary">
                  Readiness
                </Box>
                <Box variant="h2" margin={{ top: "xxxs" }}>
                  {capitalize(health?.readiness || "—")}
                </Box>
              </Box>
            </Container>
          </div>

          {/* Status Summary */}
          <Container disableContentPaddings>
            <Box padding="l">
              <Header variant="h3">Service Capability Summary</Header>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                <Badge color="green">✅ Available: {statusCounts.available}</Badge>
                <Badge color="severity-high">⚠️ Partial: {statusCounts.partial}</Badge>
                <Badge color="red">❌ Unavailable: {statusCounts.unavailable}</Badge>
                <Badge color="blue">❓ Unknown: {statusCounts.unknown}</Badge>
                <Badge>Total: {serviceHealth.length}</Badge>
              </div>
            </Box>
          </Container>

          {/* Filter Tabs */}
          <Container disableContentPaddings>
            <Box padding="l">
              <SpaceBetween size="m" direction="horizontal">
                <Box variant="strong" color="text-body-secondary">
                  Filter:
                </Box>
                <SpaceBetween size="xs" direction="horizontal">
                  {["all", "available", "partial", "unavailable", "unknown"].map((f) => (
                    <Button
                      key={f}
                      variant={filter === f ? "primary" : "link"}
                      onClick={() => setFilter(f as typeof filter)}
                    >
                      {capitalize(f)} ({statusCounts[f as keyof typeof statusCounts]})
                    </Button>
                  ))}
                </SpaceBetween>
              </SpaceBetween>
            </Box>
          </Container>

          {/* Service Table */}
          <Container disableContentPaddings>
            <Box padding="l">
              <Header variant="h3">Service Capabilities ({filteredServices.length})</Header>
              <Table
                items={filteredServices}
                columnDefinitions={[
                  {
                    id: "serviceName",
                    header: "Service",
                    cell: (item) => (
                      <Box>
                        <Box variant="strong">{item.serviceName}</Box>
                        <Box variant="code" fontSize="body-s" color="text-body-secondary">
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
                      <div style={{ maxWidth: "400px" }}>
                        <Box fontSize="body-s" color="text-body-secondary">
                          {item.reason}
                        </Box>
                      </div>
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
          </Container>

          {/* Raw Health Data */}
          <ExpandableSection header="Raw Health Response" defaultExpanded={false}>
            <div
              style={{
                background: "#f6f8fa",
                borderRadius: "4px",
                overflow: "auto",
                maxHeight: "400px",
              }}
            >
              <Box padding="m" fontSize="body-s">
                <pre>{JSON.stringify(health, null, 2)}</pre>
              </Box>
            </div>
          </ExpandableSection>
        </SpaceBetween>
      </Container>
    </div>
  );
}
