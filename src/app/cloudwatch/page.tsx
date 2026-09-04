"use client";

import React, { useEffect, useState, useCallback } from "react";
import Header from "@cloudscape-design/components/header";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Tabs from "@cloudscape-design/components/tabs";
import FormField from "@cloudscape-design/components/form-field";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Alert from "@cloudscape-design/components/alert";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import { CloudWatchAlarm, CloudWatchMetric, CloudWatchLogGroup, CloudWatchLogStream, CloudWatchInsightsQuery } from "@/types/cloudwatch";

export default function CloudWatchPage() {
  const [alarms, setAlarms] = useState<CloudWatchAlarm[]>([]);
  const [metrics, setMetrics] = useState<CloudWatchMetric[]>([]);
  const [logGroups, setLogGroups] = useState<CloudWatchLogGroup[]>([]);
  const [logStreams, setLogStreams] = useState<CloudWatchLogStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Alarm creation / edit state
  const [alarmModalVisible, setAlarmModalVisible] = useState(false);
  const [alarmForm, setAlarmForm] = useState<Partial<CloudWatchAlarm>>({
    AlarmName: "",
    AlarmDescription: "",
    MetricName: "CPUUtilization",
    Namespace: "AWS/EC2",
    Statistic: "Average",
    Period: 300,
    Threshold: 80,
    ComparisonOperator: "GreaterThanThreshold",
    EvaluationPeriods: 1,
  });
  const [editingAlarmName, setEditingAlarmName] = useState<string | null>(null);

  // Log group creation state
  const [logGroupModalVisible, setLogGroupModalVisible] = useState(false);
  const [logGroupNameInput, setLogGroupNameInput] = useState("");

  // Insights query state
  const [insightsQuery, setInsightsQuery] = useState("fields @timestamp, @message | sort @timestamp desc | limit 20");
  const [insightsResults, setInsightsResults] = useState<Record<string, unknown>[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsQueryId, setInsightsQueryId] = useState<string | null>(null);

  // Filtering / pagination for alarms
  const [alarmFilterText, setAlarmFilterText] = useState("");
  const [alarmPageIndex, setAlarmPageIndex] = useState(1);
  const [alarmPageSize, setAlarmPageSize] = useState(25);

  // Selected log group for stream view
  const [selectedLogGroup, setSelectedLogGroup] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cloudwatch");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setAlarms(d.alarms || []);
      setMetrics(d.metrics || []);
      setLogGroups(d.logGroups || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch CloudWatch data");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogStreams = useCallback(async (groupName: string) => {
    try {
      const res = await fetch(`/api/cloudwatch?action=describeLogStreams&logGroupName=${encodeURIComponent(groupName)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      setLogStreams(d.logStreams || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch log streams");
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedLogGroup) {
      fetchLogStreams(selectedLogGroup);
    }
  }, [selectedLogGroup, fetchLogStreams]);

  const openCreateAlarm = useCallback(() => {
    setAlarmForm({ AlarmName: "", MetricName: "CPUUtilization", Namespace: "AWS/EC2", Statistic: "Average", Period: 300, Threshold: 80, ComparisonOperator: "GreaterThanThreshold", EvaluationPeriods: 1 });
    setEditingAlarmName(null);
    setAlarmModalVisible(true);
  }, []);

  const handleCreateAlarm = async () => {
    try {
      const payload = {
        action: editingAlarmName ? "updateAlarm" : "createAlarm",
        ...alarmForm,
      };
      const res = await fetch("/api/cloudwatch", {
        method: editingAlarmName ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAlarmModalVisible(false);
      setEditingAlarmName(null);
      setAlarmForm({
        AlarmName: "",
        AlarmDescription: "",
        MetricName: "CPUUtilization",
        Namespace: "AWS/EC2",
        Statistic: "Average",
        Period: 300,
        Threshold: 80,
        ComparisonOperator: "GreaterThanThreshold",
        EvaluationPeriods: 1,
      });
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save alarm");
    }
  };

  const handleDeleteAlarm = async (alarmName: string) => {
    try {
      const res = await fetch(`/api/cloudwatch?alarmNames=${encodeURIComponent(alarmName)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete alarm");
    }
  };

  const handleCreateLogGroup = async () => {
    if (!logGroupNameInput.trim()) return;
    try {
      const res = await fetch("/api/cloudwatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createLogGroup", logGroupName: logGroupNameInput }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLogGroupModalVisible(false);
      setLogGroupNameInput("");
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create log group");
    }
  };

  const handleDeleteLogGroup = async (name: string) => {
    try {
      const res = await fetch(`/api/cloudwatch?logGroupName=${encodeURIComponent(name)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (selectedLogGroup === name) setSelectedLogGroup(null);
      fetchData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete log group");
    }
  };

  const handleRunInsightsQuery = async () => {
    setInsightsLoading(true);
    try {
      const res = await fetch("/api/cloudwatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "startQuery",
          logGroupNames: selectedLogGroup ? [selectedLogGroup] : undefined,
          queryString: insightsQuery,
          startTime: Date.now() - 3600000,
          endTime: Date.now(),
          limit: 100,
        }),
      });
      const d = await res.json();
      if (d.queryId) {
        setInsightsQueryId(d.queryId);
        // Poll for results briefly
        setTimeout(async () => {
          const r2 = await fetch(`/api/cloudwatch?action=getQueryResults&queryId=${encodeURIComponent(d.queryId)}`);
          const d2 = await r2.json();
          setInsightsResults(d2.results || []);
          setInsightsLoading(false);
        }, 800);
      } else {
        setInsightsResults([]);
        setInsightsLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Insights query failed");
      setInsightsLoading(false);
    }
  };

  const filteredAlarms = alarms.filter((a) => {
    if (!alarmFilterText.trim()) return true;
    const lower = alarmFilterText.toLowerCase();
    return (
      (a.AlarmName || "").toLowerCase().includes(lower) ||
      (a.Namespace || "").toLowerCase().includes(lower) ||
      (a.MetricName || "").toLowerCase().includes(lower)
    );
  });

  const alarmEmptyContent = (
    <Box textAlign="center">
      No alarms configured. <Button onClick={openCreateAlarm} formAction="none">Create alarm</Button>
    </Box>
  );

  const pagedAlarms = filteredAlarms.slice(
    (alarmPageIndex - 1) * alarmPageSize,
    alarmPageIndex * alarmPageSize
  );

  const alarmColumns: TableProps.ColumnDefinition<CloudWatchAlarm>[] = [
    {
      id: "name",
      header: "Alarm Name",
      cell: (item) => (
        <Button variant="link" onClick={() => { setAlarmForm({ ...item, AlarmName: item.AlarmName || "" }); setEditingAlarmName(item.AlarmName || null); setAlarmModalVisible(true); }} formAction="none">
          {item.AlarmName}
        </Button>
      ),
      sortingField: "AlarmName",
      isRowHeader: true,
    },
    {
      id: "state",
      header: "State",
      cell: (item) => (
        <StatusIndicator type={item.AlarmState === "OK" ? "success" : item.AlarmState === "ALARM" ? "error" : "warning"}>
          {item.AlarmState || "INSUFFICIENT_DATA"}
        </StatusIndicator>
      ),
      sortingField: "AlarmState",
    },
    {
      id: "namespace",
      header: "Namespace",
      cell: (item) => item.Namespace || "—",
      sortingField: "Namespace",
    },
    {
      id: "metric",
      header: "Metric",
      cell: (item) => item.MetricName || "—",
      sortingField: "MetricName",
    },
    {
      id: "threshold",
      header: "Threshold",
      cell: (item) => `${item.Threshold ?? "—"} (${item.ComparisonOperator || "—"})`,
    },
    {
      id: "period",
      header: "Period",
      cell: (item) => item.Period ? `${item.Period}s` : "—",
    },
    {
      id: "actions",
      header: "Actions",
      cell: (item) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button
            variant="icon"
            iconName="edit"
            ariaLabel="Edit alarm"
            onClick={() => { setAlarmForm({ ...item, AlarmName: item.AlarmName || "" }); setEditingAlarmName(item.AlarmName || null); setAlarmModalVisible(true); }}
          />
          <Button
            variant="icon"
            iconName="remove"
            ariaLabel="Delete alarm"
            onClick={() => handleDeleteAlarm(item.AlarmName || "")}
          />
        </SpaceBetween>
      ),
    },
  ];

  const metricColumns: TableProps.ColumnDefinition<CloudWatchMetric>[] = [
    { id: "metricName", header: "Metric Name", cell: (item) => item.MetricName || "—", sortingField: "MetricName" },
    { id: "namespace", header: "Namespace", cell: (item) => item.Namespace || "—", sortingField: "Namespace" },
    { id: "dimensions", header: "Dimensions", cell: (item) => item.Dimensions?.map((d) => `${d.Name || ""}=${d.Value || ""}`).join(", ") || "—" },
  ];

  const logGroupColumns: TableProps.ColumnDefinition<CloudWatchLogGroup>[] = [
    { id: "name", header: "Log Group Name", cell: (item) => <Button variant="link" onClick={() => setSelectedLogGroup(item.logGroupName || null)} formAction="none">{item.logGroupName || "—"}</Button>, sortingField: "logGroupName", isRowHeader: true },
    { id: "retention", header: "Retention (days)", cell: (item) => item.retentionInDays ?? "—" },
    { id: "storedBytes", header: "Stored Bytes", cell: (item) => (item.storedBytes !== undefined ? String(item.storedBytes) : "—") },
    { id: "actions", header: "Actions", cell: (item) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="icon" iconName="remove" ariaLabel="Delete log group" onClick={() => item.logGroupName && handleDeleteLogGroup(item.logGroupName)} />
        </SpaceBetween>
      ) },
  ];

  const logStreamColumns: TableProps.ColumnDefinition<CloudWatchLogStream>[] = [
    { id: "streamName", header: "Log Stream Name", cell: (item) => item.logStreamName || "—", isRowHeader: true },
    { id: "creationTime", header: "Created", cell: (item) => item.creationTime ? new Date(item.creationTime).toLocaleString() : "—" },
    { id: "lastEvent", header: "Last Event", cell: (item) => item.lastEventTimestamp ? new Date(item.lastEventTimestamp).toLocaleString() : "—" },
  ];

  const headerActions = (
    <SpaceBetween direction="horizontal" size="xs">
      <Button iconName="refresh" onClick={fetchData} ariaLabel="Refresh" />
      <Button variant="primary" onClick={openCreateAlarm}>
        Create alarm
      </Button>
      <Button variant="primary" onClick={() => { setLogGroupNameInput(""); setLogGroupModalVisible(true); }}>
        Create log group
      </Button>
    </SpaceBetween>
  );

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1" counter={`(${alarms.length})`} actions={headerActions}>
          CloudWatch
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs
          tabs={[
            {
              label: `Alarms (${alarms.length})`,
              id: "alarms",
              content: (
                <Container>
                  <SpaceBetween size="m" direction="vertical">
                    <Table
                      items={pagedAlarms}
                      columnDefinitions={alarmColumns}
                      loading={loading}
                      loadingText="Loading alarms..."
                      selectionType="single"
                      filter={
                        <TextFilter
                          filteringText={alarmFilterText}
                          filteringPlaceholder="Filter alarms"
                          filteringAriaLabel="Filter alarms"
                          onChange={({ detail }) => { setAlarmFilterText(detail.filteringText); setAlarmPageIndex(1); }}
                        />
                      }
                      pagination={
                        <Pagination
                          currentPageIndex={alarmPageIndex}
                          pagesCount={Math.max(1, Math.ceil(filteredAlarms.length / alarmPageSize))}
                          onChange={({ detail }) => setAlarmPageIndex(detail.currentPageIndex)}
                          ariaLabels={{ nextPageLabel: "Next page", previousPageLabel: "Previous page", pageLabel: (n) => `Page ${n}` }}
                        />
                      }
                      empty={alarmEmptyContent}
                    />
                  </SpaceBetween>
                </Container>
              ),
            },
            {
              label: `Metrics (${metrics.length})`,
              id: "metrics",
              content: (
                <Container>
                  <Table
                    items={metrics}
                    columnDefinitions={metricColumns}
                    loading={loading}
                    loadingText="Loading metrics..."
                    empty={<Box textAlign="center">No metrics available.</Box>}
                  />
                </Container>
              ),
            },
            {
              label: `Logs (${logGroups.length})`,
              id: "logs",
              content: (
                <SpaceBetween size="l" direction="vertical">
                  <Container>
                    <Header variant="h2">Log Groups</Header>
                    <Table
                      items={logGroups}
                      columnDefinitions={logGroupColumns}
                      loading={loading}
                      loadingText="Loading log groups..."
                      selectionType="single"
                      selectedItems={selectedLogGroup ? [{ logGroupName: selectedLogGroup } as CloudWatchLogGroup] : []}
                      onSelectionChange={({ detail }) => {
                        const selected = detail.selectedItems as CloudWatchLogGroup[];
                        setSelectedLogGroup(selected.length > 0 && selected[0]?.logGroupName ? selected[0].logGroupName : null);
                      }}
                      empty={<Box textAlign="center">No log groups. <Button onClick={() => setLogGroupModalVisible(true)}>Create log group</Button></Box>}
                    />
                  </Container>
                  {selectedLogGroup && (
                    <Container>
                      <Header variant="h2">Log Streams — {selectedLogGroup}</Header>
                      <Table
                        items={logStreams}
                        columnDefinitions={logStreamColumns}
                        loading={loading}
                        loadingText="Loading streams..."
                        empty={<Box textAlign="center">No log streams found for this group.</Box>}
                      />
                    </Container>
                  )}
                </SpaceBetween>
              ),
            },
            {
              label: "Insights",
              id: "insights",
              content: (
                <Container>
                  <SpaceBetween size="m" direction="vertical">
                    <Header variant="h2">CloudWatch Logs Insights</Header>
                    <FormField label="Query string" description="Use Insights query language (e.g. fields @timestamp, @message | sort @timestamp desc | limit 20)">
                      <Input
                        value={insightsQuery}
                        onChange={({ detail }) => setInsightsQuery(detail.value)}
                        ariaLabel="Insights query"
                      />
                    </FormField>
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button variant="primary" onClick={handleRunInsightsQuery} loading={insightsLoading}>
                        Run query
                      </Button>
                      <Button variant="link" onClick={() => setInsightsQuery("fields @timestamp, @message | sort @timestamp desc | limit 20")}>
                        Reset
                      </Button>
                    </SpaceBetween>
                    {insightsResults.length > 0 && (
                      <Table
                        items={insightsResults}
                        columnDefinitions={Object.keys(insightsResults[0] || {}).map((k) => ({ id: k, header: k, cell: (item: any) => String(item[k] ?? "—") }))}
                        loading={insightsLoading}
                        empty={<Box>No results.</Box>}
                      />
                    )}
                    {insightsResults.length === 0 && !insightsLoading && (
                      <Box>Run a query to see results.</Box>
                    )}
                  </SpaceBetween>
                </Container>
              ),
            },
          ]}
        />
      </SpaceBetween>

      {/* Alarm Create / Edit Modal */}
      <Modal
        visible={alarmModalVisible}
        onDismiss={() => { setAlarmModalVisible(false); setEditingAlarmName(null); }}
        header={editingAlarmName ? "Edit Alarm" : "Create Alarm"}
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => { setAlarmModalVisible(false); setEditingAlarmName(null); }} formAction="none">Cancel</Button>
            <Button variant="primary" onClick={handleCreateAlarm}>Save</Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m" direction="vertical">
          <FormField label="Alarm name" description="Unique identifier for this alarm">
            <Input value={alarmForm.AlarmName || ""} onChange={({ detail }) => setAlarmForm({ ...alarmForm, AlarmName: detail.value })} placeholder="high-cpu-alarm" />
          </FormField>
          <FormField label="Description">
            <Input value={alarmForm.AlarmDescription || ""} onChange={({ detail }) => setAlarmForm({ ...alarmForm, AlarmDescription: detail.value })} placeholder="Alarm when CPU exceeds threshold" />
          </FormField>
          <SpaceBetween direction="horizontal" size="s" alignItems="end">
            <FormField label="Namespace">
              <Select
                selectedOption={alarmForm.Namespace ? { label: alarmForm.Namespace, value: alarmForm.Namespace } : null}
                onChange={({ detail }) => setAlarmForm({ ...alarmForm, Namespace: detail.selectedOption?.value })}
                options={[
                  { label: "AWS/EC2", value: "AWS/EC2" },
                  { label: "AWS/Lambda", value: "AWS/Lambda" },
                  { label: "AWS/RDS", value: "AWS/RDS" },
                  { label: "AWS/DynamoDB", value: "AWS/DynamoDB" },
                ]}
                placeholder="Select namespace"
              />
            </FormField>
            <FormField label="Metric name">
              <Input value={alarmForm.MetricName || ""} onChange={({ detail }) => setAlarmForm({ ...alarmForm, MetricName: detail.value })} placeholder="CPUUtilization" />
            </FormField>
          </SpaceBetween>
          <SpaceBetween direction="horizontal" size="s" alignItems="end">
            <FormField label="Statistic">
              <Select
                selectedOption={alarmForm.Statistic ? { label: alarmForm.Statistic, value: alarmForm.Statistic } : null}
                onChange={({ detail }) => setAlarmForm({ ...alarmForm, Statistic: detail.selectedOption?.value as any })}
                options={[{ label: "Average", value: "Average" }, { label: "Sum", value: "Sum" }, { label: "Minimum", value: "Minimum" }, { label: "Maximum", value: "Maximum" }]}
                placeholder="Average"
              />
            </FormField>
            <FormField label="Period (seconds)">
              <Input value={String(alarmForm.Period ?? "")} onChange={({ detail }) => setAlarmForm({ ...alarmForm, Period: Number(detail.value) || 300 })} placeholder="300" />
            </FormField>
          </SpaceBetween>
          <SpaceBetween direction="horizontal" size="s" alignItems="end">
            <FormField label="Threshold">
              <Input value={String(alarmForm.Threshold ?? "")} onChange={({ detail }) => setAlarmForm({ ...alarmForm, Threshold: Number(detail.value) })} placeholder="80" />
            </FormField>
            <FormField label="Comparison">
              <Select
                selectedOption={alarmForm.ComparisonOperator ? { label: alarmForm.ComparisonOperator, value: alarmForm.ComparisonOperator } : null}
                onChange={({ detail }) => setAlarmForm({ ...alarmForm, ComparisonOperator: detail.selectedOption?.value as any })}
                options={[
                  { label: "Greater than", value: "GreaterThanThreshold" },
                  { label: "Greater than or equal to", value: "GreaterThanOrEqualToThreshold" },
                  { label: "Less than", value: "LessThanThreshold" },
                  { label: "Less than or equal to", value: "LessThanOrEqualToThreshold" },
                ]}
                placeholder="Greater than"
              />
            </FormField>
            <FormField label="Evaluation periods">
              <Input value={String(alarmForm.EvaluationPeriods ?? "")} onChange={({ detail }) => setAlarmForm({ ...alarmForm, EvaluationPeriods: Number(detail.value) || 1 })} placeholder="1" />
            </FormField>
          </SpaceBetween>
        </SpaceBetween>
      </Modal>

      {/* Log Group Create Modal */}
      <Modal
        visible={logGroupModalVisible}
        onDismiss={() => setLogGroupModalVisible(false)}
        header="Create Log Group"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setLogGroupModalVisible(false)} formAction="none">Cancel</Button>
            <Button variant="primary" onClick={handleCreateLogGroup}>Create</Button>
          </SpaceBetween>
        }
      >
        <FormField label="Log group name" description="Name for the new log group (e.g. /aws/ec2/my-app)">
          <Input value={logGroupNameInput} onChange={({ detail }) => setLogGroupNameInput(detail.value)} placeholder="/aws/lambda/my-function" />
        </FormField>
      </Modal>
    </div>
  );
}
