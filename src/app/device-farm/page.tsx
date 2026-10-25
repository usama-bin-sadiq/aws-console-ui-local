"use client";
import { useEffect, useState } from "react";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Alert from "@cloudscape-design/components/alert";
import Header from "@cloudscape-design/components/header";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { useRouter } from "next/navigation";

export default function DeviceFarmPage() {
  const [data, setData] = useState([]);

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/device-farm");
        if (!r.ok) {
          const d = await r.json().catch(() => null);
          setData([]);
          setMessage((d && (d.message || d.error)) || `Request failed with status ${r.status}`);
        } else {
          const d = await r.json();
          setData(
            Array.isArray(d.items)
              ? d.items
              : Array.isArray(d.results)
                ? d.results
                : Array.isArray(d.data)
                  ? d.data
                  : [],
          );
          if (typeof d.message === "string" && d.message.length > 0) {
            setMessage(d.message);
          }
        }
      } catch {
        setError("Failed to load projects from adapter SDK (LocalStack / MiniStack)");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ServiceLayout
      serviceName="Device Farm"
      serviceCategory="Services"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Device Farm", href: "/device-farm" },
      ]}
    >
      <SpaceBetween size="l" direction="vertical">
        <Box padding="l">
          <Header variant="h2">Device Farm - Projects</Header>
          {loading ? (
            <Box>Loading projects from adapter SDK...</Box>
          ) : error ? (
            <Alert type="error" dismissible onDismiss={() => setError("")}>
              {error}
            </Alert>
          ) : (
            <>
              {message && (
                <Alert type="info" dismissible onDismiss={() => setMessage("")}>
                  {message}
                </Alert>
              )}
              <Box variant="p" padding={{ top: "m" }}>
                Showing <strong>{data.length}</strong> projects fetched via adapter SDK (
                <StatusIndicator type="success">LocalStack / MiniStack</StatusIndicator> mode).
              </Box>
            </>
          )}
        </Box>
      </SpaceBetween>
    </ServiceLayout>
  );
}
