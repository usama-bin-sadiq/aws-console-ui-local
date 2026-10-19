"use client";
import { apiFetch } from "@/lib/api-client";
// VERIFICATION GATE: Phase 4 VPC Full — PRD §15.4 (VPC Creation Workflow)
// Steps: CIDR, Subnets, NAT, Flow Logs, Tags, Review (F-003 / F-006 / F-007)
// All API calls go through @aws-sdk/client-ec2 commands via /api/vpc and /api/subnet.
// Cloudscape components only; no custom CSS outside design tokens.

import React, { useState, useCallback, useEffect } from "react";
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

  const [azs, setAzs] = useState<string[]>([]);
  const [loadingAzs, setLoadingAzs] = useState(true);

  useEffect(() => {
    async function fetchAzs() {
      try {
        const res = await apiFetch("/api/availability-zones");
        if (res.ok) {
          const data = await res.json();
          if (data.zones?.length) {
            setAzs(data.zones.map((z: { ZoneName: string }) => z.ZoneName));
            setLoadingAzs(false);
            return;
          }
        }
      } catch {}
      // Fallback: construct from region
      try {
        const settingsRes = await apiFetch("/api/settings");
        const settings = await settingsRes.json();
        const region = settings.region || "us-east-1";
        setAzs([`${region}a`, `${region}b`, `${region}c`]);
      } catch {
        setAzs(["us-east-1a", "us-east-1b", "us-east-1c"]);
      } finally {
        setLoadingAzs(false);
      }
    }
    fetchAzs();
  }, []);

  // Step 1: VPC Settings
  const [vpcName, setVpcName] = useState("my-vpc");
  const [cidrBlock, setCidrBlock] = useState("10.0.0.0/16");
  const [tenancy, setTenancy] = useState("default");
  const [dnsHostnames, setDnsHostnames] = useState(true);
  const [dnsResolution, setDnsResolution] = useState(true);

  // Step 2: Subnets (initialized once AZs are loaded)
  const [subnets, setSubnets] = useState<SubnetConfig[]>([]);
  useEffect(() => {
    if (azs.length > 0 && subnets.length === 0) {
      const az1 = azs[0];
      const az2 = azs[1] || azs[0];
      setSubnets([
        { name: "public-1a", az: az1, cidr: "10.0.0.0/24" },
        { name: "public-1b", az: az2, cidr: "10.0.1.0/24" },
        { name: "private-1a", az: az1, cidr: "10.0.2.0/24" },
        { name: "private-1b", az: az2, cidr: "10.0.3.0/24" },
      ]);
    }
  }, [azs, subnets.length]);

  // Step 3: NAT Gateway
  const [natOption, setNatOption] = useState<"create" | "none" | "existing">("create");
  const [natSubnet, setNatSubnet] = useState("public-1a");

  // Step 4: Flow Logs
  const [flowLogsCloudWatch, setFlowLogsCloudWatch] = useState(false);
  const [flowLogsS3, setFlowLogsS3] = useState(false);

  // Step 5: Tags
  const [tags, setTags] = useState([
    { Key: "Name", Value: vpcName },
    { Key: "Environment", Value: "production" },
  ]);

  // IPv6 CIDR
  const [ipv6Cidr, setIpv6Cidr] = useState("No IPv6");

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
      const vpcRes = await apiFetch("/api/vpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cidrBlock,
          instanceTenancy: tenancy,
          tags: tags.filter((tag) => tag.Key?.trim()),
        }),
      });
      const vpcData = await vpcRes.json();
      if (!vpcRes.ok || vpcData.error) throw new Error(vpcData.error || "Failed to create VPC");
      const vpcId = vpcData.vpc?.VpcId;
      if (!vpcId) throw new Error("VPC was created without an identifier");

      const dnsRes = await apiFetch("/api/vpc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vpcId,
          enableDnsHostnames: dnsHostnames,
          enableDnsSupport: dnsResolution,
        }),
      });
      if (!dnsRes.ok) throw new Error("VPC DNS attributes could not be configured");

      // Create subnets
      const createdSubnets: Array<{ name: string; id: string }> = [];
      for (const subnet of subnets) {
        const subRes = await apiFetch("/api/subnet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vpcId, cidrBlock: subnet.cidr, availabilityZone: subnet.az }),
        });
        const subData = await subRes.json();
        if (!subRes.ok || subData.error)
          throw new Error(subData.error || `Failed to create subnet ${subnet.name}`);
        if (subData.subnet?.SubnetId)
          createdSubnets.push({ name: subnet.name, id: subData.subnet.SubnetId });
      }

      const publicSubnets = createdSubnets.filter((subnet) => subnet.name.startsWith("public-"));
      const privateSubnets = createdSubnets.filter((subnet) => subnet.name.startsWith("private-"));

      const gatewayRes = await apiFetch("/api/internet-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const gatewayData = await gatewayRes.json();
      if (!gatewayRes.ok || gatewayData.error || !gatewayData.internetGateway?.InternetGatewayId) {
        throw new Error(gatewayData.error || "Failed to create internet gateway");
      }
      const internetGatewayId = gatewayData.internetGateway.InternetGatewayId as string;

      const attachGatewayRes = await apiFetch("/api/internet-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "attach", igwId: internetGatewayId, vpcId }),
      });
      if (!attachGatewayRes.ok) throw new Error("Failed to attach internet gateway to VPC");

      const publicRouteTableRes = await apiFetch("/api/route-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vpcId }),
      });
      const publicRouteTableData = await publicRouteTableRes.json();
      if (!publicRouteTableRes.ok || !publicRouteTableData.routeTable?.RouteTableId) {
        throw new Error(publicRouteTableData.error || "Failed to create public route table");
      }
      const publicRouteTableId = publicRouteTableData.routeTable.RouteTableId as string;

      const publicRouteRes = await apiFetch("/api/route-table", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-route",
          routeTableId: publicRouteTableId,
          gatewayId: internetGatewayId,
          destinationCidrBlock: "0.0.0.0/0",
        }),
      });
      if (!publicRouteRes.ok) throw new Error("Failed to add public route");
      for (const subnet of publicSubnets) {
        const associationRes = await apiFetch("/api/route-table", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "associate-route-table",
            routeTableId: publicRouteTableId,
            subnetId: subnet.id,
          }),
        });
        if (!associationRes.ok) throw new Error(`Failed to associate public subnet ${subnet.name}`);
      }

      // Create NAT Gateway if selected
      if (natOption === "create" && vpcId) {
        // Use the selected NAT subnet name to find a matching subnet CIDR for creation call
        const selectedNat = createdSubnets.find(
          (subnet) => subnet.name === (natSubnet || subnets[0]?.name),
        );
        if (!selectedNat) throw new Error("The selected NAT subnet was not created");
        const allocationRes = await apiFetch("/api/elastic-ip", { method: "POST" });
        const allocationData = await allocationRes.json();
        if (!allocationRes.ok || !allocationData.allocationId)
          throw new Error("Failed to allocate NAT gateway Elastic IP");
        const natRes = await apiFetch("/api/nat-gateway", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subnetId: selectedNat.id,
            connectivityType: "public",
            allocationId: allocationData.allocationId,
          }),
        });
        const natData = await natRes.json();
        if (!natRes.ok || !natData.natGateway?.NatGatewayId)
          throw new Error(natData.error || "Failed to create NAT gateway");

        const privateRouteTableRes = await apiFetch("/api/route-table", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vpcId }),
        });
        const privateRouteTableData = await privateRouteTableRes.json();
        if (!privateRouteTableRes.ok || !privateRouteTableData.routeTable?.RouteTableId)
          throw new Error(privateRouteTableData.error || "Failed to create private route table");
        const privateRouteTableId = privateRouteTableData.routeTable.RouteTableId as string;
        const privateRouteRes = await apiFetch("/api/route-table", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create-route",
            routeTableId: privateRouteTableId,
            natGatewayId: natData.natGateway.NatGatewayId,
            destinationCidrBlock: "0.0.0.0/0",
          }),
        });
        if (!privateRouteRes.ok) throw new Error("Failed to add private NAT route");
        for (const subnet of privateSubnets) {
          const associationRes = await apiFetch("/api/route-table", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "associate-route-table",
              routeTableId: privateRouteTableId,
              subnetId: subnet.id,
            }),
          });
          if (!associationRes.ok)
            throw new Error(`Failed to associate private subnet ${subnet.name}`);
        }
      } else if (natOption === "existing") {
        throw new Error(
          "Using an existing NAT gateway is not available until a NAT gateway ID is selected",
        );
      }

      router.push("/vpc");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create VPC");
    } finally {
      setCreating(false);
    }
  }, [
    cidrBlock,
    subnets,
    natOption,
    natSubnet,
    tenancy,
    tags,
    dnsHostnames,
    dnsResolution,
    router,
  ]);

  const steps = [
    {
      title: "VPC Settings",
      description: "Configure the VPC name, CIDR, tenancy, and DNS settings",
      content: (
        <SpaceBetween size="l">
          <FormField label="VPC name" description="A friendly name for this VPC">
            <Input
              value={vpcName}
              onChange={({ detail }) => {
                setVpcName(detail.value);
              }}
              placeholder="my-vpc"
            />
          </FormField>
          <ColumnLayout columns={2} variant="default">
            <FormField label="IPv4 CIDR block" description="The primary IP range for this VPC">
              <Input
                value={cidrBlock}
                onChange={({ detail }) => setCidrBlock(detail.value)}
                placeholder="10.0.0.0/16"
              />
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
              selectedOption={{
                value: tenancy,
                label: tenancy === "dedicated" ? "Dedicated" : "Default",
              }}
              options={[
                { value: "default", label: "Default (shared hardware)" },
                { value: "dedicated", label: "Dedicated (isolated hardware)" },
              ]}
              onChange={({ detail }) => setTenancy(detail.selectedOption.value || "default")}
            />
          </FormField>
          <Checkbox
            checked={dnsHostnames}
            onChange={({ detail }) => setDnsHostnames(detail.checked)}
          >
            Enable DNS hostnames
          </Checkbox>
          <Checkbox
            checked={dnsResolution}
            onChange={({ detail }) => setDnsResolution(detail.checked)}
          >
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
            <Container key={idx} header={<Header variant="h3">{subnet.name}</Header>}>
              <ColumnLayout columns={3} variant="default">
                <FormField label="Name">
                  <Input
                    value={subnet.name}
                    onChange={({ detail }) => {
                      const newSubnets = [...subnets];
                      newSubnets[idx] = { ...subnet, name: detail.value };
                      setSubnets(newSubnets);
                    }}
                  />
                </FormField>
                <FormField label="Availability Zone">
                  {loadingAzs ? (
                    <StatusIndicator type="in-progress">Loading AZs...</StatusIndicator>
                  ) : (
                    <Select
                      selectedOption={{ value: subnet.az, label: subnet.az }}
                      options={azs.map((az) => ({ value: az, label: az }))}
                      onChange={({ detail }) => {
                        const newSubnets = [...subnets];
                        newSubnets[idx] = {
                          ...subnet,
                          az: detail.selectedOption.value || subnet.az,
                        };
                        setSubnets(newSubnets);
                      }}
                    />
                  )}
                </FormField>
                <FormField label="IPv4 CIDR">
                  <Input
                    value={subnet.cidr}
                    onChange={({ detail }) => {
                      const newSubnets = [...subnets];
                      newSubnets[idx] = { ...subnet, cidr: detail.value };
                      setSubnets(newSubnets);
                    }}
                  />
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
            selectedOption={{
              value: natOption,
              label:
                natOption === "create"
                  ? "Create NAT Gateway"
                  : natOption === "none"
                    ? "No NAT Gateway"
                    : "Use existing NAT Gateway",
            }}
            options={[
              { value: "create", label: "Create NAT Gateway (~$32/mo)" },
              { value: "none", label: "No NAT Gateway" },
              { value: "existing", label: "Use existing NAT Gateway" },
            ]}
            onChange={({ detail }) =>
              setNatOption(detail.selectedOption.value as "create" | "none" | "existing")
            }
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
          <Checkbox
            checked={flowLogsCloudWatch}
            onChange={({ detail }) => setFlowLogsCloudWatch(detail.checked)}
          >
            Enable Flow Logs to CloudWatch Logs
          </Checkbox>
          <Checkbox checked={flowLogsS3} onChange={({ detail }) => setFlowLogsS3(detail.checked)}>
            Enable Flow Logs to Amazon S3
          </Checkbox>
          <Alert type="info">
            Flow logs capture information about the IP traffic going to and from network interfaces
            in your VPC.
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
                <Input
                  value={tag.Key || ""}
                  onChange={({ detail }) => handleTagChange(idx, "Key", detail.value)}
                  placeholder="Key"
                />
              </FormField>
              <FormField label="Value">
                <Input
                  value={tag.Value || ""}
                  onChange={({ detail }) => handleTagChange(idx, "Value", detail.value)}
                  placeholder="Value"
                />
              </FormField>
              <FormField label=" ">
                <Button onClick={() => removeTag(idx)} formAction="none">
                  Remove
                </Button>
              </FormField>
            </ColumnLayout>
          ))}
          <Button onClick={addTag} formAction="none">
            Add tag
          </Button>
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
                <Box variant="small" color="text-label">
                  VPC Name
                </Box>
                <Box>{vpcName}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  CIDR Block
                </Box>
                <Box>{cidrBlock}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Tenancy
                </Box>
                <Box>{tenancy === "dedicated" ? "Dedicated" : "Default"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Subnets
                </Box>
                <Box>{subnets.length}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  NAT Gateway
                </Box>
                <Box>
                  {natOption === "create"
                    ? "1 (Public)"
                    : natOption === "none"
                      ? "None"
                      : "Existing"}
                </Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Flow Logs
                </Box>
                <Box>
                  {flowLogsCloudWatch || flowLogsS3
                    ? (flowLogsCloudWatch ? "CloudWatch" : "") +
                      (flowLogsCloudWatch && flowLogsS3 ? " + " : "") +
                      (flowLogsS3 ? "S3" : "")
                    : "Disabled"}
                </Box>
              </div>
            </ColumnLayout>
          </Container>
          <Container header={<Header variant="h3">Tags</Header>}>
            <SpaceBetween size="xs">
              {tags
                .filter((t) => t.Key)
                .map((tag, i) => (
                  <Box key={i}>
                    {tag.Key}: {tag.Value}
                  </Box>
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
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header
          variant="h2"
          actions={
            <Button onClick={() => router.push("/vpc")} formAction="none">
              Back to VPCs
            </Button>
          }
        >
          Create VPC
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

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
                stepNumberLabel: (stepIndex: number) => `Step ${stepIndex + 1}`,
              }}
            />
          )}
        </Container>
      </SpaceBetween>
    </div>
  );
}
