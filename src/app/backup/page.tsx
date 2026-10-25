"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState, useCallback } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface BackupVault {
  BackupVaultName: string;
  NumberOfRecoveryPoints: number;
  BackupVaultArn: string;
}

export default function BackupPage() {
  const router = useRouter();
  const [vaults, setVaults] = useState<BackupVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ vaultName: string } | null>(null);
  const [newVaultName, setNewVaultName] = useState("");

  const fetchVaults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/backup");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVaults(data.backupVaults || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setVaults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVaults();
  }, [fetchVaults]);

  const createVault = async () => {
    try {
      const res = await apiFetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createVault", vaultName: newVaultName }),
      });
      if (!res.ok) throw new Error("Failed to create vault");
      setCreateModal(false);
      setNewVaultName("");
      fetchVaults();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create vault");
    }
  };

  const deleteVault = async (name: string) => {
    try {
      const res = await apiFetch(`/api/backup?vaultName=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete vault");
      setDeleteModal(null);
      fetchVaults();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete vault");
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS Backup"
          serviceIcon={SERVICE_ICONS["/backup"]?.small}
          counter={vaults.length}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => setCreateModal(true)}
            >
              Create backup vault
            </button>
          }
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container className="aws-table-card">
          <Table
            header={<Box variant="h2">Backup Vaults ({vaults.length})</Box>}
            items={vaults}
            loading={loading}
            columnDefinitions={[
              {
                id: "vaultName",
                header: "Vault Name",
                cell: (i) => i.BackupVaultName || "—",
                sortingField: "BackupVaultName",
                isRowHeader: true,
              },
              {
                id: "recoveryPoints",
                header: "Recovery Points",
                cell: (i) => i.NumberOfRecoveryPoints ?? "—",
              },
              {
                id: "arn",
                header: "ARN",
                cell: (i) => i.BackupVaultArn || "—",
              },
              {
                id: "actions",
                header: "Actions",
                cell: (i) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      variant="inline-link"
                      onClick={() => setDeleteModal({ vaultName: i.BackupVaultName })}
                      formAction="none"
                    >
                      Delete
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
            empty={<Box textAlign="center">No backup vaults found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create backup vault"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={createVault}
                disabled={!newVaultName.trim()}
              >
                Create vault
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Vault name">
            <Input
              value={newVaultName}
              onChange={(e) => setNewVaultName(e.detail.value)}
              placeholder="my-backup-vault"
            />
          </FormField>
        </Modal>

        {deleteModal && (
          <Modal
            visible
            onDismiss={() => setDeleteModal(null)}
            header="Delete backup vault"
            footer={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setDeleteModal(null)}>Cancel</Button>
                <Button variant="primary" onClick={() => deleteVault(deleteModal.vaultName)}>
                  Delete
                </Button>
              </SpaceBetween>
            }
          >
            <Box variant="p">
              Are you sure you want to delete the backup vault{" "}
              <strong>{deleteModal.vaultName}</strong>?
            </Box>
          </Modal>
        )}
      </SpaceBetween>
    </div>
  );
}
