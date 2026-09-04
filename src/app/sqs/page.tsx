/**
 * Phase 10 — SQS + SNS (Complete) Verification Gate
 * See docs/verification-gate-phase10-sqs-sns.md
 * Adapter SDK: api/sqs uses sqs from @/lib/aws-clients
 */
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
  const [messageAttributesText, setMessageAttributesText] = useState("{}");

  const [batchModal, setBatchModal] = useState(false);
  const [batchEntries, setBatchEntries] = useState([{ id: "1", body: "" }]);

  const [receiveModal, setReceiveModal] = useState(false);
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [maxMessages, setMaxMessages] = useState("10");

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
    let attrs: Record<string, any> = {};
    try { attrs = JSON.parse(messageAttributesText); } catch {}
    await fetch("/api/sqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", queueUrl: selectedQueue, messageBody, messageAttributes: attrs }),
    });
    setSendModal(false);
    setMessageBody("");
    setMessageAttributesText("{}");
  };

  const sendBatch = async () => {
    await fetch("/api/sqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sendBatch", queueUrl: selectedQueue, entries: batchEntries }),
    });
    setBatchModal(false);
    setBatchEntries([{ id: "1", body: "" }]);
  };

  const receiveMessages = async () => {
    const res = await fetch("/api/sqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "receive", queueUrl: selectedQueue, maxMessages: parseInt(maxMessages) || 10 }),
    });
    const data = await res.json();
    setReceivedMessages(data.messages || []);
  };

  const purgeQueue = async (url: string) => {
    await fetch("/api/sqs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "purge", queueUrl: url }),
    });
    fetchQueues();
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
            <Button variant="primary" onClick={() => setCreateModal(true)} ariaLabel="Create Queue">
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
              { header: "Queue URL", cell: (item: any) => item.url },
              {
                header: "Actions",
                cell: (item: any) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => { setSelectedQueue(item.url); setSendModal(true); }} formAction="none" ariaLabel={`Send message to ${item.url}`}>
                      Send
                    </Button>
                    <Button onClick={() => { setSelectedQueue(item.url); setBatchModal(true); }} formAction="none" ariaLabel={`Batch send to ${item.url}`}>
                      Batch
                    </Button>
                    <Button onClick={() => { setSelectedQueue(item.url); setReceiveModal(true); receiveMessages(); }} formAction="none" ariaLabel={`Receive from ${item.url}`}>
                      Receive
                    </Button>
                    <Button onClick={() => purgeQueue(item.url)} formAction="none" ariaLabel={`Purge ${item.url}`}>
                      Purge
                    </Button>
                    <Button onClick={() => deleteQueue(item.url)} formAction="none" ariaLabel={`Delete ${item.url}`}>
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
              <Button onClick={() => setCreateModal(false)} ariaLabel="Cancel create queue">Cancel</Button>
              <Button variant="primary" onClick={createQueue} ariaLabel="Create queue">Create</Button>
            </SpaceBetween>
          }
        >
          <FormField label="Queue Name">
            <Input value={newQueue} onChange={(e: any) => setNewQueue(e.detail.value)} ariaLabel="Queue name input" />
          </FormField>
        </Modal>

        <Modal
          visible={sendModal}
          onDismiss={() => setSendModal(false)}
          header="Send Message"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setSendModal(false)} ariaLabel="Cancel send message">Cancel</Button>
              <Button variant="primary" onClick={sendMessage} ariaLabel="Send message">Send</Button>
            </SpaceBetween>
          }
        >
          <FormField label="Message Body">
            <Input value={messageBody} onChange={(e: any) => setMessageBody(e.detail.value)} ariaLabel="Message body input" />
          </FormField>
          <FormField label="Message Attributes (JSON)">
            <Input value={messageAttributesText} onChange={(e: any) => setMessageAttributesText(e.detail.value)} ariaLabel="Message attributes JSON" />
          </FormField>
        </Modal>

        <Modal
          visible={batchModal}
          onDismiss={() => setBatchModal(false)}
          header="Batch Send Messages"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setBatchModal(false)} ariaLabel="Cancel batch send">Cancel</Button>
              <Button variant="primary" onClick={sendBatch} ariaLabel="Send batch">Send Batch</Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="s">
            {batchEntries.map((entry, idx) => (
              <FormField key={idx} label={`Entry ${entry.id}`}>
                <Input
                  value={entry.body}
                  onChange={(e: any) => {
                    const updated = [...batchEntries];
                    updated[idx].body = e.detail.value;
                    setBatchEntries(updated);
                  }}
                  ariaLabel={`Batch entry ${entry.id} body`}
                />
              </FormField>
            ))}
            <Button onClick={() => setBatchEntries([...batchEntries, { id: String(batchEntries.length + 1), body: "" }])} ariaLabel="Add batch entry">
              + Add Entry
            </Button>
          </SpaceBetween>
        </Modal>

        <Modal
          visible={receiveModal}
          onDismiss={() => { setReceiveModal(false); setReceivedMessages([]); }}
          header="Receive Messages"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => { setReceiveModal(false); setReceivedMessages([]); }} ariaLabel="Close receive">Close</Button>
            </SpaceBetween>
          }
        >
          <FormField label="Max Number of Messages">
            <Input value={maxMessages} onChange={(e: any) => setMaxMessages(e.detail.value)} ariaLabel="Max messages input" />
          </FormField>
          <Table
            header={<Header variant="h3">Received Messages</Header>}
            items={receivedMessages.map((m: any, i: number) => ({ ...m, index: i }))}
            columnDefinitions={[
              { header: "Body", cell: (item: any) => item.Body || item.MessageBody || "" },
              { header: "Receipt Handle", cell: (item: any) => item.ReceiptHandle || "" },
            ]}
            empty={<Box textAlign="center">No messages received.</Box>}
          />
        </Modal>
      </SpaceBetween>
    </div>
  );
}
