"use client";
import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Alert from "@cloudscape-design/components/alert";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";

export default function RekognitionPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/rekognition");
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
        setError("Failed to load collections from adapter SDK (LocalStack / MiniStack)");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ServiceLayout
      serviceName="Rekognition"
      serviceCategory="Services"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Rekognition", href: "/rekognition" },
      ]}
    >
      <SpaceBetween size="l" direction="vertical">
        <div
          style={{
            background: "var(--awsui-color-background-container-content)",
            borderRadius: 8,
            border: "1px solid var(--awsui-color-border-divider-default)",
          }}
        >
          <Box padding="l">
            <Header variant="h2">Rekognition - Collections</Header>
            {loading ? (
              <Box>Loading collections from adapter SDK...</Box>
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
                  Showing <strong>{data.length}</strong> collections fetched via adapter SDK (
                  <StatusIndicator type="success">LocalStack / MiniStack</StatusIndicator> mode).
                </Box>
              </>
            )}
          </Box>
        </div>
      </SpaceBetween>
    </ServiceLayout>
  );
}
