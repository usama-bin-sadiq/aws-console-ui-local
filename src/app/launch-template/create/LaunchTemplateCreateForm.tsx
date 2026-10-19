"use client";

/**
 * LaunchTemplateCreateForm — single-page "Create launch template" form matching
 * the AWS Console. Also handles the "Create new version" flow: when
 * `sourceTemplateId` is provided the form is pre-filled from the template's
 * latest version and saving creates a new, incremented version.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select, { SelectProps } from "@cloudscape-design/components/select";
import Multiselect from "@cloudscape-design/components/multiselect";
import Autosuggest from "@cloudscape-design/components/autosuggest";
import Checkbox from "@cloudscape-design/components/checkbox";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Button from "@cloudscape-design/components/button";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Spinner from "@cloudscape-design/components/spinner";
import TagEditor from "@/components/TagEditor";
import { apiFetch } from "@/lib/api-client";
import { EC2_VOLUME_TYPES } from "@/constants/ec2-constants";
import type {
  EC2AMIImage,
  EC2InstanceTypeInfo,
  EC2KeyPair,
  EC2SecurityGroup,
  EC2Subnet,
} from "@/types/ec2";
import {
  LaunchTemplate,
  LaunchTemplateCreateFormState,
  LaunchTemplateData,
  LaunchTemplateEbsBlockDevice,
  LaunchTemplateTagSpecification,
  LaunchTemplateVersion,
  GetLaunchTemplateResponse,
  GetLaunchTemplateVersionResponse,
  RootVolumeType,
  createEmptyLaunchTemplateForm,
} from "@/types/launch-template";

// ─── Helpers / constants ──────────────────────────────────────────────────────

export interface LaunchTemplateCreateFormProps {
  /** When set, the form creates a new version of this template (pre-filled). */
  readonly sourceTemplateId?: string;
  /** Called when the user cancels the form. */
  readonly onCancel: () => void;
}

/** AMI responses carry RootDeviceName which the shared EC2 type does not model. */
interface AmiResource extends EC2AMIImage {
  RootDeviceName?: string;
}

interface ResourceResponse {
  images?: AmiResource[];
  instanceTypes?: EC2InstanceTypeInfo[];
  keyPairs?: EC2KeyPair[];
  securityGroups?: EC2SecurityGroup[];
  subnets?: EC2Subnet[];
  error?: string;
}

interface IamRolesResponse {
  roles?: Array<{ RoleName?: string; Arn?: string }>;
  error?: string;
}

interface LaunchTemplatePostResponse {
  template?: LaunchTemplate;
  version?: LaunchTemplateVersion;
  error?: string;
}

const NAME_PATTERN = /^[A-Za-z0-9_\-.]+$/;
const MIN_VOLUME_GIB = 1;
const MAX_VOLUME_GIB = 16384;

/** Used when DescribeInstanceTypes returns nothing (small/local emulators). */
const FALLBACK_INSTANCE_TYPES = [
  "t3.nano",
  "t3.micro",
  "t3.small",
  "t3.medium",
  "t3.large",
  "m5.large",
  "m5.xlarge",
  "c5.large",
  "c5.xlarge",
  "r5.large",
  "r5.xlarge",
];

const SHUTDOWN_OPTIONS: ReadonlyArray<SelectProps.Option> = [
  { value: "stop", label: "Stop" },
  { value: "terminate", label: "Terminate" },
];

const PUBLIC_IP_OPTIONS: ReadonlyArray<SelectProps.Option> = [
  { value: "enable", label: "Enable" },
  { value: "disable", label: "Disable" },
];

async function postEc2(payload: Record<string, unknown>): Promise<ResourceResponse> {
  const res = await apiFetch("/api/ec2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as ResourceResponse;
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

async function postLaunchTemplate(
  payload: Record<string, unknown>,
): Promise<LaunchTemplatePostResponse> {
  const res = await apiFetch("/api/launch-template", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as LaunchTemplatePostResponse;
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await apiFetch(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

/** Maps a stored LaunchTemplateData onto the editable form state. */
function formFromTemplateData(
  name: string,
  data: LaunchTemplateData | undefined,
): { form: LaunchTemplateCreateFormState; hasRootMapping: boolean } {
  const form = createEmptyLaunchTemplateForm();
  form.launchTemplateName = name;
  if (!data) return { form, hasRootMapping: false };

  const primaryInterface =
    data.NetworkInterfaces?.find((nic) => nic.DeviceIndex === 0) ?? data.NetworkInterfaces?.[0];
  form.imageId = data.ImageId ?? "";
  form.instanceType = data.InstanceType ?? "";
  form.keyName = data.KeyName ?? "";
  form.securityGroupIds = data.SecurityGroupIds ?? primaryInterface?.Groups ?? [];
  form.network.subnetId = data.SubnetId ?? primaryInterface?.SubnetId ?? "";
  form.network.assignPublicIp = primaryInterface?.AssociatePublicIpAddress ?? true;
  form.iamInstanceProfile = data.IamInstanceProfile?.Name ?? data.IamInstanceProfile?.Arn ?? "";
  form.shutdownBehavior = data.InstanceInitiatedShutdownBehavior ?? "stop";

  const rootMapping = data.BlockDeviceMappings?.find((mapping) => mapping.Ebs !== undefined);
  const ebs = rootMapping?.Ebs;
  if (rootMapping?.DeviceName) {
    form.rootDeviceName = rootMapping.DeviceName;
  }
  if (ebs) {
    form.rootVolume.volumeSize =
      ebs.VolumeSize !== undefined ? String(ebs.VolumeSize) : form.rootVolume.volumeSize;
    form.rootVolume.volumeType = ebs.VolumeType ?? form.rootVolume.volumeType;
    form.rootVolume.encrypted = ebs.Encrypted ?? false;
    form.rootVolume.deleteOnTermination = ebs.DeleteOnTermination ?? true;
    const extras: LaunchTemplateCreateFormState["rootVolumeExtras"] = {};
    if (ebs.SnapshotId !== undefined) extras.SnapshotId = ebs.SnapshotId;
    if (ebs.Iops !== undefined) extras.Iops = ebs.Iops;
    if (ebs.Throughput !== undefined) extras.Throughput = ebs.Throughput;
    if (ebs.KmsKeyId !== undefined) extras.KmsKeyId = ebs.KmsKeyId;
    form.rootVolumeExtras = extras;
  }

  const tagsFor = (
    resourceType: LaunchTemplateTagSpecification["ResourceType"],
  ): LaunchTemplateCreateFormState["resourceTags"] =>
    (data.TagSpecifications?.find((spec) => spec.ResourceType === resourceType)?.Tags ?? []).map(
      (tag) => ({
        key: tag.Key ?? "",
        value: tag.Value ?? "",
      }),
    );

  form.resourceTags = tagsFor("instance");
  form.volumeTags = tagsFor("volume");
  form.networkInterfaceTags = tagsFor("network-interface");

  return { form, hasRootMapping: ebs !== undefined };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LaunchTemplateCreateForm({
  sourceTemplateId,
  onCancel,
}: LaunchTemplateCreateFormProps) {
  const router = useRouter();
  const isVersionMode = Boolean(sourceTemplateId);

  const [state, setState] = useState<LaunchTemplateCreateFormState>(createEmptyLaunchTemplateForm);
  const [nameError, setNameError] = useState<string | null>(null);
  const [sizeError, setSizeError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [loadingResources, setLoadingResources] = useState(true);
  const [resourceWarning, setResourceWarning] = useState<string | null>(null);
  const [loadingSource, setLoadingSource] = useState(isVersionMode);
  const [sourceVersionNumber, setSourceVersionNumber] = useState<number | null>(null);
  /** Only send the root volume mapping when it was shown/edited (version mode). */
  const [storageTouched, setStorageTouched] = useState(false);

  const [amis, setAmis] = useState<AmiResource[]>([]);
  const [instanceTypes, setInstanceTypes] = useState<EC2InstanceTypeInfo[]>([]);
  const [keyPairs, setKeyPairs] = useState<EC2KeyPair[]>([]);
  const [securityGroups, setSecurityGroups] = useState<EC2SecurityGroup[]>([]);
  const [subnets, setSubnets] = useState<EC2Subnet[]>([]);
  const [roles, setRoles] = useState<Array<{ RoleName: string; Arn: string }>>([]);

  const update = useCallback((patch: Partial<LaunchTemplateCreateFormState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  // ── Resource pick lists ─────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadResources(): Promise<void> {
      const failures: string[] = [];
      const [imagesResult, typesResult, keyPairsResult, sgResult, subnetResult, rolesResult] =
        await Promise.allSettled([
          postEc2({
            action: "describeImages",
            owners: ["amazon", "self"],
            filters: [{ Name: "state", Values: ["available"] }],
          }),
          postEc2({
            action: "describeInstanceTypes",
            filters: [{ Name: "current-generation", Values: ["true"] }],
            maxResults: 50,
          }),
          postEc2({ action: "describeKeyPairs" }),
          postEc2({ action: "describeSecurityGroups" }),
          postEc2({ action: "describeSubnets" }),
          getJson<IamRolesResponse>("/api/iam"),
        ]);

      if (cancelled) return;

      if (imagesResult.status === "fulfilled" && imagesResult.value.images) {
        setAmis(imagesResult.value.images);
      } else {
        failures.push("machine images");
      }
      if (typesResult.status === "fulfilled" && typesResult.value.instanceTypes) {
        setInstanceTypes(typesResult.value.instanceTypes);
      } else {
        failures.push("instance types");
      }
      if (keyPairsResult.status === "fulfilled" && keyPairsResult.value.keyPairs) {
        setKeyPairs(keyPairsResult.value.keyPairs);
      } else {
        failures.push("key pairs");
      }
      if (sgResult.status === "fulfilled" && sgResult.value.securityGroups) {
        setSecurityGroups(sgResult.value.securityGroups);
      } else {
        failures.push("security groups");
      }
      if (subnetResult.status === "fulfilled" && subnetResult.value.subnets) {
        setSubnets(subnetResult.value.subnets);
      } else {
        failures.push("subnets");
      }
      if (rolesResult.status === "fulfilled" && rolesResult.value.roles) {
        setRoles(
          rolesResult.value.roles
            .filter((role): role is { RoleName: string; Arn: string } =>
              Boolean(role.RoleName && role.Arn),
            )
            .map((role) => ({ RoleName: role.RoleName, Arn: role.Arn })),
        );
      }

      setResourceWarning(
        failures.length > 0
          ? `Some pick lists could not be loaded: ${failures.join(", ")}. Existing values can still be typed in where the field allows it.`
          : null,
      );
      setLoadingResources(false);
    }

    void loadResources();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Pre-fill from the latest version (create-new-version flow) ──────────────

  useEffect(() => {
    if (!sourceTemplateId) return;
    const templateId: string = sourceTemplateId;
    let cancelled = false;

    async function loadSource(): Promise<void> {
      setLoadingSource(true);
      setError(null);
      try {
        const [templateRes, versionRes] = await Promise.all([
          getJson<GetLaunchTemplateResponse>(
            `/api/launch-template?action=describeTemplate&templateId=${encodeURIComponent(templateId)}`,
          ),
          getJson<GetLaunchTemplateVersionResponse>(
            `/api/launch-template?action=getVersion&templateId=${encodeURIComponent(templateId)}&versionNumber=%24Latest`,
          ),
        ]);
        if (cancelled) return;
        const { form, hasRootMapping } = formFromTemplateData(
          templateRes.template?.LaunchTemplateName ?? "",
          versionRes.version?.LaunchTemplateData,
        );
        setState(form);
        setSourceVersionNumber(versionRes.version?.VersionNumber ?? null);
        setStorageTouched(hasRootMapping);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load the latest template version",
          );
        }
      } finally {
        if (!cancelled) setLoadingSource(false);
      }
    }

    void loadSource();
    return () => {
      cancelled = true;
    };
  }, [sourceTemplateId]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 6000);
    return () => clearTimeout(timer);
  }, [success]);

  // ── Options ────────────────────────────────────────────────────────────────

  const amiOptions = useMemo<SelectProps.Options>(
    () =>
      amis
        .filter((ami) => typeof ami.ImageId === "string")
        .slice(0, 50)
        .map((ami) => ({
          value: ami.ImageId as string,
          label: ami.Name ? `${ami.Name} (${ami.ImageId})` : String(ami.ImageId),
          description: ami.Description,
        })),
    [amis],
  );

  const instanceTypeOptions = useMemo<SelectProps.Options>(() => {
    if (instanceTypes.length === 0) {
      return FALLBACK_INSTANCE_TYPES.map((type) => ({ value: type, label: type }));
    }
    return instanceTypes
      .filter((type) => typeof type.InstanceType === "string")
      .map((type) => ({
        value: type.InstanceType as string,
        label: String(type.InstanceType),
        description: `${type.VCpuInfo?.DefaultVCpus ?? "—"} vCPUs, ${
          type.MemoryInfo?.SizeInMiB !== undefined ? type.MemoryInfo.SizeInMiB / 1024 : "—"
        } GiB`,
      }));
  }, [instanceTypes]);

  const keyPairOptions = useMemo<SelectProps.Options>(
    () =>
      keyPairs
        .filter((kp) => typeof kp.KeyName === "string")
        .map((kp) => ({ value: kp.KeyName as string, label: String(kp.KeyName) })),
    [keyPairs],
  );

  const subnetOptions = useMemo<SelectProps.Options>(
    () =>
      subnets
        .filter((subnet) => typeof subnet.SubnetId === "string")
        .map((subnet) => ({
          value: subnet.SubnetId as string,
          label: `${subnet.SubnetId} (${subnet.AvailabilityZone ?? "—"})`,
          description: `${subnet.CidrBlock ?? ""} ${subnet.VpcId ?? ""}`.trim(),
        })),
    [subnets],
  );

  const securityGroupOptions = useMemo(
    () =>
      securityGroups
        .filter((sg) => typeof sg.GroupId === "string")
        .map((sg) => ({
          value: sg.GroupId as string,
          label: `${sg.GroupName ?? sg.GroupId} (${sg.GroupId})`,
          description: sg.VpcId,
        })),
    [securityGroups],
  );

  const profileOptions = useMemo(
    () =>
      roles.map((role) => ({ value: role.RoleName, label: role.RoleName, description: role.Arn })),
    [roles],
  );

  const selectedAmi: SelectProps.Option | null = state.imageId
    ? (amiOptions.find((option) => option.value === state.imageId) ?? {
        value: state.imageId,
        label: state.imageId,
      })
    : null;

  const selectedInstanceType: SelectProps.Option | null = state.instanceType
    ? (instanceTypeOptions.find((option) => option.value === state.instanceType) ?? {
        value: state.instanceType,
        label: state.instanceType,
      })
    : null;

  const selectedKeyPair: SelectProps.Option | null = state.keyName
    ? (keyPairOptions.find((option) => option.value === state.keyName) ?? {
        value: state.keyName,
        label: state.keyName,
      })
    : null;

  const selectedSubnet: SelectProps.Option | null = state.network.subnetId
    ? (subnetOptions.find((option) => option.value === state.network.subnetId) ?? {
        value: state.network.subnetId,
        label: state.network.subnetId,
      })
    : null;

  const selectedSecurityGroups = useMemo(
    () =>
      state.securityGroupIds.map((id) => {
        const sg = securityGroups.find((group) => group.GroupId === id);
        return {
          label: sg?.GroupName ? `${sg.GroupName} (${id})` : id,
          value: id,
        };
      }),
    [state.securityGroupIds, securityGroups],
  );

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = useCallback((): boolean => {
    let valid = true;

    if (!isVersionMode) {
      const name = state.launchTemplateName.trim();
      if (!name) {
        setNameError("Template name is required");
        valid = false;
      } else if (name.length > 128) {
        setNameError("Template name must be 128 characters or fewer");
        valid = false;
      } else if (!NAME_PATTERN.test(name)) {
        setNameError("Use only letters, numbers, hyphens, underscores, or periods (no spaces)");
        valid = false;
      } else {
        setNameError(null);
      }
    }

    const size = Number(state.rootVolume.volumeSize);
    if (!Number.isInteger(size) || size < MIN_VOLUME_GIB || size > MAX_VOLUME_GIB) {
      setSizeError(
        `Size must be a whole number of GiB between ${MIN_VOLUME_GIB} and ${MAX_VOLUME_GIB}`,
      );
      valid = false;
    } else {
      setSizeError(null);
    }

    return valid;
  }, [isVersionMode, state.launchTemplateName, state.rootVolume.volumeSize]);

  // ── Payload ────────────────────────────────────────────────────────────────

  const buildLaunchTemplateData = useCallback((): LaunchTemplateData => {
    const data: LaunchTemplateData = {};
    if (state.imageId) data.ImageId = state.imageId;
    if (state.instanceType) data.InstanceType = state.instanceType;
    if (state.keyName) data.KeyName = state.keyName;

    if (!isVersionMode || storageTouched) {
      const ebs: LaunchTemplateEbsBlockDevice = {
        ...state.rootVolumeExtras,
        VolumeSize: Number(state.rootVolume.volumeSize),
        VolumeType: state.rootVolume.volumeType,
        Encrypted: state.rootVolume.encrypted,
        DeleteOnTermination: state.rootVolume.deleteOnTermination,
      };
      data.BlockDeviceMappings = [{ DeviceName: state.rootDeviceName, Ebs: ebs }];
    }

    if (state.network.subnetId) {
      data.NetworkInterfaces = [
        {
          DeviceIndex: 0,
          SubnetId: state.network.subnetId,
          Groups: state.securityGroupIds.length > 0 ? state.securityGroupIds : undefined,
          AssociatePublicIpAddress: state.network.assignPublicIp,
          DeleteOnTermination: true,
        },
      ];
    } else if (state.securityGroupIds.length > 0) {
      data.SecurityGroupIds = state.securityGroupIds;
    }

    const profile = state.iamInstanceProfile.trim();
    if (profile) {
      data.IamInstanceProfile = profile.startsWith("arn:") ? { Arn: profile } : { Name: profile };
    }

    data.InstanceInitiatedShutdownBehavior = state.shutdownBehavior;

    const tagSpecifications: LaunchTemplateTagSpecification[] = [];
    const toPairs = (tags: LaunchTemplateCreateFormState["resourceTags"]) =>
      tags
        .filter((tag) => tag.key.trim().length > 0)
        .map((tag) => ({ Key: tag.key.trim(), Value: tag.value }));
    const resourceTags = toPairs(state.resourceTags);
    const volumeTags = toPairs(state.volumeTags);
    const networkInterfaceTags = toPairs(state.networkInterfaceTags);
    if (resourceTags.length > 0)
      tagSpecifications.push({ ResourceType: "instance", Tags: resourceTags });
    if (volumeTags.length > 0) tagSpecifications.push({ ResourceType: "volume", Tags: volumeTags });
    if (networkInterfaceTags.length > 0) {
      tagSpecifications.push({ ResourceType: "network-interface", Tags: networkInterfaceTags });
    }
    if (tagSpecifications.length > 0) data.TagSpecifications = tagSpecifications;

    return data;
  }, [isVersionMode, storageTouched, state]);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    try {
      const launchTemplateData = buildLaunchTemplateData();
      const versionDescription = state.versionDescription.trim();

      if (sourceTemplateId) {
        const result = await postLaunchTemplate({
          action: "createVersion",
          templateId: sourceTemplateId,
          versionDescription: versionDescription || undefined,
          launchTemplateData,
          sourceVersion: sourceVersionNumber !== null ? String(sourceVersionNumber) : undefined,
        });
        const templateId = result.version?.LaunchTemplateId ?? sourceTemplateId;
        const createdVersion = result.version?.VersionNumber;
        setSuccess(
          createdVersion !== undefined
            ? `Version ${createdVersion} created for launch template "${state.launchTemplateName}".`
            : `New version created for launch template "${state.launchTemplateName}".`,
        );
        setTimeout(() => router.push(`/launch-template/detail/${templateId}`), 1200);
      } else {
        const result = await postLaunchTemplate({
          action: "create",
          launchTemplateName: state.launchTemplateName.trim(),
          versionDescription: versionDescription || undefined,
          launchTemplateData,
        });
        setSuccess(`Launch template "${state.launchTemplateName.trim()}" created.`);
        const templateId = result.template?.LaunchTemplateId;
        setTimeout(
          () =>
            router.push(templateId ? `/launch-template/detail/${templateId}` : "/launch-template"),
          1200,
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create the launch template");
    } finally {
      setSubmitting(false);
    }
  }, [
    validate,
    buildLaunchTemplateData,
    state.versionDescription,
    state.launchTemplateName,
    sourceTemplateId,
    sourceVersionNumber,
    router,
  ]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loadingSource) {
    return (
      <Box textAlign="center" padding="l">
        <Spinner size="large" />
        <Box variant="p" padding={{ top: "s" }}>
          Loading the latest template version...
        </Box>
      </Box>
    );
  }

  return (
    <SpaceBetween size="l">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert type="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {resourceWarning && (
        <Alert type="warning" dismissible onDismiss={() => setResourceWarning(null)}>
          {resourceWarning}
        </Alert>
      )}

      <Container header={<Header variant="h2">Template information</Header>}>
        <SpaceBetween size="l">
          <ColumnLayout columns={2} variant="default">
            <FormField
              label="Template name"
              constraintText={
                isVersionMode
                  ? "The name of the launch template this version belongs to."
                  : "Required. Up to 128 characters: letters, numbers, hyphens, underscores, and periods."
              }
              errorText={nameError}
            >
              <Input
                value={state.launchTemplateName}
                onChange={({ detail }) => {
                  update({ launchTemplateName: detail.value });
                  setNameError(null);
                }}
                placeholder="my-launch-template"
                readOnly={isVersionMode || submitting}
                ariaLabel="Template name"
              />
            </FormField>

            <FormField
              label="Version description"
              constraintText="Optional. Describes this version of the template."
            >
              <Input
                value={state.versionDescription}
                onChange={({ detail }) => update({ versionDescription: detail.value })}
                placeholder="Initial version"
                disabled={submitting}
                ariaLabel="Version description"
              />
            </FormField>
          </ColumnLayout>
        </SpaceBetween>
      </Container>

      <Container header={<Header variant="h2">Template content</Header>}>
        <SpaceBetween size="l">
          {loadingResources && (
            <Box color="text-body-secondary">Loading available resources...</Box>
          )}

          <FormField
            label="Machine image (AMI)"
            description="Choose an AMI that matches the architecture and OS you need."
          >
            <Select
              selectedOption={selectedAmi}
              options={amiOptions}
              onChange={({ detail }) => {
                const imageId = detail.selectedOption.value ?? "";
                const ami = amis.find((candidate) => candidate.ImageId === imageId);
                setState((prev) => ({
                  ...prev,
                  imageId,
                  rootDeviceName: ami?.RootDeviceName ?? prev.rootDeviceName,
                }));
              }}
              filteringType="auto"
              filteringPlaceholder="Search AMIs by name or ID"
              filteringAriaLabel="Search machine images"
              placeholder="Choose an AMI"
              disabled={loadingResources || submitting}
              ariaLabel="Machine image (AMI)"
              noMatch={<Box>No matching machine images</Box>}
            />
          </FormField>

          <FormField
            label="Instance type"
            description="The hardware configuration for instances launched from this template."
          >
            <Select
              selectedOption={selectedInstanceType}
              options={instanceTypeOptions}
              onChange={({ detail }) => update({ instanceType: detail.selectedOption.value ?? "" })}
              filteringType="auto"
              filteringPlaceholder="Search instance types"
              filteringAriaLabel="Search instance types"
              placeholder="Choose an instance type"
              disabled={loadingResources || submitting}
              ariaLabel="Instance type"
              noMatch={<Box>No matching instance types</Box>}
            />
          </FormField>

          <FormField
            label="Key pair (optional)"
            description="Used for SSH access to launched instances."
          >
            <Select
              selectedOption={selectedKeyPair}
              options={keyPairOptions}
              onChange={({ detail }) => update({ keyName: detail.selectedOption.value ?? "" })}
              filteringType="auto"
              filteringPlaceholder="Search key pairs"
              filteringAriaLabel="Search key pairs"
              placeholder="Proceed without a key pair"
              disabled={loadingResources || submitting}
              ariaLabel="Key pair"
              noMatch={<Box>No matching key pairs</Box>}
            />
          </FormField>

          <FormField
            label="Security groups"
            description="One or more security groups applied to the primary network interface."
          >
            <Multiselect
              selectedOptions={selectedSecurityGroups}
              onChange={({ detail }) =>
                update({
                  securityGroupIds: (detail.selectedOptions as Array<{ value?: string }>)
                    .map((option) => option.value ?? "")
                    .filter((value) => value.length > 0),
                })
              }
              options={securityGroupOptions}
              placeholder="Choose security groups"
              filteringType="auto"
              ariaLabel="Security groups"
              disabled={loadingResources || submitting}
              noMatch={<Box>No matching security groups</Box>}
            />
          </FormField>

          <Container header={<Header variant="h3">Storage (optional)</Header>}>
            <SpaceBetween size="m">
              <ColumnLayout columns={2} variant="default">
                <FormField label="Volume type">
                  <Select
                    selectedOption={{
                      value: state.rootVolume.volumeType,
                      label:
                        EC2_VOLUME_TYPES.find((type) => type.value === state.rootVolume.volumeType)
                          ?.label ?? state.rootVolume.volumeType,
                    }}
                    options={EC2_VOLUME_TYPES.map((type) => ({
                      value: type.value,
                      label: type.label,
                    }))}
                    onChange={({ detail }) => {
                      const volumeType = (detail.selectedOption.value ?? "gp3") as RootVolumeType;
                      const iopsAllowed =
                        volumeType === "io1" || volumeType === "io2" || volumeType === "gp3";
                      const throughputAllowed = volumeType === "gp3";
                      setState((prev) => ({
                        ...prev,
                        rootVolume: { ...prev.rootVolume, volumeType },
                        rootVolumeExtras: {
                          ...prev.rootVolumeExtras,
                          Iops: iopsAllowed ? prev.rootVolumeExtras.Iops : undefined,
                          Throughput: throughputAllowed
                            ? prev.rootVolumeExtras.Throughput
                            : undefined,
                        },
                      }));
                      setStorageTouched(true);
                    }}
                    disabled={submitting}
                    ariaLabel="Volume type"
                  />
                </FormField>

                <FormField
                  label="Size (GiB)"
                  constraintText={`Root volume size, ${MIN_VOLUME_GIB}-${MAX_VOLUME_GIB} GiB.`}
                  errorText={sizeError}
                >
                  <Input
                    type="number"
                    value={state.rootVolume.volumeSize}
                    onChange={({ detail }) => {
                      setState((prev) => ({
                        ...prev,
                        rootVolume: { ...prev.rootVolume, volumeSize: detail.value },
                      }));
                      setSizeError(null);
                      setStorageTouched(true);
                    }}
                    disabled={submitting}
                    ariaLabel="Root volume size in GiB"
                  />
                </FormField>
              </ColumnLayout>

              <Checkbox
                checked={state.rootVolume.deleteOnTermination}
                onChange={({ detail }) => {
                  setState((prev) => ({
                    ...prev,
                    rootVolume: { ...prev.rootVolume, deleteOnTermination: detail.checked },
                  }));
                  setStorageTouched(true);
                }}
                disabled={submitting}
              >
                Delete on termination
              </Checkbox>

              <Checkbox
                checked={state.rootVolume.encrypted}
                onChange={({ detail }) => {
                  const encrypted = detail.checked;
                  setState((prev) => ({
                    ...prev,
                    rootVolume: { ...prev.rootVolume, encrypted },
                    rootVolumeExtras: encrypted
                      ? prev.rootVolumeExtras
                      : { ...prev.rootVolumeExtras, KmsKeyId: undefined },
                  }));
                  setStorageTouched(true);
                }}
                disabled={submitting}
              >
                Encryption
              </Checkbox>
            </SpaceBetween>
          </Container>

          <Container header={<Header variant="h3">Network settings (optional)</Header>}>
            <SpaceBetween size="m">
              <ColumnLayout columns={2} variant="default">
                <FormField
                  label="Subnet (optional)"
                  description="Leave empty to let each launch choose a subnet."
                >
                  <Select
                    selectedOption={selectedSubnet}
                    options={subnetOptions}
                    onChange={({ detail }) =>
                      update({
                        network: { ...state.network, subnetId: detail.selectedOption.value ?? "" },
                      })
                    }
                    filteringType="auto"
                    filteringPlaceholder="Search subnets"
                    filteringAriaLabel="Search subnets"
                    placeholder="Choose a subnet"
                    disabled={loadingResources || submitting}
                    ariaLabel="Subnet"
                    noMatch={<Box>No matching subnets</Box>}
                  />
                </FormField>

                <FormField label="Auto-assign public IP">
                  <Select
                    selectedOption={
                      PUBLIC_IP_OPTIONS.find(
                        (option) =>
                          option.value === (state.network.assignPublicIp ? "enable" : "disable"),
                      ) ?? PUBLIC_IP_OPTIONS[0]
                    }
                    options={PUBLIC_IP_OPTIONS}
                    onChange={({ detail }) =>
                      update({
                        network: {
                          ...state.network,
                          assignPublicIp: detail.selectedOption.value === "enable",
                        },
                      })
                    }
                    disabled={submitting}
                    ariaLabel="Auto-assign public IP"
                  />
                </FormField>
              </ColumnLayout>

              <FormField
                label="Security groups"
                description="Security groups for the primary network interface (same selection as above)."
              >
                <Multiselect
                  selectedOptions={selectedSecurityGroups}
                  onChange={({ detail }) =>
                    update({
                      securityGroupIds: (detail.selectedOptions as Array<{ value?: string }>)
                        .map((option) => option.value ?? "")
                        .filter((value) => value.length > 0),
                    })
                  }
                  options={securityGroupOptions}
                  placeholder="Choose security groups"
                  filteringType="auto"
                  ariaLabel="Security groups for network settings"
                  disabled={loadingResources || submitting}
                  noMatch={<Box>No matching security groups</Box>}
                />
              </FormField>
            </SpaceBetween>
          </Container>

          <Container header={<Header variant="h3">IAM instance profile (optional)</Header>}>
            <FormField
              label="IAM instance profile"
              description="Enter an instance profile name or ARN. Suggested values come from your IAM roles."
            >
              <Autosuggest
                value={state.iamInstanceProfile}
                onChange={({ detail }) => update({ iamInstanceProfile: detail.value })}
                options={profileOptions}
                filteringType="auto"
                placeholder="my-instance-profile"
                ariaLabel="IAM instance profile"
                disabled={submitting}
              />
            </FormField>
          </Container>

          <FormField
            label="Shutdown behavior"
            description="What happens when a user initiates shutdown from the operating system."
          >
            <Select
              selectedOption={
                SHUTDOWN_OPTIONS.find((option) => option.value === state.shutdownBehavior) ??
                SHUTDOWN_OPTIONS[0]
              }
              options={SHUTDOWN_OPTIONS}
              onChange={({ detail }) =>
                update({
                  shutdownBehavior:
                    detail.selectedOption.value === "terminate" ? "terminate" : "stop",
                })
              }
              disabled={submitting}
              ariaLabel="Shutdown behavior"
            />
          </FormField>

          <Container header={<Header variant="h3">Tags (optional)</Header>}>
            <SpaceBetween size="m">
              <FormField
                label="Resource tags"
                description="Tags applied to instances launched from this template."
              >
                <TagEditor
                  tags={state.resourceTags}
                  onChange={(tags) => update({ resourceTags: tags })}
                  readOnly={submitting}
                />
              </FormField>

              <FormField
                label="Volume tags"
                description="Tags applied to EBS volumes created at launch."
              >
                <TagEditor
                  tags={state.volumeTags}
                  onChange={(tags) => update({ volumeTags: tags })}
                  readOnly={submitting}
                />
              </FormField>

              <FormField
                label="Network interface tags"
                description="Tags applied to network interfaces created at launch."
              >
                <TagEditor
                  tags={state.networkInterfaceTags}
                  onChange={(tags) => update({ networkInterfaceTags: tags })}
                  readOnly={submitting}
                />
              </FormField>
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      </Container>

      <SpaceBetween direction="horizontal" size="xs">
        <Button formAction="none" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => void handleSubmit()}
          loading={submitting}
          disabled={submitting}
        >
          {sourceTemplateId ? "Create version" : "Create template"}
        </Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}
