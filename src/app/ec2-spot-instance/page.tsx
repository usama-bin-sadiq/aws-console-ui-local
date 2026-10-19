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
import Multiselect from "@cloudscape-design/components/multiselect";
import Checkbox from "@cloudscape-design/components/checkbox";
import RadioGroup from "@cloudscape-design/components/radio-group";
import Modal from "@cloudscape-design/components/modal";
import Tabs from "@cloudscape-design/components/tabs";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import CloudscapeLink from "@cloudscape-design/components/link";
import { apiFetch } from "@/lib/api-client";
import { CrossServiceLinks, CrossServiceLink } from "@/components/CrossServiceLinks";
import TagEditor, { Tag } from "@/components/TagEditor";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpotTag {
  Key?: string;
  Value?: string;
}

interface SpotLaunchSpec {
  ImageId?: string;
  InstanceType?: string;
  KeyName?: string;
  SubnetId?: string;
  IamInstanceProfile?: { Arn?: string };
  LaunchGroupName?: string;
  NetworkInterfaces?: Array<{ Groups?: string[]; SubnetId?: string }>;
}

interface SpotRequest {
  SpotInstanceRequestId?: string;
  InstanceId?: string;
  Type?: string;
  Status?: { Code?: string; Message?: string };
  SpotPrice?: string;
  CreateTime?: string;
  ValidUntil?: string;
  LaunchSpecification?: SpotLaunchSpec;
  Tags?: SpotTag[];
  /** Derived at load time (not part of the API response). */
  AvailabilityZone?: string;
}

interface Ec2ApiResponse {
  success?: boolean;
  error?: string;
  spotInstanceRequests?: SpotRequest[];
  subnets?: Array<{ SubnetId?: string; AvailabilityZone?: string; VpcId?: string }>;
  images?: Array<{ ImageId?: string; Name?: string }>;
  instanceTypes?: Array<{ InstanceType?: string }>;
  keyPairs?: Array<{ KeyName?: string }>;
  vpcs?: Array<{ VpcId?: string; IsDefault?: boolean }>;
  securityGroups?: Array<{ GroupId?: string; GroupName?: string; VpcId?: string }>;
  [key: string]: unknown;
}

const RELATED_LINKS: CrossServiceLink[] = [
  { label: "Amazon EC2", href: "/ec2" },
  { label: "Placement groups", href: "/ec2-placement-group" },
  { label: "Dedicated Hosts", href: "/ec2-dedicated-host" },
  { label: "Network interfaces", href: "/ec2-network-interface" },
];

const COLUMN_LABELS: Record<string, string> = {
  id: "Spot request ID",
  instance: "Instance ID",
  type: "Type",
  status: "Status",
  instanceType: "Instance type",
  price: "Price",
  az: "Availability Zone",
  launchTemplate: "Launch template/group",
  created: "Created",
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

function statusIndicatorType(statusCode?: string): StatusIndicatorProps.Type {
  const code = statusCode ?? "";
  if (code.includes("fulfilled") || code.includes("active")) return "success";
  if (code.includes("failed") || code.includes("cancelled") || code.includes("closed"))
    return "error";
  if (code.includes("open")) return "pending";
  return "in-progress";
}

function formatTime(iso?: string): string {
  return iso ? new Date(iso).toLocaleString() : "—";
}

function tagText(tags?: SpotTag[]): string {
  if (!tags || tags.length === 0) return "—";
  return tags.map((t) => `${t.Key ?? ""}=${t.Value ?? ""}`).join(", ");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EC2SpotInstancePage() {
  const [items, setItems] = useState<SpotRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SpotRequest[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    pageSize: 25,
    contentDisplay: [],
  });
  const [detail, setDetail] = useState<SpotRequest | null>(null);
  const [detailTab, setDetailTab] = useState("details");

  // Create wizard
  const [wizardActive, setWizardActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    instanceCount: "1",
    imageId: "",
    imageLabel: "",
    instanceType: "",
    keyName: "",
    useZonalDefault: true,
    maxPrice: "",
    requestType: "one-time",
    validUntil: "",
    vpcId: "",
    subnetId: "",
    securityGroupIds: [] as string[],
    iamInstanceProfile: "",
    tags: [] as Tag[],
  });
  const [formErrors, setFormErrors] = useState<{
    instanceCount?: string;
    imageId?: string;
    instanceType?: string;
    maxPrice?: string;
    validUntil?: string;
    vpcId?: string;
    subnetId?: string;
    iamInstanceProfile?: string;
  }>({});
  const [images, setImages] = useState<Array<{ ImageId?: string; Name?: string }>>([]);
  const [instanceTypes, setInstanceTypes] = useState<string[]>([]);
  const [keyPairs, setKeyPairs] = useState<string[]>([]);
  const [vpcs, setVpcs] = useState<Array<{ VpcId?: string; IsDefault?: boolean }>>([]);
  const [subnets, setSubnets] = useState<
    Array<{ SubnetId?: string; AvailabilityZone?: string; VpcId?: string }>
  >([]);
  const [securityGroups, setSecurityGroups] = useState<
    Array<{ GroupId?: string; GroupName?: string; VpcId?: string }>
  >([]);

  // Cancel requests (plain confirmation — not a typed delete)
  const [cancelTargets, setCancelTargets] = useState<SpotRequest[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Terminate instances (plain confirmation, mirrors EC2 instances page)
  const [terminateTargets, setTerminateTargets] = useState<SpotRequest[]>([]);
  const [terminating, setTerminating] = useState(false);
  const [terminateError, setTerminateError] = useState<string | null>(null);

  const pageSize = preferences.pageSize ?? 25;

  // ── Load ───────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await postEc2({ action: "describeSpotInstanceRequests" });
      const list = data.spotInstanceRequests || [];

      // Resolve Availability Zone via subnet mapping (spot requests only expose
      // the subnet in their launch specification).
      const azBySubnet: Record<string, string> = {};
      try {
        const subnetData = await postEc2({ action: "describeSubnets" });
        for (const s of subnetData.subnets || []) {
          if (s.SubnetId && s.AvailabilityZone) azBySubnet[s.SubnetId] = s.AvailabilityZone;
        }
      } catch {
        // AZ resolution is best-effort; the list still loads without it.
      }

      const mapped: SpotRequest[] = list.map((r) => {
        const subnetId =
          r.LaunchSpecification?.SubnetId ??
          r.LaunchSpecification?.NetworkInterfaces?.[0]?.SubnetId;
        return { ...r, AvailabilityZone: subnetId ? azBySubnet[subnetId] : undefined };
      });
      setItems(mapped);
      setDetail((prev) =>
        prev
          ? (mapped.find((r) => r.SpotInstanceRequestId === prev.SpotInstanceRequestId) ?? null)
          : null,
      );
      setSelectedItems([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch Spot instance requests");
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
    const q = filteringText.trim().toLowerCase();
    if (!q) return items;
    return items.filter((r) =>
      [
        r.SpotInstanceRequestId,
        r.InstanceId,
        r.Type,
        r.Status?.Code,
        r.LaunchSpecification?.InstanceType,
        r.AvailabilityZone,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
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

  const canBulkCancel = selectedItems.length > 0;
  const canBulkTerminate = selectedItems.some((r) => r.InstanceId);

  // ── Wizard ────────────────────────────────────────────────────────────────

  const resetForm = useCallback(() => {
    setForm({
      instanceCount: "1",
      imageId: "",
      imageLabel: "",
      instanceType: "",
      keyName: "",
      useZonalDefault: true,
      maxPrice: "",
      requestType: "one-time",
      validUntil: "",
      vpcId: "",
      subnetId: "",
      securityGroupIds: [],
      iamInstanceProfile: "",
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
      postEc2({ action: "describeImages", owners: ["self"] }),
      postEc2({ action: "describeInstanceTypes", maxResults: 200 }),
      postEc2({ action: "describeKeyPairs" }),
      postEc2({ action: "describeVpcs" }),
      postEc2({ action: "describeSubnets" }),
      postEc2({ action: "describeSecurityGroups" }),
    ])
      .then(([imgData, typeData, keyData, vpcData, subnetData, sgData]) => {
        setImages(imgData.images || []);
        setInstanceTypes(
          (typeData.instanceTypes || []).map((t) => t.InstanceType || "").filter(Boolean),
        );
        setKeyPairs((keyData.keyPairs || []).map((k) => k.KeyName || "").filter(Boolean));
        setVpcs(vpcData.vpcs || []);
        setSubnets(subnetData.subnets || []);
        setSecurityGroups(sgData.securityGroups || []);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to load wizard options");
      });
  }, [resetForm]);

  const validateStep = useCallback(
    (step: number): boolean => {
      const errs: typeof formErrors = {};
      if (step === 0) {
        const count = Number(form.instanceCount);
        if (!form.imageId) errs.imageId = "Select an AMI";
        if (!form.instanceType) errs.instanceType = "Select an instance type";
        if (!form.instanceCount || !Number.isInteger(count) || count < 1 || count > 20) {
          errs.instanceCount = "Enter a whole number between 1 and 20";
        }
      } else if (step === 1) {
        if (!form.useZonalDefault) {
          if (!form.maxPrice || Number(form.maxPrice) <= 0)
            errs.maxPrice = "Enter a price greater than 0";
        }
        if (form.validUntil) {
          const d = new Date(form.validUntil);
          if (Number.isNaN(d.getTime()) || d.getTime() <= Date.now()) {
            errs.validUntil = "Enter a valid future date";
          }
        }
      } else if (step === 2) {
        if (!form.vpcId) errs.vpcId = "Select a VPC";
        if (!form.subnetId) errs.subnetId = "Select a subnet";
        if (form.iamInstanceProfile && !form.iamInstanceProfile.startsWith("arn:")) {
          errs.iamInstanceProfile = "Must be a valid IAM instance profile ARN";
        }
      }
      setFormErrors(errs);
      return Object.keys(errs).length === 0;
    },
    [form],
  );

  const handleCreate = useCallback(async () => {
    setSubmitting(true);
    setError(null);
    try {
      const data = await postEc2({
        action: "requestSpotInstances",
        instanceCount: Number(form.instanceCount),
        type: form.requestType,
        spotPrice: form.useZonalDefault ? undefined : form.maxPrice,
        validUntil: form.validUntil || undefined,
        launchSpecification: {
          imageId: form.imageId,
          instanceType: form.instanceType,
          keyName: form.keyName || undefined,
          securityGroupIds: form.securityGroupIds.length > 0 ? form.securityGroupIds : undefined,
          subnetId: form.subnetId,
          iamInstanceProfile: form.iamInstanceProfile || undefined,
        },
        tags: form.tags
          .filter((t) => t.key.trim() !== "")
          .map((t) => ({ Key: t.key, Value: t.value })),
      });
      const created = (data.spotInstanceRequests || [])
        .map((r) => r.SpotInstanceRequestId)
        .filter(Boolean) as string[];
      setSuccess(
        created.length === 1
          ? `Spot instance request ${created[0]} created.`
          : `Created ${created.length} Spot instance requests.`,
      );
      setWizardActive(false);
      resetForm();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create Spot instance request");
    } finally {
      setSubmitting(false);
    }
  }, [form, load, resetForm]);

  const wizardSteps = [
    {
      title: "Instance requirements",
      description: "Choose the AMI, instance type, and key pair for the requested instances.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Number of instances"
            constraintText="Required. Whole number between 1 and 20."
            errorText={formErrors.instanceCount}
          >
            <Input
              type="number"
              value={form.instanceCount}
              onChange={({ detail }) => {
                setForm((prev) => ({ ...prev, instanceCount: detail.value }));
                setFormErrors((prev) => ({ ...prev, instanceCount: undefined }));
              }}
              ariaLabel="Number of instances"
            />
          </FormField>

          <FormField
            label="AMI"
            constraintText="Required. Your own AMIs."
            errorText={formErrors.imageId}
          >
            <Select
              selectedOption={
                form.imageId
                  ? { label: form.imageLabel || form.imageId, value: form.imageId }
                  : null
              }
              onChange={({ detail }) => {
                const opt = detail.selectedOption as { label?: string; value?: string } | null;
                setForm((prev) => ({
                  ...prev,
                  imageId: opt?.value ?? "",
                  imageLabel: opt?.label ?? "",
                }));
                setFormErrors((prev) => ({ ...prev, imageId: undefined }));
              }}
              options={images.map((i) => ({
                label: `${i.Name ?? ""} (${i.ImageId ?? ""})`,
                value: i.ImageId ?? "",
              }))}
              placeholder="Select an AMI"
              filteringType="auto"
              ariaLabel="AMI"
            />
          </FormField>

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

          <FormField label="Key pair (optional)" description="Connect to your instance securely.">
            <Select
              selectedOption={form.keyName ? { label: form.keyName, value: form.keyName } : null}
              onChange={({ detail }) => {
                const opt = detail.selectedOption as { value?: string } | null;
                setForm((prev) => ({ ...prev, keyName: opt?.value ?? "" }));
              }}
              options={keyPairs.map((k) => ({ label: k, value: k }))}
              placeholder="Select a key pair"
              filteringType="auto"
              ariaLabel="Key pair"
            />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Price and request options",
      description: "Set your maximum price and how long the request should stay active.",
      content: (
        <SpaceBetween size="l">
          <Box variant="strong">Request type</Box>
          <RadioGroup
            value={form.requestType}
            onChange={({ detail }) => setForm((prev) => ({ ...prev, requestType: detail.value }))}
            items={[
              {
                value: "one-time",
                label: "One-time",
                description: "AWS fulfills the request once. No further Spot requests are created.",
              },
              {
                value: "persistent",
                label: "Persistent",
                description: "AWS keeps trying to fulfill the request until you cancel it.",
              },
            ]}
          />

          <Checkbox
            checked={form.useZonalDefault}
            onChange={({ detail }) =>
              setForm((prev) => ({ ...prev, useZonalDefault: detail.checked }))
            }
          >
            Use zonal default (no maximum price)
          </Checkbox>

          {!form.useZonalDefault && (
            <FormField
              label="Maximum price ($/hour)"
              constraintText="Required. The maximum you are willing to pay per hour."
              errorText={formErrors.maxPrice}
            >
              <Input
                type="number"
                value={form.maxPrice}
                onChange={({ detail }) => {
                  setForm((prev) => ({ ...prev, maxPrice: detail.value }));
                  setFormErrors((prev) => ({ ...prev, maxPrice: undefined }));
                }}
                ariaLabel="Maximum price"
              />
            </FormField>
          )}

          <FormField
            label="Valid until (optional)"
            constraintText="ISO 8601 date, e.g. 2027-01-01T00:00:00Z. Applies to one-time and persistent requests."
            errorText={formErrors.validUntil}
          >
            <Input
              value={form.validUntil}
              onChange={({ detail }) => {
                setForm((prev) => ({ ...prev, validUntil: detail.value }));
                setFormErrors((prev) => ({ ...prev, validUntil: undefined }));
              }}
              placeholder="2027-01-01T00:00:00Z"
              ariaLabel="Valid until"
            />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Network settings",
      description: "Choose the VPC, subnet, and security groups for the instances.",
      content: (
        <SpaceBetween size="l">
          <FormField label="VPC" constraintText="Required." errorText={formErrors.vpcId}>
            <Select
              selectedOption={form.vpcId ? { label: form.vpcId, value: form.vpcId } : null}
              onChange={({ detail }) => {
                const opt = detail.selectedOption as { value?: string } | null;
                setForm((prev) => ({
                  ...prev,
                  vpcId: opt?.value ?? "",
                  subnetId: "",
                  securityGroupIds: [],
                }));
                setFormErrors((prev) => ({ ...prev, vpcId: undefined, subnetId: undefined }));
              }}
              options={(vpcs || []).map((v) => ({
                label: `${v.VpcId ?? ""}${v.IsDefault ? " (default)" : ""}`,
                value: v.VpcId ?? "",
              }))}
              placeholder="Select a VPC"
              ariaLabel="VPC"
            />
          </FormField>

          <FormField label="Subnet" constraintText="Required." errorText={formErrors.subnetId}>
            <Select
              selectedOption={
                form.subnetId
                  ? {
                      label: `${form.subnetId} (${subnets.find((s) => s.SubnetId === form.subnetId)?.AvailabilityZone ?? "?"})`,
                      value: form.subnetId,
                    }
                  : null
              }
              onChange={({ detail }) => {
                const opt = detail.selectedOption as { value?: string } | null;
                setForm((prev) => ({ ...prev, subnetId: opt?.value ?? "" }));
                setFormErrors((prev) => ({ ...prev, subnetId: undefined }));
              }}
              options={(subnets || [])
                .filter((s) => !form.vpcId || s.VpcId === form.vpcId)
                .map((s) => ({
                  label: `${s.SubnetId ?? ""} (${s.AvailabilityZone ?? ""})`,
                  value: s.SubnetId ?? "",
                }))}
              placeholder="Select a subnet"
              filteringType="auto"
              ariaLabel="Subnet"
            />
          </FormField>

          <FormField label="Security groups (optional)">
            <Multiselect
              selectedOptions={form.securityGroupIds
                .map((id) => {
                  const sg = (securityGroups || []).find((s) => s.GroupId === id);
                  return { label: sg ? `${sg.GroupName ?? ""} (${id})` : id, value: id };
                })
                .filter((o) => o.value !== "")}
              onChange={({ detail }) =>
                setForm((prev) => ({
                  ...prev,
                  securityGroupIds: (detail.selectedOptions as Array<{ value?: string }>)
                    .map((o) => o.value ?? "")
                    .filter(Boolean),
                }))
              }
              options={(securityGroups || [])
                .filter((sg) => !form.vpcId || sg.VpcId === form.vpcId)
                .map((sg) => ({
                  label: `${sg.GroupName ?? ""} (${sg.GroupId ?? ""})`,
                  value: sg.GroupId ?? "",
                }))}
              placeholder="Select security groups"
              filteringType="auto"
              ariaLabel="Security groups"
            />
          </FormField>

          <FormField
            label="IAM instance profile ARN (optional)"
            errorText={formErrors.iamInstanceProfile}
          >
            <Input
              value={form.iamInstanceProfile}
              onChange={({ detail }) => {
                setForm((prev) => ({ ...prev, iamInstanceProfile: detail.value }));
                setFormErrors((prev) => ({ ...prev, iamInstanceProfile: undefined }));
              }}
              placeholder="arn:aws:iam::123456789012:instance-profile/my-profile"
              ariaLabel="IAM instance profile ARN"
            />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Tags and review",
      description: "Add optional tags, then review your Spot request before creating it.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Tags"
            description="Optional. Add metadata to the Spot instance request."
          >
            <TagEditor
              tags={form.tags}
              onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
            />
          </FormField>

          <Container header={<Header variant="h3">Review summary</Header>}>
            <ColumnLayout columns={3} variant="default">
              <div>
                <Box variant="small" color="text-label">
                  Number of instances
                </Box>
                <Box>{form.instanceCount}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  AMI
                </Box>
                <Box>{form.imageLabel || form.imageId || "—"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Instance type
                </Box>
                <Box>{form.instanceType || "—"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Key pair
                </Box>
                <Box>{form.keyName || "None"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Request type
                </Box>
                <Box>{form.requestType === "one-time" ? "One-time" : "Persistent"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Price
                </Box>
                <Box>{form.useZonalDefault ? "Zonal default" : `$${form.maxPrice}/hour max`}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Valid until
                </Box>
                <Box>{form.validUntil || "—"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Subnet
                </Box>
                <Box>{form.subnetId || "—"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Security groups
                </Box>
                <Box>
                  {form.securityGroupIds.length > 0 ? form.securityGroupIds.join(", ") : "Default"}
                </Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  IAM instance profile
                </Box>
                <Box>{form.iamInstanceProfile || "None"}</Box>
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
        </SpaceBetween>
      ),
    },
  ];

  // ── Cancel requests ───────────────────────────────────────────────────────

  const handleCancelRequests = useCallback(async () => {
    const ids = cancelTargets.map((r) => r.SpotInstanceRequestId).filter(Boolean) as string[];
    if (ids.length === 0) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await postEc2({ action: "cancelSpotInstanceRequests", spotInstanceRequestIds: ids });
      setSuccess(
        ids.length === 1
          ? `Spot instance request ${ids[0]} cancelled.`
          : `Cancelled ${ids.length} Spot instance requests.`,
      );
      setCancelTargets([]);
      await load();
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : "Failed to cancel Spot instance request");
    } finally {
      setCancelling(false);
    }
  }, [cancelTargets, load]);

  // ── Terminate instances ───────────────────────────────────────────────────

  const handleTerminate = useCallback(async () => {
    const ids = terminateTargets.map((r) => r.InstanceId).filter(Boolean) as string[];
    if (ids.length === 0) return;
    setTerminating(true);
    setTerminateError(null);
    try {
      await postEc2({ action: "terminate", instanceIds: ids });
      setSuccess(
        ids.length === 1 ? `Instance ${ids[0]} terminated.` : `Terminated ${ids.length} instances.`,
      );
      setTerminateTargets([]);
      setSelectedItems([]);
      await load();
    } catch (err: unknown) {
      setTerminateError(err instanceof Error ? err.message : "Failed to terminate instances");
    } finally {
      setTerminating(false);
    }
  }, [terminateTargets, load]);

  // ── Column definitions ────────────────────────────────────────────────────

  const allColumnDefinitions = useMemo<TableProps.ColumnDefinition<SpotRequest>[]>(
    () => [
      {
        id: "id",
        header: "Spot request ID",
        cell: (row) =>
          row.SpotInstanceRequestId ? (
            <CloudscapeLink
              href={`#${row.SpotInstanceRequestId}`}
              onFollow={(e) => {
                e.preventDefault();
                setDetailTab("details");
                setDetail(row);
              }}
            >
              {row.SpotInstanceRequestId}
            </CloudscapeLink>
          ) : (
            "—"
          ),
      },
      {
        id: "instance",
        header: "Instance ID",
        cell: (row) =>
          row.InstanceId ? <Link href={`/ec2/${row.InstanceId}`}>{row.InstanceId}</Link> : "—",
      },
      { id: "type", header: "Type", cell: (row) => row.Type ?? "—" },
      {
        id: "status",
        header: "Status",
        cell: (row) => (
          <StatusIndicator type={statusIndicatorType(row.Status?.Code)}>
            {row.Status?.Code ?? "—"}
            {row.Status?.Message ? ` — ${row.Status.Message}` : ""}
          </StatusIndicator>
        ),
      },
      {
        id: "instanceType",
        header: "Instance type",
        cell: (row) => row.LaunchSpecification?.InstanceType ?? "—",
      },
      {
        id: "price",
        header: "Price",
        cell: (row) => (row.SpotPrice ? `$${row.SpotPrice}` : "zonal default"),
      },
      { id: "az", header: "Availability Zone", cell: (row) => row.AvailabilityZone ?? "—" },
      {
        id: "launchTemplate",
        header: "Launch template/group",
        cell: (row) => row.LaunchSpecification?.LaunchGroupName ?? "—",
      },
      { id: "created", header: "Created", cell: (row) => formatTime(row.CreateTime) },
      { id: "tags", header: "Tags", cell: (row) => tagText(row.Tags) },
      {
        id: "actions",
        header: "Actions",
        cell: (row) => (
          <ButtonDropdown
            variant="icon"
            ariaLabel={`Actions for ${row.SpotInstanceRequestId ?? "request"}`}
            onItemClick={({ detail }) => {
              if (detail.id === "cancel") setCancelTargets([row]);
              else if (detail.id === "terminate" && row.InstanceId) setTerminateTargets([row]);
            }}
            items={[
              { id: "cancel", text: "Cancel request" },
              ...(row.InstanceId ? [{ id: "terminate", text: "Terminate instance" }] : []),
            ]}
          />
        ),
      },
    ],
    [],
  );

  const columnDefinitions = useMemo(
    () =>
      visibleColumnIds
        ? allColumnDefinitions.filter((col) => visibleColumnIds.includes(col.id ?? ""))
        : allColumnDefinitions,
    [visibleColumnIds, allColumnDefinitions],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (wizardActive) {
    return (
      <Box padding="m">
        <SpaceBetween size="l">
          <Header variant="h1">Request Spot instances</Header>
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
              onSubmit={handleCreate}
              submitButtonText={submitting ? "Creating…" : "Create Spot request"}
              i18nStrings={{
                stepNumberLabel: (stepNumber: number) => `Step ${stepNumber}`,
                navigationAriaLabel: "Spot request wizard navigation",
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
    const launch = detail.LaunchSpecification;
    const sgGroups = launch?.NetworkInterfaces?.flatMap((n) => n.Groups ?? []) ?? [];
    return (
      <Box padding="m">
        <SpaceBetween size="l">
          <Header
            variant="h2"
            description="View the details of a Spot instance request."
            actions={
              <Button iconName="arrow-left" onClick={() => setDetail(null)}>
                Back to list
              </Button>
            }
          >
            {detail.SpotInstanceRequestId ?? "Spot request"}
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
                        <Box variant="awsui-key-label">Spot request ID</Box>
                        <Box>{detail.SpotInstanceRequestId ?? "—"}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Instance ID</Box>
                        <Box>
                          {detail.InstanceId ? (
                            <Link href={`/ec2/${detail.InstanceId}`}>{detail.InstanceId}</Link>
                          ) : (
                            "—"
                          )}
                        </Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Type</Box>
                        <Box>{detail.Type ?? "—"}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Status</Box>
                        <Box>
                          <StatusIndicator type={statusIndicatorType(detail.Status?.Code)}>
                            {detail.Status?.Code ?? "—"}
                            {detail.Status?.Message ? ` — ${detail.Status.Message}` : ""}
                          </StatusIndicator>
                        </Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Price</Box>
                        <Box>{detail.SpotPrice ? `$${detail.SpotPrice}` : "zonal default"}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Availability Zone</Box>
                        <Box>{detail.AvailabilityZone ?? "—"}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Created</Box>
                        <Box>{formatTime(detail.CreateTime)}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Valid until</Box>
                        <Box>{formatTime(detail.ValidUntil)}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Launch template/group</Box>
                        <Box>{launch?.LaunchGroupName ?? "—"}</Box>
                      </div>
                    </ColumnLayout>
                  </Container>
                ),
              },
              {
                id: "launch",
                label: "Launch specification",
                content: (
                  <Container>
                    <ColumnLayout columns={3} variant="text-grid">
                      <div>
                        <Box variant="awsui-key-label">AMI ID</Box>
                        <Box>{launch?.ImageId ?? "—"}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Instance type</Box>
                        <Box>{launch?.InstanceType ?? "—"}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Key pair</Box>
                        <Box>{launch?.KeyName ?? "—"}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Subnet ID</Box>
                        <Box>{launch?.SubnetId ?? "—"}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">Security groups</Box>
                        <Box>{sgGroups.length > 0 ? sgGroups.join(", ") : "—"}</Box>
                      </div>
                      <div>
                        <Box variant="awsui-key-label">IAM instance profile</Box>
                        <Box>{launch?.IamInstanceProfile?.Arn ?? "—"}</Box>
                      </div>
                    </ColumnLayout>
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
                          { id: "key", header: "Key", cell: (t: SpotTag) => t.Key ?? "" },
                          { id: "value", header: "Value", cell: (t: SpotTag) => t.Value ?? "" },
                        ]}
                        items={detail.Tags}
                        trackBy={(t: SpotTag) => t.Key ?? ""}
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
          description="Request and manage Spot instances at prices you specify."
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button iconName="refresh" onClick={load} ariaLabel="Refresh">
                Refresh
              </Button>
              <Button disabled={!canBulkCancel} onClick={() => setCancelTargets(selectedItems)}>
                Cancel requests
              </Button>
              <Button
                disabled={!canBulkTerminate}
                onClick={() => setTerminateTargets(selectedItems.filter((r) => r.InstanceId))}
              >
                Terminate instances
              </Button>
              <Button variant="primary" onClick={openWizard}>
                Request Spot instances
              </Button>
            </SpaceBetween>
          }
        >
          Spot instance requests
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
                id: "spot-success",
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
          loadingText="Loading Spot instance requests..."
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) =>
            setSelectedItems(detail.selectedItems as SpotRequest[])
          }
          trackBy="SpotInstanceRequestId"
          filter={
            <TextFilter
              filteringText={filteringText}
              filteringPlaceholder="Filter Spot requests"
              filteringAriaLabel="Filter Spot requests"
              onChange={({ detail }) => {
                setFilteringText(detail.filteringText);
                setCurrentPage(1);
              }}
              countText={
                filteringText
                  ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                  : `${items.length} Spot instance requests`
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
                  { value: 10, label: "10 Spot requests" },
                  { value: 25, label: "25 Spot requests" },
                  { value: 50, label: "50 Spot requests" },
                  { value: 100, label: "100 Spot requests" },
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
                No Spot instance requests found
              </Box>
              <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                {filteringText
                  ? "No Spot instance requests match your filter. Try a different search."
                  : "To get started, request Spot instances."}
              </Box>
              {!filteringText && (
                <Button formAction="none" onClick={openWizard}>
                  Request Spot instances
                </Button>
              )}
            </Box>
          }
        />
      </SpaceBetween>

      {/* Cancel confirmation (plain — cancel is reversible before fulfillment) */}
      <Modal
        visible={cancelTargets.length > 0}
        onDismiss={() => {
          setCancelTargets([]);
          setCancelError(null);
        }}
        header={
          cancelTargets.length === 1
            ? "Cancel Spot instance request?"
            : `Cancel ${cancelTargets.length} Spot instance requests?`
        }
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                formAction="none"
                onClick={() => {
                  setCancelTargets([]);
                  setCancelError(null);
                }}
                disabled={cancelling}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => void handleCancelRequests()}
                loading={cancelling}
              >
                Cancel request{cancelTargets.length === 1 ? "" : "s"}
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Alert type="warning" statusIconAriaLabel="Warning">
            The selected Spot instance request{cancelTargets.length === 1 ? "" : "s"} will be
            cancelled and cannot be reactivated. Any fulfilled instances keep running until you
            terminate them.
          </Alert>
          {cancelError && <Alert type="error">{cancelError}</Alert>}
        </SpaceBetween>
      </Modal>

      {/* Terminate confirmation (plain — mirrors EC2 instances page) */}
      <Modal
        visible={terminateTargets.length > 0}
        onDismiss={() => {
          setTerminateTargets([]);
          setTerminateError(null);
        }}
        header={
          terminateTargets.length === 1
            ? "Terminate instance?"
            : `Terminate ${terminateTargets.length} instances?`
        }
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                formAction="none"
                onClick={() => {
                  setTerminateTargets([]);
                  setTerminateError(null);
                }}
                disabled={terminating}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => void handleTerminate()}
                loading={terminating}
              >
                Terminate
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Alert type="warning" statusIconAriaLabel="Warning">
            This action cannot be undone. Instance
            {terminateTargets.length === 1 ? "" : "s"}{" "}
            <Box variant="span" fontWeight="bold">
              {terminateTargets.map((r) => r.InstanceId).join(", ")}
            </Box>{" "}
            will be permanently terminated.
          </Alert>
          {terminateError && <Alert type="error">{terminateError}</Alert>}
        </SpaceBetween>
      </Modal>
    </Box>
  );
}
