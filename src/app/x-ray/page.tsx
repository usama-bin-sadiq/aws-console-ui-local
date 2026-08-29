"use client";
import React, { useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";

interface XRayService { name: string; type: string; startTime?: string; }

export default function XRayPage() {
  const [services, setServices] = useState<XRayService[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadServiceGraph = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/xray");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setServices(data.services || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS X-Ray</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <SpaceBetween size="m">
            <Button onClick={loadServiceGraph} loading={loading}>Load service graph (last 1 hour)</Button>
            <Table
              header={<Header variant="h2">Services ({services.length})</Header>}
              items={services}
              columnDefinitions={[
                { header: "Name", cell: (i) => i.name },
                { header: "Type", cell: (i) => i.type },
                { header: "Start time", cell: (i) => i.startTime || "—" },
              ]}
              empty={<Box textAlign="center">Click &quot;Load service graph&quot; to view X-Ray services.</Box>}
            />
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
