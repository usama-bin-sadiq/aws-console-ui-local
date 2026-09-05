"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AdapterResourceTable } from "@/components/service-layout/AdapterResourceTable";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";

export default function AmplifyPage() {
  const [data, setData] = useState<Array<{ appId?: string; name?: string; platform?: string; status?: string; updateTime?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true); setError(null);
    try { const response = await fetch("/api/amplify"); const payload = await response.json() as { apps?: typeof data; error?: string }; if (!response.ok || payload.error) throw new Error(payload.error || "Failed to load apps"); setData(payload.apps ?? []); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to load apps"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return (
    <ServiceLayout serviceName="Amplify" serviceCategory="Services"
      breadcrumbs={[{ text: "Services", href: "/" }, { text: "Amplify", href: "/amplify" }]}>
      <AdapterResourceTable resourceName="Amplify apps" items={data} loading={loading} error={error} filterText={filterText} onFilterChange={setFilterText} onRefresh={() => void load()} columns={[{ id: "appId", header: "App ID", cell: (item) => item.appId || "—" }, { id: "name", header: "Name", cell: (item) => item.name || "—", isRowHeader: true }, { id: "platform", header: "Platform", cell: (item) => item.platform || "—" }, { id: "status", header: "Status", cell: (item) => item.status || "—" }, { id: "updated", header: "Updated", cell: (item) => item.updateTime || "—" }]} />
    </ServiceLayout>
  );
}
