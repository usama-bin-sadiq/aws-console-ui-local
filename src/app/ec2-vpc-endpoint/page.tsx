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

interface VpcEndpoint {
  VpcEndpointId: string;
  VpcId: string;
  ServiceName: string;
  State: string;
  VpcEndpointType: string;
}

export default function VpcEndpointPage() {
  const [endpoints, setEndpoints] = useState<VpcEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [vpcId, setVpcId] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<VpcEndpoint[]>([]);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/ec2-vpc-endpoint");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setEndpoints(data.vpcEndpoints || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load VPC endpoints");
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
      const res = await apiFetch("/api/ec2-vpc-endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vpcId, serviceName }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowCreate(false);
      setVpcId("");
      setServiceName("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create VPC endpoint");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const ep of selected) {
        const res = await apiFetch(`/api/ec2-vpc-endpoint?vpcEndpointId=${ep.VpcEndpointId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete VPC endpoint");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Refresh Delete setShowCreate(true)}> Create VPC En"
          serviceIcon={SERVICE_ICONS["/ec2-vpc-endpoint"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/ec2-vpc-endpoint/create")}>
            Create endpoint
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
          loadingText="Loading VPC endpoints..."
          items={endpoints}
          selectionType="multi"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
          columnDefinitions={[
            { id: "vpcEndpointId", header: "VPC Endpoint ID", cell: (item) => item.VpcEndpointId },
            { id: "serviceName", header: "Service Name", cell: (item) => item.ServiceName },
            { id: "state", header: "State", cell: (item) => item.State },
            { id: "type", header: "Type", cell: (item) => item.VpcEndpointType },
          ]}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No VPC endpoints</b>
              <Box variant="p" color="inherit">
                No VPC endpoints found.
              </Box>
            </Box>
          }
        />
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create VPC Endpoint"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={creating} onClick={handleCreate}>
                Create VPC Endpoint
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="VPC ID">
            <Input
              value={vpcId}
              onChange={({ detail }) => setVpcId(detail.value)}
              placeholder="vpc-xxxxxxxx"
            />
          </FormField>
          <FormField label="Service Name">
            <Input
              value={serviceName}
              onChange={({ detail }) => setServiceName(detail.value)}
              placeholder="com.amazonaws.us-east-1.s3"
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
