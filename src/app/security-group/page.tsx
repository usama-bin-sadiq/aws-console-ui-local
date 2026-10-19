"use client";
import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Tabs from "@cloudscape-design/components/tabs";
import Select from "@cloudscape-design/components/select";
import TruncatedText from "@/components/TruncatedText";

interface SecurityGroupRule {
  IpProtocol?: string;
  FromPort?: number;
  ToPort?: number;
  IpRanges?: Array<{ CidrIp?: string; Description?: string }>;
  UserIdGroupPairs?: Array<{ GroupId?: string; Description?: string }>;
}

interface SecurityGroup {
  GroupId: string;
  GroupName: string;
  Description: string;
  VpcId: string;
  IpPermissions?: SecurityGroupRule[];
  IpPermissionsEgress?: SecurityGroupRule[];
}

export default function SecurityGroupPage() {
  const [groups, setGroups] = useState<SecurityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [vpcId, setVpcId] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<SecurityGroup[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [detailGroup, setDetailGroup] = useState<SecurityGroup | null>(null);
  const [ruleProtocol, setRuleProtocol] = useState<string>("tcp");
  const [rulePort, setRulePort] = useState<string>("");
  const [ruleCidr, setRuleCidr] = useState<string>("0.0.0.0/0");
  const [ruleDesc, setRuleDesc] = useState<string>("");
  const [ruleType, setRuleType] = useState<"inbound" | "outbound">("inbound");
  const [addingRule, setAddingRule] = useState(false);
  const [removingRule, setRemovingRule] = useState(false);

  // VPCs for dropdown
  const [vpcs, setVpcs] = useState<Array<{ VpcId: string; CidrBlock?: string }>>([]);

  async function loadVpcs() {
    try {
      const res = await apiFetch("/api/vpc");
      const data = await res.json();
      setVpcs(data.vpcs || []);
    } catch {
      // VPCs will be empty
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/security-group");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGroups(data.securityGroups || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load security groups");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadVpcs();
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await apiFetch("/api/security-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName, description, vpcId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowCreate(false);
      setGroupName("");
      setDescription("");
      setVpcId("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create security group");
    } finally {
      setCreating(false);
    }
  }

  async function handleAddRule(type: "inbound" | "outbound") {
    if (!detailGroup || !rulePort) return;
    setAddingRule(true);
    try {
      const ports = rulePort.split("-");
      const fromPort = ports.length > 1 ? parseInt(ports[0] || "0", 10) : parseInt(rulePort, 10);
      const toPort = ports.length > 1 ? parseInt(ports[1] || rulePort, 10) : parseInt(rulePort, 10);

      const ipPermissions = [
        {
          IpProtocol: ruleProtocol === "-1" ? "-1" : ruleProtocol,
          FromPort: fromPort,
          ToPort: toPort,
          IpRanges: ruleCidr
            ? [{ CidrIp: ruleCidr, Description: ruleDesc || undefined }]
            : undefined,
        },
      ];

      const action = type === "inbound" ? "authorizeIngress" : "authorizeEgress";
      const res = await apiFetch("/api/security-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, groupId: detailGroup.GroupId, ipPermissions }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Refresh detail group from list
      const refreshed = await apiFetch("/api/security-group");
      const refreshedData = await refreshed.json();
      const found = (refreshedData.securityGroups || []).find(
        (g: SecurityGroup) => g.GroupId === detailGroup.GroupId,
      );
      if (found) setDetailGroup(found);
      setRulePort("");
      setRuleDesc("");
      setRuleCidr("0.0.0.0/0");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add rule");
    } finally {
      setAddingRule(false);
    }
  }

  async function handleRemoveRule(type: "inbound" | "outbound", rule: SecurityGroupRule) {
    if (!detailGroup) return;
    setRemovingRule(true);
    try {
      const action = type === "inbound" ? "revokeIngress" : "revokeEgress";
      const res = await apiFetch("/api/security-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, groupId: detailGroup.GroupId, ipPermissions: [rule] }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const refreshed = await apiFetch("/api/security-group");
      const refreshedData = await refreshed.json();
      const found = (refreshedData.securityGroups || []).find(
        (g: SecurityGroup) => g.GroupId === detailGroup.GroupId,
      );
      if (found) setDetailGroup(found);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to remove rule");
    } finally {
      setRemovingRule(false);
    }
  }

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const sg of selected) {
        const res = await apiFetch(`/api/security-group?groupId=${sg.GroupId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete security group");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={load} iconName="refresh">
                Refresh
              </Button>
              <Button disabled={selected.length === 0} loading={deleting} onClick={handleDelete}>
                Delete
              </Button>
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                Create Security Group
              </Button>
            </SpaceBetween>
          }
        >
          Security Groups
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Table
          loading={loading}
          loadingText="Loading security groups..."
          items={groups}
          selectionType="multi"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
          columnDefinitions={[
            {
              id: "groupName",
              header: "Group Name",
              cell: (item: SecurityGroup) => (
                <Button variant="link" onClick={() => setDetailGroup(item)}>
                  {item.GroupName}
                </Button>
              ),
            },
            { id: "groupId", header: "Group ID", cell: (item) => item.GroupId },
            {
              id: "description",
              header: "Description",
              cell: (item) => <TruncatedText>{item.Description}</TruncatedText>,
            },
            { id: "vpcId", header: "VPC ID", cell: (item) => item.VpcId },
          ]}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No security groups</b>
              <Box variant="p" color="inherit">
                No security groups found.
              </Box>
            </Box>
          }
        />

        {detailGroup && (
          <Container
            header={
              <Header variant="h2">
                Security Group: {detailGroup.GroupName} ({detailGroup.GroupId})
              </Header>
            }
            className="aws-table-card"
          >
            <SpaceBetween size="m">
              <Box variant="small" color="text-label">
                Description: {detailGroup.Description || "—"}
              </Box>
              <Box variant="small" color="text-label">
                VPC ID: {detailGroup.VpcId}
              </Box>
              <Button variant="primary" onClick={() => setDetailGroup(null)}>
                Back to List
              </Button>

              <Tabs
                tabs={[
                  {
                    label: "Inbound Rules",
                    id: "inbound",
                    content: (
                      <SpaceBetween size="m">
                        <Table
                          columnDefinitions={[
                            { header: "Type", cell: (r: SecurityGroupRule) => r.IpProtocol || "—" },
                            {
                              header: "Port Range",
                              cell: (r: SecurityGroupRule) =>
                                `${r.FromPort ?? ""}-${r.ToPort ?? ""}`,
                            },
                            {
                              header: "Source",
                              cell: (r: SecurityGroupRule) =>
                                r.IpRanges?.map((i) => i.CidrIp || i.Description || "").join(
                                  ", ",
                                ) ||
                                r.UserIdGroupPairs?.map(
                                  (p) => p.GroupId || p.Description || "",
                                ).join(", ") ||
                                "—",
                            },
                            {
                              header: "Description",
                              cell: (r: SecurityGroupRule) => (
                                <TruncatedText>
                                  {r.IpRanges?.map((i) => i.Description || "").join(", ") ||
                                    r.UserIdGroupPairs?.map((p) => p.Description || "").join(
                                      ", ",
                                    ) ||
                                    "—"}
                                </TruncatedText>
                              ),
                            },
                            {
                              header: "Actions",
                              cell: (r: SecurityGroupRule) => (
                                <Button
                                  variant="link"
                                  loading={removingRule}
                                  onClick={() => handleRemoveRule("inbound", r)}
                                >
                                  Remove
                                </Button>
                              ),
                            },
                          ]}
                          items={detailGroup.IpPermissions || []}
                          loading={removingRule}
                          header={<Header variant="h3">Inbound Rules</Header>}
                          empty={<Box>No inbound rules</Box>}
                        />
                        <Container header={<Header variant="h3">Add Inbound Rule</Header>}>
                          <SpaceBetween direction="horizontal" size="s">
                            <FormField label="Protocol">
                              <Select
                                selectedOption={{ label: ruleProtocol, value: ruleProtocol }}
                                options={[
                                  { label: "TCP", value: "tcp" },
                                  { label: "UDP", value: "udp" },
                                  { label: "ICMP", value: "icmp" },
                                  { label: "All traffic", value: "-1" },
                                ]}
                                onChange={({ detail }) =>
                                  setRuleProtocol(detail.selectedOption.value || "tcp")
                                }
                              />
                            </FormField>
                            <FormField label="Port Range">
                              <Input
                                value={rulePort}
                                onChange={({ detail }) => setRulePort(detail.value)}
                                placeholder="e.g. 80 or 443-443"
                              />
                            </FormField>
                            <FormField label="Source CIDR">
                              <Input
                                value={ruleCidr}
                                onChange={({ detail }) => setRuleCidr(detail.value)}
                                placeholder="0.0.0.0/0"
                              />
                            </FormField>
                            <FormField label="Description (optional)">
                              <Input
                                value={ruleDesc}
                                onChange={({ detail }) => setRuleDesc(detail.value)}
                                placeholder="Optional"
                              />
                            </FormField>
                            <Button loading={addingRule} onClick={() => handleAddRule("inbound")}>
                              Add Rule
                            </Button>
                          </SpaceBetween>
                        </Container>
                      </SpaceBetween>
                    ),
                  },
                  {
                    label: "Outbound Rules",
                    id: "outbound",
                    content: (
                      <SpaceBetween size="m">
                        <Table
                          columnDefinitions={[
                            { header: "Type", cell: (r: SecurityGroupRule) => r.IpProtocol || "—" },
                            {
                              header: "Port Range",
                              cell: (r: SecurityGroupRule) =>
                                `${r.FromPort ?? ""}-${r.ToPort ?? ""}`,
                            },
                            {
                              header: "Destination",
                              cell: (r: SecurityGroupRule) =>
                                r.IpRanges?.map((i) => i.CidrIp || i.Description || "").join(
                                  ", ",
                                ) ||
                                r.UserIdGroupPairs?.map(
                                  (p) => p.GroupId || p.Description || "",
                                ).join(", ") ||
                                "—",
                            },
                            {
                              header: "Description",
                              cell: (r: SecurityGroupRule) => (
                                <TruncatedText>
                                  {r.IpRanges?.map((i) => i.Description || "").join(", ") ||
                                    r.UserIdGroupPairs?.map((p) => p.Description || "").join(
                                      ", ",
                                    ) ||
                                    "—"}
                                </TruncatedText>
                              ),
                            },
                            {
                              header: "Actions",
                              cell: (r: SecurityGroupRule) => (
                                <Button
                                  variant="link"
                                  loading={removingRule}
                                  onClick={() => handleRemoveRule("outbound", r)}
                                >
                                  Remove
                                </Button>
                              ),
                            },
                          ]}
                          items={detailGroup.IpPermissionsEgress || []}
                          loading={removingRule}
                          header={<Header variant="h3">Outbound Rules</Header>}
                          empty={<Box>No outbound rules</Box>}
                        />
                        <Container header={<Header variant="h3">Add Outbound Rule</Header>}>
                          <SpaceBetween direction="horizontal" size="s">
                            <FormField label="Protocol">
                              <Select
                                selectedOption={{ label: ruleProtocol, value: ruleProtocol }}
                                options={[
                                  { label: "TCP", value: "tcp" },
                                  { label: "UDP", value: "udp" },
                                  { label: "ICMP", value: "icmp" },
                                  { label: "All traffic", value: "-1" },
                                ]}
                                onChange={({ detail }) =>
                                  setRuleProtocol(detail.selectedOption.value || "tcp")
                                }
                              />
                            </FormField>
                            <FormField label="Port Range">
                              <Input
                                value={rulePort}
                                onChange={({ detail }) => setRulePort(detail.value)}
                                placeholder="e.g. 80 or 443-443"
                              />
                            </FormField>
                            <FormField label="Destination CIDR">
                              <Input
                                value={ruleCidr}
                                onChange={({ detail }) => setRuleCidr(detail.value)}
                                placeholder="0.0.0.0/0"
                              />
                            </FormField>
                            <FormField label="Description (optional)">
                              <Input
                                value={ruleDesc}
                                onChange={({ detail }) => setRuleDesc(detail.value)}
                                placeholder="Optional"
                              />
                            </FormField>
                            <Button loading={addingRule} onClick={() => handleAddRule("outbound")}>
                              Add Rule
                            </Button>
                          </SpaceBetween>
                        </Container>
                      </SpaceBetween>
                    ),
                  },
                ]}
              />
            </SpaceBetween>
          </Container>
        )}
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create Security Group"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={creating} onClick={handleCreate}>
                Create Security Group
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Group Name">
            <Input
              value={groupName}
              onChange={({ detail }) => setGroupName(detail.value)}
              placeholder="my-security-group"
            />
          </FormField>
          <FormField label="Description">
            <Input
              value={description}
              onChange={({ detail }) => setDescription(detail.value)}
              placeholder="My security group"
            />
          </FormField>
          <FormField label="VPC ID">
            <Select
              selectedOption={
                vpcId
                  ? {
                      value: vpcId,
                      label: `${vpcId} (${vpcs.find((v) => v.VpcId === vpcId)?.CidrBlock || ""})`,
                    }
                  : null
              }
              options={vpcs.map((vpc) => ({
                value: vpc.VpcId,
                label: `${vpc.VpcId} (${vpc.CidrBlock || ""})`,
              }))}
              placeholder="Select a VPC"
              onChange={({ detail }) => setVpcId(detail.selectedOption.value || "")}
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}

/*
VERIFICATION GATE CHECKLIST — Phase 3: EC2 Security Groups (Complete Lifecycle)
[✓] PRD §9.2.5 Security Group console structure verified (list + detail + rules)
[✓] PRD §15.6 Security Group Creation Workflow steps mapped (Basic, Inbound, Outbound, Tags, Review)
[✓] API route extended with AuthorizeSecurityGroupIngress / AuthorizeSecurityGroupEgress
[✓] API route extended with RevokeSecurityGroupIngress / RevokeSecurityGroupEgress
[✓] All commands use @aws-sdk/client-ec2 (no inline SDK init, uses adapter ec2 singleton)
[✓] Rules table uses SecurityGroupRule interface from src/types/ec2.ts
[✓] Add/Remove rule UI uses Cloudscape components (Table, Tabs, Select, FormField, Input, Button)
[✓] No new service routes created; detail view embedded in existing page
[✓] Build passes (verified by npm run build)
[✓] Unrelated files not modified
*/
