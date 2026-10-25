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

interface Detector {
  DetectorId: string;
}

export default function SecurityHubPage() {
  const router = useRouter();
  const [detectors, setDetectors] = useState<Detector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ detectorId: string } | null>(null);

  const fetchDetectors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/security-hub");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDetectors(data.detectors || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch detectors");
      setDetectors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDetectors();
  }, [fetchDetectors]);

  const createDetector = async () => {
    try {
      const res = await apiFetch("/api/security-hub", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error("Failed to create detector");
      setCreateModal(false);
      fetchDetectors();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create detector");
    }
  };

  const deleteDetector = async (detectorId: string) => {
    try {
      const res = await apiFetch(
        `/api/security-hub?detectorId=${encodeURIComponent(detectorId)}`,
        {
          method: "DELETE",
        },
      );
      if (!res.ok) throw new Error("Failed to delete detector");
      setDeleteModal(null);
      fetchDetectors();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete detector");
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS Security Hub"
          serviceIcon={SERVICE_ICONS["/security-hub"]?.small}
          counter={detectors.length}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => setCreateModal(true)}
            >
              Create hub
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
            header={<Box variant="h2">Security Hubs ({detectors.length})</Box>}
            items={detectors}
            loading={loading}
            columnDefinitions={[
              {
                id: "detectorId",
                header: "Hub ID",
                cell: (item) => item.DetectorId || "—",
                sortingField: "DetectorId",
                isRowHeader: true,
              },
              {
                id: "actions",
                header: "Actions",
                cell: (item) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      variant="inline-link"
                      onClick={() => setDeleteModal({ detectorId: item.DetectorId })}
                      formAction="none"
                    >
                      Delete
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
            empty={<Box textAlign="center">No Security Hubs found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create Security Hub"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createDetector}>
                Create hub
              </Button>
            </SpaceBetween>
          }
        >
          <Box variant="p">
            Enabling Security Hub will start collecting security findings across your account.
          </Box>
        </Modal>

        {deleteModal && (
          <Modal
            visible
            onDismiss={() => setDeleteModal(null)}
            header="Delete Security Hub"
            footer={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setDeleteModal(null)}>Cancel</Button>
                <Button variant="primary" onClick={() => deleteDetector(deleteModal.detectorId)}>
                  Delete
                </Button>
              </SpaceBetween>
            }
          >
            <Box variant="p">
              Are you sure you want to delete the Security Hub{" "}
              <strong>{deleteModal.detectorId}</strong>?
            </Box>
          </Modal>
        )}
      </SpaceBetween>
    </div>
  );
}
