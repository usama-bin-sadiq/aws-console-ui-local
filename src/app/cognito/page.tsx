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

interface UserPool {
  Id: string;
  Name: string;
  CreationDate?: string;
}

interface CognitoUser {
  Username?: string;
  UserStatus?: string;
  UserCreateDate?: string;
}

export default function CognitoPage() {
  const [pools, setPools] = useState<UserPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create pool modal
  const [createModal, setCreateModal] = useState(false);
  const [poolName, setPoolName] = useState("");

  // List users panel
  const [usersModal, setUsersModal] = useState(false);
  const [selectedPool, setSelectedPool] = useState<UserPool | null>(null);
  const [users, setUsers] = useState<CognitoUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const fetchPools = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cognito");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPools(data.userPools || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  const createPool = async () => {
    try {
      await fetch("/api/cognito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createPool", poolName }),
      });
    } finally {
      setCreateModal(false);
      setPoolName("");
      fetchPools();
    }
  };

  const deletePool = async (id: string) => {
    await fetch(`/api/cognito?poolId=${encodeURIComponent(id)}`, { method: "DELETE" });
    fetchPools();
  };

  const openListUsers = async (pool: UserPool) => {
    setSelectedPool(pool);
    setUsersModal(true);
    setUsersLoading(true);
    try {
      const res = await fetch("/api/cognito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listUsers", poolId: pool.Id }),
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Cognito — User Pools</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <Table
            header={
              <Header
                variant="h2"
                actions={<Button onClick={() => setCreateModal(true)}>Create user pool</Button>}
              >
                User Pools ({pools.length})
              </Header>
            }
            items={pools}
            loading={loading}
            columnDefinitions={[
              { header: "Name", cell: (item) => item.Name },
              { header: "ID", cell: (item) => item.Id },
              { header: "Created", cell: (item) => item.CreationDate ?? "—" },
              {
                header: "Actions",
                cell: (item) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => openListUsers(item)} formAction="none">
                      List users
                    </Button>
                    <Button onClick={() => deletePool(item.Id)} formAction="none">
                      Delete
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
            empty={<Box textAlign="center">No user pools found.</Box>}
          />
        </Container>

        {/* Create pool modal */}
        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create user pool"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createPool}>Create</Button>
            </SpaceBetween>
          }
        >
          <FormField label="Pool name">
            <Input
              value={poolName}
              onChange={(e) => setPoolName(e.detail.value)}
              placeholder="my-user-pool"
            />
          </FormField>
        </Modal>

        {/* List users modal */}
        <Modal
          visible={usersModal}
          onDismiss={() => { setUsersModal(false); setUsers([]); }}
          header={`Users — ${selectedPool?.Name ?? ""}`}
          footer={<Button onClick={() => { setUsersModal(false); setUsers([]); }}>Close</Button>}
        >
          <Table
            items={users}
            loading={usersLoading}
            columnDefinitions={[
              { header: "Username", cell: (u) => u.Username ?? "—" },
              { header: "Status", cell: (u) => u.UserStatus ?? "—" },
              { header: "Created", cell: (u) => u.UserCreateDate ?? "—" },
            ]}
            empty={<Box textAlign="center">No users found.</Box>}
          />
        </Modal>
      </SpaceBetween>
    </div>
  );
}
