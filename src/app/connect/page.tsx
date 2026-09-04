"use client";
import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Alert from "@cloudscape-design/components/alert";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";

export default function connectPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/connect")
      .then(r => r.json())
      .then(d => { setData(d.items || d.results || d.data || d || []); setLoading(false); })
      .catch(() => { setError("Failed to load instances from adapter SDK (LocalStack / MiniStack)"); setLoading(false); });
  }, []);

  return (
    <ServiceLayout serviceName="Amazon Connect" serviceCategory="Services"
      breadcrumbs={[{ text: "Services", href: "/" }, { text: "Amazon Connect", href: "/connect" }]}>
      <SpaceBetween size="l" direction="vertical">
        <Box padding="l" style={{ background: "var(--awsui-color-background-container-content)", borderRadius: 8, border: "1px solid var(--awsui-color-border-divider-default)" }}>
          <Header variant="h2">Amazon Connect - Instances</Header>
          {loading ? (
            <Box>Loading instances from adapter SDK...</Box>
          ) : error ? (
            <Alert type="error" dismissible onDismiss={() => setError("")>{error}</Alert>
          ) : (
            <Box variant="p" padding={{ top: "m" }}>
              Showing <strong>{data.length}</strong> instances fetched via adapter SDK (<StatusIndicator type="success">LocalStack / MiniStack</StatusIndicator> mode).
            </Box>
          )}
        </Box>
      </SpaceBetween>
    </ServiceLayout>
  );
}
