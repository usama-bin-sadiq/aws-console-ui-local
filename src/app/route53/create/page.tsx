"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface Route53Zone {
  Id: string;
  Name: string;
  ResourceRecordSetCount?: number;
}

interface Vpc {
  VpcId: string;
  CidrBlock?: string;
}

export default function Route53CreatePage() {
  const router = useRouter();
  const [zones, setZones] = useState<Route53Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ zoneId: string; zoneName: string } | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [privateZone, setPrivateZone] = useState(false);
  const [vpcId, setVpcId] = useState("");
  const [vpcs, setVpcs] = useState<Vpc[]>([]);

  const fetchZones = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/route53");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setZones(data.zones || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch hosted zones");
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVpcs = async () => {
    try {
      const res = await apiFetch("/api/vpc");
      const data = await res.json();
      setVpcs(data.vpcs || []);
    } catch {
      setVpcs([]);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchZones();
    });
    queueMicrotask(() => {
      fetchVpcs();
    });
  }, []);

  const createHostedZone = async () => {
    try {
      const body: Record<string, any> = {
        action: "createZone",
        name: zoneName,
      };
      if (privateZone && vpcId) {
        body.vpc = { vpcRegion: "us-east-1", vpcId };
      }
      const res = await apiFetch("/api/route53", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to create hosted zone");
      setCreateModal(false);
      setZoneName("");
      setPrivateZone(false);
      setVpcId("");
      fetchZones();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create hosted zone");
    }
  };

  const deleteHostedZone = (zoneId: string) => {
    apiFetch(`/api/route53`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteZone", hostedZoneId: zoneId }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to delete hosted zone");
        setDeleteModal(null);
        fetchZones();
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Failed to delete hosted zone");
      });
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Route 53"
          serviceIcon={SERVICE_ICONS["/route53"]?.small}
          counter={zones.length}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => setCreateModal(true)}
            >
              Create hosted zone
            </button>
          }
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container className="aws-table-card">
          <SpaceBetween size="s" direction="vertical">
            <Button onClick={fetchZones}>Refresh zones</Button>
            <Table
              items={zones}
              loading={loading}
              columnDefinitions={[
                {
                  id: "zoneId",
                  header: "Zone ID",
                  cell: (item) => item.Id || "—",
                  sortingField: "Id",
                  isRowHeader: true,
                },
                {
                  id: "name",
                  header: "Name",
                  cell: (item) => item.Name || "—",
                  sortingField: "Name",
                },
                {
                  id: "recordCount",
                  header: "Record Count",
                  cell: (item) => item.ResourceRecordSetCount?.toString() || "0",
                  sortingField: "ResourceRecordSetCount",
                },
                {
                  id: "actions",
                  header: "Actions",
                  cell: (item) => (
                    <SpaceBetween direction="horizontal" size="xs">
                      <Button
                        variant="inline-link"
                        onClick={() => setDeleteModal({ zoneId: item.Id, zoneName: item.Name })}
                        formAction="none"
                      >
                        Delete
                      </Button>
                    </SpaceBetween>
                  ),
                },
              ]}
              empty={<Box textAlign="center">No hosted zones found.</Box>}
            />
          </SpaceBetween>
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create hosted zone"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createHostedZone} disabled={!zoneName.trim()}>
                Create hosted zone
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Domain name">
            <Input
              value={zoneName}
              onChange={(e) => setZoneName(e.detail.value)}
              placeholder="example.com"
            />
          </FormField>
          <FormField label="Type">
            <Select
              selectedOption={{
                label: privateZone ? "Private" : "Public",
                value: privateZone ? "private" : "public",
              }}
              options={[
                { label: "Public", value: "public" },
                { label: "Private", value: "private" },
              ]}
              onChange={(e) => setPrivateZone(e.detail.selectedOption.value === "private")}
            />
          </FormField>
          {privateZone && (
            <FormField label="VPC">
              <Select
                selectedOption={{
                  label: vpcId || "Select VPC",
                  value: vpcId,
                }}
                options={vpcs.map((v) => ({
                  label: `${v.VpcId} (${v.CidrBlock || "—"})`,
                  value: v.VpcId,
                }))}
                onChange={(e) => setVpcId(e.detail.selectedOption.value as string)}
              />
            </FormField>
          )}
        </Modal>

        {deleteModal && (
          <Modal
            visible
            onDismiss={() => setDeleteModal(null)}
            header="Delete hosted zone"
            footer={
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setDeleteModal(null)}>Cancel</Button>
                <Button variant="primary" onClick={() => deleteHostedZone(deleteModal.zoneId)}>
                  Delete
                </Button>
              </SpaceBetween>
            }
          >
            <Box variant="p">
              Are you sure you want to delete the hosted zone{" "}
              <strong>{deleteModal.zoneName}</strong>?
            </Box>
          </Modal>
        )}
      </SpaceBetween>
    </div>
  );
}
