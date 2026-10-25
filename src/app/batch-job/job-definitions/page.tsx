"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import RadioGroup from "@cloudscape-design/components/radio-group";
import Checkbox from "@cloudscape-design/components/checkbox";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Alert from "@cloudscape-design/components/alert";
import ConfirmModal from "@/components/ConfirmModal";
import TagEditor, { Tag } from "@/components/TagEditor";
import TruncatedText from "@/components/TruncatedText";
import type { JobDefinition, JobDefinitionType, PlatformCapability } from "@/types/batch";
import {
  deleteBatchResource,
  DetailItem,
  getBatch,
  jdStatusType,
  NameValueEditor,
  NameValueRow,
  parseList,
  postBatch,
  setBatchNotice,
  sortItems,
  takeBatchNotice,
  tagsToRecord,
} from "../shared";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

const COLUMN_LABELS: Record<string, string> = {
  name: "Name",
  revision: "Revision",
  type: "Type",
  status: "Status",
  image: "Image",
  actions: "Actions",
};

const ALL_COLUMN_IDS = ["name", "revision", "type", "status", "image", "actions"];

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/** "arn:aws:batch:…:job-definition/my-jd:3" → "my-jd:3" */
function definitionRef(def: JobDefinition): string {
  const name = def.jobDefinitionName || "";
  return def.revision !== undefined ? `${name}:${def.revision}` : name;
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface JdForm {
  name: string;
  type: JobDefinitionType;
  image: string;
  vcpus: string;
  memory: string;
  command: string;
  jobRoleArn: string;
  executionRoleArn: string;
  environment: NameValueRow[];
  privileged: boolean;
  readonlyRootFilesystem: boolean;
  user: string;
  nodeCount: string;
  attemptDurationSeconds: string;
  retryAttempts: string;
  platformCapabilities: PlatformCapability[];
  tags: Tag[];
}

type JdErrors = Partial<Record<keyof JdForm, string>>;

const EMPTY_JD_FORM: JdForm = {
  name: "",
  type: "container",
  image: "",
  vcpus: "1",
  memory: "2048",
  command: "",
  jobRoleArn: "",
  executionRoleArn: "",
  environment: [],
  privileged: false,
  readonlyRootFilesystem: false,
  user: "",
  nodeCount: "2",
  attemptDurationSeconds: "",
  retryAttempts: "",
  platformCapabilities: ["EC2"],
  tags: [],
};

const STEP_FIELD_KEYS: Record<number, (keyof JdForm)[]> = {
  0: ["name"],
  1: ["image", "vcpus", "memory", "nodeCount"],
  2: ["attemptDurationSeconds", "retryAttempts"],
  3: [],
  4: [],
};

function computeJdErrors(f: JdForm): JdErrors {
  const errors: JdErrors = {};
  const name = f.name.trim();
  if (!name) {
    errors.name = "Job definition name is required.";
  } else if (name.length > 128) {
    errors.name = "Name must be 128 characters or fewer.";
  } else if (!NAME_PATTERN.test(name)) {
    errors.name = "Use only letters, numbers, hyphens, and underscores (no spaces).";
  }

  if (f.type === "container") {
    if (!f.image.trim()) {
      errors.image = "Container image is required.";
    }
    const vcpus = Number(f.vcpus);
    if (!f.vcpus.trim() || !Number.isFinite(vcpus) || vcpus <= 0) {
      errors.vcpus = "vCPUs must be a number greater than 0.";
    }
    const memory = Number(f.memory);
    if (!f.memory.trim() || !Number.isInteger(memory) || memory <= 0) {
      errors.memory = "Memory (MiB) must be a whole number greater than 0.";
    }
    const envNames = f.environment.map((row) => row.name.trim()).filter(Boolean);
    if (envNames.length !== f.environment.filter((r) => r.name.trim() || r.value.trim()).length) {
      errors.environment = "Every environment variable needs a name.";
    } else if (new Set(envNames).size !== envNames.length) {
      errors.environment = "Environment variable names must be unique.";
    }
  } else {
    const nodes = Number(f.nodeCount);
    if (!f.nodeCount.trim() || !Number.isInteger(nodes) || nodes < 2) {
      errors.nodeCount = "Number of nodes must be a whole number of 2 or greater.";
    }
  }

  if (f.attemptDurationSeconds.trim()) {
    const seconds = Number(f.attemptDurationSeconds);
    if (!Number.isInteger(seconds) || seconds <= 0) {
      errors.attemptDurationSeconds = "Timeout must be a whole number of seconds greater than 0.";
    }
  }
  if (f.retryAttempts.trim()) {
    const attempts = Number(f.retryAttempts);
    if (!Number.isInteger(attempts) || attempts < 1 || attempts > 10) {
      errors.retryAttempts = "Retry attempts must be a whole number from 1 to 10.";
    }
  }
  if (f.platformCapabilities.length === 0) {
    errors.platformCapabilities = "Select at least one platform capability.";
  }

  return errors;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobDefinitionsPage() {
  const router = useRouter();

  // List state
  const [items, setItems] = useState<JobDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<JobDefinition[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortingColumn, setSortingColumn] =
    useState<TableProps.SortingColumn<JobDefinition> | null>(null);
  const [sortingDescending, setSortingDescending] = useState(false);
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    pageSize: 25,
    contentDisplay: [],
  });

  // Create wizard
  const [wizardActive, setWizardActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<JdForm>(EMPTY_JD_FORM);
  const [formErrors, setFormErrors] = useState<JdErrors>({});

  // Deregister (typed confirmation, one resource at a time)
  const [deregisterQueue, setDeregisterQueue] = useState<JobDefinition[]>([]);
  const [deregisterTotal, setDeregisterTotal] = useState(0);
  const [deregistering, setDeregistering] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBatch({ action: "describeJobDefinitions" });
      setItems(data.jobDefinitions || []);
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to fetch job definitions"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // ── Register wizard ──────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setForm(EMPTY_JD_FORM);
    setFormErrors({});
    setStepIndex(0);
  }, []);

  const validateStep = useCallback(
    (step: number): boolean => {
      const all = computeJdErrors(form);
      const keys = STEP_FIELD_KEYS[step] ?? [];
      const subset: JdErrors = {};
      for (const key of keys) {
        if (all[key]) subset[key] = all[key];
      }
      setFormErrors((prev) => {
        const next: JdErrors = { ...prev };
        for (const key of Object.keys(next) as (keyof JdForm)[]) {
          if (keys.includes(key)) delete next[key];
        }
        return { ...next, ...subset };
      });
      return keys.every((key) => !all[key]);
    },
    [form],
  );

  const handleRegister = useCallback(async () => {
    const all = computeJdErrors(form);
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

      const payload: Record<string, unknown> = {
        action: "registerJobDefinition",
        jobDefinitionName: form.name.trim(),
        type: form.type,
        platformCapabilities: form.platformCapabilities,
      };

      if (form.type === "container") {
        payload.containerProperties = {
          image: form.image.trim(),
          vcpus: Number(form.vcpus),
          memory: Number(form.memory),
          resourceRequirements: [
            { type: "VCPU", value: form.vcpus.trim() },
            { type: "MEMORY", value: form.memory.trim() },
          ],
          ...(form.command.trim() ? { command: parseList(form.command) } : {}),
          ...(form.jobRoleArn.trim() ? { jobRoleArn: form.jobRoleArn.trim() } : {}),
          ...(form.executionRoleArn.trim()
            ? { executionRoleArn: form.executionRoleArn.trim() }
            : {}),
          ...(environment.length > 0 ? { environment } : {}),
          privileged: form.privileged,
          readonlyRootFilesystem: form.readonlyRootFilesystem,
          ...(form.user.trim() ? { user: form.user.trim() } : {}),
        };
      } else {
        const nodes = Number(form.nodeCount);
        payload.nodeProperties = {
          numNodes: nodes,
          mainNode: 0,
          nodeRangeProperties: [
            {
              targetNodes: `0:${nodes - 1}`,
              container: {
                image: form.image.trim(),
                resourceRequirements: [
                  { type: "VCPU", value: form.vcpus.trim() },
                  { type: "MEMORY", value: form.memory.trim() },
                ],
                ...(form.jobRoleArn.trim() ? { jobRoleArn: form.jobRoleArn.trim() } : {}),
                ...(environment.length > 0 ? { environment } : {}),
              },
            },
          ],
        };
      }

      if (form.attemptDurationSeconds.trim()) {
        payload.timeout = { attemptDurationSeconds: Number(form.attemptDurationSeconds) };
      }
      if (form.retryAttempts.trim()) {
        payload.retryStrategy = { attempts: Number(form.retryAttempts) };
      }
      const tags = tagsToRecord(form.tags);
      if (Object.keys(tags).length > 0) payload.tags = tags;

      const data = await postBatch(payload);
      const revision = data.revision;
      setBatchNotice(
        `Job definition "${form.name.trim()}${
          revision !== undefined ? `:${revision}` : ""
        }" registered.`,
      );
      setWizardActive(false);
      resetForm();
      router.push(
        `/batch-job/job-definitions/${encodeURIComponent(
          revision !== undefined ? `${form.name.trim()}:${revision}` : form.name.trim(),
        )}`,
      );
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to register job definition"));
    } finally {
      setSubmitting(false);
    }
  }, [form, resetForm, router]);

  // ── Deregister ───────────────────────────────────────────────────────────

  const openDeregister = useCallback((targets: JobDefinition[]) => {
    if (targets.length === 0) return;
    setDeregisterQueue(targets);
    setDeregisterTotal(targets.length);
  }, []);

  const handleConfirmDeregister = useCallback(async () => {
    const target = deregisterQueue[0];
    const ref = target ? definitionRef(target) : "";
    if (!ref) return;
    setDeregistering(true);
    setError(null);
    try {
      await deleteBatchResource("jobDefinition", ref);
      const remaining = deregisterQueue.slice(1);
      setDeregisterQueue(remaining);
      if (remaining.length === 0) {
        setSuccess(
          deregisterTotal === 1
            ? `Job definition "${ref}" deregistered.`
            : `${deregisterTotal} job definitions deregistered.`,
        );
        setSelectedItems([]);
        await load();
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to deregister job definition"));
      setDeregisterQueue([]);
      await load();
    } finally {
      setDeregistering(false);
    }
  }, [deregisterQueue, deregisterTotal, load]);

  // ── Table data ───────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    if (!filteringText.trim()) return items;
    const lower = filteringText.toLowerCase();
    return items.filter(
      (item) =>
        item.jobDefinitionName?.toLowerCase().includes(lower) ||
        item.type?.toLowerCase().includes(lower) ||
        item.status?.toLowerCase().includes(lower) ||
        item.containerProperties?.image?.toLowerCase().includes(lower) ||
        definitionRef(item).toLowerCase().includes(lower),
    );
  }, [items, filteringText]);

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

  const columnDefinitions = useMemo<TableProps.ColumnDefinition<JobDefinition>[]>(() => {
    const all: TableProps.ColumnDefinition<JobDefinition>[] = [
      {
        id: "name",
        header: "Name",
        isRowHeader: true,
        sortingField: "jobDefinitionName",
        cell: (item) => (
          <Button
            variant="link"
            formAction="none"
            onClick={() =>
              router.push(`/batch-job/job-definitions/${encodeURIComponent(definitionRef(item))}`)
            }
          >
            {item.jobDefinitionName || "—"}
          </Button>
        ),
      },
      {
        id: "revision",
        header: "Revision",
        sortingField: "revision",
        cell: (item) => (item.revision !== undefined ? String(item.revision) : "—"),
        width: 110,
      },
      {
        id: "type",
        header: "Type",
        sortingField: "type",
        cell: (item) => item.type || "—",
        width: 130,
      },
      {
        id: "status",
        header: "Status",
        sortingField: "status",
        cell: (item) => (
          <StatusIndicator type={jdStatusType(item.status)}>{item.status || "—"}</StatusIndicator>
        ),
        width: 130,
      },
      {
        id: "image",
        header: "Image",
        cell: (item) => (
          <TruncatedText maxLength={50}>
            {item.containerProperties?.image ||
              (item.nodeProperties?.nodeRangeProperties?.[0]?.container?.image ?? "—")}
          </TruncatedText>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (item) => (
          <ButtonDropdown
            ariaLabel={`Actions for ${item.jobDefinitionName || "job definition"}`}
            onItemClick={({ detail }) => {
              if (detail.id === "details") {
                router.push(
                  `/batch-job/job-definitions/${encodeURIComponent(definitionRef(item))}`,
                );
              } else if (detail.id === "deregister") {
                openDeregister([item]);
              }
            }}
            items={[
              { id: "details", text: "View details" },
              { id: "deregister", text: "Deregister" },
            ]}
          >
            Actions
          </ButtonDropdown>
        ),
      },
    ];
    return visibleColumnIds ? all.filter((c) => c.id && visibleColumnIds.includes(c.id)) : all;
  }, [visibleColumnIds, router, openDeregister]);

  const pagedItems = sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ── Wizard steps ─────────────────────────────────────────────────────────

  const wizardSteps = [
    {
      title: "Specify job definition details",
      description:
        "Name the job definition and choose whether it runs a single container or multiple nodes.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Name"
            constraintText="Required. Up to 128 characters; letters, numbers, hyphens, and underscores only. Each registration creates a new revision of this name."
            errorText={formErrors.name}
          >
            <Input
              value={form.name}
              onChange={({ detail }) => {
                setForm((prev) => ({ ...prev, name: detail.value }));
                setFormErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="my-job-definition"
              ariaLabel="Job definition name"
            />
          </FormField>
          <Box variant="strong">Job definition type</Box>
          <RadioGroup
            value={form.type}
            onChange={({ detail }) =>
              setForm((prev) => ({
                ...prev,
                type: detail.value as JobDefinitionType,
              }))
            }
            items={[
              {
                value: "container",
                label: "Container",
                description: "A single container image is run for the job (most common).",
              },
              {
                value: "multinode",
                label: "Multi-node parallel",
                description:
                  "Several nodes run the same job simultaneously, for tightly coupled workloads such as HPC and ML training.",
              },
            ]}
          />
          <Box variant="strong">Platform capabilities</Box>
          <Checkbox
            checked={form.platformCapabilities.includes("EC2")}
            onChange={({ detail }) =>
              setForm((prev) => ({
                ...prev,
                platformCapabilities: detail.checked
                  ? Array.from(new Set([...prev.platformCapabilities, "EC2"]))
                  : prev.platformCapabilities.filter((c) => c !== "EC2"),
              }))
            }
          >
            EC2 — run on EC2 instances in your compute environments
          </Checkbox>
          <Checkbox
            checked={form.platformCapabilities.includes("FARGATE")}
            onChange={({ detail }) =>
              setForm((prev) => ({
                ...prev,
                platformCapabilities: detail.checked
                  ? Array.from(new Set([...prev.platformCapabilities, "FARGATE"]))
                  : prev.platformCapabilities.filter((c) => c !== "FARGATE"),
              }))
            }
          >
            AWS Fargate — run without managing servers (requires an execution role)
          </Checkbox>
          {formErrors.platformCapabilities && (
            <Alert type="error" statusIconAriaLabel="Error">
              {formErrors.platformCapabilities}
            </Alert>
          )}
        </SpaceBetween>
      ),
    },
    {
      title: form.type === "container" ? "Container properties" : "Node properties",
      description:
        form.type === "container"
          ? "Set the container image, resources, command, and environment for the job."
          : "Set the number of nodes and the image each node runs.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Container image"
            constraintText="Required. The container image to run, including the registry and tag."
            errorText={formErrors.image}
          >
            <Input
              value={form.image}
              onChange={({ detail }) => {
                setForm((prev) => ({ ...prev, image: detail.value }));
                setFormErrors((prev) => ({ ...prev, image: undefined }));
              }}
              placeholder="public.ecr.aws/docker/library/busybox:latest"
              ariaLabel="Container image"
            />
          </FormField>
          <ColumnLayout columns={2}>
            <FormField
              label="vCPUs"
              constraintText="Required. Number of virtual CPUs allocated to each container."
              errorText={formErrors.vcpus}
            >
              <Input
                type="number"
                value={form.vcpus}
                onChange={({ detail }) => {
                  setForm((prev) => ({ ...prev, vcpus: detail.value }));
                  setFormErrors((prev) => ({ ...prev, vcpus: undefined }));
                }}
                ariaLabel="vCPUs"
              />
            </FormField>
            <FormField
              label="Memory (MiB)"
              constraintText="Required. Memory allocated to each container, in MiB."
              errorText={formErrors.memory}
            >
              <Input
                type="number"
                value={form.memory}
                onChange={({ detail }) => {
                  setForm((prev) => ({ ...prev, memory: detail.value }));
                  setFormErrors((prev) => ({ ...prev, memory: undefined }));
                }}
                ariaLabel="Memory in MiB"
              />
            </FormField>
          </ColumnLayout>
          {form.type === "multinode" && (
            <FormField
              label="Number of nodes"
              constraintText="Required. Total nodes in the job (must be 2 or more); node 0 is the main node."
              errorText={formErrors.nodeCount}
            >
              <Input
                type="number"
                value={form.nodeCount}
                onChange={({ detail }) => {
                  setForm((prev) => ({ ...prev, nodeCount: detail.value }));
                  setFormErrors((prev) => ({ ...prev, nodeCount: undefined }));
                }}
                ariaLabel="Number of nodes"
              />
            </FormField>
          )}
          <FormField
            label="Command"
            constraintText="Optional. Overrides the container image ENTRYPOINT. Separate entries with commas."
          >
            <Input
              value={form.command}
              onChange={({ detail }) => setForm((prev) => ({ ...prev, command: detail.value }))}
              placeholder="/bin/echo, hello"
              ariaLabel="Command"
            />
          </FormField>
          <FormField
            label="Job role ARN"
            constraintText="Optional. IAM role the job's containers assume."
          >
            <Input
              value={form.jobRoleArn}
              onChange={({ detail }) => setForm((prev) => ({ ...prev, jobRoleArn: detail.value }))}
              placeholder="arn:aws:iam::123456789012:role/my-batch-job-role"
              ariaLabel="Job role ARN"
            />
          </FormField>
          <FormField
            label="Execution role ARN"
            constraintText="Optional, but required for Fargate. IAM role used to pull the image and send logs."
          >
            <Input
              value={form.executionRoleArn}
              onChange={({ detail }) =>
                setForm((prev) => ({ ...prev, executionRoleArn: detail.value }))
              }
              placeholder="arn:aws:iam::123456789012:role/my-batch-execution-role"
              ariaLabel="Execution role ARN"
            />
          </FormField>
          <FormField
            label="User"
            constraintText="Optional. User name or UID to run the container as."
          >
            <Input
              value={form.user}
              onChange={({ detail }) => setForm((prev) => ({ ...prev, user: detail.value }))}
              placeholder="1000"
              ariaLabel="User"
            />
          </FormField>
          <FormField
            label="Environment variables"
            description="Key-value pairs passed to every container in the job."
            errorText={formErrors.environment}
          >
            <NameValueEditor
              rows={form.environment}
              onChange={(environment) => {
                setForm((prev) => ({ ...prev, environment }));
                setFormErrors((prev) => ({ ...prev, environment: undefined }));
              }}
            />
          </FormField>
          <SpaceBetween size="xs">
            <Checkbox
              checked={form.privileged}
              onChange={({ detail }) =>
                setForm((prev) => ({ ...prev, privileged: detail.checked }))
              }
            >
              Privileged — extended privileges for the container
            </Checkbox>
            <Checkbox
              checked={form.readonlyRootFilesystem}
              onChange={({ detail }) =>
                setForm((prev) => ({
                  ...prev,
                  readonlyRootFilesystem: detail.checked,
                }))
              }
            >
              Read-only root filesystem
            </Checkbox>
          </SpaceBetween>
        </SpaceBetween>
      ),
    },
    {
      title: "Timeout and retry",
      description: "Optional. Control how long a job attempt may run and how often it retries.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Timeout (seconds)"
            constraintText="Optional. Attempts that run longer than this are killed and moved to FAILED."
            errorText={formErrors.attemptDurationSeconds}
          >
            <Input
              type="number"
              value={form.attemptDurationSeconds}
              onChange={({ detail }) => {
                setForm((prev) => ({
                  ...prev,
                  attemptDurationSeconds: detail.value,
                }));
                setFormErrors((prev) => ({
                  ...prev,
                  attemptDurationSeconds: undefined,
                }));
              }}
              placeholder="300"
              ariaLabel="Timeout in seconds"
            />
          </FormField>
          <FormField
            label="Retry attempts"
            constraintText="Optional. Number of times to retry a failed job (1–10). Leave blank for a single attempt."
            errorText={formErrors.retryAttempts}
          >
            <Input
              type="number"
              value={form.retryAttempts}
              onChange={({ detail }) => {
                setForm((prev) => ({ ...prev, retryAttempts: detail.value }));
                setFormErrors((prev) => ({ ...prev, retryAttempts: undefined }));
              }}
              placeholder="1"
              ariaLabel="Retry attempts"
            />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Tags",
      description: "Optional. Add metadata to the job definition.",
      content: (
        <FormField label="Tags" description="Key-value pairs used to organize the job definition.">
          <TagEditor tags={form.tags} onChange={(tags) => setForm((prev) => ({ ...prev, tags }))} />
        </FormField>
      ),
    },
    {
      title: "Review",
      description: "Review your job definition before registering it.",
      content: (
        <Container header={<Header variant="h3">Review summary</Header>}>
          <ColumnLayout columns={3} variant="default">
            <DetailItem label="Name">{form.name.trim() || "—"}</DetailItem>
            <DetailItem label="Type">{form.type}</DetailItem>
            <DetailItem label="Platform capabilities">
              {form.platformCapabilities.join(", ") || "—"}
            </DetailItem>
            <DetailItem label="Container image">{form.image.trim() || "—"}</DetailItem>
            <DetailItem label="vCPUs">{form.vcpus || "—"}</DetailItem>
            <DetailItem label="Memory (MiB)">{form.memory || "—"}</DetailItem>
            {form.type === "multinode" && (
              <DetailItem label="Number of nodes">{form.nodeCount || "—"}</DetailItem>
            )}
            <DetailItem label="Command">{form.command.trim() || "—"}</DetailItem>
            <DetailItem label="Job role ARN">
              <TruncatedText maxLength={50}>{form.jobRoleArn.trim() || "—"}</TruncatedText>
            </DetailItem>
            <DetailItem label="Execution role ARN">
              <TruncatedText maxLength={50}>{form.executionRoleArn.trim() || "—"}</TruncatedText>
            </DetailItem>
            <DetailItem label="Environment variables">
              {form.environment.filter((r) => r.name.trim()).length > 0
                ? form.environment
                    .filter((r) => r.name.trim())
                    .map((r) => `${r.name}=${r.value}`)
                    .join(", ")
                : "None"}
            </DetailItem>
            <DetailItem label="Privileged">{form.privileged ? "Yes" : "No"}</DetailItem>
            <DetailItem label="Read-only root filesystem">
              {form.readonlyRootFilesystem ? "Yes" : "No"}
            </DetailItem>
            <DetailItem label="Timeout (seconds)">
              {form.attemptDurationSeconds.trim() || "—"}
            </DetailItem>
            <DetailItem label="Retry attempts">{form.retryAttempts.trim() || "—"}</DetailItem>
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
        <Header variant="h1">Register job definition</Header>
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
            onSubmit={handleRegister}
            submitButtonText={submitting ? "Registering…" : "Register job definition"}
            i18nStrings={{
              stepNumberLabel: (stepNumber: number) => `Step ${stepNumber}`,
              navigationAriaLabel: "Job definition wizard navigation",
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
                if (detail.id === "deregister") {
                  openDeregister(selectedItems);
                } else if (detail.id === "copy-arns") {
                  const arns = selectedItems
                    .map((item) => item.jobDefinitionArn)
                    .filter((arn): arn is string => Boolean(arn))
                    .join("\n");
                  if (arns) {
                    void navigator.clipboard?.writeText(arns);
                    setSuccess(`${selectedItems.length} ARN(s) copied.`);
                  }
                } else if (detail.id === "clear") {
                  setSelectedItems([]);
                }
              }}
              items={[
                { id: "deregister", text: "Deregister" },
                {
                  id: "copy-arns",
                  text: "Copy ARNs",
                },
                {
                  id: "clear",
                  text: "Clear selection",
                },
              ]}
            >
              Actions
            </ButtonDropdown>
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                setWizardActive(true);
              }}
            >
              Register job definition
            </Button>
          </SpaceBetween>
        }
      >
        Job definitions
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

      <Table
        columnDefinitions={columnDefinitions}
        items={pagedItems}
        loading={loading}
        loadingText="Loading job definitions..."
        selectionType="multi"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) =>
          setSelectedItems(detail.selectedItems as JobDefinition[])
        }
        trackBy={definitionRef}
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
            filteringPlaceholder="Filter job definitions"
            filteringAriaLabel="Filter job definitions"
            onChange={({ detail }) => {
              setFilteringText(detail.filteringText);
              setCurrentPage(1);
            }}
            countText={
              filteringText
                ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                : `${items.length} job definitions`
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
                { value: 10, label: "10 job definitions" },
                { value: 25, label: "25 job definitions" },
                { value: 50, label: "50 job definitions" },
                { value: 100, label: "100 job definitions" },
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
              No job definitions found
            </Box>
            <Box variant="p" padding={{ bottom: "s" }} color="inherit">
              {filteringText
                ? "No job definitions match your filter. Try a different search."
                : "To get started, register a job definition."}
            </Box>
            {!filteringText && (
              <Button
                formAction="none"
                onClick={() => {
                  resetForm();
                  setWizardActive(true);
                }}
              >
                Register job definition
              </Button>
            )}
          </Box>
        }
      />

      {deregisterQueue.length > 0 && (
        <ConfirmModal
          visible={true}
          resourceName={deregisterQueue[0] ? definitionRef(deregisterQueue[0]) : ""}
          resourceType="job definition"
          actionLabel="Deregister"
          onConfirm={handleConfirmDeregister}
          onDismiss={() => setDeregisterQueue([])}
          loading={deregistering}
        />
      )}
    </SpaceBetween>
  );
}
