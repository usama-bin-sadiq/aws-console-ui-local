"use client";

import React from "react";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Cards from "@cloudscape-design/components/cards";
import Alert from "@cloudscape-design/components/alert";

export type ResourceCount = {
  label: string;
  /** API route to read, relative to /api. */
  route: string;
  /** Dotted path to the array in the JSON response. */
  path: string;
};

type Props = {
  /** Human service name, e.g. "EC2". */
  serviceName: string;
  /**
   * Emulator service key(s) from the /api/health map, e.g. "ec2". The emulator
   * does not always use the AWS name - load balancing appears as "elb" and
   * "elbv2", not "elasticloadbalancing". Pass several to cover both; the first
   * key the emulator reports is used.
   */
  emulatorKey: string | string[];
  /** Real resources to count, read from the emulator. */
  counts?: ResourceCount[];
};

function readPath(obj: any, path: string): any {
  return path.split(".").reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

/**
 * Real, emulator-backed service overview.
 *
 * Replaces the old hardcoded cards that claimed "Operational (F-028)" and
 * "LocalStack (F-001)" while displaying no data at all. Those were internal
 * build notes leaked into the UI, and they named the wrong emulator: the stack
 * runs LocalEmu, not LocalStack.
 *
 * Everything here is read live: provider and service state come from
 * /api/health, resource counts come from each service's own route.
 */
export function ServiceStatusOverview({ serviceName, emulatorKey, counts = [] }: Props) {
  const [health, setHealth] = React.useState<{
    provider?: string;
    services?: Record<string, string>;
    region?: string;
  } | null>(null);
  const [provider, setProvider] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [results, setResults] = React.useState<Record<string, number | null>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const h = await fetch("/api/health").then((r) => r.json());
        if (!alive) return;
        setHealth(h);
        setProvider(h?.provider || "");
      } catch {
        if (alive) setProvider("unknown");
      }

      // Read each resource collection through the console's own API route.
      const entries = await Promise.all(
        counts.map(async (c) => {
          try {
            const res = await fetch(`/api/${c.route}`);
            if (!res.ok) return [c.route, null, `HTTP ${res.status}`] as const;
            const data = await res.json();
            const arr = readPath(data, c.path);
            if (!Array.isArray(arr)) return [c.route, null, "unexpected shape"] as const;
            return [c.route, arr.length, ""] as const;
          } catch (e) {
            return [c.route, null, String((e as Error).message).slice(0, 60)] as const;
          }
        }),
      );

      if (!alive) return;
      const nextCounts: Record<string, number | null> = {};
      const nextErrors: Record<string, string> = {};
      for (const [route, n, err] of entries) {
        nextCounts[route] = n;
        if (err) nextErrors[route] = err;
      }
      setResults(nextCounts);
      setErrors(nextErrors);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emulatorKey, counts.map((c) => c.route).join(",")]);

  const keys = Array.isArray(emulatorKey) ? emulatorKey : [emulatorKey];
  const found = keys.find((k) => health?.services?.[k]);
  const state: string = (found && health?.services?.[found]) || "unknown";
  const stateType = state === "running" ? "success" : state === "available" ? "info" : "warning";
  const stateLabel =
    state === "running"
      ? "Operational"
      : state === "available"
        ? "Available (not started)"
        : state === "unknown"
          ? "Not reported by emulator"
          : state;

  return (
    <SpaceBetween size="m" direction="vertical">
      <Container header={<Header variant="h2">Overview</Header>}>
        <Cards
          cardDefinition={{
            header: (item: any) => <Header variant="h3">{item.name}</Header>,
            sections: [{ id: "status", header: "Status", content: (item: any) => item.status }],
          }}
          items={[
            {
              name: "Service Status",
              status: loading ? (
                <StatusIndicator type="loading">Loading</StatusIndicator>
              ) : (
                <StatusIndicator
                  type={
                    stateType as
                      | "success"
                      | "info"
                      | "warning"
                      | "error"
                      | "stopped"
                      | "pending"
                      | "in-progress"
                      | "loading"
                      | "not-started"
                      | "log"
                  }
                >
                  {stateLabel}
                </StatusIndicator>
              ),
            },
            {
              name: "Adapter Mode",
              status: (
                <StatusIndicator type={provider === "unknown" ? "warning" : "info"}>
                  {provider || "Detecting"}
                </StatusIndicator>
              ),
            },
          ]}
          // The region is a plain value, not a status; render it without the
          // "Status" subheader the default card definition would add.
        />
      </Container>

      <Container header={<Header variant="h2">Resources</Header>}>
        <SpaceBetween size="xs">
          <Box variant="p">
            <SpaceBetween size="xs" direction="horizontal">
              <span>Region</span>
              <Box variant="code">{health?.region ?? "us-east-1"}</Box>
            </SpaceBetween>
          </Box>
        </SpaceBetween>
        {counts.length === 0 ? (
          <Box variant="p" color="text-body-secondary">
            This page does not expose a resource collection.
          </Box>
        ) : (
          <SpaceBetween size="s">
            {counts.map((c) => {
              const n = results[c.route];
              const err = errors[c.route];
              return (
                <Box key={`${c.route}:${c.label}`} variant="p">
                  <SpaceBetween size="xs" direction="horizontal">
                    <span>{c.label}</span>
                    {n == null ? (
                      <StatusIndicator type={err ? "error" : "loading"}>
                        {err ? "Unavailable" : "Loading"}
                      </StatusIndicator>
                    ) : (
                      <Box variant="code">{n}</Box>
                    )}
                  </SpaceBetween>
                </Box>
              );
            })}
            {Object.keys(errors).length > 0 && (
              <Alert type="info" header="Some collections are unavailable">
                {Object.entries(errors)
                  .map(([r, e]) => `${r}: ${e}`)
                  .join(", ")}
              </Alert>
            )}
          </SpaceBetween>
        )}
      </Container>
    </SpaceBetween>
  );
}

export default ServiceStatusOverview;
