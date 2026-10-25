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
import Select from "@cloudscape-design/components/select";
import FormField from "@cloudscape-design/components/form-field";
import Table, { TableProps } from "@cloudscape-design/components/table";
import ConfirmModal from "@/components/ConfirmModal";
import TagEditor, { Tag } from "@/components/TagEditor";
import TruncatedText from "@/components/TruncatedText";
import type { JobDefinition } from "@/types/batch";
import {
  deleteBatchResource,
  DetailItem,
  getBatch,
  joinList,
  jdStatusType,
  postBatch,
  recordToTags,
  setBatchNotice,
  takeBatchNotice,
  tagsToRecord,
  validateTagRows,
} from "../../shared";

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

interface EnvRow {
  name: string;
  value: string;
}

const ENV_COLUMNS: TableProps.ColumnDefinition<EnvRow>[] = [
  { id: "name", header: "Name", isRowHeader: true, cell: (item) => item.name },
  { id: "value", header: "Value", cell: (item) => item.value },
];

export default function JobDefinitionDetailPage() {
  const params = useParams<{ name: string }>();
  const router = useRouter();
  // The [name] segment is "name:revision" for a pinned revision, or just
  // "name" for the latest ACTIVE revision.
  const raw = decodeURIComponent(params.name);
  const colonIndex = raw.indexOf(":");
  const baseName = colonIndex >= 0 ? raw.slice(0, colonIndex) : raw;
  const pinnedRevision =
    colonIndex >= 0 && Number.isFinite(Number(raw.slice(colonIndex + 1)))
      ? Number(raw.slice(colonIndex + 1))
      : undefined;

  const [revisions, setRevisions] = useState<JobDefinition[]>([]);
  const [definition, setDefinition] = useState<JobDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Tags
  const [tagDraft, setTagDraft] = useState<Tag[]>([]);
  const [savingTags, setSavingTags] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBatch({
        action: "describeJobDefinitions",
        jobDefinitionName: baseName,
      });
      const all = (data.jobDefinitions || []).filter((item) => item.jobDefinitionName === baseName);
      if (all.length === 0) {
        setRevisions([]);
        setDefinition(null);
        setNotFound(true);
      } else {
        const sorted = [...all].sort((a, b) => (b.revision ?? 0) - (a.revision ?? 0));
        setRevisions(sorted);
        const chosen =
          pinnedRevision !== undefined
            ? sorted.find((item) => item.revision === pinnedRevision)
            : sorted[0];
        if (chosen) {
          setDefinition(chosen);
          setNotFound(false);
          setTagDraft(recordToTags(chosen.tags));
        } else {
          setDefinition(null);
          setNotFound(true);
        }
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to fetch job definition"));
      setDefinition(null);
    } finally {
      setLoading(false);
    }
  }, [baseName, pinnedRevision]);

  useEffect(() => {
    const notice = takeBatchNotice();
    if (notice)
      queueMicrotask(() => {
        setSuccess(notice);
      });
    queueMicrotask(() => {
      load();
    });
  }, [load]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 6000);
    return () => clearTimeout(timer);
  }, [success]);

  // ── Tags ──────────────────────────────────────────────────────────────────

  const saveTags = useCallback(async () => {
    if (!definition?.jobDefinitionArn) return;
    const rowError = validateTagRows(tagDraft);
    if (rowError) {
      setError(rowError);
      return;
    }
    const original = definition.tags || {};
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
          resourceArn: definition.jobDefinitionArn,
          tags: Object.fromEntries(changed),
        });
      }
      if (removedKeys.length > 0) {
        await postBatch({
          action: "untagResource",
          resourceArn: definition.jobDefinitionArn,
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
  }, [definition, tagDraft, load]);

  // ── Deregister ────────────────────────────────────────────────────────────

  const handleConfirmDelete = useCallback(async () => {
    if (!definition) return;
    setDeleting(true);
    setError(null);
    try {
      const ref =
        definition.revision !== undefined
          ? `${definition.jobDefinitionName}:${definition.revision}`
          : definition.jobDefinitionName || "";
      await deleteBatchResource("jobDefinition", ref);
      setBatchNotice(`Job definition "${ref}" deregistered.`);
      router.push("/batch-job/job-definitions");
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to deregister job definition"));
      setDeleteOpen(false);
      setDeleting(false);
      await load();
    }
  }, [definition, router, load]);

  // ── Derived display data ──────────────────────────────────────────────────

  const envRows = useMemo<EnvRow[]>(
    () =>
      (definition?.containerProperties?.environment || [])
        .filter((pair) => pair.name)
        .map((pair) => ({ name: pair.name || "", value: pair.value || "" })),
    [definition],
  );

  const revisionOptions = useMemo(
    () =>
      revisions.map((item) => ({
        label: `Revision ${item.revision ?? "?"}`,
        value: String(item.revision ?? ""),
        description: item.status || "",
      })),
    [revisions],
  );

  const selectedRevision = useMemo(() => {
    if (!definition) return null;
    const value = String(definition.revision ?? "");
    return revisionOptions.find((option) => option.value === value) ?? null;
  }, [definition, revisionOptions]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box padding="m" textAlign="center">
        <SpaceBetween size="s">
          <Spinner size="large" />
          <Box color="text-body-secondary">Loading job definition…</Box>
        </SpaceBetween>
      </Box>
    );
  }

  if (notFound || !definition) {
    return (
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <Button onClick={() => router.push("/batch-job/job-definitions")}>Back to list</Button>
          }
        >
          {raw}
        </Header>
        <Box textAlign="center" color="inherit">
          <Box margin={{ bottom: "s" }}>
            <Icon name="folder" size="large" />
          </Box>
          <Box variant="strong">Job definition not found</Box>
          <Box variant="p" padding={{ bottom: "s" }}>
            {`"${raw}" does not exist, or it was deregistered before this page loaded.`}
          </Box>
          <Button variant="primary" onClick={() => router.push("/batch-job/job-definitions")}>
            Back to job definitions
          </Button>
        </Box>
      </SpaceBetween>
    );
  }

  const cp = definition.containerProperties;
  const timeout = definition.timeout;
  const overviewTab = (
    <ColumnLayout columns={3} variant="default">
      <DetailItem label="Name">{definition.jobDefinitionName}</DetailItem>
      <DetailItem label="Revision">
        {definition.revision !== undefined ? String(definition.revision) : "—"}
      </DetailItem>
      <DetailItem label="ARN">
        <TruncatedText maxLength={80}>{definition.jobDefinitionArn || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="Type">{definition.type || "—"}</DetailItem>
      <DetailItem label="Status">
        <StatusIndicator type={jdStatusType(definition.status)}>
          {definition.status || "—"}
        </StatusIndicator>
      </DetailItem>
      <DetailItem label="Platform capabilities">
        {joinList(definition.platformCapabilities)}
      </DetailItem>
      <DetailItem label="Container image">
        <TruncatedText maxLength={60}>
          {cp?.image ||
            definition.nodeProperties?.nodeRangeProperties?.[0]?.container?.image ||
            "—"}
        </TruncatedText>
      </DetailItem>
      <DetailItem label="vCPUs">
        {cp?.vcpus !== undefined
          ? String(cp.vcpus)
          : cp?.resourceRequirements?.find((r) => r.type === "VCPU")?.value || "—"}
      </DetailItem>
      <DetailItem label="Memory (MiB)">
        {cp?.memory !== undefined
          ? String(cp.memory)
          : cp?.resourceRequirements?.find((r) => r.type === "MEMORY")?.value || "—"}
      </DetailItem>
      <DetailItem label="Command">
        {cp?.command && cp.command.length > 0 ? cp.command.join(" ") : "—"}
      </DetailItem>
      <DetailItem label="Job role ARN">
        <TruncatedText maxLength={70}>{cp?.jobRoleArn || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="Execution role ARN">
        <TruncatedText maxLength={70}>{cp?.executionRoleArn || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="User">{cp?.user || "—"}</DetailItem>
      <DetailItem label="Privileged">
        {cp?.privileged === undefined ? "—" : cp.privileged ? "Yes" : "No"}
      </DetailItem>
      <DetailItem label="Read-only root filesystem">
        {cp?.readonlyRootFilesystem === undefined ? "—" : cp.readonlyRootFilesystem ? "Yes" : "No"}
      </DetailItem>
      <DetailItem label="Timeout (seconds)">
        {timeout?.attemptDurationSeconds !== undefined
          ? String(timeout.attemptDurationSeconds)
          : "—"}
      </DetailItem>
      <DetailItem label="Retry attempts">
        {definition.retryStrategy?.attempts !== undefined
          ? String(definition.retryStrategy.attempts)
          : "1"}
      </DetailItem>
      <DetailItem label="Nodes">
        {definition.nodeProperties?.numNodes !== undefined
          ? String(definition.nodeProperties.numNodes)
          : "—"}
      </DetailItem>
      <DetailItem label="Propagate tags to resources">
        {definition.propagateTags === undefined ? "—" : definition.propagateTags ? "Yes" : "No"}
      </DetailItem>
      <DetailItem label="Parameters">
        {definition.parameters && Object.keys(definition.parameters).length > 0
          ? Object.entries(definition.parameters)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ")
          : "None"}
      </DetailItem>
    </ColumnLayout>
  );

  const environmentTab = (
    <Table
      variant="container"
      columnDefinitions={ENV_COLUMNS}
      items={envRows}
      trackBy="name"
      header={<Header counter={`(${envRows.length})`}>Environment variables</Header>}
      empty={
        <Box textAlign="center" color="inherit">
          <Box margin={{ bottom: "s" }}>
            <Icon name="folder" size="large" />
          </Box>
          <Box variant="strong">No environment variables</Box>
          <Box variant="p" padding={{ bottom: "s" }}>
            This job definition does not define any environment variables.
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
      <TagEditor tags={tagDraft} onChange={setTagDraft} readOnly={!definition.jobDefinitionArn} />
      <Box>
        <Button
          variant="primary"
          onClick={() => void saveTags()}
          loading={savingTags}
          disabled={!definition.jobDefinitionArn}
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
        description={
          definition.type && definition.status
            ? `${definition.type} · ${definition.status}`
            : undefined
        }
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button iconName="refresh" onClick={() => void load()} ariaLabel="Refresh">
              Refresh
            </Button>
            <ButtonDropdown
              ariaLabel="More actions"
              onItemClick={({ detail }) => {
                if (detail.id === "delete") setDeleteOpen(true);
              }}
              items={[{ id: "delete", text: "Deregister" }]}
            >
              Actions
            </ButtonDropdown>
          </SpaceBetween>
        }
      >
        {definition.jobDefinitionName}
        {definition.revision !== undefined ? `:${definition.revision}` : ""}
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

      {revisions.length > 1 && (
        <FormField
          label="Revision"
          description="Job definitions are immutable — each registration creates a new revision."
        >
          <Select
            selectedOption={selectedRevision}
            onChange={({ detail }) => {
              const selected = detail.selectedOption;
              if (selected && "value" in selected && selected.value) {
                router.push(
                  `/batch-job/job-definitions/${encodeURIComponent(
                    `${baseName}:${selected.value}`,
                  )}`,
                );
              }
            }}
            options={revisionOptions}
            ariaLabel="Job definition revision"
          />
        </FormField>
      )}

      <Tabs
        tabs={[
          { label: "Properties", id: "properties", content: overviewTab },
          { label: "Environment", id: "environment", content: environmentTab },
          { label: "Tags", id: "tags", content: tagsTab },
        ]}
      />

      <ConfirmModal
        visible={deleteOpen}
        resourceName={
          definition.revision !== undefined
            ? `${definition.jobDefinitionName}:${definition.revision}`
            : definition.jobDefinitionName || ""
        }
        resourceType="job definition"
        actionLabel="Deregister"
        onConfirm={handleConfirmDelete}
        onDismiss={() => setDeleteOpen(false)}
        loading={deleting}
      />
    </SpaceBetween>
  );
}
