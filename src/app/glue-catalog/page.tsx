"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Tabs from "@cloudscape-design/components/tabs";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";

interface GlueDatabase {
  Name: string;
  Description?: string;
}

interface GlueJob {
  Name: string;
  JobRunState?: string;
}

export default function GlueCatalogPage() {
  const [databases, setDatabases] = useState<GlueDatabase[]>([]);
  const [jobs, setJobs] = useState<GlueJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createDbModal, setCreateDbModal] = useState(false);
  const [dbName, setDbName] = useState("");
  const [creatingDb, setCreatingDb] = useState(false);

  const [createJobModal, setCreateJobModal] = useState(false);
  const [jobName, setJobName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [creatingJob, setCreatingJob] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/glue");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch Glue data");
      setDatabases(data.databases || []);
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Glue data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createDatabase = async () => {
    setCreatingDb(true);
    try {
      const res = await fetch("/api/glue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createDatabase", name: dbName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create database");
      }
      setCreateDbModal(false);
      setDbName("");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create database");
    } finally {
      setCreatingDb(false);
    }
  };

  const createJob = async () => {
    setCreatingJob(true);
    try {
      const res = await fetch("/api/glue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createJob", name: jobName, role: jobRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create job");
      }
      setCreateJobModal(false);
      setJobName("");
      setJobRole("");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setCreatingJob(false);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS Glue Data Catalog</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container>
          <Tabs
            tabs={[
              {
                label: "Databases",
                id: "databases",
                content: (
                  <Table
                    header={
                      <Header
                        variant="h2"
                        actions={
                          <Button variant="primary" onClick={() => setCreateDbModal(true)}>
                            Create database
                          </Button>
                        }
                      >
                        Databases ({databases.length})
                      </Header>
                    }
                    items={databases}
                    columnDefinitions={[
                      { header: "Name", cell: (item) => item.Name },
                      { header: "Description", cell: (item) => item.Description || "—" },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No databases found.</Box>}
                  />
                ),
              },
              {
                label: "Jobs",
                id: "jobs",
                content: (
                  <Table
                    header={
                      <Header
                        variant="h2"
                        actions={
                          <Button variant="primary" onClick={() => setCreateJobModal(true)}>
                            Create job
                          </Button>
                        }
                      >
                        Jobs ({jobs.length})
                      </Header>
                    }
                    items={jobs}
                    columnDefinitions={[
                      { header: "Name", cell: (item) => item.Name },
                      { header: "Last run state", cell: (item) => item.JobRunState || "—" },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No jobs found.</Box>}
                  />
                ),
              },
            ]}
          />
        </Container>

        {/* Create Database Modal */}
        <Modal
          visible={createDbModal}
          onDismiss={() => setCreateDbModal(false)}
          header="Create Glue database"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateDbModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createDatabase} loading={creatingDb}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Database name" constraintText="Required">
            <Input
              value={dbName}
              onChange={(e) => setDbName(e.detail.value)}
              placeholder="my-database"
            />
          </FormField>
        </Modal>

        {/* Create Job Modal */}
        <Modal
          visible={createJobModal}
          onDismiss={() => setCreateJobModal(false)}
          header="Create Glue job"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateJobModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createJob} loading={creatingJob}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Job name" constraintText="Required">
              <Input
                value={jobName}
                onChange={(e) => setJobName(e.detail.value)}
                placeholder="my-job"
              />
            </FormField>
            <FormField label="IAM role" constraintText="Required">
              <Input
                value={jobRole}
                onChange={(e) => setJobRole(e.detail.value)}
                placeholder="arn:aws:iam::123456789012:role/GlueRole"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
