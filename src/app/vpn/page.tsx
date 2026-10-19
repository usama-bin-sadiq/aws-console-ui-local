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

interface VpnConnection {
  VpnConnectionId: string;
  State: string;
  Type: string;
  CustomerGatewayId?: string;
}

export default function VpnPage() {
  const [connections, setConnections] = useState<VpnConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [customerGatewayId, setCustomerGatewayId] = useState("");
  const [vpnGatewayId, setVpnGatewayId] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<VpnConnection[]>([]);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/vpn");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConnections(data.vpnConnections || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load VPN connections");
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
      const res = await apiFetch("/api/vpn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerGatewayId, vpnGatewayId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowCreate(false);
      setCustomerGatewayId("");
      setVpnGatewayId("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create VPN connection");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const conn of selected) {
        const res = await apiFetch(`/api/vpn?vpnConnectionId=${conn.VpnConnectionId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete VPN connection");
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
                Create VPN Connection
              </Button>
            </SpaceBetween>
          }
        >
          VPN Connections
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Table
          loading={loading}
          loadingText="Loading VPN connections..."
          items={connections}
          selectionType="multi"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
          columnDefinitions={[
            {
              id: "vpnConnectionId",
              header: "VPN Connection ID",
              cell: (item) => item.VpnConnectionId,
            },
            { id: "state", header: "State", cell: (item) => item.State },
            { id: "type", header: "Type", cell: (item) => item.Type },
          ]}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No VPN connections</b>
              <Box variant="p" color="inherit">
                No VPN connections found.
              </Box>
            </Box>
          }
        />
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create VPN Connection"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={creating} onClick={handleCreate}>
                Create VPN Connection
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Customer Gateway ID">
            <Input
              value={customerGatewayId}
              onChange={({ detail }) => setCustomerGatewayId(detail.value)}
              placeholder="cgw-xxxxxxxx"
            />
          </FormField>
          <FormField label="VPN Gateway ID">
            <Input
              value={vpnGatewayId}
              onChange={({ detail }) => setVpnGatewayId(detail.value)}
              placeholder="vgw-xxxxxxxx"
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
