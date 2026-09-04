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
                  <Button variant="primary" onClick={() => setCreateModal(true)}>
                    Create Auto Scaling group
                  </Button>
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
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteGroup(item.AutoScalingGroupName)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No Auto Scaling groups found.</Box>}
          />
        </Container>

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
      </SpaceBetween>
    </div>
  );
}
