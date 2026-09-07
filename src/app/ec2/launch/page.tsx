"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CodeView } from "@cloudscape-design/code-view";
import Wizard from "@cloudscape-design/components/wizard";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Checkbox from "@cloudscape-design/components/checkbox";
import RadioGroup from "@cloudscape-design/components/radio-group";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Spinner from "@cloudscape-design/components/spinner";
import Textarea from "@cloudscape-design/components/textarea";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Table from "@cloudscape-design/components/table";

import TextFilter from "@cloudscape-design/components/text-filter";
import { EC2LaunchConfig } from "@/types/ec2";
import {
  EC2_VOLUME_TYPES,
  EC2_DEFAULT_INSTANCE_TYPE,
} from "@/constants/ec2-constants";

const INSTANCE_TYPES = [
  { value: "t3.micro", label: "t3.micro", vcpus: 2, memory: "1 GiB", freeTier: true },
  { value: "t3.small", label: "t3.small", vcpus: 2, memory: "2 GiB", freeTier: false },
  { value: "t3.medium", label: "t3.medium", vcpus: 2, memory: "4 GiB", freeTier: false },
  { value: "t3.large", label: "t3.large", vcpus: 2, memory: "8 GiB", freeTier: false },
  { value: "m5.large", label: "m5.large", vcpus: 2, memory: "8 GiB", freeTier: false },
  { value: "m5.xlarge", label: "m5.xlarge", vcpus: 4, memory: "16 GiB", freeTier: false },
  { value: "c5.large", label: "c5.large", vcpus: 2, memory: "4 GiB", freeTier: false },
  { value: "c5.xlarge", label: "c5.xlarge", vcpus: 4, memory: "8 GiB", freeTier: false },
  { value: "r5.large", label: "r5.large", vcpus: 2, memory: "16 GiB", freeTier: false },
  { value: "r5.xlarge", label: "r5.xlarge", vcpus: 4, memory: "32 GiB", freeTier: false },
];

export default function EC2LaunchPage() {
  const router = useRouter();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [amiImages, setAmiImages] = useState<Array<{ ImageId: string; Name?: string; Architecture?: string; OwnerId?: string }>>([]);
  const [vpcs, setVpcs] = useState<Array<{ VpcId: string; CidrBlock?: string }>>([]);
  const [subnets, setSubnets] = useState<Array<{ SubnetId: string; VpcId?: string; CidrBlock?: string; AvailabilityZone?: string }>>([]);
  const [securityGroups, setSecurityGroups] = useState<Array<{ GroupId: string; GroupName?: string; VpcId?: string }>>([]);
  const [instanceProfiles, setInstanceProfiles] = useState<Array<{ Arn?: string; InstanceProfileName?: string }>>([]);
  const [keyPairs, setKeyPairs] = useState<Array<{ KeyName?: string; KeyFingerprint?: string; KeyType?: string }>>([]);
  const [securityGroupId, setSecurityGroupId] = useState("");
  const [selectedVpcId, setSelectedVpcId] = useState("");
  const [amiFilter, setAmiFilter] = useState("");
  const [amiVisibleCount, setAmiVisibleCount] = useState(50);
  const amiScrollRef = useRef<HTMLDivElement>(null);
  const [createdKeyMaterial, setCreatedKeyMaterial] = useState<string | null>(null);
  const [createdKeyName, setCreatedKeyName] = useState("");
  const [creatingKey, setCreatingKey] = useState(false);
  const [keyPairMode, setKeyPairMode] = useState<"select" | "create" | "none">("none");

  const filteredAmis = useMemo(() => {
    if (!amiFilter.trim()) return amiImages;
    const lower = amiFilter.toLowerCase();
    return amiImages.filter(
      (a) =>
        a.Name?.toLowerCase().includes(lower) ||
        a.ImageId?.toLowerCase().includes(lower) ||
        a.Architecture?.toLowerCase().includes(lower)
    );
  }, [amiImages, amiFilter]);

  const visibleAmis = useMemo(
    () => filteredAmis.slice(0, amiVisibleCount),
    [filteredAmis, amiVisibleCount]
  );

  const amiHasMore = amiVisibleCount < filteredAmis.length;

  const handleAmiScroll = useCallback(() => {
    if (!amiScrollRef.current || !amiHasMore) return;
    const { scrollTop, scrollHeight, clientHeight } = amiScrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      setAmiVisibleCount((prev) => Math.min(prev + 50, filteredAmis.length));
    }
  }, [amiHasMore, filteredAmis.length]);

  useEffect(() => {
    setAmiVisibleCount(50);
  }, [amiFilter]);

  const [config, setConfig] = useState<EC2LaunchConfig>({
    imageId: "",
    instanceType: EC2_DEFAULT_INSTANCE_TYPE,
    keyName: "",
    subnetId: "",
    securityGroupIds: [],
    iamInstanceProfile: "",
    userData: "",
    tags: [{ Key: "Name", Value: "my-instance" }],
    blockDeviceMappings: [
      {
        deviceName: "/dev/xvda",
        volumeSize: 8,
        volumeType: "gp3",
        encrypted: false,
        deleteOnTermination: true,
      },
    ],
    monitoring: false,
    disableApiTermination: false,
    shutdownBehavior: "stop",
    numInstances: 1,
  });

  useEffect(() => {
    const loadResources = async (): Promise<void> => {
      try {
        const [imagesResponse, vpcsResponse, subnetsResponse, groupsResponse, profilesResponse, keyPairsResponse] = await Promise.all([
          fetch("/api/ec2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "describeImages", owners: ["amazon", "self"] }) }),
          fetch("/api/ec2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "describeVpcs" }) }),
          fetch("/api/ec2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "describeSubnets" }) }),
          fetch("/api/ec2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "describeSecurityGroups" }) }),
          fetch("/api/iam-instance-profile"),
          fetch("/api/ec2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "describeKeyPairs" }) }),
        ]);
        const [images, vpcData, subnetData, groupData, profileData, keyPairsData] = await Promise.all([
          imagesResponse.json(), vpcsResponse.json(), subnetsResponse.json(), groupsResponse.json(), profilesResponse.json(), keyPairsResponse.json(),
        ]);
        setAmiImages(images.images || []);
        setVpcs(vpcData.vpcs || []);
        setSubnets(subnetData.subnets || []);
        setSecurityGroups(groupData.securityGroups || []);
        setInstanceProfiles(profileData.instanceProfiles || []);
        setKeyPairs(keyPairsData.keyPairs || []);
      } catch (cause: unknown) {
        setError(cause instanceof Error ? cause.message : "Failed to load EC2 launch resources");
      }
    };
    void loadResources();
  }, []);

  const updateConfig = useCallback((updates: Partial<EC2LaunchConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleCreateKeyPair = useCallback(async () => {
    const keyName = createdKeyName.trim();
    if (!keyName) return;
    setCreatingKey(true);
    try {
      const res = await fetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createKeyPair", keyName }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to create key pair");
      setCreatedKeyMaterial(data.keyPair?.KeyMaterial || "");
      updateConfig({ keyName: data.keyPair?.KeyName || keyName });
      setKeyPairs((prev) => [...prev, { KeyName: data.keyPair?.KeyName || keyName, KeyType: "rsa" }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create key pair");
    } finally {
      setCreatingKey(false);
    }
  }, [createdKeyName, updateConfig]);

  const validateStep = (stepIndex: number): string | null => {
    if (stepIndex === 0 && !config.imageId) return "Please select an AMI";
    if (stepIndex === 1 && !config.instanceType) return "Please select an instance type";
    return null;
  };

  const steps = [
    {
      title: "Choose an Amazon Machine Image (AMI)",
      description: "Select the software template for your instance",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">Quick Start</Box>
          <Box variant="small" color="text-body-secondary">
            Choose an AMI returned by the active emulator. No synthetic AMI identifiers are shown.
          </Box>
          <div style={{ border: "1px solid var(--awsui-color-border-default)", borderRadius: "4px" }}>
            <div style={{ position: "sticky", top: 0, zIndex: 1, background: "var(--awsui-color-background-layout)" }}>
              <Header variant="h3">
                Available AMIs ({filteredAmis.length})
                {amiHasMore && <span style={{ fontWeight: "normal", marginLeft: 8, fontSize: 12 }}>({amiVisibleCount} of {filteredAmis.length} shown — scroll for more)</span>}
              </Header>
              <TextFilter
                filteringText={amiFilter}
                filteringPlaceholder="Filter AMIs by name, ID, or architecture"
                filteringAriaLabel="Filter AMIs"
                onChange={({ detail }) => {
                  setAmiFilter(detail.filteringText);
                  setAmiVisibleCount(50);
                  if (amiScrollRef.current) amiScrollRef.current.scrollTop = 0;
                }}
              />
            </div>
            <div
              ref={amiScrollRef}
              onScroll={handleAmiScroll}
              style={{ height: "400px", overflowY: "auto" }}
            >
              <Table
                columnDefinitions={[
                  {
                    header: "Select",
                    cell: (item) => (
                      <RadioGroup
                        value={config.imageId}
                        onChange={({ detail }) => updateConfig({ imageId: detail.value })}
                        items={[{ value: item.ImageId!, label: "" }]}
                      />
                    ),
                    width: 60,
                  },
                  { header: "Name", cell: (item) => item.Name, sortingField: "Name" },
                  { header: "Architecture", cell: (item) => item.Architecture },
                  { header: "Owner", cell: (item) => item.OwnerId },
                ]}
                items={visibleAmis}
                selectedItems={amiImages.filter((a) => a.ImageId === config.imageId)}
                trackBy="ImageId"
                empty={<Box>No AMIs are available from the active emulator.</Box>}
              />
            </div>
          </div>
        </SpaceBetween>
      ),
    },
    {
      title: "Choose an Instance Type",
      description: "Select the hardware configuration for your instance",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">Instance Types</Box>
          <Box variant="small" color="text-body-secondary">
            Instance types provide varying combinations of CPU, memory, storage, and networking capacity.
          </Box>
          <Table
            columnDefinitions={[
              {
                header: "Select",
                cell: (item) => (
                  <RadioGroup
                    value={config.instanceType}
                    onChange={({ detail }) => updateConfig({ instanceType: detail.value })}
                    items={[{ value: item.value, label: "" }]}
                  />
                ),
                width: 60,
              },
              {
                header: "Instance Type",
                cell: (item) => item.label,
                sortingField: "value",
              },
              { header: "vCPUs", cell: (item) => item.vcpus },
              { header: "Memory", cell: (item) => item.memory },
            ]}
            items={INSTANCE_TYPES}
            selectedItems={INSTANCE_TYPES.filter((t) => t.value === config.instanceType)}
            trackBy="value"
            header={<Header variant="h3">Available Instance Types ({INSTANCE_TYPES.length})</Header>}
          />
        </SpaceBetween>
      ),
    },
    {
      title: "Configure Instance Details",
      description: "Network, IAM role, and other settings",
      content: (
        <SpaceBetween size="l">
          <ColumnLayout columns={2} variant="default">
            <FormField label="Number of instances">
              <Input
                value={String(config.numInstances)}
                onChange={({ detail }) => updateConfig({ numInstances: parseInt(detail.value) || 1 })}
                inputMode="numeric"
                type="number"
              />
            </FormField>
            <FormField label="Purchasing options">
              <Select
                selectedOption={{ value: "on-demand", label: "On-Demand" }}
                options={[
                  { value: "on-demand", label: "On-Demand" },
                  { value: "spot", label: "Spot" },
                ]}
                onChange={() => { }}
              />
            </FormField>
          </ColumnLayout>
          <FormField label="Network">
            <ColumnLayout columns={2} variant="default">
              <div>
                <Box variant="small" color="text-label">VPC</Box>
                <Select
                  selectedOption={selectedVpcId ? { value: selectedVpcId, label: `${selectedVpcId} (${vpcs.find((v) => v.VpcId === selectedVpcId)?.CidrBlock || ""})` } : null}
                  options={vpcs.map((vpc) => ({ value: vpc.VpcId, label: `${vpc.VpcId}${vpc.CidrBlock ? ` (${vpc.CidrBlock})` : ""}` }))}
                  placeholder="Select a VPC"
                  onChange={({ detail }) => {
                    const newVpcId = detail.selectedOption.value || "";
                    setSelectedVpcId(newVpcId);
                    const firstSubnet = subnets.find((s) => s.VpcId === newVpcId);
                    updateConfig({ subnetId: firstSubnet?.SubnetId || "" });
                    setSecurityGroupId("");
                  }}
                />
              </div>
              <div>
                <Box variant="small" color="text-label">Subnet</Box>
                <Select
                  selectedOption={config.subnetId ? { value: config.subnetId, label: `${config.subnetId} (${subnets.find((s) => s.SubnetId === config.subnetId)?.AvailabilityZone || ""})` } : null}
                  options={subnets.filter((subnet) => !selectedVpcId || subnet.VpcId === selectedVpcId).map((subnet) => ({ value: subnet.SubnetId, label: `${subnet.SubnetId} (${subnet.AvailabilityZone || ""}) - ${subnet.CidrBlock || ""}` }))}
                  placeholder="Select a subnet"
                  onChange={({ detail }) => {
                    updateConfig({ subnetId: detail.selectedOption.value || "" });
                    setSecurityGroupId("");
                  }}
                />
              </div>
            </ColumnLayout>
          </FormField>
          <FormField label="IAM Role (optional)">
            <Select
              selectedOption={{ value: config.iamInstanceProfile || "", label: config.iamInstanceProfile || "None" }}
              options={[{ value: "", label: "None" }, ...instanceProfiles.flatMap((profile) => profile.Arn && profile.InstanceProfileName ? [{ value: profile.Arn, label: profile.InstanceProfileName }] : [])]}
              onChange={({ detail }) => updateConfig({ iamInstanceProfile: detail.selectedOption.value })}
            />
          </FormField>
          <FormField label="User Data (optional)">
            <Textarea
              value={config.userData || ""}
              onChange={({ detail }) => updateConfig({ userData: detail.value })}
              placeholder="#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd"
              rows={4}
            />
            <Box variant="small" color="text-body-secondary">
              Shell script or cloud-init directives. Encoded as Base64.
            </Box>
          </FormField>
          <FormField label="Shutdown behavior">
            <Select
              selectedOption={{ value: config.shutdownBehavior, label: config.shutdownBehavior === "stop" ? "Stop" : "Terminate" }}
              options={[
                { value: "stop", label: "Stop" },
                { value: "terminate", label: "Terminate" },
              ]}
              onChange={({ detail }) => updateConfig({ shutdownBehavior: detail.selectedOption.value as "stop" | "terminate" })}
            />
          </FormField>
          <Checkbox
            checked={config.monitoring}
            onChange={({ detail }) => updateConfig({ monitoring: detail.checked })}
          >
            Enable detailed monitoring
          </Checkbox>
          <Checkbox
            checked={config.disableApiTermination}
            onChange={({ detail }) => updateConfig({ disableApiTermination: detail.checked })}
          >
            Enable termination protection
          </Checkbox>
        </SpaceBetween>
      ),
    },
    {
      title: "Add Storage",
      description: "Configure root and additional EBS volumes",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">Root Volume</Box>
          <ColumnLayout columns={3} variant="default">
            <FormField label="Size (GB)">
              <Input
                value={String(config.blockDeviceMappings[0]?.volumeSize || 8)}
                onChange={({ detail }) => {
                  const newMappings = [...config.blockDeviceMappings];
                  newMappings[0] = { ...newMappings[0], volumeSize: parseInt(detail.value) || 8 };
                  updateConfig({ blockDeviceMappings: newMappings });
                }}
                inputMode="numeric"
                type="number"
              />
            </FormField>
            <FormField label="Volume Type">
              <Select
                selectedOption={{
                  value: config.blockDeviceMappings[0]?.volumeType || "gp3",
                  label: EC2_VOLUME_TYPES.find((t) => t.value === (config.blockDeviceMappings[0]?.volumeType || "gp3"))?.label,
                }}
                options={EC2_VOLUME_TYPES.map((t) => ({ value: t.value, label: t.label }))}
                onChange={({ detail }) => {
                  const newMappings = [...config.blockDeviceMappings];
                  newMappings[0] = { ...newMappings[0], volumeType: detail.selectedOption.value as any };
                  updateConfig({ blockDeviceMappings: newMappings });
                }}
              />
            </FormField>
            <FormField label="IOPS (if applicable)">
              <Input
                value={String(config.blockDeviceMappings[0]?.iops || "")}
                onChange={({ detail }) => {
                  const newMappings = [...config.blockDeviceMappings];
                  newMappings[0] = { ...newMappings[0], iops: parseInt(detail.value) || undefined };
                  updateConfig({ blockDeviceMappings: newMappings });
                }}
                inputMode="numeric"
                type="number"
                placeholder="Auto"
              />
            </FormField>
          </ColumnLayout>
          <Checkbox
            checked={config.blockDeviceMappings[0]?.encrypted || false}
            onChange={({ detail }) => {
              const newMappings = [...config.blockDeviceMappings];
              newMappings[0] = { ...newMappings[0], encrypted: detail.checked };
              updateConfig({ blockDeviceMappings: newMappings });
            }}
          >
            Encrypt root volume
          </Checkbox>
          <Checkbox
            checked={config.blockDeviceMappings[0]?.deleteOnTermination ?? true}
            onChange={({ detail }) => {
              const newMappings = [...config.blockDeviceMappings];
              newMappings[0] = { ...newMappings[0], deleteOnTermination: detail.checked };
              updateConfig({ blockDeviceMappings: newMappings });
            }}
          >
            Delete on termination
          </Checkbox>
        </SpaceBetween>
      ),
    },
    {
      title: "Add Tags",
      description: "Add tags to identify and organize your instance",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">Tags</Box>
          <Box variant="small" color="text-body-secondary">
            Tags are key-value pairs that help you identify, organize, and manage your AWS resources.
          </Box>
          {config.tags.map((tag, index) => (
            <ColumnLayout key={index} columns={3} variant="default">
              <FormField label="Key">
                <Input
                  value={tag.Key}
                  onChange={({ detail }) => {
                    const newTags = [...config.tags];
                    newTags[index] = { ...newTags[index], Key: detail.value };
                    updateConfig({ tags: newTags });
                  }}
                  placeholder="Key"
                />
              </FormField>
              <FormField label="Value">
                <Input
                  value={tag.Value}
                  onChange={({ detail }) => {
                    const newTags = [...config.tags];
                    newTags[index] = { ...newTags[index], Value: detail.value };
                    updateConfig({ tags: newTags });
                  }}
                  placeholder="Value"
                />
              </FormField>
              <FormField label="&nbsp;">
                <Button
                  onClick={() => {
                    const newTags = config.tags.filter((_, i) => i !== index);
                    updateConfig({ tags: newTags });
                  }}
                  formAction="none"
                >
                  Remove
                </Button>
              </FormField>
            </ColumnLayout>
          ))}
          <Button
            onClick={() => updateConfig({ tags: [...config.tags, { Key: "", Value: "" }] })}
            formAction="none"
          >
            Add tag
          </Button>
        </SpaceBetween>
      ),
    },
    {
      title: "Configure Security Group",
      description: "Define firewall rules for your instance",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">Firewall (security groups)</Box>
          <FormField label="Security group" description="Security groups must belong to the selected VPC.">
            <Select
              selectedOption={securityGroupId ? { value: securityGroupId, label: `${securityGroupId} (${securityGroups.find((g) => g.GroupId === securityGroupId)?.GroupName || ""})` } : null}
              options={securityGroups.filter((group) => {
                if (!selectedVpcId) return true;
                return group.VpcId === selectedVpcId;
              }).map((group) => ({ value: group.GroupId, label: `${group.GroupId} (${group.GroupName || ""})` }))}
              placeholder="Select a security group"
              onChange={({ detail }) => {
                setSecurityGroupId(detail.selectedOption.value || "");
                updateConfig({ securityGroupIds: detail.selectedOption.value ? [detail.selectedOption.value] : [] });
              }}
            />
          </FormField>
          <Box variant="small" color="text-body-secondary">Create additional security groups from the Security Groups console before launching.</Box>
          <Box variant="h4">Inbound Rules</Box>
          <Box variant="small" color="text-body-secondary">
            Configure the traffic allowed to reach your instance.
          </Box>
          <Table
            columnDefinitions={[
              { header: "Type", cell: () => "SSH" },
              { header: "Protocol", cell: () => "TCP" },
              { header: "Port Range", cell: () => "22" },
              { header: "Source", cell: () => "0.0.0.0/0" },
              { header: "Description", cell: () => "Allow SSH access" },
            ]}
            items={[{ type: "SSH", protocol: "TCP", port: 22, source: "0.0.0.0/0", description: "Allow SSH access" }]}
            header={<Header variant="h3">Security Group Rules</Header>}
          />
        </SpaceBetween>
      ),
    },
    {
      title: "Select or Create a Key Pair",
      description: "SSH key pair for secure access",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">Key Pair</Box>
          <Box variant="small" color="text-body-secondary">
            Select an existing key pair or create a new one. You will need the private key to connect to your instance.
          </Box>
          <RadioGroup
            value={keyPairMode}
            items={[
              { value: "select", label: "Select an existing key pair" },
              { value: "create", label: "Create a new key pair" },
              { value: "none", label: "Proceed without a key pair" },
            ]}
            onChange={({ detail }) => {
              setKeyPairMode(detail.value as "select" | "create" | "none");
              updateConfig({ keyName: "" });
              setCreatedKeyMaterial(null);
              setCreatedKeyName("");
            }}
          />
          {keyPairMode === "select" && (
            <FormField label="Key pair name">
              <Select
                selectedOption={config.keyName ? { value: config.keyName, label: config.keyName } : null}
                options={keyPairs.map((kp) => ({ value: kp.KeyName || "", label: `${kp.KeyName || ""} (${kp.KeyType || "rsa"})` }))}
                placeholder="Choose a key pair"
                onChange={({ detail }) => updateConfig({ keyName: detail.selectedOption.value || "" })}
              />
            </FormField>
          )}
          {keyPairMode === "create" && (
            createdKeyMaterial ? (
              <SpaceBetween size="m">
                <Alert type="success">
                  Key pair created successfully. Download your private key file now — you cannot download it again.
                </Alert>
                <Container header={<Header variant="h3">Private Key ({createdKeyName})</Header>}>
                  <CodeView content={createdKeyMaterial} lineNumbers wrapLines />
                </Container>
                <Button
                  onClick={() => {
                    const blob = new Blob([createdKeyMaterial], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${createdKeyName}.pem`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  iconName="download"
                >
                  Download private key
                </Button>
              </SpaceBetween>
            ) : (
              <FormField label="Key pair name" constraintText="Must be unique. Private key will be downloaded once.">
                <SpaceBetween direction="horizontal" size="s">
                  <Input
                    value={createdKeyName}
                    onChange={({ detail }) => setCreatedKeyName(detail.value)}
                    placeholder="my-key-pair"
                  />
                  <Button
                    variant="primary"
                    loading={creatingKey}
                    onClick={handleCreateKeyPair}
                    disabled={!createdKeyName.trim()}
                  >
                    Create
                  </Button>
                </SpaceBetween>
              </FormField>
            )
          )}
          <Alert type="info">
            Without a key pair, you will not be able to SSH into your instance. You can still use Session Manager if available.
          </Alert>
        </SpaceBetween>
      ),
    },
    {
      title: "Review Instance Launch",
      description: "Review your settings before launching",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">Review</Box>
          <Container header={<Header variant="h3">AMI Details</Header>}>
            <ColumnLayout columns={2} variant="default">
              <div>
                <Box variant="small" color="text-label">AMI ID</Box>
                <Box>{config.imageId}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">AMI Name</Box>
                <Box>{amiImages.find((a) => a.ImageId === config.imageId)?.Name || "—"}</Box>
              </div>
            </ColumnLayout>
          </Container>
          <Container header={<Header variant="h3">Instance Details</Header>}>
            <ColumnLayout columns={3} variant="default">
              <div>
                <Box variant="small" color="text-label">Instance Type</Box>
                <Box>{config.instanceType}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Number of Instances</Box>
                <Box>{config.numInstances}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Key Pair</Box>
                <Box>{config.keyName || "None"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Network</Box>
                <Box>{config.subnetId || "Default VPC"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Shutdown Behavior</Box>
                <Box>{config.shutdownBehavior === "stop" ? "Stop" : "Terminate"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Monitoring</Box>
                <Box>{config.monitoring ? "Detailed" : "Basic"}</Box>
              </div>
            </ColumnLayout>
          </Container>
          <Container header={<Header variant="h3">Storage</Header>}>
            <ColumnLayout columns={3} variant="default">
              <div>
                <Box variant="small" color="text-label">Root Volume</Box>
                <Box>{config.blockDeviceMappings[0]?.volumeSize} GB {config.blockDeviceMappings[0]?.volumeType}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Encrypted</Box>
                <Box>{config.blockDeviceMappings[0]?.encrypted ? "Yes" : "No"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Delete on Termination</Box>
                <Box>{config.blockDeviceMappings[0]?.deleteOnTermination ? "Yes" : "No"}</Box>
              </div>
            </ColumnLayout>
          </Container>
          {config.tags.length > 0 && (
            <Container header={<Header variant="h3">Tags</Header>}>
              {config.tags.filter((t) => t.Key).map((tag, idx) => (
                <Box key={idx}>{tag.Key}: {tag.Value}</Box>
              ))}
            </Container>
          )}
        </SpaceBetween>
      ),
    },
  ];

  const handleLaunch = useCallback(async () => {
    setLaunching(true);
    setError(null);
    try {
      if (!config.imageId) throw new Error("Select an AMI returned by the active emulator");
      if (!config.subnetId) throw new Error("Select a subnet returned by the active emulator");
      const res = await fetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "launch",
          imageId: config.imageId,
          instanceType: config.instanceType,
          keyName: config.keyName || undefined,
          subnetId: config.subnetId || undefined,
          securityGroupIds: config?.securityGroupIds?.length ? config.securityGroupIds : undefined,
          iamInstanceProfile: config.iamInstanceProfile || undefined,
          userData: config.userData || undefined,
          tags: config.tags.filter((t) => t.Key),
          blockDeviceMappings: config.blockDeviceMappings.map((bdm) => ({
            DeviceName: bdm.deviceName,
            Ebs: {
              VolumeSize: bdm.volumeSize,
              VolumeType: bdm.volumeType,
              Encrypted: bdm.encrypted,
              DeleteOnTermination: bdm.deleteOnTermination,
            },
          })),
          monitoring: config.monitoring,
          disableApiTermination: config.disableApiTermination,
          shutdownBehavior: config.shutdownBehavior,
          minCount: config.numInstances,
          maxCount: config.numInstances,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to launch instance");
      router.push("/ec2");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to launch instance");
    }
    setLaunching(false);
  }, [config, router]);

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <Button onClick={() => router.push("/ec2")} formAction="none">
              Back to EC2
            </Button>
          }
        >
          Launch an instance
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {launching ? (
          <Container>
            <Box textAlign="center" padding="xxl">
              <Spinner size="large" />
              <Box variant="h3" padding={{ top: "m" }}>
                Launching instance...
              </Box>
              <Box variant="p" color="text-body-secondary">
                Your instance is being launched. This may take a moment.
              </Box>
            </Box>
          </Container>
        ) : (
          <>
            {validationError && (
              <Alert type="error" dismissible onDismiss={() => setValidationError(null)}>
                {validationError}
              </Alert>
            )}
            <Wizard
            steps={steps}
            activeStepIndex={activeStepIndex}
            onNavigate={({ detail }) => {
              const targetStep = detail.requestedStepIndex;
              if (targetStep > activeStepIndex) {
                const err = validateStep(activeStepIndex);
                if (err) {
                  setValidationError(err);
                  return;
                }
              }
              setValidationError(null);
              setActiveStepIndex(targetStep);
            }}
            onSubmit={handleLaunch}
            i18nStrings={{
              submitButton: "Launch instance",
              cancelButton: "Cancel",
              nextButton: "Next",
              previousButton: "Previous",
              navigationAriaLabel: "Wizard navigation",
              stepNumberLabel: (stepIndex) => `Step ${stepIndex + 1}`,
            }}
          />
          </>
        )}
      </SpaceBetween>
    </div>
  );
}
