"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import Alert from "@cloudscape-design/components/alert";
import Table, { TableProps } from "@cloudscape-design/components/table";
import ConfirmModal from "@/components/ConfirmModal";
import TagEditor, { Tag } from "@/components/TagEditor";
import TruncatedText from "@/components/TruncatedText";
import type { JobQueueDetail } from "@/types/batch";
import {
  countActiveJobsInQueues,
  deleteBatchResource,
  DetailItem,
  getBatch,
  postBatch,
  recordToTags,
  setBatchNotice,
  takeBatchNotice,
  tagsToRecord,
  TypedActionModal,
  validateTagRows,
} from "../../shared";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

const CE_COLUMN_DEFINITIONS: TableProps.ColumnDefinition<{
  order: number;
  name: string;
  orderPreference: string;
  arn: string;
}>[] = [
  {
    id: "order",
    header: "Order",
    cell: (item) => String(item.order),
    width: 100,
  },
  {
    id: "name",
    header: "Compute environment",
    isRowHeader: true,
    cell: (item) => item.name,
  },
  {
    id: "orderPreference",
    header: "Order preference",
    cell: (item) => item.orderPreference,
    width: 180,
  },
  {
    id: "arn",
    header: "ARN",
    cell: (item) => <TruncatedText maxLength={70}>{item.arn}</TruncatedText>,
  },
];

export default function JobQueueDetailPage() {
  const params = useParams<{ name: string }>();
  const router = useRouter();
  const name = decodeURIComponent(params.name);

  const [queue, setQueue] = useState<JobQueueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [activeJobs, setActiveJobs] = useState<number | null>(null);

  // Tags
  const [tagDraft, setTagDraft] = useState<Tag[]>([]);
  const [savingTags, setSavingTags] = useState(false);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const [checkingJobs, setCheckingJobs] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBatch({ action: "describeJobQueues", jobQueue: name });
      const found = (data.jobQueues || []).find((item) => item.jobQueueName === name);
      if (found) {
        setQueue(found);
        setNotFound(false);
        setTagDraft(recordToTags(found.tags));
      } else {
        setQueue(null);
        setNotFound(true);
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to fetch job queue"));
      setQueue(null);
    } finally {
      setLoading(false);
    }
  }, [name]);

  const loadActiveJobs = useCallback(async () => {
    try {
      setActiveJobs(await countActiveJobsInQueues([name]));
    } catch {
      // The count is advisory — leave it unknown rather than block the page.
      setActiveJobs(null);
    }
  }, [name]);

  useEffect(() => {
    const notice = takeBatchNotice();
    if (notice)
      queueMicrotask(() => {
        setSuccess(notice);
      });
    queueMicrotask(() => {
      load();
    });
    queueMicrotask(() => {
      void loadActiveJobs();
    });
  }, [load, loadActiveJobs]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 6000);
    return () => clearTimeout(timer);
  }, [success]);

  // ── Enable / disable ──────────────────────────────────────────────────────

  const runStateChange = useCallback(
    async (nextState: "ENABLED" | "DISABLED") => {
      setUpdating(true);
      setError(null);
      try {
        await postBatch({ action: "updateJobQueue", jobQueue: name, state: nextState });
        setSuccess(`Job queue "${name}" ${nextState === "ENABLED" ? "enabled" : "disabled"}.`);
        await load();
        await loadActiveJobs();
      } catch (err: unknown) {
        setError(errorMessage(err, "Failed to update job queue"));
      } finally {
        setUpdating(false);
      }
    },
    [name, load, loadActiveJobs],
  );

  // ── Tags ──────────────────────────────────────────────────────────────────

  const saveTags = useCallback(async () => {
    if (!queue?.jobQueueArn) return;
    const rowError = validateTagRows(tagDraft);
    if (rowError) {
      setError(rowError);
      return;
    }
    const original = queue.tags || {};
    const draft = tagsToRecord(tagDraft);
    const removedKeys = Object.keys(original).filter((k) => !(k in draft));
    const changed = Object.entries(draft).filter(([k, v]) => original[k] !== v);
    if (removedKeys.length === 0 && changed.length === 0) {
      setSuccess("No tag changes to save.");
      return;
    }
    setSavingTags(true);
    setError(null);
    try {
      if (changed.length > 0) {
        await postBatch({
          action: "tagResource",
          resourceArn: queue.jobQueueArn,
          tags: Object.fromEntries(changed),
        });
      }
      if (removedKeys.length > 0) {
        await postBatch({
          action: "untagResource",
          resourceArn: queue.jobQueueArn,
          tagKeys: removedKeys,
        });
      }
      setSuccess("Tags updated.");
      await load();
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to update tags"));
    } finally {
      setSavingTags(false);
    }
  }, [queue, tagDraft, load]);

  // ── Delete ────────────────────────────────────────────────────────────────

  const openDelete = useCallback(async () => {
    setCheckingJobs(true);
    setError(null);
    try {
      const active = await countActiveJobsInQueues([name]);
      setDeleteWarning(
        active > 0
          ? `You have ${active} active job(s) in this job queue. Deleting the queue will prevent new jobs from being scheduled, and active jobs must finish or be cancelled first.`
          : undefined,
      );
      setDeleteOpen(true);
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not check for active jobs — deletion was not started"));
    } finally {
      setCheckingJobs(false);
    }
  }, [name]);

  const handleConfirmDelete = useCallback(async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteBatchResource("jobQueue", name);
      setBatchNotice(`Job queue "${name}" deleted.`);
      router.push("/batch-job/job-queues");
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to delete job queue"));
      setDeleteOpen(false);
      setDeleting(false);
      await load();
    }
  }, [name, router, load]);

  // ── Compute environment rows ──────────────────────────────────────────────

  const ceRows = useMemo(
    () =>
      [...(queue?.computeEnvironmentOrder || [])]
        .sort((a, b) => a.order - b.order)
        .map((order) => ({
          order: order.order,
          name: order.computeEnvironment,
          orderPreference: String(order.order),
          arn: "",
        })),
    [queue],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box padding="m" textAlign="center">
        <SpaceBetween size="s">
          <Spinner size="large" />
          <Box color="text-body-secondary">Loading job queue…</Box>
        </SpaceBetween>
      </Box>
    );
  }

  if (notFound || !queue) {
    return (
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <Button onClick={() => router.push("/batch-job/job-queues")}>Back to list</Button>
          }
        >
          {name}
        </Header>
        <Box textAlign="center" color="inherit">
          <Box margin={{ bottom: "s" }}>
            <Icon name="folder" size="large" />
          </Box>
          <Box variant="strong">Job queue not found</Box>
          <Box variant="p" padding={{ bottom: "s" }}>
            {`"${name}" does not exist, or it was deleted before this page loaded.`}
          </Box>
          <Button variant="primary" onClick={() => router.push("/batch-job/job-queues")}>
            Back to job queues
          </Button>
        </Box>
      </SpaceBetween>
    );
  }

  const overviewTab = (
    <ColumnLayout columns={3} variant="default">
      <DetailItem label="Name">{queue.jobQueueName}</DetailItem>
      <DetailItem label="ARN">
        <TruncatedText maxLength={80}>{queue.jobQueueArn || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="State">
        <StatusIndicator type={queue.state === "ENABLED" ? "success" : "stopped"}>
          {queue.state || "—"}
        </StatusIndicator>
      </DetailItem>
      <DetailItem label="Status">
        <StatusIndicator
          type={
            queue.status === "VALID" ? "success" : queue.status === "INVALID" ? "error" : "info"
          }
        >
          {queue.status || "—"}
        </StatusIndicator>
      </DetailItem>
      <DetailItem label="Status reason">
        <TruncatedText maxLength={80}>{queue.statusReason || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="Priority">
        {queue.priority !== undefined ? String(queue.priority) : "—"}
      </DetailItem>
      <DetailItem label="Scheduling policy">
        <TruncatedText maxLength={70}>{queue.schedulingPolicyArn || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="Job queue type">{queue.jobQueueType || "—"}</DetailItem>
      <DetailItem label="Active jobs">{activeJobs === null ? "—" : String(activeJobs)}</DetailItem>
      <DetailItem label="Compute environments">
        {ceRows.length > 0 ? ceRows.map((row) => `${row.order + 1}. ${row.name}`).join(" · ") : "—"}
      </DetailItem>
      <DetailItem label="Job state time limit actions">
        {(queue.jobStateTimeLimitActions || []).length > 0
          ? (queue.jobStateTimeLimitActions || [])
              .map((a) => `${a.action} after ${a.maxTimeSeconds}s (${a.reason})`)
              .join(", ")
          : "—"}
      </DetailItem>
    </ColumnLayout>
  );

  const computeEnvironmentsTab = (
    <Table
      variant="container"
      columnDefinitions={CE_COLUMN_DEFINITIONS}
      items={ceRows}
      trackBy="name"
      loading={loading}
      loadingText="Loading compute environments…"
      empty={
        <Box textAlign="center" color="inherit">
          <Box margin={{ bottom: "s" }}>
            <Icon name="folder" size="large" />
          </Box>
          <Box variant="strong">No compute environments</Box>
          <Box variant="p" padding={{ bottom: "s" }}>
            This queue has no compute environments attached, so it cannot schedule jobs.
          </Box>
        </Box>
      }
    />
  );

  const tagsTab = (
    <SpaceBetween size="m">
      <Box color="text-body-secondary">
        Tags are key-value pairs you can use to organize and identify this resource. AWS Batch
        supports up to 50 tags per resource.
      </Box>
      <TagEditor tags={tagDraft} onChange={setTagDraft} readOnly={!queue.jobQueueArn} />
      <Box>
        <Button
          variant="primary"
          onClick={() => void saveTags()}
          loading={savingTags}
          disabled={!queue.jobQueueArn}
        >
          Save changes
        </Button>
      </Box>
    </SpaceBetween>
  );

  return (
    <SpaceBetween size="l">
      <Header
        variant="h2"
        description={queue.state && queue.status ? `${queue.state} · ${queue.status}` : undefined}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              iconName="refresh"
              onClick={() => {
                void load();
                void loadActiveJobs();
              }}
              ariaLabel="Refresh"
            >
              Refresh
            </Button>
            <Button
              disabled={updating}
              loading={updating}
              onClick={() =>
                void runStateChange(queue.state === "ENABLED" ? "DISABLED" : "ENABLED")
              }
            >
              {queue.state === "ENABLED" ? "Disable" : "Enable"}
            </Button>
            <ButtonDropdown
              ariaLabel="More actions"
              onItemClick={({ detail }) => {
                if (detail.id === "delete") void openDelete();
              }}
              items={[{ id: "delete", text: "Delete" }]}
            >
              Actions
            </ButtonDropdown>
          </SpaceBetween>
        }
      >
        {queue.jobQueueName}
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

      <Tabs
        tabs={[
          { label: "Overview", id: "overview", content: overviewTab },
          {
            label: "Compute environments",
            id: "compute-environments",
            content: computeEnvironmentsTab,
          },
          { label: "Tags", id: "tags", content: tagsTab },
        ]}
      />

      {deleteOpen && deleteWarning ? (
        <TypedActionModal
          visible={deleteOpen}
          title="Delete job queue"
          resourceName={queue.jobQueueName || ""}
          resourceType="job queue"
          actionLabel="Delete"
          warning={deleteWarning}
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onDismiss={() => setDeleteOpen(false)}
        />
      ) : (
        <ConfirmModal
          visible={deleteOpen}
          resourceName={queue.jobQueueName || ""}
          resourceType="job queue"
          actionLabel="Delete"
          onConfirm={handleConfirmDelete}
          onDismiss={() => setDeleteOpen(false)}
          loading={deleting}
        />
      )}

      {checkingJobs && (
        <Alert type="info" statusIconAriaLabel="Information">
          Checking for active jobs…
        </Alert>
      )}
    </SpaceBetween>
  );
}
