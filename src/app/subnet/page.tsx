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
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [vpcId, setVpcId] = useState("");
  const [cidrBlock, setCidrBlock] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Subnet[]>([]);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subnet");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSubnets(data.subnets || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load subnets");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/subnet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vpcId, cidrBlock }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowCreate(false);
      setVpcId("");
      setCidrBlock("");
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
        const res = await fetch(`/api/subnet?subnetId=${subnet.SubnetId}`, { method: "DELETE" });
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

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={load} iconName="refresh">Refresh</Button>
              <Button disabled={selected.length === 0} loading={deleting} onClick={handleDelete}>Delete</Button>
              <Button variant="primary" onClick={() => setShowCreate(true)}>Create Subnet</Button>
            </SpaceBetween>
          }
        >
          Subnets
        </Header>

        {error && <Alert type="error" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

        <Container>
          <Table
            loading={loading}
            loadingText="Loading subnets..."
            items={subnets}
            selectionType="multi"
            selectedItems={selected}
            onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
            columnDefinitions={[
              { id: "subnetId", header: "Subnet ID", cell: (item) => item.SubnetId },
              { id: "vpcId", header: "VPC ID", cell: (item) => item.VpcId },
              { id: "cidrBlock", header: "IPv4 CIDR", cell: (item) => item.CidrBlock },
              { id: "az", header: "Availability Zone", cell: (item) => item.AvailabilityZone },
            ]}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No subnets</b>
                <Box variant="p" color="inherit">No subnets found.</Box>
              </Box>
            }
          />
        </Container>
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create Subnet"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={creating} onClick={handleCreate}>Create Subnet</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="VPC ID">
            <Input value={vpcId} onChange={({ detail }) => setVpcId(detail.value)} placeholder="vpc-xxxxxxxx" />
          </FormField>
          <FormField label="IPv4 CIDR Block">
            <Input value={cidrBlock} onChange={({ detail }) => setCidrBlock(detail.value)} placeholder="10.0.1.0/24" />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
