"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Flashbar from "@cloudscape-design/components/flashbar";
import StatusIndicator, {
  StatusIndicatorProps,
} from "@cloudscape-design/components/status-indicator";
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
import Tabs from "@cloudscape-design/components/tabs";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Header from "@cloudscape-design/components/header";
import { apiFetch } from "@/lib/api-client";
import { CrossServiceLinks, CrossServiceLink } from "@/components/CrossServiceLinks";
import ConfirmModal from "@/components/ConfirmModal";
import TagEditor, { Tag } from "@/components/TagEditor";
import TruncatedText from "@/components/TruncatedText";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlacementGroup {
  GroupName?: string;
  GroupId?: string;
  Strategy?: string;
  State?: string;
  PartitionCount?: number;
  GroupArn?: string;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

interface Ec2ApiResponse {
  success?: boolean;
  error?: string;
  placementGroups?: PlacementGroup[];
  placementGroup?: PlacementGroup;
  [key: string]: unknown;
}

const RELATED_LINKS: CrossServiceLink[] = [
  { label: "EC2 Instances", href: "/ec2" },
  { label: "Launch instances", href: "/ec2/launch" },
  { label: "Spot requests", href: "/ec2-spot-instance" },
  { label: "Dedicated Hosts", href: "/ec2-dedicated-host" },
];

const STRATEGY_OPTIONS = [
  {
    value: "cluster",
    label: "Cluster",
    description:
      "Pack instances close together inside a single Availability Zone to achieve the lowest possible latency.",
  },
  {
    value: "spread",
    label: "Spread",
    description:
      "Spread instances across underlying hardware to support critical applications that need to stay running.",
  },
  {
    value: "partition",
    label: "Partition",
    description:
      "Divide the placement group into logical segments (partitions) for large-scale, distributed workloads.",
  },
];

const NAME_PATTERN = /^[A-Za-z0-9_\-.]+$/;

const COLUMN_LABELS: Record<string, string> = {
  name: "Name",
  state: "State",
  strategy: "Strategy",
  partitionCount: "Partition count",
  tags: "Tags",
  actions: "Actions",
};

function strategyLabel(strategy?: string): string {
  return STRATEGY_OPTIONS.find((o) => o.value === strategy)?.label ?? strategy ?? "—";
}

function stateIndicatorType(state?: string): StatusIndicatorProps.Type {
  switch (state) {
    case "available":
      return "success";
    case "pending":
    case "creating":
    case "deleting":
      return "warning";
    case "failed":
      return "error";
    case "deleted":
      return "stopped";
    default:
      return "info";
  }
}

function tagText(tags?: Array<{ Key?: string; Value?: string }>): string {
  if (!tags || tags.length === 0) return "—";
  return tags.map((t) => `${t.Key ?? ""}=${t.Value ?? ""}`).join(", ");
}

async function postEc2(payload: Record<string, unknown>): Promise<Ec2ApiResponse> {
  const res = await apiFetch("/api/ec2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as Ec2ApiResponse;
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EC2PlacementGroupPage() {
  const [items, setItems] = useState<PlacementGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<PlacementGroup[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    pageSize: 25,
    contentDisplay: [],
  });
  const [detail, setDetail] = useState<PlacementGroup | null>(null);

  // Create wizard
  const [wizardActive, setWizardActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{
    groupName: string;
    strategy: string;
    partitionCount: string;
    tags: Tag[];
  }>({
    groupName: "",
    strategy: "cluster",
    partitionCount: "2",
    tags: [],
  });
  const [formErrors, setFormErrors] = useState<{ groupName?: string; partitionCount?: string }>({});

  // Delete queue (typed confirmation, one resource at a time)
  const [deleteQueue, setDeleteQueue] = useState<PlacementGroup[]>([]);
  const [deleteTotal, setDeleteTotal] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await postEc2({ action: "describePlacementGroups" });
      const list = data.placementGroups || [];
      setItems(list);
      setDetail((prev) =>
        prev ? (list.find((g) => g.GroupName === prev.GroupName) ?? null) : null,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch placement groups");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 6000);
    return () => clearTimeout(timer);
  }, [success]);

  // ── Create wizard ─────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setForm({ groupName: "", strategy: "cluster", partitionCount: "2", tags: [] });
    setFormErrors({});
    setStepIndex(0);
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: { groupName?: string; partitionCount?: string } = {};
    const name = form.groupName.trim();
    if (!name) {
      errors.groupName = "Placement group name is required";
    } else if (name.length > 255) {
      errors.groupName = "Name must be 255 characters or fewer";
    } else if (!NAME_PATTERN.test(name)) {
      errors.groupName = "Use only letters, numbers, hyphens, underscores, or periods (no spaces)";
    }
    if (form.strategy === "partition") {
      const count = Number(form.partitionCount);
      if (!Number.isInteger(count) || count < 1) {
        errors.partitionCount = "Partition count must be a whole number of at least 1";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form]);

  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        action: "createPlacementGroup",
        groupName: form.groupName.trim(),
        strategy: form.strategy,
      };
      if (form.strategy === "partition") payload.partitionCount = Number(form.partitionCount);
      const tags = form.tags
        .filter((t) => t.key.trim())
        .map((t) => ({ Key: t.key.trim(), Value: t.value }));
      if (tags.length > 0) payload.tags = tags;

      await postEc2(payload);
      setSuccess(`Placement group "${form.groupName.trim()}" created.`);
      setWizardActive(false);
      resetForm();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create placement group");
    } finally {
      setSubmitting(false);
    }
  }, [form, validateForm, load, resetForm]);

  // ── Delete ────────────────────────────────────────────────────────────────

  const openDelete = useCallback((targets: PlacementGroup[]) => {
    if (targets.length === 0) return;
    setDeleteQueue(targets);
    setDeleteTotal(targets.length);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = deleteQueue[0];
    if (!target?.GroupName) return;
    setDeleting(true);
    setError(null);
    try {
      await postEc2({ action: "deletePlacementGroup", groupName: target.GroupName });
      const remaining = deleteQueue.slice(1);
      setDeleteQueue(remaining);
      if (remaining.length === 0) {
        setSuccess(
          deleteTotal === 1
            ? `Placement group "${target.GroupName}" deleted.`
            : `${deleteTotal} placement groups deleted.`,
        );
        setSelectedItems([]);
        await load();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete placement group");
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
        item.GroupName?.toLowerCase().includes(lower) ||
        item.GroupId?.toLowerCase().includes(lower) ||
        item.Strategy?.toLowerCase().includes(lower) ||
        item.State?.toLowerCase().includes(lower),
    );
  }, [items, filteringText]);

  const pageSize = preferences.pageSize ?? 25;
  const visibleColumnIds = useMemo(() => {
    const cd = preferences.contentDisplay;
    if (!cd || cd.length === 0) return null;
    return cd.flatMap((entry) =>
      entry.type === "group" ? entry.children.map((c) => c.id) : entry.visible ? [entry.id] : [],
    );
  }, [preferences.contentDisplay]);

  const columnDefinitions = useMemo<TableProps.ColumnDefinition<PlacementGroup>[]>(() => {
    const all: TableProps.ColumnDefinition<PlacementGroup>[] = [
      {
        id: "name",
        header: "Name",
        isRowHeader: true,
        sortingField: "name",
        cell: (item) => (
          <Button variant="link" formAction="none" onClick={() => setDetail(item)}>
            {item.GroupName || "—"}
          </Button>
        ),
      },
      {
        id: "state",
        header: "State",
        sortingField: "state",
        cell: (item) => (
          <StatusIndicator type={stateIndicatorType(item.State)}>
            {item.State || "—"}
          </StatusIndicator>
        ),
      },
      {
        id: "strategy",
        header: "Strategy",
        sortingField: "strategy",
        cell: (item) => strategyLabel(item.Strategy),
      },
      {
        id: "partitionCount",
        header: "Partition count",
        cell: (item) => (item.Strategy === "partition" ? String(item.PartitionCount ?? "—") : "—"),
      },
      {
        id: "tags",
        header: "Tags",
        cell: (item) => <TruncatedText>{tagText(item.Tags)}</TruncatedText>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: (item) => (
          <ButtonDropdown
            variant="icon"
            ariaLabel={`Actions for ${item.GroupName || "placement group"}`}
            onItemClick={({ detail }) => {
              if (detail.id === "details") setDetail(item);
              else if (detail.id === "delete") openDelete([item]);
            }}
            items={[
              { id: "details", text: "View details" },
              { id: "delete", text: "Delete" },
            ]}
          />
        ),
      },
    ];
    return visibleColumnIds ? all.filter((c) => c.id && visibleColumnIds.includes(c.id)) : all;
  }, [visibleColumnIds, openDelete]);

  const allColumnIds = ["name", "state", "strategy", "partitionCount", "tags", "actions"];

  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ── Wizard steps ──────────────────────────────────────────────────────────

  const wizardSteps = [
    {
      title: "Configure placement group",
      description:
        "Specify a name, a placement strategy, and optional tags for the placement group.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Name"
            constraintText="Required. Up to 255 characters; letters, numbers, hyphens, underscores, and periods only."
            errorText={formErrors.groupName}
          >
            <Input
              value={form.groupName}
              onChange={({ detail }) => {
                setForm((prev) => ({ ...prev, groupName: detail.value }));
                setFormErrors((prev) => ({ ...prev, groupName: undefined }));
              }}
              placeholder="my-placement-group"
              ariaLabel="Placement group name"
            />
          </FormField>

          <Box variant="strong">Strategy</Box>
          <RadioGroup
            value={form.strategy}
            onChange={({ detail }) => setForm((prev) => ({ ...prev, strategy: detail.value }))}
            items={STRATEGY_OPTIONS}
          />

          {form.strategy === "partition" && (
            <FormField
              label="Number of partitions"
              constraintText="Required for the partition strategy. Minimum value: 1."
              errorText={formErrors.partitionCount}
            >
              <Input
                type="number"
                value={form.partitionCount}
                onChange={({ detail }) => {
                  setForm((prev) => ({ ...prev, partitionCount: detail.value }));
                  setFormErrors((prev) => ({ ...prev, partitionCount: undefined }));
                }}
                ariaLabel="Number of partitions"
              />
            </FormField>
          )}

          <FormField label="Tags" description="Optional. Add metadata to the placement group.">
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
      description: "Review your placement group configuration before creating it.",
      content: (
        <Container header={<Header variant="h3">Review summary</Header>}>
          <ColumnLayout columns={3} variant="default">
            <div>
              <Box variant="small" color="text-label">
                Name
              </Box>
              <Box>{form.groupName.trim() || "—"}</Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Strategy
              </Box>
              <Box>{strategyLabel(form.strategy)}</Box>
            </div>
            {form.strategy === "partition" && (
              <div>
                <Box variant="small" color="text-label">
                  Partition count
                </Box>
                <Box>{form.partitionCount}</Box>
              </div>
            )}
            <div>
              <Box variant="small" color="text-label">
                Tags
              </Box>
              <Box>
                {form.tags.filter((t) => t.key.trim()).length > 0
                  ? form.tags
                      .filter((t) => t.key.trim())
                      .map((t) => `${t.key}=${t.value}`)
                      .join(", ")
                  : "None"}
              </Box>
            </div>
          </ColumnLayout>
        </Container>
      ),
    },
  ];

  if (wizardActive) {
    return (
      <Box padding="m">
        <SpaceBetween size="l">
          <AwsServiceHeader
          serviceName="Create placement group"
          serviceIcon={SERVICE_ICONS["/ec2-placement-group"]?.small}
          counter={items?.length ?? 0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/ec2-placement-group/create")}>
            Create placement group
        </button>

        />
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Container>
            <Wizard
              steps={wizardSteps}
              activeStepIndex={stepIndex}
              onNavigate={({ detail }) => {
                if (detail.requestedStepIndex > stepIndex && !validateForm()) return;
                setStepIndex(detail.requestedStepIndex);
              }}
              onCancel={() => {
                setWizardActive(false);
                setError(null);
                resetForm();
              }}
              onSubmit={handleCreate}
              submitButtonText={submitting ? "Creating…" : "Create"}
              i18nStrings={{
                stepNumberLabel: (stepNumber: number) => `Step ${stepNumber}`,
                navigationAriaLabel: "Placement group wizard navigation",
                nextButton: "Next",
                previousButton: "Previous",
                cancelButton: "Cancel",
              }}
            />
          </Container>
        </SpaceBetween>
      </Box>
    );
  }

  if (detail) {
    return (
      <Box padding="m">
        <SpaceBetween size="l">
          <Header
            variant="h2"
            actions={
              <Button formAction="none" onClick={() => setDetail(null)}>
                Back to list
              </Button>
            }
          >
            {detail.GroupName}
          </Header>

          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Tabs
            tabs={[
              {
                label: "Details",
                id: "details",
                content: (
                  <ColumnLayout columns={3} variant="default">
                    <div>
                      <Box variant="small" color="text-label">
                        Name
                      </Box>
                      <Box>{detail.GroupName || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Group ID
                      </Box>
                      <Box>{detail.GroupId || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Group ARN
                      </Box>
                      <Box>
                        <TruncatedText>{detail.GroupArn || "—"}</TruncatedText>
                      </Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        State
                      </Box>
                      <Box>
                        <StatusIndicator type={stateIndicatorType(detail.State)}>
                          {detail.State || "—"}
                        </StatusIndicator>
                      </Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Strategy
                      </Box>
                      <Box>{strategyLabel(detail.Strategy)}</Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Partition count
                      </Box>
                      <Box>
                        {detail.Strategy === "partition"
                          ? String(detail.PartitionCount ?? "—")
                          : "—"}
                      </Box>
                    </div>
                  </ColumnLayout>
                ),
              },
              {
                label: "Tags",
                id: "tags",
                content:
                  detail.Tags && detail.Tags.length > 0 ? (
                    <Table
                      columnDefinitions={[
                        {
                          header: "Key",
                          cell: (tag: { Key?: string; Value?: string }) => tag.Key || "—",
                        },
                        {
                          header: "Value",
                          cell: (tag: { Key?: string; Value?: string }) => tag.Value || "—",
                        },
                      ]}
                      items={detail.Tags}
                      header={<Header variant="h3">Tags ({detail.Tags.length})</Header>}
                      empty={<Box>No tags</Box>}
                    />
                  ) : (
                    <Box>No tags</Box>
                  ),
              },
            ]}
          />
        </SpaceBetween>
      </Box>
    );
  }

  return (
    <Box padding="m">
      <SpaceBetween size="l">
        <Header
          variant="h2"
          counter={`(${items.length})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button iconName="refresh" onClick={load} ariaLabel="Refresh">
                Refresh
              </Button>
              <Button
                disabled={selectedItems.length === 0}
                onClick={() => openDelete(selectedItems)}
              >
                Delete
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  resetForm();
                  setWizardActive(true);
                }}
              >
                Create placement group
              </Button>
            </SpaceBetween>
          }
        >
          Placement groups
        </Header>

        <CrossServiceLinks links={RELATED_LINKS} />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Flashbar
            items={[
              {
                id: "create-success",
                type: "success",
                content: success,
                dismissible: true,
                onDismiss: () => setSuccess(null),
              },
            ]}
          />
        )}

        <Table
          columnDefinitions={columnDefinitions}
          items={pagedItems}
          loading={loading}
          loadingText="Loading placement groups..."
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) =>
            setSelectedItems(detail.selectedItems as PlacementGroup[])
          }
          trackBy="GroupName"
          filter={
            <TextFilter
              filteringText={filteringText}
              filteringPlaceholder="Filter placement groups"
              filteringAriaLabel="Filter placement groups"
              onChange={({ detail }) => {
                setFilteringText(detail.filteringText);
                setCurrentPage(1);
              }}
              countText={
                filteringText
                  ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                  : `${items.length} placement groups`
              }
            />
          }
          pagination={
            <Pagination
              currentPageIndex={currentPage}
              pagesCount={Math.max(1, Math.ceil(filteredItems.length / pageSize))}
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
                  { value: 10, label: "10 placement groups" },
                  { value: 25, label: "25 placement groups" },
                  { value: 50, label: "50 placement groups" },
                  { value: 100, label: "100 placement groups" },
                ],
              }}
              contentDisplayPreference={{
                title: "Select visible columns",
                options: allColumnIds.map((id) => ({ id, label: COLUMN_LABELS[id] ?? id })),
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
                No placement groups found
              </Box>
              <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                {filteringText
                  ? "No placement groups match your filter. Try a different search."
                  : "To get started, create a placement group."}
              </Box>
              {!filteringText && (
                <Button
                  formAction="none"
                  onClick={() => {
                    resetForm();
                    setWizardActive(true);
                  }}
                >
                  Create placement group
                </Button>
              )}
            </Box>
          }
        />
      </SpaceBetween>

      {deleteQueue.length > 0 && (
        <ConfirmModal
          visible={true}
          resourceName={deleteQueue[0].GroupName || ""}
          resourceType="placement group"
          actionLabel="Delete"
          onConfirm={handleConfirmDelete}
          onDismiss={() => setDeleteQueue([])}
          loading={deleting}
        />
      )}
    </Box>
  );
}
