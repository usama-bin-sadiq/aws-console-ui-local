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
import Alert from "@cloudscape-design/components/alert";
import IamPolicyEditor from "@/components/IamPolicyEditor";
import TruncatedText from "@/components/TruncatedText";
import ConfirmModal from "@/components/ConfirmModal";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";

interface UserDetail {
  UserName: string;
  UserId?: string;
  Arn?: string;
  Path?: string;
  CreateDate?: string;
  Groups?: Array<{ GroupName: string }>;
  AttachedPolicies?: Array<{ PolicyName: string; PolicyArn: string }>;
}

interface RoleDetail {
  RoleName: string;
  RoleId?: string;
  Arn?: string;
  Path?: string;
  CreateDate?: string;
  Description?: string;
  AssumeRolePolicyDocument?: string;
  AttachedPolicies?: Array<{ PolicyName: string; PolicyArn: string }>;
}

interface GroupDetail {
  GroupName: string;
  GroupId?: string;
  Arn?: string;
  Path?: string;
  CreateDate?: string;
  Users?: Array<{ UserName: string; Arn: string }>;
  AttachedPolicies?: Array<{ PolicyName: string; PolicyArn: string }>;
}

interface PolicyDetail {
  Arn?: string;
  PolicyName?: string;
  PolicyId?: string;
  Path?: string;
  DefaultVersionId?: string;
  AttachmentCount?: number;
  CreateDate?: string;
  Document?: string;
}

export default function IAMPage() {
  const [data, setData] = useState({ users: [], roles: [], policies: [], groups: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createUserModal, setCreateUserModal] = useState(false);
  const [createRoleModal, setCreateRoleModal] = useState(false);
  const [createGroupModal, setCreateGroupModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newRoleName, setNewRoleName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [policyDoc, setPolicyDoc] = useState(
    JSON.stringify({ Version: "2012-10-17", Statement: [] }, null, 2)
  );

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userDetailTab, setUserDetailTab] = useState("permissions");

  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roleDetail, setRoleDetail] = useState<RoleDetail | null>(null);
  const [roleDetailLoading, setRoleDetailLoading] = useState(false);
  const [roleDetailTab, setRoleDetailTab] = useState("trust");

  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupDetail, setGroupDetail] = useState<GroupDetail | null>(null);
  const [groupDetailLoading, setGroupDetailLoading] = useState(false);
  const [groupDetailTab, setGroupDetailTab] = useState("users");

  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [policyDetail, setPolicyDetail] = useState<PolicyDetail | null>(null);
  const [policyDetailLoading, setPolicyDetailLoading] = useState(false);
  const [policyDetailTab, setPolicyDetailTab] = useState("permissions");

  const [attachPolicyModal, setAttachPolicyModal] = useState(false);
  const [attachTarget, setAttachTarget] = useState<{ type: "user" | "role" | "group"; name: string } | null>(null);
  const [policyArn, setPolicyArn] = useState("");
  const [policyOptions, setPolicyOptions] = useState<Array<{ label: string; value: string }>>([]);

  const [addUserToGroupModal, setAddUserToGroupModal] = useState(false);
  const [addUserToGroupTarget, setAddUserToGroupTarget] = useState<string | null>(null);
  const [addUserToGroupSelect, setAddUserToGroupSelect] = useState<string>("");

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "user" | "role" | "group" | "policy"; name: string } | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/iam");
      if (!res.ok) throw new Error(`Failed to list IAM resources: ${res.statusText}`);
      const d = await res.json();
      setData({
        users: Array.isArray(d.users) ? d.users : [],
        roles: Array.isArray(d.roles) ? d.roles : [],
        policies: Array.isArray(d.policies) ? d.policies : [],
        groups: Array.isArray(d.groups) ? d.groups : [],
      });
      setPolicyOptions((d.policies || []).map((p: any) => ({ label: p.PolicyName || "", value: p.Arn || "" })));
    } catch (e: any) {
      setError(e.message || "Failed to load IAM data");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchUserDetail = useCallback(async (userName: string) => {
    setUserDetailLoading(true);
    setSelectedUser(userName);
    setUserDetailTab("permissions");
    try {
      const res = await fetch(`/api/iam?action=getUser&userName=${encodeURIComponent(userName)}`);
      if (!res.ok) throw new Error(`Failed to get user: ${res.statusText}`);
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
    } catch (e: any) {
      setActionError(e.message || "Failed to load user detail");
    }
    setUserDetailLoading(false);
  }, []);

  const fetchRoleDetail = useCallback(async (roleName: string) => {
    setRoleDetailLoading(true);
    setSelectedRole(roleName);
    setRoleDetailTab("trust");
    try {
      const res = await fetch(`/api/iam?action=getRole&roleName=${encodeURIComponent(roleName)}`);
      if (!res.ok) throw new Error(`Failed to get role: ${res.statusText}`);
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
    } catch (e: any) {
      setActionError(e.message || "Failed to load role detail");
    }
    setRoleDetailLoading(false);
  }, []);

  const fetchGroupDetail = useCallback(async (groupName: string) => {
    setGroupDetailLoading(true);
    setSelectedGroup(groupName);
    setGroupDetailTab("users");
    try {
      const res = await fetch(`/api/iam?action=getGroup&groupName=${encodeURIComponent(groupName)}`);
      if (!res.ok) throw new Error(`Failed to get group: ${res.statusText}`);
      const d = await res.json();
      setGroupDetail({
        GroupName: d.group?.GroupName || groupName,
        GroupId: d.group?.GroupId || "",
        Arn: d.group?.Arn || "",
        Path: d.group?.Path || "/",
        CreateDate: d.group?.CreateDate || "",
        Users: d.users || [],
        AttachedPolicies: d.attachedPolicies || [],
      });
    } catch (e: any) {
      setActionError(e.message || "Failed to load group detail");
    }
    setGroupDetailLoading(false);
  }, []);

  const fetchPolicyDetail = useCallback(async (policyArn: string, policyName: string) => {
    setPolicyDetailLoading(true);
    setSelectedPolicy(policyArn);
    setPolicyDetailTab("permissions");
    try {
      const res = await fetch(`/api/iam?action=getPolicy&policyArn=${encodeURIComponent(policyArn)}`);
      if (!res.ok) throw new Error(`Failed to get policy: ${res.statusText}`);
      const d = await res.json();
      setPolicyDetail({
        Arn: d.policy?.Arn || policyArn,
        PolicyName: d.policy?.PolicyName || policyName,
        PolicyId: d.policy?.PolicyId || "",
        Path: d.policy?.Path || "/",
        DefaultVersionId: d.policy?.DefaultVersionId || "",
        AttachmentCount: d.policy?.AttachmentCount || 0,
        CreateDate: d.policy?.CreateDate || "",
        Document: d.document || "",
      });
    } catch (e: any) {
      setActionError(e.message || "Failed to load policy detail");
    }
    setPolicyDetailLoading(false);
  }, []);

  const createUser = async () => {
    if (!newUserName.trim()) return;
    try {
      const res = await fetch("/api/iam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createUser", userName: newUserName }),
      });
      if (!res.ok) throw new Error("Failed to create user");
      setCreateUserModal(false);
      setNewUserName("");
      fetchData();
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const createRole = async () => {
    if (!newRoleName.trim()) return;
    try {
      const res = await fetch("/api/iam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createRole", roleName: newRoleName, assumeRolePolicyDocument: policyDoc }),
      });
      if (!res.ok) throw new Error("Failed to create role");
      setCreateRoleModal(false);
      setNewRoleName("");
      setPolicyDoc(JSON.stringify({ Version: "2012-10-17", Statement: [] }, null, 2));
      fetchData();
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const createGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch("/api/iam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createGroup", groupName: newGroupName }),
      });
      if (!res.ok) throw new Error("Failed to create group");
      setCreateGroupModal(false);
      setNewGroupName("");
      fetchData();
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/iam?type=${deleteConfirm.type}&name=${encodeURIComponent(deleteConfirm.name)}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Failed to delete ${deleteConfirm.type}`);
      fetchData();
      if (deleteConfirm.type === "user" && deleteConfirm.name === selectedUser) {
        setSelectedUser(null);
        setUserDetail(null);
      }
      if (deleteConfirm.type === "role" && deleteConfirm.name === selectedRole) {
        setSelectedRole(null);
        setRoleDetail(null);
      }
      if (deleteConfirm.type === "group" && deleteConfirm.name === selectedGroup) {
        setSelectedGroup(null);
        setGroupDetail(null);
      }
      setDeleteConfirm(null);
    } catch (e: any) {
      setActionError(e.message);
      setDeleteConfirm(null);
    }
  };

  const openAttachPolicy = (type: "user" | "role" | "group", name: string) => {
    setAttachTarget({ type, name });
    setPolicyArn("");
    setAttachPolicyModal(true);
  };

  const attachPolicy = async () => {
    if (!attachTarget || !policyArn) return;
    const actionMap = { user: "attachUserPolicy", role: "attachRolePolicy", group: "attachGroupPolicy" };
    const nameKeyMap = { user: "userName", role: "roleName", group: "groupName" };
    try {
      const res = await fetch("/api/iam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionMap[attachTarget.type], [nameKeyMap[attachTarget.type]]: attachTarget.name, policyArn }),
      });
      if (!res.ok) throw new Error("Failed to attach policy");
      setAttachPolicyModal(false);
      setAttachTarget(null);
      setPolicyArn("");
      if (attachTarget.type === "user" && attachTarget.name === selectedUser) fetchUserDetail(attachTarget.name);
      if (attachTarget.type === "role" && attachTarget.name === selectedRole) fetchRoleDetail(attachTarget.name);
      if (attachTarget.type === "group" && attachTarget.name === selectedGroup) fetchGroupDetail(attachTarget.name);
      fetchData();
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const detachPolicy = async (type: "user" | "role" | "group", targetName: string, arn: string) => {
    const actionMap = { user: "detachUserPolicy", role: "detachRolePolicy", group: "detachGroupPolicy" };
    const nameKeyMap = { user: "userName", role: "roleName", group: "groupName" };
    try {
      const res = await fetch("/api/iam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionMap[type], [nameKeyMap[type]]: targetName, policyArn: arn }),
      });
      if (!res.ok) throw new Error("Failed to detach policy");
      if (type === "user" && targetName === selectedUser) fetchUserDetail(targetName);
      if (type === "role" && targetName === selectedRole) fetchRoleDetail(targetName);
      if (type === "group" && targetName === selectedGroup) fetchGroupDetail(targetName);
      fetchData();
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const addUserToGroup = async () => {
    if (!addUserToGroupTarget || !addUserToGroupSelect) return;
    try {
      const res = await fetch("/api/iam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addUserToGroup", groupName: addUserToGroupTarget, userName: addUserToGroupSelect }),
      });
      if (!res.ok) throw new Error("Failed to add user to group");
      setAddUserToGroupModal(false);
      fetchGroupDetail(addUserToGroupTarget);
      fetchData();
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const removeUserFromGroup = async (groupName: string, userName: string) => {
    try {
      const res = await fetch("/api/iam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "removeUserFromGroup", groupName, userName }),
      });
      if (!res.ok) throw new Error("Failed to remove user from group");
      fetchGroupDetail(groupName);
    } catch (e: any) {
      setActionError(e.message);
    }
  };

  const parsePolicyStatements = (doc: string): Array<{ service: string; access: string; resource: string }> => {
    try {
      const parsed = JSON.parse(doc);
      const stmts = parsed.Statement || [];
      return stmts.map((s: any) => {
        const action = s.Action || [];
        const actions = Array.isArray(action) ? action : [action];
        const service = actions.length > 0 ? (actions[0]?.split(":")[0] || "*") : "*";
        const isAllow = s.Effect === "Allow";
        const resource = Array.isArray(s.Resource) ? s.Resource.join(", ") : s.Resource || "*";
        return { service, access: isAllow ? "Allow" : "Deny", resource };
      });
    } catch {
      return [];
    }
  };

  const userDetailTabContent = () => {
    if (!userDetail) return null;
    switch (userDetailTab) {
      case "permissions":
        return (
          <SpaceBetween size="m">
            <Header variant="h3">Attached Policies</Header>
            {userDetail.AttachedPolicies && userDetail.AttachedPolicies.length > 0 ? (
              <Table
                items={userDetail.AttachedPolicies}
                columnDefinitions={[
                  { header: "Policy Name", cell: (p: any) => p.PolicyName },
                  { header: "ARN", cell: (p: any) => <TruncatedText>{p.PolicyArn}</TruncatedText> },
                  { header: "Actions", cell: (p: any) => (
                    <Button onClick={() => detachPolicy("user", selectedUser!, p.PolicyArn)} formAction="none">Detach</Button>
                  )},
                ]}
                empty={<Box>No attached policies.</Box>}
              />
            ) : <Box>No attached policies.</Box>}
            <Button onClick={() => openAttachPolicy("user", userDetail.UserName)}>Attach Policy</Button>
          </SpaceBetween>
        );
      case "groups":
        return (
          <SpaceBetween size="m">
            <Header variant="h3">Group Memberships</Header>
            {userDetail.Groups && userDetail.Groups.length > 0 ? (
              <Table
                items={userDetail.Groups}
                columnDefinitions={[
                  { header: "Group Name", cell: (g: any) => g.GroupName },
                ]}
                empty={<Box>No groups.</Box>}
              />
            ) : <Box>No groups assigned.</Box>}
          </SpaceBetween>
        );
      case "security":
        return (
          <SpaceBetween size="m">
            <Header variant="h3">Security Credentials</Header>
            <Box>
              <SpaceBetween size="xs">
                <strong>Console Access:</strong> <StatusIndicator type="info">Default</StatusIndicator>
                <strong>Access Keys:</strong> <StatusIndicator type="info">None</StatusIndicator>
                <strong>MFA:</strong> <StatusIndicator type="info">Not enabled</StatusIndicator>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        );
      case "tags":
        return (
          <SpaceBetween size="m">
            <Header variant="h3">Tags</Header>
            <Box>No tags.</Box>
          </SpaceBetween>
        );
      default:
        return null;
    }
  };

  const roleDetailTabContent = () => {
    if (!roleDetail) return null;
    switch (roleDetailTab) {
      case "trust":
        return (
          <SpaceBetween size="m">
            <Header variant="h3">Trust Relationships</Header>
            <Box>
              <IamPolicyEditor
                label="Trust Policy Document"
                value={roleDetail.AssumeRolePolicyDocument || "{}"}
                readOnly={true}
              />
            </Box>
          </SpaceBetween>
        );
      case "permissions":
        return (
          <SpaceBetween size="m">
            <Header variant="h3">Attached Policies</Header>
            {roleDetail.AttachedPolicies && roleDetail.AttachedPolicies.length > 0 ? (
              <Table
                items={roleDetail.AttachedPolicies}
                columnDefinitions={[
                  { header: "Policy Name", cell: (p: any) => p.PolicyName },
                  { header: "ARN", cell: (p: any) => <TruncatedText>{p.PolicyArn}</TruncatedText> },
                  { header: "Actions", cell: (p: any) => (
                    <Button onClick={() => detachPolicy("role", selectedRole!, p.PolicyArn)} formAction="none">Detach</Button>
                  )},
                ]}
                empty={<Box>No policies.</Box>}
              />
            ) : <Box>No attached policies.</Box>}
            <Button onClick={() => openAttachPolicy("role", roleDetail.RoleName)}>Attach Policy</Button>
          </SpaceBetween>
        );
      case "tags":
        return (
          <SpaceBetween size="m">
            <Header variant="h3">Tags</Header>
            <Box>No tags.</Box>
          </SpaceBetween>
        );
      default:
        return null;
    }
  };

  const groupDetailTabContent = () => {
    if (!groupDetail) return null;
    switch (groupDetailTab) {
      case "users":
        return (
          <SpaceBetween size="m">
            <Header variant="h3" actions={
              <Button onClick={() => {
                setAddUserToGroupTarget(groupDetail.GroupName);
                setAddUserToGroupSelect("");
                setAddUserToGroupModal(true);
              }}>Add User to Group</Button>
            }>Users in Group</Header>
            {groupDetail.Users && groupDetail.Users.length > 0 ? (
              <Table
                items={groupDetail.Users}
                columnDefinitions={[
                  { header: "User Name", cell: (u: any) => u.UserName },
                  { header: "ARN", cell: (u: any) => <TruncatedText>{u.Arn}</TruncatedText> },
                  { header: "Actions", cell: (u: any) => (
                    <Button onClick={() => removeUserFromGroup(groupDetail.GroupName, u.UserName)} formAction="none">Remove</Button>
                  )},
                ]}
                empty={<Box>No users in this group.</Box>}
              />
            ) : <Box>No users in this group.</Box>}
          </SpaceBetween>
        );
      case "permissions":
        return (
          <SpaceBetween size="m">
            <Header variant="h3">Attached Policies</Header>
            {groupDetail.AttachedPolicies && groupDetail.AttachedPolicies.length > 0 ? (
              <Table
                items={groupDetail.AttachedPolicies}
                columnDefinitions={[
                  { header: "Policy Name", cell: (p: any) => p.PolicyName },
                  { header: "ARN", cell: (p: any) => <TruncatedText>{p.PolicyArn}</TruncatedText> },
                  { header: "Actions", cell: (p: any) => (
                    <Button onClick={() => detachPolicy("group", selectedGroup!, p.PolicyArn)} formAction="none">Detach</Button>
                  )},
                ]}
                empty={<Box>No policies.</Box>}
              />
            ) : <Box>No attached policies.</Box>}
            <Button onClick={() => openAttachPolicy("group", groupDetail.GroupName)}>Attach Policy</Button>
          </SpaceBetween>
        );
      default:
        return null;
    }
  };

  const policyDetailTabContent = () => {
    if (!policyDetail) return null;
    const statements = parsePolicyStatements(policyDetail.Document || "{}");
    switch (policyDetailTab) {
      case "permissions":
        return (
          <SpaceBetween size="m">
            <Header variant="h3">Permissions Summary</Header>
            {statements.length > 0 ? (
              <Table
                items={statements}
                columnDefinitions={[
                  { header: "Service", cell: (s: any) => s.service },
                  { header: "Access Level", cell: (s: any) => (
                    <StatusIndicator type={s.access === "Allow" ? "success" : "error"}>{s.access}</StatusIndicator>
                  )},
                  { header: "Resource", cell: (s: any) => <TruncatedText>{s.resource}</TruncatedText> },
                ]}
                empty={<Box>No statements.</Box>}
              />
            ) : <Box>No permission statements found.</Box>}
          </SpaceBetween>
        );
      case "json":
        return (
          <SpaceBetween size="m">
            <Header variant="h3">Policy Document</Header>
            <IamPolicyEditor
              label="Policy JSON"
              value={policyDetail.Document ? (() => { try { return JSON.stringify(JSON.parse(policyDetail.Document), null, 2); } catch { return policyDetail.Document || "{}"; } })() : "{}"}
              readOnly={true}
            />
          </SpaceBetween>
        );
      case "attached":
        return (
          <SpaceBetween size="m">
            <Header variant="h3">Attached Entities</Header>
            <Box>{policyDetail.AttachmentCount || 0} entity/entities attached.</Box>
          </SpaceBetween>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">IAM — Identity & Access Management</Header>

        {error && <Alert type="error" dismissible onDismiss={() => setError(null)}>{error}</Alert>}
        {actionError && <Alert type="error" dismissible onDismiss={() => setActionError(null)}>{actionError}</Alert>}

        <Tabs
          tabs={[
            {
              label: `Users (${data.users.length})`,
              id: "users",
              content: (
                <SpaceBetween size="m">
                  <Container header={
                    <Header variant="h2" actions={<Button onClick={() => setCreateUserModal(true)}>Create User</Button>}>Users</Header>
                  }>
                    <Table
                      items={data.users}
                      columnDefinitions={[
                        { header: "Name", cell: (item: any) => item.UserName },
                        { header: "Created", cell: (item: any) => item.CreateDate },
                        { header: "ARN", cell: (item: any) => <TruncatedText>{item.Arn}</TruncatedText> },
                        { header: "Path", cell: (item: any) => item.Path || "/" },
                        { id: "actions", header: "Actions", cell: (item: any) => (
                          <ButtonDropdown
                            items={[
                              { text: "View", id: "view" },
                              { text: "Attach Policy", id: "attach" },
                              { text: "Delete", id: "delete" },
                            ]}
                            onItemClick={({ detail }) => {
                              if (detail.id === "view") fetchUserDetail(item.UserName);
                              else if (detail.id === "attach") openAttachPolicy("user", item.UserName);
                              else if (detail.id === "delete") setDeleteConfirm({ type: "user", name: item.UserName });
                            }}
                            ariaLabel={`Actions for user ${item.UserName}`}
                          >Actions</ButtonDropdown>
                        )},
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

                  {selectedUser && userDetail && (
                    <Container header={
                      <Header variant="h2" actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button onClick={() => openAttachPolicy("user", userDetail.UserName)}>Attach Policy</Button>
                          <Button onClick={() => setDeleteConfirm({ type: "user", name: userDetail.UserName })} formAction="none">Delete User</Button>
                        </SpaceBetween>
                      }>User: {userDetail.UserName}</Header>
                    }>
                      {userDetailLoading ? <Box>Loading...</Box> : (
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
                          <Tabs
                            activeTabId={userDetailTab}
                            onChange={({ detail }) => setUserDetailTab(detail.activeTabId)}
                            tabs={[
                              { label: "Permissions", id: "permissions", content: userDetailTabContent() },
                              { label: "Groups", id: "groups", content: userDetailTabContent() },
                              { label: "Security Credentials", id: "security", content: userDetailTabContent() },
                              { label: "Tags", id: "tags", content: userDetailTabContent() },
                            ]}
                          />
                        </SpaceBetween>
                      )}
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
                    <Header variant="h2" actions={<Button onClick={() => setCreateRoleModal(true)}>Create Role</Button>}>Roles</Header>
                  }>
                    <Table
                      items={data.roles}
                      columnDefinitions={[
                        { header: "Name", cell: (item: any) => item.RoleName },
                        { header: "Created", cell: (item: any) => item.CreateDate },
                        { header: "ARN", cell: (item: any) => <TruncatedText>{item.Arn}</TruncatedText> },
                        { header: "Path", cell: (item: any) => item.Path || "/" },
                        { header: "Actions", cell: (item: any) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button onClick={() => fetchRoleDetail(item.RoleName)} formAction="none">View</Button>
                            <Button onClick={() => openAttachPolicy("role", item.RoleName)} formAction="none">Attach Policy</Button>
                            <Button onClick={() => setDeleteConfirm({ type: "role", name: item.RoleName })} formAction="none">Delete</Button>
                          </SpaceBetween>
                        )},
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

                  {selectedRole && roleDetail && (
                    <Container header={
                      <Header variant="h2" actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button onClick={() => openAttachPolicy("role", roleDetail.RoleName)}>Attach Policy</Button>
                          <Button onClick={() => setDeleteConfirm({ type: "role", name: roleDetail.RoleName })} formAction="none">Delete Role</Button>
                        </SpaceBetween>
                      }>Role: {roleDetail.RoleName}</Header>
                    }>
                      {roleDetailLoading ? <Box>Loading...</Box> : (
                        <SpaceBetween size="m">
                          <Box>
                            <SpaceBetween size="xs">
                              <strong>Role Name:</strong> {roleDetail.RoleName}
                              <strong>Role ID:</strong> {roleDetail.RoleId || "—"}
                              <strong>ARN:</strong> {roleDetail.Arn || "—"}
                              <strong>Path:</strong> {roleDetail.Path || "/"}
                              <strong>Created:</strong> {roleDetail.CreateDate || "—"}
                              <strong>Description:</strong> {roleDetail.Description || "—"}
                            </SpaceBetween>
                          </Box>
                          <Tabs
                            activeTabId={roleDetailTab}
                            onChange={({ detail }) => setRoleDetailTab(detail.activeTabId)}
                            tabs={[
                              { label: "Trust Relationships", id: "trust", content: roleDetailTabContent() },
                              { label: "Permissions", id: "permissions", content: roleDetailTabContent() },
                              { label: "Tags", id: "tags", content: roleDetailTabContent() },
                            ]}
                          />
                        </SpaceBetween>
                      )}
                    </Container>
                  )}
                </SpaceBetween>
              ),
            },
            {
              label: `Policies (${data.policies.length})`,
              id: "policies",
              content: (
                <SpaceBetween size="m">
                  <Container header={<Header variant="h2">Policies</Header>}>
                    <Table
                      items={data.policies}
                      columnDefinitions={[
                        { header: "Name", cell: (item: any) => item.PolicyName },
                        { header: "ARN", cell: (item: any) => <TruncatedText>{item.Arn}</TruncatedText> },
                        { header: "Created", cell: (item: any) => item.CreateDate },
                        { header: "Actions", cell: (item: any) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button onClick={() => fetchPolicyDetail(item.Arn, item.PolicyName)} formAction="none">View</Button>
                            <Button onClick={() => setDeleteConfirm({ type: "policy", name: item.Arn })} formAction="none">Delete</Button>
                          </SpaceBetween>
                        )},
                      ]}
                      loading={loading}
                      empty={<Box>No policies found.</Box>}
                      selectionType="single"
                      onSelectionChange={({ detail }) => {
                        const item = detail.selectedItems[0] as any | undefined;
                        if (item) fetchPolicyDetail(item.Arn, item.PolicyName);
                      }}
                    />
                  </Container>

                  {selectedPolicy && policyDetail && (
                    <Container header={
                      <Header variant="h2">Policy: {policyDetail.PolicyName}</Header>
                    }>
                      {policyDetailLoading ? <Box>Loading...</Box> : (
                        <SpaceBetween size="m">
                          <Box>
                            <SpaceBetween size="xs">
                              <strong>Policy Name:</strong> {policyDetail.PolicyName || "—"}
                              <strong>ARN:</strong> {policyDetail.Arn || "—"}
                              <strong>Policy ID:</strong> {policyDetail.PolicyId || "—"}
                              <strong>Path:</strong> {policyDetail.Path || "/"}
                              <strong>Created:</strong> {policyDetail.CreateDate || "—"}
                              <strong>Attachment Count:</strong> {policyDetail.AttachmentCount ?? 0}
                            </SpaceBetween>
                          </Box>
                          <Tabs
                            activeTabId={policyDetailTab}
                            onChange={({ detail }) => setPolicyDetailTab(detail.activeTabId)}
                            tabs={[
                              { label: "Permissions", id: "permissions", content: policyDetailTabContent() },
                              { label: "JSON", id: "json", content: policyDetailTabContent() },
                              { label: "Attached Entities", id: "attached", content: policyDetailTabContent() },
                            ]}
                          />
                        </SpaceBetween>
                      )}
                    </Container>
                  )}
                </SpaceBetween>
              ),
            },
            {
              label: `Groups (${data.groups.length})`,
              id: "groups",
              content: (
                <SpaceBetween size="m">
                  <Container header={
                    <Header variant="h2" actions={<Button onClick={() => setCreateGroupModal(true)}>Create Group</Button>}>Groups</Header>
                  }>
                    <Table
                      items={data.groups}
                      columnDefinitions={[
                        { header: "Group Name", cell: (item: any) => item.GroupName },
                        { header: "ARN", cell: (item: any) => <TruncatedText>{item.Arn}</TruncatedText> },
                        { header: "Path", cell: (item: any) => item.Path || "/" },
                        { header: "Created", cell: (item: any) => item.CreateDate },
                        { header: "Actions", cell: (item: any) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button onClick={() => fetchGroupDetail(item.GroupName)} formAction="none">View</Button>
                            <Button onClick={() => openAttachPolicy("group", item.GroupName)} formAction="none">Attach Policy</Button>
                            <Button onClick={() => setDeleteConfirm({ type: "group", name: item.GroupName })} formAction="none">Delete</Button>
                          </SpaceBetween>
                        )},
                      ]}
                      loading={loading}
                      empty={<Box>No groups found.</Box>}
                      selectionType="single"
                      onSelectionChange={({ detail }) => {
                        const item = detail.selectedItems[0] as any | undefined;
                        if (item) fetchGroupDetail(item.GroupName);
                      }}
                    />
                  </Container>

                  {selectedGroup && groupDetail && (
                    <Container header={
                      <Header variant="h2" actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button onClick={() => openAttachPolicy("group", groupDetail.GroupName)}>Attach Policy</Button>
                          <Button onClick={() => setDeleteConfirm({ type: "group", name: groupDetail.GroupName })} formAction="none">Delete Group</Button>
                        </SpaceBetween>
                      }>Group: {groupDetail.GroupName}</Header>
                    }>
                      {groupDetailLoading ? <Box>Loading...</Box> : (
                        <SpaceBetween size="m">
                          <Box>
                            <SpaceBetween size="xs">
                              <strong>Group Name:</strong> {groupDetail.GroupName}
                              <strong>Group ID:</strong> {groupDetail.GroupId || "—"}
                              <strong>ARN:</strong> {groupDetail.Arn || "—"}
                              <strong>Path:</strong> {groupDetail.Path || "/"}
                              <strong>Created:</strong> {groupDetail.CreateDate || "—"}
                            </SpaceBetween>
                          </Box>
                          <Tabs
                            activeTabId={groupDetailTab}
                            onChange={({ detail }) => setGroupDetailTab(detail.activeTabId)}
                            tabs={[
                              { label: "Users", id: "users", content: groupDetailTabContent() },
                              { label: "Permissions", id: "permissions", content: groupDetailTabContent() },
                            ]}
                          />
                        </SpaceBetween>
                      )}
                    </Container>
                  )}
                </SpaceBetween>
              ),
            },
          ]}
        />

        {/* Create User Modal */}
        <Modal visible={createUserModal} onDismiss={() => setCreateUserModal(false)} header="Create IAM User"
          footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setCreateUserModal(false)}>Cancel</Button><Button variant="primary" onClick={createUser}>Create</Button></SpaceBetween>}>
          <FormField label="User Name"><Input value={newUserName} onChange={(e) => setNewUserName((e as any).detail?.value || "")} /></FormField>
        </Modal>

        {/* Create Role Modal */}
        <Modal visible={createRoleModal} onDismiss={() => setCreateRoleModal(false)} header="Create IAM Role"
          footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setCreateRoleModal(false)}>Cancel</Button><Button variant="primary" onClick={createRole}>Create</Button></SpaceBetween>}>
          <FormField label="Role Name"><Input value={newRoleName} onChange={(e) => setNewRoleName((e as any).detail?.value || "")} /></FormField>
          <IamPolicyEditor label="Trust Policy" value={policyDoc} onChange={setPolicyDoc} />
        </Modal>

        {/* Create Group Modal */}
        <Modal visible={createGroupModal} onDismiss={() => setCreateGroupModal(false)} header="Create IAM Group"
          footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setCreateGroupModal(false)}>Cancel</Button><Button variant="primary" onClick={createGroup}>Create</Button></SpaceBetween>}>
          <FormField label="Group Name"><Input value={newGroupName} onChange={(e) => setNewGroupName((e as any).detail?.value || "")} /></FormField>
        </Modal>

        {/* Attach Policy Modal */}
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

        {/* Add User to Group Modal */}
        <Modal visible={addUserToGroupModal} onDismiss={() => setAddUserToGroupModal(false)} header="Add User to Group"
          footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setAddUserToGroupModal(false)}>Cancel</Button><Button variant="primary" onClick={addUserToGroup}>Add</Button></SpaceBetween>}>
          <FormField label="Select User">
            <Select
              selectedOption={addUserToGroupSelect ? { label: addUserToGroupSelect, value: addUserToGroupSelect } : null}
              options={data.users.map((u: any) => ({ label: u.UserName, value: u.UserName }))}
              onChange={({ detail }) => setAddUserToGroupSelect(detail.selectedOption?.value || "")}
              placeholder="Select a user"
            />
          </FormField>
        </Modal>

        {/* Delete Confirmation Modals */}
        {deleteConfirm && (
          <ConfirmModal
            visible={true}
            resourceName={deleteConfirm.name}
            resourceType={deleteConfirm.type}
            onConfirm={executeDelete}
            onDismiss={() => setDeleteConfirm(null)}
          />
        )}
      </SpaceBetween>

      <CrossServiceLinks links={CROSS_SERVICE_LINKS["/iam"] || []} />
    </div>
  );
}
