"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useState } from "react";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Alert from "@cloudscape-design/components/alert";

export default function IAMCredentialReportPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/iam/credential-report", { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setReport(data.report || "Report generated.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">IAM Credential Report</Header>
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Container>
          <SpaceBetween size="m">
            <Box>
              The credential report lists all IAM users and the status of their credentials
              (passwords, access keys, MFA devices).
            </Box>
            <Button variant="primary" onClick={generateReport} loading={loading}>
              Generate Credential Report
            </Button>
            {report && (
              <pre
                style={{
                  background: "var(--awsui-color-background-container-content)",
                  padding: "12px",
                  borderRadius: "4px",
                  overflow: "auto",
                  maxHeight: "400px",
                  fontSize: "12px",
                  whiteSpace: "pre-wrap",
                }}
              >
                {report}
              </pre>
            )}
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
