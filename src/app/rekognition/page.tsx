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

  useEffect(() => {
    fetch("/api/rekognition")
      .then(r => r.json())
      .then(d => { setData(d.items || d.results || d.data || d || []); setLoading(false); })
      .catch(() => { setError("Failed to load collections from adapter SDK (LocalStack / MiniStack)"); setLoading(false); });
  }, []);

  return (
    <ServiceLayout serviceName="Rekognition" serviceCategory="Services"
      breadcrumbs={[{ text: "Services", href: "/" }, { text: "Rekognition", href: "/rekognition" }]}>
      <SpaceBetween size="l" direction="vertical">
        <div style={{ background: "var(--awsui-color-background-container-content)", borderRadius: 8, border: "1px solid var(--awsui-color-border-divider-default)" }}>
        <Box padding="l">
          <Header variant="h2">Rekognition - Collections</Header>
          {loading ? (
            <Box>Loading collections from adapter SDK...</Box>
          ) : error ? (
            <Alert type="error" dismissible onDismiss={() => setError("")}>{error}</Alert>
          ) : (
            <Box variant="p" padding={{ top: "m" }}>
              Showing <strong>{data.length}</strong> collections fetched via adapter SDK (<StatusIndicator type="success">LocalStack / MiniStack</StatusIndicator> mode).
            </Box>
          )}
        </Box>
        </div>
      </SpaceBetween>
    </ServiceLayout>
  );
}
