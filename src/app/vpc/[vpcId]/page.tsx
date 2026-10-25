"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Header from "@cloudscape-design/components/header";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";
import { apiFetch } from "@/lib/api-client";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";

interface VPC {
  VpcId: string;
  State: string;
  CidrBlock: string;
  Tenancy: string;
  IsDefault: boolean;
  Tags?: Array<{ Key?: string; Value?: string }>;
}

export default function VPCDetailPage({
  params,
}: {
  params: Promise<{ vpcId: string }>;
}) {
  const router = useRouter();
  const [vpc, setVpc] = useState<VPC | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vpcId, setVpcId] = useState<string>("");
  
  useEffect(() => {
    params.then((p) => setVpcId(p.vpcId));
  }, [params]);
  
  const fetchVPC = useCallback(async () => {
    if (!vpcId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/vpc");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const found = (data.vpcs || []).find((v: any) => v.VpcId === vpcId);
      if (!found) throw new Error(`VPC "${vpcId}" not found`);
      setVpc(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load VPC");
    } finally {
      setLoading(false);
    }
  }, [vpcId]);
  
  useEffect(() => {
    fetchVPC();
  }, [fetchVPC]);
  
  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">VPC {vpcId || "Loading..."}</Header>
          <Box textAlign="center">
            <Box nativeAttributes={{ style: { fontSize: "18px", color: "#545b64", marginBottom: "12px" } }}>
              Loading VPC details...
            </Box>
          </Box>
        </SpaceBetween>
      </div>
    );
  }
  
  if (error || !vpc) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">VPC {vpcId || "Loading..."}</Header>
          <Alert type="error">{error || "VPC not found"}</Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={fetchVPC}>Refresh</Button>
            <Button onClick={() => router.push("/vpc")}>Back to VPCs</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    );
  }
  
  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="VPC"
          serviceIcon={SERVICE_ICONS["/vpc"]?.small}
          counter={1}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/vpc/create")}
            >
              Create VPC
            </button>
          }
        />
        
        <Container header={<Header variant="h2">Details</Header>}>
          <SpaceBetween size="l">
            <Box padding="m">
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">VPC ID</Box>
                <Box>{vpc.VpcId}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">State</Box>
                <StatusIndicator type={vpc.State === "available" ? "success" : "warning"}>{vpc.State}</StatusIndicator>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">CIDR Block</Box>
                <Box>{vpc.CidrBlock}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Tenancy</Box>
                <Box>{vpc.Tenancy}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">Default VPC</Box>
                <Box>{vpc.IsDefault ? "Yes" : "No"}</Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>
        
        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/vpc"] || []} />
      </SpaceBetween>
    </div>
  );
}
