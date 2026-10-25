"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { Header, Container, Box, SpaceBetween, Alert } from "@cloudscape-design/components";
import { apiFetch } from "@/lib/api-client";

interface Event {
  EventArn?: string;
  Service?: string;
  EventTypeCode?: string;
  Region?: string;
  StartTime?: string;
  Status?: string;
}

const COLUMN_DEFINITIONS: Array<{ header: string; cell: (item: Event) => React.ReactNode }> = [
  {
    header: "Service",
    cell: (item) => item.Service || "—",
  },
  {
    header: "Event Type",
    cell: (item) => item.EventTypeCode || "—",
  },
  {
    header: "Region",
    cell: (item) => item.Region || "—",
  },
  {
    header: "Status",
    cell: (item) => item.Status || "—",
  },
  {
    header: "Start Time",
    cell: (item) => (item.StartTime ? new Date(item.StartTime).toLocaleString() : "—"),
  },
];

export default function PersonalHealthDashboardPage() {
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/personal-health-dashboard");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.events) ? data.events : []);
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
      serviceName="AWS Personal Health Dashboard"
      serviceHref="/personal-health-dashboard"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Personal Health Dashboard", href: "/personal-health-dashboard" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <SpaceBetween size="l">
        <Header variant="h2">AWS Personal Health Dashboard</Header>
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Container>
          <Box>
            The Personal Health Dashboard provides alerts and remediation guidance when AWS events
            impact your resources. Not available in local emulation.
          </Box>
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
