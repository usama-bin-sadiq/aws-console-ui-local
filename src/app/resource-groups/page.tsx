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
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface ResourceGroup {
  Name: string;
  Description?: string;
}

export default function ResourceGroupsPage() {
  const [groups, setGroups] = useState<ResourceGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);

  const [createModal, setCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/resource-groups");
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
      await apiFetch("/api/resource-groups", {
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
    await apiFetch(`/api/resource-groups?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchGroups();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Resource Groups"
          serviceIcon={SERVICE_ICONS["/resource-groups"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/resource-groups/create")}>
            Create group
        </button>

        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
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

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create resource group"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createGroup}>
                Create
              </Button>
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
