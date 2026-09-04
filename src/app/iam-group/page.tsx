"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";

interface IamGroup {
  GroupId: string;
  GroupName: string;
  Path: string;
  Arn?: string;
  CreateDate?: string;
}

export default function IAMGroupPage() {
  const [groups, setGroups] = useState<IamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/iam-group");
      const data = await res.json();
      setGroups(data.groups || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const createGroup = async () => {
    await fetch("/api/iam-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupName }),
    });
    setCreateModal(false);
    setGroupName("");
    fetchGroups();
  };

  const deleteGroup = async (name: string) => {
    await fetch(`/api/iam-group?groupName=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchGroups();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">IAM Groups</Header>
        <Container
          header={
            <Header
              variant="h2"
              actions={<Button onClick={() => setCreateModal(true)}>Create Group</Button>}
            >
              Groups
            </Header>
          }
        >
          <Table
            items={groups}
            loading={loading}
            columnDefinitions={[
              { header: "Group Name", cell: (item) => item.GroupName },
              { header: "Group ID", cell: (item) => item.GroupId },
              { header: "ARN", cell: (item) => item.Arn || "—" },
              {
                header: "Actions",
                cell: (item) => (
                  <Button
                    onClick={() => deleteGroup(item.GroupName)}
                    formAction="none"
                  >
                    Delete
                  </Button>
                ),
              },
            ]}
            empty={<Box>No groups found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create IAM Group"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createGroup}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Group Name">
            <Input value={groupName} onChange={(e) => setGroupName(e.detail.value)} />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
