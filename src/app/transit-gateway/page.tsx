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

interface TransitGateway {
  TransitGatewayId: string;
  Description?: string;
  State: string;
  OwnerId?: string;
}

export default function TransitGatewayPage() {
  const [gateways, setGateways] = useState<TransitGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<TransitGateway[]>([]);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/transit-gateway");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGateways(data.transitGateways || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load transit gateways");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await apiFetch("/api/transit-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowCreate(false);
      setDescription("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create transit gateway");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const tgw of selected) {
        const res = await apiFetch(`/api/transit-gateway?tgwId=${tgw.TransitGatewayId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete transit gateway");
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
                Create Transit Gateway
              </Button>
            </SpaceBetween>
          }
        >
          Transit Gateways
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Table
          loading={loading}
          loadingText="Loading transit gateways..."
          items={gateways}
          selectionType="multi"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
          columnDefinitions={[
            { id: "tgwId", header: "Transit Gateway ID", cell: (item) => item.TransitGatewayId },
            { id: "description", header: "Description", cell: (item) => item.Description || "—" },
            { id: "state", header: "State", cell: (item) => item.State },
          ]}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No transit gateways</b>
              <Box variant="p" color="inherit">
                No transit gateways found.
              </Box>
            </Box>
          }
        />
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create Transit Gateway"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={creating} onClick={handleCreate}>
                Create Transit Gateway
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Description">
            <Input
              value={description}
              onChange={({ detail }) => setDescription(detail.value)}
              placeholder="My transit gateway"
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
