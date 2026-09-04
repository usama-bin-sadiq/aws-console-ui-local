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

interface InstanceProfile {
  InstanceProfileId: string;
  InstanceProfileName: string;
  Path: string;
  Roles?: { RoleName: string }[];
}

export default function IAMInstanceProfilePage() {
  const [instanceProfiles, setInstanceProfiles] = useState<InstanceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [profileName, setProfileName] = useState("");

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/iam-instance-profile");
      const data = await res.json();
      setInstanceProfiles(data.instanceProfiles || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const createProfile = async () => {
    await fetch("/api/iam-instance-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: profileName }),
    });
    setCreateModal(false);
    setProfileName("");
    fetchProfiles();
  };

  const deleteProfile = async (name: string) => {
    await fetch(`/api/iam-instance-profile?name=${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    fetchProfiles();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">IAM Instance Profiles</Header>
        <Container
          header={
            <Header
              variant="h2"
              actions={<Button onClick={() => setCreateModal(true)}>Create Instance Profile</Button>}
            >
              Instance Profiles
            </Header>
          }
        >
          <Table
            items={instanceProfiles}
            loading={loading}
            columnDefinitions={[
              { header: "Name", cell: (item) => item.InstanceProfileName },
              { header: "ID", cell: (item) => item.InstanceProfileId },
              {
                header: "Roles",
                cell: (item) =>
                  item.Roles && item.Roles.length > 0
                    ? item.Roles.map((r) => r.RoleName).join(", ")
                    : "—",
              },
              {
                header: "Actions",
                cell: (item) => (
                  <Button
                    onClick={() => deleteProfile(item.InstanceProfileName)}
                    formAction="none"
                  >
                    Delete
                  </Button>
                ),
              },
            ]}
            empty={<Box>No instance profiles found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create Instance Profile"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createProfile}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Instance Profile Name">
            <Input value={profileName} onChange={(e) => setProfileName(e.detail.value)} />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
