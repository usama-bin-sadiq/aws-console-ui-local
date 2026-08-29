"use client";

import React, { useEffect, useState } from "react";
import Widget from "./Widget";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Link from "@cloudscape-design/components/link";

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
          data.provider === "localstack" || data.provider === "ministack"
            ? "healthy"
            : "warning";

        setHealth({
          provider: data.provider || "unknown",
          status: providerStatus as "healthy" | "warning" | "error",
          services: [
            { name: "S3", status: "healthy" },
            { name: "EC2", status: "healthy" },
            { name: "Lambda", status: "healthy" },
            { name: "DynamoDB", status: "healthy" },
          ],
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
      actions={
        <Link fontSize="body-s" href="#">
          View all
        </Link>
      }
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
              {health?.services.map((service) => (
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
              ))}
            </SpaceBetween>
          </Box>

          <Box textAlign="center">
            <Link fontSize="body-s" href="#">
              View service health dashboard
            </Link>
          </Box>
        </SpaceBetween>
      )}
    </Widget>
  );
}
