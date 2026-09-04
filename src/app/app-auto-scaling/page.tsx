"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";

interface ScalableTarget {
  ServiceNamespace: string;
  ResourceId: string;
  ScalableDimension: string;
  MinCapacity: number;
  MaxCapacity: number;
}

export default function AppAutoScalingPage() {
  const [targets, setTargets] = useState<ScalableTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/app-auto-scaling")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTargets(data.scalableTargets || []);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Application Auto Scaling</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            header={<Header variant="h2">Scalable Targets ({targets.length})</Header>}
            items={targets}
            columnDefinitions={[
              { header: "Resource ID", cell: (item) => item.ResourceId },
              { header: "Service namespace", cell: (item) => item.ServiceNamespace },
              { header: "Scalable dimension", cell: (item) => item.ScalableDimension },
              { header: "Min capacity", cell: (item) => String(item.MinCapacity) },
              { header: "Max capacity", cell: (item) => String(item.MaxCapacity) },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No scalable targets found.</Box>}
          />
        </Container>
      </SpaceBetween>
    </div>
  );
}
