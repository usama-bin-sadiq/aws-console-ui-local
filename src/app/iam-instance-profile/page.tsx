"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Select from "@cloudscape-design/components/select";
import Alert from "@cloudscape-design/components/alert";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";

interface InstanceProfile {
    InstanceProfileId: string;
    InstanceProfileName: string;
    Path: string;
    Roles?: Array<{ RoleName: string }>;
}

interface RoleOption {
    label?: string;
    value?: string;
}

export default function IAMInstanceProfilePage() {
    const [instanceProfiles, setInstanceProfiles] = useState<InstanceProfile[]>([]);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [loading, setLoading] = useState(true);
    const [createModal, setCreateModal] = useState(false);
    const [profileName, setProfileName] = useState("");
    const [selectedProfile, setSelectedProfile] = useState<InstanceProfile | null>(null);
    const [selectedRole, setSelectedRole] = useState<RoleOption | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [profileNameError, setProfileNameError] = useState<string | null>(null);

    const fetchProfiles = async (): Promise<void> => {
        setLoading(true);
        try {
            const [profilesResponse, iamResponse] = await Promise.all([fetch("/api/iam-instance-profile"), fetch("/api/iam")]);
            const profilesData = await profilesResponse.json() as { instanceProfiles?: InstanceProfile[]; error?: string };
            const iamData = await iamResponse.json() as { roles?: Array<{ RoleName?: string }>; error?: string };
            if (!profilesResponse.ok) throw new Error(profilesData.error || "Failed to load instance profiles");
            if (!iamResponse.ok) throw new Error(iamData.error || "Failed to load IAM roles");
            setInstanceProfiles(profilesData.instanceProfiles || []);
            setRoles((iamData.roles || []).flatMap((role) => role.RoleName ? [{ label: role.RoleName, value: role.RoleName }] : []));
        } catch (cause: unknown) {
            setError(cause instanceof Error ? cause.message : "Failed to load instance profiles");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchProfiles();
    }, []);

    const createProfile = async (): Promise<void> => {
        if (!profileName.trim()) {
            setProfileNameError("Instance profile name is required");
            return;
        }
        setProfileNameError(null);
        const response = await fetch("/api/iam-instance-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: profileName.trim() }),
        });
        if (!response.ok) {
            const data = await response.json() as { error?: string };
            setError(data.error || "Failed to create instance profile");
            return;
        }
        setCreateModal(false);
        setProfileName("");
        await fetchProfiles();
    };

    const deleteProfile = async (name: string): Promise<void> => {
        const response = await fetch(`/api/iam-instance-profile?name=${encodeURIComponent(name)}`, { method: "DELETE" });
        if (!response.ok) {
            const data = await response.json() as { error?: string };
            setError(data.error || "Failed to delete instance profile");
            return;
        }
        await fetchProfiles();
    };

    const updateRole = async (action: "addRole" | "removeRole"): Promise<void> => {
        if (!selectedProfile || !selectedRole) return;
        const response = await fetch("/api/iam-instance-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action, profileName: selectedProfile.InstanceProfileName, roleName: selectedRole.value }),
        });
        if (!response.ok) {
            const data = await response.json() as { error?: string };
            setError(data.error || `Failed to ${action === "addRole" ? "attach" : "remove"} role`);
            return;
        }
        setSelectedProfile(null);
        setSelectedRole(null);
        await fetchProfiles();
    };

    return (
        <div style={{ padding: "16px" }}>
            <SpaceBetween size="l">
                <Header variant="h1">IAM Instance Profiles</Header>
                {error ? <Alert type="error" dismissible onDismiss={() => setError(null)}>{error}</Alert> : null}
                <Container header={<Header variant="h2" actions={<Button onClick={() => setCreateModal(true)}>Create Instance Profile</Button>}>Instance Profiles</Header>}>
                    <Table
                        items={instanceProfiles}
                        loading={loading}
                        columnDefinitions={[
                            { header: "Name", cell: (item) => item.InstanceProfileName },
                            { header: "ID", cell: (item) => item.InstanceProfileId },
                            { header: "Roles", cell: (item) => item.Roles?.map((role) => role.RoleName).join(", ") || "-" },
                            { header: "Actions", cell: (item) => <SpaceBetween direction="horizontal" size="xs"><Button onClick={() => { setSelectedProfile(item); setSelectedRole(null); }} formAction="none">Manage role</Button><Button onClick={() => void deleteProfile(item.InstanceProfileName)} formAction="none">Delete</Button></SpaceBetween> },
                        ]}
                        empty={<Box>No instance profiles found.</Box>}
                    />
                </Container>
                {selectedProfile ? <Container header={<Header variant="h2">Manage role: {selectedProfile.InstanceProfileName}</Header>}>
                    <SpaceBetween size="m">
                        <Select selectedOption={selectedRole} options={roles} placeholder="Select an IAM role" onChange={({ detail }) => setSelectedRole(detail?.selectedOption)} />
                        <SpaceBetween direction="horizontal" size="xs"><Button variant="primary" onClick={() => void updateRole("addRole")} disabled={!selectedRole}>Attach role</Button><Button onClick={() => void updateRole("removeRole")} disabled={!selectedRole}>Remove role</Button><Button onClick={() => setSelectedProfile(null)}>Cancel</Button></SpaceBetween>
                    </SpaceBetween>
                </Container> : null}
            </SpaceBetween>
            <Modal visible={createModal} onDismiss={() => setCreateModal(false)} header="Create Instance Profile" footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setCreateModal(false)}>Cancel</Button><Button variant="primary" onClick={() => void createProfile}>Create</Button></SpaceBetween>}>
                <FormField label={<>Instance Profile Name <span style={{ color: "red" }}>*</span></>} errorText={profileNameError}><Input value={profileName} onChange={(event) => { setProfileName(event.detail.value); setProfileNameError(null); }} /></FormField>
            </Modal>
        </div>
    );
}
