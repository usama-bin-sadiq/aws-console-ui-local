"use client";

import { useCallback, useEffect, useState } from "react";
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
 * S3 metrics.
 *
 * Lists the S3 storage and request metrics the emulator publishes under the
 * AWS/S3 namespace, grouped the way the S3 console groups them.
 */
const NAMESPACE = "AWS/S3";

/** The metric names AWS documents for S3, mapped to the console's groupings. */
const METRIC_GROUPS: ReadonlyArray<{ label: string; metrics: readonly string[] }> = [
  {
    label: "Storage metrics",
    metrics: [
      "BucketSizeBytes",
      "BucketSizeBytesByStorageType",
      "NumberOfObjects",
      "NumberOfObjectsByStorageType",
    ],
  },
  {
    label: "Request metrics",
    metrics: [
      "AllRequests",
      "GetRequests",
      "PutRequests",
      "DeleteRequests",
      "ListRequests",
      "HeadRequests",
      "PostRequests",
      "CopyRequests",
    ],
  },
  {
    label: "Data transfer metrics",
    metrics: ["BytesDownloaded", "BytesUploaded", "DataRetrievalBytes"],
  },
  {
    label: "Replication and error metrics",
    metrics: [
      "ReplicationLatency",
      "ReplicationBytesFailed",
      "ReplicationTimeLag",
      "ErrorResponses",
      "ServerSideEncryptionErrors",
    ],
  },
];

interface S3Metric {
  MetricName?: string;
  Dimensions?: { Name?: string; Value?: string }[];
}

// One tile for the published total, then one per documented metric group.
const statGrid = [1, ...METRIC_GROUPS].map(() => ({ colspan: 2 }));

export default function S3MetricsPage() {
  const [metrics, setMetrics] = useState<S3Metric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/api/cloudwatch?action=listMetrics&namespace=${encodeURIComponent(NAMESPACE)}`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMetrics((data.metrics || []) as S3Metric[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch S3 metrics");
      setMetrics([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchMetrics();
    });
  }, [fetchMetrics]);

  const publishedNames = new Set(metrics.map((metric) => metric.MetricName));

  const columnDefinitions: TableProps.ColumnDefinition<S3Metric>[] = [
    {
      id: "metric",
      header: "Metric",
      cell: (item) => item.MetricName ?? "—",
      sortingField: "MetricName",
    },
    {
      id: "dimensions",
      header: "Reported dimensions",
      cell: (item) =>
        (item.Dimensions || []).length === 0
          ? "—"
          : (item.Dimensions || [])
              .map((dimension) => `${dimension.Name}=${dimension.Value}`)
              .join(", "),
    },
  ];

  return (
    <SpaceBetween size="l">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Container
        header={
          <Header
            variant="h2"
            description={`Metrics published in the ${NAMESPACE} namespace`}
            actions={
              <SpaceBetween size="s" direction="horizontal">
                <Button onClick={fetchMetrics} loading={loading} loadingText="Loading">
                  Refresh
                </Button>
                <Button href="/s3" variant="link">
                  Back to buckets
                </Button>
              </SpaceBetween>
            }
          >
            Metrics
          </Header>
        }
      >
        <Grid gridDefinition={statGrid}>
          <MetricTile value={loading ? "-" : metrics.length} label="Metrics reported" />
          {METRIC_GROUPS.map((group) => (
            <MetricTile
              key={group.label}
              value={
                loading ? "-" : group.metrics.filter((name) => publishedNames.has(name)).length
              }
              label={group.label}
            />
          ))}
        </Grid>
      </Container>

      <Table
        items={metrics}
        columnDefinitions={columnDefinitions}
        loading={loading}
        loadingText="Loading S3 metrics"
        header={<Header variant="h2">Available metrics</Header>}
        empty={
          <Box variant="p">
            No {NAMESPACE} metrics have been published yet. Enable request metrics or wait for
            bucket traffic.
          </Box>
        }
        sortingColumn={{ sortingField: "MetricName" }}
        wrapLines
      />
    </SpaceBetween>
  );
}
