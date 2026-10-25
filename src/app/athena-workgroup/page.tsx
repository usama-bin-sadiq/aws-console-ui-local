"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import { CodeView } from "@cloudscape-design/code-view";
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
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface AthenaWorkgroup {
  Name: string;
  State?: string;
}

interface AthenaCatalog {
  CatalogName: string;
  Type?: string;
}

export default function AthenaWorkgroupPage() {
  const [workgroups, setWorkgroups] = useState<AthenaWorkgroup[]>([]);
  const [catalogs, setCatalogs] = useState<AthenaCatalog[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState("");

  const [queryModal, setQueryModal] = useState(false);
  const [queryString, setQueryString] = useState("");
  const [queryWorkgroup, setQueryWorkgroup] = useState("primary");
  const [queryResult, setQueryResult] = useState("");
  const [runningQuery, setRunningQuery] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/athena");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch Athena data");
      setWorkgroups(data.workgroups || []);
      setCatalogs(data.catalogs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch Athena data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchData();
    });
  }, []);

  const startQuery = async () => {
    setRunningQuery(true);
    setQueryResult("");
    try {
      const res = await apiFetch("/api/athena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queryString, workGroup: queryWorkgroup }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start query");
      setQueryResult(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start query");
      setQueryModal(false);
    } finally {
      setRunningQuery(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Amazon Athena"
          serviceIcon={SERVICE_ICONS["/athena-workgroup"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/athena-workgroup/create")}
          >
            Create workgroup
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
                      { header: "Name", cell: (item) => item.Name },
                      { header: "State", cell: (item) => item.State || "—" },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No workgroups found.</Box>}
                  />
                ),
              },
              {
                label: "Data catalogs",
                id: "catalogs",
                content: (
                  <Table
                    header={<Header variant="h2">Data catalogs ({catalogs.length})</Header>}
                    items={catalogs}
                    columnDefinitions={[
                      { header: "Catalog name", cell: (item) => item.CatalogName },
                      { header: "Type", cell: (item) => item.Type || "—" },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No data catalogs found.</Box>}
                  />
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
          }}
          header="Start query execution"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setQueryModal(false);
                  setQueryResult("");
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
                <CodeView content={queryResult} lineNumbers wrapLines />
              </FormField>
            )}
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
