"use client";
import { useCallback, useEffect, useState } from "react";
import { AdapterResourceTable } from "@/components/service-layout/AdapterResourceTable";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";

export default function PinpointPage() {
  const [data, setData] = useState<
    Array<{ Id?: string; Name?: string; CreationDate?: string; LastModifiedDate?: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/pinpoint");
      const payload = (await response.json()) as { apps?: typeof data; error?: string };
      if (!response.ok || payload.error) throw new Error(payload.error || "Failed to load apps");
      setData(payload.apps ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load apps");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  return (
    <ServiceLayout
      serviceName="Pinpoint"
      serviceCategory="Services"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Pinpoint", href: "/pinpoint" },
      ]}
    >
      <AdapterResourceTable
        resourceName="Pinpoint applications"
        items={data}
        loading={loading}
        error={error}
        filterText={filterText}
        onFilterChange={setFilterText}
        onRefresh={() => void load()}
        columns={[
          { id: "id", header: "Application ID", cell: (item) => item.Id || "—", isRowHeader: true },
          { id: "name", header: "Name", cell: (item) => item.Name || "—" },
          { id: "created", header: "Created", cell: (item) => item.CreationDate || "—" },
          { id: "updated", header: "Updated", cell: (item) => item.LastModifiedDate || "—" },
        ]}
      />
    </ServiceLayout>
  );
}
