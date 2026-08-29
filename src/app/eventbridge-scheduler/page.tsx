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

interface Schedule { Name: string; State: string; ScheduleExpression?: string; }

export default function EventBridgeSchedulerPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [scheduleName, setScheduleName] = useState("");
  const [expression, setExpression] = useState("rate(1 hour)");

  const fetchSchedules = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/scheduler");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSchedules(data.schedules || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSchedules(); }, []);

  const createSchedule = async () => {
    await fetch("/api/scheduler", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: scheduleName, scheduleExpression: expression }),
    });
    setCreateModal(false); setScheduleName(""); setExpression("rate(1 hour)"); fetchSchedules();
  };

  const deleteSchedule = async (name: string) => {
    await fetch(`/api/scheduler?name=${encodeURIComponent(name)}`, { method: "DELETE" });
    fetchSchedules();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">EventBridge Scheduler</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <Table
            header={<Header variant="h2" actions={<Button onClick={() => setCreateModal(true)}>Create schedule</Button>}>Schedules ({schedules.length})</Header>}
            items={schedules} loading={loading}
            columnDefinitions={[
              { header: "Name", cell: (i) => i.Name },
              { header: "State", cell: (i) => i.State },
              { header: "Expression", cell: (i) => i.ScheduleExpression || "—" },
              { header: "Actions", cell: (i) => <Button onClick={() => deleteSchedule(i.Name)} formAction="none">Delete</Button> },
            ]}
            empty={<Box textAlign="center">No schedules found.</Box>}
          />
        </Container>
        <Modal visible={createModal} onDismiss={() => setCreateModal(false)} header="Create schedule"
          footer={<SpaceBetween direction="horizontal" size="xs"><Button onClick={() => setCreateModal(false)}>Cancel</Button><Button variant="primary" onClick={createSchedule}>Create</Button></SpaceBetween>}>
          <SpaceBetween size="m">
            <FormField label="Schedule name"><Input value={scheduleName} onChange={e => setScheduleName(e.detail.value)} /></FormField>
            <FormField label="Schedule expression"><Input value={expression} onChange={e => setExpression(e.detail.value)} placeholder="rate(1 hour)" /></FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
