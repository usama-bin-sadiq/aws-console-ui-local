"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { Header, Container, Box, SpaceBetween, Alert } from "@cloudscape-design/components";
import { apiFetch } from "@/lib/api-client";

interface Listing {
  ListingId?: string;
  Title?: string;
  Seller?: string;
  Category?: string;
}

const COLUMN_DEFINITIONS: Array<{ header: string; cell: (item: Listing) => React.ReactNode }> = [
  {
    header: "Title",
    cell: (item) => item.Title || "—",
  },
  {
    header: "Seller",
    cell: (item) => item.Seller || "—",
  },
  {
    header: "Category",
    cell: (item) => item.Category || "—",
  },
];

export default function MarketplacePage() {
  const [items, setItems] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/marketplace");
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
    queueMicrotask(() => {
      void fetchItems();
    });
  }, [fetchItems]);

  return (
    <ServiceLayout
      serviceName="AWS Marketplace"
      serviceHref="/marketplace"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Marketplace", href: "/marketplace" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <SpaceBetween size="l">
        <Header variant="h2">AWS Marketplace</Header>
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Container>
          <Box>
            AWS Marketplace is a digital catalog with thousands of software listings from
            independent software vendors. Not available in local emulation.
          </Box>
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
