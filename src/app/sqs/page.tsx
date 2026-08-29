"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";

export default function SQSPage() {
  const [queues, setQueues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [newQueue, setNewQueue] = useState("");
  const [sendModal, setSendModal] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [messageBody, setMessageBody] = useState("");

  const fetchQueues = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sqs");
      const data = await res.json();
      setQueues(data.queues || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchQueues(); }, []);

  const createQueue = async () => {
    await fetch("/api/sqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ queueName: newQueue }),
    });
    setCreateModal(false);
    setNewQueue("");
    fetchQueues();
  };

  const sendMessage = async () => {
    await fetch("/api/sqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", queueUrl: selectedQueue, messageBody }),
    });
    setSendModal(false);
    setMessageBody("");
  };

  const deleteQueue = async (url: string) => {
    await fetch(`/api/sqs?queueUrl=${encodeURIComponent(url)}`, { method: "DELETE" });
    fetchQueues();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <Button variant="primary" onClick={() => setCreateModal(true)}>
              Create Queue
            </Button>
          }
        >
          SQS - Simple Queue Service
        </Header>

        <Container>
          <Table
            header={<Header variant="h2">Queues ({queues.length})</Header>}
            items={queues.map((q) => ({ url: q }))}
            columnDefinitions={[
              { header: "Queue URL", cell: (item) => item.url },
              {
                header: "Actions",
                cell: (item) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => { setSelectedQueue(item.url); setSendModal(true); }} formAction="none">
                      Send Message
                    </Button>
                    <Button onClick={() => deleteQueue(item.url)} formAction="none">
                      Delete
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No queues found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create SQS Queue"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createQueue}>Create</Button>
            </SpaceBetween>
          }
        >
          <FormField label="Queue Name">
            <Input value={newQueue} onChange={(e) => setNewQueue(e.detail.value)} />
          </FormField>
        </Modal>

        <Modal
          visible={sendModal}
          onDismiss={() => setSendModal(false)}
          header="Send Message"
          footer={
            <Button variant="primary" onClick={sendMessage}>Send</Button>
          }
        >
          <FormField label="Message Body">
            <Input value={messageBody} onChange={(e) => setMessageBody(e.detail.value)} />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
