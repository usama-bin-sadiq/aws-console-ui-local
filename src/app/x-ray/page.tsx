"use client";
import React, { useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface XRayService {
  name: string;
  type: string;
  startTime?: string;
}

export default function XRayPage() {
  const [services, setServices] = useState<XRayService[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();  const [error, setError] = useState<string | null>(null);

  const loadServiceGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/xray");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setServices(data.services || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS X-Ray"
          serviceIcon={SERVICE_ICONS["/x-ray"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/x-ray/create")}>
            Create group
        </button>

        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Container className="aws-table-card">
          <SpaceBetween size="m">
            <Button onClick={loadServiceGraph} loading={loading}>
              Load service graph (last 1 hour)
            </Button>
            <Table
              header={<Header variant="h2">Services ({services.length})</Header>}
              items={services}
              columnDefinitions={[
                { header: "Name", cell: (i) => i.name },
                { header: "Type", cell: (i) => i.type },
                { header: "Start time", cell: (i) => i.startTime || "—" },
              ]}
              empty={
                <Box textAlign="center">
                  Click &quot;Load service graph&quot; to view X-Ray services.
                </Box>
              }
            />
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
