"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Table from "@cloudscape-design/components/table";
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

interface Topic {
  TopicArn: string;
  DisplayName?: string;
  Subscriptions?: Array<{ Protocol?: string; Endpoint?: string }>;
}

export default function SNSDetailPage({ params }: { params: Promise<{ topicArn: string }> }) {
  const router = useRouter();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [subscriptions, setSubscriptions] = useState<
    Array<{ Protocol?: string; Endpoint?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topicArn, setTopicArn] = useState<string>("");

  useEffect(() => {
    params.then((p) => setTopicArn(p.topicArn));
  }, [params]);

  const fetchTopic = useCallback(async () => {
    if (!topicArn) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/sns");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const found = (data.Topics || []).find((t: any) => t.TopicArn === topicArn);
      if (!found) throw new Error(`Topic "${topicArn}" not found`);
      setTopic(found);
      setSubscriptions(found.Subscriptions || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load topic");
    } finally {
      setLoading(false);
    }
  }, [topicArn]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchTopic();
    });
  }, [fetchTopic]);

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Topic {topicArn || "Loading..."}</Header>
          <Box textAlign="center">Loading topic details...</Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Topic {topicArn || "Loading..."}</Header>
          <Alert type="error">{error || "Topic not found"}</Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={fetchTopic}>Refresh</Button>
            <Button onClick={() => router.push("/sns")}>Back to SNS Topics</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="SNS"
          serviceIcon={SERVICE_ICONS["/sns"]?.small}
          counter={1}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/sns/create")}
            >
              Create Topic
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
                  Topic ARN
                </Box>
                <Box>{topic.TopicArn}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Display Name
                </Box>
                <Box>{topic.DisplayName || "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Subscriptions
                </Box>
                <Box>{topic.Subscriptions?.length || 0}</Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>

        <Container
          className="aws-table-card"
          header={<Header variant="h2">Subscriptions ({subscriptions.length})</Header>}
        >
          <SpaceBetween size="m">
            <Table
              items={subscriptions}
              columnDefinitions={[
                { id: "protocol", header: "Protocol", cell: (item: any) => item.Protocol },
                { id: "endpoint", header: "Endpoint", cell: (item: any) => item.Endpoint },
              ]}
              empty={<Box textAlign="center">No subscriptions found.</Box>}
            />
          </SpaceBetween>
        </Container>

        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/sns"] || []} />
      </SpaceBetween>
    </div>
  );
}
