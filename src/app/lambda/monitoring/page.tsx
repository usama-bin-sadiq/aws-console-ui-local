"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Grid from "@cloudscape-design/components/grid";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Table from "@cloudscape-design/components/table";
import type { TableProps } from "@cloudscape-design/components/table";
import { apiFetch } from "@/lib/api-client";
import { MetricTile } from "@/components/MetricTile";

/**
 * Lambda monitoring.
 *
 * Reads the three things AWS shows on its Lambda Monitoring tab: the metrics
 * published in the AWS/Lambda namespace, the alarms defined on those metrics,
 * and the /aws/lambda execution log groups. All three come from the running
 * emulator through the CloudWatch API, so nothing here is hard-coded.
 */
const NAMESPACE = "AWS/Lambda";
const LOG_GROUP_PREFIX = "/aws/lambda/";

interface LambdaMetric {
  MetricName?: string;
  Namespace?: string;
  Dimensions?: { Name?: string; Value?: string }[];
}

interface LambdaAlarm {
  AlarmName?: string;
  MetricName?: string;
  StateValue?: string;
  StateReason?: string;
}

interface LambdaLogGroup {
  logGroupName?: string;
  storedBytes?: number;
  retentionInDays?: number;
}

const statGrid = [{ colspan: 4 }, { colspan: 4 }, { colspan: 4 }];

export default function LambdaMonitoringPage() {
  const [metrics, setMetrics] = useState<LambdaMetric[]>([]);
  const [alarms, setAlarms] = useState<LambdaAlarm[]>([]);
  const [logGroups, setLogGroups] = useState<LambdaLogGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitoring = useCallback(async () => {
    setLoading(true);
    setError(null);
    const problems: string[] = [];
    try {
      const [metricsRes, alarmsRes, logsRes] = await Promise.all([
        apiFetch(`/api/cloudwatch?action=listMetrics&namespace=${encodeURIComponent(NAMESPACE)}`),
        apiFetch("/api/cloudwatch?action=describeAlarms"),
        apiFetch(
          `/api/cloudwatch?action=describeLogGroups&logGroupNamePrefix=${encodeURIComponent(LOG_GROUP_PREFIX)}`,
        ),
      ]);

      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics((data.metrics || []) as LambdaMetric[]);
      } else {
        problems.push(`Metrics unavailable (HTTP ${metricsRes.status}).`);
      }

      if (alarmsRes.ok) {
        const data = await alarmsRes.json();
        setAlarms((data.alarms || []) as LambdaAlarm[]);
      } else {
        problems.push(`Alarms unavailable (HTTP ${alarmsRes.status}).`);
      }

      if (logsRes.ok) {
        const data = await logsRes.json();
        setLogGroups((data.logGroups || []) as LambdaLogGroup[]);
      } else {
        problems.push(`Log groups unavailable (HTTP ${logsRes.status}).`);
      }

      setError(problems.length > 0 ? problems.join(" ") : null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch monitoring data");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMonitoring();
  }, [fetchMonitoring]);

  const metricColumns: TableProps.ColumnDefinition<LambdaMetric>[] = [
    {
      id: "metric",
      header: "Metric",
      cell: (item) => item.MetricName ?? "—",
      sortingField: "MetricName",
    },
    {
      id: "dimensions",
      header: "Dimensions",
      cell: (item) =>
        (item.Dimensions || []).length === 0
          ? "—"
          : (item.Dimensions || [])
              .map((dimension) => `${dimension.Name}=${dimension.Value}`)
              .join(", "),
    },
  ];

  const alarmColumns: TableProps.ColumnDefinition<LambdaAlarm>[] = [
    {
      id: "alarm",
      header: "Alarm",
      cell: (item) => item.AlarmName ?? "—",
      sortingField: "AlarmName",
    },
    { id: "metric", header: "Metric", cell: (item) => item.MetricName ?? "—" },
    {
      id: "state",
      header: "State",
      cell: (item) => item.StateValue ?? "—",
    },
  ];

  const logGroupColumns: TableProps.ColumnDefinition<LambdaLogGroup>[] = [
    {
      id: "group",
      header: "Log group",
      cell: (item) => item.logGroupName ?? "—",
      sortingField: "logGroupName",
    },
    {
      id: "stored",
      header: "Stored bytes",
      cell: (item) => (item.storedBytes === undefined ? "—" : item.storedBytes.toLocaleString()),
    },
    {
      id: "retention",
      header: "Retention",
      cell: (item) =>
        item.retentionInDays === undefined ? "Never expire" : `${item.retentionInDays} days`,
    },
  ];

  return (
    <SpaceBetween size="l">
      {error && (
        <Alert type="warning" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Container
        header={
          <Header
            variant="h2"
            description={`Metrics, alarms and logs published in the ${NAMESPACE} namespace`}
            actions={
              <SpaceBetween size="s" direction="horizontal">
                <Button onClick={fetchMonitoring} loading={loading} loadingText="Loading">
                  Refresh
                </Button>
                <Button href="/cloudwatch" variant="link">
                  Open CloudWatch
                </Button>
              </SpaceBetween>
            }
          >
            Monitoring
          </Header>
        }
      >
        <Grid gridDefinition={statGrid}>
          <MetricTile value={loading ? "-" : metrics.length} label="Published metrics" />
          <MetricTile value={loading ? "-" : alarms.length} label="Alarms" />
          <MetricTile value={loading ? "-" : logGroups.length} label="Log groups" />
        </Grid>
      </Container>

      <Table
        items={metrics}
        columnDefinitions={metricColumns}
        loading={loading}
        loadingText="Loading Lambda metrics"
        header={<Header variant="h2">Metrics</Header>}
        empty={<Box variant="p">No metrics published in {NAMESPACE} yet.</Box>}
        sortingColumn={{ sortingField: "MetricName" }}
        wrapLines
      />

      <Table
        items={alarms}
        columnDefinitions={alarmColumns}
        loading={loading}
        loadingText="Loading alarms"
        header={<Header variant="h2">Alarms</Header>}
        empty={
          <Box variant="p">
            No alarms defined. Create one in <Link href="/cloudwatch">CloudWatch</Link>.
          </Box>
        }
        sortingColumn={{ sortingField: "AlarmName" }}
        wrapLines
      />

      <Table
        items={logGroups}
        columnDefinitions={logGroupColumns}
        loading={loading}
        loadingText="Loading log groups"
        header={<Header variant="h2">Execution log groups</Header>}
        empty={<Box variant="p">No {LOG_GROUP_PREFIX}* log groups yet.</Box>}
        sortingColumn={{ sortingField: "logGroupName" }}
        wrapLines
      />
    </SpaceBetween>
  );
}
