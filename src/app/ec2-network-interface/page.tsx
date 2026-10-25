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
import Modal from "@cloudscape-design/components/modal";
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
import Link from "@cloudscape-design/components/link";
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

interface NetworkInterfaceInfo {
  NetworkInterfaceId?: string;
  Description?: string;
  InterfaceType?: string;
  VpcId?: string;
  SubnetId?: string;
  AvailabilityZone?: string;
  Status?: string;
  MacAddress?: string;
  PrivateIpAddress?: string;
  PrivateDnsName?: string;
  SourceDestCheck?: boolean;
  Name?: string;
  Groups?: Array<{ GroupId?: string; GroupName?: string }>;
  Association?: {
    AllocationId?: string;
    AssociationId?: string;
    PublicIp?: string;
    PublicDnsName?: string;
  };
  PrivateIpAddresses?: Array<{
    PrivateIpAddress?: string;
    Primary?: boolean;
    Association?: { PublicIp?: string };
  }>;
  Attachment?: {
    AttachmentId?: string;
    InstanceId?: string;
    DeviceIndex?: number;
    Status?: string;
    DeleteOnTermination?: boolean;
  };
  Tags?: Array<{ Key?: string; Value?: string }>;
  TagSet?: Array<{ Key?: string; Value?: string }>;
  Ipv6Addresses?: Array<{ Ipv6Address?: string }>;
}

interface VpcInfo {
  VpcId?: string;
  CidrBlock?: string;
  IsDefault?: boolean;
}

interface SubnetInfo {
  SubnetId?: string;
  VpcId?: string;
  CidrBlock?: string;
  AvailabilityZone?: string;
}

interface SecurityGroupInfo {
  GroupId?: string;
  GroupName?: string;
  VpcId?: string;
  Description?: string;
}

interface InstanceInfo {
  InstanceId?: string;
  Name?: string;
  State?: { Name?: string };
}

interface Ec2ApiResponse {
  success?: boolean;
  error?: string;
  networkInterfaces?: NetworkInterfaceInfo[];
  networkInterface?: NetworkInterfaceInfo;
  attachmentId?: string;
  vpcs?: VpcInfo[];
  subnets?: SubnetInfo[];
  securityGroups?: SecurityGroupInfo[];
  instances?: Array<InstanceInfo & Record<string, unknown>>;
  [key: string]: unknown;
}

const RELATED_LINKS: CrossServiceLink[] = [
  { label: "EC2 Instances", href: "/ec2" },
  { label: "Security groups", href: "/security-group" },
  { label: "Subnets", href: "/subnet" },
  { label: "VPCs", href: "/vpc" },
  { label: "Elastic IPs", href: "/elastic-ip" },
];

const COLUMN_LABELS: Record<string, string> = {
  id: "Network interface ID",
  name: "Name",
  description: "Description",
  type: "Type",
  vpc: "VPC ID",
  subnet: "Subnet ID",
  ipv4: "IPv4 addresses",
  publicIpv4: "Public IPv4",
  status: "Status",
  securityGroups: "Security groups",
  tags: "Tags",
  actions: "Actions",
};

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

function getTags(eni: NetworkInterfaceInfo): Array<{ Key?: string; Value?: string }> {
  if (eni.Tags && eni.Tags.length > 0) return eni.Tags;
  return eni.TagSet || [];
}

function getTagName(eni: NetworkInterfaceInfo): string | undefined {
  return getTags(eni).find((t) => t.Key === "Name")?.Value;
}

function tagText(tags: Array<{ Key?: string; Value?: string }>): string {
  if (tags.length === 0) return "—";
  return tags.map((t) => `${t.Key ?? ""}=${t.Value ?? ""}`).join(", ");
}

function statusIndicatorType(status?: string): StatusIndicatorProps.Type {
  switch (status) {
    case "in-use":
      return "success";
    case "available":
      return "info";
    case "attaching":
    case "detaching":
      return "warning";
    case "failed":
      return "error";
    default:
      return "info";
  }
}

function publicIpv4(eni: NetworkInterfaceInfo): string | undefined {
  return (
    eni.Association?.PublicIp ||
    eni.PrivateIpAddresses?.find((ip) => ip.Association?.PublicIp)?.Association?.PublicIp
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EC2NetworkInterfacePage() {
  const [items, setItems] = useState<NetworkInterfaceInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<NetworkInterfaceInfo[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    pageSize: 25,
    contentDisplay: [],
  });
  const [detail, setDetail] = useState<NetworkInterfaceInfo | null>(null);

  // Create wizard
  const [wizardActive, setWizardActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<{
    vpcId: string;
    subnetId: string;
    description: string;
    securityGroupIds: string[];
    secondaryIpCount: string;
    tags: Tag[];
  }>({
    vpcId: "",
    subnetId: "",
    description: "",
    securityGroupIds: [],
    secondaryIpCount: "0",
    tags: [],
  });
  const [formErrors, setFormErrors] = useState<{
    vpcId?: string;
    subnetId?: string;
    secondaryIpCount?: string;
    tags?: string;
  }>({});
  const [vpcs, setVpcs] = useState<VpcInfo[]>([]);
  const [subnets, setSubnets] = useState<SubnetInfo[]>([]);
  const [securityGroups, setSecurityGroups] = useState<SecurityGroupInfo[]>([]);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(null);

  // Attach modal
  const [attachTarget, setAttachTarget] = useState<NetworkInterfaceInfo | null>(null);
  const [attachInstanceId, setAttachInstanceId] = useState("");
  const [attachDeviceIndex, setAttachDeviceIndex] = useState("1");
  const [attachError, setAttachError] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [instances, setInstances] = useState<InstanceInfo[]>([]);

  // Detach modal
  const [detachTarget, setDetachTarget] = useState<NetworkInterfaceInfo | null>(null);
  const [detaching, setDetaching] = useState(false);

  // Delete queue (typed confirmation)
  const [deleteQueue, setDeleteQueue] = useState<NetworkInterfaceInfo[]>([]);
  const [deleteTotal, setDeleteTotal] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await postEc2({ action: "describeNetworkInterfaces" });
      const list = (data.networkInterfaces || []).map((eni) => ({ ...eni, Name: getTagName(eni) }));
      setItems(list);
      setDetail((prev) =>
        prev
          ? (list.find((eni) => eni.NetworkInterfaceId === prev.NetworkInterfaceId) ?? null)
          : null,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch network interfaces");
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

  const loadReferenceData = useCallback(async () => {
    setReferenceDataError(null);
    try {
      const [vpcsRes, subnetsRes, sgsRes] = await Promise.all([
        postEc2({ action: "describeVpcs" }),
        postEc2({ action: "describeSubnets" }),
        postEc2({ action: "describeSecurityGroups" }),
      ]);
      setVpcs(vpcsRes.vpcs || []);
      setSubnets(subnetsRes.subnets || []);
      setSecurityGroups(sgsRes.securityGroups || []);
      if ((vpcsRes.vpcs || []).length === 0) {
        setReferenceDataError("No VPCs found. Create a VPC before creating a network interface.");
      }
    } catch (err: unknown) {
      setReferenceDataError(
        err instanceof Error ? err.message : "Failed to load VPCs, subnets, and security groups",
      );
    }
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      vpcId: "",
      subnetId: "",
      description: "",
      securityGroupIds: [],
      secondaryIpCount: "0",
      tags: [],
    });
    setFormErrors({});
    setStepIndex(0);
  }, []);

  const openWizard = useCallback(() => {
    resetForm();
    setWizardActive(true);
    loadReferenceData();
  }, [resetForm, loadReferenceData]);

  const filteredSubnets = useMemo(
    () => subnets.filter((s) => s.VpcId === form.vpcId),
    [subnets, form.vpcId],
  );

  const vpcSecurityGroups = useMemo(
    () => securityGroups.filter((sg) => sg.VpcId === form.vpcId),
    [securityGroups, form.vpcId],
  );

  const validateForm = useCallback((): boolean => {
    const errors: { vpcId?: string; subnetId?: string; secondaryIpCount?: string; tags?: string } =
      {};
    if (!form.vpcId) errors.vpcId = "Select a VPC";
    if (!form.subnetId) {
      errors.subnetId = "Select a subnet";
    } else if (subnets.length > 0) {
      const subnet = subnets.find((s) => s.SubnetId === form.subnetId);
      if (subnet && subnet.VpcId !== form.vpcId)
        errors.subnetId = "The selected subnet does not belong to the selected VPC";
    }
    const count = Number(form.secondaryIpCount);
    if (!Number.isInteger(count) || count < 0) {
      errors.secondaryIpCount = "Enter a whole number of 0 or greater";
    }
    if (form.tags.some((t) => !t.key.trim() && t.value.trim())) {
      errors.tags = "Every tag with a value needs a key";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form, subnets]);

  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        action: "createNetworkInterface",
        subnetId: form.subnetId,
      };
      if (form.description.trim()) payload.description = form.description.trim();
      if (form.securityGroupIds.length > 0) payload.groups = form.securityGroupIds;
      const ipCount = Number(form.secondaryIpCount);
      if (ipCount > 0) payload.secondaryPrivateIpAddressCount = ipCount;
      const tags = form.tags
        .filter((t) => t.key.trim())
        .map((t) => ({ Key: t.key.trim(), Value: t.value }));
      if (tags.length > 0) payload.tags = tags;

      const data = await postEc2(payload);
      const createdId = data.networkInterface?.NetworkInterfaceId;
      setSuccess(
        createdId ? `Network interface ${createdId} created.` : "Network interface created.",
      );
      setWizardActive(false);
      resetForm();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create network interface");
    } finally {
      setSubmitting(false);
    }
  }, [form, validateForm, load, resetForm]);

  // ── Attach ────────────────────────────────────────────────────────────────

  const [attachOpen, setAttachOpen] = useState(false);

  const openAttach = useCallback((target: NetworkInterfaceInfo) => {
    setAttachTarget(target);
    setAttachInstanceId("");
    setAttachDeviceIndex("1");
    setAttachError(null);
    setAttachOpen(true);
    apiFetch("/api/ec2")
      .then(async (res) => {
        const data = (await res.json()) as Ec2ApiResponse;
        if (data.error) throw new Error(data.error);
        setInstances(
          (data.instances || []).filter(
            (i) => i.State?.Name !== "terminated" && i.State?.Name !== "shutting-down",
          ),
        );
      })
      .catch((err: unknown) => {
        setAttachError(err instanceof Error ? err.message : "Failed to load instances");
      });
  }, []);

  const handleAttach = useCallback(async () => {
    if (!attachTarget?.NetworkInterfaceId || !attachInstanceId) return;
    const deviceIndex = Number(attachDeviceIndex);
    if (!Number.isInteger(deviceIndex) || deviceIndex < 0) {
      setAttachError("Device number must be a whole number of 0 or greater");
      return;
    }
    setAttaching(true);
    setAttachError(null);
    try {
      await postEc2({
        action: "attachNetworkInterface",
        networkInterfaceId: attachTarget.NetworkInterfaceId,
        instanceId: attachInstanceId,
        deviceIndex,
      });
      setSuccess(
        `Network interface ${attachTarget.NetworkInterfaceId} attached to ${attachInstanceId}.`,
      );
      setAttachOpen(false);
      setAttachTarget(null);
      setSelectedItems([]);
      await load();
    } catch (err: unknown) {
      setAttachError(err instanceof Error ? err.message : "Failed to attach network interface");
    } finally {
      setAttaching(false);
    }
  }, [attachTarget, attachInstanceId, attachDeviceIndex, load]);

  // ── Detach ────────────────────────────────────────────────────────────────

  const handleDetach = useCallback(async () => {
    if (!detachTarget?.Attachment?.AttachmentId) return;
    setDetaching(true);
    setError(null);
    try {
      await postEc2({
        action: "detachNetworkInterface",
        attachmentId: detachTarget.Attachment.AttachmentId,
      });
      setSuccess(`Network interface ${detachTarget.NetworkInterfaceId} detached.`);
      setDetachTarget(null);
      setSelectedItems([]);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to detach network interface");
      setDetachTarget(null);
    } finally {
      setDetaching(false);
    }
  }, [detachTarget, load]);

  // ── Delete (typed confirmation queue) ─────────────────────────────────────

  const openDelete = useCallback((targets: NetworkInterfaceInfo[]) => {
    if (targets.length === 0) return;
    setDeleteQueue(targets);
    setDeleteTotal(targets.length);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = deleteQueue[0];
    if (!target?.NetworkInterfaceId) return;
    setDeleting(true);
    setError(null);
    try {
      await postEc2({
        action: "deleteNetworkInterface",
        networkInterfaceId: target.NetworkInterfaceId,
      });
      const remaining = deleteQueue.slice(1);
      setDeleteQueue(remaining);
      if (remaining.length === 0) {
        setSuccess(
          deleteTotal === 1
            ? `Network interface ${target.NetworkInterfaceId} deleted.`
            : `${deleteTotal} network interfaces deleted.`,
        );
        setSelectedItems([]);
        await load();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete network interface");
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
        item.NetworkInterfaceId?.toLowerCase().includes(lower) ||
        item.Name?.toLowerCase().includes(lower) ||
        item.Description?.toLowerCase().includes(lower) ||
        item.InterfaceType?.toLowerCase().includes(lower) ||
        item.VpcId?.toLowerCase().includes(lower) ||
        item.SubnetId?.toLowerCase().includes(lower) ||
        item.Status?.toLowerCase().includes(lower) ||
        item.PrivateIpAddress?.toLowerCase().includes(lower) ||
        publicIpv4(item)?.toLowerCase().includes(lower),
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

  const allColumnIds = [
    "id",
    "name",
    "description",
    "type",
    "vpc",
    "subnet",
    "ipv4",
    "publicIpv4",
    "status",
    "securityGroups",
    "tags",
    "actions",
  ];

  const columnDefinitions = useMemo<TableProps.ColumnDefinition<NetworkInterfaceInfo>[]>(() => {
    const all: TableProps.ColumnDefinition<NetworkInterfaceInfo>[] = [
      {
        id: "id",
        header: "Network interface ID",
        isRowHeader: true,
        sortingField: "NetworkInterfaceId",
        cell: (item) => (
          <Button variant="link" formAction="none" onClick={() => setDetail(item)}>
            {item.NetworkInterfaceId || "—"}
          </Button>
        ),
      },
      {
        id: "name",
        header: "Name",
        sortingField: "Name",
        cell: (item) => item.Name || "—",
      },
      {
        id: "description",
        header: "Description",
        cell: (item) =>
          item.Description ? <TruncatedText>{item.Description}</TruncatedText> : "—",
      },
      {
        id: "type",
        header: "Type",
        cell: (item) => item.InterfaceType || "interface",
      },
      {
        id: "vpc",
        header: "VPC ID",
        cell: (item) => item.VpcId || "—",
      },
      {
        id: "subnet",
        header: "Subnet ID",
        cell: (item) => item.SubnetId || "—",
      },
      {
        id: "ipv4",
        header: "IPv4 addresses",
        cell: (item) => {
          const addresses =
            item.PrivateIpAddresses && item.PrivateIpAddresses.length > 0
              ? item.PrivateIpAddresses.map((ip) => ip.PrivateIpAddress)
                  .filter(Boolean)
                  .join(", ")
              : item.PrivateIpAddress;
          return addresses ? <TruncatedText>{addresses}</TruncatedText> : "—";
        },
      },
      {
        id: "publicIpv4",
        header: "Public IPv4",
        cell: (item) => publicIpv4(item) || "—",
      },
      {
        id: "status",
        header: "Status",
        sortingField: "Status",
        cell: (item) => (
          <StatusIndicator type={statusIndicatorType(item.Status)}>
            {item.Status || "—"}
          </StatusIndicator>
        ),
      },
      {
        id: "securityGroups",
        header: "Security groups",
        cell: (item) => {
          const groups = item.Groups || [];
          if (groups.length === 0) return "—";
          const first = groups[0];
          return (
            <span>
              {first.GroupId ? (
                <Link href={`/security-group?resource=${encodeURIComponent(first.GroupId)}`}>
                  {first.GroupName || first.GroupId}
                </Link>
              ) : (
                first.GroupName || "—"
              )}
              {groups.length > 1 ? ` +${groups.length - 1}` : ""}
            </span>
          );
        },
      },
      {
        id: "tags",
        header: "Tags",
        cell: (item) => <TruncatedText>{tagText(getTags(item))}</TruncatedText>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: (item) => {
          const isAvailable = item.Status === "available";
          const canDetach = item.Status === "in-use" && Boolean(item.Attachment?.AttachmentId);
          return (
            <ButtonDropdown
              variant="icon"
              ariaLabel={`Actions for ${item.NetworkInterfaceId || "network interface"}`}
              onItemClick={({ detail: menu }) => {
                if (menu.id === "details") setDetail(item);
                else if (menu.id === "attach") openAttach(item);
                else if (menu.id === "detach") setDetachTarget(item);
                else if (menu.id === "delete") openDelete([item]);
              }}
              items={[
                { id: "details", text: "View details" },
                { id: "attach", text: "Attach", disabled: !isAvailable },
                { id: "detach", text: "Detach", disabled: !canDetach },
                { id: "delete", text: "Delete", disabled: !isAvailable },
              ]}
            />
          );
        },
      },
    ];
    return visibleColumnIds ? all.filter((c) => c.id && visibleColumnIds.includes(c.id)) : all;
  }, [visibleColumnIds, openAttach, openDelete]);

  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const canBulkAttach = selectedItems.length === 1 && selectedItems[0].Status === "available";
  const canBulkDetach =
    selectedItems.length === 1 &&
    selectedItems[0].Status === "in-use" &&
    Boolean(selectedItems[0].Attachment?.AttachmentId);
  const canBulkDelete =
    selectedItems.length > 0 && selectedItems.every((eni) => eni.Status === "available");

  // ── Wizard steps ──────────────────────────────────────────────────────────

  const wizardSteps = [
    {
      title: "Network settings",
      description:
        "Select the VPC and subnet for the network interface, and optionally describe it.",
      content: (
        <SpaceBetween size="l">
          {referenceDataError && <Alert type="error">{referenceDataError}</Alert>}
          <FormField label="VPC" constraintText="Required" errorText={formErrors.vpcId}>
            <Select
              selectedOption={
                form.vpcId
                  ? {
                      value: form.vpcId,
                      label: `${form.vpcId}${vpcs.find((v) => v.VpcId === form.vpcId)?.CidrBlock ? ` (${vpcs.find((v) => v.VpcId === form.vpcId)?.CidrBlock})` : ""}`,
                    }
                  : null
              }
              options={vpcs.map((vpc) => ({
                value: vpc.VpcId || "",
                label: `${vpc.VpcId || ""}${vpc.CidrBlock ? ` (${vpc.CidrBlock})` : ""}${vpc.IsDefault ? " - default" : ""}`,
              }))}
              placeholder="Select a VPC"
              onChange={({ detail: sel }) => {
                setForm((prev) => ({
                  ...prev,
                  vpcId: sel.selectedOption.value || "",
                  subnetId: "",
                  securityGroupIds: [],
                }));
                setFormErrors((prev) => ({ ...prev, vpcId: undefined, subnetId: undefined }));
              }}
            />
          </FormField>

          <FormField label="Subnet" constraintText="Required" errorText={formErrors.subnetId}>
            <Select
              selectedOption={
                form.subnetId
                  ? {
                      value: form.subnetId,
                      label: `${form.subnetId} (${filteredSubnets.find((s) => s.SubnetId === form.subnetId)?.AvailabilityZone || "unknown AZ"})`,
                    }
                  : null
              }
              options={filteredSubnets.map((subnet) => ({
                value: subnet.SubnetId || "",
                label: `${subnet.SubnetId || ""} (${subnet.AvailabilityZone || "unknown AZ"}) - ${subnet.CidrBlock || ""}`,
              }))}
              placeholder={form.vpcId ? "Select a subnet" : "Select a VPC first"}
              disabled={!form.vpcId}
              filteringType="auto"
              onChange={({ detail: sel }) => {
                setForm((prev) => ({ ...prev, subnetId: sel.selectedOption.value || "" }));
                setFormErrors((prev) => ({ ...prev, subnetId: undefined }));
              }}
            />
          </FormField>

          <FormField
            label="Description"
            description="Optional. A description for the network interface."
          >
            <Input
              value={form.description}
              onChange={({ detail }) => setForm((prev) => ({ ...prev, description: detail.value }))}
              placeholder="My network interface"
              ariaLabel="Network interface description"
            />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Security groups",
      description:
        "Optionally select security groups for the network interface and assign secondary private IP addresses.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Security groups"
            description="Optional. If none are selected, the default security group for the VPC is applied."
            errorText={formErrors.tags}
          >
            {vpcSecurityGroups.length > 0 ? (
              <SpaceBetween size="xs">
                {vpcSecurityGroups.map((sg) => (
                  <Checkbox
                    key={sg.GroupId}
                    checked={form.securityGroupIds.includes(sg.GroupId || "")}
                    onChange={({ detail: cb }) => {
                      setForm((prev) => ({
                        ...prev,
                        securityGroupIds: cb.checked
                          ? [...prev.securityGroupIds, sg.GroupId || ""]
                          : prev.securityGroupIds.filter((id) => id !== sg.GroupId),
                      }));
                    }}
                  >
                    {sg.GroupName || sg.GroupId} ({sg.GroupId})
                  </Checkbox>
                ))}
              </SpaceBetween>
            ) : (
              <Box color="text-body-secondary">
                {form.vpcId
                  ? "No security groups found in this VPC."
                  : "Select a VPC in the previous step first."}
              </Box>
            )}
          </FormField>

          <FormField
            label="Secondary private IPv4 addresses"
            constraintText="Optional. Whole number, 0 or greater. Default: 0."
            errorText={formErrors.secondaryIpCount}
          >
            <Input
              type="number"
              value={form.secondaryIpCount}
              onChange={({ detail }) => {
                setForm((prev) => ({ ...prev, secondaryIpCount: detail.value }));
                setFormErrors((prev) => ({ ...prev, secondaryIpCount: undefined }));
              }}
              ariaLabel="Secondary private IPv4 address count"
            />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Tags",
      description: "Optional. Add metadata tags to the network interface.",
      content: (
        <FormField label="Tags" errorText={formErrors.tags}>
          <TagEditor
            tags={form.tags}
            onChange={(tags) => {
              setForm((prev) => ({ ...prev, tags }));
              setFormErrors((prev) => ({ ...prev, tags: undefined }));
            }}
          />
        </FormField>
      ),
    },
    {
      title: "Review",
      description: "Review your network interface configuration before creating it.",
      content: (
        <Container header={<Header variant="h3">Review summary</Header>}>
          <ColumnLayout columns={3} variant="default">
            <div>
              <Box variant="small" color="text-label">
                VPC
              </Box>
              <Box>{form.vpcId || "—"}</Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Subnet
              </Box>
              <Box>{form.subnetId || "—"}</Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Description
              </Box>
              <Box>{form.description.trim() || "—"}</Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Security groups
              </Box>
              <Box>
                {form.securityGroupIds.length > 0
                  ? form.securityGroupIds
                      .map((id) => securityGroups.find((sg) => sg.GroupId === id)?.GroupName || id)
                      .join(", ")
                  : "Default security group"}
              </Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Secondary private IPv4 addresses
              </Box>
              <Box>{form.secondaryIpCount}</Box>
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

  if (wizardActive) {
    return (
      <Box padding="m">
        <SpaceBetween size="l">
          <AwsServiceHeader
          serviceName="Create network interface"
          serviceIcon={SERVICE_ICONS["/ec2-network-interface"]?.small}
          counter={items?.length ?? 0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/ec2-network-interface/create")}>
            Create interface
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
              submitButtonText={submitting ? "Creating..." : "Create"}
              i18nStrings={{
                stepNumberLabel: (stepNumber: number) => `Step ${stepNumber}`,
                navigationAriaLabel: "Network interface wizard navigation",
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
    const attachment = detail.Attachment;
    const tags = getTags(detail);
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
            {detail.NetworkInterfaceId}
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
                        Network interface ID
                      </Box>
                      <Box>{detail.NetworkInterfaceId || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Name
                      </Box>
                      <Box>{detail.Name || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Description
                      </Box>
                      <Box>{detail.Description || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Status
                      </Box>
                      <Box>
                        <StatusIndicator type={statusIndicatorType(detail.Status)}>
                          {detail.Status || "—"}
                        </StatusIndicator>
                      </Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Type
                      </Box>
                      <Box>{detail.InterfaceType || "interface"}</Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        VPC ID
                      </Box>
                      <Box>
                        {detail.VpcId ? (
                          <Link href={`/vpc?resource=${encodeURIComponent(detail.VpcId)}`}>
                            {detail.VpcId}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Subnet ID
                      </Box>
                      <Box>
                        {detail.SubnetId ? (
                          <Link href={`/subnet?resource=${encodeURIComponent(detail.SubnetId)}`}>
                            {detail.SubnetId}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Availability zone
                      </Box>
                      <Box>{detail.AvailabilityZone || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        MAC address
                      </Box>
                      <Box>{detail.MacAddress || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Primary private IPv4 address
                      </Box>
                      <Box>{detail.PrivateIpAddress || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Public IPv4 address
                      </Box>
                      <Box>{publicIpv4(detail) || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Private DNS name
                      </Box>
                      <Box>{detail.PrivateDnsName || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Source/destination check
                      </Box>
                      <Box>
                        {detail.SourceDestCheck === undefined
                          ? "—"
                          : detail.SourceDestCheck
                            ? "Stopped"
                            : "Stopped"}
                      </Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Attached instance
                      </Box>
                      <Box>
                        {attachment?.InstanceId ? (
                          <Link href={`/ec2/${attachment.InstanceId}`}>
                            {attachment.InstanceId}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Attachment ID
                      </Box>
                      <Box>{attachment?.AttachmentId || "—"}</Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        Device index
                      </Box>
                      <Box>{attachment?.DeviceIndex ?? "—"}</Box>
                    </div>
                    <div>
                      <Box variant="small" color="text-label">
                        IPv6 addresses
                      </Box>
                      <Box>
                        {detail.Ipv6Addresses && detail.Ipv6Addresses.length > 0
                          ? detail.Ipv6Addresses.map((ip) => ip.Ipv6Address).join(", ")
                          : "—"}
                      </Box>
                    </div>
                  </ColumnLayout>
                ),
              },
              {
                label: "Security groups",
                id: "security-groups",
                content:
                  detail.Groups && detail.Groups.length > 0 ? (
                    <Table
                      columnDefinitions={[
                        {
                          header: "Security group name",
                          cell: (group: { GroupId?: string; GroupName?: string }) =>
                            group.GroupId ? (
                              <Link
                                href={`/security-group?resource=${encodeURIComponent(group.GroupId)}`}
                              >
                                {group.GroupName || group.GroupId}
                              </Link>
                            ) : (
                              group.GroupName || "—"
                            ),
                        },
                        {
                          header: "Security group ID",
                          cell: (group: { GroupId?: string }) => group.GroupId || "—",
                        },
                      ]}
                      items={detail.Groups}
                      header={
                        <Header variant="h3">Security groups ({detail.Groups.length})</Header>
                      }
                      empty={<Box>No security groups</Box>}
                    />
                  ) : (
                    <Box>No security groups attached</Box>
                  ),
              },
              {
                label: "Tags",
                id: "tags",
                content:
                  tags.length > 0 ? (
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
                      items={tags}
                      header={<Header variant="h3">Tags ({tags.length})</Header>}
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
              <ButtonDropdown
                items={[
                  { text: "Attach", id: "attach", disabled: !canBulkAttach },
                  { text: "Detach", id: "detach", disabled: !canBulkDetach },
                  { text: "Delete", id: "delete", disabled: !canBulkDelete },
                ]}
                onItemClick={({ detail }) => {
                  if (detail.id === "attach" && selectedItems[0]) openAttach(selectedItems[0]);
                  else if (detail.id === "detach" && selectedItems[0])
                    setDetachTarget(selectedItems[0]);
                  else if (detail.id === "delete") openDelete(selectedItems);
                }}
                disabled={selectedItems.length === 0}
                ariaLabel="Network interface actions"
              >
                Actions
              </ButtonDropdown>
              <Button variant="primary" onClick={openWizard}>
                Create network interface
              </Button>
            </SpaceBetween>
          }
        >
          Network interfaces
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
                id: "eni-success",
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
          loadingText="Loading network interfaces..."
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) =>
            setSelectedItems(detail.selectedItems as NetworkInterfaceInfo[])
          }
          trackBy="NetworkInterfaceId"
          filter={
            <TextFilter
              filteringText={filteringText}
              filteringPlaceholder="Filter network interfaces"
              filteringAriaLabel="Filter network interfaces"
              onChange={({ detail }) => {
                setFilteringText(detail.filteringText);
                setCurrentPage(1);
              }}
              countText={
                filteringText
                  ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                  : `${items.length} network interfaces`
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
                  { value: 10, label: "10 network interfaces" },
                  { value: 25, label: "25 network interfaces" },
                  { value: 50, label: "50 network interfaces" },
                  { value: 100, label: "100 network interfaces" },
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
                No network interfaces found
              </Box>
              <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                {filteringText
                  ? "No network interfaces match your filter. Try a different search."
                  : "To get started, create a network interface."}
              </Box>
              {!filteringText && (
                <Button formAction="none" onClick={openWizard}>
                  Create network interface
                </Button>
              )}
            </Box>
          }
        />
      </SpaceBetween>

      {/* Attach modal */}
      <Modal
        visible={attachOpen}
        onDismiss={() => setAttachOpen(false)}
        header="Attach network interface"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button formAction="none" onClick={() => setAttachOpen(false)} disabled={attaching}>
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={attaching}
                disabled={!attachInstanceId}
                onClick={handleAttach}
              >
                Attach
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          {attachError && <Alert type="error">{attachError}</Alert>}
          <Box color="text-body-secondary">
            Network interface: {attachTarget?.NetworkInterfaceId} ({attachTarget?.Status})
          </Box>
          <FormField label="Instance" constraintText="Required">
            <Select
              selectedOption={
                attachInstanceId
                  ? {
                      value: attachInstanceId,
                      label: `${instances.find((i) => i.InstanceId === attachInstanceId)?.Name || attachInstanceId} (${attachInstanceId})`,
                    }
                  : null
              }
              options={instances.map((instance) => ({
                value: instance.InstanceId || "",
                label: `${instance.Name || instance.InstanceId} (${instance.InstanceId}) - ${instance.State?.Name || "unknown"}`,
              }))}
              placeholder="Select an instance"
              filteringType="auto"
              onChange={({ detail }) => setAttachInstanceId(detail.selectedOption.value || "")}
            />
          </FormField>
          <FormField
            label="Device number"
            constraintText="The device index to attach to (0 is the primary interface). Whole number, 0 or greater."
          >
            <Input
              type="number"
              value={attachDeviceIndex}
              onChange={({ detail }) => setAttachDeviceIndex(detail.value)}
              ariaLabel="Device number"
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* Detach confirmation */}
      <Modal
        visible={detachTarget !== null}
        onDismiss={() => setDetachTarget(null)}
        header="Detach network interface"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button formAction="none" onClick={() => setDetachTarget(null)} disabled={detaching}>
                Cancel
              </Button>
              <Button variant="primary" loading={detaching} onClick={handleDetach}>
                Detach
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <StatusIndicator type="warning">
            Detaching network interface {detachTarget?.NetworkInterfaceId} from instance{" "}
            {detachTarget?.Attachment?.InstanceId} will interrupt traffic flowing through it.
          </StatusIndicator>
          <Box color="text-body-secondary">
            The interface will return to the &quot;available&quot; state after it is detached.
          </Box>
        </SpaceBetween>
      </Modal>

      {/* Delete typed confirmation */}
      {deleteQueue.length > 0 && (
        <ConfirmModal
          visible={true}
          resourceName={deleteQueue[0].NetworkInterfaceId || ""}
          resourceType="network interface"
          actionLabel="Delete"
          onConfirm={handleConfirmDelete}
          onDismiss={() => setDeleteQueue([])}
          loading={deleting}
        />
      )}
    </Box>
  );
}
