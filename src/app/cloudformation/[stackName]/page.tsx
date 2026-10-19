"use client";

/**
 * VERIFICATION GATE CHECKLIST — Phase 11: CloudFormation Stack Detail
 * Source: docs/prd-aws-management-console-v1.3.md §9.2.8, §15.11
 * Feature IDs: F-006 (Service Consoles), F-008 (Resource Listing & Detail Pages)
 * [x] Stack detail uses Tabs (Overview, Events, Resources, Outputs) per PRD §15.11 / §9.2.8
 * [x] Overview tab shows StackName, StackStatus, CreationTime, LastUpdatedTime, StackStatusReason, DriftInformation, Tags, Outputs, Parameters
 * [x] Events tab shows live event table (Timestamp, Status, Resource, Reason) from DescribeStackEvents
 * [x] Resources tab shows resource summary table (LogicalResourceId, PhysicalResourceId, ResourceType, ResourceStatus, LastUpdatedTimestamp) from ListStackResources
 * [x] Outputs tab shows Outputs table (OutputKey, OutputValue, Description, ExportName)
 * [x] Fetches from /api/cloudformation?stackName=... (adapter SDK through API route)
 * [x] No hardcoded *.amazonaws.com endpoints
 * [x] Uses Cloudscape components only: Tabs, Table, Header, StatusIndicator, Container, SpaceBetween, Box, Alert, Link, Button
 */

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Tabs from "@cloudscape-design/components/tabs";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import ColumnLayout from "@cloudscape-design/components/column-layout";

interface StackEvent {
  Timestamp?: string;
  ResourceStatus?: string;
  ResourceStatusReason?: string;
  LogicalResourceId?: string;
  PhysicalResourceId?: string;
  ResourceType?: string;
}

interface StackResourceSummary {
  LogicalResourceId?: string;
  PhysicalResourceId?: string;
  ResourceType?: string;
  ResourceStatus?: string;
  LastUpdatedTimestamp?: string;
}

interface StackOutput {
  OutputKey?: string;
  OutputValue?: string;
  Description?: string;
  ExportName?: string;
}

interface StackDetail {
  StackName?: string;
  StackStatus?: string;
  CreationTime?: string;
  LastUpdatedTime?: string;
  StackStatusReason?: string;
  DriftInformation?: { StackDriftStatus?: string };
  Tags?: Array<{ Key?: string; Value?: string }>;
  Outputs?: StackOutput[];
  Parameters?: Array<{
    ParameterKey?: string;
    ParameterValue?: string;
    UsePreviousValue?: boolean;
    ResolvedValue?: string;
  }>;
  TemplateDescription?: string;
  NotificationARNs?: string[];
}

export default function StackDetailPage() {
  const router = useRouter();
  const params = useParams();
  const stackName = params?.stackName ? decodeURIComponent(String(params.stackName)) : "";

  const [stack, setStack] = useState<StackDetail | null>(null);
  const [events, setEvents] = useState<StackEvent[]>([]);
  const [resources, setResources] = useState<StackResourceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState("overview");

  const fetchDetail = useCallback(async () => {
    if (!stackName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cloudformation?stackName=${encodeURIComponent(stackName)}`);
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setStack(data.stack || null);
      setEvents(data.events || []);
      setResources(data.resources || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load stack details");
      setStack(null);
      setEvents([]);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [stackName]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const eventColumns: TableProps.ColumnDefinition<StackEvent>[] = [
    {
      id: "timestamp",
      header: "Timestamp",
      cell: (item) => (item.Timestamp ? new Date(item.Timestamp).toLocaleString() : "—"),
      sortingField: "Timestamp",
    },
    {
      id: "status",
      header: "Status",
      cell: (item) => {
        const status = item.ResourceStatus || "—";
        let type: "success" | "warning" | "error" | "info" = "info";
        if (status.includes("COMPLETE")) type = "success";
        else if (status.includes("IN_PROGRESS") || status.includes("REVIEW")) type = "warning";
        else if (status.includes("FAILED") || status.includes("ROLLBACK")) type = "error";
        return <StatusIndicator type={type}>{status}</StatusIndicator>;
      },
      sortingField: "ResourceStatus",
    },
    {
      id: "logicalId",
      header: "Logical resource ID",
      cell: (item) => item.LogicalResourceId || "—",
      sortingField: "LogicalResourceId",
    },
    {
      id: "resourceType",
      header: "Resource type",
      cell: (item) => item.ResourceType || "—",
      sortingField: "ResourceType",
    },
    {
      id: "physicalId",
      header: "Physical resource ID",
      cell: (item) => item.PhysicalResourceId || "—",
      sortingField: "PhysicalResourceId",
    },
    {
      id: "reason",
      header: "Status reason",
      cell: (item) => item.ResourceStatusReason || "—",
    },
  ];

  const resourceColumns: TableProps.ColumnDefinition<StackResourceSummary>[] = [
    {
      id: "logicalId",
      header: "Logical resource ID",
      cell: (item) => item.LogicalResourceId || "—",
      sortingField: "LogicalResourceId",
    },
    {
      id: "physicalId",
      header: "Physical resource ID",
      cell: (item) => item.PhysicalResourceId || "—",
      sortingField: "PhysicalResourceId",
    },
    {
      id: "resourceType",
      header: "Resource type",
      cell: (item) => item.ResourceType || "—",
      sortingField: "ResourceType",
    },
    {
      id: "status",
      header: "Status",
      cell: (item) => {
        const status = item.ResourceStatus || "—";
        let type: "success" | "warning" | "error" | "info" = "info";
        if (status.includes("COMPLETE")) type = "success";
        else if (status.includes("IN_PROGRESS")) type = "warning";
        else if (status.includes("FAILED")) type = "error";
        return <StatusIndicator type={type}>{status}</StatusIndicator>;
      },
      sortingField: "ResourceStatus",
    },
    {
      id: "lastUpdated",
      header: "Last updated",
      cell: (item) =>
        item.LastUpdatedTimestamp ? new Date(item.LastUpdatedTimestamp).toLocaleString() : "—",
      sortingField: "LastUpdatedTimestamp",
    },
  ];

  const overviewContent = (
    <SpaceBetween size="l">
      <Container header={<Header variant="h2">Stack details</Header>}>
        <ColumnLayout columns={3} variant="default">
          <div>
            <Box variant="small" color="text-label">
              Stack name
            </Box>
            <Box variant="strong">{stack?.StackName || "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">
              Status
            </Box>
            <StatusIndicator
              type={
                stack?.StackStatus?.includes("COMPLETE")
                  ? "success"
                  : stack?.StackStatus?.includes("FAILED")
                    ? "error"
                    : stack?.StackStatus?.includes("IN_PROGRESS") ||
                        stack?.StackStatus?.includes("REVIEW")
                      ? "warning"
                      : "info"
              }
            >
              {stack?.StackStatus || "—"}
            </StatusIndicator>
          </div>
          <div>
            <Box variant="small" color="text-label">
              Drift status
            </Box>
            <StatusIndicator
              type={
                stack?.DriftInformation?.StackDriftStatus === "DRIFTED"
                  ? "warning"
                  : stack?.DriftInformation?.StackDriftStatus === "IN_SYNC"
                    ? "success"
                    : "info"
              }
            >
              {stack?.DriftInformation?.StackDriftStatus || "NOT_CHECKED"}
            </StatusIndicator>
          </div>
          <div>
            <Box variant="small" color="text-label">
              Created
            </Box>
            <Box>{stack?.CreationTime ? new Date(stack.CreationTime).toLocaleString() : "—"}</Box>
          </div>
          <div>
            <Box variant="small" color="text-label">
              Updated
            </Box>
            <Box>
              {stack?.LastUpdatedTime ? new Date(stack.LastUpdatedTime).toLocaleString() : "—"}
            </Box>
          </div>
          <div>
            <Box variant="small" color="text-label">
              Status reason
            </Box>
            <Box>{stack?.StackStatusReason || "—"}</Box>
          </div>
        </ColumnLayout>
      </Container>

      {stack?.Outputs && stack.Outputs.length > 0 && (
        <Container header={<Header variant="h2">Outputs</Header>} className="aws-table-card">
          <Table
            columnDefinitions={[
              {
                id: "key",
                header: "Output key",
                cell: (item: StackOutput) => item.OutputKey || "—",
              },
              {
                id: "value",
                header: "Output value",
                cell: (item: StackOutput) => item.OutputValue || "—",
              },
              {
                id: "desc",
                header: "Description",
                cell: (item: StackOutput) => item.Description || "—",
              },
              {
                id: "export",
                header: "Export name",
                cell: (item: StackOutput) => item.ExportName || "—",
              },
            ]}
            items={stack.Outputs}
            header={<Header variant="h3">Outputs ({stack.Outputs.length})</Header>}
          />
        </Container>
      )}

      {stack?.Parameters && stack.Parameters.length > 0 && (
        <Container header={<Header variant="h2">Parameters</Header>} className="aws-table-card">
          <Table
            columnDefinitions={[
              {
                id: "paramKey",
                header: "Parameter key",
                cell: (item: { ParameterKey?: string }) => item.ParameterKey || "—",
              },
              {
                id: "paramValue",
                header: "Parameter value",
                cell: (item) =>
                  (item as { ParameterValue?: string; ResolvedValue?: string }).ResolvedValue ||
                  (item as { ParameterValue?: string }).ParameterValue ||
                  "—",
              },
            ]}
            items={stack.Parameters}
            header={<Header variant="h3">Parameters ({stack.Parameters.length})</Header>}
          />
        </Container>
      )}

      {stack?.Tags && stack.Tags.length > 0 && (
        <Container header={<Header variant="h2">Tags</Header>} className="aws-table-card">
          <Table
            columnDefinitions={[
              {
                id: "key",
                header: "Key",
                cell: (item: { Key?: string; Value?: string }) => item.Key || "—",
              },
              {
                id: "value",
                header: "Value",
                cell: (item: { Key?: string; Value?: string }) => item.Value || "—",
              },
            ]}
            items={stack.Tags}
            header={<Header variant="h3">Tags ({stack.Tags.length})</Header>}
          />
        </Container>
      )}
    </SpaceBetween>
  );

  const eventsContent = (
    <Container header={<Header variant="h2">Events</Header>} className="aws-table-card">
      <Table
        columnDefinitions={eventColumns}
        items={events}
        loading={loading}
        loadingText="Loading events..."
        header={<Header variant="h3">Stack events ({events.length})</Header>}
        empty={
          <Box textAlign="center" color="inherit">
            <Box variant="strong">No events found</Box>
            <Box variant="p" padding={{ bottom: "s" }}>
              Events will appear once the stack begins creation or update.
            </Box>
          </Box>
        }
      />
    </Container>
  );

  const resourcesContent = (
    <Container header={<Header variant="h2">Resources</Header>} className="aws-table-card">
      <Table
        columnDefinitions={resourceColumns}
        items={resources}
        loading={loading}
        loadingText="Loading resources..."
        header={<Header variant="h3">Stack resources ({resources.length})</Header>}
        empty={
          <Box textAlign="center" color="inherit">
            <Box variant="strong">No resources found</Box>
            <Box variant="p" padding={{ bottom: "s" }}>
              Resources will appear once the stack creates them.
            </Box>
          </Box>
        }
      />
    </Container>
  );

  const outputsContent = (
    <Container header={<Header variant="h2">Outputs</Header>} className="aws-table-card">
      {stack?.Outputs && stack.Outputs.length > 0 ? (
        <Table
          columnDefinitions={[
            { id: "key", header: "Output key", cell: (item: StackOutput) => item.OutputKey || "—" },
            {
              id: "value",
              header: "Output value",
              cell: (item: StackOutput) => item.OutputValue || "—",
            },
            {
              id: "desc",
              header: "Description",
              cell: (item: StackOutput) => item.Description || "—",
            },
            {
              id: "export",
              header: "Export name",
              cell: (item: StackOutput) => item.ExportName || "—",
            },
          ]}
          items={stack.Outputs}
          header={<Header variant="h3">Outputs ({stack.Outputs.length})</Header>}
        />
      ) : (
        <Box>No outputs defined for this stack.</Box>
      )}
    </Container>
  );

  if (loading && !stack) {
    return (
      <Box padding="l">
        <SpaceBetween size="l">
          <Header variant="h1">Stack {stackName}</Header>
          <Box textAlign="center">
            <Box>Loading stack details...</Box>
          </Box>
        </SpaceBetween>
      </Box>
    );
  }

  if (error || !stack) {
    return (
      <Box padding="l">
        <SpaceBetween size="l">
          <Header variant="h2">Stack {stackName}</Header>
          <Alert type="error">{error || "Stack not found"}</Alert>
          <Button onClick={() => router.push("/cloudformation")}>Back to stacks</Button>
        </SpaceBetween>
      </Box>
    );
  }

  return (
    <Box padding="l">
      <SpaceBetween size="l">
        <Header
          variant="h2"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={fetchDetail} ariaLabel="Refresh stack details">
                Refresh
              </Button>
              <Button onClick={() => router.push("/cloudformation")} formAction="none">
                Back to stacks
              </Button>
            </SpaceBetween>
          }
        >
          Stack: {stack.StackName}
        </Header>

        <Tabs
          tabs={[
            { label: "Overview", id: "overview", content: overviewContent },
            { label: "Events", id: "events", content: eventsContent },
            { label: "Resources", id: "resources", content: resourcesContent },
            { label: "Outputs", id: "outputs", content: outputsContent },
          ]}
          activeTabId={activeTabId}
          onChange={({ detail }) => setActiveTabId(detail.activeTabId)}
        />
      </SpaceBetween>
    </Box>
  );
}
