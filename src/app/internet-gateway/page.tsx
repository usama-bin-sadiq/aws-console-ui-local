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

interface InternetGateway {
  InternetGatewayId: string;
  State?: string;
  Attachments?: { VpcId: string; State: string }[];
}

export default function InternetGatewayPage() {
  const [gateways, setGateways] = useState<InternetGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAttach, setShowAttach] = useState(false);
  const [attachIgwId, setAttachIgwId] = useState("");
  const [attachVpcId, setAttachVpcId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<InternetGateway[]>([]);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/internet-gateway");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGateways(data.internetGateways || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load internet gateways");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/internet-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create internet gateway");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAttach() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/internet-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "attach", igwId: attachIgwId, vpcId: attachVpcId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowAttach(false);
      setAttachIgwId("");
      setAttachVpcId("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to attach internet gateway");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const igw of selected) {
        const res = await fetch(`/api/internet-gateway?igwId=${igw.InternetGatewayId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete internet gateway");
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
              <Button onClick={() => setShowAttach(true)}>Attach to VPC</Button>
              <Button variant="primary" loading={submitting} onClick={handleCreate}>Create Internet Gateway</Button>
            </SpaceBetween>
          }
        >
          Internet Gateways
        </Header>

        {error && <Alert type="error" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

        <Container>
          <Table
            loading={loading}
            loadingText="Loading internet gateways..."
            items={gateways}
            selectionType="multi"
            selectedItems={selected}
            onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
            columnDefinitions={[
              { id: "igwId", header: "Internet Gateway ID", cell: (item) => item.InternetGatewayId },
              {
                id: "attachedVpc",
                header: "Attached VPC",
                cell: (item) => item.Attachments && item.Attachments.length > 0
                  ? item.Attachments.map((a) => a.VpcId).join(", ")
                  : "—",
              },
              {
                id: "state",
                header: "State",
                cell: (item) => item.Attachments && item.Attachments.length > 0
                  ? item.Attachments[0].State
                  : "detached",
              },
            ]}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No internet gateways</b>
                <Box variant="p" color="inherit">No internet gateways found.</Box>
              </Box>
            }
          />
        </Container>
      </SpaceBetween>

      <Modal
        visible={showAttach}
        onDismiss={() => setShowAttach(false)}
        header="Attach Internet Gateway to VPC"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowAttach(false)}>Cancel</Button>
              <Button variant="primary" loading={submitting} onClick={handleAttach}>Attach</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Internet Gateway ID">
            <Input value={attachIgwId} onChange={({ detail }) => setAttachIgwId(detail.value)} placeholder="igw-xxxxxxxx" />
          </FormField>
          <FormField label="VPC ID">
            <Input value={attachVpcId} onChange={({ detail }) => setAttachVpcId(detail.value)} placeholder="vpc-xxxxxxxx" />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
