"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { Header, Container, Box, SpaceBetween, Alert } from "@cloudscape-design/components";
import { apiFetch } from "@/lib/api-client";

interface Job {
  JobId?: string;
  Name?: string;
  Status?: string;
  CreatedAt?: string;
}

const COLUMN_DEFINITIONS: Array<{ header: string; cell: (item: Job) => React.ReactNode }> = [
  {
    header: "Name",
    cell: (item) => item.Name || "—",
  },
  {
    header: "Job ID",
    cell: (item) => item.JobId || "—",
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

export default function TextractPage() {
  const [items, setItems] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(false);
    setError(null);
    try {
      const res = await apiFetch("/api/textract");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.jobs) ? data.jobs : []);
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
      serviceName="AWS Textract"
      serviceHref="/textract"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Textract", href: "/textract" },
      ]}
      healthStatus="checking"
      healthReason="Checking emulator availability..."
    >
      <SpaceBetween size="l">
        <Header variant="h2">AWS Textract</Header>
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Container>
          <Box>
            AWS Textract extracts text and data from documents using machine learning. Not available
            in local emulation.
          </Box>
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
