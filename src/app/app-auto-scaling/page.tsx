"use client";

import { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

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

  const router = useRouter();
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
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Application Auto Scaling"
          serviceIcon={SERVICE_ICONS["/app-auto-scaling"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/app-auto-scaling/create")}
          >
            Create scaling policy
          </button>
        />

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

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
      </SpaceBetween>
    </div>
  );
}
