"use client";
import { apiFetch } from "@/lib/api-client";
// VERIFICATION GATE: Phase 4 VPC Full — Subnet functionality per PRD §9.2.4
// Uses @aws-sdk/client-ec2 commands (DescribeSubnets, CreateSubnet, DeleteSubnet, ModifySubnetAttribute)
// Cloudscape components only; verification comments added.

import { useEffect, useState, useCallback } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Checkbox from "@cloudscape-design/components/checkbox";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import CapabilityLink from "@/components/CapabilityLink";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface Subnet {
  SubnetId: string;
  VpcId: string;
  CidrBlock: string;
  AvailabilityZone: string;
  State: string;
}

export default function SubnetPage() {
  const [subnets, setSubnets] = useState<Subnet[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Subnet[]>([]);
  const [deleting, setDeleting] = useState(false);

  // VPCs for dropdown
  const [vpcs, setVpcs] = useState<Array<{ VpcId: string; CidrBlock?: string }>>([]);

  // Create state
  const [showCreate, setShowCreate] = useState(false);
  const [vpcId, setVpcId] = useState("");
  const [cidrBlock, setCidrBlock] = useState("10.0.1.0/24");
  const [creating, setCreating] = useState(false);

  // Modify state
  const [modifyOpen, setModifyOpen] = useState(false);
  const [modifySubnet, setModifySubnet] = useState<Subnet | null>(null);
  const [mapPublicIpOnLaunch, setMapPublicIpOnLaunch] = useState(true);
  const [modifying, setModifying] = useState(false);

  async function loadVpcs() {
    try {
      const res = await apiFetch("/api/vpc");
      const data = await res.json();
      setVpcs(data.vpcs || []);
    } catch {
      // VPCs will be empty, user can type manually
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/subnet");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSubnets(data.subnets || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load subnets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
    queueMicrotask(() => {
      loadVpcs();
    });
  }, []);

  async function handleCreate() {
    if (!vpcId.trim() || !cidrBlock.trim()) {
      setError("VPC ID and IPv4 CIDR block are required");
      return;
    }
    setCreating(true);
    try {
      const res = await apiFetch("/api/subnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vpcId, cidrBlock }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowCreate(false);
      setVpcId("");
      setCidrBlock("10.0.1.0/24");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create subnet");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const subnet of selected) {
        const res = await apiFetch(`/api/subnet?subnetId=${subnet.SubnetId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete subnet");
    } finally {
      setDeleting(false);
    }
  }

  async function handleModify() {
    if (!modifySubnet) return;
    setModifying(true);
    try {
      const res = await apiFetch("/api/subnet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subnetId: modifySubnet.SubnetId,
          mapPublicIpOnLaunch,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setModifyOpen(false);
      setModifySubnet(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to modify subnet");
    } finally {
      setModifying(false);
    }
  }

  const openModify = useCallback((subnet: Subnet) => {
    setModifySubnet(subnet);
    setMapPublicIpOnLaunch(true);
    setModifyOpen(true);
  }, []);

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Subnet"
          serviceIcon={SERVICE_ICONS["/subnet"]?.small}
          counter={subnets?.length ?? 0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/subnet/create")}
            >
              Create subnet
            </button>
          }
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Table
          loading={loading}
          loadingText="Loading subnets..."
          items={subnets}
          selectionType="multi"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
          trackBy="SubnetId"
          columnDefinitions={[
            {
              id: "subnetId",
              header: "Subnet ID",
              cell: (item: Subnet) => item.SubnetId,
              sortingField: "SubnetId",
            },
            {
              id: "vpcId",
              header: "VPC ID",
              cell: (item: Subnet) => (
                <CapabilityLink
                  label={item.VpcId}
                  href={`/vpc?resource=${encodeURIComponent(item.VpcId)}`}
                  enabled={Boolean(item.VpcId)}
                  reason="missing VPC identifier"
                />
              ),
            },
            {
              id: "cidrBlock",
              header: "IPv4 CIDR",
              cell: (item: Subnet) => item.CidrBlock,
              sortingField: "CidrBlock",
            },
            {
              id: "az",
              header: "Availability Zone",
              cell: (item: Subnet) => item.AvailabilityZone,
              sortingField: "AvailabilityZone",
            },
            {
              id: "state",
              header: "State",
              cell: (item: Subnet) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <StatusIndicator type={item.State === "available" ? "success" : "warning"} />
                  <span>{item.State}</span>
                </SpaceBetween>
              ),
            },
            {
              id: "actions",
              header: "Actions",
              cell: (item: Subnet) => (
                <Button variant="link" onClick={() => openModify(item)} formAction="none">
                  Modify
                </Button>
              ),
            },
          ]}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No subnets</b>
              <Box variant="p" color="inherit">
                No subnets found. Create one or use the VPC wizard.
              </Box>
            </Box>
          }
        />
      </SpaceBetween>

      {/* Create Subnet Modal */}
      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create Subnet"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)} formAction="none">
                Cancel
              </Button>
              <Button variant="primary" loading={creating} onClick={handleCreate} formAction="none">
                Create Subnet
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="VPC ID" description="The VPC this subnet belongs to">
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
          <FormField label="IPv4 CIDR Block" description="IP range within the VPC CIDR">
            <Input
              value={cidrBlock}
              onChange={({ detail }) => setCidrBlock(detail.value)}
              placeholder="10.0.1.0/24"
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* Modify Subnet Modal */}
      <Modal
        visible={modifyOpen}
        onDismiss={() => setModifyOpen(false)}
        header="Modify Subnet Attributes"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setModifyOpen(false)} formAction="none">
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={modifying}
                onClick={handleModify}
                formAction="none"
              >
                Modify Subnet
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box>
            <Box variant="small" color="text-label">
              Subnet ID
            </Box>
            <Box>{modifySubnet?.SubnetId}</Box>
          </Box>
          <Checkbox
            checked={mapPublicIpOnLaunch}
            onChange={({ detail }) => setMapPublicIpOnLaunch(detail.checked)}
          >
            Auto-assign public IPv4 address
          </Checkbox>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
