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
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";
import { apiFetch } from "@/lib/api-client";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";

interface Alarm {
  AlarmName: string;
  AlarmArn: string;
  AlarmDescription?: string;
  StateValue: string;
  StateReason?: string;
  MetricName?: string;
  Namespace?: string;
  Period?: number;
  Statistic?: string;
  Threshold?: number;
}

export default function CloudWatchAlarmDetailPage({
  params,
}: {
  params: Promise<{ alarmName: string }>;
}) {
  const router = useRouter();
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alarmName, setAlarmName] = useState<string>("");

  useEffect(() => {
    params.then((p) => setAlarmName(p.alarmName));
  }, [params]);

  const fetchAlarm = useCallback(async () => {
    if (!alarmName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/cloudwatch");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const found = (data.alarms || []).find((a: any) => a.AlarmName === alarmName);
      if (!found) throw new Error(`Alarm "${alarmName}" not found`);
      setAlarm(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load alarm");
    } finally {
      setLoading(false);
    }
  }, [alarmName]);

  useEffect(() => {
    fetchAlarm();
  }, [fetchAlarm]);

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Alarm {alarmName || "Loading..."}</Header>
          <Box textAlign="center">
            Loading alarm details...
          </Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !alarm) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Alarm {alarmName || "Loading..."}</Header>
          <Alert type="error">{error || "Alarm not found"}</Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={fetchAlarm}>Refresh</Button>
            <Button onClick={() => router.push("/cloudwatch")}>Back to CloudWatch</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="CloudWatch"
          serviceIcon={SERVICE_ICONS["/cloudwatch"]?.small}
          counter={1}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/cloudwatch/create")}
            >
              Create Alarm
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
            <Box padding="m" >
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Alarm Name</Box>
                <Box>{alarm.AlarmName}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">ARN</Box>
                <Box>{alarm.AlarmArn}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Description</Box>
                <Box>{alarm.AlarmDescription || "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">State</Box>
                <StatusIndicator type={alarm.StateValue === "OK" ? "success" : alarm.StateValue === "INSUFFICIENT_DATA" ? "warning" : "error"}>
                  {alarm.StateValue}
                </StatusIndicator>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Reason</Box>
                <Box>{alarm.StateReason || "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Metric Name</Box>
                <Box>{alarm.MetricName || "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Namespace</Box>
                <Box>{alarm.Namespace || "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Period</Box>
                <Box>{alarm.Period ? alarm.Period + " seconds" : "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Statistic</Box>
                <Box>{alarm.Statistic || "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Threshold</Box>
                <Box>{alarm.Threshold || "—"}</Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>

        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/cloudwatch"] || []} />
      </SpaceBetween>
    </div>
  );
}
