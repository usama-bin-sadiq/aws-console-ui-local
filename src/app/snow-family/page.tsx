"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { Header, Container, Box, SpaceBetween, Alert } from "@cloudscape-design/components";
import { apiFetch } from "@/lib/api-client";

interface Device {
  DeviceId?: string;
  Name?: string;
  Type?: string;
  State?: string;
}

const COLUMN_DEFINITIONS: Array<{ header: string; cell: (item: Device) => React.ReactNode }> = [
  {
    header: "Name",
    cell: (item) => item.Name || "—",
  },
  {
    header: "Device ID",
    cell: (item) => item.DeviceId || "—",
  },
  {
    header: "Type",
    cell: (item) => item.Type || "—",
  },
  {
    header: "State",
    cell: (item) => item.State || "—",
  },
];

export default function SnowFamilyPage() {
  const [items, setItems] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/snow-family");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.devices) ? data.devices : []);
    } catch (_err: unknown) {
      setError(null);
      setItems([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  return (
    <ServiceLayout
      serviceName="AWS Snow Family"
      serviceHref="/snow-family"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Snow Family", href: "/snow-family" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <SpaceBetween size="l">
        <Header variant="h2">AWS Snow Family</Header>
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Container>
          <Box>
            AWS Snow Family helps you collect and process data in edge locations and transfer it to
            AWS. Not available in local emulation.
          </Box>
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
