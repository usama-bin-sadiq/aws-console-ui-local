"use client";
import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";

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
  const [releasing, setReleasing] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/elastic-ip");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAddresses(data.addresses || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load Elastic IPs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAllocate() {
    setAllocating(true);
    try {
      const res = await fetch("/api/elastic-ip", { method: "POST" });
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
    setReleasing(true);
    try {
      for (const addr of selected) {
        const res = await fetch(`/api/elastic-ip?allocationId=${addr.AllocationId}`, { method: "DELETE" });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
      }
      setSelected([]);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to release Elastic IP");
    } finally {
      setReleasing(false);
    }
  }

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={load} iconName="refresh">Refresh</Button>
              <Button disabled={selected.length === 0} loading={releasing} onClick={handleRelease}>Release</Button>
              <Button variant="primary" loading={allocating} onClick={handleAllocate}>Allocate Elastic IP</Button>
            </SpaceBetween>
          }
        >
          Elastic IPs
        </Header>

        {error && <Alert type="error" dismissible onDismiss={() => setError(null)}>{error}</Alert>}

        <Container>
          <Table
            loading={loading}
            loadingText="Loading Elastic IPs..."
            items={addresses}
            selectionType="multi"
            selectedItems={selected}
            onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
            columnDefinitions={[
              { id: "publicIp", header: "Public IP", cell: (item) => item.PublicIp },
              { id: "allocationId", header: "Allocation ID", cell: (item) => item.AllocationId },
              { id: "domain", header: "Domain", cell: (item) => item.Domain },
              { id: "instanceId", header: "Associated Instance", cell: (item) => item.InstanceId || "—" },
            ]}
            empty={
              <Box textAlign="center" color="inherit">
                <b>No Elastic IPs</b>
                <Box variant="p" color="inherit">No Elastic IPs allocated.</Box>
              </Box>
            }
          />
        </Container>
      </SpaceBetween>
    </div>
  );
}
