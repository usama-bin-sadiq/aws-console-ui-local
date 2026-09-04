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
import Textarea from "@cloudscape-design/components/textarea";

interface AthenaWorkgroup {
  Name: string;
  State?: string;
  Description?: string;
}

interface AthenaCatalog {
  CatalogName: string;
  Type?: string;
  Description?: string;
}

interface NamedQuery {
  NamedQueryId?: string;
  Name?: string;
  Database?: string;
  QueryString?: string;
}

export default function AthenaPage() {
  const [workgroups, setWorkgroups] = useState<AthenaWorkgroup[]>([]);
  const [catalogs, setCatalogs] = useState<AthenaCatalog[]>([]);
  const [namedQueries, setNamedQueries] = useState<NamedQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [queryModal, setQueryModal] = useState(false);
  const [queryString, setQueryString] = useState("");
  const [queryWorkgroup, setQueryWorkgroup] = useState("primary");
  const [queryResult, setQueryResult] = useState("");
  const [runningQuery, setRunningQuery] = useState(false);

  const [createQueryModal, setCreateQueryModal] = useState(false);
  const [newQueryName, setNewQueryName] = useState("");
  const [newQueryString, setNewQueryString] = useState("");
  const [creatingQuery, setCreatingQuery] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/athena");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch Athena data");
      setWorkgroups(data.workgroups || []);
      setCatalogs(data.catalogs || []);
      setNamedQueries(data.namedQueries || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Athena data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const startQuery = async () => {
    setRunningQuery(true);
    setQueryResult("");
    try {
      const res = await fetch("/api/athena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          queryString,
          workGroup: queryWorkgroup,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start query");
      setQueryResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start query");
      setQueryResult("");
    } finally {
      setRunningQuery(false);
    }
  };

  const createNamedQuery = async () => {
    setCreatingQuery(true);
    try {
      const res = await fetch("/api/athena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createNamedQuery",
          name: newQueryName,
          queryString: newQueryString,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create named query");
      }
      setCreateQueryModal(false);
      setNewQueryName("");
      setNewQueryString("");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create named query");
    } finally {
      setCreatingQuery(false);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Amazon Athena</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container>
          <Tabs
            tabs={[
              {
                label: "Workgroups",
                id: "workgroups",
                content: (
                  <Table
                    header={
                      <Header
                        variant="h2"
                        actions={
                          <Button variant="primary" onClick={() => setQueryModal(true)}>
                            Start query
                          </Button>
                        }
                      >
                        Workgroups ({workgroups.length})
                      </Header>
                    }
                    items={workgroups}
                    columnDefinitions={[
                      { header: "Name", cell: (item: AthenaWorkgroup) => item.Name },
                      { header: "State", cell: (item: AthenaWorkgroup) => item.State || "—" },
                      { header: "Description", cell: (item: AthenaWorkgroup) => item.Description || "—" },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No workgroups found.</Box>}
                  />
                ),
              },
              {
                label: "Named queries",
                id: "named-queries",
                content: (
                  <Table
                    header={
                      <Header
                        variant="h2"
                        actions={
                          <Button variant="primary" onClick={() => setCreateQueryModal(true)}>
                            Create named query
                          </Button>
                        }
                      >
                        Named queries ({namedQueries.length})
                      </Header>
                    }
                    items={namedQueries}
                    columnDefinitions={[
                      { header: "Name", cell: (item: NamedQuery) => item.Name || "—" },
                      { header: "Query ID", cell: (item: NamedQuery) => item.NamedQueryId || "—" },
                      { header: "Database", cell: (item: NamedQuery) => item.Database || "—" },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No named queries found.</Box>}
                  />
                ),
              },
              {
                label: "Data catalogs",
                id: "catalogs",
                content: (
                  <Table
                    header={
                      <Header variant="h2">
                        Data catalogs ({catalogs.length})
                      </Header>
                    }
                    items={catalogs}
                    columnDefinitions={[
                      { header: "Catalog name", cell: (item: AthenaCatalog) => item.CatalogName },
                      { header: "Type", cell: (item: AthenaCatalog) => item.Type || "—" },
                      { header: "Description", cell: (item: AthenaCatalog) => item.Description || "—" },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No data catalogs found.</Box>}
                  />
                ),
              },
              {
                label: "Query editor",
                id: "query-editor",
                content: (
                  <SpaceBetween size="m">
                    <Box>
                      <Button variant="primary" onClick={() => setQueryModal(true)}>
                        Open query editor
                      </Button>
                    </Box>
                    <div style={{ padding: "48px 16px", textAlign: "center", color: "var(--awsui-color-text-body-secondary)" }}>
                      Use the query editor to run SQL queries against your Athena workgroups.
                    </div>
                  </SpaceBetween>
                ),
              },
            ]}
          />
        </Container>

        {/* Start Query Modal */}
        <Modal
          visible={queryModal}
          onDismiss={() => {
            setQueryModal(false);
            setQueryResult("");
            setQueryString("");
          }}
          header="Query editor"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setQueryModal(false);
                  setQueryResult("");
                  setQueryString("");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={startQuery} loading={runningQuery}>
                Run query
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Query string" constraintText="Required">
              <Textarea
                value={queryString}
                onChange={(e) => setQueryString(e.detail.value)}
                placeholder="SELECT * FROM my_table LIMIT 10"
                rows={6}
              />
            </FormField>
            <FormField label="Workgroup">
              <Input
                value={queryWorkgroup}
                onChange={(e) => setQueryWorkgroup(e.detail.value)}
                placeholder="primary"
              />
            </FormField>
            {queryResult && (
              <FormField label="Result">
                <pre
                  style={{
                    background: "#1a1a2e",
                    color: "#0f0",
                    padding: "12px",
                    borderRadius: "4px",
                    overflow: "auto",
                    maxHeight: "300px",
                    fontSize: "12px",
                  }}
                >
                  {queryResult}
                </pre>
              </FormField>
            )}
          </SpaceBetween>
        </Modal>

        {/* Create Named Query Modal */}
        <Modal
          visible={createQueryModal}
          onDismiss={() => {
            setCreateQueryModal(false);
            setNewQueryName("");
            setNewQueryString("");
          }}
          header="Create named query"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setCreateQueryModal(false);
                  setNewQueryName("");
                  setNewQueryString("");
                }}
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={createNamedQuery} loading={creatingQuery}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Query name" constraintText="Required">
              <Input
                value={newQueryName}
                onChange={(e) => setNewQueryName(e.detail.value)}
                placeholder="my-query"
              />
            </FormField>
            <FormField label="Query string" constraintText="Required">
              <Textarea
                value={newQueryString}
                onChange={(e) => setNewQueryString(e.detail.value)}
                placeholder="SELECT * FROM my_table LIMIT 10"
                rows={6}
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
