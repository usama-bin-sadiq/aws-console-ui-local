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
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Tabs from "@cloudscape-design/components/tabs";

interface EventBus {
  Name: string;
  Arn?: string;
}

interface EventRule {
  Name: string;
  State?: string;
  EventBusName?: string;
  ScheduleExpression?: string;
}

export default function EventBridgePage() {
  const [eventBuses, setEventBuses] = useState<EventBus[]>([]);
  const [rules, setRules] = useState<EventRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [busName, setBusName] = useState("");
  const [creating, setCreating] = useState(false);
  const [busNameError, setBusNameError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/eventbridge");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch EventBridge data");
      setEventBuses(data.eventBuses || []);
      setRules(data.rules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch EventBridge data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createBus = async () => {
    if (!busName.trim()) {
      setBusNameError("Event bus name is required");
      return;
    }
    setBusNameError(null);
    setCreating(true);
    try {
      const res = await apiFetch("/api/eventbridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: busName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create event bus");
      }
      setCreateModal(false);
      setBusName("");
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event bus");
    } finally {
      setCreating(false);
    }
  };

  const deleteBus = async (name: string) => {
    try {
      const res = await apiFetch(`/api/eventbridge?busName=${encodeURIComponent(name)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete event bus");
      }
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event bus");
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">Amazon EventBridge</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container className="aws-table-card">
          <Tabs
            tabs={[
              {
                label: "Event Buses",
                id: "buses",
                content: (
                  <Table
                    header={
                      <Header
                        variant="h2"
                        actions={
                          <Button variant="primary" onClick={() => setCreateModal(true)}>
                            Create event bus
                          </Button>
                        }
                      >
                        Event Buses ({eventBuses.length})
                      </Header>
                    }
                    items={eventBuses}
                    columnDefinitions={[
                      { header: "Name", cell: (item) => item.Name },
                      { header: "ARN", cell: (item) => item.Arn || "—" },
                      {
                        header: "Actions",
                        cell: (item) => (
                          <Button
                            formAction="none"
                            disabled={item.Name === "default"}
                            onClick={() => deleteBus(item.Name)}
                          >
                            Delete
                          </Button>
                        ),
                      },
                    ]}
                    loading={loading}
                    empty={<Box textAlign="center">No event buses found.</Box>}
                  />
                ),
              },
              {
                label: "Rules",
                id: "rules",
                content: (
                  <Table
                    header={<Header variant="h2">Rules ({rules.length})</Header>}
                    items={rules}
                    columnDefinitions={[
                      { header: "Name", cell: (item) => item.Name },
                      { header: "State", cell: (item) => item.State || "—" },
                      { header: "Event Bus", cell: (item) => item.EventBusName || "default" },
                      {
                        header: "Schedule expression",
                        cell: (item) => item.ScheduleExpression || "—",
                      },
                    ]}
                    loading={loading}
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
          header="Create event bus"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createBus} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField
            label={
              <>
                Event bus name <span style={{ color: "red" }}>*</span>
              </>
            }
            constraintText="Required"
            errorText={busNameError}
          >
            <Input
              value={busName}
              onChange={(e) => {
                setBusName(e.detail.value);
                setBusNameError(null);
              }}
              placeholder="my-event-bus"
            />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
