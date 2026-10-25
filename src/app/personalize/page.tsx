"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { Header, Container, Box, SpaceBetween, Alert } from "@cloudscape-design/components";
import { apiFetch } from "@/lib/api-client";

interface Campaign {
  CampaignArn?: string;
  Name?: string;
  Status?: string;
  CreatedAt?: string;
}

const COLUMN_DEFINITIONS: Array<{ header: string; cell: (item: Campaign) => React.ReactNode }> = [
  {
    header: "Name",
    cell: (item) => item.Name || "—",
  },
  {
    header: "Status",
    cell: (item) => item.Status || "—",
  },
  {
    header: "Created",
    cell: (item) => (item.CreatedAt ? new Date(item.CreatedAt).toLocaleString() : "—"),
  },
];

export default function PersonalizePage() {
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/personalize");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.campaigns) ? data.campaigns : []);
    } catch (_err: unknown) {
      setError(null);
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchItems();
    });
  }, [fetchItems]);

  return (
    <ServiceLayout
      serviceName="AWS Personalize"
      serviceHref="/personalize"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Personalize", href: "/personalize" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <SpaceBetween size="l">
        <Header variant="h2">AWS Personalize</Header>
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Container>
          <Box>
            AWS Personalize helps you build applications with real-time personalized
            recommendations. Not available in local emulation.
          </Box>
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
