"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Tabs from "@cloudscape-design/components/tabs";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Button from "@cloudscape-design/components/button";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Alert from "@cloudscape-design/components/alert";
import Spinner from "@cloudscape-design/components/spinner";
import Table from "@cloudscape-design/components/table";
import { EC2Instance, EC2InstanceState } from "@/types/ec2";

export default function EC2InstanceDetailsPage({
  params,
}: {
  params: { instanceId: string };
}) {
  const router = useRouter();
  const [instance, setInstance] = useState<EC2Instance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
  const [loadingConsole, setLoadingConsole] = useState(false);

  const fetchInstance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ec2");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const found = (data.instances || []).find(
        (i: EC2Instance) => i.InstanceId === params.instanceId
      );
      if (!found) throw new Error("Instance not found");
      setInstance(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load instance");
    }
    setLoading(false);
  }, [params.instanceId]);

  useEffect(() => {
    fetchInstance();
  }, [fetchInstance]);

  const executeAction = useCallback(async (action: string, extra?: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, instanceIds: [params.instanceId], ...extra }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `Action ${action} failed`);
      fetchInstance();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to ${action}`);
    }
  }, [params.instanceId, fetchInstance]);

  const loadConsoleOutput = useCallback(async () => {
    setLoadingConsole(true);
    try {
      const res = await fetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getConsoleOutput", instanceId: params.instanceId }),
      });
      const data = await res.json();
      setConsoleOutput(data.Output || "No console output available");
    } catch {
      setConsoleOutput("Failed to load console output");
    }
    setLoadingConsole(false);
  }, [params.instanceId]);

  if (loading) {
    return (
      <div style={{ padding: "16px" }}>
        <SpaceBetween size="l">
          <Header variant="h1">Instance {params.instanceId}</Header>
          <Box textAlign="center">
            <Spinner size="large" />
            <Box variant="p" padding={{ top: "s" }}>Loading instance details...</Box>
          </Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !instance) {
    return (
      <div style={{ padding: "16px" }}>
        <SpaceBetween size="l">
          <Header variant="h1">Instance {params.instanceId}</Header>
          <Alert type="error">{error || "Instance not found"}</Alert>
          <Button onClick={() => router.push("/ec2")}>Back to EC2</Button>
        </SpaceBetween>
      </div>
    );
  }

  const stateName = instance.State?.Name;
  const isRunning = stateName === "running";
  const isStopped = stateName === "stopped";

  const overviewContent = (
    <Container header={<Header variant="h2">Details</Header>}>
      <ColumnLayout columns={3} variant="default">
        <div>
          <Box variant="small" color="text-label">Instance ID</Box>
          <Box>{instance.InstanceId}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Name</Box>
          <Box>{instance.Name || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Instance State</Box>
          <StatusIndicator type={isRunning ? "success" : isStopped ? "warning" : "info"}>
            {stateName}
          </StatusIndicator>
        </div>
        <div>
          <Box variant="small" color="text-label">Instance Type</Box>
          <Box>{instance.InstanceType}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">AMI ID</Box>
          <Box>{instance.ImageId || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Architecture</Box>
          <Box>{instance.Architecture || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Platform</Box>
          <Box>{instance.Platform || "Linux/Unix"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Key Pair</Box>
          <Box>{instance.KeyName || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">IAM Role</Box>
          <Box>{instance.IamInstanceProfile?.Arn || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Launch Time</Box>
          <Box>{instance.LaunchTime ? new Date(instance.LaunchTime).toLocaleString() : "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Root Device Type</Box>
          <Box>{instance.RootDeviceType || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Virtualization Type</Box>
          <Box>{instance.VirtualizationType || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">EBS Optimized</Box>
          <Box>{instance.EbsOptimized ? "Yes" : "No"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Termination Protection</Box>
          <Box>{instance.DisableApiTermination ? "Enabled" : "Disabled"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Shutdown Behavior</Box>
          <Box>{instance.InstanceInitiatedShutdownBehavior || "stop"}</Box>
        </div>
      </ColumnLayout>
    </Container>
  );

  const networkingContent = (
    <Container header={<Header variant="h2">Networking</Header>}>
      <ColumnLayout columns={3} variant="default">
        <div>
          <Box variant="small" color="text-label">Public IPv4 Address</Box>
          <Box>{instance.PublicIpAddress || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Private IPv4 Address</Box>
          <Box>{instance.PrivateIpAddress || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Public DNS Name</Box>
          <Box>{instance.PublicDnsName || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Private DNS Name</Box>
          <Box>{instance.PrivateDnsName || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">VPC ID</Box>
          <Box>{instance.VpcId || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Subnet ID</Box>
          <Box>{instance.SubnetId || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Availability Zone</Box>
          <Box>{instance.AvailabilityZone || "—"}</Box>
        </div>
      </ColumnLayout>
      {instance.SecurityGroups && instance.SecurityGroups.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <Box variant="small" color="text-label">Security Groups</Box>
          <SpaceBetween size="xs">
            {instance.SecurityGroups.map((sg, idx) => (
              <Box key={idx}>
                {sg.GroupName} ({sg.GroupId})
              </Box>
            ))}
          </SpaceBetween>
        </div>
      )}
    </Container>
  );

  const storageContent = (
    <Container header={<Header variant="h2">Storage</Header>}>
      {instance.BlockDeviceMappings && instance.BlockDeviceMappings.length > 0 ? (
        <Table
          columnDefinitions={[
            { header: "Device Name", cell: (item) => item.DeviceName },
            { header: "Volume ID", cell: (item) => item.Ebs?.VolumeId },
            { header: "Status", cell: (item) => <StatusIndicator type="info">{item.Ebs?.Status}</StatusIndicator> },
            { header: "Delete on Termination", cell: (item) => item.Ebs?.DeleteOnTermination ? "Yes" : "No" },
            { header: "Attach Time", cell: (item) => item.Ebs?.AttachTime ? new Date(item.Ebs.AttachTime).toLocaleString() : "—" },
          ]}
          items={instance.BlockDeviceMappings}
          header={<Header variant="h3">Block Device Mappings</Header>}
        />
      ) : (
        <Box>No block device mappings</Box>
      )}
    </Container>
  );

  const tagsContent = (
    <Container header={<Header variant="h2">Tags</Header>}>
      {instance.Tags && instance.Tags.length > 0 ? (
        <Table
          columnDefinitions={[
            { header: "Key", cell: (item) => item.Key },
            { header: "Value", cell: (item) => item.Value },
          ]}
          items={instance.Tags}
          header={<Header variant="h3">Tags ({instance.Tags.length})</Header>}
        />
      ) : (
        <Box>No tags</Box>
      )}
    </Container>
  );

  const monitoringContent = (
    <Container header={<Header variant="h2">Monitoring</Header>}>
      <ColumnLayout columns={2} variant="default">
        <div>
          <Box variant="small" color="text-label">Monitoring</Box>
          <Box>{instance.Monitoring?.State || "disabled"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Console Output</Box>
          {loadingConsole ? (
            <Spinner size="small" />
          ) : (
            <Button onClick={loadConsoleOutput} formAction="none">
              Get Console Output
            </Button>
          )}
        </div>
      </ColumnLayout>
      {consoleOutput && (
        <div style={{ marginTop: "16px" }}>
          <Box variant="small" color="text-label">Last Console Output</Box>
          <pre style={{
            background: "#1a1a2e",
            color: "#e0e0e0",
            padding: "16px",
            borderRadius: "4px",
            overflow: "auto",
            maxHeight: "300px",
            fontFamily: "monospace",
            fontSize: "12px",
          }}>
            {consoleOutput}
          </pre>
        </div>
      )}
    </Container>
  );

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              {isRunning && (
                <Button onClick={() => executeAction("stop")} formAction="none">
                  Stop
                </Button>
              )}
              {isStopped && (
                <Button onClick={() => executeAction("start")} formAction="none">
                  Start
                </Button>
              )}
              {isRunning && (
                <Button onClick={() => executeAction("reboot")} formAction="none">
                  Reboot
                </Button>
              )}
              <Button onClick={() => executeAction("terminate")} formAction="none">
                Terminate
              </Button>
              <Button onClick={() => router.push("/ec2")} formAction="none">
                Back to EC2
              </Button>
            </SpaceBetween>
          }
        >
          Instance {instance.Name || instance.InstanceId}
        </Header>

        <Tabs
          tabs={[
            { label: "Details", id: "overview", content: overviewContent },
            { label: "Networking", id: "networking", content: networkingContent },
            { label: "Storage", id: "storage", content: storageContent },
            { label: "Monitoring", id: "monitoring", content: monitoringContent },
            { label: "Tags", id: "tags", content: tagsContent },
          ]}
        />
      </SpaceBetween>
    </div>
  );
}
