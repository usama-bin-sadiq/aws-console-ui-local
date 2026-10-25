"use client";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface NatGateway {
  NatGatewayId: string;
  State: string;
  SubnetId: string;
  VpcId: string;
  ConnectivityType: string;
}

export default function NatGatewayPage() {
  const [natGateways, setNatGateways] = useState<NatGateway[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [subnetId, setSubnetId] = useState("");
  const [allocationId, setAllocationId] = useState("");
  const [connectivityType, setConnectivityType] = useState("public");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<NatGateway[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Subnets for dropdown
  const [subnets, setSubnets] = useState<
    Array<{ SubnetId: string; VpcId?: string; AvailabilityZone?: string; CidrBlock?: string }>
  >([]);
  // Elastic IPs for dropdown
  const [elasticIps, setElasticIps] = useState<Array<{ AllocationId?: string; PublicIp?: string }>>(
    [],
  );

  async function loadSubnets() {
    try {
      const res = await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeSubnets" }),
      });
      const data = await res.json();
      setSubnets(data.subnets || []);
    } catch {
      // Subnets will be empty
    }
  }

  async function loadElasticIps() {
    try {
      const res = await apiFetch("/api/elastic-ip");
      const data = await res.json();
      setElasticIps(data.addresses || []);
    } catch {
      // Elastic IPs will be empty
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/nat-gateway");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNatGateways(data.natGateways || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load NAT gateways");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    loadSubnets();
    loadElasticIps();
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await apiFetch("/api/nat-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subnetId, allocationId, connectivityType }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowCreate(false);
      setSubnetId("");
      setAllocationId("");
      setConnectivityType("public");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create NAT gateway");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const nat of selected) {
        const res = await apiFetch(`/api/nat-gateway?natGatewayId=${nat.NatGatewayId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete NAT gateway");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Refresh Delete setShowCreate(true)}> Create NAT Ga"
          serviceIcon={SERVICE_ICONS["/nat-gateway"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/nat-gateway/create")}>
            Create gateway
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

        <Table
          loading={loading}
          loadingText="Loading NAT gateways..."
          items={natGateways}
          selectionType="multi"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
          columnDefinitions={[
            { id: "natGatewayId", header: "NAT Gateway ID", cell: (item) => item.NatGatewayId },
            { id: "state", header: "State", cell: (item) => item.State },
            { id: "subnetId", header: "Subnet ID", cell: (item) => item.SubnetId },
            {
              id: "connectivityType",
              header: "Connectivity Type",
              cell: (item) => item.ConnectivityType,
            },
          ]}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No NAT gateways</b>
              <Box variant="p" color="inherit">
                No NAT gateways found.
              </Box>
            </Box>
          }
        />
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create NAT Gateway"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={creating} onClick={handleCreate}>
                Create NAT Gateway
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Subnet ID">
            <Select
              selectedOption={
                subnetId
                  ? {
                      value: subnetId,
                      label: `${subnetId} (${subnets.find((s) => s.SubnetId === subnetId)?.AvailabilityZone || ""})`,
                    }
                  : null
              }
              options={subnets.map((s) => ({
                value: s.SubnetId,
                label: `${s.SubnetId} (${s.AvailabilityZone || ""}) - ${s.CidrBlock || ""}`,
              }))}
              placeholder="Select a subnet"
              onChange={({ detail }) => setSubnetId(detail.selectedOption.value || "")}
            />
          </FormField>
          <FormField label="Allocation ID (for public NAT)">
            <Select
              selectedOption={
                allocationId
                  ? {
                      value: allocationId,
                      label: `${allocationId} (${elasticIps.find((e) => e.AllocationId === allocationId)?.PublicIp || ""})`,
                    }
                  : null
              }
              options={elasticIps
                .filter((e) => e.AllocationId)
                .map((e) => ({
                  value: e.AllocationId!,
                  label: `${e.AllocationId} (${e.PublicIp || ""})`,
                }))}
              placeholder="Select an Elastic IP"
              onChange={({ detail }) => setAllocationId(detail.selectedOption.value || "")}
            />
          </FormField>
          <FormField label="Connectivity Type">
            <Select
              selectedOption={{
                value: connectivityType,
                label: connectivityType === "public" ? "Public" : "Private",
              }}
              options={[
                { value: "public", label: "Public" },
                { value: "private", label: "Private" },
              ]}
              onChange={({ detail }) =>
                setConnectivityType(detail.selectedOption.value || "public")
              }
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
