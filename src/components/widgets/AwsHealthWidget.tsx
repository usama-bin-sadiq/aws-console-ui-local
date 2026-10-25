"use client";

import { useEffect, useState } from "react";
import Widget from "./Widget";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import SpaceBetween from "@cloudscape-design/components/space-between";

interface HealthData {
  provider: string;
  status: "healthy" | "warning" | "error";
  services: {
    name: string;
    status: "healthy" | "warning" | "error";
  }[];
}

export default function AwsHealthWidget({
  widgetId = "aws-health",
  isCustomizing,
  onResize,
  onRemove,
}: {
  widgetId?: string;
  isCustomizing?: boolean;
  onResize?: (widgetId: string, newSize: "regular" | "extended") => void;
  onRemove?: (widgetId: string) => void;
}) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch("/api/health");
        const data = await response.json();

        const providerStatus =
          data.status === "healthy"
            ? "healthy"
            : data.status === "unreachable"
              ? "error"
              : "warning";
        const services = Object.entries(data.services || {}).map(([name, value]) => ({
          name,
          status: value === true ? ("healthy" as const) : ("warning" as const),
        }));

        setHealth({
          provider: data.provider || "unknown",
          status: providerStatus as "healthy" | "warning" | "error",
          services,
        });
      } catch (error) {
        setHealth({
          provider: "unknown",
          status: "error",
          services: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  return (
    <Widget
      id="aws-health"
      widgetId={widgetId}
      title="AWS Health"
      isCustomizing={isCustomizing}
      onResize={onResize}
      onRemove={onRemove}
    >
      {loading ? (
        <Box textAlign="center" padding="l">
          <StatusIndicator type="loading">Loading health status...</StatusIndicator>
        </Box>
      ) : (
        <SpaceBetween size="m">
          <Box>
            <SpaceBetween size="xs">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--awsui-color-text-body-default)",
                  }}
                >
                  Provider Status
                </span>
                <StatusIndicator
                  type={
                    health?.status === "healthy"
                      ? "success"
                      : health?.status === "warning"
                        ? "warning"
                        : "error"
                  }
                >
                  {health?.provider.toUpperCase() || "Unknown"}
                </StatusIndicator>
              </div>
            </SpaceBetween>
          </Box>

          <Box>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--awsui-color-text-label)",
                marginBottom: "8px",
              }}
            >
              Service Health
            </div>
            <SpaceBetween size="xs">
              {health?.services.length ? (
                health.services.map((service) => (
                  <div
                    key={service.name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 0",
                      borderBottom: "1px solid var(--awsui-color-border-divider-default)",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        color: "var(--awsui-color-text-body-default)",
                      }}
                    >
                      {service.name}
                    </span>
                    <StatusIndicator
                      type={
                        service.status === "healthy"
                          ? "success"
                          : service.status === "warning"
                            ? "warning"
                            : "error"
                      }
                    >
                      {service.status === "healthy" ? "Operational" : "Issues detected"}
                    </StatusIndicator>
                  </div>
                ))
              ) : (
                <Box color="text-body-secondary">
                  No service health data returned by the active emulator.
                </Box>
              )}
            </SpaceBetween>
          </Box>

          <Box textAlign="center">
            <Box color="text-body-secondary">
              Health data is read directly from the active emulator.
            </Box>
          </Box>
        </SpaceBetween>
      )}
    </Widget>
  );
}
