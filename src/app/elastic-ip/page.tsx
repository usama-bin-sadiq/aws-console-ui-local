"use client";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState, useCallback } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";

interface ElasticIp {
  AllocationId: string;
  PublicIp: string;
  Domain: string;
  InstanceId?: string;
  AssociationId?: string;
}

export default function ElasticIpPage() {
  const [addresses, setAddresses] = useState<ElasticIp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allocating, setAllocating] = useState(false);
  const [selected, setSelected] = useState<ElasticIp[]>([]);

  // Associate modal
  const [showAssociate, setShowAssociate] = useState(false);
  const [associateInstanceId, setAssociateInstanceId] = useState("");
  const [associating, setAssociating] = useState(false);

  // Running instances for dropdown
  const [instances, setInstances] = useState<
    Array<{ InstanceId?: string; Name?: string; State?: string }>
  >([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/elastic-ip");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAddresses(data.addresses || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load Elastic IPs");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadInstances = useCallback(async () => {
    try {
      const res = await apiFetch("/api/ec2");
      const data = await res.json();
      setInstances(
        (data.instances || []).filter(
          (i: { State?: { Name?: string } }) =>
            i.State?.Name === "running" || i.State?.Name === "stopped",
        ),
      );
    } catch {
      // Instances will be empty
    }
  }, []);

  useEffect(() => {
    load();
    loadInstances();
  }, [load, loadInstances]);

  async function handleAllocate() {
    setAllocating(true);
    try {
      const res = await apiFetch("/api/elastic-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to allocate Elastic IP");
    } finally {
      setAllocating(false);
    }
  }

  async function handleRelease() {
    if (selected.length === 0) return;
    try {
      for (const addr of selected) {
        const res = await apiFetch(`/api/elastic-ip?allocationId=${addr.AllocationId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to release Elastic IP");
    }
  }

  async function handleAssociate() {
    if (selected.length !== 1 || !associateInstanceId) return;
    setAssociating(true);
    try {
      const res = await apiFetch("/api/elastic-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "associate",
          allocationId: selected[0].AllocationId,
          instanceId: associateInstanceId,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowAssociate(false);
      setAssociateInstanceId("");
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to associate Elastic IP");
    } finally {
      setAssociating(false);
    }
  }

  async function handleDisassociate() {
    if (selected.length !== 1 || !selected[0].AssociationId) return;
    try {
      const res = await apiFetch("/api/elastic-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disassociate", associationId: selected[0].AssociationId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to disassociate Elastic IP");
    }
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={load} iconName="refresh">
                Refresh
              </Button>
              <ButtonDropdown
                items={[
                  { text: "Release", id: "release", disabled: selected.length === 0 },
                  {
                    text: "Associate to instance",
                    id: "associate",
                    disabled: selected.length !== 1 || !!selected[0]?.InstanceId,
                  },
                  {
                    text: "Disassociate",
                    id: "disassociate",
                    disabled: selected.length !== 1 || !selected[0]?.AssociationId,
                  },
                ]}
                onItemClick={({ detail }) => {
                  if (detail.id === "release") handleRelease();
                  else if (detail.id === "associate") setShowAssociate(true);
                  else if (detail.id === "disassociate") handleDisassociate();
                }}
                disabled={selected.length === 0}
                ariaLabel="Elastic IP actions"
              >
                Actions
              </ButtonDropdown>
              <Button variant="primary" loading={allocating} onClick={handleAllocate}>
                Allocate Elastic IP
              </Button>
            </SpaceBetween>
          }
        >
          Elastic IPs
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Table
          loading={loading}
          loadingText="Loading Elastic IPs..."
          items={addresses}
          selectionType="multi"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems as ElasticIp[])}
          trackBy="AllocationId"
          columnDefinitions={[
            { id: "publicIp", header: "Public IP", cell: (item) => item.PublicIp },
            { id: "allocationId", header: "Allocation ID", cell: (item) => item.AllocationId },
            { id: "domain", header: "Domain", cell: (item) => item.Domain },
            {
              id: "instanceId",
              header: "Associated Instance",
              cell: (item) => item.InstanceId || "—",
            },
          ]}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No Elastic IPs</b>
              <Box variant="p" color="inherit">
                No Elastic IPs allocated.
              </Box>
            </Box>
          }
        />
      </SpaceBetween>

      <Modal
        visible={showAssociate}
        onDismiss={() => setShowAssociate(false)}
        header="Associate Elastic IP"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowAssociate(false)}>Cancel</Button>
              <Button
                variant="primary"
                loading={associating}
                onClick={handleAssociate}
                disabled={!associateInstanceId}
              >
                Associate
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box variant="small" color="text-label">
            Elastic IP: {selected[0]?.PublicIp} ({selected[0]?.AllocationId})
          </Box>
          <FormField label="Instance">
            <Select
              selectedOption={
                associateInstanceId
                  ? {
                      value: associateInstanceId,
                      label: `${instances.find((i) => i.InstanceId === associateInstanceId)?.Name || associateInstanceId} (${associateInstanceId})`,
                    }
                  : null
              }
              options={instances.map((i) => ({
                value: i.InstanceId || "",
                label: `${i.Name || i.InstanceId} (${i.InstanceId}) - ${i.State}`,
              }))}
              placeholder="Select an instance"
              onChange={({ detail }) => setAssociateInstanceId(detail.selectedOption.value || "")}
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
