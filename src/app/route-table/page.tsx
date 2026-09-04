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

interface RouteTable {
  RouteTableId: string;
  VpcId: string;
  Routes?: unknown[];
}

export default function RouteTablePage() {
  const [routeTables, setRouteTables] = useState<RouteTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [vpcId, setVpcId] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<RouteTable[]>([]);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/route-table");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRouteTables(data.routeTables || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load route tables");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/route-table", {
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
      setError(e instanceof Error ? e.message : "Failed to create route table");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const rt of selected) {
        const res = await fetch(`/api/route-table?routeTableId=${rt.RouteTableId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete route table");
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
              <Button variant="primary" onClick={() => setShowCreate(true)}>Create Route Table</Button>
            </SpaceBetween>
          }
        >
          Route Tables
        </Header>

        {error && <Alert type="error" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

        <Container>
          <Table
            loading={loading}
            loadingText="Loading route tables..."
            items={routeTables}
            selectionType="multi"
            selectedItems={selected}
            onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
            columnDefinitions={[
              { id: "routeTableId", header: "Route Table ID", cell: (item) => item.RouteTableId },
              { id: "vpcId", header: "VPC ID", cell: (item) => item.VpcId },
              { id: "routes", header: "Routes", cell: (item) => String(item.Routes?.length ?? 0) },
            ]}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No route tables</b>
                <Box variant="p" color="inherit">No route tables found.</Box>
              </Box>
            }
          />
        </Container>
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create Route Table"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={creating} onClick={handleCreate}>Create Route Table</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="VPC ID">
            <Input value={vpcId} onChange={({ detail }) => setVpcId(detail.value)} placeholder="vpc-xxxxxxxx" />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
