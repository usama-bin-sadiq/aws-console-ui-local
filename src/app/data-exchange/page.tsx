"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { Header, Container, Box, SpaceBetween, Alert } from "@cloudscape-design/components";
import { apiFetch } from "@/lib/api-client";

interface Listing {
  ListingId?: string;
  Title?: string;
  Provider?: string;
  Category?: string;
}

const COLUMN_DEFINITIONS: Array<{ header: string; cell: (item: Listing) => React.ReactNode }> = [
  {
    header: "Title",
    cell: (item) => item.Title || "—",
  },
  {
    header: "Provider",
    cell: (item) => item.Provider || "—",
  },
  {
    header: "Category",
    cell: (item) => item.Category || "—",
  },
];

export default function DataExchangePage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/data-exchange");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.listings) ? data.listings : []);
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
      serviceName="AWS Data Exchange"
      serviceHref="/data-exchange"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Data Exchange", href: "/data-exchange" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <SpaceBetween size="l">
        <Header variant="h2">AWS Data Exchange</Header>
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Container>
          <Box>
            AWS Data Exchange makes it easy to find, subscribe to, and use third-party data in the
            cloud. Not available in local emulation.
          </Box>
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
