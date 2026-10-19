"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Flashbar from "@cloudscape-design/components/flashbar";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Tabs from "@cloudscape-design/components/tabs";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Icon from "@cloudscape-design/components/icon";
import Spinner from "@cloudscape-design/components/spinner";
import Table, { TableProps } from "@cloudscape-design/components/table";
import TagEditor, { Tag } from "@/components/TagEditor";
import TruncatedText from "@/components/TruncatedText";
import type { AttemptDetail, JobDetail, JobStatus } from "@/types/batch";
import {
  DetailItem,
  formatTs,
  getBatch,
  jobStatusType,
  postBatch,
  readJobOverrides,
  recordToTags,
  shortName,
  takeBatchNotice,
  TypedActionModal,
} from "../../shared";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/** Statuses in which Terminate/Cancel still have an effect. */
const TERMINABLE_STATUSES: JobStatus[] = [
  "SUBMITTED",
  "PENDING",
  "RUNNABLE",
  "STARTING",
  "RUNNING",
];

interface AttemptRow {
  index: number;
  startedAt?: number;
  stoppedAt?: number;
  statusReason?: string;
  exitCode?: number;
  reason?: string;
  logStreamName?: string;
}

const ATTEMPT_COLUMNS: TableProps.ColumnDefinition<AttemptRow>[] = [
  {
    id: "index",
    header: "Attempt",
    isRowHeader: true,
    cell: (item) => String(item.index),
    width: 100,
  },
  {
    id: "startedAt",
    header: "Started",
    cell: (item) => formatTs(item.startedAt),
  },
  {
    id: "stoppedAt",
    header: "Stopped",
    cell: (item) => formatTs(item.stoppedAt),
  },
  {
    id: "exitCode",
    header: "Exit code",
    cell: (item) => (item.exitCode !== undefined ? String(item.exitCode) : "—"),
    width: 110,
  },
  {
    id: "reason",
    header: "Reason",
    cell: (item) => <TruncatedText maxLength={50}>{item.reason || "—"}</TruncatedText>,
  },
  {
    id: "logStream",
    header: "Log stream",
    cell: (item) => <TruncatedText maxLength={50}>{item.logStreamName || "—"}</TruncatedText>,
  },
];

export default function JobDetailPage() {
  const params = useParams<{ jobId: string }>();
  const router = useRouter();
  const jobId = decodeURIComponent(params.jobId);

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [actionModal, setActionModal] = useState<"terminate" | "cancel" | null>(null);
  const [overrides, setOverrides] = useState<{
    vcpus?: string;
    memory?: string;
    command?: string[];
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBatch({ action: "describeJobs", jobIds: jobId });
      const found = (data.jobs || []).find((item) => item.jobId === jobId);
      if (found) {
        setJob(found);
        setNotFound(false);
        setOverrides(readJobOverrides(jobId));
      } else {
        setJob(null);
        setNotFound(true);
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to fetch job"));
      setJob(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    const notice = takeBatchNotice();
    if (notice) setSuccess(notice);
    load();
  }, [load]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 6000);
    return () => clearTimeout(timer);
  }, [success]);

  // Refresh while the job is still moving through the queue.
  useEffect(() => {
    if (!job?.status || !TERMINABLE_STATUSES.includes(job.status)) return;
    const timer = setInterval(() => {
      void load();
    }, 15000);
    return () => clearInterval(timer);
  }, [job?.status, load]);

  // ── Terminate / cancel ───────────────────────────────────────────────────

  const handleActionConfirm = useCallback(
    async (reason: string) => {
      if (!actionModal) return;
      setActing(true);
      setError(null);
      try {
        await postBatch({
          action: actionModal === "terminate" ? "terminateJob" : "cancelJob",
          jobId,
          reason,
        });
        setSuccess(
          actionModal === "terminate"
            ? "Job termination requested."
            : "Job cancellation requested.",
        );
        setActionModal(null);
        await load();
      } catch (err: unknown) {
        setError(
          errorMessage(
            err,
            actionModal === "terminate" ? "Failed to terminate job" : "Failed to cancel job",
          ),
        );
        setActionModal(null);
      } finally {
        setActing(false);
      }
    },
    [actionModal, jobId, load],
  );

  // ── Derived display data ─────────────────────────────────────────────────

  const attemptRows = useMemo<AttemptRow[]>(
    () =>
      (job?.attempts || []).map((attempt: AttemptDetail, index: number) => ({
        index: index + 1,
        startedAt: attempt.startedAt,
        stoppedAt: attempt.stoppedAt,
        statusReason: attempt.statusReason,
        exitCode: attempt.container?.exitCode,
        reason: attempt.container?.reason || attempt.statusReason,
        logStreamName: attempt.container?.logStreamName,
      })),
    [job],
  );

  const tagRows = useMemo<Tag[]>(() => recordToTags(job?.tags), [job]);

  const isActive = !!job?.status && TERMINABLE_STATUSES.includes(job.status);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box padding="m" textAlign="center">
        <SpaceBetween size="s">
          <Spinner size="large" />
          <Box color="text-body-secondary">Loading job…</Box>
        </SpaceBetween>
      </Box>
    );
  }

  if (notFound || !job) {
    return (
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={<Button onClick={() => router.push("/batch-job/jobs")}>Back to list</Button>}
        >
          {jobId}
        </Header>
        <Box textAlign="center" color="inherit">
          <Box margin={{ bottom: "s" }}>
            <Icon name="folder" size="large" />
          </Box>
          <Box variant="strong">Job not found</Box>
          <Box variant="p" padding={{ bottom: "s" }}>
            {`No job with ID "${jobId}" exists, or it is outside the retention window.`}
          </Box>
          <Button variant="primary" onClick={() => router.push("/batch-job/jobs")}>
            Back to jobs
          </Button>
        </Box>
      </SpaceBetween>
    );
  }

  const container = job.container;

  const overviewTab = (
    <ColumnLayout columns={3} variant="default">
      <DetailItem label="Job name">{job.jobName}</DetailItem>
      <DetailItem label="Job ID">
        <TruncatedText maxLength={40}>{job.jobId || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="ARN">
        <TruncatedText maxLength={80}>{job.jobArn || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="Status">
        <StatusIndicator type={jobStatusType(job.status)}>{job.status || "—"}</StatusIndicator>
      </DetailItem>
      <DetailItem label="Status reason">
        <TruncatedText maxLength={80}>{job.statusReason || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="Queue">
        <TruncatedText maxLength={60}>{shortName(job.jobQueue)}</TruncatedText>
      </DetailItem>
      <DetailItem label="Job definition">
        <TruncatedText maxLength={60}>{shortName(job.jobDefinition)}</TruncatedText>
      </DetailItem>
      <DetailItem label="Share identifier">{job.shareIdentifier || "—"}</DetailItem>
      <DetailItem label="Scheduling priority">
        {job.schedulingPriority !== undefined ? String(job.schedulingPriority) : "—"}
      </DetailItem>
      <DetailItem label="Created">{formatTs(job.createdAt)}</DetailItem>
      <DetailItem label="Started">{formatTs(job.startedAt)}</DetailItem>
      <DetailItem label="Stopped">{formatTs(job.stoppedAt)}</DetailItem>
      <DetailItem label="Retry attempts">
        {job.retryStrategy?.attempts !== undefined ? String(job.retryStrategy.attempts) : "1"}
      </DetailItem>
      <DetailItem label="Array properties">
        {job.arrayProperties?.size !== undefined ? `Size ${job.arrayProperties.size}` : "—"}
      </DetailItem>
      <DetailItem label="Timeout (seconds)">
        {job.timeout?.attemptDurationSeconds !== undefined
          ? String(job.timeout.attemptDurationSeconds)
          : "—"}
      </DetailItem>
      <DetailItem label="Depends on">
        {(job.dependsOn || []).length > 0
          ? (job.dependsOn || [])
              .map((dep) => `${dep.jobId || "—"}${dep.type ? ` (${dep.type})` : ""}`)
              .join(", ")
          : "None"}
      </DetailItem>
      <DetailItem label="Parameters">
        {job.parameters && Object.keys(job.parameters).length > 0
          ? Object.entries(job.parameters)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ")
          : "None"}
      </DetailItem>
      <DetailItem label="Container image">
        <TruncatedText maxLength={60}>{container?.image || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="Exit code">
        {container?.exitCode !== undefined ? String(container.exitCode) : "—"}
      </DetailItem>
      <DetailItem label="Container reason">
        <TruncatedText maxLength={60}>{container?.reason || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="Log stream">
        <TruncatedText maxLength={60}>{container?.logStreamName || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="vCPUs used">
        {container?.vcpus !== undefined ? String(container.vcpus) : "—"}
      </DetailItem>
      <DetailItem label="Memory used (MiB)">
        {container?.memory !== undefined ? String(container.memory) : "—"}
      </DetailItem>
      <DetailItem label="Propagate tags">
        {job.propagateTags === undefined ? "—" : job.propagateTags ? "Yes" : "No"}
      </DetailItem>
    </ColumnLayout>
  );

  const attemptsTab = (
    <Table
      variant="container"
      columnDefinitions={ATTEMPT_COLUMNS}
      items={attemptRows}
      trackBy={(item) => String(item.index)}
      header={<Header counter={`(${attemptRows.length})`}>Attempts</Header>}
      empty={
        <Box textAlign="center" color="inherit">
          <Box margin={{ bottom: "s" }}>
            <Icon name="folder" size="large" />
          </Box>
          <Box variant="strong">No attempts yet</Box>
          <Box variant="p" padding={{ bottom: "s" }}>
            This job has not started running, so there are no attempts to show.
          </Box>
        </Box>
      }
    />
  );

  const overridesTab = (
    <SpaceBetween size="m">
      <Box color="text-body-secondary">
        Container overrides are recorded at submission time. The Batch API does not return them on
        describe, so overrides submitted from another session or console may not appear here.
      </Box>
      {overrides ? (
        <ColumnLayout columns={3} variant="default">
          <DetailItem label="vCPUs override">{overrides.vcpus || "None"}</DetailItem>
          <DetailItem label="Memory override (MiB)">{overrides.memory || "None"}</DetailItem>
          <DetailItem label="Command override">
            {overrides.command && overrides.command.length > 0
              ? overrides.command.join(" ")
              : "None"}
          </DetailItem>
        </ColumnLayout>
      ) : (
        <Box textAlign="center" color="inherit">
          <Box margin={{ bottom: "s" }}>
            <Icon name="folder" size="large" />
          </Box>
          <Box variant="strong">No overrides recorded</Box>
          <Box variant="p" padding={{ bottom: "s" }}>
            This job was submitted without container overrides, or it was submitted in a different
            browser session.
          </Box>
        </Box>
      )}
    </SpaceBetween>
  );

  const tagsTab = (
    <SpaceBetween size="m">
      <Box color="text-body-secondary">
        Job tags are set when the job is submitted and are read-only — the Batch API does not
        support tagging an existing job.
      </Box>
      <TagEditor tags={tagRows} onChange={() => undefined} readOnly />
    </SpaceBetween>
  );

  return (
    <SpaceBetween size="l">
      <Header
        variant="h2"
        description={job.status ? `Status: ${job.status}` : undefined}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button iconName="refresh" onClick={() => void load()} ariaLabel="Refresh">
              Refresh
            </Button>
            <ButtonDropdown
              ariaLabel="More actions"
              disabled={!isActive}
              onItemClick={({ detail }) => {
                if (detail.id === "terminate") setActionModal("terminate");
                else if (detail.id === "cancel") setActionModal("cancel");
              }}
              items={[
                { id: "terminate", text: "Terminate" },
                { id: "cancel", text: "Cancel" },
              ]}
            >
              Actions
            </ButtonDropdown>
          </SpaceBetween>
        }
      >
        {job.jobName || jobId}
      </Header>

      <Flashbar
        items={[
          ...(error
            ? [
                {
                  id: "error",
                  type: "error" as const,
                  content: error,
                  dismissible: true,
                  onDismiss: () => setError(null),
                },
              ]
            : []),
          ...(success
            ? [
                {
                  id: "success",
                  type: "success" as const,
                  content: success,
                  dismissible: true,
                  onDismiss: () => setSuccess(null),
                },
              ]
            : []),
        ]}
      />

      {!isActive && job.status && (
        <Box color="text-body-secondary">
          This job is {job.status.toLowerCase()} — Terminate and Cancel are only available while a
          job is queued or running.
        </Box>
      )}

      <Tabs
        tabs={[
          { label: "Overview", id: "overview", content: overviewTab },
          { label: "Attempts", id: "attempts", content: attemptsTab },
          { label: "Container overrides", id: "overrides", content: overridesTab },
          { label: "Tags", id: "tags", content: tagsTab },
        ]}
      />

      {actionModal && (
        <TypedActionModal
          visible={true}
          title={actionModal === "terminate" ? "Terminate job" : "Cancel job"}
          resourceName={job.jobName || jobId}
          resourceType="job"
          actionLabel={actionModal === "terminate" ? "Terminate" : "Cancel"}
          reasonLabel="Reason"
          reasonPlaceholder={
            actionModal === "terminate"
              ? "e.g. workload completed unexpectedly"
              : "e.g. inputs no longer valid"
          }
          loading={acting}
          onConfirm={(reason) => void handleActionConfirm(reason)}
          onDismiss={() => setActionModal(null)}
        />
      )}
    </SpaceBetween>
  );
}
