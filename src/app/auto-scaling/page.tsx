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

interface AutoScalingGroup {
  AutoScalingGroupName: string;
  MinSize: number;
  MaxSize: number;
  DesiredCapacity: number;
  Status?: string;
  LaunchConfigurationName?: string;
}

interface LaunchConfiguration {
  LaunchConfigurationName?: string;
  ImageId?: string;
  InstanceType?: string;
  CreatedTime?: string;
}

interface ScalingPolicy {
  PolicyName?: string;
  PolicyType?: string;
  AdjustmentType?: string;
  ScalingAdjustment?: number;
  AutoScalingGroupName?: string;
}

interface ScheduledAction {
  ScheduledActionName?: string;
  AutoScalingGroupName?: string;
  Recurrence?: string;
  MinSize?: number;
  MaxSize?: number;
  DesiredCapacity?: number;
}

export default function AutoScalingPage() {
  const [groups, setGroups] = useState<AutoScalingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createModal, setCreateModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [minSize, setMinSize] = useState("1");
  const [maxSize, setMaxSize] = useState("3");
  const [desiredCapacity, setDesiredCapacity] = useState("1");
  const [creating, setCreating] = useState(false);

  const [updateModal, setUpdateModal] = useState(false);
  const [updateGroupName, setUpdateGroupName] = useState("");
  const [updateMin, setUpdateMin] = useState("1");
  const [updateMax, setUpdateMax] = useState("3");
  const [updateDesired, setUpdateDesired] = useState("1");
  const [updating, setUpdating] = useState(false);

  const [launchConfigs, setLaunchConfigs] = useState<LaunchConfiguration[]>([]);
  const [launchConfigLoading, setLaunchConfigLoading] = useState(false);
  const [launchConfigModal, setLaunchConfigModal] = useState(false);
  const [launchConfigName, setLaunchConfigName] = useState("");
  const [launchImage, setLaunchImage] = useState("ami-123456");
  const [launchType, setLaunchType] = useState("t3.micro");
  const [launchCreating, setLaunchCreating] = useState(false);

  const [policies, setPolicies] = useState<ScalingPolicy[]>([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);
  const [policyModal, setPolicyModal] = useState(false);
  const [policyName, setPolicyName] = useState("");
  const [policyAdjustment, setPolicyAdjustment] = useState("1");
  const [policyCreating, setPolicyCreating] = useState(false);

  const [scheduledActions, setScheduledActions] = useState<ScheduledAction[]>([]);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [scheduledModal, setScheduledModal] = useState(false);
  const [scheduledName, setScheduledName] = useState("");
  const [scheduledCreating, setScheduledCreating] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auto-scaling");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch Auto Scaling groups");
      setGroups(data.autoScalingGroups || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Auto Scaling groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const createGroup = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/auto-scaling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupName,
          minSize: parseInt(minSize, 10) || 1,
          maxSize: parseInt(maxSize, 10) || 3,
          desiredCapacity: parseInt(desiredCapacity, 10) || 1,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create Auto Scaling group");
      }
      setCreateModal(false);
      setGroupName("");
      setMinSize("1");
      setMaxSize("3");
      setDesiredCapacity("1");
      fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create Auto Scaling group");
    } finally {
      setCreating(false);
    }
  };

  const deleteGroup = async (name: string) => {
    try {
      const res = await fetch(`/api/auto-scaling?groupName=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete Auto Scaling group");
      }
      fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete Auto Scaling group");
    }
  };

  const openUpdate = (group: AutoScalingGroup) => {
    setUpdateGroupName(group.AutoScalingGroupName);
    setUpdateMin(String(group.MinSize || 1));
    setUpdateMax(String(group.MaxSize || 3));
    setUpdateDesired(String(group.DesiredCapacity || 1));
    setUpdateModal(true);
  };

  const updateGroup = async () => {
    setUpdating(true);
    try {
      const res = await fetch("/api/auto-scaling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateGroup",
          groupName: updateGroupName,
          minSize: parseInt(updateMin, 10) || 1,
          maxSize: parseInt(updateMax, 10) || 3,
          desiredCapacity: parseInt(updateDesired, 10) || 1,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update group");
      }
      setUpdateModal(false);
      fetchGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update group");
    } finally {
      setUpdating(false);
    }
  };

  const fetchLaunchConfigs = async () => {
    setLaunchConfigLoading(true);
    try {
      const res = await fetch("/api/auto-scaling?action=launchConfigurations");
      const data = await res.json();
      setLaunchConfigs(data.launchConfigurations || []);
      setLaunchConfigModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load launch configurations");
    } finally {
      setLaunchConfigLoading(false);
    }
  };

  const createLaunchConfig = async () => {
    setLaunchCreating(true);
    try {
      const res = await fetch("/api/auto-scaling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createLaunchConfiguration",
          launchConfigurationName: launchConfigName,
          imageId: launchImage,
          instanceType: launchType,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create launch configuration");
      }
      setLaunchConfigName("");
      setLaunchImage("ami-123456");
      setLaunchType("t3.micro");
      fetchLaunchConfigs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create launch config");
    } finally {
      setLaunchCreating(false);
    }
  };

  const fetchPolicies = async (groupName: string) => {
    setPoliciesLoading(true);
    try {
      const res = await fetch(`/api/auto-scaling?action=scalingPolicies&groupName=${encodeURIComponent(groupName)}`);
      const data = await res.json();
      setPolicies(data.scalingPolicies || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load policies");
    } finally {
      setPoliciesLoading(false);
    }
  };

  const createPolicy = async () => {
    setPolicyCreating(true);
    try {
      const res = await fetch("/api/auto-scaling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createScalingPolicy",
          groupName: groups[0]?.AutoScalingGroupName || "my-asg",
          policyName,
          scalingAdjustment: parseInt(policyAdjustment, 10) || 1,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create policy");
      }
      setPolicyName("");
      setPolicyAdjustment("1");
      setPolicyModal(false);
      if (groups.length > 0) fetchPolicies(groups[0].AutoScalingGroupName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create policy");
    } finally {
      setPolicyCreating(false);
    }
  };

  const fetchScheduledActions = async (groupName: string) => {
    setScheduledLoading(true);
    try {
      const res = await fetch(`/api/auto-scaling?action=scheduledActions&groupName=${encodeURIComponent(groupName)}`);
      const data = await res.json();
      setScheduledActions(data.scheduledActions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scheduled actions");
    } finally {
      setScheduledLoading(false);
    }
  };

  const createScheduledAction = async () => {
    setScheduledCreating(true);
    try {
      const res = await fetch("/api/auto-scaling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createScheduledAction",
          groupName: groups[0]?.AutoScalingGroupName || "my-asg",
          scheduledActionName: scheduledName,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create scheduled action");
      }
      setScheduledName("");
      setScheduledModal(false);
      if (groups.length > 0) fetchScheduledActions(groups[0].AutoScalingGroupName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create scheduled action");
    } finally {
      setScheduledCreating(false);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Auto Scaling Groups</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            header={
              <Header
                variant="h2"
                actions={
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="primary" onClick={() => setCreateModal(true)}>
                      Create Auto Scaling group
                    </Button>
                    <Button onClick={fetchLaunchConfigs}>Launch configurations</Button>
                    <Button onClick={() => setPolicyModal(true)}>Scaling policies</Button>
                    <Button onClick={() => setScheduledModal(true)}>Scheduled actions</Button>
                  </SpaceBetween>
                }
              >
                Auto Scaling groups ({groups.length})
              </Header>
            }
            items={groups}
            columnDefinitions={[
              { header: "Name", cell: (item) => item.AutoScalingGroupName },
              { header: "Min size", cell: (item) => item.MinSize },
              { header: "Max size", cell: (item) => item.MaxSize },
              { header: "Desired capacity", cell: (item) => item.DesiredCapacity },
              { header: "Launch config", cell: (item) => item.LaunchConfigurationName || "—" },
              {
                header: "Actions",
                cell: (item) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => openUpdate(item)} formAction="none">
                      Update
                    </Button>
                    <Button
                      onClick={() => {
                        fetchPolicies(item.AutoScalingGroupName);
                        fetchScheduledActions(item.AutoScalingGroupName);
                      }}
                      formAction="none"
                    >
                      Policies / Schedule
                    </Button>
                    <Button onClick={() => deleteGroup(item.AutoScalingGroupName)} formAction="none">
                      Delete
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No Auto Scaling groups found.</Box>}
          />
        </Container>

        {policies.length > 0 || scheduledActions.length > 0 ? (
          <SpaceBetween size="m">
            {policies.length > 0 && (
              <Container>
                <Header variant="h2">Scaling Policies</Header>
                <Table
                  items={policies}
                  loading={policiesLoading}
                  columnDefinitions={[
                    { header: "Policy name", cell: (item) => item.PolicyName || "—" },
                    { header: "Type", cell: (item) => item.PolicyType || "—" },
                    { header: "Adjustment", cell: (item) => item.AdjustmentType || String(item.ScalingAdjustment || "—") },
                  ]}
                  empty={<Box textAlign="center">No scaling policies.</Box>}
                />
              </Container>
            )}
            {scheduledActions.length > 0 && (
              <Container>
                <Header variant="h2">Scheduled Actions</Header>
                <Table
                  items={scheduledActions}
                  loading={scheduledLoading}
                  columnDefinitions={[
                    { header: "Name", cell: (item) => item.ScheduledActionName || "—" },
                    { header: "Recurrence", cell: (item) => item.Recurrence || "—" },
                    { header: "Min", cell: (item) => item.MinSize ?? "—" },
                    { header: "Max", cell: (item) => item.MaxSize ?? "—" },
                  ]}
                  empty={<Box textAlign="center">No scheduled actions.</Box>}
                />
              </Container>
            )}
          </SpaceBetween>
        ) : null}

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create Auto Scaling group"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createGroup} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Group name" constraintText="Required">
              <Input
                value={groupName}
                onChange={(e) => setGroupName(e.detail.value)}
                placeholder="my-asg"
              />
            </FormField>
            <FormField label="Minimum size">
              <Input
                value={minSize}
                onChange={(e) => setMinSize(e.detail.value)}
                type="number"
                placeholder="1"
              />
            </FormField>
            <FormField label="Maximum size">
              <Input
                value={maxSize}
                onChange={(e) => setMaxSize(e.detail.value)}
                type="number"
                placeholder="3"
              />
            </FormField>
            <FormField label="Desired capacity">
              <Input
                value={desiredCapacity}
                onChange={(e) => setDesiredCapacity(e.detail.value)}
                type="number"
                placeholder="1"
              />
            </FormField>
          </SpaceBetween>
        </Modal>

        <Modal
          visible={updateModal}
          onDismiss={() => setUpdateModal(false)}
          header="Update Auto Scaling group"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setUpdateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={updateGroup} loading={updating}>
                Update
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Group name">
              <Input value={updateGroupName} disabled />
            </FormField>
            <FormField label="Minimum size">
              <Input value={updateMin} onChange={(e) => setUpdateMin(e.detail.value)} type="number" />
            </FormField>
            <FormField label="Maximum size">
              <Input value={updateMax} onChange={(e) => setUpdateMax(e.detail.value)} type="number" />
            </FormField>
            <FormField label="Desired capacity">
              <Input value={updateDesired} onChange={(e) => setUpdateDesired(e.detail.value)} type="number" />
            </FormField>
          </SpaceBetween>
        </Modal>

        <Modal
          visible={launchConfigModal}
          onDismiss={() => setLaunchConfigModal(false)}
          header="Launch Configurations"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setLaunchConfigModal(false)}>Close</Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <Table
              items={launchConfigs}
              loading={launchConfigLoading}
              columnDefinitions={[
                { header: "Name", cell: (item) => item.LaunchConfigurationName || "—" },
                { header: "Image", cell: (item) => item.ImageId || "—" },
                { header: "Type", cell: (item) => item.InstanceType || "—" },
                { header: "Created", cell: (item) => item.CreatedTime || "—" },
              ]}
              empty={<Box textAlign="center">No launch configurations.</Box>}
            />
            <FormField label="Create new launch configuration">
              <SpaceBetween direction="vertical" size="s">
                <Input
                  value={launchConfigName}
                  onChange={(e) => setLaunchConfigName(e.detail.value)}
                  placeholder="Launch config name"
                />
                <Input value={launchImage} onChange={(e) => setLaunchImage(e.detail.value)} placeholder="AMI ID" />
                <Input value={launchType} onChange={(e) => setLaunchType(e.detail.value)} placeholder="Instance type" />
                <Button variant="primary" onClick={createLaunchConfig} loading={launchCreating}>
                  Create
                </Button>
              </SpaceBetween>
            </FormField>
          </SpaceBetween>
        </Modal>

        <Modal
          visible={policyModal}
          onDismiss={() => setPolicyModal(false)}
          header="Create Scaling Policy"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setPolicyModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createPolicy} loading={policyCreating}>Create</Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Policy name">
              <Input value={policyName} onChange={(e) => setPolicyName(e.detail.value)} placeholder="ScaleUp" />
            </FormField>
            <FormField label="Scaling adjustment">
              <Input value={policyAdjustment} onChange={(e) => setPolicyAdjustment(e.detail.value)} type="number" placeholder="1" />
            </FormField>
          </SpaceBetween>
        </Modal>

        <Modal
          visible={scheduledModal}
          onDismiss={() => setScheduledModal(false)}
          header="Create Scheduled Action"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setScheduledModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createScheduledAction} loading={scheduledCreating}>Create</Button>
            </SpaceBetween>
          }
        >
          <FormField label="Scheduled action name">
            <Input value={scheduledName} onChange={(e) => setScheduledName(e.detail.value)} placeholder="scheduled-action" />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
