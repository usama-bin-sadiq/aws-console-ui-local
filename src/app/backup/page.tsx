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

interface BackupVault {
  BackupVaultName: string;
  NumberOfRecoveryPoints: number;
  BackupVaultArn: string;
}

export default function BackupPage() {
  const [vaults, setVaults] = useState<BackupVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [vaultName, setVaultName] = useState("");

  const fetchVaults = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVaults(data.backupVaults || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaults();
  }, []);

  const createVault = async () => {
    await fetch("/api/backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createVault", vaultName }),
    });
    setCreateModal(false);
    setVaultName("");
    fetchVaults();
  };

  const deleteVault = async (name: string) => {
    await fetch(`/api/backup?vaultName=${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    fetchVaults();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Backup</Header>
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Container>
          <Table
            header={
              <Header
                variant="h2"
                actions={
                  <Button onClick={() => setCreateModal(true)}>
                    Create backup vault
                  </Button>
                }
              >
                Backup Vaults ({vaults.length})
              </Header>
            }
            items={vaults}
            loading={loading}
            columnDefinitions={[
              {
                header: "Vault Name",
                cell: (i) => i.BackupVaultName,
              },
              {
                header: "Recovery Points",
                cell: (i) => i.NumberOfRecoveryPoints,
              },
              {
                header: "ARN",
                cell: (i) => i.BackupVaultArn,
              },
              {
                header: "Actions",
                cell: (i) => (
                  <Button
                    onClick={() => deleteVault(i.BackupVaultName)}
                    formAction="none"
                  >
                    Delete
                  </Button>
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
                disabled={!vaultName.trim()}
              >
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Vault name">
            <Input
              value={vaultName}
              onChange={(e) => setVaultName(e.detail.value)}
              placeholder="my-backup-vault"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
