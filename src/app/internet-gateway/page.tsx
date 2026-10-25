"use client";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface InternetGateway {
  InternetGatewayId: string;
  State?: string;
  Attachments?: { VpcId: string; State: string }[];
}

export default function InternetGatewayPage() {
  const [gateways, setGateways] = useState<InternetGateway[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showAttach, setShowAttach] = useState(false);
  const [attachIgwId, setAttachIgwId] = useState("");
  const [attachVpcId, setAttachVpcId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<InternetGateway[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [detaching, setDetaching] = useState<string | null>(null);

  // VPCs for dropdown
  const [vpcs, setVpcs] = useState<Array<{ VpcId: string; CidrBlock?: string }>>([]);

  async function loadVpcs() {
    try {
      const res = await apiFetch("/api/vpc");
      const data = await res.json();
      setVpcs(data.vpcs || []);
    } catch {
      // VPCs will be empty
    }
  }

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/internet-gateway");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGateways(data.internetGateways || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load internet gateways");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      load();
    });
    queueMicrotask(() => {
      loadVpcs();
    });
  }, []);

  async function handleCreate() {
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/internet-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create internet gateway");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAttach() {
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/internet-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "attach", igwId: attachIgwId, vpcId: attachVpcId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowAttach(false);
      setAttachIgwId("");
      setAttachVpcId("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to attach internet gateway");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDetach(igwId: string, vpcId: string) {
    setDetaching(igwId);
    try {
      const res = await apiFetch("/api/internet-gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "detach", igwId, vpcId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to detach internet gateway");
    } finally {
      setDetaching(null);
    }
  }

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const igw of selected) {
        const res = await apiFetch(`/api/internet-gateway?igwId=${igw.InternetGatewayId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete internet gateway");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Refresh Delete setShowAttach(true)}>Attach to VPC "
          serviceIcon={SERVICE_ICONS["/internet-gateway"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/internet-gateway/create")}
          >
            Create gateway
          </button>
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={load} iconName="refresh" formAction="none">
                Refresh
              </Button>
            </SpaceBetween>
          }
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Table
          loading={loading}
          loadingText="Loading internet gateways..."
          items={gateways}
          selectionType="multi"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
          columnDefinitions={[
            { id: "igwId", header: "Internet Gateway ID", cell: (item) => item.InternetGatewayId },
            {
              id: "attachedVpc",
              header: "Attached VPC",
              cell: (item) =>
                item.Attachments && item.Attachments.length > 0
                  ? item.Attachments.map((a) => a.VpcId).join(", ")
                  : "—",
            },
            {
              id: "state",
              header: "State",
              cell: (item) =>
                item.Attachments && item.Attachments.length > 0
                  ? item.Attachments[0].State
                  : "detached",
            },
            {
              id: "actions",
              header: "Actions",
              cell: (item) =>
                item.Attachments && item.Attachments.length > 0 ? (
                  <Button
                    variant="link"
                    loading={detaching === item.InternetGatewayId}
                    onClick={() => handleDetach(item.InternetGatewayId, item.Attachments![0].VpcId)}
                    formAction="none"
                  >
                    Detach
                  </Button>
                ) : (
                  "—"
                ),
            },
          ]}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No internet gateways</b>
              <Box variant="p" color="inherit">
                No internet gateways found.
              </Box>
            </Box>
          }
        />
      </SpaceBetween>

      <Modal
        visible={showAttach}
        onDismiss={() => setShowAttach(false)}
        header="Attach Internet Gateway to VPC"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowAttach(false)}>Cancel</Button>
              <Button variant="primary" loading={submitting} onClick={handleAttach}>
                Attach
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Internet Gateway ID">
            <Select
              selectedOption={attachIgwId ? { value: attachIgwId, label: attachIgwId } : null}
              options={gateways
                .filter((g) => !g.Attachments || g.Attachments.length === 0)
                .map((gw) => ({ value: gw.InternetGatewayId, label: gw.InternetGatewayId }))}
              placeholder="Select an internet gateway"
              onChange={({ detail }) => setAttachIgwId(detail.selectedOption.value || "")}
            />
          </FormField>
          <FormField label="VPC ID">
            <Select
              selectedOption={
                attachVpcId
                  ? {
                      value: attachVpcId,
                      label: `${attachVpcId} (${vpcs.find((v) => v.VpcId === attachVpcId)?.CidrBlock || ""})`,
                    }
                  : null
              }
              options={vpcs.map((vpc) => ({
                value: vpc.VpcId,
                label: `${vpc.VpcId} (${vpc.CidrBlock || ""})`,
              }))}
              placeholder="Select a VPC"
              onChange={({ detail }) => setAttachVpcId(detail.selectedOption.value || "")}
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
