"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";

interface Finding {
  findingArn?: string;
  title?: string;
  severity?: string;
  status?: string;
}

export default function InspectorPage() {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchFindings = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/inspector");
        const data = await res.json();
        setFindings(data.findings || []);
        if (data.message) setMessage(data.message);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Failed to fetch findings");
      } finally {
        setLoading(false);
      }
    };
    fetchFindings();
  }, []);

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Amazon Inspector</Header>

        {message && (
          <Alert type="info" header="Inspector not enabled">
            {message}
          </Alert>
        )}

        <Container>
          <Table
            header={<Header variant="h2">Findings ({findings.length})</Header>}
            items={findings}
            columnDefinitions={[
              { header: "Title", cell: (item) => item.title || "—" },
              { header: "Severity", cell: (item) => item.severity || "—" },
              { header: "Status", cell: (item) => item.status || "—" },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No findings found.</Box>}
          />
        </Container>
      </SpaceBetween>
    </div>
  );
}
