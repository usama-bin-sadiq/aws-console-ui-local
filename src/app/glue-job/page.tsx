"use client";
import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";

interface GlueJob {
  Name: string;
  JobRunState?: string;
  Command?: { Name?: string; ScriptLocation?: string };
  Role?: string;
}

export default function GlueJobPage() {
  const [jobs, setJobs] = useState<GlueJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [startModal, setStartModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [startResult, setStartResult] = useState("");

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/glue");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch Glue jobs");
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Glue jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const startJobRun = async () => {
    if (!selectedJob) return;
    setStarting(true);
    setStartResult("");
    try {
      const res = await fetch("/api/glue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "startJobRun", jobName: selectedJob }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start job run");
      setStartResult(`Job run started: ${data.jobRunId || "OK"}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start job run");
    } finally {
      setStarting(false);
    }
  };

  const deleteJob = async (name: string) => {
    try {
      const res = await fetch(`/api/glue?type=job&name=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete job");
      }
      fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete job");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Glue ETL Jobs</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            header={
              <Header variant="h2">Jobs ({jobs.length})</Header>
            }
            items={jobs}
            columnDefinitions={[
              { header: "Name", cell: (item: GlueJob) => item.Name },
              { header: "Command", cell: (item: GlueJob) => item.Command?.Name || "—" },
              { header: "Script location", cell: (item: GlueJob) => item.Command?.ScriptLocation || "—" },
              { header: "Role", cell: (item: GlueJob) => item.Role || "—" },
              { header: "Last run state", cell: (item: GlueJob) => item.JobRunState || "—" },
              {
                header: "Actions",
                cell: (item: GlueJob) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      onClick={() => {
                        setSelectedJob(item.Name);
                        setStartModal(true);
                      }}
                      formAction="none"
                    >
                      Start run
                    </Button>
                    <Button onClick={() => deleteJob(item.Name)} formAction="none">
                      Delete
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No jobs found.</Box>}
          />
        </Container>

        <Modal
          visible={startModal}
          onDismiss={() => {
            setStartModal(false);
            setSelectedJob(null);
            setStartResult("");
          }}
          header="Start job run"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setStartModal(false);
                  setSelectedJob(null);
                  setStartResult("");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={startJobRun} loading={starting}>
                Start
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Job name">
              <Input value={selectedJob || ""} readOnly placeholder="—" />
            </FormField>
            {startResult && (
              <FormField label="Result">
                <div style={{ padding: "8px", background: "#1a1a2e", color: "#0f0", borderRadius: "4px" }}>
                  {startResult}
                </div>
              </FormField>
            )}
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
