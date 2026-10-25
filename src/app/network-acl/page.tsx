"use client";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState, useCallback } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Tabs from "@cloudscape-design/components/tabs";
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface NetworkAclEntry {
  RuleNumber?: number;
  Protocol?: string;
  RuleAction?: string;
  Egress?: boolean;
  CidrBlock?: string;
  PortRange?: { From?: number; To?: number };
}

interface NetworkAclAssociation {
  AssociationId?: string;
  SubnetId?: string;
}

interface NetworkAcl {
  NetworkAclId: string;
  VpcId: string;
  IsDefault: boolean;
  Entries?: NetworkAclEntry[];
  Associations?: NetworkAclAssociation[];
}

export default function NetworkAclPage() {
  const [acls, setAcls] = useState<NetworkAcl[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [vpcId, setVpcId] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<NetworkAcl[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Detail/Rule management
  const [detailAcl, setDetailAcl] = useState<NetworkAcl | null>(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [ruleNumber, setRuleNumber] = useState("100");
  const [ruleAction, setRuleAction] = useState("allow");
  const [ruleEgress, setRuleEgress] = useState(false);
  const [ruleCidr, setRuleCidr] = useState("0.0.0.0/0");
  const [ruleProtocol, setRuleProtocol] = useState("6");
  const [ruleFromPort, setRuleFromPort] = useState("22");
  const [ruleToPort, setRuleToPort] = useState("22");
  const [addingRule, setAddingRule] = useState(false);

  // VPCs for dropdown
  const [vpcs, setVpcs] = useState<Array<{ VpcId: string; CidrBlock?: string }>>([]);

  const loadVpcs = useCallback(async () => {
    try {
      const res = await apiFetch("/api/vpc");
      const data = await res.json();
      setVpcs(data.vpcs || []);
    } catch {
      /* empty */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/network-acl");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAcls(data.networkAcls || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load network ACLs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
    queueMicrotask(() => {
      loadVpcs();
    });
  }, [load, loadVpcs]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await apiFetch("/api/network-acl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vpcId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowCreate(false);
      setVpcId("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create network ACL");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const acl of selected) {
        const res = await apiFetch(`/api/network-acl?networkAclId=${acl.NetworkAclId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete network ACL");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddRule() {
    if (!detailAcl) return;
    setAddingRule(true);
    try {
      const res = await apiFetch("/api/network-acl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createEntry",
          networkAclId: detailAcl.NetworkAclId,
          ruleNumber: parseInt(ruleNumber, 10),
          ruleAction,
          egress: ruleEgress,
          cidrBlock: ruleCidr,
          protocol: parseInt(ruleProtocol, 10),
          fromPort: parseInt(ruleFromPort, 10),
          toPort: parseInt(ruleToPort, 10),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowAddRule(false);
      setRuleNumber(String(parseInt(ruleNumber, 10) + 10));
      const refreshed = await apiFetch("/api/network-acl");
      const refreshedData = await refreshed.json();
      const found = (refreshedData.networkAcls || []).find(
        (a: NetworkAcl) => a.NetworkAclId === detailAcl.NetworkAclId,
      );
      if (found) setDetailAcl(found);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add rule");
    } finally {
      setAddingRule(false);
    }
  }

  async function handleDeleteRule(ruleNumber: number, egress: boolean) {
    if (!detailAcl) return;
    try {
      const res = await apiFetch("/api/network-acl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteEntry",
          networkAclId: detailAcl.NetworkAclId,
          ruleNumber,
          egress,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const refreshed = await apiFetch("/api/network-acl");
      const refreshedData = await refreshed.json();
      const found = (refreshedData.networkAcls || []).find(
        (a: NetworkAcl) => a.NetworkAclId === detailAcl.NetworkAclId,
      );
      if (found) setDetailAcl(found);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete rule");
    }
  }

  if (detailAcl) {
    const inboundRules = (detailAcl.Entries || []).filter((e) => !e.Egress);
    const outboundRules = (detailAcl.Entries || []).filter((e) => e.Egress);
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <AwsServiceHeader
            serviceName="setDetailAcl(null)}> Back to List } > Network ACL:"
            serviceIcon={SERVICE_ICONS["/network-acl"]?.small}
            counter={0}
            primaryAction=<button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/network-acl/create")}
            >
              Create ACL
            </button>
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={load} iconName="refresh" formAction="none">
                  Refresh
                </Button>
              </SpaceBetween>
            }
          />
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Container>
            <SpaceBetween direction="horizontal" size="l">
              <Box>
                <Box variant="small" color="text-label">
                  VPC ID
                </Box>
                <Box>{detailAcl.VpcId}</Box>
              </Box>
              <Box>
                <Box variant="small" color="text-label">
                  Default
                </Box>
                <Box>{detailAcl.IsDefault ? "Yes" : "No"}</Box>
              </Box>
              <Box>
                <Box variant="small" color="text-label">
                  Associated Subnets
                </Box>
                <Box>{detailAcl.Associations?.length || 0}</Box>
              </Box>
            </SpaceBetween>
          </Container>
          <Tabs
            tabs={[
              {
                label: `Inbound Rules (${inboundRules.length})`,
                id: "inbound",
                content: (
                  <SpaceBetween size="m">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setRuleEgress(false);
                        setShowAddRule(true);
                      }}
                    >
                      Add Inbound Rule
                    </Button>
                    <Table
                      columnDefinitions={[
                        { header: "Rule #", cell: (r: NetworkAclEntry) => r.RuleNumber },
                        {
                          header: "Protocol",
                          cell: (r: NetworkAclEntry) => (r.Protocol === "-1" ? "All" : r.Protocol),
                        },
                        { header: "Action", cell: (r: NetworkAclEntry) => r.RuleAction },
                        { header: "CIDR", cell: (r: NetworkAclEntry) => r.CidrBlock },
                        {
                          header: "Port Range",
                          cell: (r: NetworkAclEntry) =>
                            r.PortRange
                              ? `${r.PortRange.From ?? ""}-${r.PortRange.To ?? ""}`
                              : "All",
                        },
                        {
                          header: "Actions",
                          cell: (r: NetworkAclEntry) =>
                            r.RuleNumber === 32767 ? (
                              "—"
                            ) : (
                              <Button
                                variant="link"
                                onClick={() => handleDeleteRule(r.RuleNumber!, r.Egress ?? false)}
                                formAction="none"
                              >
                                Remove
                              </Button>
                            ),
                        },
                      ]}
                      items={inboundRules}
                      header={<Header variant="h3">Inbound Rules</Header>}
                      empty={<Box>No inbound rules</Box>}
                    />
                  </SpaceBetween>
                ),
              },
              {
                label: `Outbound Rules (${outboundRules.length})`,
                id: "outbound",
                content: (
                  <SpaceBetween size="m">
                    <Button
                      variant="primary"
                      onClick={() => {
                        setRuleEgress(true);
                        setShowAddRule(true);
                      }}
                    >
                      Add Outbound Rule
                    </Button>
                    <Table
                      columnDefinitions={[
                        { header: "Rule #", cell: (r: NetworkAclEntry) => r.RuleNumber },
                        {
                          header: "Protocol",
                          cell: (r: NetworkAclEntry) => (r.Protocol === "-1" ? "All" : r.Protocol),
                        },
                        { header: "Action", cell: (r: NetworkAclEntry) => r.RuleAction },
                        { header: "CIDR", cell: (r: NetworkAclEntry) => r.CidrBlock },
                        {
                          header: "Port Range",
                          cell: (r: NetworkAclEntry) =>
                            r.PortRange
                              ? `${r.PortRange.From ?? ""}-${r.PortRange.To ?? ""}`
                              : "All",
                        },
                        {
                          header: "Actions",
                          cell: (r: NetworkAclEntry) =>
                            r.RuleNumber === 32767 ? (
                              "—"
                            ) : (
                              <Button
                                variant="link"
                                onClick={() => handleDeleteRule(r.RuleNumber!, r.Egress ?? false)}
                                formAction="none"
                              >
                                Remove
                              </Button>
                            ),
                        },
                      ]}
                      items={outboundRules}
                      header={<Header variant="h3">Outbound Rules</Header>}
                      empty={<Box>No outbound rules</Box>}
                    />
                  </SpaceBetween>
                ),
              },
            ]}
          />
        </SpaceBetween>

        <Modal
          visible={showAddRule}
          onDismiss={() => setShowAddRule(false)}
          header={`Add ${ruleEgress ? "Outbound" : "Inbound"} Rule`}
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setShowAddRule(false)}>Cancel</Button>
                <Button variant="primary" loading={addingRule} onClick={handleAddRule}>
                  Add Rule
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Rule Number">
              <Input
                value={ruleNumber}
                onChange={({ detail }) => setRuleNumber(detail.value)}
                type="number"
              />
            </FormField>
            <FormField label="Protocol">
              <Select
                selectedOption={{
                  value: ruleProtocol,
                  label:
                    ruleProtocol === "-1"
                      ? "All"
                      : ruleProtocol === "6"
                        ? "TCP (6)"
                        : ruleProtocol === "17"
                          ? "UDP (17)"
                          : ruleProtocol === "1"
                            ? "ICMP (1)"
                            : ruleProtocol,
                }}
                options={[
                  { value: "-1", label: "All" },
                  { value: "6", label: "TCP (6)" },
                  { value: "17", label: "UDP (17)" },
                  { value: "1", label: "ICMP (1)" },
                ]}
                onChange={({ detail }) => setRuleProtocol(detail.selectedOption.value || "6")}
              />
            </FormField>
            <FormField label="Action">
              <Select
                selectedOption={{
                  value: ruleAction,
                  label: ruleAction === "allow" ? "Allow" : "Deny",
                }}
                options={[
                  { value: "allow", label: "Allow" },
                  { value: "deny", label: "Deny" },
                ]}
                onChange={({ detail }) => setRuleAction(detail.selectedOption.value || "allow")}
              />
            </FormField>
            <FormField label="CIDR Block">
              <Input
                value={ruleCidr}
                onChange={({ detail }) => setRuleCidr(detail.value)}
                placeholder="0.0.0.0/0"
              />
            </FormField>
            <SpaceBetween direction="horizontal" size="s">
              <FormField label="From Port">
                <Input
                  value={ruleFromPort}
                  onChange={({ detail }) => setRuleFromPort(detail.value)}
                  type="number"
                />
              </FormField>
              <FormField label="To Port">
                <Input
                  value={ruleToPort}
                  onChange={({ detail }) => setRuleToPort(detail.value)}
                  type="number"
                />
              </FormField>
            </SpaceBetween>
          </SpaceBetween>
        </Modal>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header
          variant="h2"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={load} iconName="refresh">
                Refresh
              </Button>
              <Button disabled={selected.length === 0} loading={deleting} onClick={handleDelete}>
                Delete
              </Button>
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                Create Network ACL
              </Button>
            </SpaceBetween>
          }
        >
          Network ACLs
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Table
          loading={loading}
          loadingText="Loading network ACLs..."
          items={acls}
          selectionType="multi"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
          trackBy="NetworkAclId"
          columnDefinitions={[
            { id: "networkAclId", header: "Network ACL ID", cell: (item) => item.NetworkAclId },
            { id: "vpcId", header: "VPC ID", cell: (item) => item.VpcId },
            { id: "isDefault", header: "Default", cell: (item) => (item.IsDefault ? "Yes" : "No") },
            { id: "rules", header: "Rules", cell: (item) => String((item.Entries || []).length) },
            {
              id: "subnets",
              header: "Associated Subnets",
              cell: (item) => String((item.Associations || []).length),
            },
            {
              id: "actions",
              header: "Actions",
              cell: (item) => (
                <Button variant="link" onClick={() => setDetailAcl(item)} formAction="none">
                  View Rules
                </Button>
              ),
            },
          ]}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No network ACLs</b>
              <Box variant="p" color="inherit">
                No network ACLs found.
              </Box>
            </Box>
          }
        />
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create Network ACL"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={creating} onClick={handleCreate}>
                Create Network ACL
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
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
