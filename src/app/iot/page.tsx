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
import Tabs from "@cloudscape-design/components/tabs";

interface IoTThing { thingName: string; thingArn?: string; }
interface IoTRule { ruleName: string; ruleArn?: string; }

export default function IoTPage() {
  const [things, setThings] = useState<IoTThing[]>([]);
  const [rules, setRules] = useState<IoTRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [thingName, setThingName] = useState("");

  const fetchData = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/iot");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setThings(data.things || []);
      setRules(data.rules || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const createThing = async () => {
    await fetch("/api/iot", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ thingName }),
    });
    setCreateModal(false); setThingName(""); fetchData();
  };

  const deleteThing = async (name: string) => {
    await fetch(`/api/iot?type=thing&name=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS IoT</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <Tabs tabs={[
            {
              id: "things", label: `Things (${things.length})`,
              content: (
                <Table
                  header={<Header variant="h2" actions={<Button onClick={() => setCreateModal(true)}>Create thing</Button>}>Things</Header>}
                  items={things} loading={loading}
                  columnDefinitions={[
                    { header: "Name", cell: (i) => i.thingName },
                    { header: "ARN", cell: (i) => i.thingArn || "—" },
                    { header: "Actions", cell: (i) => <Button onClick={() => deleteThing(i.thingName)} formAction="none">Delete</Button> },
                  ]}
                  empty={<Box textAlign="center">No things found.</Box>}
                />
              ),
            },
            {
              id: "rules", label: `Rules (${rules.length})`,
              content: (
                <Table
                  header={<Header variant="h2">Topic Rules</Header>}
                  items={rules} loading={loading}
                  columnDefinitions={[
                    { header: "Name", cell: (i) => i.ruleName },
                    { header: "ARN", cell: (i) => i.ruleArn || "—" },
                  ]}
                  empty={<Box textAlign="center">No rules found.</Box>}
                />
              ),
            },
          ]} />
        </Container>
        <Modal visible={createModal} onDismiss={() => setCreateModal(false)} header="Create thing"
          footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setCreateModal(false)}>Cancel</Button><Button variant="primary" onClick={createThing}>Create</Button></SpaceBetween>}>
          <FormField label="Thing name"><Input value={thingName} onChange={e => setThingName(e.detail.value)} /></FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
