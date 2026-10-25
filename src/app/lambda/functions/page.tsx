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

interface LambdaFunction {
  FunctionName: string;
  FunctionArn: string;
  Runtime: string;
  Role: string;
  Handler: string;
  CodeSize: number;
  LastModified: string;
  LastUpdateStatus?: string;
}

export default function LambdaFunctionsPage() {
  const router = useRouter();
  const [functions, setFunctions] = useState<LambdaFunction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFunctions();
  }, []);

  const fetchFunctions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/lambda");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFunctions(data.Functions || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load functions");
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Lambda Functions</Header>
          <Box textAlign="center">
            <Box nativeAttributes={{ style: { fontSize: "18px", color: "#545b64", marginBottom: "12px" } }}>
              Loading functions...
            </Box>
          </Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Lambda Functions</Header>
          <Alert type="error">{error || "Failed to load functions"}</Alert>
        </SpaceBetween>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Lambda"
          serviceIcon={SERVICE_ICONS["/lambda"]?.small}
          counter={functions.length}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/lambda/create")}
            >
              Create Function
            </button>
          }
        />

        <Container>
          <Header variant="h2">Lambda Functions</Header>
          <SpaceBetween size="m">
            <Table
              items={functions}
              columnDefinitions={[
                { id: "FunctionName", header: "Function Name", cell: (item: any) => item.FunctionName, isRowHeader: true },
                { id: "Runtime", header: "Runtime", cell: (item: any) => item.Runtime },
                { id: "Status", cell: (item: any) => <StatusIndicator type={item.LastUpdateStatus === "Successful" ? "success" : "warning"}>{String(item.LastUpdateStatus || "—")}</StatusIndicator> },
                { id: "LastModified", cell: (item: any) => item.LastModified || "—" },
              ] as any[]}
              empty={<Box textAlign="center">No functions found.</Box>}
            />
          </SpaceBetween>
        </Container>

        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/lambda"] || []} />
      </SpaceBetween>
    </div>
  );
}
