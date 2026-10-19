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
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Alert from "@cloudscape-design/components/alert";
import ConfirmModal from "@/components/ConfirmModal";
import TagEditor, { Tag } from "@/components/TagEditor";
import TruncatedText from "@/components/TruncatedText";
import type { ComputeEnvironmentDetail, CEState } from "@/types/batch";
import {
  ceStateType,
  ceStatusType,
  countActiveJobsInQueues,
  deleteBatchResource,
  DetailItem,
  getBatch,
  joinList,
  parseList,
  postBatch,
  setBatchNotice,
  sortItems,
  takeBatchNotice,
  tagsToRecord,
  TypedActionModal,
} from "../shared";

// ─── Constants ────────────────────────────────────────────────────────────────

const NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

const COLUMN_LABELS: Record<string, string> = {
  name: "Name",
  type: "Type",
  state: "State",
  status: "Status",
  maxvCpus: "Max vCPUs",
  desiredvCpus: "Desired vCPUs",
  instanceTypes: "Instance types",
  actions: "Actions",
};

const ALL_COLUMN_IDS = [
  "name",
  "type",
  "state",
  "status",
  "maxvCpus",
  "desiredvCpus",
  "instanceTypes",
  "actions",
];

interface AllocationOption {
  value: string;
  label: string;
  description: string;
}

const ALLOCATION_OPTIONS: Record<"EC2" | "SPOT", AllocationOption[]> = {
  EC2: [
    {
      value: "BEST_FIT_PROGRESSIVE",
      label: "Best fit progressive (default)",
      description:
        "Instances are progressively selected to best match your workload's resource needs.",
    },
    {
      value: "BEST_FIT",
      label: "Best fit",
      description: "Uses the available instance with the fewest VCPUs that can run your job.",
    },
  ],
  SPOT: [
    {
      value: "SPOT_CAPACITY_OPTIMIZED",
      label: "Capacity optimized (default)",
      description: "Selects the instance type with the most available Spot capacity.",
    },
    {
      value: "SPOT_PRICE_CAPACITY_OPTIMIZED",
      label: "Price capacity optimized",
      description: "Balances the risk of Spot interruption against lower cost.",
    },
    {
      value: "SPOT_CAPACITY_OPTIMIZED_PRIORITIZED",
      label: "Capacity optimized prioritized",
      description: "Uses your instance type order first, then falls back to capacity optimized.",
    },
    {
      value: "BEST_FIT_PROGRESSIVE",
      label: "Best fit progressive",
      description: "Instances are progressively selected to match resource needs.",
    },
  ],
};

const CE_TYPE_OPTIONS = [
  {
    value: "MANAGED",
    label: "Managed",
    description:
      "AWS Batch provisions, scales, and terminates the compute resources for you based on the jobs it schedules.",
  },
  {
    value: "UNMANAGED",
    label: "Unmanaged",
    description:
      "You manage your own compute resources. AWS Batch does not manage capacity for this environment.",
  },
];

// ─── Form state ───────────────────────────────────────────────────────────────

interface CeForm {
  name: string;
  type: "MANAGED" | "UNMANAGED";
  serviceRole: string;
  capacityType: "EC2" | "SPOT";
  allocationStrategy: string;
  instanceTypes: string;
  minvCpus: string;
  maxvCpus: string;
  desiredvCpus: string;
  subnets: string;
  securityGroups: string;
  bidPercentage: string;
  unmanagedvCpus: string;
  tags: Tag[];
}

type CeErrors = Partial<Record<keyof CeForm, string>>;

const EMPTY_CE_FORM: CeForm = {
  name: "",
  type: "MANAGED",
  serviceRole: "",
  capacityType: "EC2",
  allocationStrategy: "BEST_FIT_PROGRESSIVE",
  instanceTypes: "",
  minvCpus: "0",
  maxvCpus: "",
  desiredvCpus: "0",
  subnets: "",
  securityGroups: "",
  bidPercentage: "",
  unmanagedvCpus: "",
  tags: [],
};

const STEP_FIELD_KEYS: Record<number, (keyof CeForm)[]> = {
  0: ["name"],
  1: [],
  2: ["serviceRole"],
  3: [
    "maxvCpus",
    "minvCpus",
    "desiredvCpus",
    "subnets",
    "securityGroups",
    "bidPercentage",
    "unmanagedvCpus",
  ],
  4: [],
};

function computeCeErrors(f: CeForm): CeErrors {
  const errors: CeErrors = {};
  const name = f.name.trim();
  if (!name) {
    errors.name = "Compute environment name is required.";
  } else if (name.length > 128) {
    errors.name = "Name must be 128 characters or fewer.";
  } else if (!NAME_PATTERN.test(name)) {
    errors.name = "Use only letters, numbers, hyphens, and underscores (no spaces).";
  }

  const role = f.serviceRole.trim();
  if (role && !role.startsWith("arn:")) {
    errors.serviceRole =
      "Enter a full IAM role ARN (arn:aws:iam::…:role/…) or leave the field blank.";
  }

  if (f.type === "MANAGED") {
    const max = Number(f.maxvCpus);
    const min = Number(f.minvCpus);
    const desired = Number(f.desiredvCpus);

    if (!f.maxvCpus.trim()) {
      errors.maxvCpus = "Max vCPUs is required.";
    } else if (!Number.isInteger(max) || max < 1) {
      errors.maxvCpus = "Max vCPUs must be a whole number of at least 1.";
    }
    if (!f.minvCpus.trim()) {
      errors.minvCpus = "Min vCPUs is required.";
    } else if (!Number.isInteger(min) || min < 0) {
      errors.minvCpus = "Min vCPUs must be 0 or greater.";
    }
    if (!f.desiredvCpus.trim()) {
      errors.desiredvCpus = "Desired vCPUs is required.";
    } else if (!Number.isInteger(desired) || desired < 0) {
      errors.desiredvCpus = "Desired vCPUs must be 0 or greater.";
    }
    if (!errors.minvCpus && !errors.maxvCpus && min > max) {
      errors.minvCpus = "Min vCPUs cannot exceed Max vCPUs.";
    }
    if (
      !errors.desiredvCpus &&
      !errors.minvCpus &&
      !errors.maxvCpus &&
      (desired > max || desired < min)
    ) {
      errors.desiredvCpus = "Desired vCPUs must be between Min and Max vCPUs.";
    }
    if (!f.subnets.trim()) {
      errors.subnets = "At least one subnet ID is required (subnet-…).";
    }
    if (!f.securityGroups.trim()) {
      errors.securityGroups = "At least one security group ID is required (sg-…).";
    }
    if (f.capacityType === "SPOT" && f.bidPercentage.trim()) {
      const bid = Number(f.bidPercentage);
      if (!Number.isInteger(bid) || bid < 0 || bid > 100) {
        errors.bidPercentage = "Enter a whole number between 0 and 100.";
      }
    }
  } else if (f.unmanagedvCpus.trim()) {
    const v = Number(f.unmanagedvCpus);
    if (!Number.isInteger(v) || v < 0) {
      errors.unmanagedvCpus = "Maximum vCPUs must be 0 or greater.";
    }
  }

  return errors;
}

function maxVcpusOf(ce: ComputeEnvironmentDetail): string {
  if (ce.type === "UNMANAGED") {
    return ce.unmanagedvCpus !== undefined ? String(ce.unmanagedvCpus) : "—";
  }
  return ce.computeResources?.maxvCpus !== undefined ? String(ce.computeResources.maxvCpus) : "—";
}

function desiredVcpusOf(ce: ComputeEnvironmentDetail): string {
  if (ce.type === "UNMANAGED") return "—";
  return ce.computeResources?.desiredvCpus !== undefined
    ? String(ce.computeResources.desiredvCpus)
    : "—";
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComputeEnvironmentsPage() {
  const router = useRouter();

  // List state
  const [items, setItems] = useState<ComputeEnvironmentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<ComputeEnvironmentDetail[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortingColumn, setSortingColumn] =
    useState<TableProps.SortingColumn<ComputeEnvironmentDetail> | null>(null);
  const [sortingDescending, setSortingDescending] = useState(false);
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    pageSize: 25,
    contentDisplay: [],
  });

  // Create wizard
  const [wizardActive, setWizardActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CeForm>(EMPTY_CE_FORM);
  const [formErrors, setFormErrors] = useState<CeErrors>({});

  // Bulk state changes (enable/disable)
  const [updating, setUpdating] = useState(false);

  // Delete queue (typed confirmation, one resource at a time)
  const [deleteQueue, setDeleteQueue] = useState<ComputeEnvironmentDetail[]>([]);
  const [deleteTotal, setDeleteTotal] = useState(0);
  const [deleteWarning, setDeleteWarning] = useState<string | undefined>(undefined);
  const [deleting, setDeleting] = useState(false);
  const [checkingJobs, setCheckingJobs] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBatch({ action: "describeComputeEnvironments" });
      setItems(data.computeEnvironments || []);
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to fetch compute environments"));
      setItems([]);
    } finally {
      setLoading(false);
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

  // ── Create wizard ─────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setForm(EMPTY_CE_FORM);
    setFormErrors({});
    setStepIndex(0);
  }, []);

  const setField = useCallback(<K extends keyof CeForm>(key: K, value: CeForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => ({ ...prev, [key]: undefined }));
  }, []);

  const validateStep = useCallback(
    (step: number): boolean => {
      const all = computeCeErrors(form);
      const keys = STEP_FIELD_KEYS[step] ?? [];
      const subset: CeErrors = {};
      for (const key of keys) {
        if (all[key]) subset[key] = all[key];
      }
      setFormErrors((prev) => {
        const next: CeErrors = { ...prev };
        for (const key of Object.keys(next) as (keyof CeForm)[]) {
          if (keys.includes(key)) delete next[key];
        }
        return { ...next, ...subset };
      });
      return keys.every((key) => !all[key]);
    },
    [form],
  );

  const handleCreate = useCallback(async () => {
    const all = computeCeErrors(form);
    if (Object.values(all).some(Boolean)) {
      setFormErrors(all);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        action: "createComputeEnvironment",
        computeEnvironmentName: form.name.trim(),
        type: form.type,
        state: "ENABLED",
      };
      const role = form.serviceRole.trim();
      if (role) payload.serviceRole = role;

      if (form.type === "MANAGED") {
        const computeResources: Record<string, unknown> = {
          type: form.capacityType,
          allocationStrategy: form.allocationStrategy,
          minvCpus: Number(form.minvCpus),
          maxvCpus: Number(form.maxvCpus),
          desiredvCpus: Number(form.desiredvCpus),
          subnets: parseList(form.subnets),
          securityGroupIds: parseList(form.securityGroups),
        };
        const instanceTypes = parseList(form.instanceTypes);
        if (instanceTypes.length > 0) computeResources.instanceTypes = instanceTypes;
        if (form.capacityType === "SPOT" && form.bidPercentage.trim()) {
          computeResources.bidPercentage = Number(form.bidPercentage);
        }
        payload.computeResources = computeResources;
      } else if (form.unmanagedvCpus.trim()) {
        payload.unmanagedvCpus = Number(form.unmanagedvCpus);
      }

      const tags = tagsToRecord(form.tags);
      if (Object.keys(tags).length > 0) payload.tags = tags;

      await postBatch(payload);
      setBatchNotice(`Compute environment "${form.name.trim()}" created.`);
      setWizardActive(false);
      resetForm();
      router.push(`/batch-job/compute-environments/${encodeURIComponent(form.name.trim())}`);
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to create compute environment"));
    } finally {
      setSubmitting(false);
    }
  }, [form, resetForm, router]);

  // ── Enable / disable ──────────────────────────────────────────────────────

  const runStateChange = useCallback(
    async (targets: ComputeEnvironmentDetail[], nextState: CEState) => {
      if (targets.length === 0) return;
      setUpdating(true);
      setError(null);
      const failures: string[] = [];
      for (const target of targets) {
        const name = target.computeEnvironmentName;
        if (!name) continue;
        try {
          await postBatch({
            action: "updateComputeEnvironment",
            computeEnvironment: name,
            state: nextState,
          });
        } catch (err: unknown) {
          failures.push(`${name}: ${errorMessage(err, "update failed")}`);
        }
      }
      setUpdating(false);
      setSelectedItems([]);
      if (failures.length > 0) {
        setError(
          `${failures.length} compute environment(s) could not be updated — ${failures.join("; ")}`,
        );
      } else {
        setSuccess(
          targets.length === 1
            ? `Compute environment "${targets[0].computeEnvironmentName}" ${nextState === "ENABLED" ? "enabled" : "disabled"}.`
            : `${targets.length} compute environments ${nextState === "ENABLED" ? "enabled" : "disabled"}.`,
        );
      }
      await load();
    },
    [load],
  );

  // ── Delete ────────────────────────────────────────────────────────────────

  const openDelete = useCallback(async (targets: ComputeEnvironmentDetail[]) => {
    if (targets.length === 0) return;
    setCheckingJobs(true);
    setError(null);
    try {
      const names = targets
        .map((t) => t.computeEnvironmentName)
        .filter((n): n is string => Boolean(n));
      const jqData = await getBatch({ action: "describeJobQueues" });
      const queues = (jqData.jobQueues || [])
        .filter((jq) =>
          (jq.computeEnvironmentOrder || []).some((o) => names.includes(o.computeEnvironment)),
        )
        .map((jq) => jq.jobQueueName)
        .filter((n): n is string => Boolean(n));
      const activeJobs = await countActiveJobsInQueues(queues);
      setDeleteWarning(
        activeJobs > 0
          ? `You have ${activeJobs} active job(s) running in the compute environment(s) you are about to delete. Deleting them will interrupt running jobs and new jobs cannot be scheduled to these environments.`
          : undefined,
      );
      setDeleteQueue(targets);
      setDeleteTotal(targets.length);
    } catch (err: unknown) {
      setError(errorMessage(err, "Could not check for running jobs — deletion was not started"));
    } finally {
      setCheckingJobs(false);
    }
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = deleteQueue[0];
    const name = target?.computeEnvironmentName;
    if (!name) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteBatchResource("computeEnvironment", name);
      const remaining = deleteQueue.slice(1);
      setDeleteQueue(remaining);
      if (remaining.length === 0) {
        setSuccess(
          deleteTotal === 1
            ? `Compute environment "${name}" deleted.`
            : `${deleteTotal} compute environments deleted.`,
        );
        setSelectedItems([]);
        await load();
      }
    } catch (err: unknown) {
      setError(errorMessage(err, "Failed to delete compute environment"));
      setDeleteQueue([]);
      await load();
    } finally {
      setDeleting(false);
    }
  }, [deleteQueue, deleteTotal, load]);

  // ── Table data ────────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    if (!filteringText.trim()) return items;
    const lower = filteringText.toLowerCase();
    return items.filter(
      (item) =>
        item.computeEnvironmentName?.toLowerCase().includes(lower) ||
        item.type?.toLowerCase().includes(lower) ||
        item.state?.toLowerCase().includes(lower) ||
        item.status?.toLowerCase().includes(lower) ||
        item.computeResources?.instanceTypes?.some((t) => t.toLowerCase().includes(lower)),
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

  const columnDefinitions = useMemo<TableProps.ColumnDefinition<ComputeEnvironmentDetail>[]>(() => {
    const all: TableProps.ColumnDefinition<ComputeEnvironmentDetail>[] = [
      {
        id: "name",
        header: "Name",
        isRowHeader: true,
        sortingField: "computeEnvironmentName",
        cell: (item) => (
          <Button
            variant="link"
            formAction="none"
            onClick={() =>
              router.push(
                `/batch-job/compute-environments/${encodeURIComponent(
                  item.computeEnvironmentName || "",
                )}`,
              )
            }
          >
            {item.computeEnvironmentName || "—"}
          </Button>
        ),
      },
      {
        id: "type",
        header: "Type",
        sortingField: "type",
        cell: (item) => item.type || "—",
      },
      {
        id: "state",
        header: "State",
        sortingField: "state",
        cell: (item) => (
          <StatusIndicator type={ceStateType(item.state)}>{item.state || "—"}</StatusIndicator>
        ),
      },
      {
        id: "status",
        header: "Status",
        sortingField: "status",
        cell: (item) => (
          <StatusIndicator type={ceStatusType(item.status)}>{item.status || "—"}</StatusIndicator>
        ),
      },
      {
        id: "maxvCpus",
        header: "Max vCPUs",
        cell: (item) => maxVcpusOf(item),
      },
      {
        id: "desiredvCpus",
        header: "Desired vCPUs",
        cell: (item) => desiredVcpusOf(item),
      },
      {
        id: "instanceTypes",
        header: "Instance types",
        cell: (item) => (
          <TruncatedText>{joinList(item.computeResources?.instanceTypes)}</TruncatedText>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (item) => (
          <ButtonDropdown
            ariaLabel={`Actions for ${item.computeEnvironmentName || "compute environment"}`}
            onItemClick={({ detail }) => {
              if (detail.id === "details") {
                router.push(
                  `/batch-job/compute-environments/${encodeURIComponent(
                    item.computeEnvironmentName || "",
                  )}`,
                );
              } else if (detail.id === "enable") {
                runStateChange([item], "ENABLED");
              } else if (detail.id === "disable") {
                runStateChange([item], "DISABLED");
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
      title: "Configure compute environment",
      description: "Specify a unique name for the compute environment.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Name"
            constraintText="Required. Up to 128 characters; letters, numbers, hyphens, and underscores only."
            errorText={formErrors.name}
          >
            <Input
              value={form.name}
              onChange={({ detail }) => setField("name", detail.value)}
              placeholder="my-compute-environment"
              ariaLabel="Compute environment name"
            />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Select environment type",
      description: "Choose whether AWS Batch manages the compute capacity.",
      content: (
        <SpaceBetween size="l">
          <Box variant="strong">Type</Box>
          <RadioGroup
            value={form.type}
            onChange={({ detail }) => setField("type", detail.value as "MANAGED" | "UNMANAGED")}
            items={CE_TYPE_OPTIONS}
          />
        </SpaceBetween>
      ),
    },
    {
      title: "Choose service role",
      description:
        "Select the IAM service role that AWS Batch uses to manage resources on your behalf.",
      content: (
        <SpaceBetween size="l">
          <Alert type="info" statusIconAriaLabel="Information">
            AWS Batch uses the service-linked role AWSServiceRoleForBatch by default. Specify a
            custom service role only if your organization requires one.
          </Alert>
          <FormField
            label="Service role"
            constraintText="Optional. Enter the full ARN of an IAM role, or leave blank to use the AWS Batch service-linked role."
            description="The role AWS Batch assumes to launch and terminate compute resources."
            errorText={formErrors.serviceRole}
          >
            <Input
              value={form.serviceRole}
              onChange={({ detail }) => setField("serviceRole", detail.value)}
              placeholder="arn:aws:iam::123456789012:role/AWSServiceRoleForBatch"
              ariaLabel="Service role ARN"
            />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Configure compute resources",
      description: "Define the capacity, networking, and tags for the compute environment.",
      content:
        form.type === "MANAGED" ? (
          <SpaceBetween size="l">
            <Box variant="strong">Capacity type</Box>
            <RadioGroup
              value={form.capacityType}
              onChange={({ detail }) => {
                const capacityType = detail.value as "EC2" | "SPOT";
                setForm((prev) => ({
                  ...prev,
                  capacityType,
                  allocationStrategy:
                    capacityType === "EC2" ? "BEST_FIT_PROGRESSIVE" : "SPOT_CAPACITY_OPTIMIZED",
                }));
              }}
              items={[
                {
                  value: "EC2",
                  label: "On-Demand (EC2)",
                  description:
                    "Pay for compute capacity by the hour or second with no long-term commitment.",
                },
                {
                  value: "SPOT",
                  label: "Spot",
                  description:
                    "Use spare EC2 capacity at a discount. Capacity can be reclaimed by AWS at any time.",
                },
              ]}
            />

            <FormField
              label="Allocation strategy"
              description="Determines how AWS Batch selects instances for your jobs."
            >
              <Select
                selectedOption={
                  ALLOCATION_OPTIONS[form.capacityType].find(
                    (o) => o.value === form.allocationStrategy,
                  ) ?? null
                }
                onChange={({ detail }) => {
                  const selected = detail.selectedOption;
                  if (selected && "value" in selected && selected.value) {
                    setField("allocationStrategy", selected.value);
                  }
                }}
                options={ALLOCATION_OPTIONS[form.capacityType]}
                ariaLabel="Allocation strategy"
              />
            </FormField>

            <FormField
              label="Instance types"
              constraintText="Optional. Comma-separated, e.g. m5.large, c5.xlarge. Leave blank to allow all supported instance types."
              errorText={formErrors.instanceTypes}
            >
              <Input
                value={form.instanceTypes}
                onChange={({ detail }) => setField("instanceTypes", detail.value)}
                placeholder="m5.large, c5.xlarge"
                ariaLabel="Instance types"
              />
            </FormField>

            <ColumnLayout columns={3} variant="default">
              <FormField
                label="Min vCPUs"
                constraintText="Minimum number of VCPUs to keep idle."
                errorText={formErrors.minvCpus}
              >
                <Input
                  type="number"
                  value={form.minvCpus}
                  onChange={({ detail }) => setField("minvCpus", detail.value)}
                  ariaLabel="Min vCPUs"
                />
              </FormField>
              <FormField
                label="Max vCPUs"
                constraintText="Required. Maximum number of VCPUs."
                errorText={formErrors.maxvCpus}
              >
                <Input
                  type="number"
                  value={form.maxvCpus}
                  onChange={({ detail }) => setField("maxvCpus", detail.value)}
                  ariaLabel="Max vCPUs"
                />
              </FormField>
              <FormField
                label="Desired vCPUs"
                constraintText="Number of VCPUs to keep provisioned when idle."
                errorText={formErrors.desiredvCpus}
              >
                <Input
                  type="number"
                  value={form.desiredvCpus}
                  onChange={({ detail }) => setField("desiredvCpus", detail.value)}
                  ariaLabel="Desired vCPUs"
                />
              </FormField>
            </ColumnLayout>

            <FormField
              label="Subnets"
              constraintText="Required. Comma-separated subnet IDs, e.g. subnet-abc123, subnet-def456."
              errorText={formErrors.subnets}
            >
              <Input
                value={form.subnets}
                onChange={({ detail }) => setField("subnets", detail.value)}
                placeholder="subnet-abc123, subnet-def456"
                ariaLabel="Subnets"
              />
            </FormField>

            <FormField
              label="Security groups"
              constraintText="Required. Comma-separated security group IDs, e.g. sg-abc123."
              errorText={formErrors.securityGroups}
            >
              <Input
                value={form.securityGroups}
                onChange={({ detail }) => setField("securityGroups", detail.value)}
                placeholder="sg-abc123"
                ariaLabel="Security groups"
              />
            </FormField>

            {form.capacityType === "SPOT" && (
              <FormField
                label="Spot bid percentage"
                constraintText="Optional. Whole number between 0 and 100. The percentage by which to raise your Spot bid above the current Spot price."
                errorText={formErrors.bidPercentage}
              >
                <Input
                  type="number"
                  value={form.bidPercentage}
                  onChange={({ detail }) => setField("bidPercentage", detail.value)}
                  placeholder="100"
                  ariaLabel="Spot bid percentage"
                />
              </FormField>
            )}

            <FormField
              label="Tags"
              description="Optional. Add metadata to the compute environment."
            >
              <TagEditor tags={form.tags} onChange={(tags) => setField("tags", tags)} />
            </FormField>
          </SpaceBetween>
        ) : (
          <SpaceBetween size="l">
            <Alert type="info" statusIconAriaLabel="Information">
              Unmanaged compute environments use capacity that you provide and maintain yourself —
              AWS Batch will not provision instances.
            </Alert>
            <FormField
              label="Maximum vCPUs"
              constraintText="Optional. The maximum number of unmanaged VCPUs the environment can use."
              errorText={formErrors.unmanagedvCpus}
            >
              <Input
                type="number"
                value={form.unmanagedvCpus}
                onChange={({ detail }) => setField("unmanagedvCpus", detail.value)}
                ariaLabel="Maximum vCPUs"
              />
            </FormField>
            <FormField
              label="Tags"
              description="Optional. Add metadata to the compute environment."
            >
              <TagEditor tags={form.tags} onChange={(tags) => setField("tags", tags)} />
            </FormField>
          </SpaceBetween>
        ),
    },
    {
      title: "Review",
      description: "Review your compute environment configuration before creating it.",
      content: (
        <Container header={<Header variant="h3">Review summary</Header>}>
          <ColumnLayout columns={3} variant="default">
            <DetailItem label="Name">{form.name.trim() || "—"}</DetailItem>
            <DetailItem label="Type">{form.type}</DetailItem>
            <DetailItem label="State">ENABLED</DetailItem>
            <DetailItem label="Service role">
              <TruncatedText>
                {form.serviceRole.trim() || "Service-linked role (default)"}
              </TruncatedText>
            </DetailItem>
            {form.type === "MANAGED" && (
              <>
                <DetailItem label="Capacity type">{form.capacityType}</DetailItem>
                <DetailItem label="Allocation strategy">{form.allocationStrategy}</DetailItem>
                <DetailItem label="Min / Max / Desired vCPUs">
                  {`${form.minvCpus} / ${form.maxvCpus} / ${form.desiredvCpus}`}
                </DetailItem>
                <DetailItem label="Instance types">
                  {parseList(form.instanceTypes).length > 0
                    ? joinList(parseList(form.instanceTypes))
                    : "All supported types"}
                </DetailItem>
                <DetailItem label="Subnets">{joinList(parseList(form.subnets))}</DetailItem>
                <DetailItem label="Security groups">
                  {joinList(parseList(form.securityGroups))}
                </DetailItem>
                {form.capacityType === "SPOT" && form.bidPercentage.trim() && (
                  <DetailItem label="Spot bid percentage">{form.bidPercentage}</DetailItem>
                )}
              </>
            )}
            {form.type === "UNMANAGED" && form.unmanagedvCpus.trim() && (
              <DetailItem label="Maximum vCPUs">{form.unmanagedvCpus}</DetailItem>
            )}
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
        <Header variant="h1">Create compute environment</Header>
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
            submitButtonText={submitting ? "Creating…" : "Create compute environment"}
            i18nStrings={{
              stepNumberLabel: (stepNumber: number) => `Step ${stepNumber}`,
              navigationAriaLabel: "Compute environment wizard navigation",
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
                setWizardActive(true);
              }}
            >
              Create compute environment
            </Button>
          </SpaceBetween>
        }
      >
        Compute environments
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
        loadingText="Loading compute environments..."
        selectionType="multi"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) =>
          setSelectedItems(detail.selectedItems as ComputeEnvironmentDetail[])
        }
        trackBy="computeEnvironmentName"
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
            filteringPlaceholder="Filter compute environments"
            filteringAriaLabel="Filter compute environments"
            onChange={({ detail }) => {
              setFilteringText(detail.filteringText);
              setCurrentPage(1);
            }}
            countText={
              filteringText
                ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                : `${items.length} compute environments`
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
                { value: 10, label: "10 compute environments" },
                { value: 25, label: "25 compute environments" },
                { value: 50, label: "50 compute environments" },
                { value: 100, label: "100 compute environments" },
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
              No compute environments found
            </Box>
            <Box variant="p" padding={{ bottom: "s" }} color="inherit">
              {filteringText
                ? "No compute environments match your filter. Try a different search."
                : "To get started, create a compute environment."}
            </Box>
            {!filteringText && (
              <Button
                formAction="none"
                onClick={() => {
                  resetForm();
                  setWizardActive(true);
                }}
              >
                Create compute environment
              </Button>
            )}
          </Box>
        }
      />

      {(checkingJobs || deleteQueue.length > 0) &&
        (deleteWarning ? (
          <TypedActionModal
            visible={deleteQueue.length > 0}
            title="Delete compute environment"
            resourceName={deleteQueue[0]?.computeEnvironmentName || ""}
            resourceType="compute environment"
            actionLabel="Delete"
            warning={deleteWarning}
            loading={deleting}
            onConfirm={handleConfirmDelete}
            onDismiss={() => setDeleteQueue([])}
          />
        ) : (
          <ConfirmModal
            visible={deleteQueue.length > 0}
            resourceName={deleteQueue[0]?.computeEnvironmentName || ""}
            resourceType="compute environment"
            actionLabel="Delete"
            onConfirm={handleConfirmDelete}
            onDismiss={() => setDeleteQueue([])}
            loading={deleting}
          />
        ))}
    </SpaceBetween>
  );
}
