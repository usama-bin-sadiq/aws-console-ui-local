"use client";
import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface CloudFrontDistribution {
  Id: string;
  DomainName: string;
  Status: string;
  Comment?: string;
  Enabled?: boolean;
  Origins?: { Quantity?: number; Items?: Array<{ Id?: string; DomainName?: string }> };
}

export default function CloudFrontPage() {
  const [distributions, setDistributions] = useState<CloudFrontDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [invalidationModal, setInvalidationModal] = useState(false);
  const [selectedDistributionId, setSelectedDistributionId] = useState<string>("");
  const [invalidationPaths, setInvalidationPaths] = useState("/*");
  const [updateModal, setUpdateModal] = useState(false);
  const [updateDistributionId, setUpdateDistributionId] = useState<string>("");

  const fetchDistributions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/cloudfront");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDistributions(data.distributions || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributions();
  }, []);

  const createDistribution = async () => {
    await apiFetch("/api/cloudfront", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create" }),
    });
    setCreateModal(false);
    fetchDistributions();
  };

  const updateDistribution = async () => {
    await apiFetch("/api/cloudfront", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        id: updateDistributionId,
        distributionConfig: { Enabled: true, Comment: "Updated via adapter SDK" },
        etag: "dummy",
      }),
    });
    setUpdateModal(false);
    setUpdateDistributionId("");
    fetchDistributions();
  };

  const deleteDistribution = async (id: string) => {
    await apiFetch(`/api/cloudfront?id=${encodeURIComponent(id)}&etag=dummy`, { method: "DELETE" });
    fetchDistributions();
  };

  const createInvalidation = async () => {
    await apiFetch("/api/cloudfront", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "invalidation",
        distributionId: selectedDistributionId,
        paths: [invalidationPaths],
      }),
    });
    setInvalidationModal(false);
    setSelectedDistributionId("");
    setInvalidationPaths("/*");
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l" direction="vertical">
        <SpaceBetween direction="horizontal" size="m" alignItems="center">
          <AwsServiceHeader
          serviceName="CloudFront"
          serviceIcon={SERVICE_ICONS["/cloudfront"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/cloudfront/create")}>
            Create distribution
        </button>

        />
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="primary" onClick={() => setCreateModal(true)}>
              Create distribution
            </Button>
          </SpaceBetween>
        </SpaceBetween>
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Table
          header={<Header variant="h2">Distributions ({distributions.length})</Header>}
          items={distributions}
          loading={loading}
          columnDefinitions={[
            { header: "ID", cell: (item) => item.Id, sortingField: "Id" },
            { header: "Domain Name", cell: (item) => item.DomainName, sortingField: "DomainName" },
            {
              header: "Status",
              cell: (item) => (
                <StatusIndicator type={item.Status === "Deployed" ? "success" : "pending"}>
                  {item.Status || "Unknown"}
                </StatusIndicator>
              ),
              sortingField: "Status",
            },
            { header: "Comment", cell: (item) => item.Comment || "—" },
            { header: "Enabled", cell: (item) => (item.Enabled !== false ? "Yes" : "No") },
            {
              header: "Actions",
              cell: (item) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    onClick={() => {
                      setSelectedDistributionId(item.Id);
                      setInvalidationModal(true);
                    }}
                    formAction="none"
                  >
                    Invalidate
                  </Button>
                  <Button
                    onClick={() => {
                      setUpdateDistributionId(item.Id);
                      setUpdateModal(true);
                    }}
                    formAction="none"
                  >
                    Update
                  </Button>
                  <Button onClick={() => deleteDistribution(item.Id)} formAction="none">
                    Delete
                  </Button>
                </SpaceBetween>
              ),
            },
          ]}
          empty={<Box textAlign="center">No distributions found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create distribution"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createDistribution}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m" direction="vertical">
            <Box>
              Create a new CloudFront distribution using adapter SDK clients
              (CreateDistributionCommand, UpdateDistributionCommand, DeleteDistributionCommand,
              CreateInvalidationCommand).
            </Box>
            <Box>
              Distribution config uses adapter endpoint and dummy test credentials from adapter
              layer.
            </Box>
          </SpaceBetween>
        </Modal>

        <Modal
          visible={invalidationModal}
          onDismiss={() => {
            setInvalidationModal(false);
            setSelectedDistributionId("");
            setInvalidationPaths("/*");
          }}
          header="Create invalidation"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setInvalidationModal(false);
                  setSelectedDistributionId("");
                  setInvalidationPaths("/*");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={createInvalidation}>
                Create invalidation
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m" direction="vertical">
            <FormField label="Distribution ID">
              <Input value={selectedDistributionId} readOnly />
            </FormField>
            <FormField label="Paths (comma-separated or one per line)">
              <Input
                value={invalidationPaths}
                onChange={({ detail }) => setInvalidationPaths(detail.value)}
                placeholder="/*"
              />
            </FormField>
            <Box>Creates an invalidation batch via adapter SDK CreateInvalidationCommand.</Box>
          </SpaceBetween>
        </Modal>

        <Modal
          visible={updateModal}
          onDismiss={() => {
            setUpdateModal(false);
            setUpdateDistributionId("");
          }}
          header="Update distribution"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setUpdateModal(false);
                  setUpdateDistributionId("");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={updateDistribution}>
                Update
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m" direction="vertical">
            <FormField label="Distribution ID">
              <Input value={updateDistributionId} readOnly />
            </FormField>
            <Box>Update distribution config via adapter SDK UpdateDistributionCommand.</Box>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
