"use client";
import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface VpcPeeringConnection {
  VpcPeeringConnectionId: string;
  Status?: { Code?: string };
  RequesterVpcInfo?: { VpcId?: string };
  AccepterVpcInfo?: { VpcId?: string };
}

export default function VpcPeeringPage() {
  const [connections, setConnections] = useState<VpcPeeringConnection[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [vpcId, setVpcId] = useState("");
  const [peerVpcId, setPeerVpcId] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<VpcPeeringConnection[]>([]);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/ec2-vpc-peering");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setConnections(data.vpcPeeringConnections || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load VPC peering connections");
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
      const res = await apiFetch("/api/ec2-vpc-peering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vpcId, peerVpcId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowCreate(false);
      setVpcId("");
      setPeerVpcId("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create VPC peering connection");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const conn of selected) {
        const res = await apiFetch(
          `/api/ec2-vpc-peering?peeringId=${conn.VpcPeeringConnectionId}`,
          { method: "DELETE" },
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete VPC peering connection");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Refresh Delete setShowCreate(true)}> Create Peerin"
          serviceIcon={SERVICE_ICONS["/ec2-vpc-peering"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/ec2-vpc-peering/create")}>
            Create peering connection
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
          loadingText="Loading VPC peering connections..."
          items={connections}
          selectionType="multi"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
          columnDefinitions={[
            {
              id: "peeringId",
              header: "Peering Connection ID",
              cell: (item) => item.VpcPeeringConnectionId,
            },
            {
              id: "requesterVpc",
              header: "Requester VPC",
              cell: (item) => item.RequesterVpcInfo?.VpcId || "—",
            },
            {
              id: "accepterVpc",
              header: "Accepter VPC",
              cell: (item) => item.AccepterVpcInfo?.VpcId || "—",
            },
            { id: "status", header: "Status", cell: (item) => item.Status?.Code || "—" },
          ]}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No peering connections</b>
              <Box variant="p" color="inherit">
                No VPC peering connections found.
              </Box>
            </Box>
          }
        />
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create VPC Peering Connection"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={creating} onClick={handleCreate}>
                Create Peering Connection
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Requester VPC ID">
            <Input
              value={vpcId}
              onChange={({ detail }) => setVpcId(detail.value)}
              placeholder="vpc-xxxxxxxx"
            />
          </FormField>
          <FormField label="Accepter VPC ID">
            <Input
              value={peerVpcId}
              onChange={({ detail }) => setPeerVpcId(detail.value)}
              placeholder="vpc-yyyyyyyy"
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
