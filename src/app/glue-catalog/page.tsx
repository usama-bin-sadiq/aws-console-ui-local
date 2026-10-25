"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
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
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface GlueDatabase {
  Name: string;
  Description?: string;
}

interface GlueTable {
  Name?: string;
  DatabaseName?: string;
  CreateTime?: string;
}

interface GlueCrawler {
  Name?: string;
  State?: string;
  DatabaseName?: string;
}

interface GlueJob {
  Name: string;
  JobRunState?: string;
}

export default function GlueCatalogPage() {
  const [databases, setDatabases] = useState<GlueDatabase[]>([]);
  const [tables, setTables] = useState<GlueTable[]>([]);
  const [crawlers, setCrawlers] = useState<GlueCrawler[]>([]);
  const [jobs, setJobs] = useState<GlueJob[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState("");

  const [createDbModal, setCreateDbModal] = useState(false);
  const [dbName, setDbName] = useState("");
  const [creatingDb, setCreatingDb] = useState(false);
  const [dbNameError, setDbNameError] = useState<string | null>(null);

  const [createCrawlerModal, setCreateCrawlerModal] = useState(false);
  const [crawlerName, setCrawlerName] = useState("");
  const [crawlerRole, setCrawlerRole] = useState("");
  const [creatingCrawler, setCreatingCrawler] = useState(false);
  const [crawlerNameError, setCrawlerNameError] = useState<string | null>(null);

  const [createJobModal, setCreateJobModal] = useState(false);
  const [jobName, setJobName] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [creatingJob, setCreatingJob] = useState(false);
  const [jobNameError, setJobNameError] = useState<string | null>(null);
  const [jobRoleError, setJobRoleError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/glue");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch Glue data");
      setDatabases(data.databases || []);
      setTables(data.tables || []);
      const crawlerList = data.crawlers || [];
      setCrawlers(
        Array.isArray(crawlerList)
          ? crawlerList.map((c: string | { Name?: string; State?: string }) =>
              typeof c === "string" ? { Name: c, State: "READY" } : c,
            )
          : [],
      );
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Glue data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchData();
    });
  }, []);

  const createDatabase = async () => {
    if (!dbName.trim()) {
      setDbNameError("Database name is required");
      return;
    }
    setDbNameError(null);
    setCreatingDb(true);
    try {
      const res = await apiFetch("/api/glue", {
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

  const createCrawler = async () => {
    if (!crawlerName.trim()) {
      setCrawlerNameError("Crawler name is required");
      return;
    }
    setCrawlerNameError(null);
    setCreatingCrawler(true);
    try {
      const res = await apiFetch("/api/glue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createCrawler",
          name: crawlerName,
          role: crawlerRole || "arn:aws:iam::000000000000:role/glue-crawler-role",
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create crawler");
      }
      setCreateCrawlerModal(false);
      setCrawlerName("");
      setCrawlerRole("");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create crawler");
    } finally {
      setCreatingCrawler(false);
    }
  };

  const createJob = async () => {
    let hasError = false;
    if (!jobName.trim()) {
      setJobNameError("Job name is required");
      hasError = true;
    } else {
      setJobNameError(null);
    }
    if (!jobRole.trim()) {
      setJobRoleError("IAM role is required");
      hasError = true;
    } else {
      setJobRoleError(null);
    }
    if (hasError) return;
    setCreatingJob(true);
    try {
      const res = await apiFetch("/api/glue", {
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
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS Glue Data Catalog"
          serviceIcon={SERVICE_ICONS["/glue-catalog"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/glue-catalog/create")}
          >
            Create database
          </button>
        />

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container className="aws-table-card">
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
                      { header: "Name", cell: (item: GlueDatabase) => item.Name },
                      {
                        header: "Description",
                        cell: (item: GlueDatabase) => item.Description || "—",
                      },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No databases found.</Box>}
                  />
                ),
              },
              {
                label: "Tables",
                id: "tables",
                content: (
                  <Table
                    header={<Header variant="h2">Tables ({tables.length})</Header>}
                    items={tables}
                    columnDefinitions={[
                      { header: "Name", cell: (item: GlueTable) => item.Name || "—" },
                      { header: "Database", cell: (item: GlueTable) => item.DatabaseName || "—" },
                      { header: "Created", cell: (item: GlueTable) => item.CreateTime || "—" },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No tables found.</Box>}
                  />
                ),
              },
              {
                label: "Crawlers",
                id: "crawlers",
                content: (
                  <Table
                    header={
                      <Header
                        variant="h2"
                        actions={
                          <Button variant="primary" onClick={() => setCreateCrawlerModal(true)}>
                            Create crawler
                          </Button>
                        }
                      >
                        Crawlers ({crawlers.length})
                      </Header>
                    }
                    items={crawlers}
                    columnDefinitions={[
                      { header: "Name", cell: (item: GlueCrawler) => item.Name || "—" },
                      { header: "State", cell: (item: GlueCrawler) => item.State || "—" },
                      { header: "Database", cell: (item: GlueCrawler) => item.DatabaseName || "—" },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No crawlers found.</Box>}
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
                      { header: "Name", cell: (item: GlueJob) => item.Name },
                      {
                        header: "Last run state",
                        cell: (item: GlueJob) => item.JobRunState || "—",
                      },
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
          <FormField
            label={
              <>
                Database name <span style={{ color: "red" }}>*</span>
              </>
            }
            constraintText="Required"
            errorText={dbNameError}
          >
            <Input
              value={dbName}
              onChange={(e) => {
                setDbName(e.detail.value);
                setDbNameError(null);
              }}
              placeholder="my-database"
            />
          </FormField>
        </Modal>

        {/* Create Crawler Modal */}
        <Modal
          visible={createCrawlerModal}
          onDismiss={() => {
            setCreateCrawlerModal(false);
            setCrawlerName("");
            setCrawlerRole("");
          }}
          header="Create crawler"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setCreateCrawlerModal(false);
                  setCrawlerName("");
                  setCrawlerRole("");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={createCrawler} loading={creatingCrawler}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField
              label={
                <>
                  Crawler name <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={crawlerNameError}
            >
              <Input
                value={crawlerName}
                onChange={(e) => {
                  setCrawlerName(e.detail.value);
                  setCrawlerNameError(null);
                }}
                placeholder="my-crawler"
              />
            </FormField>
            <FormField label="IAM role">
              <Input
                value={crawlerRole}
                onChange={(e) => setCrawlerRole(e.detail.value)}
                placeholder="arn:aws:iam::123456789012:role/GlueCrawlerRole"
              />
            </FormField>
          </SpaceBetween>
        </Modal>

        {/* Create Job Modal */}
        <Modal
          visible={createJobModal}
          onDismiss={() => {
            setCreateJobModal(false);
            setJobName("");
            setJobRole("");
          }}
          header="Create Glue job"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setCreateJobModal(false);
                  setJobName("");
                  setJobRole("");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={createJob} loading={creatingJob}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField
              label={
                <>
                  Job name <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={jobNameError}
            >
              <Input
                value={jobName}
                onChange={(e) => {
                  setJobName(e.detail.value);
                  setJobNameError(null);
                }}
                placeholder="my-job"
              />
            </FormField>
            <FormField
              label={
                <>
                  IAM role <span style={{ color: "red" }}>*</span>
                </>
              }
              constraintText="Required"
              errorText={jobRoleError}
            >
              <Input
                value={jobRole}
                onChange={(e) => {
                  setJobRole(e.detail.value);
                  setJobRoleError(null);
                }}
                placeholder="arn:aws:iam::123456789012:role/GlueRole"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
