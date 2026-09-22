"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Wizard from "@cloudscape-design/components/wizard";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Checkbox from "@cloudscape-design/components/checkbox";
import Select from "@cloudscape-design/components/select";
import Button from "@cloudscape-design/components/button";
import Alert from "@cloudscape-design/components/alert";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import RadioGroup from "@cloudscape-design/components/radio-group";
import Tabs from "@cloudscape-design/components/tabs";
import Table from "@cloudscape-design/components/table";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import Image from "next/image";
import { SERVICE_ICONS } from "@/constants/service-icons";
import { EC2AMIImage, EC2InstanceTypeInfo, EC2Subnet, EC2SecurityGroup, EC2KeyPair, EC2LaunchWizardState } from "@/types/ec2";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";
import { apiFetch } from "@/lib/api-client";

const AMI_CATEGORIES = [
  { value: "quick-start", label: "Quick Start" },
  { value: "my-amis", label: "My AMIs" },
  { value: "marketplace", label: "AWS Marketplace" },
  { value: "community", label: "Community AMIs" },
];

const INSTANCE_TYPES = [
  { value: "t3.nano", label: "t3.nano", vcpus: 2, memory: 0.5, network: "Up to 5 Gbps", freeTier: true },
  { value: "t3.micro", label: "t3.micro", vcpus: 2, memory: 1, network: "Up to 5 Gbps", freeTier: true },
  { value: "t3.small", label: "t3.small", vcpus: 2, memory: 2, network: "Up to 5 Gbps", freeTier: true },
  { value: "t3.medium", label: "t3.medium", vcpus: 2, memory: 4, network: "Up to 5 Gbps", freeTier: false },
  { value: "t3.large", label: "t3.large", vcpus: 2, memory: 8, network: "Up to 5 Gbps", freeTier: false },
  { value: "t3.xlarge", label: "t3.xlarge", vcpus: 4, memory: 16, network: "Up to 5 Gbps", freeTier: false },
  { value: "t3.2xlarge", label: "t3.2xlarge", vcpus: 8, memory: 32, network: "Up to 5 Gbps", freeTier: false },
  { value: "m5.large", label: "m5.large", vcpus: 2, memory: 8, network: "Up to 10 Gbps", freeTier: false },
  { value: "m5.xlarge", label: "m5.xlarge", vcpus: 4, memory: 16, network: "Up to 10 Gbps", freeTier: false },
  { value: "m5.2xlarge", label: "m5.2xlarge", vcpus: 8, memory: 32, network: "Up to 10 Gbps", freeTier: false },
  { value: "m5.4xlarge", label: "m5.4xlarge", vcpus: 16, memory: 64, network: "Up to 10 Gbps", freeTier: false },
  { value: "c5.large", label: "c5.large", vcpus: 2, memory: 4, network: "Up to 10 Gbps", freeTier: false },
  { value: "c5.xlarge", label: "c5.xlarge", vcpus: 4, memory: 8, network: "Up to 10 Gbps", freeTier: false },
  { value: "r5.large", label: "r5.large", vcpus: 2, memory: 16, network: "Up to 10 Gbps", freeTier: false },
  { value: "r5.xlarge", label: "r5.xlarge", vcpus: 4, memory: 32, network: "Up to 10 Gbps", freeTier: false },
];

const VOLUME_TYPES = [
  { value: "gp3", label: "General Purpose SSD (gp3)", description: "Cost-effective, balances price and performance" },
  { value: "gp2", label: "General Purpose SSD (gp2)", description: "Previous generation general purpose" },
  { value: "io2", label: "Provisioned IOPS SSD (io2)", description: "Highest performance for critical workloads" },
  { value: "io1", label: "Provisioned IOPS SSD (io1)", description: "Previous generation provisioned IOPS" },
  { value: "st1", label: "Throughput Optimized HDD (st1)", description: "Frequently accessed, throughput-intensive workloads" },
  { value: "sc1", label: "Cold HDD (sc1)", description: "Less frequently accessed workloads" },
  { value: "standard", label: "Magnetic (standard)", description: "Previous generation magnetic volumes" },
];

export default function EC2LaunchPage() {
  const router = useRouter();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [wizardState, setWizardState] = useState<EC2LaunchWizardState>({
    step1: { amiCategory: "quick-start", selectedImageId: "" },
    step2: { instanceType: "t3.micro", vcpus: 2, memory: 1, network: "Up to 5 Gbps", freeTier: true, currentGeneration: true, supportsIpv6: true },
    step3: {
      numberOfInstances: 1,
      purchasingOption: "on-demand",
      networkInterface: {
        subnetId: "",
        autoAssignPublicIp: true,
        securityGroupIds: [],
        primaryNetworkInterface: true,
        deleteOnTermination: true,
        secondaryPrivateIpCount: 0,
        ipv6AddressCount: 0,
      },
      iamInstanceProfile: "",
      shutdownBehavior: "stop",
      monitoring: false,
      ebsOptimized: false,
      userData: "",
      metadataOptions: {
        httpTokens: "required",
        httpPutResponseHopLimit: 1,
        httpEndpoint: "enabled",
        httpProtocolIpv6: "disabled",
        instanceMetadataTags: "disabled",
      },
      creditSpecification: { cpuCredits: "standard" },
      placementGroup: "",
      tenancy: "default",
      hostId: "",
      hostResourceGroupArn: "",
      capacityReservation: "open",
      capacityReservationId: "",
    },
    step4: { volumes: [{ deviceName: "/dev/xvda", snapshotId: "", volumeSize: 8, volumeType: "gp3", iops: 3000, throughput: 125, encrypted: false, kmsKeyId: "", deleteOnTermination: true }] },
    step5: { tags: [{ Key: "Name", Value: "" }] },
    step6: {
      securityGroupId: "",
      securityGroupName: "launch-wizard",
      description: "Security group created by launch wizard",
      vpcId: "",
      rules: [
        { type: "inbound", protocol: "tcp", fromPort: 22, toPort: 22, cidrIp: "0.0.0.0/0", description: "SSH" },
        { type: "inbound", protocol: "tcp", fromPort: 80, toPort: 80, cidrIp: "0.0.0.0/0", description: "HTTP" },
        { type: "inbound", protocol: "tcp", fromPort: 443, toPort: 443, cidrIp: "0.0.0.0/0", description: "HTTPS" },
      ],
    },
    step7: { summary: null },
    currentStep: 0,
  });

  const [amis, setAmis] = useState<EC2AMIImage[]>([]);
  const [instanceTypes, setInstanceTypes] = useState<EC2InstanceTypeInfo[]>([]);
  const [subnets, setSubnets] = useState<EC2Subnet[]>([]);
  const [securityGroups, setSecurityGroups] = useState<EC2SecurityGroup[]>([]);
  const [keyPairs, setKeyPairs] = useState<EC2KeyPair[]>([]);
  const [vpcs, setVpcs] = useState<{ VpcId?: string; CidrBlock?: string; IsDefault?: boolean }[]>([]);

  useEffect(() => {
    async function fetchLaunchData() {
      try {
        const [amisRes, typesRes, subnetsRes, sgsRes, kpRes, vpcsRes] = await Promise.all([
          apiFetch("/api/ec2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "describeImages", owners: ["amazon"], filters: [{ Name: "state", Values: ["available"] }] }) }),
          apiFetch("/api/ec2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "describeInstanceTypes", filters: [{ Name: "current-generation", Values: ["true"] }], maxResults: 50 }) }),
          apiFetch("/api/ec2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "describeSubnets" }) }),
          apiFetch("/api/ec2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "describeSecurityGroups" }) }),
          apiFetch("/api/ec2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "describeKeyPairs" }) }),
          apiFetch("/api/ec2", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "describeVpcs" }) }),
        ]);

        const [amisData, typesData, subnetsData, sgsData, kpData, vpcsData] = await Promise.all([
          amisRes.json(), typesRes.json(), subnetsRes.json(), sgsRes.json(), kpRes.json(), vpcsRes.json()
        ]);

        if (amisData.images) setAmis(amisData.images);
        if (typesData.instanceTypes) setInstanceTypes(typesData.instanceTypes);
        if (subnetsData.subnets) setSubnets(subnetsData.subnets);
        if (sgsData.securityGroups) setSecurityGroups(sgsData.securityGroups);
        if (kpData.keyPairs) setKeyPairs(kpData.keyPairs);
        if (vpcsData.vpcs) setVpcs(vpcsData.vpcs);
      } catch (err) {
        console.error("Failed to fetch launch data:", err);
      }
    }
    fetchLaunchData();
  }, []);

  const updateStep = (step: number, data: any) => {
    const stepKeys = ["step1", "step2", "step3", "step4", "step5", "step6", "step7"] as const;
    setWizardState(prev => ({
      ...prev,
      [stepKeys[step]]: { ...prev[stepKeys[step]], ...data },
      currentStep: step,
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!wizardState.step1.selectedImageId) {
          setError("Please select an AMI");
          return false;
        }
        return true;
      case 1:
        if (!wizardState.step2.instanceType) {
          setError("Please select an instance type");
          return false;
        }
        return true;
      case 2:
        if (!wizardState.step3.networkInterface.subnetId) {
          setError("Please select a subnet");
          return false;
        }
        return true;
      case 3:
        if (wizardState.step4.volumes.some(v => v.volumeSize < 1)) {
          setError("Volume size must be at least 1 GiB");
          return false;
        }
        return true;
      case 4:
        return true;
      case 5:
        if (!wizardState.step6.vpcId) {
          setError("Please select a VPC");
          return false;
        }
        return true;
      case 6:
        return true;
      default:
        return true;
    }
  };

  const handleLaunch = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      const { step1, step2, step3, step4, step5, step6 } = wizardState;
      
      const res = await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "launch",
          imageId: step1.selectedImageId,
          instanceType: step2.instanceType,
          minCount: step3.numberOfInstances,
          maxCount: step3.numberOfInstances,
          keyName: step6.securityGroupId ? undefined : undefined,
          subnetId: step3.networkInterface.subnetId,
          securityGroupIds: step3.networkInterface.securityGroupIds,
          iamInstanceProfile: step3.iamInstanceProfile || undefined,
          userData: step3.userData,
          tags: step5.tags.filter(t => t.Key),
          blockDeviceMappings: step4.volumes.map(v => ({
            DeviceName: v.deviceName,
            Ebs: {
              SnapshotId: v.snapshotId || undefined,
              VolumeSize: v.volumeSize,
              VolumeType: v.volumeType,
              Iops: v.iops,
              Throughput: v.throughput,
              Encrypted: v.encrypted,
              KmsKeyId: v.kmsKeyId || undefined,
              DeleteOnTermination: v.deleteOnTermination,
            },
          })),
          monitoring: step3.monitoring ? { Enabled: true } : undefined,
          disableApiTermination: false,
          instanceInitiatedShutdownBehavior: step3.shutdownBehavior,
          networkInterfaces: [{
            SubnetId: step3.networkInterface.subnetId,
            DeviceIndex: 0,
            Groups: step3.networkInterface.securityGroupIds,
            AssociatePublicIpAddress: step3.networkInterface.autoAssignPublicIp,
            DeleteOnTermination: step3.networkInterface.deleteOnTermination,
          }],
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to launch instances");
      
      router.push("/ec2");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to launch instances");
    } finally {
      setCreating(false);
    }
  }, [wizardState, router]);

  const steps = [
    {
      title: "Choose AMI",
      description: "Select an Amazon Machine Image (AMI) to use as the base for your instance",
      content: (
        <SpaceBetween size="l">
          <FormField label="AMI Category">
            <Select
              selectedOption={{ value: wizardState.step1.amiCategory, label: AMI_CATEGORIES.find(c => c.value === wizardState.step1.amiCategory)?.label || "" }}
              options={AMI_CATEGORIES.map(c => ({ value: c.value, label: c.label }))}
              onChange={({ detail }) => updateStep(0, { amiCategory: detail.selectedOption.value, selectedImageId: "" })}
            />
          </FormField>
          <Container>
            <SpaceBetween size="m">
              <TextFilter
                filteringText={""}
                filteringPlaceholder="Search AMIs by name, ID, or keyword"
                filteringAriaLabel="Search AMIs"
                onChange={() => {}}
              />
            </SpaceBetween>
            <Table
              columnDefinitions={[
                { header: "AMI ID", cell: (item: EC2AMIImage) => <Button variant="link" onClick={() => updateStep(0, { selectedImageId: item.ImageId || "" })} formAction="none">{item.ImageId}</Button> },
                { header: "Name", cell: (item: EC2AMIImage) => item.Name || "—" },
                { header: "Description", cell: (item: EC2AMIImage) => item.Description || "—" },
                { header: "Platform", cell: (item: EC2AMIImage) => item.Platform || "Linux/Unix" },
                { header: "Architecture", cell: (item: EC2AMIImage) => item.Architecture || "x86_64" },
                { header: "Root Device", cell: (item: EC2AMIImage) => item.RootDeviceType || "ebs" },
                { header: "Virtualization", cell: (item: EC2AMIImage) => item.VirtualizationType || "hvm" },
                { header: "Owner", cell: (item: EC2AMIImage) => item.OwnerAlias || item.OwnerId || "—" },
              ]}
              items={amis.filter(a => a.State === "available").slice(0, 50)}
              selectionType="single"
              selectedItems={amis.filter(a => a.ImageId === wizardState.step1.selectedImageId)}
              onSelectionChange={({ detail }) => updateStep(0, { selectedImageId: detail.selectedItems[0]?.ImageId || "" })}
              empty={<Box textAlign="center" padding="l">No AMIs found</Box>}
            />
          </Container>
        </SpaceBetween>
      ),
    },
    {
      title: "Choose Instance Type",
      description: "Select the hardware configuration for your instance",
      content: (
        <SpaceBetween size="l">
          <Container>
            <Table
              columnDefinitions={[
                { header: "Instance Type", cell: (item: EC2InstanceTypeInfo) => <Button variant="link" onClick={() => updateStep(1, { instanceType: item.InstanceType || "", vcpus: item.VCpuInfo?.DefaultVCpus || 0, memory: item.MemoryInfo?.SizeInMiB ? Math.round(item.MemoryInfo.SizeInMiB / 1024) : 0 })} formAction="none">{item.InstanceType}</Button> },
                { header: "vCPUs", cell: (item: EC2InstanceTypeInfo) => item.VCpuInfo?.DefaultVCpus || "—" },
                { header: "Memory (GiB)", cell: (item: EC2InstanceTypeInfo) => item.MemoryInfo?.SizeInMiB ? Math.round(item.MemoryInfo.SizeInMiB / 1024) : "—" },
                { header: "Storage", cell: (item: EC2InstanceTypeInfo) => item.StorageInfo?.EbsInfo?.EbsOptimizedSupport || "EBS only" },
                { header: "Network", cell: (item: EC2InstanceTypeInfo) => item.NetworkInfo?.MaximumNetworkInterfaces ? `Up to ${item.NetworkInfo.MaximumNetworkInterfaces} interfaces` : "—" },
                { header: "Free Tier", cell: (item: EC2InstanceTypeInfo) => item.FreeTierEligible ? "✓ Eligible" : "—" },
              ]}
              items={instanceTypes.slice(0, 50)}
              selectionType="single"
              selectedItems={instanceTypes.filter(t => t.InstanceType === wizardState.step2.instanceType)}
              onSelectionChange={({ detail }) => {
                const selected = detail.selectedItems[0];
                updateStep(1, {
                  instanceType: selected.InstanceType || "",
                  vcpus: selected.VCpuInfo?.DefaultVCpus || 0,
                  memory: selected.MemoryInfo?.SizeInMiB ? Math.round(selected.MemoryInfo.SizeInMiB / 1024) : 0,
                  currentGeneration: selected.CurrentGeneration,
                  freeTierEligible: selected.FreeTierEligible,
                });
              }}
              empty={<Box textAlign="center" padding="l">No instance types found</Box>}
            />
          </Container>
        </SpaceBetween>
      ),
    },
    {
      title: "Configure Instance Details",
      description: "Configure the network, IAM role, monitoring, and other instance settings",
      content: (
        <SpaceBetween size="l">
          <ColumnLayout columns={2} variant="default">
            <FormField label="Number of Instances">
              <Input value={String(wizardState.step3.numberOfInstances)} onChange={({ detail }) => updateStep(2, { numberOfInstances: parseInt(detail.value) || 1 })} placeholder="1" />
            </FormField>
            <FormField label="Purchasing Option">
              <Select
                selectedOption={{ value: wizardState.step3.purchasingOption, label: wizardState.step3.purchasingOption === "on-demand" ? "On-Demand" : wizardState.step3.purchasingOption === "spot" ? "Request Spot Instances" : "Capacity Reservation" }}
                options={[
                  { value: "on-demand", label: "On-Demand Instances" },
                  { value: "spot", label: "Request Spot Instances" },
                  { value: "capacity-reservation", label: "Capacity Reservation" },
                ]}
                onChange={({ detail }) => updateStep(2, { purchasingOption: detail.selectedOption.value as "on-demand" | "spot" | "capacity-reservation" })}
              />
            </FormField>
            <FormField label="Network">
              <Select
                selectedOption={{ value: wizardState.step3.networkInterface.subnetId, label: subnets.find(s => s.SubnetId === wizardState.step3.networkInterface.subnetId)?.SubnetId || "Select a subnet" }}
                options={subnets.map(s => ({ value: s.SubnetId || "", label: `${s.SubnetId} (${s.CidrBlock}) - ${s.AvailabilityZone} - ${s.VpcId}` }))}
                onChange={({ detail }) => updateStep(2, { networkInterface: { ...wizardState.step3.networkInterface, subnetId: detail.selectedOption.value } })}
              />
            </FormField>
            <FormField label="Auto-assign Public IP">
              <Select
                selectedOption={{ value: wizardState.step3.networkInterface.autoAssignPublicIp ? "true" : "false", label: wizardState.step3.networkInterface.autoAssignPublicIp ? "Enable" : "Disable" }}
                options={[
                  { value: "true", label: "Enable" },
                  { value: "false", label: "Disable" },
                  { value: "use-subnet", label: "Use Subnet Setting (Default)" },
                ]}
                onChange={({ detail }) => updateStep(2, { networkInterface: { ...wizardState.step3.networkInterface, autoAssignPublicIp: detail.selectedOption.value === "true" } })}
              />
            </FormField>
            <FormField label="IAM Instance Profile">
              <Input value={wizardState.step3.iamInstanceProfile} onChange={({ detail }) => updateStep(2, { iamInstanceProfile: detail.value })} placeholder="arn:aws:iam::123456789012:instance-profile/MyRole" />
            </FormField>
            <FormField label="Shutdown Behavior">
              <Select
                selectedOption={{ value: wizardState.step3.shutdownBehavior, label: wizardState.step3.shutdownBehavior === "stop" ? "Stop" : wizardState.step3.shutdownBehavior === "terminate" ? "Terminate" : "Hibernate" }}
                options={[
                  { value: "stop", label: "Stop" },
                  { value: "terminate", label: "Terminate" },
                  { value: "hibernate", label: "Hibernate" },
                ]}
                onChange={({ detail }) => updateStep(2, { shutdownBehavior: detail.selectedOption.value as "stop" | "terminate" | "hibernate" })}
              />
            </FormField>
            <Checkbox checked={wizardState.step3.monitoring} onChange={({ detail }) => updateStep(2, { monitoring: detail.checked })}>
              Enable Detailed CloudWatch Monitoring
            </Checkbox>
            <Checkbox checked={wizardState.step3.ebsOptimized} onChange={({ detail }) => updateStep(2, { ebsOptimized: detail.checked })}>
              EBS Optimized
            </Checkbox>
            <FormField label="User Data">
              <Input value={wizardState.step3.userData} onChange={({ detail }) => updateStep(2, { userData: detail.value })} placeholder="#!/bin/bash&#10;yum update -y" />
            </FormField>
          </ColumnLayout>
        </SpaceBetween>
      ),
    },
    {
      title: "Add Storage",
      description: "Configure the storage volumes for your instance",
      content: (
        <SpaceBetween size="l">
          <Container>
            <Table
              columnDefinitions={[
                { header: "Device", cell: (item: any) => item.deviceName },
                { header: "Snapshot", cell: (item: any) => item.snapshotId || "—" },
                { header: "Size (GiB)", cell: (item: any) => <Input value={String(item.volumeSize)} onChange={({ detail }) => { const vols = [...wizardState.step4.volumes]; vols[wizardState.step4.volumes.indexOf(item)] = { ...item, volumeSize: parseInt(detail.value) || 1 }; updateStep(3, { volumes: vols }); }} placeholder="1" /> },
                { header: "Volume Type", cell: (item: any) => <Select selectedOption={{ value: item.volumeType, label: VOLUME_TYPES.find(v => v.value === item.volumeType)?.label || item.volumeType }} options={VOLUME_TYPES.map(v => ({ value: v.value, label: v.label }))} onChange={({ detail }) => { const vols = [...wizardState.step4.volumes]; vols[wizardState.step4.volumes.indexOf(item)] = { ...item, volumeType: detail.selectedOption.value }; updateStep(3, { volumes: vols }); }} /> },
                { header: "IOPS", cell: (item: any) => <Input value={String(item.iops || 0)} onChange={({ detail }) => { const vols = [...wizardState.step4.volumes]; vols[wizardState.step4.volumes.indexOf(item)] = { ...item, iops: parseInt(detail.value) || 0 }; updateStep(3, { volumes: vols }); }} disabled={item.volumeType !== "io1" && item.volumeType !== "io2"} placeholder="Optional" /> },
                { header: "Throughput (MiB/s)", cell: (item: any) => <Input value={String(item.throughput || 0)} onChange={({ detail }) => { const vols = [...wizardState.step4.volumes]; vols[wizardState.step4.volumes.indexOf(item)] = { ...item, throughput: parseInt(detail.value) || 0 }; updateStep(3, { volumes: vols }); }} disabled={item.volumeType !== "gp3"} placeholder="Optional" /> },
                { header: "Encrypted", cell: (item: any) => <Checkbox checked={item.encrypted} onChange={({ detail }) => { const vols = [...wizardState.step4.volumes]; vols[wizardState.step4.volumes.indexOf(item)] = { ...item, encrypted: detail.checked }; updateStep(3, { volumes: vols }); }} /> },
                { header: "Delete on Termination", cell: (item: any) => <Checkbox checked={item.deleteOnTermination} onChange={({ detail }) => { const vols = [...wizardState.step4.volumes]; vols[wizardState.step4.volumes.indexOf(item)] = { ...item, deleteOnTermination: detail.checked }; updateStep(3, { volumes: vols }); }} /> },
              ]}
              items={wizardState.step4.volumes}
              empty={<Box textAlign="center" padding="l">No volumes configured</Box>}
            />
          </Container>
          <SpaceBetween size="xs">
            <Button variant="link" onClick={() => updateStep(3, { volumes: [...wizardState.step4.volumes, { deviceName: `/dev/xvd${String.fromCharCode(98 + wizardState.step4.volumes.length)}`, snapshotId: "", volumeSize: 10, volumeType: "gp3", iops: 3000, throughput: 125, encrypted: false, kmsKeyId: "", deleteOnTermination: true }] })} formAction="none">Add Volume</Button>
          </SpaceBetween>
        </SpaceBetween>
      ),
    },
    {
      title: "Add Tags",
      description: "Add tags to your instance and volumes",
      content: (
        <SpaceBetween size="l">
          <Container>
            <Table
              columnDefinitions={[
                { header: "Key", cell: (item: any) => <Input value={item.Key} onChange={({ detail }) => { const tags = [...wizardState.step5.tags]; tags[wizardState.step5.tags.indexOf(item)] = { ...item, Key: detail.value }; updateStep(4, { tags }); }} /> },
                { header: "Value", cell: (item: any) => <Input value={item.Value} onChange={({ detail }) => { const tags = [...wizardState.step5.tags]; tags[wizardState.step5.tags.indexOf(item)] = { ...item, Value: detail.value }; updateStep(4, { tags }); }} /> },
              ]}
              items={wizardState.step5.tags}
              empty={<Box textAlign="center" padding="l">No tags configured</Box>}
            />
          </Container>
          <SpaceBetween size="xs">
            <Button variant="link" onClick={() => updateStep(4, { tags: [...wizardState.step5.tags, { Key: "", Value: "" }] })} formAction="none">Add Tag</Button>
          </SpaceBetween>
        </SpaceBetween>
      ),
    },
    {
      title: "Configure Security Group",
      description: "Select or create a security group to control traffic to your instance",
      content: (
        <SpaceBetween size="l">
          <ColumnLayout columns={2} variant="default">
            <FormField label="VPC">
              <Select
                selectedOption={{ value: wizardState.step6.vpcId, label: vpcs.find(v => v.VpcId === wizardState.step6.vpcId)?.VpcId || "Select a VPC" }}
                options={vpcs.map(v => ({ value: v.VpcId || "", label: `${v.VpcId} (${v.CidrBlock})${v.IsDefault ? " (default)" : ""}` }))}
                onChange={({ detail }) => updateStep(5, { vpcId: detail.selectedOption.value })}
              />
            </FormField>
            <FormField label="Security Group">
              <Select
                selectedOption={{ value: wizardState.step6.securityGroupId, label: securityGroups.find(sg => sg.GroupId === wizardState.step6.securityGroupId)?.GroupName || "Create new security group" }}
                options={[
                  { value: "new", label: "Create new security group" },
                  ...securityGroups.filter(sg => sg.VpcId === wizardState.step6.vpcId).map(sg => ({ value: sg.GroupId || "", label: `${sg.GroupName} (${sg.GroupId})` }))
                ]}
                onChange={({ detail }) => updateStep(5, { securityGroupId: detail.selectedOption.value })}
              />
            </FormField>
            <FormField label="Security Group Name">
              <Input value={wizardState.step6.securityGroupName} onChange={({ detail }) => updateStep(5, { securityGroupName: detail.value })} placeholder="launch-wizard" />
            </FormField>
            <FormField label="Description">
              <Input value={wizardState.step6.description} onChange={({ detail }) => updateStep(5, { description: detail.value })} placeholder="Security group created by launch wizard" />
            </FormField>
          </ColumnLayout>
          <Container header={<Header variant="h3">Inbound Rules</Header>}>
            <Table
              columnDefinitions={[
                { header: "Type", cell: (item: any) => item.type === "inbound" ? "Inbound" : "Outbound" },
                { header: "Protocol", cell: (item: any) => item.protocol },
                { header: "Port Range", cell: (item: any) => item.fromPort === item.toPort ? String(item.fromPort) : `${item.fromPort}-${item.toPort}` },
                { header: "Source", cell: (item: any) => item.cidrIp },
                { header: "Description", cell: (item: any) => item.description || "—" },
              ]}
              items={wizardState.step6.rules.filter(r => r.type === "inbound")}
              empty={<Box>No inbound rules</Box>}
            />
          </Container>
          <Container header={<Header variant="h3">Outbound Rules</Header>}>
            <Table
              columnDefinitions={[
                { header: "Type", cell: (item: any) => item.type === "inbound" ? "Inbound" : "Outbound" },
                { header: "Protocol", cell: (item: any) => item.protocol },
                { header: "Port Range", cell: (item: any) => item.fromPort === item.toPort ? String(item.fromPort) : `${item.fromPort}-${item.toPort}` },
                { header: "Destination", cell: (item: any) => item.cidrIp },
                { header: "Description", cell: (item: any) => item.description || "—" },
              ]}
              items={wizardState.step6.rules.filter(r => r.type === "outbound")}
              empty={<Box>No outbound rules</Box>}
            />
          </Container>
        </SpaceBetween>
      ),
    },
    {
      title: "Review Instance Launch",
      description: "Review your instance configuration before launching",
      content: (
        <SpaceBetween size="l">
          <Container header={<Header variant="h3">Review Summary</Header>}>
            <ColumnLayout columns={2} variant="default">
              <div><Box variant="small" color="text-label">AMI</Box><Box>{amis.find(a => a.ImageId === wizardState.step1.selectedImageId)?.Name || wizardState.step1.selectedImageId}</Box></div>
              <div><Box variant="small" color="text-label">Instance Type</Box><Box>{wizardState.step2.instanceType} ({wizardState.step2.vcpus} vCPUs, {wizardState.step2.memory} GiB)</Box></div>
              <div><Box variant="small" color="text-label">Key Pair</Box><Box>{wizardState.step6.securityGroupId !== "new" ? "Configured in Security Group" : "Not specified"}</Box></div>
              <div><Box variant="small" color="text-label">Subnet</Box><Box>{subnets.find(s => s.SubnetId === wizardState.step3.networkInterface.subnetId)?.SubnetId || "Not selected"}</Box></div>
              <div><Box variant="small" color="text-label">Security Groups</Box><Box>{wizardState.step6.securityGroupId === "new" ? wizardState.step6.securityGroupName : securityGroups.find(sg => sg.GroupId === wizardState.step6.securityGroupId)?.GroupName}</Box></div>
              <div><Box variant="small" color="text-label">Volumes</Box><Box>{wizardState.step4.volumes.length} volume(s)</Box></div>
              <div><Box variant="small" color="text-label">Tags</Box><Box>{wizardState.step5.tags.filter(t => t.Key).length} tag(s)</Box></div>
              <div><Box variant="small" color="text-label">Monitoring</Box><Box>{wizardState.step3.monitoring ? "Detailed" : "Basic"}</Box></div>
            </ColumnLayout>
          </Container>
          <Alert type="info">You are launching {wizardState.step3.numberOfInstances} instance(s) with {wizardState.step2.instanceType}. Estimated cost will be calculated based on your region and instance type.</Alert>
        </SpaceBetween>
      ),
    },
  ];

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <Button onClick={() => router.push("/ec2")} formAction="none">
              Back to Instances
            </Button>
          }
        >
          Launch Instance
        </Header>

        {error && <Alert type="error" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

        <Container>
          {creating ? (
            <SpaceBetween size="l">
              <Box textAlign="center" padding="xxl">
                <span role="status" aria-live="polite" className="awsui-spinner awsui-spinner--large" style={{ display: "inline-block" }} />
                <Box variant="h3" padding={{ top: "m" }}>
                  Launching instances...
                </Box>
                <Box variant="p" color="text-body-secondary">
                  This may take a moment.
                </Box>
              </Box>
            </SpaceBetween>
          ) : (
            <Wizard
              steps={steps}
              activeStepIndex={activeStepIndex}
              onNavigate={({ detail }) => {
                if (detail.requestedStepIndex > activeStepIndex) {
                  if (!validateStep(activeStepIndex)) return;
                }
                setActiveStepIndex(detail.requestedStepIndex);
              }}
              onSubmit={handleLaunch}
              i18nStrings={{
                submitButton: "Launch Instances",
                cancelButton: "Cancel",
                nextButton: "Next",
                previousButton: "Previous",
                navigationAriaLabel: "Launch instance wizard navigation",
                stepNumberLabel: (stepIndex: number) => `Step ${stepIndex + 1}`,
              }}
            />
          )}
        </Container>
      </SpaceBetween>
      <CrossServiceLinks links={CROSS_SERVICE_LINKS["/ec2"] || []} />
    </div>
  );
}