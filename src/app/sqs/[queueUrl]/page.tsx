"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Header from "@cloudscape-design/components/header";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";
import { apiFetch } from "@/lib/api-client";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";

interface Queue {
  QueueUrl: string;
  QueueArn: string;
  Attributes?: {
    ApproximateNumberOfMessages?: string;
    ApproximateNumberOfMessagesNotVisible?: string;
    ApproximateNumberOfMessagesDelayed?: string;
    CreatedTimestamp?: string;
    LastModifiedTimestamp?: string;
    MaximumMessageSize?: string;
    MessageRetentionPeriod?: string;
    VisibilityTimeout?: string;
  };
}

export default function SQSQueueDetailPage({ params }: { params: Promise<{ queueUrl: string }> }) {
  const router = useRouter();
  const [queue, setQueue] = useState<Queue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [queueUrl, setQueueUrl] = useState<string>("");

  useEffect(() => {
    params.then((p) => setQueueUrl(p.queueUrl));
  }, [params]);

  const fetchQueue = useCallback(async () => {
    if (!queueUrl) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/sqs");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const found = (data.QueueUrls || data.queues || []).find(
        (q: any) => q.QueueUrl === queueUrl || q.Url === queueUrl || q.QueueArn === queueUrl,
      );
      if (!found) throw new Error(`Queue "${queueUrl}" not found`);
      setQueue(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }, [queueUrl]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchQueue();
    });
  }, [fetchQueue]);

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Queue {queueUrl || "Loading..."}</Header>
          <Box textAlign="center">Loading queue details...</Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !queue) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Queue {queueUrl || "Loading..."}</Header>
          <Alert type="error">{error || "Queue not found"}</Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={fetchQueue}>Refresh</Button>
            <Button onClick={() => router.push("/sqs")}>Back to SQS Queues</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    );
  }

  const attributes = queue.Attributes || {};

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="SQS"
          serviceIcon={SERVICE_ICONS["/sqs"]?.small}
          counter={1}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/sqs/create")}
            >
              Create Queue
            </button>
          }
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container header={<Header variant="h2">Details</Header>}>
          <SpaceBetween size="l">
            <Box padding="m">
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Queue URL
                </Box>
                <Box>{queue.QueueUrl}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  ARN
                </Box>
                <Box>{queue.QueueArn}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Approximate Messages
                </Box>
                <Box>{attributes.ApproximateNumberOfMessages || "0"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Not Visible Messages
                </Box>
                <Box>{attributes.ApproximateNumberOfMessagesNotVisible || "0"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Delayed Messages
                </Box>
                <Box>{attributes.ApproximateNumberOfMessagesDelayed || "0"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Max Message Size (bytes)
                </Box>
                <Box>{attributes.MaximumMessageSize || "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Message Retention Period (seconds)
                </Box>
                <Box>{attributes.MessageRetentionPeriod || "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Visibility Timeout (seconds)
                </Box>
                <Box>{attributes.VisibilityTimeout || "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Created
                </Box>
                <Box>{attributes.CreatedTimestamp || "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Last Modified
                </Box>
                <Box>{attributes.LastModifiedTimestamp || "—"}</Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>

        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/sqs"] || []} />
      </SpaceBetween>
    </div>
  );
}
