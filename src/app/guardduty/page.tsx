"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Tabs from "@cloudscape-design/components/tabs";
import StatusIndicator from "@cloudscape-design/components/status-indicator";

interface Detector {
  DetectorId: string;
}

interface Finding {
  Id?: string;
  Title?: string;
  Severity?: number;
  Type?: string;
  Resource?: { Type?: string; Id?: string };
  CreatedAt?: string;
  UpdatedAt?: string;
}

// Normalize list payloads: a bare array or a wrapper object with an array under
// a known key. Anything else renders [].
function toArray<T = Record<string, unknown>>(d: unknown): T[] {
  if (Array.isArray(d)) return d as T[];
  if (d && typeof d === "object") {
    const o = d as Record<string, unknown>;
    for (const k of ["findings", "detectors", "items", "data", "results"]) {
      if (Array.isArray(o[k])) return o[k] as T[];
    }
  }
  return [];
}

export default function GuardDutyPage() {
  const [detectors, setDetectors] = useState<Detector[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [findingsLoading, setFindingsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [enabling, setEnabling] = useState(false);
  const [activeTab, setActiveTab] = useState("findings");

  const fetchDetectors = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/guardduty");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch detectors");
      setDetectors(toArray<Detector>(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch detectors");
    } finally {
      setLoading(false);
    }
  };

  const fetchFindings = async () => {
    setFindingsLoading(true);
    setMessage("");
    try {
      const res = await apiFetch("/api/guardduty?action=listFindings");
      const data = await res.json().catch(() => null);
      const list = toArray<Finding>(data);
      setFindings(list);
      const payload = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      const msg =
        payload && typeof payload.message === "string" && payload.message ? payload.message : "";
      const err =
        payload && typeof payload.error === "string" && payload.error ? payload.error : "";
      // Empty findings + message → surface as dismissible info alert; an
      // `{error}` payload must not render as a silent empty success list.
      if (list.length === 0 && msg) {
        setMessage(msg);
      } else if (err) {
        setError(err);
      }
    } catch {
      setFindings([]);
    } finally {
      setFindingsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetectors();
    fetchFindings();
  }, []);

  const enableGuardDuty = async () => {
    setEnabling(true);
    try {
      const res = await apiFetch("/api/guardduty", { method: "POST" });
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
      const res = await apiFetch(`/api/guardduty?detectorId=${encodeURIComponent(detectorId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete detector");
      }
      fetchDetectors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete detector");
    }
  };

  const archiveFinding = async (findingId: string) => {
    try {
      await apiFetch("/api/guardduty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "archiveFinding", findingId }),
      });
      fetchFindings();
    } catch {
      // ignore
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">Amazon GuardDuty</Header>
        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}
        {message && (
          <Alert type="info" dismissible onDismiss={() => setMessage("")}>
            {message}
          </Alert>
        )}

        <Tabs
          tabs={[
            {
              label: "Findings",
              id: "findings",
              content: (
                <Table
                  header={
                    <Header variant="h2" actions={<Button onClick={fetchFindings}>Refresh</Button>}>
                      Findings ({findings.length})
                    </Header>
                  }
                  items={findings}
                  loading={findingsLoading}
                  columnDefinitions={[
                    { header: "Title", cell: (item) => item.Title || "—" },
                    { header: "Type", cell: (item) => item.Type || "—" },
                    {
                      header: "Severity",
                      cell: (item) => {
                        const severity = item.Severity || 0;
                        const label = severity > 7 ? "High" : severity > 4 ? "Medium" : "Low";
                        const type = severity > 7 ? "error" : severity > 4 ? "warning" : "info";
                        return <StatusIndicator type={type as any}>{label}</StatusIndicator>;
                      },
                    },
                    { header: "Resource Type", cell: (item) => item.Resource?.Type || "—" },
                    { header: "Resource ID", cell: (item) => item.Resource?.Id || "—" },
                    { header: "Created", cell: (item) => item.CreatedAt || "—" },
                    {
                      header: "Actions",
                      cell: (item: Finding) => (
                        <Button onClick={() => archiveFinding(item.Id!)} formAction="none">
                          Archive
                        </Button>
                      ),
                    },
                  ]}
                  empty={<Box textAlign="center">No findings.</Box>}
                />
              ),
            },
            {
              label: "Detectors",
              id: "detectors",
              content: (
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
              ),
            },
          ]}
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(detail.activeTabId)}
        />
      </SpaceBetween>
    </div>
  );
}
