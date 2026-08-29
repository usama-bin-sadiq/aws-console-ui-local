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

interface ResourceGroup {
  Name: string;
  Description?: string;
}

export default function ResourceGroupsPage() {
  const [groups, setGroups] = useState<ResourceGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createModal, setCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/resource-groups");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGroups(data.groups || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const createGroup = async () => {
    try {
      await fetch("/api/resource-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: groupName }),
      });
    } finally {
      setCreateModal(false);
      setGroupName("");
      fetchGroups();
    }
  };

  const deleteGroup = async (name: string) => {
    await fetch(`/api/resource-groups?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchGroups();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Resource Groups</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <Table
            header={
              <Header
                variant="h2"
                actions={<Button onClick={() => setCreateModal(true)}>Create group</Button>}
              >
                Resource Groups ({groups.length})
              </Header>
            }
            items={groups}
            loading={loading}
            columnDefinitions={[
              { header: "Name", cell: (item) => item.Name },
              { header: "Description", cell: (item) => item.Description ?? "—" },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteGroup(item.Name)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            empty={<Box textAlign="center">No resource groups found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create resource group"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createGroup}>Create</Button>
            </SpaceBetween>
          }
        >
          <FormField label="Group name">
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.detail.value)}
              placeholder="my-resource-group"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
