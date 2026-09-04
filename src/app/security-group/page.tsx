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

interface SecurityGroup {
  GroupId: string;
  GroupName: string;
  Description: string;
  VpcId: string;
}

export default function SecurityGroupPage() {
  const [groups, setGroups] = useState<SecurityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [vpcId, setVpcId] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<SecurityGroup[]>([]);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/security-group");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGroups(data.securityGroups || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load security groups");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/security-group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName, description, vpcId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowCreate(false);
      setGroupName("");
      setDescription("");
      setVpcId("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create security group");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const sg of selected) {
        const res = await fetch(`/api/security-group?groupId=${sg.GroupId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete security group");
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
              <Button variant="primary" onClick={() => setShowCreate(true)}>Create Security Group</Button>
            </SpaceBetween>
          }
        >
          Security Groups
        </Header>

        {error && <Alert type="error" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

        <Container>
          <Table
            loading={loading}
            loadingText="Loading security groups..."
            items={groups}
            selectionType="multi"
            selectedItems={selected}
            onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
            columnDefinitions={[
              { id: "groupName", header: "Group Name", cell: (item) => item.GroupName },
              { id: "groupId", header: "Group ID", cell: (item) => item.GroupId },
              { id: "description", header: "Description", cell: (item) => item.Description },
              { id: "vpcId", header: "VPC ID", cell: (item) => item.VpcId },
            ]}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No security groups</b>
                <Box variant="p" color="inherit">No security groups found.</Box>
              </Box>
            }
          />
        </Container>
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create Security Group"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={creating} onClick={handleCreate}>Create Security Group</Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Group Name">
            <Input value={groupName} onChange={({ detail }) => setGroupName(detail.value)} placeholder="my-security-group" />
          </FormField>
          <FormField label="Description">
            <Input value={description} onChange={({ detail }) => setDescription(detail.value)} placeholder="My security group" />
          </FormField>
          <FormField label="VPC ID">
            <Input value={vpcId} onChange={({ detail }) => setVpcId(detail.value)} placeholder="vpc-xxxxxxxx" />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
