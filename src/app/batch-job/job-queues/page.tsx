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
import RadioGroup from "@cloudscape-design/components/radio-group";
import Select from "@cloudscape-design/components/select";
import Grid from "@cloudscape-design/components/grid";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Alert from "@cloudscape-design/components/alert";
import ConfirmModal from "@/components/ConfirmModal";
import TagEditor, { Tag } from "@/components/TagEditor";
import TruncatedText from "@/components/TruncatedText";
import type { JobQueueDetail, JQState, ComputeEnvironmentDetail } from "@/types/batch";
import {
  countActiveJobsInQueues,
  deleteBatchResource,
  DetailItem,
  getBatch,
  postBatch,
  setBatchNotice,
  sortItems,
  takeBatchNotice,
  tagsToRecord,
  TypedActionModal,
} from "../shared";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAME_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_COMPUTE_ENVIRONMENTS = 3;

const COLUMN_LABELS: Record<string, string> = {
  name: "Name",
  state: "State",
  priority: "Priority",
  computeEnvironments: "Compute environments",
  actions: "Actions",
};

const ALL_COLUMN_IDS = ["name", "state", "priority", "computeEnvironments", "actions"];

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function orderedEnvironments(jq: JobQueueDetail): string[] {
  return [...(jq.computeEnvironmentOrder || [])]
    .sort((a, b) => a.order - b.order)
    .map((o) => o.computeEnvironment)
    .filter(Boolean);
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface JqForm {
  name: string;
  priority: string;
  state: JQState;
  ces: string[];
  tags: Tag[];
}

type JqErrors = Partial<Record<keyof JqForm, string>>;

const EMPTY_JQ_FORM: JqForm = {
  name: "",
  priority: "",
  state: "ENABLED",
  ces: [],
  tags: [],
};

const STEP_FIELD_KEYS: Record<number, (keyof JqForm)[]> = {
  0: ["name", "priority"],
  1: ["ces"],
  2: [],
  3: [],
};

function computeJqErrors(f: JqForm): JqErrors {
  const errors: JqErrors = {};
  const name = f.name.trim();
  if (!name) {
    errors.name = "Job queue name is required.";
  } else if (name.length > 128) {
    errors.name = "Name must be 128 characters or fewer.";
  } else if (!NAME_PATTERN.test(name)) {
    errors.name = "Use only letters, numbers, hyphens, and underscores (no spaces).";
  }

  if (!f.priority.trim()) {
    errors.priority = "Priority is required.";
  } else {
    const priority = Number(f.priority);
    if (!Number.isInteger(priority) || priority < 0) {
      errors.priority = "Priority must be a whole number of 0 or greater.";
    }
  }

  if (f.ces.length === 0) {
    errors.ces = "Select at least one compute environment.";
  } else if (f.ces.some((ce) => !ce)) {
    errors.ces = "Every row needs a compute environment. Remove empty rows.";
  } else if (new Set(f.ces).size !== f.ces.length) {
    errors.ces = "Each compute environment can be selected only once.";
  }

  return errors;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JobQueuesPage() {
  const router = useRouter();

  // List state
  const [items, setItems] = useState<JobQueueDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<JobQueueDetail[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortingColumn, setSortingColumn] =
    useState<TableProps.SortingColumn<JobQueueDetail> | null>(null);
  const [sortingDescending, setSortingDescending] = useState(false);
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    pageSize: 25,
    contentDisplay: [],
  });

  // Compute environments (needed by the create wizard)
  const [computeEnvironments, setComputeEnvironments] = useState<ComputeEnvironmentDetail[]>([]);

  // Create wizard
  const [wizardActive, setWizardActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<JqForm>(EMPTY_JQ_FORM);
  const [formErrors, setFormErrors] = useState<JqErrors>({});

  // Bulk state changes
  const [updating, setUpdating] = useState(false);

  // Delete queue (typed confirmation, one resource at a time)
  const [deleteQueue, setDeleteQueue] = useState<JobQueueDetail[]>([]);
  const [deleteTotal, setDeleteTotal] = useState(0);
  const [deleteWarning, setDeleteWarning] = useState<string | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const [checkingJobs, setCheckingJobs] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBatch({ action: "describeJobQueues" });
      setItems(data.jobQueues || []);
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to fetch job queues"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadComputeEnvironments = useCallback(async () => {
    try {
      const data = await getBatch({ action: "describeComputeEnvironments" });
      setComputeEnvironments(data.computeEnvironments || []);
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to fetch compute environments for selection"));
    }
  }, []);

  useEffect(() => {
    const notice = takeBatchNotice();
    if (notice) setSuccess(notice);
    load();
    void loadComputeEnvironments();
  }, [load, loadComputeEnvironments]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 6000);
    return () => clearTimeout(timer);
  }, [success]);

  // ── Create wizard ─────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setForm(EMPTY_JQ_FORM);
    setFormErrors({});
    setStepIndex(0);
  }, []);

  const validateStep = useCallback(
    (step: number): boolean => {
      const all = computeJqErrors(form);
      const keys = STEP_FIELD_KEYS[step] ?? [];
      const subset: JqErrors = {};
      for (const key of keys) {
        if (all[key]) subset[key] = all[key];
      }
      setFormErrors((prev) => {
        const next: JqErrors = { ...prev };
        for (const key of Object.keys(next) as (keyof JqForm)[]) {
          if (keys.includes(key)) delete next[key];
        }
        return { ...next, ...subset };
      });
      return keys.every((key) => !all[key]);
    },
    [form],
  );

  const handleCreate = useCallback(async () => {
    const all = computeJqErrors(form);
    if (Object.values(all).some(Boolean)) {
      setFormErrors(all);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        action: "createJobQueue",
        jobQueueName: form.name.trim(),
        state: form.state,
        priority: Number(form.priority),
        computeEnvironmentOrder: form.ces.map((computeEnvironment, index) => ({
          order: index,
          computeEnvironment,
        })),
      };
      const tags = tagsToRecord(form.tags);
      if (Object.keys(tags).length > 0) payload.tags = tags;

      const data = await postBatch(payload);
      setBatchNotice(`Job queue "${data.jobQueueName || form.name.trim()}" created.`);
      setWizardActive(false);
      resetForm();
      router.push(`/batch-job/job-queues/${encodeURIComponent(form.name.trim())}`);
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to create job queue"));
    } finally {
      setSubmitting(false);
    }
  }, [form, resetForm, router]);

  // ── Enable / disable ──────────────────────────────────────────────────────

  const runStateChange = useCallback(
    async (targets: JobQueueDetail[], nextState: JQState) => {
      if (targets.length === 0) return;
      setUpdating(true);
      setError(null);
      const failures: string[] = [];
      for (const target of targets) {
        const name = target.jobQueueName;
        if (!name) continue;
        try {
          await postBatch({ action: "updateJobQueue", jobQueue: name, state: nextState });
        } catch (err: unknown) {
          failures.push(`${name}: ${errorMessage(err, "update failed")}`);
        }
      }
      setUpdating(false);
      setSelectedItems([]);
      if (failures.length > 0) {
        setError(`${failures.length} job queue(s) could not be updated — ${failures.join("; ")}`);
      } else {
        setSuccess(
          targets.length === 1
            ? `Job queue "${targets[0].jobQueueName}" ${nextState === "ENABLED" ? "enabled" : "disabled"}.`
            : `${targets.length} job queues ${nextState === "ENABLED" ? "enabled" : "disabled"}.`,
        );
      }
      await load();
    },
    [load],
  );

  // ── Delete ────────────────────────────────────────────────────────────────

  const openDelete = useCallback(async (targets: JobQueueDetail[]) => {
    if (targets.length === 0) return;
    setCheckingJobs(true);
    setError(null);
    try {
      const queues = targets.map((t) => t.jobQueueName).filter((n): n is string => Boolean(n));
      const activeJobs = await countActiveJobsInQueues(queues);
      setDeleteWarning(
        activeJobs > 0
          ? `You have ${activeJobs} active job(s) in the job queue(s) you are about to delete. Deleting the queue will prevent new jobs from being scheduled, and active jobs must finish or be cancelled first.`
          : undefined,
      );
      setDeleteQueue(targets);
      setDeleteTotal(targets.length);
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not check for active jobs — deletion was not started"));
    } finally {
      setCheckingJobs(false);
    }
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = deleteQueue[0];
    const name = target?.jobQueueName;
    if (!name) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteBatchResource("jobQueue", name);
      const remaining = deleteQueue.slice(1);
      setDeleteQueue(remaining);
      if (remaining.length === 0) {
        setSuccess(
          deleteTotal === 1 ? `Job queue "${name}" deleted.` : `${deleteTotal} job queues deleted.`,
        );
        setSelectedItems([]);
        await load();
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to delete job queue"));
      setDeleteQueue([]);
      await load();
    } finally {
      setDeleting(false);
    }
  }, [deleteQueue, deleteTotal, load]);

  // ── Ordered compute environment rows ──────────────────────────────────────

  const ceOptionsFor = useCallback(
    (index: number) =>
      computeEnvironments
        .filter((ce) => {
          const n = ce.computeEnvironmentName;
          if (!n) return false;
          return n === form.ces[index] || !form.ces.includes(n);
        })
        .map((ce) => {
          const n = ce.computeEnvironmentName as string;
          return {
            label: n,
            value: n,
            description: `${ce.type ?? ""} · ${ce.state ?? ""} · ${ce.status ?? ""}`.replace(
              / · $/,
              "",
            ),
          };
        }),
    [computeEnvironments, form.ces],
  );

  const moveCe = (index: number, delta: number): void => {
    setForm((prev) => {
      const next = [...prev.ces];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return { ...prev, ces: next };
    });
    setFormErrors((prev) => ({ ...prev, ces: undefined }));
  };

  // ── Table data ────────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    if (!filteringText.trim()) return items;
    const lower = filteringText.toLowerCase();
    return items.filter(
      (item) =>
        item.jobQueueName?.toLowerCase().includes(lower) ||
        item.state?.toLowerCase().includes(lower) ||
        String(item.priority).includes(lower) ||
        orderedEnvironments(item).some((ce) => ce.toLowerCase().includes(lower)),
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

  const columnDefinitions = useMemo<TableProps.ColumnDefinition<JobQueueDetail>[]>(() => {
    const all: TableProps.ColumnDefinition<JobQueueDetail>[] = [
      {
        id: "name",
        header: "Name",
        isRowHeader: true,
        sortingField: "jobQueueName",
        cell: (item) => (
          <Button
            variant="link"
            formAction="none"
            onClick={() =>
              router.push(`/batch-job/job-queues/${encodeURIComponent(item.jobQueueName || "")}`)
            }
          >
            {item.jobQueueName || "—"}
          </Button>
        ),
      },
      {
        id: "state",
        header: "State",
        sortingField: "state",
        cell: (item) => (
          <StatusIndicator type={item.state === "ENABLED" ? "success" : "stopped"}>
            {item.state || "—"}
          </StatusIndicator>
        ),
      },
      {
        id: "priority",
        header: "Priority",
        sortingField: "priority",
        cell: (item) => (item.priority !== undefined ? String(item.priority) : "—"),
      },
      {
        id: "computeEnvironments",
        header: "Compute environments",
        cell: (item) => {
          const ordered = orderedEnvironments(item);
          return ordered.length > 0 ? (
            <TruncatedText maxLength={70}>
              {ordered.map((ce, i) => `${i + 1}. ${ce}`).join("  ·  ")}
            </TruncatedText>
          ) : (
            "—"
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: (item) => (
          <ButtonDropdown
            ariaLabel={`Actions for ${item.jobQueueName || "job queue"}`}
            onItemClick={({ detail }) => {
              if (detail.id === "details") {
                router.push(`/batch-job/job-queues/${encodeURIComponent(item.jobQueueName || "")}`);
              } else if (detail.id === "enable") {
                void runStateChange([item], "ENABLED");
              } else if (detail.id === "disable") {
                void runStateChange([item], "DISABLED");
              } else if (detail.id === "delete") {
                void openDelete([item]);
              }
            }}
            items={[
              { id: "details", text: "View details" },
              { id: "enable", text: "Enable" },
              { id: "disable", text: "Disable" },
              { id: "delete", text: "Delete" },
            ]}
          >
            Actions
          </ButtonDropdown>
        ),
      },
    ];
    return visibleColumnIds ? all.filter((c) => c.id && visibleColumnIds.includes(c.id)) : all;
  }, [visibleColumnIds, router, runStateChange, openDelete]);

  const pagedItems = sortedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ── Wizard steps ──────────────────────────────────────────────────────────

  const wizardSteps = [
    {
      title: "Configure job queue",
      description: "Specify the queue name, scheduling priority, and state.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Name"
            constraintText="Required. Up to 128 characters; letters, numbers, hyphens, and underscores only."
            errorText={formErrors.name}
          >
            <Input
              value={form.name}
              onChange={({ detail }) => {
                setForm((prev) => ({ ...prev, name: detail.value }));
                setFormErrors((prev) => ({ ...prev, name: undefined }));
              }}
              placeholder="my-job-queue"
              ariaLabel="Job queue name"
            />
          </FormField>
          <FormField
            label="Priority"
            constraintText="Required. Whole number of 0 or greater. Queues with a higher priority are evaluated first when they share a compute environment."
            errorText={formErrors.priority}
          >
            <Input
              type="number"
              value={form.priority}
              onChange={({ detail }) => {
                setForm((prev) => ({ ...prev, priority: detail.value }));
                setFormErrors((prev) => ({ ...prev, priority: undefined }));
              }}
              placeholder="10"
              ariaLabel="Priority"
            />
          </FormField>
          <Box variant="strong">State</Box>
          <RadioGroup
            value={form.state}
            onChange={({ detail }) =>
              setForm((prev) => ({ ...prev, state: detail.value as JQState }))
            }
            items={[
              {
                value: "ENABLED",
                label: "Enabled",
                description: "The queue accepts and schedules new jobs.",
              },
              {
                value: "DISABLED",
                label: "Disabled",
                description:
                  "The queue does not accept new jobs, but jobs already in the queue can finish.",
              },
            ]}
          />
        </SpaceBetween>
      ),
    },
    {
      title: "Select compute environments",
      description:
        "Add up to three compute environments and order them by preference. Jobs run in the first environment with available capacity.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Compute environments"
            constraintText={`Required. Up to ${MAX_COMPUTE_ENVIRONMENTS} compute environments, listed in order of preference. The first entry is tried first.`}
            errorText={formErrors.ces}
          >
            <SpaceBetween size="s">
              {form.ces.map((value, index) => (
                <Grid
                  key={index}
                  gridDefinition={[{ colspan: 6 }, { colspan: 2 }, { colspan: 2 }, { colspan: 2 }]}
                >
                  <FormField
                    label={`Environment ${index + 1}`}
                    errorText={
                      formErrors.ces && !value ? "Select a compute environment." : undefined
                    }
                  >
                    <Select
                      selectedOption={ceOptionsFor(index).find((o) => o.value === value) ?? null}
                      onChange={({ detail }) => {
                        const selected = detail.selectedOption;
                        setForm((prev) => {
                          const next = [...prev.ces];
                          next[index] =
                            selected && "value" in selected && selected.value ? selected.value : "";
                          return { ...prev, ces: next };
                        });
                        setFormErrors((prev) => ({ ...prev, ces: undefined }));
                      }}
                      options={ceOptionsFor(index)}
                      placeholder="Select a compute environment"
                      filteringType="auto"
                      filteringPlaceholder="Filter compute environments"
                      filteringAriaLabel="Filter compute environments"
                      ariaLabel={`Compute environment ${index + 1}`}
                      disabled={computeEnvironments.length === 0}
                    />
                  </FormField>
                  <Box padding={{ top: "xs" }}>
                    <Button
                      variant="icon"
                      iconName="angle-up"
                      disabled={index === 0}
                      onClick={() => moveCe(index, -1)}
                      ariaLabel={`Move environment ${index + 1} up`}
                    />
                  </Box>
                  <Box padding={{ top: "xs" }}>
                    <Button
                      variant="icon"
                      iconName="angle-down"
                      disabled={index === form.ces.length - 1}
                      onClick={() => moveCe(index, 1)}
                      ariaLabel={`Move environment ${index + 1} down`}
                    />
                  </Box>
                  <Box padding={{ top: "xs" }}>
                    <Button
                      variant="icon"
                      iconName="remove"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          ces: prev.ces.filter((_, i) => i !== index),
                        }))
                      }
                      ariaLabel={`Remove environment ${index + 1}`}
                    />
                  </Box>
                </Grid>
              ))}
              <Box>
                <Button
                  iconName="add-plus"
                  onClick={() => setForm((prev) => ({ ...prev, ces: [...prev.ces, ""] }))}
                  disabled={form.ces.length >= MAX_COMPUTE_ENVIRONMENTS}
                >
                  Add compute environment
                </Button>
              </Box>
              {computeEnvironments.length === 0 && (
                <Alert type="info" statusIconAriaLabel="Information">
                  No compute environments are available yet. Create a compute environment first,
                  then come back to create this queue.
                </Alert>
              )}
            </SpaceBetween>
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Tags",
      description: "Optional. Add metadata to the job queue.",
      content: (
        <FormField label="Tags" description="Key-value pairs used to organize the queue.">
          <TagEditor tags={form.tags} onChange={(tags) => setForm((prev) => ({ ...prev, tags }))} />
        </FormField>
      ),
    },
    {
      title: "Review",
      description: "Review your job queue configuration before creating it.",
      content: (
        <Container header={<Header variant="h3">Review summary</Header>}>
          <ColumnLayout columns={3} variant="default">
            <DetailItem label="Name">{form.name.trim() || "—"}</DetailItem>
            <DetailItem label="Priority">{form.priority || "—"}</DetailItem>
            <DetailItem label="State">{form.state}</DetailItem>
            <DetailItem label="Compute environments">
              {form.ces.filter(Boolean).length > 0
                ? form.ces
                    .filter(Boolean)
                    .map((ce, i) => `${i + 1}. ${ce}`)
                    .join(" · ")
                : "None"}
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
        <Header variant="h1">Create job queue</Header>
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
            onSubmit={handleCreate}
            submitButtonText={submitting ? "Creating…" : "Create job queue"}
            i18nStrings={{
              stepNumberLabel: (stepNumber: number) => `Step ${stepNumber}`,
              navigationAriaLabel: "Job queue wizard navigation",
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
              disabled={selectedItems.length === 0 || updating}
              onItemClick={({ detail }) => {
                if (detail.id === "enable") {
                  void runStateChange(selectedItems, "ENABLED");
                } else if (detail.id === "disable") {
                  void runStateChange(selectedItems, "DISABLED");
                } else if (detail.id === "delete") {
                  void openDelete(selectedItems);
                }
              }}
              items={[
                { id: "enable", text: "Enable" },
                { id: "disable", text: "Disable" },
                { id: "delete", text: "Delete" },
              ]}
            >
              Actions
            </ButtonDropdown>
            <Button
              variant="primary"
              onClick={() => {
                resetForm();
                void loadComputeEnvironments();
                setWizardActive(true);
              }}
            >
              Create job queue
            </Button>
          </SpaceBetween>
        }
      >
        Job queues
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
        loadingText="Loading job queues..."
        selectionType="multi"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) =>
          setSelectedItems(detail.selectedItems as JobQueueDetail[])
        }
        trackBy="jobQueueName"
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
            filteringPlaceholder="Filter job queues"
            filteringAriaLabel="Filter job queues"
            onChange={({ detail }) => {
              setFilteringText(detail.filteringText);
              setCurrentPage(1);
            }}
            countText={
              filteringText
                ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                : `${items.length} job queues`
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
                { value: 10, label: "10 job queues" },
                { value: 25, label: "25 job queues" },
                { value: 50, label: "50 job queues" },
                { value: 100, label: "100 job queues" },
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
              No job queues found
            </Box>
            <Box variant="p" padding={{ bottom: "s" }} color="inherit">
              {filteringText
                ? "No job queues match your filter. Try a different search."
                : "To get started, create a job queue."}
            </Box>
            {!filteringText && (
              <Button
                formAction="none"
                onClick={() => {
                  resetForm();
                  void loadComputeEnvironments();
                  setWizardActive(true);
                }}
              >
                Create job queue
              </Button>
            )}
          </Box>
        }
      />

      {deleteQueue.length > 0 &&
        (deleteWarning ? (
          <TypedActionModal
            visible={true}
            title="Delete job queue"
            resourceName={deleteQueue[0]?.jobQueueName || ""}
            resourceType="job queue"
            actionLabel="Delete"
            warning={deleteWarning}
            loading={deleting}
            onConfirm={handleConfirmDelete}
            onDismiss={() => setDeleteQueue([])}
          />
        ) : (
          <ConfirmModal
            visible={true}
            resourceName={deleteQueue[0]?.jobQueueName || ""}
            resourceType="job queue"
            actionLabel="Delete"
            onConfirm={handleConfirmDelete}
            onDismiss={() => setDeleteQueue([])}
            loading={deleting}
          />
        ))}

      {checkingJobs && (
        <Alert type="info" statusIconAriaLabel="Information">
          Checking for active jobs…
        </Alert>
      )}
    </SpaceBetween>
  );
}
