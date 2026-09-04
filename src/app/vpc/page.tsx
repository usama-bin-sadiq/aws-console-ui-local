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

interface Vpc {
  VpcId: string;
  State: string;
  CidrBlock: string;
  IsDefault: boolean;
}

export default function VpcPage() {
  const [vpcs, setVpcs] = useState<Vpc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [cidrBlock, setCidrBlock] = useState("10.0.0.0/16");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Vpc[]>([]);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vpc");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVpcs(data.vpcs || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load VPCs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/vpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cidrBlock }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowCreate(false);
      setCidrBlock("10.0.0.0/16");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create VPC");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const vpc of selected) {
        const res = await fetch(`/api/vpc?vpcId=${vpc.VpcId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete VPC");
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
              <Button
                disabled={selected.length === 0}
                loading={deleting}
                onClick={handleDelete}
              >
                Delete
              </Button>
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                Create VPC
              </Button>
            </SpaceBetween>
          }
        >
          VPCs
        </Header>

        {error && <Alert type="error" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

        <Container>
          <Table
            loading={loading}
            loadingText="Loading VPCs..."
            items={vpcs}
            selectionType="multi"
            selectedItems={selected}
            onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
            columnDefinitions={[
              { id: "vpcId", header: "VPC ID", cell: (item) => item.VpcId },
              { id: "cidrBlock", header: "IPv4 CIDR", cell: (item) => item.CidrBlock },
              { id: "state", header: "State", cell: (item) => item.State },
              { id: "isDefault", header: "Default VPC", cell: (item) => item.IsDefault ? "Yes" : "No" },
            ]}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No VPCs</b>
                <Box variant="p" color="inherit">No VPCs found.</Box>
              </Box>
            }
          />
        </Container>
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create VPC"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={creating} onClick={handleCreate}>
                Create VPC
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="IPv4 CIDR Block">
            <Input value={cidrBlock} onChange={({ detail }) => setCidrBlock(detail.value)} placeholder="10.0.0.0/16" />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
