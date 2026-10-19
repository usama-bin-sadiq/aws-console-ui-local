"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@cloudscape-design/components/header";
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
import Select from "@cloudscape-design/components/select";
import Checkbox from "@cloudscape-design/components/checkbox";
import Tabs from "@cloudscape-design/components/tabs";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import { apiFetch } from "@/lib/api-client";
import { CrossServiceLinks, CrossServiceLink } from "@/components/CrossServiceLinks";
import ConfirmModal from "@/components/ConfirmModal";
import TagEditor, { Tag } from "@/components/TagEditor";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HostTag {
  Key?: string;
  Value?: string;
}

interface HostInstance {
  InstanceId?: string;
  InstanceType?: string;
  State?: string;
}

interface DedicatedHost {
  HostId?: string;
  State?: string;
  AvailabilityZone?: string;
  InstanceType?: string;
  AutoPlacement?: string;
  HostRecovery?: string;
  OwnerId?: string;
  Instances?: HostInstance[];
  Tags?: HostTag[];
}

interface Ec2ApiResponse {
  success?: boolean;
  error?: string;
  hosts?: DedicatedHost[];
  hostIds?: string[];
  instanceTypes?: Array<{ InstanceType?: string }>;
  availabilityZones?: Array<{ ZoneName?: string; ZoneId?: string; State?: string }>;
  [key: string]: unknown;
}

const RELATED_LINKS: CrossServiceLink[] = [
  { label: "Amazon EC2", href: "/ec2" },
  { label: "Placement groups", href: "/ec2-placement-group" },
  { label: "Spot requests", href: "/ec2-spot-instance" },
  { label: "Network interfaces", href: "/ec2-network-interface" },
];

const COLUMN_LABELS: Record<string, string> = {
  hostId: "Host ID",
  instanceType: "Instance type",
  az: "Availability Zone",
  state: "State",
  placements: "Instance placements",
  autoPlacement: "Auto-placement",
  recovery: "Recovery",
  tags: "Tags",
  actions: "Actions",
};

const ALL_COLUMN_IDS = Object.keys(COLUMN_LABELS);

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

function stateIndicatorType(state?: string): StatusIndicatorProps.Type {
  switch (state) {
    case "available":
      return "success";
    case "released":
      return "stopped";
    case "failed":
      return "error";
    case "pending":
    case "under-assessment":
      return "in-progress";
    default:
      return "info";
  }
}

function tagText(tags?: HostTag[]): string {
  if (!tags || tags.length === 0) return "—";
  return tags.map((t) => `${t.Key ?? ""}=${t.Value ?? ""}`).join(", ");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EC2DedicatedHostPage() {
  const [items, setItems] = useState<DedicatedHost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<DedicatedHost[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    pageSize: 25,
    contentDisplay: [],
  });
  const [detail, setDetail] = useState<DedicatedHost | null>(null);
  const [detailTab, setDetailTab] = useState("details");

  // Allocate wizard
  const [wizardActive, setWizardActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    instanceType: "",
    quantity: "1",
    availabilityZone: "",
    autoPlacement: true,
    hostRecovery: true,
    tags: [] as Tag[],
  });
  const [formErrors, setFormErrors] = useState<{
    instanceType?: string;
    quantity?: string;
    availabilityZone?: string;
  }>({});
  const [instanceTypes, setInstanceTypes] = useState<string[]>([]);
  const [availabilityZones, setAvailabilityZones] = useState<string[]>([]);

  // Release queue (typed confirmation, one host at a time)
  const [releaseQueue, setReleaseQueue] = useState<DedicatedHost[]>([]);
  const [releaseTotal, setReleaseTotal] = useState(0);
  const [releasing, setReleasing] = useState(false);

  const pageSize = preferences.pageSize ?? 25;

  // ── Load ───────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await postEc2({ action: "describeHosts" });
      const list = data.hosts || [];
      setItems(list);
      setDetail((prev) => (prev ? (list.find((h) => h.HostId === prev.HostId) ?? null) : null));
      setSelectedItems([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch Dedicated Hosts");
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

  // ── Filtering & pagination ────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    if (!filteringText.trim()) return items;
    const lower = filteringText.toLowerCase();
    return items.filter(
      (h) =>
        h.HostId?.toLowerCase().includes(lower) ||
        h.InstanceType?.toLowerCase().includes(lower) ||
        h.AvailabilityZone?.toLowerCase().includes(lower) ||
        h.State?.toLowerCase().includes(lower),
    );
  }, [items, filteringText]);

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const visibleColumnIds = useMemo(() => {
    const cd = preferences.contentDisplay;
    if (!cd || cd.length === 0) return null;
    return cd.flatMap((entry) =>
      entry.type === "group" ? entry.children.map((c) => c.id) : entry.visible ? [entry.id] : [],
    );
  }, [preferences.contentDisplay]);

  // ── Allocate wizard ───────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setForm({
      instanceType: "",
      quantity: "1",
      availabilityZone: "",
      autoPlacement: true,
      hostRecovery: true,
      tags: [],
    });
    setFormErrors({});
  }, []);

  const openWizard = useCallback(() => {
    resetForm();
    setStepIndex(0);
    setError(null);
    setWizardActive(true);

    Promise.all([
      postEc2({ action: "describeInstanceTypes", maxResults: 200 }),
      postEc2({ action: "describeAvailabilityZones" }),
    ])
      .then(([typeData, azData]) => {
        setInstanceTypes(
          (typeData.instanceTypes || []).map((t) => t.InstanceType || "").filter(Boolean),
        );
        setAvailabilityZones(
          (azData.availabilityZones || [])
            .filter((az) => !az.State || az.State === "available")
            .map((az) => az.ZoneName || "")
            .filter(Boolean),
        );
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load wizard options");
      });
  }, [resetForm]);

  const validateStep = useCallback(
    (step: number): boolean => {
      const errs: typeof formErrors = {};
      if (step === 0) {
        if (!form.instanceType) errs.instanceType = "Select an instance type";
        const qty = Number(form.quantity);
        if (!form.quantity || !Number.isInteger(qty) || qty < 1 || qty > 100) {
          errs.quantity = "Enter a whole number between 1 and 100";
        }
        if (!form.availabilityZone) errs.availabilityZone = "Select an Availability Zone";
      }
      setFormErrors(errs);
      return Object.keys(errs).length === 0;
    },
    [form],
  );

  const handleAllocate = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await postEc2({
        action: "allocateHosts",
        availabilityZone: form.availabilityZone,
        instanceType: form.instanceType,
        quantity: Number(form.quantity),
        autoPlacement: form.autoPlacement ? "on" : "off",
        hostRecovery: form.hostRecovery ? "on" : "off",
      });
      const hostIds = (data.hostIds || []).filter(Boolean) as string[];

      // AllocateHosts does not accept tag specifications, so apply tags in a
      // follow-up call once the hosts exist.
      const tags = form.tags
        .filter((t) => t.key.trim() !== "")
        .map((t) => ({ Key: t.key, Value: t.value }));
      if (hostIds.length > 0 && tags.length > 0) {
        await postEc2({ action: "createTags", resources: hostIds, tags });
      }

      setSuccess(
        hostIds.length === 1
          ? `Dedicated Host ${hostIds[0]} allocated.`
          : `Allocated ${hostIds.length} Dedicated Hosts.`,
      );
      setWizardActive(false);
      resetForm();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to allocate Dedicated Host");
    } finally {
      setSubmitting(false);
    }
  }, [form, load, resetForm]);

  const wizardSteps = [
    {
      title: "Configure host",
      description:
        "Choose the instance type, quantity, and Availability Zone for the Dedicated Host.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Instance type"
            constraintText="Required."
            errorText={formErrors.instanceType}
          >
            <Select
              selectedOption={
                form.instanceType ? { label: form.instanceType, value: form.instanceType } : null
              }
              onChange={({ detail }) => {
                const opt = detail.selectedOption as { value?: string } | null;
                setForm((prev) => ({ ...prev, instanceType: opt?.value ?? "" }));
                setFormErrors((prev) => ({ ...prev, instanceType: undefined }));
              }}
              options={instanceTypes.map((t) => ({ label: t, value: t }))}
              placeholder="Select an instance type"
              filteringType="auto"
              ariaLabel="Instance type"
            />
          </FormField>

          <FormField
            label="Quantity"
            constraintText="Required. Whole number between 1 and 100."
            errorText={formErrors.quantity}
          >
            <Input
              type="number"
              value={form.quantity}
              onChange={({ detail }) => {
                setForm((prev) => ({ ...prev, quantity: detail.value }));
                setFormErrors((prev) => ({ ...prev, quantity: undefined }));
              }}
              ariaLabel="Quantity"
            />
          </FormField>

          <FormField
            label="Availability Zone"
            constraintText="Required. A Dedicated Host runs in a single Availability Zone."
            errorText={formErrors.availabilityZone}
          >
            <Select
              selectedOption={
                form.availabilityZone
                  ? { label: form.availabilityZone, value: form.availabilityZone }
                  : null
              }
              onChange={({ detail }) => {
                const opt = detail.selectedOption as { value?: string } | null;
                setForm((prev) => ({ ...prev, availabilityZone: opt?.value ?? "" }));
                setFormErrors((prev) => ({ ...prev, availabilityZone: undefined }));
              }}
              options={availabilityZones.map((az) => ({ label: az, value: az }))}
              placeholder="Select an Availability Zone"
              filteringType="auto"
              ariaLabel="Availability Zone"
            />
          </FormField>

          <Checkbox
            checked={form.autoPlacement}
            onChange={({ detail }) =>
              setForm((prev) => ({ ...prev, autoPlacement: detail.checked }))
            }
          >
            Auto-placement
          </Checkbox>

          <Checkbox
            checked={form.hostRecovery}
            onChange={({ detail }) =>
              setForm((prev) => ({ ...prev, hostRecovery: detail.checked }))
            }
          >
            Host recovery
          </Checkbox>
        </SpaceBetween>
      ),
    },
    {
      title: "Tags",
      description: "Add optional tags to identify the Dedicated Host.",
      content: (
        <FormField label="Tags" description="Optional. Add metadata to the Dedicated Host.">
          <TagEditor tags={form.tags} onChange={(tags) => setForm((prev) => ({ ...prev, tags }))} />
        </FormField>
      ),
    },
    {
      title: "Review",
      description: "Review your Dedicated Host configuration before allocating it.",
      content: (
        <Container header={<Header variant="h3">Review summary</Header>}>
          <ColumnLayout columns={3} variant="default">
            <div>
              <Box variant="small" color="text-label">
                Instance type
              </Box>
              <Box>{form.instanceType || "—"}</Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Quantity
              </Box>
              <Box>{form.quantity}</Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Availability Zone
              </Box>
              <Box>{form.availabilityZone || "—"}</Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Auto-placement
              </Box>
              <Box>{form.autoPlacement ? "On" : "Off"}</Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Host recovery
              </Box>
              <Box>{form.hostRecovery ? "On" : "Off"}</Box>
            </div>
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

  // ── Release (typed confirmation queue) ────────────────────────────────────

  const openRelease = useCallback((targets: DedicatedHost[]) => {
    if (targets.length === 0) return;
    setError(null);
    setReleaseQueue(targets);
    setReleaseTotal(targets.length);
  }, []);

  const handleConfirmRelease = useCallback(async () => {
    const target = releaseQueue[0];
    if (!target?.HostId) return;
    setReleasing(true);
    setError(null);
    try {
      await postEc2({ action: "releaseHosts", hostIds: [target.HostId] });
      const remaining = releaseQueue.slice(1);
      setReleaseQueue(remaining);
      if (remaining.length === 0) {
        setSuccess(
          releaseTotal === 1
            ? `Dedicated Host "${target.HostId}" released.`
            : `${releaseTotal} Dedicated Hosts released.`,
        );
        setSelectedItems([]);
        await load();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to release Dedicated Host");
      setReleaseQueue([]);
      await load();
    } finally {
      setReleasing(false);
    }
  }, [releaseQueue, releaseTotal, load]);

  // ── Column definitions ────────────────────────────────────────────────────

  const columnDefinitions = useMemo<TableProps.ColumnDefinition<DedicatedHost>[]>(() => {
    const all: TableProps.ColumnDefinition<DedicatedHost>[] = [
      {
        id: "hostId",
        header: "Host ID",
        isRowHeader: true,
        cell: (item) => (
          <Button
            variant="link"
            formAction="none"
            onClick={() => {
              setDetailTab("details");
              setDetail(item);
            }}
          >
            {item.HostId || "—"}
          </Button>
        ),
      },
      {
        id: "instanceType",
        header: "Instance type",
        cell: (item) => item.InstanceType ?? "—",
      },
      {
        id: "az",
        header: "Availability Zone",
        cell: (item) => item.AvailabilityZone ?? "—",
      },
      {
        id: "state",
        header: "State",
        cell: (item) => (
          <StatusIndicator type={stateIndicatorType(item.State)}>
            {item.State ?? "—"}
          </StatusIndicator>
        ),
      },
      {
        id: "placements",
        header: "Instance placements",
        cell: (item) => String(item.Instances?.length ?? 0),
      },
      {
        id: "autoPlacement",
        header: "Auto-placement",
        cell: (item) => (item.AutoPlacement ? (item.AutoPlacement === "on" ? "On" : "Off") : "—"),
      },
      {
        id: "recovery",
        header: "Recovery",
        cell: (item) => (item.HostRecovery ? (item.HostRecovery === "on" ? "On" : "Off") : "—"),
      },
      { id: "tags", header: "Tags", cell: (item) => tagText(item.Tags) },
      {
        id: "actions",
        header: "Actions",
        cell: (item) => (
          <ButtonDropdown
            variant="icon"
            ariaLabel={`Actions for ${item.HostId ?? "host"}`}
            onItemClick={({ detail }) => {
              if (detail.id === "release") openRelease([item]);
            }}
            items={[{ id: "release", text: "Release host" }]}
          />
        ),
      },
    ];

    if (!visibleColumnIds) return all;
    return all.filter((col) => visibleColumnIds.includes(col.id ?? ""));
  }, [visibleColumnIds, openRelease]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (wizardActive) {
    return (
      <Box padding="m">
        <SpaceBetween size="l">
          <Header variant="h1">Allocate Dedicated Host</Header>
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
                if (detail.requestedStepIndex > stepIndex && !validateStep(stepIndex)) return;
                setStepIndex(detail.requestedStepIndex);
              }}
              onCancel={() => {
                setWizardActive(false);
                setError(null);
                resetForm();
              }}
              onSubmit={handleAllocate}
              submitButtonText={submitting ? "Allocating…" : "Allocate host"}
              i18nStrings={{
                stepNumberLabel: (stepNumber: number) => `Step ${stepNumber}`,
                navigationAriaLabel: "Dedicated Host wizard navigation",
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
            description="View the details of a Dedicated Host and the instances placed on it."
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  disabled={!detail.HostId}
                  onClick={() => detail.HostId && openRelease([detail])}
                >
                  Release host
                </Button>
                <Button iconName="arrow-left" onClick={() => setDetail(null)}>
                  Back to list
                </Button>
              </SpaceBetween>
            }
          >
            {detail.HostId ?? "Dedicated Host"}
          </Header>

          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Tabs
            activeTabId={detailTab}
            onChange={({ detail: d }) => setDetailTab(d.activeTabId)}
            tabs={[
              {
                id: "details",
                label: "Details",
                content: (
                  <Container>
                    <ColumnLayout columns={3} variant="text-grid">
                      <div>
                        <Box variant="awsui-key-label">Host ID</Box>
                        <Box>{detail.HostId ?? "—"}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">State</Box>
                        <Box>
                          <StatusIndicator type={stateIndicatorType(detail.State)}>
                            {detail.State ?? "—"}
                          </StatusIndicator>
                        </Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Instance type</Box>
                        <Box>{detail.InstanceType ?? "—"}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Availability Zone</Box>
                        <Box>{detail.AvailabilityZone ?? "—"}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Auto-placement</Box>
                        <Box>
                          {detail.AutoPlacement
                            ? detail.AutoPlacement === "on"
                              ? "On"
                              : "Off"
                            : "—"}
                        </Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Host recovery</Box>
                        <Box>
                          {detail.HostRecovery
                            ? detail.HostRecovery === "on"
                              ? "On"
                              : "Off"
                            : "—"}
                        </Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Owner ID</Box>
                        <Box>{detail.OwnerId ?? "—"}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Instance placements</Box>
                        <Box>{detail.Instances?.length ?? 0}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Association status</Box>
                        <Box color="text-body-secondary">
                          {detail.State === "available"
                            ? `Available — ${detail.Instances?.length ?? 0} instance(s) placed`
                            : "Derived from state and instance placements (no distinct API field)"}
                        </Box>
                      </div>
                    </ColumnLayout>
                  </Container>
                ),
              },
              {
                id: "instances",
                label: "Instances placed",
                content: (
                  <Container className="aws-table-card">
                    {detail.Instances && detail.Instances.length > 0 ? (
                      <Table
                        columnDefinitions={[
                          {
                            id: "instanceId",
                            header: "Instance ID",
                            isRowHeader: true,
                            cell: (i: HostInstance) =>
                              i.InstanceId ? (
                                <Link href={`/ec2/${i.InstanceId}`}>{i.InstanceId}</Link>
                              ) : (
                                "—"
                              ),
                          },
                          {
                            id: "instanceType",
                            header: "Instance type",
                            cell: (i: HostInstance) => i.InstanceType ?? "—",
                          },
                          {
                            id: "state",
                            header: "State",
                            cell: (i: HostInstance) => i.State ?? "—",
                          },
                        ]}
                        items={detail.Instances}
                        trackBy={(i: HostInstance) => i.InstanceId ?? ""}
                      />
                    ) : (
                      <Box color="text-body-secondary">No instances placed on this host</Box>
                    )}
                  </Container>
                ),
              },
              {
                id: "tags",
                label: "Tags",
                content: (
                  <Container className="aws-table-card">
                    {detail.Tags && detail.Tags.length > 0 ? (
                      <Table
                        columnDefinitions={[
                          { id: "key", header: "Key", cell: (t: HostTag) => t.Key ?? "" },
                          { id: "value", header: "Value", cell: (t: HostTag) => t.Value ?? "" },
                        ]}
                        items={detail.Tags}
                        trackBy={(t: HostTag) => t.Key ?? ""}
                      />
                    ) : (
                      <Box color="text-body-secondary">No tags</Box>
                    )}
                  </Container>
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
          description="Reserve physical servers for your EC2 instances on a per-region basis."
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button iconName="refresh" onClick={load} ariaLabel="Refresh">
                Refresh
              </Button>
              <Button
                disabled={selectedItems.length === 0}
                onClick={() => openRelease(selectedItems)}
              >
                Release host{selectedItems.length === 1 ? "" : "s"}
              </Button>
              <Button variant="primary" onClick={openWizard}>
                Allocate host
              </Button>
            </SpaceBetween>
          }
        >
          Dedicated Hosts
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
                id: "host-success",
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
          loadingText="Loading Dedicated Hosts..."
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) =>
            setSelectedItems(detail.selectedItems as DedicatedHost[])
          }
          trackBy="HostId"
          filter={
            <TextFilter
              filteringText={filteringText}
              filteringPlaceholder="Filter Dedicated Hosts"
              filteringAriaLabel="Filter Dedicated Hosts"
              onChange={({ detail }) => {
                setFilteringText(detail.filteringText);
                setCurrentPage(1);
              }}
              countText={
                filteringText
                  ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                  : `${items.length} Dedicated Hosts`
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
                  { value: 10, label: "10 Dedicated Hosts" },
                  { value: 25, label: "25 Dedicated Hosts" },
                  { value: 50, label: "50 Dedicated Hosts" },
                  { value: 100, label: "100 Dedicated Hosts" },
                ],
              }}
              contentDisplayPreference={{
                title: "Select visible columns",
                options: ALL_COLUMN_IDS.map((id) => ({ id, label: COLUMN_LABELS[id] ?? id })),
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
                No Dedicated Hosts found
              </Box>
              <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                {filteringText
                  ? "No Dedicated Hosts match your filter. Try a different search."
                  : "To get started, allocate a Dedicated Host."}
              </Box>
              {!filteringText && (
                <Button formAction="none" onClick={openWizard}>
                  Allocate host
                </Button>
              )}
            </Box>
          }
        />
      </SpaceBetween>

      {releaseQueue.length > 0 && (
        <ConfirmModal
          visible={true}
          resourceName={releaseQueue[0].HostId || ""}
          resourceType="Dedicated Host"
          actionLabel="Release"
          onConfirm={handleConfirmRelease}
          onDismiss={() => setReleaseQueue([])}
          loading={releasing}
        />
      )}
    </Box>
  );
}
