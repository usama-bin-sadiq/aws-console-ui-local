"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState, useCallback } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Tabs from "@cloudscape-design/components/tabs";
import Select from "@cloudscape-design/components/select";
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface IamGroupDetail {
  GroupName: string;
  GroupId: string;
  Arn?: string;
  Path: string;
  CreateDate?: string;
  AttachedPolicies?: Array<{ PolicyName: string; PolicyArn: string }>;
  Users?: Array<{ UserName: string; UserId?: string }>;
}

interface PolicyItem {
  PolicyName: string;
  PolicyArn: string;
}

interface UserItem {
  UserName: string;
  UserId?: string;
  Arn?: string;
}

export default function IAMGroupPage() {
  const [groups, setGroups] = useState<IamGroupDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [createModal, setCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupDetail, setGroupDetail] = useState<IamGroupDetail | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [attachPolicyModal, setAttachPolicyModal] = useState(false);
  const [policyArn, setPolicyArn] = useState("");
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [addUserModal, setAddUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [groupNameError, setGroupNameError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/iam-group");
      const data = await res.json();
      setGroups(data.groups || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchGroups();
    });
  }, [fetchGroups]);

  const fetchGroupDetail = useCallback(async (name: string) => {
    setGroupLoading(true);
    setSelectedGroup(name);
    try {
      const res = await apiFetch(
        `/api/iam-group?action=getGroup&groupName=${encodeURIComponent(name)}`,
      );
      const data = await res.json();
      setGroupDetail(
        data.group || { GroupName: name, GroupId: "", Path: "/", Users: [], AttachedPolicies: [] },
      );
    } catch {}
    setGroupLoading(false);
  }, []);

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await apiFetch("/api/iam");
      const data = await res.json();
      setPolicies(
        (data.policies || []).map((p: any) => ({
          PolicyName: p.PolicyName || "",
          PolicyArn: p.Arn || "",
        })),
      );
    } catch {}
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await apiFetch("/api/iam");
      const data = await res.json();
      setUsers(
        (data.users || []).map((u: any) => ({
          UserName: u.UserName || "",
          UserId: u.UserId || "",
          Arn: u.Arn || "",
        })),
      );
    } catch {}
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchPolicies();
    });
    queueMicrotask(() => {
      fetchUsers();
    });
  }, [fetchPolicies, fetchUsers]);

  const createGroup = async () => {
    if (!groupName.trim()) {
      setGroupNameError("Group name is required");
      return;
    }
    setGroupNameError(null);
    await apiFetch("/api/iam-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupName }),
    });
    setCreateModal(false);
    setGroupName("");
    fetchGroups();
  };

  const deleteGroup = async (name: string) => {
    await apiFetch(`/api/iam-group?groupName=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchGroups();
    if (selectedGroup === name) {
      setSelectedGroup(null);
      setGroupDetail(null);
    }
  };

  const attachPolicy = async () => {
    await apiFetch("/api/iam-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "attachPolicy", groupName: selectedGroup, policyArn }),
    });
    setAttachPolicyModal(false);
    setPolicyArn("");
    if (selectedGroup) fetchGroupDetail(selectedGroup);
  };

  const detachPolicy = async (policyArn: string) => {
    await apiFetch("/api/iam-group", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "detachPolicy", groupName: selectedGroup, policyArn }),
    });
    if (selectedGroup) fetchGroupDetail(selectedGroup);
  };

  const addUserToGroup = async () => {
    await apiFetch("/api/iam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addUserToGroup",
        groupName: selectedGroup,
        userName: selectedUser,
      }),
    });
    setAddUserModal(false);
    setSelectedUser("");
    if (selectedGroup) fetchGroupDetail(selectedGroup);
  };

  const removeUserFromGroup = async (userName: string) => {
    await apiFetch("/api/iam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "removeUserFromGroup", groupName: selectedGroup, userName }),
    });
    if (selectedGroup) fetchGroupDetail(selectedGroup);
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="IAM Groups"
          serviceIcon={SERVICE_ICONS["/iam-group"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/iam-group/create")}
          >
            Create group
          </button>
        />
        <Tabs
          tabs={[
            {
              label: "Groups",
              id: "groups",
              content: (
                <Container
                  header={
                    <Header
                      variant="h2"
                      actions={<Button onClick={() => setCreateModal(true)}>Create Group</Button>}
                    >
                      Groups
                    </Header>
                  }
                  className="aws-table-card"
                >
                  <Table
                    items={groups}
                    loading={loading}
                    columnDefinitions={[
                      { header: "Group Name", cell: (item: IamGroupDetail) => item.GroupName },
                      { header: "Group ID", cell: (item: IamGroupDetail) => item.GroupId },
                      { header: "ARN", cell: (item: IamGroupDetail) => item.Arn || "—" },
                      { header: "Path", cell: (item: IamGroupDetail) => item.Path },
                      {
                        header: "Actions",
                        cell: (item: IamGroupDetail) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button
                              onClick={() => fetchGroupDetail(item.GroupName)}
                              formAction="none"
                            >
                              View
                            </Button>
                            <Button onClick={() => deleteGroup(item.GroupName)} formAction="none">
                              Delete
                            </Button>
                          </SpaceBetween>
                        ),
                      },
                    ]}
                    empty={<Box>No groups found.</Box>}
                    selectionType="single"
                    onSelectionChange={({ detail }) => {
                      const item = detail.selectedItems[0] as IamGroupDetail | undefined;
                      if (item) fetchGroupDetail(item.GroupName);
                    }}
                  />
                </Container>
              ),
            },
            ...(selectedGroup
              ? [
                  {
                    label: `Group: ${selectedGroup}`,
                    id: "group-detail",
                    content: (
                      <Container
                        header={
                          <Header
                            variant="h2"
                            actions={
                              <SpaceBetween direction="horizontal" size="xs">
                                <Button onClick={() => setAttachPolicyModal(true)}>
                                  Attach Policy
                                </Button>
                                <Button onClick={() => setAddUserModal(true)}>Add User</Button>
                              </SpaceBetween>
                            }
                          >
                            Group Details
                          </Header>
                        }
                        className="aws-table-card"
                      >
                        <SpaceBetween size="m">
                          <Box>
                            <SpaceBetween size="xs">
                              <strong>Group Name:</strong> {groupDetail?.GroupName || selectedGroup}
                              <strong>Group ID:</strong> {groupDetail?.GroupId || "—"}
                              <strong>Path:</strong> {groupDetail?.Path || "/"}
                              <strong>ARN:</strong> {groupDetail?.Arn || "—"}
                            </SpaceBetween>
                          </Box>

                          <Header variant="h3">Attached Policies</Header>
                          {groupDetail?.AttachedPolicies &&
                          groupDetail.AttachedPolicies.length > 0 ? (
                            <Table
                              items={groupDetail.AttachedPolicies}
                              columnDefinitions={[
                                { header: "Policy Name", cell: (p: any) => p.PolicyName },
                                { header: "ARN", cell: (p: any) => p.PolicyArn },
                                {
                                  header: "Actions",
                                  cell: (p: any) => (
                                    <Button
                                      onClick={() => detachPolicy(p.PolicyArn)}
                                      formAction="none"
                                    >
                                      Detach
                                    </Button>
                                  ),
                                },
                              ]}
                              empty={<Box>No attached policies.</Box>}
                            />
                          ) : (
                            <Box>No attached policies.</Box>
                          )}

                          <Header variant="h3">Members</Header>
                          {groupDetail?.Users && groupDetail.Users.length > 0 ? (
                            <Table
                              items={groupDetail.Users}
                              columnDefinitions={[
                                { header: "User Name", cell: (u: any) => u.UserName },
                                { header: "User ID", cell: (u: any) => u.UserId || "—" },
                                {
                                  header: "Actions",
                                  cell: (u: any) => (
                                    <Button
                                      onClick={() => removeUserFromGroup(u.UserName)}
                                      formAction="none"
                                    >
                                      Remove
                                    </Button>
                                  ),
                                },
                              ]}
                              empty={<Box>No members.</Box>}
                            />
                          ) : (
                            <Box>No members.</Box>
                          )}
                        </SpaceBetween>
                      </Container>
                    ),
                  },
                ]
              : []),
          ]}
        />

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
          <FormField
            label={
              <>
                Group Name <span style={{ color: "red" }}>*</span>
              </>
            }
            errorText={groupNameError}
          >
            <Input
              value={groupName}
              onChange={(e: { detail?: { value?: string } }) => {
                setGroupName(e.detail?.value || "");
                setGroupNameError(null);
              }}
            />
          </FormField>
        </Modal>

        <Modal
          visible={attachPolicyModal}
          onDismiss={() => setAttachPolicyModal(false)}
          header="Attach Policy"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setAttachPolicyModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={attachPolicy}>
                Attach
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Policy ARN">
            <Select
              selectedOption={policyArn ? { label: policyArn, value: policyArn } : null}
              options={policies.map((p) => ({
                label: p.PolicyName,
                value: p.PolicyArn,
                description: p.PolicyArn,
              }))}
              onChange={({ detail }) => setPolicyArn(detail.selectedOption?.value || "")}
              placeholder="Select a policy"
            />
          </FormField>
        </Modal>

        <Modal
          visible={addUserModal}
          onDismiss={() => setAddUserModal(false)}
          header="Add User to Group"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setAddUserModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={addUserToGroup}>
                Add
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="User Name">
            <Select
              selectedOption={selectedUser ? { label: selectedUser, value: selectedUser } : null}
              options={users.map((u) => ({
                label: u.UserName,
                value: u.UserName,
                description: u.UserId || "",
              }))}
              onChange={({ detail }) => setSelectedUser(detail.selectedOption?.value || "")}
              placeholder="Select a user"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
