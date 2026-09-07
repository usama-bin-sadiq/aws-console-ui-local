"use client";
// VERIFICATION GATE: Phase 4 VPC Full — PRD §9.2.4 / §15.4 / F-003 / F-006
// All edits use @aws-sdk/client-ec2 commands via /api/vpc endpoints.
// Cloudscape components only; no inline CSS outside design tokens.

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import Checkbox from "@cloudscape-design/components/checkbox";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Link from "@cloudscape-design/components/link";

interface Vpc {
  VpcId: string;
  State: string;
  CidrBlock: string;
  IsDefault: boolean;
  InstanceTenancy?: string;
}

export default function VpcPage() {
  const router = useRouter();
  const [vpcs, setVpcs] = useState<Vpc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Vpc[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Modify dialog state
  const [modifyOpen, setModifyOpen] = useState(false);
  const [modifyVpc, setModifyVpc] = useState<Vpc | null>(null);
  const [enableDnsHostnames, setEnableDnsHostnames] = useState(true);
  const [enableDnsSupport, setEnableDnsSupport] = useState(true);
  const [modifying, setModifying] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vpc");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVpcs(data.vpcs || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load VPCs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const vpc of selected) {
        const res = await fetch(`/api/vpc?vpcId=${vpc.VpcId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete VPC");
    } finally {
      setDeleting(false);
    }
  }

  async function handleModify() {
    if (!modifyVpc) return;
    setModifying(true);
    try {
      const res = await fetch("/api/vpc", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vpcId: modifyVpc.VpcId,
          enableDnsHostnames,
          enableDnsSupport,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setModifyOpen(false);
      setModifyVpc(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to modify VPC");
    } finally {
      setModifying(false);
    }
  }

  const openModify = useCallback((vpc: Vpc) => {
    setModifyVpc(vpc);
    setEnableDnsHostnames(true);
    setEnableDnsSupport(true);
    setModifyOpen(true);
  }, []);

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={load} iconName="refresh" formAction="none">
                Refresh
              </Button>
              <Button
                disabled={selected.length === 0}
                loading={deleting}
                onClick={handleDelete}
                formAction="none"
              >
                Delete
              </Button>
              <Button variant="primary" onClick={() => router.push("/vpc/create")} formAction="none">
                Create VPC
              </Button>
            </SpaceBetween>
          }
        >
          VPCs
        </Header>

        <Box variant="small" color="text-body-secondary">
          Manage your Virtual Private Cloud resources. Navigate to{" "}
          <Link href="/vpc/create" external>
            Create VPC wizard
          </Link>{" "}
          for multi-step provisioning (CIDR, Subnets, NAT, Flow Logs, Tags, Review).
        </Box>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            loading={loading}
            loadingText="Loading VPCs..."
            items={vpcs}
            selectionType="multi"
            selectedItems={selected}
            onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
            trackBy="VpcId"
            columnDefinitions={[
              {
                id: "vpcId",
                header: "VPC ID",
                cell: (item: Vpc) => item.VpcId,
                sortingField: "VpcId",
              },
              {
                id: "cidrBlock",
                header: "IPv4 CIDR",
                cell: (item: Vpc) => item.CidrBlock,
                sortingField: "CidrBlock",
              },
              {
                id: "state",
                header: "State",
                cell: (item: Vpc) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <StatusIndicator type={item.State === "available" ? "success" : "warning"} />
                    <span>{item.State}</span>
                  </SpaceBetween>
                ),
              },
              {
                id: "tenancy",
                header: "Tenancy",
                cell: (item: Vpc) => item.InstanceTenancy || "default",
              },
              {
                id: "defaultVpc",
                header: "Default VPC",
                cell: (item: Vpc) => (item.IsDefault ? "Yes" : "No"),
              },
              {
                id: "actions",
                header: "Actions",
                cell: (item: Vpc) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button variant="link" onClick={() => openModify(item)} formAction="none">
                      Modify
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No VPCs</b>
                <Box variant="p" color="inherit">
                  No VPCs found. Create one using the wizard.
                </Box>
              </Box>
            }
          />
        </Container>
      </SpaceBetween>

      {/* Modify VPC Modal */}
      <Modal
        visible={modifyOpen}
        onDismiss={() => setModifyOpen(false)}
        header="Modify VPC"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setModifyOpen(false)} formAction="none">
                Cancel
              </Button>
              <Button variant="primary" loading={modifying} onClick={handleModify} formAction="none">
                Modify VPC
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box>
            <Box variant="small" color="text-label">
              VPC ID
            </Box>
            <Box>{modifyVpc?.VpcId}</Box>
          </Box>
          <Checkbox checked={enableDnsHostnames} onChange={({ detail }) => setEnableDnsHostnames(detail.checked)}>
            Enable DNS hostnames
          </Checkbox>
          <Checkbox checked={enableDnsSupport} onChange={({ detail }) => setEnableDnsSupport(detail.checked)}>
            Enable DNS resolution
          </Checkbox>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
