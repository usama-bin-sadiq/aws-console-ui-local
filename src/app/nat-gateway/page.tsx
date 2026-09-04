"use client";
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
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [subnetId, setSubnetId] = useState("");
  const [allocationId, setAllocationId] = useState("");
  const [connectivityType, setConnectivityType] = useState("public");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<NatGateway[]>([]);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/nat-gateway");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setNatGateways(data.natGateways || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load NAT gateways");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/nat-gateway", {
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
        const res = await fetch(`/api/nat-gateway?natGatewayId=${nat.NatGatewayId}`, { method: "DELETE" });
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
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={load} iconName="refresh">Refresh</Button>
              <Button disabled={selected.length === 0} loading={deleting} onClick={handleDelete}>Delete</Button>
              <Button variant="primary" onClick={() => setShowCreate(true)}>Create NAT Gateway</Button>
            </SpaceBetween>
          }
        >
          NAT Gateways
        </Header>

        {error && <Alert type="error" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

        <Container>
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
              { id: "connectivityType", header: "Connectivity Type", cell: (item) => item.ConnectivityType },
            ]}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No NAT gateways</b>
                <Box variant="p" color="inherit">No NAT gateways found.</Box>
              </Box>
            }
          />
        </Container>
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create NAT Gateway"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={creating} onClick={handleCreate}>Create NAT Gateway</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Subnet ID">
            <Input value={subnetId} onChange={({ detail }) => setSubnetId(detail.value)} placeholder="subnet-xxxxxxxx" />
          </FormField>
          <FormField label="Allocation ID (for public NAT)">
            <Input value={allocationId} onChange={({ detail }) => setAllocationId(detail.value)} placeholder="eipalloc-xxxxxxxx" />
          </FormField>
          <FormField label="Connectivity Type">
            <Input value={connectivityType} onChange={({ detail }) => setConnectivityType(detail.value)} placeholder="public" />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
