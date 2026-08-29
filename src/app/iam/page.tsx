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
import Tabs from "@cloudscape-design/components/tabs";
import FormField from "@cloudscape-design/components/form-field";

export default function IAMPage() {
  const [data, setData] = useState({ users: [], roles: [], policies: [] });
  const [loading, setLoading] = useState(true);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [createRoleModal, setCreateRoleModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newRoleName, setNewRoleName] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/iam");
      const d = await res.json();
      setData(d);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const createUser = async () => {
    await fetch("/api/iam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createUser", userName: newUserName }),
    });
    setCreateUserModal(false);
    setNewUserName("");
    fetchData();
  };

  const createRole = async () => {
    await fetch("/api/iam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "createRole",
        roleName: newRoleName,
        assumeRolePolicyDocument: JSON.stringify({
          Version: "2012-10-17",
          Statement: [{ Effect: "Allow", Principal: { Service: "lambda.amazonaws.com" }, Action: "sts:AssumeRole" }],
        }),
      }),
    });
    setCreateRoleModal(false);
    setNewRoleName("");
    fetchData();
  };

  const deleteUser = async (name: string) => {
    await fetch(`/api/iam?type=user&name=${name}`, { method: "DELETE" });
    fetchData();
  };

  const deleteRole = async (name: string) => {
    await fetch(`/api/iam?type=role&name=${name}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">IAM - Identity & Access Management</Header>

        <Tabs
          tabs={[
            {
              label: `Users (${data.users.length})`,
              id: "users",
              content: (
                <Container header={
                  <Header variant="h2" actions={<Button onClick={() => setCreateUserModal(true)}>Create User</Button>}>Users</Header>
                }>
                  <Table
                    items={data.users}
                    columnDefinitions={[
                      { header: "Name", cell: (item: any) => item.UserName },
                      { header: "Created", cell: (item: any) => item.CreateDate },
                      { header: "ARN", cell: (item: any) => item.Arn },
                      { header: "Actions", cell: (item: any) => (
                        <Button onClick={() => deleteUser(item.UserName)} formAction="none">Delete</Button>
                      )},
                    ]}
                    loading={loading}
                    empty={<Box>No users found.</Box>}
                  />
                </Container>
              ),
            },
            {
              label: `Roles (${data.roles.length})`,
              id: "roles",
              content: (
                <Container header={
                  <Header variant="h2" actions={<Button onClick={() => setCreateRoleModal(true)}>Create Role</Button>}>Roles</Header>
                }>
                  <Table
                    items={data.roles}
                    columnDefinitions={[
                      { header: "Name", cell: (item: any) => item.RoleName },
                      { header: "Created", cell: (item: any) => item.CreateDate },
                      { header: "ARN", cell: (item: any) => item.Arn },
                      { header: "Actions", cell: (item: any) => (
                        <Button onClick={() => deleteRole(item.RoleName)} formAction="none">Delete</Button>
                      )},
                    ]}
                    loading={loading}
                    empty={<Box>No roles found.</Box>}
                  />
                </Container>
              ),
            },
            {
              label: `Policies (${data.policies.length})`,
              id: "policies",
              content: (
                <Container header={<Header variant="h2">Policies</Header>}>
                  <Table
                    items={data.policies}
                    columnDefinitions={[
                      { header: "Name", cell: (item: any) => item.PolicyName },
                      { header: "ARN", cell: (item: any) => item.Arn },
                      { header: "Created", cell: (item: any) => item.CreateDate },
                    ]}
                    loading={loading}
                    empty={<Box>No policies found.</Box>}
                  />
                </Container>
              ),
            },
          ]}
        />

        <Modal visible={createUserModal} onDismiss={() => setCreateUserModal(false)} header="Create IAM User"
          footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setCreateUserModal(false)}>Cancel</Button><Button variant="primary" onClick={createUser}>Create</Button></SpaceBetween>}>
          <FormField label="User Name"><Input value={newUserName} onChange={(e) => setNewUserName(e.detail.value)} /></FormField>
        </Modal>

        <Modal visible={createRoleModal} onDismiss={() => setCreateRoleModal(false)} header="Create IAM Role"
          footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setCreateRoleModal(false)}>Cancel</Button><Button variant="primary" onClick={createRole}>Create</Button></SpaceBetween>}>
          <FormField label="Role Name"><Input value={newRoleName} onChange={(e) => setNewRoleName(e.detail.value)} /></FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
