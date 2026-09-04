"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";

interface Detector {
  DetectorId: string;
}

export default function GuardDutyPage() {
  const [detectors, setDetectors] = useState<Detector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enabling, setEnabling] = useState(false);

  const fetchDetectors = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/guardduty");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch detectors");
      setDetectors(data.detectors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch detectors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetectors();
  }, []);

  const enableGuardDuty = async () => {
    setEnabling(true);
    try {
      const res = await fetch("/api/guardduty", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to enable GuardDuty");
      }
      fetchDetectors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enable GuardDuty");
    } finally {
      setEnabling(false);
    }
  };

  const deleteDetector = async (detectorId: string) => {
    try {
      const res = await fetch(`/api/guardduty?detectorId=${encodeURIComponent(detectorId)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete detector");
      }
      fetchDetectors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete detector");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Amazon GuardDuty</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            header={
              <Header
                variant="h2"
                actions={
                  <Button variant="primary" onClick={enableGuardDuty} loading={enabling}>
                    Enable GuardDuty
                  </Button>
                }
              >
                Detectors ({detectors.length})
              </Header>
            }
            items={detectors}
            columnDefinitions={[
              { header: "Detector ID", cell: (item) => item.DetectorId },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteDetector(item.DetectorId)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">GuardDuty is not enabled.</Box>}
          />
        </Container>
      </SpaceBetween>
    </div>
  );
}
