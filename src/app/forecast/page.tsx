"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { Header, Container, Box, SpaceBetween, Alert } from "@cloudscape-design/components";
import { apiFetch } from "@/lib/api-client";

interface Forecast {
  ForecastArn?: string;
  Name?: string;
  Status?: string;
  CreatedAt?: string;
}

const COLUMN_DEFINITIONS: Array<{ header: string; cell: (item: Forecast) => React.ReactNode }> = [
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

export default function ForecastPage() {
  const [items, setItems] = useState<Forecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/forecast");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.forecasts) ? data.forecasts : []);
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
      serviceName="AWS Forecast"
      serviceHref="/forecast"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Forecast", href: "/forecast" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <SpaceBetween size="l">
        <Header variant="h2">AWS Forecast</Header>
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Container>
          <Box>
            AWS Forecast uses machine learning to generate time-series forecasts. Not available in
            local emulation.
          </Box>
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
