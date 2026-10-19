"use client";
import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Alert from "@cloudscape-design/components/alert";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";

export default function ComprehendPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/comprehend");
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
        setError("Failed to load classifiers from adapter SDK (LocalStack / MiniStack)");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <ServiceLayout
      serviceName="Comprehend"
      serviceCategory="Services"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Comprehend", href: "/comprehend" },
      ]}
    >
      <SpaceBetween size="l" direction="vertical">
        <Box padding="l">
          <Header variant="h2">Comprehend - Classifiers</Header>
          {loading ? (
            <Box>Loading classifiers from adapter SDK...</Box>
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
                Showing <strong>{data.length}</strong> classifiers fetched via adapter SDK (
                <StatusIndicator type="success">LocalStack / MiniStack</StatusIndicator> mode).
              </Box>
            </>
          )}
        </Box>
      </SpaceBetween>
    </ServiceLayout>
  );
}
