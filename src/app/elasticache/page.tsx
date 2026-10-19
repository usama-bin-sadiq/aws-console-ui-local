"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AdapterResourceTable } from "@/components/service-layout/AdapterResourceTable";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";

export default function ElastiCachePage() {
  const [data, setData] = useState<
    Array<{
      CacheClusterId?: string;
      CacheNodeType?: string;
      Engine?: string;
      CacheClusterStatus?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/elasticache");
      const payload = (await response.json()) as { clusters?: typeof data; error?: string };
      if (!response.ok || payload.error)
        throw new Error(payload.error || "Failed to load clusters");
      setData(payload.clusters ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load clusters");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ServiceLayout
      serviceName="ElastiCache"
      serviceCategory="Services"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "ElastiCache", href: "/elasticache" },
      ]}
    >
      <AdapterResourceTable
        resourceName="ElastiCache clusters"
        items={data}
        loading={loading}
        error={error}
        filterText={filterText}
        onFilterChange={setFilterText}
        onRefresh={() => void load()}
        columns={[
          {
            id: "id",
            header: "Cluster ID",
            cell: (item) => item.CacheClusterId || "—",
            isRowHeader: true,
          },
          { id: "engine", header: "Engine", cell: (item) => item.Engine || "—" },
          { id: "type", header: "Node type", cell: (item) => item.CacheNodeType || "—" },
          { id: "status", header: "Status", cell: (item) => item.CacheClusterStatus || "—" },
        ]}
      />
    </ServiceLayout>
  );
}
