"use client";

import React, { useEffect, useState, useCallback } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Tabs from "@cloudscape-design/components/tabs";
import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import IamPolicyEditor from "@/components/IamPolicyEditor";

interface UserDetail {
  UserName: string;
  UserId?: string;
  Arn?: string;
  Path?: string;
  CreateDate?: string;
  Groups?: Array<{ GroupName: string }>
  AttachedPolicies?: Array<{ PolicyName: string; PolicyArn: string }>
}

interface RoleDetail {
  RoleName: string;
  RoleId?: string;
  Arn?: string;
  Path?: string;
  CreateDate?: string;
  Description?: string;
  AssumeRolePolicyDocument?: string;
  AttachedPolicies?: Array<{ PolicyName: string; PolicyArn: string }>
}

export default function IAMPage() {
  const [data, setData] = useState({ users: [], roles: [], policies: [] });
  const [loading, setLoading] = useState(true);
  const [createUserModal, setCreateUserModal] = useState(false);
  const [createRoleModal, setCreateRoleModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [policyDoc, setPolicyDoc] = useState(
    JSON.stringify({ Version: "2012-10-17", Statement: [] }, null, 2)
  );

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roleDetail, setRoleDetail] = useState<RoleDetail | null>(null);
  const [roleDetailLoading, setRoleDetailLoading] = useState(false);

  const [attachPolicyModal, setAttachPolicyModal] = useState(false);
  const [attachTarget, setAttachTarget] = useState<{ type: "user" | "role"; name: string } | null>(null);
  const [policyArn, setPolicyArn] = useState("");
  const [policyOptions, setPolicyOptions] = useState<Array<{ label: string; value: string }>>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/iam");
      const d = await res.json();
      setData(d);
      setPolicyOptions((d.policies || []).map((p: any) => ({ label: p.PolicyName || "", value: p.Arn || "" })));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchUserDetail = useCallback(async (userName: string) => {
    setUserDetailLoading(true);
    setSelectedUser(userName);
    try {
      const res = await fetch(`/api/iam?action=getUser&userName=${encodeURIComponent(userName)}`);
      const d = await res.json();
      setUserDetail({
        UserName: d.user?.UserName || userName,
        UserId: d.user?.UserId || "",
        Arn: d.user?.Arn || "",
        Path: d.user?.Path || "/",
        CreateDate: d.user?.CreateDate || "",
        Groups: d.groups || [],
        AttachedPolicies: d.attachedPolicies || [],
      });
    } catch {}
    setUserDetailLoading(false);
  }, []);

  const fetchRoleDetail = useCallback(async (roleName: string) => {
    setRoleDetailLoading(true);
    setSelectedRole(roleName);
    try {
      const res = await fetch(`/api/iam?action=getRole&roleName=${encodeURIComponent(roleName)}`);
      const d = await res.json();
      setRoleDetail({
        RoleName: d.role?.RoleName || roleName,
        RoleId: d.role?.RoleId || "",
        Arn: d.role?.Arn || "",
        Path: d.role?.Path || "/",
        CreateDate: d.role?.CreateDate || "",
        Description: d.role?.Description || "",
        AssumeRolePolicyDocument: d.role?.AssumeRolePolicyDocument || "",
        AttachedPolicies: d.attachedPolicies || [],
      });
    } catch {}
    setRoleDetailLoading(false);
  }, []);

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
        assumeRolePolicyDocument: policyDoc,
      }),
    });
    setCreateRoleModal(false);
    setNewRoleName("");
    setPolicyDoc(JSON.stringify({ Version: "2012-10-17", Statement: [] }, null, 2));
    fetchData();
  };

  const deleteUser = async (name: string) => {
    await fetch(`/api/iam?type=user&name=${name}`, { method: "DELETE" });
    fetchData();
    if (selectedUser === name) {
      setSelectedUser(null);
      setUserDetail(null);
    }
  };

  const deleteRole = async (name: string) => {
    await fetch(`/api/iam?type=role&name=${name}`, { method: "DELETE" });
    fetchData();
    if (selectedRole === name) {
      setSelectedRole(null);
      setRoleDetail(null);
    }
  };

  const openAttachPolicy = (type: "user" | "role", name: string) => {
    setAttachTarget({ type, name });
    setPolicyArn("");
    setAttachPolicyModal(true);
  };

  const attachPolicy = async () => {
    if (!attachTarget) return;
    const action = attachTarget.type === "user" ? "attachUserPolicy" : "attachRolePolicy";
    const payload: any = { action, policyArn };
    if (attachTarget.type === "user") payload.userName = attachTarget.name;
    else payload.roleName = attachTarget.name;
    await fetch("/api/iam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setAttachPolicyModal(false);
    setAttachTarget(null);
    setPolicyArn("");
    if (attachTarget?.type === "user" && attachTarget.name === selectedUser) fetchUserDetail(attachTarget.name);
    if (attachTarget?.type === "role" && attachTarget.name === selectedRole) fetchRoleDetail(attachTarget.name);
    fetchData();
  };

  const detachPolicy = async (type: "user" | "role", targetName: string, policyArn: string) => {
    const action = type === "user" ? "detachUserPolicy" : "detachRolePolicy";
    const payload: any = { action, policyArn };
    if (type === "user") payload.userName = targetName;
    else payload.roleName = targetName;
    await fetch("/api/iam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (type === "user" && targetName === selectedUser) fetchUserDetail(targetName);
    if (type === "role" && targetName === selectedRole) fetchRoleDetail(targetName);
    fetchData();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">IAM — Identity & Access Management</Header>

        <Tabs
          tabs={[
            {
              label: `Users (${data.users.length})`,
              id: "users",
              content: (
                <SpaceBetween size="m">
                  <Container header={
                    <Header variant="h2" actions={<Button onClick={() => setCreateUserModal(true)} ariaLabel="Create IAM user">Create User</Button>}>Users</Header>
                  }>
                    <Table
                      items={data.users}
                      columnDefinitions={[
                        { header: "Name", cell: (item: any) => item.UserName },
                        { header: "Created", cell: (item: any) => item.CreateDate },
                        { header: "ARN", cell: (item: any) => item.Arn },
                        { header: "Path", cell: (item: any) => item.Path || "/" },
                        {
                          id: "actions",
                          header: "Actions",
                          cell: (item: any) => (
                            <ButtonDropdown
                              items={[
                                { text: "View", id: "view", disabled: false },
                                { text: "Attach Policy", id: "attach", disabled: false },
                                { text: "Delete", id: "delete", disabled: false },
                              ]}
                              onItemClick={({ detail }) => {
                                if (detail.id === "view") fetchUserDetail(item.UserName);
                                else if (detail.id === "attach") openAttachPolicy("user", item.UserName);
                                else if (detail.id === "delete") deleteUser(item.UserName);
                              }}
                              ariaLabel={`Actions for user ${item.UserName}`}
                            >
                              Actions
                            </ButtonDropdown>
                          ),
                          sortingField: undefined,
                        },
                      ]}
                      loading={loading}
                      empty={<Box>No users found.</Box>}
                      selectionType="single"
                      onSelectionChange={({ detail }) => {
                        const item = detail.selectedItems[0] as any | undefined;
                        if (item) fetchUserDetail(item.UserName);
                      }}
                    />
                  </Container>

                  {(selectedUser && userDetail) && (
                    <Container header={
                      <Header variant="h2">
                        User: {userDetail.UserName}
                      </Header>
                    }>
                      <SpaceBetween size="m">
                        <Box>
                          <SpaceBetween size="xs">
                            <strong>User Name:</strong> {userDetail.UserName}
                            <strong>User ID:</strong> {userDetail.UserId || "—"}
                            <strong>ARN:</strong> {userDetail.Arn || "—"}
                            <strong>Path:</strong> {userDetail.Path || "/"}
                            <strong>Created:</strong> {userDetail.CreateDate || "—"}
                          </SpaceBetween>
                        </Box>

                        <Header variant="h3">Groups</Header>
                        {userDetail.Groups && userDetail.Groups.length > 0 ? (
                          <Table
                            items={userDetail.Groups}
                            columnDefinitions={[
                              { header: "Group Name", cell: (g: any) => g.GroupName },
                            ]}
                            empty={<Box>No groups.</Box>}
                          />
                        ) : <Box>No groups assigned.</Box>}

                        <Header variant="h3">Attached Policies</Header>
                        {userDetail.AttachedPolicies && userDetail.AttachedPolicies.length > 0 ? (
                          <Table
                            items={userDetail.AttachedPolicies}
                            columnDefinitions={[
                              { header: "Policy Name", cell: (p: any) => p.PolicyName },
                              { header: "ARN", cell: (p: any) => p.PolicyArn },
                              {
                                header: "Actions",
                                cell: (p: any) => (
                                  <Button onClick={() => detachPolicy("user", selectedUser!, p.PolicyArn)} formAction="none" ariaLabel={`Detach policy ${p.PolicyName} from user ${selectedUser}`}>Detach</Button>
                                ),
                              },
                            ]}
                            empty={<Box>No policies.</Box>}
                          />
                        ) : <Box>No attached policies.</Box>}
                      </SpaceBetween>
                    </Container>
                  )}
                </SpaceBetween>
              ),
            },
            {
              label: `Roles (${data.roles.length})`,
              id: "roles",
              content: (
                <SpaceBetween size="m">
                  <Container header={
                    <Header variant="h2" actions={<Button onClick={() => setCreateRoleModal(true)} ariaLabel="Create IAM role">Create Role</Button>}>Roles</Header>
                  }>
                    <Table
                      items={data.roles}
                      columnDefinitions={[
                        { header: "Name", cell: (item: any) => item.RoleName },
                        { header: "Created", cell: (item: any) => item.CreateDate },
                        { header: "ARN", cell: (item: any) => item.Arn },
                        { header: "Path", cell: (item: any) => item.Path || "/" },
                        {
                          header: "Actions",
                          cell: (item: any) => (
                            <SpaceBetween direction="horizontal" size="xs">
                              <Button onClick={() => fetchRoleDetail(item.RoleName)} formAction="none" ariaLabel={`View role ${item.RoleName}`}>View</Button>
                              <Button onClick={() => openAttachPolicy("role", item.RoleName)} formAction="none" ariaLabel={`Attach policy to role ${item.RoleName}`}>Attach Policy</Button>
                              <Button onClick={() => deleteRole(item.RoleName)} formAction="none" ariaLabel={`Delete role ${item.RoleName}`}>Delete</Button>
                            </SpaceBetween>
                          ),
                        },
                      ]}
                      loading={loading}
                      empty={<Box>No roles found.</Box>}
                      selectionType="single"
                      onSelectionChange={({ detail }) => {
                        const item = detail.selectedItems[0] as any | undefined;
                        if (item) fetchRoleDetail(item.RoleName);
                      }}
                    />
                  </Container>

                  {(selectedRole && roleDetail) && (
                    <Container header={
                      <Header variant="h2">Role: {roleDetail.RoleName}</Header>
                    }>
                      <SpaceBetween size="m">
                        <Box>
                          <SpaceBetween size="xs">
                            <strong>Role Name:</strong> {roleDetail.RoleName}
                            <strong>Role ID:</strong> {roleDetail.RoleId || "—"}
                            <strong>ARN:</strong> {roleDetail.Arn || "—"}
                            <strong>Path:</strong> {roleDetail.Path || "/"}
                            <strong>Created:</strong> {roleDetail.CreateDate || "—"}
                            <strong>Description:</strong> {roleDetail.Description || "—"}
                            <strong>Max Session Duration:</strong> {roleDetail.AssumeRolePolicyDocument ? "Default" : "—"}
                          </SpaceBetween>
                        </Box>

                        <Header variant="h3">Attached Policies</Header>
                        {roleDetail.AttachedPolicies && roleDetail.AttachedPolicies.length > 0 ? (
                          <Table
                            items={roleDetail.AttachedPolicies}
                            columnDefinitions={[
                              { header: "Policy Name", cell: (p: any) => p.PolicyName },
                              { header: "ARN", cell: (p: any) => p.PolicyArn },
                              {
                                header: "Actions",
                                cell: (p: any) => (
                                  <Button onClick={() => detachPolicy("role", selectedRole!, p.PolicyArn)} formAction="none" ariaLabel={`Detach policy ${p.PolicyName} from role ${selectedRole}`}>Detach</Button>
                                ),
                              },
                            ]}
                            empty={<Box>No policies.</Box>}
                          />
                        ) : <Box>No attached policies.</Box>}
                      </SpaceBetween>
                    </Container>
                  )}
                </SpaceBetween>
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
          <FormField label="User Name"><Input value={newUserName} onChange={(e) => setNewUserName((e as any).detail?.value || "")} /></FormField>
        </Modal>

        <Modal visible={createRoleModal} onDismiss={() => setCreateRoleModal(false)} header="Create IAM Role"
          footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setCreateRoleModal(false)}>Cancel</Button><Button variant="primary" onClick={createRole}>Create</Button></SpaceBetween>}>
          <FormField label="Role Name"><Input value={newRoleName} onChange={(e) => setNewRoleName((e as any).detail?.value || "")} /></FormField>
          <IamPolicyEditor label="Permissions Policy" value={policyDoc} onChange={setPolicyDoc} />
        </Modal>

        <Modal visible={attachPolicyModal} onDismiss={() => setAttachPolicyModal(false)} header="Attach Policy"
          footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setAttachPolicyModal(false)}>Cancel</Button><Button variant="primary" onClick={attachPolicy}>Attach</Button></SpaceBetween>}>
          <FormField label="Policy ARN">
            <Select
              selectedOption={policyArn ? { label: policyArn, value: policyArn } : null}
              options={policyOptions}
              onChange={({ detail }) => setPolicyArn(detail.selectedOption?.value || "")}
              placeholder="Select a policy"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
