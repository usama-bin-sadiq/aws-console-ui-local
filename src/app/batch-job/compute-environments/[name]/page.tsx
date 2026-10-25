"use client";

import { useCallback, useEffect, useState } from "react";
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
import ConfirmModal from "@/components/ConfirmModal";
import TagEditor, { Tag } from "@/components/TagEditor";
import TruncatedText from "@/components/TruncatedText";
import type { ComputeEnvironmentDetail } from "@/types/batch";
import {
  ceStateType,
  ceStatusType,
  countActiveJobsInQueues,
  deleteBatchResource,
  DetailItem,
  getBatch,
  joinList,
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

export default function ComputeEnvironmentDetailPage() {
  const params = useParams<{ name: string }>();
  const router = useRouter();
  const name = decodeURIComponent(params.name);

  const [ce, setCe] = useState<ComputeEnvironmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

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
      const data = await getBatch({
        action: "describeComputeEnvironments",
        computeEnvironment: name,
      });
      const found = (data.computeEnvironments || []).find(
        (item) => item.computeEnvironmentName === name,
      );
      if (found) {
        setCe(found);
        setNotFound(false);
        setTagDraft(recordToTags(found.tags));
      } else {
        setCe(null);
        setNotFound(true);
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to fetch compute environment"));
      setCe(null);
    } finally {
      setLoading(false);
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
  }, [load]);

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
        await postBatch({
          action: "updateComputeEnvironment",
          computeEnvironment: name,
          state: nextState,
        });
        setSuccess(
          `Compute environment "${name}" ${nextState === "ENABLED" ? "enabled" : "disabled"}.`,
        );
        await load();
      } catch (err: unknown) {
        setError(errorMessage(err, "Failed to update compute environment"));
      } finally {
        setUpdating(false);
      }
    },
    [name, load],
  );

  // ── Tags ──────────────────────────────────────────────────────────────────

  const saveTags = useCallback(async () => {
    if (!ce?.computeEnvironmentArn) return;
    const rowError = validateTagRows(tagDraft);
    if (rowError) {
      setError(rowError);
      return;
    }
    const original = ce.tags || {};
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
          resourceArn: ce.computeEnvironmentArn,
          tags: Object.fromEntries(changed),
        });
      }
      if (removedKeys.length > 0) {
        await postBatch({
          action: "untagResource",
          resourceArn: ce.computeEnvironmentArn,
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
  }, [ce, tagDraft, load]);

  // ── Delete ────────────────────────────────────────────────────────────────

  const openDelete = useCallback(async () => {
    setCheckingJobs(true);
    setError(null);
    try {
      const jqData = await getBatch({ action: "describeJobQueues" });
      const queues = (jqData.jobQueues || [])
        .filter((jq) =>
          (jq.computeEnvironmentOrder || []).some((o) => o.computeEnvironment === name),
        )
        .map((jq) => jq.jobQueueName)
        .filter((n): n is string => Boolean(n));
      const activeJobs = await countActiveJobsInQueues(queues);
      setDeleteWarning(
        activeJobs > 0
          ? `You have ${activeJobs} active job(s) running in this compute environment. Deleting it will interrupt running jobs and new jobs cannot be scheduled to it.`
          : undefined,
      );
      setDeleteOpen(true);
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not check for running jobs — deletion was not started"));
    } finally {
      setCheckingJobs(false);
    }
  }, [name]);

  const handleConfirmDelete = useCallback(async () => {
    setDeleting(true);
    setError(null);
    try {
      await deleteBatchResource("computeEnvironment", name);
      setBatchNotice(`Compute environment "${name}" deleted.`);
      router.push("/batch-job/compute-environments");
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to delete compute environment"));
      setDeleteOpen(false);
      setDeleting(false);
      await load();
    }
  }, [name, router, load]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box padding="m" textAlign="center">
        <SpaceBetween size="s">
          <Spinner size="large" />
          <Box color="text-body-secondary">Loading compute environment…</Box>
        </SpaceBetween>
      </Box>
    );
  }

  if (notFound || !ce) {
    return (
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <Button onClick={() => router.push("/batch-job/compute-environments")}>
              Back to list
            </Button>
          }
        >
          {name}
        </Header>
        <Box textAlign="center" color="inherit">
          <Box margin={{ bottom: "s" }}>
            <Icon name="folder" size="large" />
          </Box>
          <Box variant="strong">Compute environment not found</Box>
          <Box variant="p" padding={{ bottom: "s" }}>
            {`"${name}" does not exist, or it was deleted before this page loaded.`}
          </Box>
          <Button variant="primary" onClick={() => router.push("/batch-job/compute-environments")}>
            Back to compute environments
          </Button>
        </Box>
      </SpaceBetween>
    );
  }

  const cr = ce.computeResources;

  const overviewTab = (
    <ColumnLayout columns={3} variant="default">
      <DetailItem label="Name">{ce.computeEnvironmentName}</DetailItem>
      <DetailItem label="ARN">
        <TruncatedText maxLength={80}>{ce.computeEnvironmentArn || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="Type">{ce.type || "—"}</DetailItem>
      <DetailItem label="State">
        <StatusIndicator type={ceStateType(ce.state)}>{ce.state || "—"}</StatusIndicator>
      </DetailItem>
      <DetailItem label="Status">
        <StatusIndicator type={ceStatusType(ce.status)}>{ce.status || "—"}</StatusIndicator>
      </DetailItem>
      <DetailItem label="Status reason">
        <TruncatedText maxLength={80}>{ce.statusReason || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="Service role">
        <TruncatedText maxLength={80}>
          {ce.serviceRole || "Service-linked role (default)"}
        </TruncatedText>
      </DetailItem>
      <DetailItem label="Container orchestration">
        {ce.containerOrchestrationType || "—"}
      </DetailItem>
      <DetailItem label="ECS cluster">
        <TruncatedText maxLength={80}>{ce.ecsClusterArn || "—"}</TruncatedText>
      </DetailItem>
      <DetailItem label="UUID">{ce.uuid || "—"}</DetailItem>
      <DetailItem label="Context">{ce.context || "—"}</DetailItem>
      <DetailItem label="Unmanaged vCPUs">
        {ce.unmanagedvCpus !== undefined ? String(ce.unmanagedvCpus) : "—"}
      </DetailItem>
      {ce.updatePolicy && (
        <DetailItem label="Terminate jobs on update">
          {ce.updatePolicy.terminateJobsOnUpdate ? "Enabled" : "Disabled"}
        </DetailItem>
      )}
    </ColumnLayout>
  );

  const computeResourcesTab =
    ce.type === "MANAGED" && cr ? (
      <ColumnLayout columns={3} variant="default">
        <DetailItem label="Capacity type">{cr.type || "—"}</DetailItem>
        <DetailItem label="Allocation strategy">{cr.allocationStrategy || "—"}</DetailItem>
        <DetailItem label="Instance role">
          <TruncatedText maxLength={60}>{cr.instanceRole || "—"}</TruncatedText>
        </DetailItem>
        <DetailItem label="Min vCPUs">
          {cr.minvCpus !== undefined ? String(cr.minvCpus) : "—"}
        </DetailItem>
        <DetailItem label="Max vCPUs">
          {cr.maxvCpus !== undefined ? String(cr.maxvCpus) : "—"}
        </DetailItem>
        <DetailItem label="Desired vCPUs">
          {cr.desiredvCpus !== undefined ? String(cr.desiredvCpus) : "—"}
        </DetailItem>
        <DetailItem label="Instance types">{joinList(cr.instanceTypes)}</DetailItem>
        <DetailItem label="Subnets">{joinList(cr.subnets)}</DetailItem>
        <DetailItem label="Security groups">{joinList(cr.securityGroupIds)}</DetailItem>
        <DetailItem label="Spot bid percentage">
          {cr.bidPercentage !== undefined ? `${cr.bidPercentage}%` : "—"}
        </DetailItem>
        <DetailItem label="AMI image ID">
          <TruncatedText maxLength={60}>{cr.imageId || "—"}</TruncatedText>
        </DetailItem>
        <DetailItem label="Placement group">{cr.placementGroup || "—"}</DetailItem>
        <DetailItem label="EC2 key pair">{cr.ec2KeyPair || "—"}</DetailItem>
        <DetailItem label="Launch template">
          {cr.launchTemplate
            ? cr.launchTemplate.launchTemplateName || cr.launchTemplate.launchTemplateId || "—"
            : "—"}
        </DetailItem>
        <DetailItem label="Compute resource tags">
          {cr.tags && Object.keys(cr.tags).length > 0
            ? Object.entries(cr.tags)
                .map(([k, v]) => `${k}=${v}`)
                .join(", ")
            : "None"}
        </DetailItem>
        <DetailItem label="EC2 configuration">
          {cr.ec2Configuration && cr.ec2Configuration.length > 0
            ? cr.ec2Configuration.map((c) => c.imageType).join(", ")
            : "—"}
        </DetailItem>
      </ColumnLayout>
    ) : (
      <Box color="text-body-secondary">
        This is an unmanaged compute environment — AWS Batch does not provision or manage compute
        resources for it.
      </Box>
    );

  const tagsTab = (
    <SpaceBetween size="m">
      <Box color="text-body-secondary">
        Tags are key-value pairs you can use to organize and identify this resource. AWS Batch
        supports up to 50 tags per resource.
      </Box>
      <TagEditor tags={tagDraft} onChange={setTagDraft} readOnly={!ce.computeEnvironmentArn} />
      <Box>
        <Button
          variant="primary"
          onClick={() => void saveTags()}
          loading={savingTags}
          disabled={!ce.computeEnvironmentArn}
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
        description={ce.type && ce.status ? `${ce.type} · ${ce.status}` : undefined}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button iconName="refresh" onClick={() => void load()} ariaLabel="Refresh">
              Refresh
            </Button>
            <Button
              disabled={updating}
              loading={updating}
              onClick={() => void runStateChange(ce.state === "ENABLED" ? "DISABLED" : "ENABLED")}
            >
              {ce.state === "ENABLED" ? "Disable" : "Enable"}
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
        {ce.computeEnvironmentName}
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
            label: "Compute resources",
            id: "compute-resources",
            content: computeResourcesTab,
          },
          { label: "Tags", id: "tags", content: tagsTab },
        ]}
      />

      {deleteOpen && deleteWarning ? (
        <TypedActionModal
          visible={deleteOpen}
          title="Delete compute environment"
          resourceName={ce.computeEnvironmentName || ""}
          resourceType="compute environment"
          actionLabel="Delete"
          warning={deleteWarning}
          loading={deleting}
          onConfirm={handleConfirmDelete}
          onDismiss={() => setDeleteOpen(false)}
        />
      ) : (
        <ConfirmModal
          visible={deleteOpen}
          resourceName={ce.computeEnvironmentName || ""}
          resourceType="compute environment"
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
