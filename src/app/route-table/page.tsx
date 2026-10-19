"use client";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState, useCallback } from "react";
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
import Select from "@cloudscape-design/components/select";
import Tabs from "@cloudscape-design/components/tabs";

interface RouteEntry {
  DestinationCidrBlock?: string;
  GatewayId?: string;
  NatGatewayId?: string;
  InstanceId?: string;
  State?: string;
  Origin?: string;
}

interface RouteTableAssociation {
  AssociationId?: string;
  SubnetId?: string;
  State?: string;
}

interface RouteTable {
  RouteTableId: string;
  VpcId: string;
  Routes?: RouteEntry[];
  Associations?: RouteTableAssociation[];
}

export default function RouteTablePage() {
  const [routeTables, setRouteTables] = useState<RouteTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [vpcId, setVpcId] = useState("");
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<RouteTable[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Detail view
  const [detailRt, setDetailRt] = useState<RouteTable | null>(null);
  const [showAddRoute, setShowAddRoute] = useState(false);
  const [routeCidr, setRouteCidr] = useState("0.0.0.0/0");
  const [routeGatewayId, setRouteGatewayId] = useState("");
  const [routeSubnetId, setRouteSubnetId] = useState("");
  const [addingRoute, setAddingRoute] = useState(false);

  // VPCs for dropdown
  const [vpcs, setVpcs] = useState<Array<{ VpcId: string; CidrBlock?: string }>>([]);
  // Internet Gateways for route dropdown
  const [igws, setIgws] = useState<
    Array<{ InternetGatewayId: string; Attachments?: { VpcId: string }[] }>
  >([]);
  // Subnets for association dropdown
  const [subnets, setSubnets] = useState<
    Array<{ SubnetId: string; VpcId?: string; AvailabilityZone?: string }>
  >([]);

  const loadVpcs = useCallback(async () => {
    try {
      const res = await apiFetch("/api/vpc");
      const data = await res.json();
      setVpcs(data.vpcs || []);
    } catch {
      /* empty */
    }
  }, []);

  const loadIgws = useCallback(async () => {
    try {
      const res = await apiFetch("/api/internet-gateway");
      const data = await res.json();
      setIgws(data.internetGateways || []);
    } catch {
      /* empty */
    }
  }, []);

  const loadSubnets = useCallback(async () => {
    try {
      const res = await apiFetch("/api/ec2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "describeSubnets" }),
      });
      const data = await res.json();
      setSubnets(data.subnets || []);
    } catch {
      /* empty */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/route-table");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRouteTables(data.routeTables || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load route tables");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    loadVpcs();
    loadIgws();
    loadSubnets();
  }, [load, loadVpcs, loadIgws, loadSubnets]);

  async function handleCreate() {
    setCreating(true);
    try {
      const res = await apiFetch("/api/route-table", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vpcId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowCreate(false);
      setVpcId("");
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create route table");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete() {
    if (selected.length === 0) return;
    setDeleting(true);
    try {
      for (const rt of selected) {
        const res = await apiFetch(`/api/route-table?routeTableId=${rt.RouteTableId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to delete route table");
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddRoute() {
    if (!detailRt) return;
    setAddingRoute(true);
    try {
      const res = await apiFetch("/api/route-table", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-route",
          routeTableId: detailRt.RouteTableId,
          destinationCidrBlock: routeCidr,
          gatewayId: routeGatewayId || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setShowAddRoute(false);
      setRouteCidr("0.0.0.0/0");
      setRouteGatewayId("");
      const refreshed = await apiFetch("/api/route-table");
      const refreshedData = await refreshed.json();
      const found = (refreshedData.routeTables || []).find(
        (rt: RouteTable) => rt.RouteTableId === detailRt.RouteTableId,
      );
      if (found) setDetailRt(found);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to add route");
    } finally {
      setAddingRoute(false);
    }
  }

  async function handleAssociate() {
    if (!detailRt || !routeSubnetId) return;
    try {
      const res = await apiFetch("/api/route-table", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "associate-route-table",
          routeTableId: detailRt.RouteTableId,
          subnetId: routeSubnetId,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRouteSubnetId("");
      const refreshed = await apiFetch("/api/route-table");
      const refreshedData = await refreshed.json();
      const found = (refreshedData.routeTables || []).find(
        (rt: RouteTable) => rt.RouteTableId === detailRt.RouteTableId,
      );
      if (found) setDetailRt(found);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to associate subnet");
    }
  }

  if (detailRt) {
    const routes = detailRt.Routes || [];
    const associations = detailRt.Associations || [];
    const unassociatedSubnets = subnets.filter(
      (s) => s.VpcId === detailRt.VpcId && !associations.some((a) => a.SubnetId === s.SubnetId),
    );
    const attachedIgws = igws.filter((igw) =>
      igw.Attachments?.some((a) => a.VpcId === detailRt.VpcId),
    );

    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header
            variant="h1"
            actions={
              <Button variant="primary" onClick={() => setDetailRt(null)}>
                Back to List
              </Button>
            }
          >
            Route Table: {detailRt.RouteTableId}
          </Header>
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          <Box>
            <Box variant="small" color="text-label">
              VPC ID
            </Box>
            <Box>{detailRt.VpcId}</Box>
          </Box>
          <Tabs
            tabs={[
              {
                label: `Routes (${routes.length})`,
                id: "routes",
                content: (
                  <SpaceBetween size="m">
                    <Button variant="primary" onClick={() => setShowAddRoute(true)}>
                      Add Route
                    </Button>
                    <Table
                      columnDefinitions={[
                        {
                          header: "Destination",
                          cell: (r: RouteEntry) => r.DestinationCidrBlock || "—",
                        },
                        {
                          header: "Target",
                          cell: (r: RouteEntry) =>
                            r.GatewayId || r.NatGatewayId || r.InstanceId || "—",
                        },
                        { header: "State", cell: (r: RouteEntry) => r.State || "—" },
                        { header: "Origin", cell: (r: RouteEntry) => r.Origin || "—" },
                      ]}
                      items={routes}
                      header={<Header variant="h3">Routes</Header>}
                      empty={<Box>No routes</Box>}
                    />
                  </SpaceBetween>
                ),
              },
              {
                label: `Subnet Associations (${associations.length})`,
                id: "associations",
                content: (
                  <SpaceBetween size="m">
                    <SpaceBetween direction="horizontal" size="s">
                      <Select
                        selectedOption={
                          routeSubnetId
                            ? {
                                value: routeSubnetId,
                                label: `${routeSubnetId} (${subnets.find((s) => s.SubnetId === routeSubnetId)?.AvailabilityZone || ""})`,
                              }
                            : null
                        }
                        options={unassociatedSubnets.map((s) => ({
                          value: s.SubnetId,
                          label: `${s.SubnetId} (${s.AvailabilityZone || ""})`,
                        }))}
                        placeholder="Select a subnet to associate"
                        onChange={({ detail }) =>
                          setRouteSubnetId(detail.selectedOption.value || "")
                        }
                      />
                      <Button onClick={handleAssociate} disabled={!routeSubnetId}>
                        Associate
                      </Button>
                    </SpaceBetween>
                    <Table
                      columnDefinitions={[
                        {
                          header: "Association ID",
                          cell: (a: RouteTableAssociation) => a.AssociationId || "—",
                        },
                        {
                          header: "Subnet ID",
                          cell: (a: RouteTableAssociation) => a.SubnetId || "—",
                        },
                        { header: "State", cell: (a: RouteTableAssociation) => a.State || "—" },
                      ]}
                      items={associations}
                      header={<Header variant="h3">Associated Subnets</Header>}
                      empty={<Box>No subnets associated</Box>}
                    />
                  </SpaceBetween>
                ),
              },
            ]}
          />
        </SpaceBetween>

        <Modal
          visible={showAddRoute}
          onDismiss={() => setShowAddRoute(false)}
          header="Add Route"
          footer={
            <Box float="right">
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={() => setShowAddRoute(false)}>Cancel</Button>
                <Button variant="primary" loading={addingRoute} onClick={handleAddRoute}>
                  Add Route
                </Button>
              </SpaceBetween>
            </Box>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Destination CIDR">
              <Input
                value={routeCidr}
                onChange={({ detail }) => setRouteCidr(detail.value)}
                placeholder="0.0.0.0/0"
              />
            </FormField>
            <FormField label="Internet Gateway">
              <Select
                selectedOption={
                  routeGatewayId ? { value: routeGatewayId, label: routeGatewayId } : null
                }
                options={attachedIgws.map((igw) => ({
                  value: igw.InternetGatewayId,
                  label: igw.InternetGatewayId,
                }))}
                placeholder="Select an internet gateway"
                onChange={({ detail }) => setRouteGatewayId(detail.selectedOption.value || "")}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header
          variant="h2"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={load} iconName="refresh">
                Refresh
              </Button>
              <Button disabled={selected.length === 0} loading={deleting} onClick={handleDelete}>
                Delete
              </Button>
              <Button variant="primary" onClick={() => setShowCreate(true)}>
                Create Route Table
              </Button>
            </SpaceBetween>
          }
        >
          Route Tables
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Table
          loading={loading}
          loadingText="Loading route tables..."
          items={routeTables}
          selectionType="multi"
          selectedItems={selected}
          onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
          trackBy="RouteTableId"
          columnDefinitions={[
            { id: "routeTableId", header: "Route Table ID", cell: (item) => item.RouteTableId },
            { id: "vpcId", header: "VPC ID", cell: (item) => item.VpcId },
            { id: "routes", header: "Routes", cell: (item) => String(item.Routes?.length ?? 0) },
            {
              id: "subnets",
              header: "Associated Subnets",
              cell: (item) => String(item.Associations?.length ?? 0),
            },
            {
              id: "actions",
              header: "Actions",
              cell: (item) => (
                <Button variant="link" onClick={() => setDetailRt(item)} formAction="none">
                  View Details
                </Button>
              ),
            },
          ]}
          empty={
            <Box textAlign="center" color="inherit">
              <b>No route tables</b>
              <Box variant="p" color="inherit">
                No route tables found.
              </Box>
            </Box>
          }
        />
      </SpaceBetween>

      <Modal
        visible={showCreate}
        onDismiss={() => setShowCreate(false)}
        header="Create Route Table"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button variant="primary" loading={creating} onClick={handleCreate}>
                Create Route Table
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <FormField label="VPC ID">
            <Select
              selectedOption={
                vpcId
                  ? {
                      value: vpcId,
                      label: `${vpcId} (${vpcs.find((v) => v.VpcId === vpcId)?.CidrBlock || ""})`,
                    }
                  : null
              }
              options={vpcs.map((vpc) => ({
                value: vpc.VpcId,
                label: `${vpc.VpcId} (${vpc.CidrBlock || ""})`,
              }))}
              placeholder="Select a VPC"
              onChange={({ detail }) => setVpcId(detail.selectedOption.value || "")}
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </div>
  );
}
