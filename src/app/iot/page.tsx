"use client";
import { apiFetch } from "@/lib/api-client";
import { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Tabs from "@cloudscape-design/components/tabs";
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface IoTThing {
  thingName: string;
  thingArn?: string;
}
interface IoTRule {
  ruleName: string;
  ruleArn?: string;
}
interface IoTCertificate {
  certificateId?: string;
  certificateArn?: string;
  status?: string;
}
interface IoTPolicy {
  policyName?: string;
  policyArn?: string;
}

export default function IoTPage() {
  const [things, setThings] = useState<IoTThing[]>([]);
  const [rules, setRules] = useState<IoTRule[]>([]);
  const [certificates, setCertificates] = useState<IoTCertificate[]>([]);
  const [policies, setPolicies] = useState<IoTPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [thingName, setThingName] = useState("");
  const [policyName, setPolicyName] = useState("");
  const [policyDoc, setPolicyDoc] = useState("{}");
  const [policyModal, setPolicyModal] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/iot");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setThings(data.things || []);
      setRules(data.rules || []);
      setCertificates(data.certificates || []);
      setPolicies(data.policies || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchData();
    });
  }, []);

  const createThing = async () => {
    await apiFetch("/api/iot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thingName }),
    });
    setCreateModal(false);
    setThingName("");
    fetchData();
  };

  const deleteThing = async (name: string) => {
    await apiFetch(`/api/iot?type=thing&name=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchData();
  };

  const createPolicy = async () => {
    await apiFetch("/api/iot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "createPolicy", policyName, policyDocument: policyDoc }),
    });
    setPolicyModal(false);
    setPolicyName("");
    setPolicyDoc("{}");
    fetchData();
  };

  const deletePolicy = async (name: string) => {
    await apiFetch(`/api/iot?type=policy&name=${encodeURIComponent(name || "")}`, {
      method: "DELETE",
    });
    fetchData();
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AWS IoT"
          serviceIcon={SERVICE_ICONS["/iot"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/iot/create")}
          >
            Create thing
          </button>
        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Container className="aws-table-card">
          <Tabs
            tabs={[
              {
                id: "things",
                label: `Things (${things.length})`,
                content: (
                  <Table
                    header={
                      <Header
                        variant="h2"
                        actions={<Button onClick={() => setCreateModal(true)}>Create thing</Button>}
                      >
                        Things
                      </Header>
                    }
                    items={things}
                    loading={loading}
                    columnDefinitions={[
                      { header: "Name", cell: (i) => i.thingName },
                      { header: "ARN", cell: (i) => i.thingArn || "—" },
                      {
                        header: "Actions",
                        cell: (i) => (
                          <Button onClick={() => deleteThing(i.thingName)} formAction="none">
                            Delete
                          </Button>
                        ),
                      },
                    ]}
                    empty={<Box textAlign="center">No things found.</Box>}
                  />
                ),
              },
              {
                id: "certificates",
                label: `Certificates (${certificates.length})`,
                content: (
                  <Table
                    header={<Header variant="h2">Certificates</Header>}
                    items={certificates}
                    loading={loading}
                    columnDefinitions={[
                      { header: "Certificate ID", cell: (i) => i.certificateId || "—" },
                      { header: "ARN", cell: (i) => i.certificateArn || "—" },
                      { header: "Status", cell: (i) => i.status || "—" },
                    ]}
                    empty={<Box textAlign="center">No certificates found.</Box>}
                  />
                ),
              },
              {
                id: "policies",
                label: `Policies (${policies.length})`,
                content: (
                  <Table
                    header={
                      <Header
                        variant="h2"
                        actions={
                          <Button onClick={() => setPolicyModal(true)}>Create policy</Button>
                        }
                      >
                        Policies
                      </Header>
                    }
                    items={policies}
                    loading={loading}
                    columnDefinitions={[
                      { header: "Name", cell: (i) => i.policyName || "—" },
                      { header: "ARN", cell: (i) => i.policyArn || "—" },
                      {
                        header: "Actions",
                        cell: (i) => (
                          <Button
                            onClick={() => deletePolicy(i.policyName || "")}
                            formAction="none"
                          >
                            Delete
                          </Button>
                        ),
                      },
                    ]}
                    empty={<Box textAlign="center">No policies found.</Box>}
                  />
                ),
              },
              {
                id: "rules",
                label: `Rules (${rules.length})`,
                content: (
                  <Table
                    header={<Header variant="h2">Topic Rules</Header>}
                    items={rules}
                    loading={loading}
                    columnDefinitions={[
                      { header: "Name", cell: (i) => i.ruleName },
                      { header: "ARN", cell: (i) => i.ruleArn || "—" },
                    ]}
                    empty={<Box textAlign="center">No rules found.</Box>}
                  />
                ),
              },
            ]}
          />
        </Container>
        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create thing"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createThing}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Thing name">
            <Input value={thingName} onChange={(e) => setThingName(e.detail.value)} />
          </FormField>
        </Modal>
        <Modal
          visible={policyModal}
          onDismiss={() => setPolicyModal(false)}
          header="Create policy"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setPolicyModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createPolicy}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Policy name">
              <Input value={policyName} onChange={(e) => setPolicyName(e.detail.value)} />
            </FormField>
            <FormField label="Policy document">
              <Input
                value={policyDoc}
                onChange={(e) => setPolicyDoc(e.detail.value)}
                placeholder="{}"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
