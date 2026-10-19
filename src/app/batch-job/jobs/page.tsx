"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Flashbar from "@cloudscape-design/components/flashbar";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences, {
  CollectionPreferencesProps,
} from "@cloudscape-design/components/collection-preferences";
import Icon from "@cloudscape-design/components/icon";
import Wizard from "@cloudscape-design/components/wizard";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Alert from "@cloudscape-design/components/alert";
import TagEditor, { Tag } from "@/components/TagEditor";
import TruncatedText from "@/components/TruncatedText";
import type { JobDefinition, JobQueueDetail, JobStatus, JobSummary } from "@/types/batch";
import {
  DetailItem,
  formatTs,
  getBatch,
  jobStatusType,
  NameValueEditor,
  NameValueRow,
  parseList,
  postBatch,
  recordJobOverrides,
  setBatchNotice,
  shortName,
  sortItems,
  takeBatchNotice,
  tagsToRecord,
  TypedActionModal,
} from "../shared";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

const ALL_JOB_STATUSES: JobStatus[] = [
  "SUBMITTED",
  "PENDING",
  "RUNNABLE",
  "STARTING",
  "RUNNING",
  "SUCCEEDED",
  "FAILED",
];

const COLUMN_LABELS: Record<string, string> = {
  name: "Name",
  id: "Job ID",
  status: "Status",
  queue: "Queue",
  definition: "Job definition",
  submitted: "Submitted",
  actions: "Actions",
};

const ALL_COLUMN_IDS = ["name", "id", "status", "queue", "definition", "submitted", "actions"];

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/** Compact identifier for detail links (full UUIDs are unwieldy in the UI). */
function shortJobId(jobId?: string): string {
  if (!jobId) return "—";
  return jobId.length > 12 ? `${jobId.slice(0, 8)}…` : jobId;
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface SubmitForm {
  jobName: string;
  jobQueue: string;
  jobDefinition: string;
  arraySize: string;
  vcpus: string;
  memory: string;
  command: string;
  environment: NameValueRow[];
  retryAttempts: string;
  tags: Tag[];
}

type SubmitErrors = Partial<Record<keyof SubmitForm, string>>;

const EMPTY_SUBMIT_FORM: SubmitForm = {
  jobName: "",
  jobQueue: "",
  jobDefinition: "",
  arraySize: "",
  vcpus: "",
  memory: "",
  command: "",
  environment: [],
  retryAttempts: "",
  tags: [],
};

const STEP_FIELD_KEYS: Record<number, (keyof SubmitForm)[]> = {
  0: ["jobName", "jobQueue", "jobDefinition", "arraySize"],
  1: ["vcpus", "memory", "environment"],
  2: ["retryAttempts"],
  3: [],
};

function computeSubmitErrors(f: SubmitForm): SubmitErrors {
  const errors: SubmitErrors = {};
  const name = f.jobName.trim();
  if (!name) {
    errors.jobName = "Job name is required.";
  } else if (name.length > 128) {
    errors.jobName = "Name must be 128 characters or fewer.";
  } else if (!NAME_PATTERN.test(name)) {
    errors.jobName = "Use only letters, numbers, hyphens, and underscores (no spaces).";
  }

  if (!f.jobQueue) errors.jobQueue = "Select a job queue.";
  if (!f.jobDefinition) errors.jobDefinition = "Select a job definition.";

  if (f.arraySize.trim()) {
    const size = Number(f.arraySize);
    if (!Number.isInteger(size) || size < 2 || size > 10000) {
      errors.arraySize = "Array size must be a whole number from 2 to 10,000.";
    }
  }
  if (f.vcpus.trim()) {
    const vcpus = Number(f.vcpus);
    if (!Number.isFinite(vcpus) || vcpus <= 0) {
      errors.vcpus = "vCPUs override must be a number greater than 0.";
    }
  }
  if (f.memory.trim()) {
    const memory = Number(f.memory);
    if (!Number.isInteger(memory) || memory <= 0) {
      errors.memory = "Memory override must be a whole number greater than 0.";
    }
  }
  const envNames = f.environment.map((row) => row.name.trim()).filter(Boolean);
  if (envNames.length !== f.environment.filter((r) => r.name.trim() || r.value.trim()).length) {
    errors.environment = "Every environment variable needs a name.";
  } else if (new Set(envNames).size !== envNames.length) {
    errors.environment = "Environment variable names must be unique.";
  }
  if (f.retryAttempts.trim()) {
    const attempts = Number(f.retryAttempts);
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > 10) {
      errors.retryAttempts = "Retry attempts must be a whole number from 1 to 10.";
    }
  }

  return errors;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobsPage() {
  const router = useRouter();

  // List state
  const [items, setItems] = useState<JobSummary[]>([]);
  const [queueById, setQueueById] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<JobSummary[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "ALL">("ALL");
  const [queueFilter, setQueueFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortingColumn, setSortingColumn] = useState<TableProps.SortingColumn<JobSummary> | null>(
    null,
  );
  const [sortingDescending, setSortingDescending] = useState(false);
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    pageSize: 25,
    contentDisplay: [],
  });

  // Wizard resources
  const [queues, setQueues] = useState<JobQueueDetail[]>([]);
  const [definitions, setDefinitions] = useState<JobDefinition[]>([]);

  // Submit wizard
  const [wizardActive, setWizardActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<SubmitForm>(EMPTY_SUBMIT_FORM);
  const [formErrors, setFormErrors] = useState<SubmitErrors>({});

  // Terminate / cancel (typed confirmation + reason)
  const [actionModal, setActionModal] = useState<{
    kind: "terminate" | "cancel";
    targets: JobSummary[];
  } | null>(null);
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = statusFilter === "ALL" ? undefined : statusFilter;
      const data = await getBatch({
        action: "listJobs",
        ...(statusParam ? { jobStatus: statusParam } : {}),
        ...(queueFilter ? { jobQueue: queueFilter } : {}),
      });
      const summaries = data.jobSummaryList || [];
      setItems(summaries);

      // listJobs does not return the queue — enrich via describeJobs in pages of 100.
      const enrich: Record<string, string> = {};
      for (let i = 0; i < summaries.length; i += 100) {
        const batch = summaries
          .slice(i, i + 100)
          .map((job) => job.jobId)
          .filter((id): id is string => Boolean(id));
        if (batch.length === 0) continue;
        try {
          const details = await getBatch({
            action: "describeJobs",
            jobIds: batch.join(","),
          });
          for (const job of details.jobs || []) {
            if (job.jobId && job.jobQueue) {
              enrich[job.jobId] = shortName(job.jobQueue);
            }
          }
        } catch {
          // Enrichment is best-effort — the queue column shows "—" instead.
        }
      }
      setQueueById(enrich);
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to fetch jobs"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, queueFilter]);

  const loadWizardResources = useCallback(async () => {
    try {
      const [jqData, jdData] = await Promise.all([
        getBatch({ action: "describeJobQueues" }),
        getBatch({ action: "describeJobDefinitions" }),
      ]);
      setQueues((jqData.jobQueues || []).filter((q) => q.state === "ENABLED"));
      setDefinitions((jdData.jobDefinitions || []).filter((d) => d.status === "ACTIVE"));
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to fetch queues and job definitions for submission"));
    }
  }, []);

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

  // ── Submit wizard ────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setForm(EMPTY_SUBMIT_FORM);
    setFormErrors({});
    setStepIndex(0);
  }, []);

  const validateStep = useCallback(
    (step: number): boolean => {
      const all = computeSubmitErrors(form);
      const keys = STEP_FIELD_KEYS[step] ?? [];
      const subset: SubmitErrors = {};
      for (const key of keys) {
        if (all[key]) subset[key] = all[key];
      }
      setFormErrors((prev) => {
        const next: SubmitErrors = { ...prev };
        for (const key of Object.keys(next) as (keyof SubmitForm)[]) {
          if (keys.includes(key)) delete next[key];
        }
        return { ...next, ...subset };
      });
      return keys.every((key) => !all[key]);
    },
    [form],
  );

  const queueOptions = useMemo(
    () =>
      queues.map((queue) => ({
        label: queue.jobQueueName || "",
        value: queue.jobQueueName || "",
        description: `Priority ${queue.priority ?? 0} · ${
          (queue.computeEnvironmentOrder || []).length
        } compute environment(s)`,
      })),
    [queues],
  );

  const definitionOptions = useMemo(
    () =>
      definitions.map((def) => ({
        label: `${def.jobDefinitionName || ""}${
          def.revision !== undefined ? `:${def.revision}` : ""
        }`,
        value:
          def.revision !== undefined
            ? `${def.jobDefinitionName}:${def.revision}`
            : def.jobDefinitionName || "",
        description: `${def.type || "container"} image: ${
          def.containerProperties?.image ||
          def.nodeProperties?.nodeRangeProperties?.[0]?.container?.image ||
          "—"
        }`,
      })),
    [definitions],
  );

  const handleSubmit = useCallback(async () => {
    const all = computeSubmitErrors(form);
    if (Object.values(all).some(Boolean)) {
      setFormErrors(all);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const environment = form.environment
        .filter((row) => row.name.trim())
        .map((row) => ({ name: row.name.trim(), value: row.value }));

      const hasOverrides =
        Boolean(form.vcpus.trim()) ||
        Boolean(form.memory.trim()) ||
        Boolean(form.command.trim()) ||
        environment.length > 0;

      const payload: Record<string, unknown> = {
        action: "submitJob",
        jobName: form.jobName.trim(),
        jobQueue: form.jobQueue,
        jobDefinition: form.jobDefinition,
      };
      if (form.arraySize.trim()) {
        payload.arrayProperties = { size: Number(form.arraySize) };
      }
      if (hasOverrides) {
        payload.containerOverrides = {
          ...(form.vcpus.trim() ? { vcpus: Number(form.vcpus) } : {}),
          ...(form.memory.trim() ? { memory: Number(form.memory) } : {}),
          ...(form.command.trim() ? { command: parseList(form.command) } : {}),
          ...(environment.length > 0 ? { environment } : {}),
        };
      }
      if (form.retryAttempts.trim()) {
        payload.retryStrategy = { attempts: Number(form.retryAttempts) };
      }
      const tags = tagsToRecord(form.tags);
      if (Object.keys(tags).length > 0) payload.tags = tags;

      const data = await postBatch(payload);
      const jobId = data.jobId;
      if (jobId) {
        // The Batch API does not echo container overrides on describe — record
        // them so the detail page can show exactly what was submitted.
        recordJobOverrides(jobId, {
          vcpus: form.vcpus.trim() || undefined,
          memory: form.memory.trim() || undefined,
          command: form.command.trim() ? parseList(form.command) : undefined,
        });
      }
      setBatchNotice(`Job "${form.jobName.trim()}" submitted.`);
      setWizardActive(false);
      resetForm();
      if (jobId) {
        router.push(`/batch-job/jobs/${encodeURIComponent(jobId)}`);
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to submit job"));
    } finally {
      setSubmitting(false);
    }
  }, [form, resetForm, router]);

  // ── Terminate / cancel ───────────────────────────────────────────────────

  const handleActionConfirm = useCallback(
    async (reason: string) => {
      if (!actionModal) return;
      setActing(true);
      setError(null);
      const failures: string[] = [];
      for (const target of actionModal.targets) {
        if (!target.jobId) continue;
        try {
          await postBatch({
            action: actionModal.kind === "terminate" ? "terminateJob" : "cancelJob",
            jobId: target.jobId,
            reason,
          });
        } catch (err: unknown) {
          failures.push(`${target.jobName || target.jobId}: ${errorMessage(err, "failed")}`);
        }
      }
      setActing(false);
      setActionModal(null);
      setSelectedItems([]);
      if (failures.length > 0) {
        setError(
          `${failures.length} job(s) could not be ${
            actionModal.kind === "terminate" ? "terminated" : "canceled"
          } — ${failures.join("; ")}`,
        );
      } else {
        setSuccess(
          actionModal.targets.length === 1
            ? `Job ${actionModal.kind === "terminate" ? "terminated" : "canceled"}.`
            : `${actionModal.targets.length} jobs ${
                actionModal.kind === "terminate" ? "terminated" : "canceled"
              }.`,
        );
      }
      await load();
    },
    [actionModal, load],
  );

  // ── Table data ───────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    let result = items;
    if (filteringText.trim()) {
      const lower = filteringText.toLowerCase();
      result = result.filter(
        (item) =>
          item.jobName?.toLowerCase().includes(lower) ||
          item.jobId?.toLowerCase().includes(lower) ||
          item.status?.toLowerCase().includes(lower) ||
          shortName(item.jobDefinition).toLowerCase().includes(lower) ||
          (queueById[item.jobId || ""] || "").toLowerCase().includes(lower),
      );
    }
    if (queueFilter) {
      const wanted = shortName(queueFilter).toLowerCase();
      result = result.filter(
        (item) => (queueById[item.jobId || ""] || "").toLowerCase() === wanted,
      );
    }
    return result;
  }, [items, filteringText, queueFilter, queueById]);

  const sortedItems = useMemo(
    () => sortItems(filteredItems, sortingColumn, sortingDescending),
    [filteredItems, sortingColumn, sortingDescending],
  );

  const pageSize = preferences.pageSize ?? 25;
  const visibleColumnIds = useMemo(() => {
    const cd = preferences.contentDisplay;
    if (!cd || cd.length === 0) return null;
    return cd.flatMap((entry) =>
      entry.type === "group" ? entry.children.map((c) => c.id) : entry.visible ? [entry.id] : [],
    );
  }, [preferences.contentDisplay]);

  const columnDefinitions = useMemo<TableProps.ColumnDefinition<JobSummary>[]>(() => {
    const all: TableProps.ColumnDefinition<JobSummary>[] = [
      {
        id: "name",
        header: "Name",
        isRowHeader: true,
        sortingField: "jobName",
        cell: (item) => (
          <Button
            variant="link"
            formAction="none"
            onClick={() => router.push(`/batch-job/jobs/${encodeURIComponent(item.jobId || "")}`)}
          >
            {item.jobName || "—"}
          </Button>
        ),
      },
      {
        id: "id",
        header: "Job ID",
        cell: (item) => <TruncatedText maxLength={20}>{shortJobId(item.jobId)}</TruncatedText>,
        width: 140,
      },
      {
        id: "status",
        header: "Status",
        sortingField: "status",
        cell: (item) => (
          <StatusIndicator type={jobStatusType(item.status)}>{item.status || "—"}</StatusIndicator>
        ),
        width: 140,
      },
      {
        id: "queue",
        header: "Queue",
        cell: (item) => queueById[item.jobId || ""] || "—",
      },
      {
        id: "definition",
        header: "Job definition",
        cell: (item) => (
          <TruncatedText maxLength={40}>{shortName(item.jobDefinition)}</TruncatedText>
        ),
      },
      {
        id: "submitted",
        header: "Submitted",
        sortingField: "createdAt",
        cell: (item) => formatTs(item.createdAt),
        width: 180,
      },
      {
        id: "actions",
        header: "Actions",
        cell: (item) => (
          <ButtonDropdown
            ariaLabel={`Actions for ${item.jobName || "job"}`}
            onItemClick={({ detail }) => {
              if (detail.id === "details") {
                router.push(`/batch-job/jobs/${encodeURIComponent(item.jobId || "")}`);
              } else if (detail.id === "terminate") {
                setActionModal({ kind: "terminate", targets: [item] });
              } else if (detail.id === "cancel") {
                setActionModal({ kind: "cancel", targets: [item] });
              }
            }}
            items={[
              { id: "details", text: "View details" },
              { id: "terminate", text: "Terminate" },
              { id: "cancel", text: "Cancel" },
            ]}
          >
            Actions
          </ButtonDropdown>
        ),
      },
    ];
    return visibleColumnIds ? all.filter((c) => c.id && visibleColumnIds.includes(c.id)) : all;
  }, [visibleColumnIds, router, queueById]);

  const pagedItems = sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ── Wizard steps ─────────────────────────────────────────────────────────

  const wizardSteps = [
    {
      title: "Job details",
      description: "Name the job and choose the queue and job definition to run it with.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Job name"
            constraintText="Required. Up to 128 characters; letters, numbers, hyphens, and underscores only."
            errorText={formErrors.jobName}
          >
            <Input
              value={form.jobName}
              onChange={({ detail }) => {
                setForm((prev) => ({ ...prev, jobName: detail.value }));
                setFormErrors((prev) => ({ ...prev, jobName: undefined }));
              }}
              placeholder="my-batch-job"
              ariaLabel="Job name"
            />
          </FormField>
          <FormField
            label="Job queue"
            constraintText="Required. Only enabled queues accept new jobs."
            errorText={formErrors.jobQueue}
          >
            <Select
              selectedOption={queueOptions.find((option) => option.value === form.jobQueue) ?? null}
              onChange={({ detail }) => {
                const selected = detail.selectedOption;
                setForm((prev) => ({
                  ...prev,
                  jobQueue: selected && "value" in selected && selected.value ? selected.value : "",
                }));
                setFormErrors((prev) => ({ ...prev, jobQueue: undefined }));
              }}
              options={queueOptions}
              placeholder="Select a job queue"
              filteringType="auto"
              filteringPlaceholder="Filter job queues"
              filteringAriaLabel="Filter job queues"
              ariaLabel="Job queue"
              disabled={queueOptions.length === 0}
            />
          </FormField>
          <FormField
            label="Job definition"
            constraintText="Required. The latest revision of each active job definition is shown."
            errorText={formErrors.jobDefinition}
          >
            <Select
              selectedOption={
                definitionOptions.find((option) => option.value === form.jobDefinition) ?? null
              }
              onChange={({ detail }) => {
                const selected = detail.selectedOption;
                setForm((prev) => ({
                  ...prev,
                  jobDefinition:
                    selected && "value" in selected && selected.value ? selected.value : "",
                }));
                setFormErrors((prev) => ({ ...prev, jobDefinition: undefined }));
              }}
              options={definitionOptions}
              placeholder="Select a job definition"
              filteringType="auto"
              filteringPlaceholder="Filter job definitions"
              filteringAriaLabel="Filter job definitions"
              ariaLabel="Job definition"
              disabled={definitionOptions.length === 0}
            />
          </FormField>
          <FormField
            label="Array size"
            constraintText="Optional. Number of array children to submit (2–10,000). Leave blank for a single job."
            errorText={formErrors.arraySize}
          >
            <Input
              type="number"
              value={form.arraySize}
              onChange={({ detail }) => {
                setForm((prev) => ({ ...prev, arraySize: detail.value }));
                setFormErrors((prev) => ({ ...prev, arraySize: undefined }));
              }}
              placeholder="10"
              ariaLabel="Array size"
            />
          </FormField>
          {queueOptions.length === 0 && (
            <Alert type="info" statusIconAriaLabel="Information">
              No enabled job queues are available. Create a job queue first, then come back to
              submit this job.
            </Alert>
          )}
          {definitionOptions.length === 0 && (
            <Alert type="info" statusIconAriaLabel="Information">
              No active job definitions are available. Register a job definition first, then come
              back to submit this job.
            </Alert>
          )}
        </SpaceBetween>
      ),
    },
    {
      title: "Container overrides",
      description: "Optional. Override the job definition's container settings for this run only.",
      content: (
        <SpaceBetween size="l">
          <ColumnLayout columns={2}>
            <FormField
              label="vCPUs"
              constraintText="Optional. Overrides the job definition's vCPUs."
              errorText={formErrors.vcpus}
            >
              <Input
                type="number"
                value={form.vcpus}
                onChange={({ detail }) => {
                  setForm((prev) => ({ ...prev, vcpus: detail.value }));
                  setFormErrors((prev) => ({ ...prev, vcpus: undefined }));
                }}
                placeholder="Use job definition value"
                ariaLabel="vCPUs override"
              />
            </FormField>
            <FormField
              label="Memory (MiB)"
              constraintText="Optional. Overrides the job definition's memory."
              errorText={formErrors.memory}
            >
              <Input
                type="number"
                value={form.memory}
                onChange={({ detail }) => {
                  setForm((prev) => ({ ...prev, memory: detail.value }));
                  setFormErrors((prev) => ({ ...prev, memory: undefined }));
                }}
                placeholder="Use job definition value"
                ariaLabel="Memory override"
              />
            </FormField>
          </ColumnLayout>
          <FormField
            label="Command"
            constraintText="Optional. Overrides the container command for this run. Separate entries with commas."
          >
            <Input
              value={form.command}
              onChange={({ detail }) => setForm((prev) => ({ ...prev, command: detail.value }))}
              placeholder="/bin/echo, hello"
              ariaLabel="Command override"
            />
          </FormField>
          <FormField
            label="Environment variables"
            description="Additional environment variables for this run. Variables defined by the job definition are replaced by name."
            errorText={formErrors.environment}
          >
            <NameValueEditor
              rows={form.environment}
              onChange={(environment) => {
                setForm((prev) => ({ ...prev, environment }));
                setFormErrors((prev) => ({ ...prev, environment: undefined }));
              }}
              addLabel="Add environment override"
            />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Retry and tags",
      description: "Optional. Configure retries for this run and add tags.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Retry attempts"
            constraintText="Optional. Overrides the job definition's retry strategy (1–10)."
            errorText={formErrors.retryAttempts}
          >
            <Input
              type="number"
              value={form.retryAttempts}
              onChange={({ detail }) => {
                setForm((prev) => ({ ...prev, retryAttempts: detail.value }));
                setFormErrors((prev) => ({ ...prev, retryAttempts: undefined }));
              }}
              placeholder="Use job definition value"
              ariaLabel="Retry attempts"
            />
          </FormField>
          <FormField label="Tags" description="Key-value pairs attached to this job.">
            <TagEditor
              tags={form.tags}
              onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
            />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Review",
      description: "Review the job before submitting it.",
      content: (
        <Container header={<Header variant="h3">Review summary</Header>}>
          <ColumnLayout columns={3} variant="default">
            <DetailItem label="Job name">{form.jobName.trim() || "—"}</DetailItem>
            <DetailItem label="Job queue">{form.jobQueue || "—"}</DetailItem>
            <DetailItem label="Job definition">{form.jobDefinition || "—"}</DetailItem>
            <DetailItem label="Array size">{form.arraySize.trim() || "1"}</DetailItem>
            <DetailItem label="vCPUs override">{form.vcpus.trim() || "None"}</DetailItem>
            <DetailItem label="Memory override (MiB)">{form.memory.trim() || "None"}</DetailItem>
            <DetailItem label="Command override">{form.command.trim() || "None"}</DetailItem>
            <DetailItem label="Environment overrides">
              {form.environment.filter((r) => r.name.trim()).length > 0
                ? form.environment
                    .filter((r) => r.name.trim())
                    .map((r) => `${r.name}=${r.value}`)
                    .join(", ")
                : "None"}
            </DetailItem>
            <DetailItem label="Retry attempts">
              {form.retryAttempts.trim() || "Use job definition value"}
            </DetailItem>
            <DetailItem label="Tags">
              {form.tags.filter((t) => t.key.trim()).length > 0
                ? form.tags
                    .filter((t) => t.key.trim())
                    .map((t) => `${t.key}=${t.value}`)
                    .join(", ")
                : "None"}
            </DetailItem>
          </ColumnLayout>
        </Container>
      ),
    },
  ];

  if (wizardActive) {
    return (
      <SpaceBetween size="l">
        <Header variant="h1">Submit job</Header>
        {error && (
          <Flashbar
            items={[
              {
                id: "create-error",
                type: "error",
                content: error,
                dismissible: true,
                onDismiss: () => setError(null),
              },
            ]}
          />
        )}
        <Container>
          <Wizard
            steps={wizardSteps}
            activeStepIndex={stepIndex}
            onNavigate={({ detail }) => {
              if (detail.requestedStepIndex > stepIndex) {
                for (let step = stepIndex; step < detail.requestedStepIndex; step++) {
                  if (!validateStep(step)) return;
                }
              }
              setStepIndex(detail.requestedStepIndex);
            }}
            onCancel={() => {
              setWizardActive(false);
              setError(null);
              resetForm();
            }}
            onSubmit={handleSubmit}
            submitButtonText={submitting ? "Submitting…" : "Submit job"}
            i18nStrings={{
              stepNumberLabel: (stepNumber: number) => `Step ${stepNumber}`,
              navigationAriaLabel: "Submit job wizard navigation",
              nextButton: "Next",
              previousButton: "Previous",
              cancelButton: "Cancel",
            }}
          />
        </Container>
      </SpaceBetween>
    );
  }

  return (
    <SpaceBetween size="l">
      <Header
        variant="h2"
        counter={`(${items.length})`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              iconName="refresh"
              onClick={() => void load()}
              loading={loading}
              ariaLabel="Refresh"
            >
              Refresh
            </Button>
            <ButtonDropdown
              ariaLabel="Bulk actions"
              disabled={selectedItems.length === 0}
              onItemClick={({ detail }) => {
                if (detail.id === "terminate") {
                  setActionModal({ kind: "terminate", targets: selectedItems });
                } else if (detail.id === "cancel") {
                  setActionModal({ kind: "cancel", targets: selectedItems });
                } else if (detail.id === "clear") {
                  setSelectedItems([]);
                }
              }}
              items={[
                { id: "terminate", text: "Terminate" },
                { id: "cancel", text: "Cancel" },
                { id: "clear", text: "Clear selection" },
              ]}
            >
              Actions
            </ButtonDropdown>
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                void loadWizardResources();
                setWizardActive(true);
              }}
            >
              Submit job
            </Button>
          </SpaceBetween>
        }
      >
        Jobs
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

      <SpaceBetween size="s">
        <ColumnLayout columns={2}>
          <FormField label="Status">
            <Select
              selectedOption={{
                label: statusFilter === "ALL" ? "All statuses" : statusFilter,
                value: statusFilter,
              }}
              onChange={({ detail }) => {
                const selected = detail.selectedOption;
                if (selected && "value" in selected && selected.value) {
                  setStatusFilter(selected.value as JobStatus | "ALL");
                  setCurrentPage(1);
                }
              }}
              options={[
                { label: "All statuses", value: "ALL" },
                ...ALL_JOB_STATUSES.map((status) => ({
                  label: status,
                  value: status,
                })),
              ]}
              ariaLabel="Filter by status"
            />
          </FormField>
          <FormField label="Job queue">
            <Select
              selectedOption={
                queueFilter
                  ? {
                      label: shortName(queueFilter),
                      value: queueFilter,
                    }
                  : { label: "All queues", value: "" }
              }
              onChange={({ detail }) => {
                const selected = detail.selectedOption;
                if (selected && "value" in selected) {
                  setQueueFilter(selected.value ?? "");
                  setCurrentPage(1);
                }
              }}
              options={[
                { label: "All queues", value: "" },
                ...queues.map((queue) => ({
                  label: queue.jobQueueName || "",
                  value: queue.jobQueueName || "",
                })),
              ]}
              ariaLabel="Filter by job queue"
              filteringType="auto"
              filteringPlaceholder="Filter job queues"
              filteringAriaLabel="Filter job queues in list filter"
            />
          </FormField>
        </ColumnLayout>
        {queues.length === 0 && (
          <Button variant="link" formAction="none" onClick={() => void loadWizardResources()}>
            Load queues for filtering
          </Button>
        )}
      </SpaceBetween>

      <Table
        columnDefinitions={columnDefinitions}
        items={pagedItems}
        loading={loading}
        loadingText="Loading jobs..."
        selectionType="multi"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems as JobSummary[])}
        trackBy="jobId"
        sortingColumn={sortingColumn ?? undefined}
        sortingDescending={sortingDescending}
        onSortingChange={({ detail }) => {
          setSortingColumn(detail.sortingColumn);
          setSortingDescending(detail.isDescending ?? false);
          setCurrentPage(1);
        }}
        filter={
          <TextFilter
            filteringText={filteringText}
            filteringPlaceholder="Filter jobs"
            filteringAriaLabel="Filter jobs"
            onChange={({ detail }) => {
              setFilteringText(detail.filteringText);
              setCurrentPage(1);
            }}
            countText={
              filteringText
                ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                : `${items.length} jobs`
            }
          />
        }
        pagination={
          <Pagination
            currentPageIndex={currentPage}
            pagesCount={Math.max(1, Math.ceil(sortedItems.length / pageSize))}
            onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
            ariaLabels={{
              nextPageLabel: "Next page",
              previousPageLabel: "Previous page",
              pageLabel: (n) => `Page ${n}`,
            }}
          />
        }
        preferences={
          <CollectionPreferences
            title="Preferences"
            confirmLabel="Confirm"
            cancelLabel="Cancel"
            preferences={preferences}
            pageSizePreference={{
              title: "Page size",
              options: [
                { value: 10, label: "10 jobs" },
                { value: 25, label: "25 jobs" },
                { value: 50, label: "50 jobs" },
                { value: 100, label: "100 jobs" },
              ],
            }}
            contentDisplayPreference={{
              title: "Select visible columns",
              options: ALL_COLUMN_IDS.map((id) => ({
                id,
                label: COLUMN_LABELS[id] ?? id,
              })),
            }}
            onConfirm={({ detail }) => {
              setPreferences({
                pageSize: detail.pageSize ?? 25,
                contentDisplay: detail.contentDisplay,
              });
              setCurrentPage(1);
            }}
          />
        }
        empty={
          <Box textAlign="center" color="inherit">
            <Box margin={{ bottom: "s" }}>
              <Icon name="folder" size="large" />
            </Box>
            <Box variant="strong" textAlign="center" color="inherit">
              No jobs found
            </Box>
            <Box variant="p" padding={{ bottom: "s" }} color="inherit">
              {filteringText || statusFilter !== "ALL" || queueFilter
                ? "No jobs match your filters. Try a different search."
                : "To get started, submit a job."}
            </Box>
            {!filteringText && statusFilter === "ALL" && !queueFilter && (
              <Button
                formAction="none"
                onClick={() => {
                  resetForm();
                  void loadWizardResources();
                  setWizardActive(true);
                }}
              >
                Submit job
              </Button>
            )}
          </Box>
        }
      />

      {actionModal && (
        <TypedActionModal
          visible={true}
          title={actionModal.kind === "terminate" ? "Terminate job" : "Cancel job"}
          resourceName={
            actionModal.targets.length === 1
              ? actionModal.targets[0]?.jobName || actionModal.targets[0]?.jobId || ""
              : `${actionModal.targets.length} jobs`
          }
          resourceType="job"
          actionLabel={actionModal.kind === "terminate" ? "Terminate" : "Cancel"}
          warning={
            actionModal.targets.length > 1
              ? `This will ${
                  actionModal.kind === "terminate" ? "terminate" : "cancel"
                } ${actionModal.targets.length} jobs. ${
                  actionModal.kind === "terminate"
                    ? "Terminating sends SIGTERM to running containers and cannot be undone."
                    : "Cancelling prevents queued jobs from starting. Running jobs continue until they finish."
                }`
              : undefined
          }
          reasonLabel="Reason"
          reasonPlaceholder={
            actionModal.kind === "terminate"
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
