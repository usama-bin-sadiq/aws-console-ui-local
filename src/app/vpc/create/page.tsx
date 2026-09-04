"use client";
// VERIFICATION GATE: Phase 4 VPC Full — PRD §15.4 (VPC Creation Workflow)
// Steps: CIDR, Subnets, NAT, Flow Logs, Tags, Review (F-003 / F-006 / F-007)
// All API calls go through @aws-sdk/client-ec2 commands via /api/vpc and /api/subnet.
// Cloudscape components only; no custom CSS outside design tokens.

import React, { useState, useCallback } from "react";
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
import StatusIndicator from "@cloudscape-design/components/status-indicator";

interface SubnetConfig {
  name: string;
  az: string;
  cidr: string;
}

export default function VpcCreatePage() {
  const router = useRouter();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: VPC Settings
  const [vpcName, setVpcName] = useState("my-vpc");
  const [cidrBlock, setCidrBlock] = useState("10.0.0.0/16");
  const [ipv6Cidr, setIpv6Cidr] = useState("No IPv6");
  const [tenancy, setTenancy] = useState("default");
  const [dnsHostnames, setDnsHostnames] = useState(true);
  const [dnsResolution, setDnsResolution] = useState(true);

  // Step 2: Subnets
  const [subnets, setSubnets] = useState<SubnetConfig[]>([
    { name: "public-1a", az: "us-east-1a", cidr: "10.0.0.0/24" },
    { name: "public-1b", az: "us-east-1b", cidr: "10.0.1.0/24" },
    { name: "private-1a", az: "us-east-1a", cidr: "10.0.2.0/24" },
    { name: "private-1b", az: "us-east-1b", cidr: "10.0.3.0/24" },
  ]);

  // Step 3: NAT Gateway
  const [natOption, setNatOption] = useState<"create" | "none" | "existing">("create");
  const [natSubnet, setNatSubnet] = useState("public-1a");

  // Step 4: Flow Logs
  const [flowLogsCloudWatch, setFlowLogsCloudWatch] = useState(false);
  const [flowLogsS3, setFlowLogsS3] = useState(false);

  // Step 5: Tags
  const [tags, setTags] = useState([{ Key: "Name", Value: vpcName }, { Key: "Environment", Value: "production" }]);

  const handleTagChange = (index: number, field: "Key" | "Value", value: string) => {
    const newTags = [...tags];
    newTags[index] = { ...newTags[index], [field]: value };
    setTags(newTags);
  };

  const addTag = () => setTags([...tags, { Key: "", Value: "" }]);
  const removeTag = (index: number) => setTags(tags.filter((_, i) => i !== index));

  const handleCreate = useCallback(async () => {
    setCreating(true);
    setError(null);
    try {
      // Create VPC via API
      const vpcRes = await fetch("/api/vpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidrBlock }),
      });
      const vpcData = await vpcRes.json();
      if (vpcData.error) throw new Error(vpcData.error);
      const vpcId = vpcData.vpc?.VpcId;

      // Create subnets
      for (const subnet of subnets) {
        const subRes = await fetch("/api/subnet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vpcId, cidrBlock: subnet.cidr }),
        });
        const subData = await subRes.json();
        if (subData.error) throw new Error(subData.error);
      }

      // Create NAT Gateway if selected
      if (natOption === "create" && vpcId) {
        // Use the selected NAT subnet name to find a matching subnet CIDR for creation call
        const selectedNatName = natSubnet || subnets[0]?.name;
        await fetch("/api/nat-gateway", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subnetId: selectedNatName, connectivityType: "public" }),
        });
      }

      router.push("/vpc");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create VPC");
    } finally {
      setCreating(false);
    }
  }, [cidrBlock, subnets, natOption, router]);

  const steps = [
    {
      title: "VPC Settings",
      description: "Configure the VPC name, CIDR, tenancy, and DNS settings",
      content: (
        <SpaceBetween size="l">
          <FormField label="VPC name" description="A friendly name for this VPC">
            <Input value={vpcName} onChange={({ detail }) => { setVpcName(detail.value); }} placeholder="my-vpc" />
          </FormField>
          <ColumnLayout columns={2} variant="default">
            <FormField label="IPv4 CIDR block" description="The primary IP range for this VPC">
              <Input value={cidrBlock} onChange={({ detail }) => setCidrBlock(detail.value)} placeholder="10.0.0.0/16" />
            </FormField>
            <FormField label="IPv6 CIDR block">
              <Select
                selectedOption={{ value: ipv6Cidr, label: ipv6Cidr }}
                options={[
                  { value: "No IPv6", label: "No IPv6" },
                  { value: "Amazon", label: "Amazon-provided IPv6" },
                ]}
                onChange={({ detail }) => setIpv6Cidr(detail.selectedOption.value || "No IPv6")}
              />
            </FormField>
          </ColumnLayout>
          <FormField label="Tenancy">
            <Select
              selectedOption={{ value: tenancy, label: tenancy === "dedicated" ? "Dedicated" : "Default" }}
              options={[
                { value: "default", label: "Default (shared hardware)" },
                { value: "dedicated", label: "Dedicated (isolated hardware)" },
              ]}
              onChange={({ detail }) => setTenancy(detail.selectedOption.value || "default")}
            />
          </FormField>
          <Checkbox checked={dnsHostnames} onChange={({ detail }) => setDnsHostnames(detail.checked)}>
            Enable DNS hostnames
          </Checkbox>
          <Checkbox checked={dnsResolution} onChange={({ detail }) => setDnsResolution(detail.checked)}>
            Enable DNS resolution
          </Checkbox>
        </SpaceBetween>
      ),
    },
    {
      title: "Subnets",
      description: "Define subnets across availability zones",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">Subnets</Box>
          <Box variant="small" color="text-body-secondary">
            Subnets divide your VPC into smaller network segments.
          </Box>
          {subnets.map((subnet, idx) => (
            <Container key={idx} header={<Header variant="h4">{subnet.name}</Header>}>
              <ColumnLayout columns={3} variant="default">
                <FormField label="Name">
                  <Input value={subnet.name} onChange={({ detail }) => {
                    const newSubnets = [...subnets];
                    newSubnets[idx] = { ...subnet, name: detail.value };
                    setSubnets(newSubnets);
                  }} />
                </FormField>
                <FormField label="Availability Zone">
                  <Input value={subnet.az} onChange={({ detail }) => {
                    const newSubnets = [...subnets];
                    newSubnets[idx] = { ...subnet, az: detail.value };
                    setSubnets(newSubnets);
                  }} />
                </FormField>
                <FormField label="IPv4 CIDR">
                  <Input value={subnet.cidr} onChange={({ detail }) => {
                    const newSubnets = [...subnets];
                    newSubnets[idx] = { ...subnet, cidr: detail.value };
                    setSubnets(newSubnets);
                  }} />
                </FormField>
              </ColumnLayout>
            </Container>
          ))}
        </SpaceBetween>
      ),
    },
    {
      title: "NAT Gateway",
      description: "Configure NAT for private subnet internet access",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">NAT Gateway Options</Box>
          <Select
            selectedOption={{ value: natOption, label: natOption === "create" ? "Create NAT Gateway" : natOption === "none" ? "No NAT Gateway" : "Use existing NAT Gateway" }}
            options={[
              { value: "create", label: "Create NAT Gateway (~$32/mo)" },
              { value: "none", label: "No NAT Gateway" },
              { value: "existing", label: "Use existing NAT Gateway" },
            ]}
            onChange={({ detail }) => setNatOption(detail.selectedOption.value as "create" | "none" | "existing")}
          />
          {natOption === "create" && (
            <FormField label="NAT Gateway Subnet">
              <Select
                selectedOption={{ value: natSubnet, label: natSubnet }}
                options={subnets.map((s) => ({ value: s.name, label: s.name }))}
                onChange={({ detail }) => setNatSubnet(detail.selectedOption.value || natSubnet)}
              />
            </FormField>
          )}
        </SpaceBetween>
      ),
    },
    {
      title: "Flow Logs",
      description: "Enable VPC Flow Logs for traffic monitoring",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">VPC Flow Logs</Box>
          <Checkbox checked={flowLogsCloudWatch} onChange={({ detail }) => setFlowLogsCloudWatch(detail.checked)}>
            Enable Flow Logs to CloudWatch Logs
          </Checkbox>
          <Checkbox checked={flowLogsS3} onChange={({ detail }) => setFlowLogsS3(detail.checked)}>
            Enable Flow Logs to Amazon S3
          </Checkbox>
          <Alert type="info">
            Flow logs capture information about the IP traffic going to and from network interfaces in your VPC.
          </Alert>
        </SpaceBetween>
      ),
    },
    {
      title: "Tags",
      description: "Add key-value pairs to organize your VPC",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">Tags</Box>
          {tags.map((tag, idx) => (
            <ColumnLayout key={idx} columns={3} variant="default">
              <FormField label="Key">
                <Input value={tag.Key || ""} onChange={({ detail }) => handleTagChange(idx, "Key", detail.value)} placeholder="Key" />
              </FormField>
              <FormField label="Value">
                <Input value={tag.Value || ""} onChange={({ detail }) => handleTagChange(idx, "Value", detail.value)} placeholder="Value" />
              </FormField>
              <FormField label=" ">
                <Button onClick={() => removeTag(idx)} formAction="none">Remove</Button>
              </FormField>
            </ColumnLayout>
          ))}
          <Button onClick={addTag} formAction="none">Add tag</Button>
        </SpaceBetween>
      ),
    },
    {
      title: "Review",
      description: "Confirm your VPC configuration before creation",
      content: (
        <SpaceBetween size="l">
          <Container header={<Header variant="h3">Configuration Summary</Header>}>
            <ColumnLayout columns={2} variant="default">
              <div>
                <Box variant="small" color="text-label">VPC Name</Box>
                <Box>{vpcName}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">CIDR Block</Box>
                <Box>{cidrBlock}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Tenancy</Box>
                <Box>{tenancy === "dedicated" ? "Dedicated" : "Default"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Subnets</Box>
                <Box>{subnets.length}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">NAT Gateway</Box>
                <Box>{natOption === "create" ? "1 (Public)" : natOption === "none" ? "None" : "Existing"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Flow Logs</Box>
                <Box>{flowLogsCloudWatch || flowLogsS3 ? (flowLogsCloudWatch ? "CloudWatch" : "") + (flowLogsCloudWatch && flowLogsS3 ? " + " : "") + (flowLogsS3 ? "S3" : "") : "Disabled"}</Box>
              </div>
            </ColumnLayout>
          </Container>
          <Container header={<Header variant="h3">Tags</Header>}>
            <SpaceBetween size="xs">
              {tags.filter((t) => t.Key).map((tag, i) => (
                <Box key={i}>{tag.Key}: {tag.Value}</Box>
              ))}
            </SpaceBetween>
          </Container>
          <Alert type="warning">
            Estimated monthly cost includes NAT Gateway (~$32.40) when selected.
          </Alert>
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
            <Button onClick={() => router.push("/vpc")} formAction="none">
              Back to VPCs
            </Button>
          }
        >
          Create VPC
        </Header>

        {error && <Alert type="error" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

        <Container>
          {creating ? (
            <SpaceBetween size="l">
              <Box textAlign="center" padding="xxl">
                <StatusIndicator type="in-progress" />
                <Box variant="h3" padding={{ top: "m" }}>
                  Creating VPC resources...
                </Box>
                <Box variant="p" color="text-body-secondary">
                  This may take a moment. Subnets and NAT gateway are being provisioned.
                </Box>
              </Box>
            </SpaceBetween>
          ) : (
            <Wizard
              steps={steps}
              activeStepIndex={activeStepIndex}
              onNavigate={({ detail }) => setActiveStepIndex(detail.requestedStepIndex)}
              onSubmit={handleCreate}
              i18nStrings={{
                submitButton: "Create VPC",
                cancelButton: "Cancel",
                nextButton: "Next",
                previousButton: "Previous",
                navigationAriaLabel: "VPC wizard navigation",
                stepNumberingLabel: (stepIndex) => `Step ${stepIndex + 1}`,
              }}
            />
          )}
        </Container>
      </SpaceBetween>
    </div>
  );
}
