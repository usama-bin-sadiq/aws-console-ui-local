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

interface Distribution {
  Id: string;
  DomainName: string;
  Status: string;
  Origins?: { Items?: Array<{ DomainName?: string }> };
  Comment?: string;
  Enabled?: boolean;
  PriceClass?: string;
  ViewerCertificate?: { CloudFrontDefaultCertificate?: boolean };
}

export default function CloudFrontDistributionDetailPage({
  params,
}: {
  params: Promise<{ distributionId: string }>;
}) {
  const router = useRouter();
  const [distribution, setDistribution] = useState<Distribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distributionId, setDistributionId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setDistributionId(p.distributionId));
  }, [params]);

  const fetchDistribution = useCallback(async () => {
    if (!distributionId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/cloudfront");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const found = (data.DistributionList?.Items || data.Distributions || []).find(
        (d: any) => d.Id === distributionId,
      );
      if (!found) throw new Error(`Distribution "${distributionId}" not found`);
      setDistribution(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load distribution");
    } finally {
      setLoading(false);
    }
  }, [distributionId]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchDistribution();
    });
  }, [fetchDistribution]);

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Distribution {distributionId || "Loading..."}</Header>
          <Box textAlign="center">Loading distribution details...</Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !distribution) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Distribution {distributionId || "Loading..."}</Header>
          <Alert type="error">{error || "Distribution not found"}</Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={fetchDistribution}>Refresh</Button>
            <Button onClick={() => router.push("/cloudfront")}>Back to CloudFront</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="CloudFront"
          serviceIcon={SERVICE_ICONS["/cloudfront"]?.small}
          counter={1}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/cloudfront/create")}
            >
              Create Distribution
            </button>
          }
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container header={<Header variant="h2">Details</Header>}>
          <SpaceBetween size="l">
            <Box padding="m">
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Distribution ID
                </Box>
                <Box>{distribution.Id}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Domain Name
                </Box>
                <Box>{distribution.DomainName}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  State
                </Box>
                <StatusIndicator type={distribution.Status === "Deployed" ? "success" : "warning"}>
                  {distribution.Status}
                </StatusIndicator>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Enabled
                </Box>
                <Box>{distribution.Enabled ? "Yes" : "No"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Price Class
                </Box>
                <Box>{distribution.PriceClass}</Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>

        <Container className="aws-table-card" header={<Header variant="h2">Origins</Header>}>
          <SpaceBetween size="m">
            <Table
              items={distribution.Origins?.Items || []}
              columnDefinitions={[
                { id: "domainName", header: "Domain Name", cell: (item: any) => item.DomainName },
                { id: "originId", header: "Origin ID", cell: (item: any) => item.Id || "—" },
              ]}
              empty={<Box textAlign="center">No origins found.</Box>}
            />
          </SpaceBetween>
        </Container>

        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/cloudfront"] || []} />
      </SpaceBetween>
    </div>
  );
}
