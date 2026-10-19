"use client";

/**
 * AdapterStatus Component — Shows adapter connection status.
 * Uses Cloudscape StatusIndicator exactly.
 */

import React, { useState, useEffect } from "react";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

export type AdapterConnectionStatus = "connected" | "disconnected" | "checking";

export interface AdapterStatusProps {
  readonly status?: AdapterConnectionStatus;
  readonly endpointUrl?: string;
}

export function AdapterStatus({
  status = "checking",
  endpointUrl,
}: AdapterStatusProps): React.ReactElement {
  const [currentStatus, setCurrentStatus] = useState<AdapterConnectionStatus>(status);
  const [provider, setProvider] = useState("checking");

  useEffect(() => {
    setCurrentStatus("checking");
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setCurrentStatus(
          data.status === "healthy"
            ? "connected"
            : data.status === "unreachable"
              ? "disconnected"
              : "checking",
        );
        setProvider(data.provider || "unknown");
      })
      .catch(() => setCurrentStatus("disconnected"));
  }, [endpointUrl]);

  const statusType =
    currentStatus === "connected"
      ? "success"
      : currentStatus === "disconnected"
        ? "warning"
        : "loading";
  const statusText =
    currentStatus === "connected"
      ? "Adapter Connected"
      : currentStatus === "disconnected"
        ? "Adapter Unreachable — start docker-compose"
        : "Checking adapter...";

  return (
    <div
      className="adapter-status-container"
      style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}
    >
      <StatusIndicator type={statusType}>{statusText}</StatusIndicator>
      {endpointUrl ? (
        <span style={{ fontSize: "12px", color: "var(--awsui-color-text-body-secondary)" }}>
          {endpointUrl} | Mode:{" "}
          {currentStatus === "connected"
            ? provider
            : currentStatus === "disconnected"
              ? "unreachable"
              : "checking"}
        </span>
      ) : null}
    </div>
  );
}
