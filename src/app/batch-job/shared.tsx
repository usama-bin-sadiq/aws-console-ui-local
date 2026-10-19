"use client";

import React, { useEffect, useState } from "react";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Alert from "@cloudscape-design/components/alert";
import Grid from "@cloudscape-design/components/grid";
import type { TableProps } from "@cloudscape-design/components/table";
import type { StatusIndicatorProps } from "@cloudscape-design/components/status-indicator";
import { apiFetch } from "@/lib/api-client";
import type { CrossServiceLink } from "@/components/CrossServiceLinks";
import type { Tag as EditorTag } from "@/components/TagEditor";
import type { BatchApiResponse, CEState, CEStatus, JobStatus } from "@/types/batch";

// ─── API helpers ──────────────────────────────────────────────────────────────

function unwrap(res: Response, data: BatchApiResponse): BatchApiResponse {
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

/** GET /api/batch with the given action/params. Throws on any failure. */
export async function getBatch(
  params: Record<string, string | undefined>,
): Promise<BatchApiResponse> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) qs.set(key, value);
  }
  const res = await apiFetch(`/api/batch?${qs.toString()}`);
  const data = (await res.json()) as BatchApiResponse;
  return unwrap(res, data);
}

/** POST /api/batch with a JSON payload. Throws on any failure. */
export async function postBatch(payload: Record<string, unknown>): Promise<BatchApiResponse> {
  const res = await apiFetch("/api/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as BatchApiResponse;
  return unwrap(res, data);
}

/** DELETE /api/batch — deregisters/deletes one named resource. */
export async function deleteBatchResource(
  type: "computeEnvironment" | "jobQueue" | "jobDefinition",
  name: string,
): Promise<BatchApiResponse> {
  const res = await apiFetch(`/api/batch?type=${type}&name=${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  const data = (await res.json()) as BatchApiResponse;
  return unwrap(res, data);
}

// ─── Status mapping (colour always paired with text/icon) ────────────────────

export function ceStateType(state?: CEState): StatusIndicatorProps.Type {
  switch (state) {
    case "ENABLED":
      return "success";
    case "DISABLED":
      return "stopped";
    default:
      return "info";
  }
}

export function ceStatusType(status?: CEStatus): StatusIndicatorProps.Type {
  switch (status) {
    case "VALID":
      return "success";
    case "CREATING":
    case "UPDATING":
      return "in-progress";
    case "INVALID":
      return "error";
    case "DELETING":
    case "DELETED":
      return "stopped";
    default:
      return "info";
  }
}

export function jobStatusType(status?: JobStatus): StatusIndicatorProps.Type {
  switch (status) {
    case "SUCCEEDED":
      return "success";
    case "FAILED":
      return "error";
    case "RUNNING":
    case "STARTING":
    case "PENDING":
      return "in-progress";
    case "SUBMITTED":
    case "RUNNABLE":
      return "info";
    default:
      return "info";
  }
}

export function jdStatusType(status?: string): StatusIndicatorProps.Type {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "INACTIVE":
      return "stopped";
    default:
      return "info";
  }
}

/** Job statuses that count as "still running" for delete warnings. */
export const ACTIVE_JOB_STATUSES: JobStatus[] = [
  "SUBMITTED",
  "PENDING",
  "RUNNABLE",
  "STARTING",
  "RUNNING",
];

/**
 * Counts jobs in SUBMITTED…RUNNING state across the given queues.
 * Failures propagate — warnings are never silently dropped.
 */
export async function countActiveJobsInQueues(queues: string[]): Promise<number> {
  let total = 0;
  for (const queue of queues) {
    const data = await getBatch({
      action: "listJobs",
      jobQueue: queue,
      jobStatus: ACTIVE_JOB_STATUSES.join(","),
    });
    total += (data.jobSummaryList || []).length;
  }
  return total;
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function formatTs(ms?: number): string {
  if (!ms || ms <= 0) return "—";
  return new Date(ms).toLocaleString();
}

export function recordToTags(record?: Record<string, string>): EditorTag[] {
  if (!record) return [];
  return Object.entries(record).map(([key, value]) => ({ key, value }));
}

export function tagsToRecord(tags: EditorTag[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const tag of tags) {
    const key = tag.key.trim();
    if (key) out[key] = tag.value;
  }
  return out;
}

/** Validates tag rows before save. Returns an error message or null. */
export function validateTagRows(tags: EditorTag[]): string | null {
  const keys = tags.map((t) => t.key.trim()).filter(Boolean);
  if (keys.length !== tags.filter((t) => t.key.trim() || t.value.trim()).length) {
    return "Every tag with a value needs a key.";
  }
  if (new Set(keys).size !== keys.length) return "Tag keys must be unique.";
  return null;
}

/** Splits comma/newline separated text into a clean list. */
export function parseList(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinList(list?: string[]): string {
  return list && list.length > 0 ? list.join(", ") : "—";
}

/** Client-side sort for list tables (Cloudscape sortingColumn state). */
export function sortItems<T extends object>(
  items: T[],
  sortingColumn: TableProps.SortingColumn<T> | null,
  descending: boolean,
): T[] {
  if (!sortingColumn) return items;
  const field = sortingColumn.sortingField as keyof T | undefined;
  const comparator = sortingColumn.sortingComparator;
  if (!field && !comparator) return items;
  const sorted = [...items].sort((a, b) => {
    let cmp = 0;
    if (comparator) {
      cmp = comparator(a, b);
    } else if (field) {
      const aVal = a[field];
      const bVal = b[field];
      if (aVal === bVal) cmp = 0;
      else if (aVal === null || aVal === undefined) cmp = -1;
      else if (bVal === null || bVal === undefined) cmp = 1;
      else if (typeof aVal === "number" && typeof bVal === "number") cmp = aVal - bVal;
      else cmp = String(aVal) < String(bVal) ? -1 : 1;
    }
    return descending ? -cmp : cmp;
  });
  return sorted;
}

/** "arn:aws:batch:…:job-definition/name:3" → "name:3" */
export function shortName(arnOrName?: string): string {
  if (!arnOrName) return "—";
  const parts = arnOrName.split("/");
  return parts[parts.length - 1] || arnOrName;
}

// ─── Cross-page notice (survives navigation, consumed once) ───────────────────

const NOTICE_KEY = "aws-batch-console-notice";

export function setBatchNotice(message: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(NOTICE_KEY, message);
  } catch {
    // storage unavailable — notice simply won't persist
  }
}

export function takeBatchNotice(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const message = window.sessionStorage.getItem(NOTICE_KEY);
    if (message) window.sessionStorage.removeItem(NOTICE_KEY);
    return message;
  } catch {
    return null;
  }
}

// ─── Job submit overrides (recorded so the detail page can show them) ────────

export interface RecordedOverrides {
  vcpus?: string;
  memory?: string;
  command?: string[];
  recordedAt: number;
}

const OVERRIDES_KEY = "aws-batch-job-overrides";

export function recordJobOverrides(
  jobId: string,
  overrides: Omit<RecordedOverrides, "recordedAt">,
): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.sessionStorage.getItem(OVERRIDES_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, RecordedOverrides>) : {};
    all[jobId] = { ...overrides, recordedAt: Date.now() };
    window.sessionStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
  } catch {
    // recording is best-effort; the tab still renders an honest empty state
  }
}

export function readJobOverrides(jobId: string): RecordedOverrides | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(OVERRIDES_KEY);
    if (!raw) return null;
    const all = JSON.parse(raw) as Record<string, RecordedOverrides>;
    return all[jobId] ?? null;
  } catch {
    return null;
  }
}

// ─── Related links ────────────────────────────────────────────────────────────

export const BATCH_RELATED_LINKS: CrossServiceLink[] = [
  { label: "IAM roles", href: "/iam", description: "Job and execution roles" },
  { label: "ECR repositories", href: "/ecr-repo", description: "Container images" },
  { label: "VPC", href: "/vpc", description: "Network for compute environments" },
  { label: "Subnets", href: "/subnet", description: "Subnet selection" },
  { label: "Security groups", href: "/security-group", description: "Job networking rules" },
  { label: "CloudWatch Logs", href: "/cloudwatch-logs", description: "Job log streams" },
  { label: "EC2 instances", href: "/ec2", description: "Compute capacity" },
];

// ─── Detail key/value item ────────────────────────────────────────────────────

export function DetailItem({ label, children }: { label: string; children?: React.ReactNode }) {
  const content = children === undefined || children === null || children === "" ? "—" : children;
  return (
    <div>
      <Box variant="small" color="text-label">
        {label}
      </Box>
      <Box>{content}</Box>
    </div>
  );
}

// ─── Name/value row editor (environment variables) ───────────────────────────

export interface NameValueRow {
  name: string;
  value: string;
}

export function NameValueEditor({
  rows,
  onChange,
  addLabel = "Add environment variable",
  nameLabel = "Name",
  valueLabel = "Value",
}: {
  rows: NameValueRow[];
  onChange: (rows: NameValueRow[]) => void;
  addLabel?: string;
  nameLabel?: string;
  valueLabel?: string;
}) {
  const update = (index: number, patch: Partial<NameValueRow>): void => {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  return (
    <SpaceBetween size="s">
      {rows.length > 0 && (
        <Grid gridDefinition={[{ colspan: 5 }, { colspan: 5 }, { colspan: 2 }]}>
          <Box variant="awsui-key-label">{nameLabel}</Box>
          <Box variant="awsui-key-label">{valueLabel}</Box>
          <Box variant="awsui-key-label" />
        </Grid>
      )}
      {rows.map((row, index) => (
        <Grid key={index} gridDefinition={[{ colspan: 5 }, { colspan: 5 }, { colspan: 2 }]}>
          <FormField>
            <Input
              value={row.name}
              onChange={({ detail }) => update(index, { name: detail.value })}
              placeholder={nameLabel}
              ariaLabel={`${nameLabel} ${index + 1}`}
            />
          </FormField>
          <FormField>
            <Input
              value={row.value}
              onChange={({ detail }) => update(index, { value: detail.value })}
              placeholder={valueLabel}
              ariaLabel={`${valueLabel} ${index + 1}`}
            />
          </FormField>
          <Box padding={{ top: "xs" }}>
            <Button
              variant="icon"
              iconName="remove"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              ariaLabel={`Remove ${nameLabel.toLowerCase()} ${index + 1}`}
            />
          </Box>
        </Grid>
      ))}
      <Button iconName="add-plus" onClick={() => onChange([...rows, { name: "", value: "" }])}>
        {addLabel}
      </Button>
    </SpaceBetween>
  );
}

// ─── Typed confirmation modal (warning + optional reason) ────────────────────

const PAST_TENSE: Record<string, string> = {
  delete: "deleted",
  terminate: "terminated",
  cancel: "canceled",
  deregister: "deregistered",
  disable: "disabled",
  enable: "enabled",
};

export interface TypedActionModalProps {
  visible: boolean;
  /** Modal header, e.g. "Terminate job" */
  title: string;
  /** The exact string the user must type to confirm (case-sensitive) */
  resourceName: string;
  /** Human-readable resource type shown in the copy, e.g. "job" */
  resourceType: string;
  /** Confirm button label; doubles as the verb for the warning copy */
  actionLabel?: string;
  /** Extra warning shown in a warning Alert (e.g. active job counts) */
  warning?: string;
  /** When set, renders a required reason input (Terminate/Cancel need one) */
  reasonLabel?: string;
  reasonPlaceholder?: string;
  loading?: boolean;
  onConfirm: (reason: string) => void;
  onDismiss: () => void;
}

/**
 * Cloudscape Modal with typed confirmation, matching the AWS console
 * copy for irreversible Batch operations. Used when extra content
 * (warnings/reasons) is required beyond the shared ConfirmModal.
 */
export function TypedActionModal({
  visible,
  title,
  resourceName,
  resourceType,
  actionLabel = "Delete",
  warning,
  reasonLabel,
  reasonPlaceholder,
  loading = false,
  onConfirm,
  onDismiss,
}: TypedActionModalProps) {
  const [typedValue, setTypedValue] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (visible) {
      setTypedValue("");
      setReason("");
    }
  }, [visible, resourceName]);

  const verb = actionLabel.toLowerCase();
  const pastTense = PAST_TENSE[verb] ?? `${verb}d`;
  const typedConfirmed = typedValue === resourceName;
  const reasonOk = !reasonLabel || reason.trim().length > 0;
  const canConfirm = typedConfirmed && reasonOk && !loading;

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      header={title}
      closeAriaLabel="Close modal"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onDismiss} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!canConfirm}
              loading={loading}
              onClick={() => {
                if (canConfirm) onConfirm(reason.trim());
              }}
            >
              {actionLabel}
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <Alert type="warning" statusIconAriaLabel="Warning">
          {warning ??
            `This action cannot be undone. The ${resourceType} ${resourceName} will be permanently ${pastTense}.`}
        </Alert>

        {reasonLabel && (
          <FormField
            label={reasonLabel}
            constraintText="Required. This reason is recorded in the job's status history."
          >
            <Input
              value={reason}
              onChange={({ detail }) => setReason(detail.value)}
              placeholder={reasonPlaceholder}
              ariaLabel={reasonLabel}
              disabled={loading}
            />
          </FormField>
        )}

        <FormField
          label={
            <>
              To confirm, type{" "}
              <Box variant="span" fontWeight="bold">
                {resourceName}
              </Box>{" "}
              in the field below.
            </>
          }
        >
          <Input
            value={typedValue}
            onChange={({ detail }) => setTypedValue(detail.value)}
            placeholder={resourceName}
            ariaLabel={`Type ${resourceName} to confirm`}
            disabled={loading}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}
