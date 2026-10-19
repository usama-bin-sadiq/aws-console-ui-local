"use client";

import { apiFetch } from "@/lib/api-client";
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
import Alert from "@cloudscape-design/components/alert";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";

interface QueueInfo {
  url: string;
  name: string;
  approximateNumberOfMessages: number;
}

export default function SQSPage() {
  const [queues, setQueues] = useState<QueueInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createModal, setCreateModal] = useState(false);
  const [newQueue, setNewQueue] = useState("");

  const [sendModal, setSendModal] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [selectedQueueName, setSelectedQueueName] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [messageAttributesText, setMessageAttributesText] = useState("{}");

  const [batchModal, setBatchModal] = useState(false);
  const [batchEntries, setBatchEntries] = useState([{ id: "1", body: "" }]);

  const [receiveModal, setReceiveModal] = useState(false);
  const [receivedMessages, setReceivedMessages] = useState<any[]>([]);
  const [maxMessages, setMaxMessages] = useState("10");

  const [purgeModal, setPurgeModal] = useState(false);
  const [purgeQueueUrl, setPurgeQueueUrl] = useState("");
  const [purgeQueueName, setPurgeQueueName] = useState("");

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteQueueUrl, setDeleteQueueUrl] = useState("");
  const [deleteQueueName, setDeleteQueueName] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const fetchQueues = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/sqs");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      const urls: string[] = data.queues || [];
      const queueInfos: QueueInfo[] = await Promise.all(
        urls.map(async (url) => {
          const name = url.split("/").pop() || url;
          let approximateNumberOfMessages = 0;
          try {
            const attrRes = await apiFetch(
              `/api/sqs?action=getAttributes&queueUrl=${encodeURIComponent(url)}`,
            );
            const attrData = await attrRes.json();
            approximateNumberOfMessages = parseInt(
              attrData.attributes?.ApproximateNumberOfMessages || "0",
              10,
            );
          } catch {}
          return { url, name, approximateNumberOfMessages };
        }),
      );
      setQueues(queueInfos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch queues");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQueues();
  }, []);

  const createQueue = async () => {
    setError("");
    try {
      const res = await apiFetch("/api/sqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queueName: newQueue }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setCreateModal(false);
      setNewQueue("");
      fetchQueues();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create queue");
    }
  };

  const sendMessage = async () => {
    let attrs: Record<string, any> = {};
    try {
      attrs = JSON.parse(messageAttributesText);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid message attributes JSON");
      return;
    }
    setError("");
    try {
      const res = await apiFetch("/api/sqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          queueUrl: selectedQueue,
          messageBody,
          messageAttributes: attrs,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setSendModal(false);
      setMessageBody("");
      setMessageAttributesText("{}");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message");
    }
  };

  const sendBatch = async () => {
    setError("");
    try {
      const res = await apiFetch("/api/sqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sendBatch",
          queueUrl: selectedQueue,
          entries: batchEntries,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setBatchModal(false);
      setBatchEntries([{ id: "1", body: "" }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send batch");
    }
  };

  const receiveMessages = async () => {
    setError("");
    try {
      const res = await apiFetch("/api/sqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "receive",
          queueUrl: selectedQueue,
          maxMessages: parseInt(maxMessages) || 10,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setReceivedMessages(data.messages || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to receive messages");
    }
  };

  const purgeQueue = async (url: string) => {
    setError("");
    try {
      const res = await apiFetch("/api/sqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "purge", queueUrl: url }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setPurgeModal(false);
      setPurgeQueueUrl("");
      setPurgeQueueName("");
      fetchQueues();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to purge queue");
    }
  };

  const deleteQueue = async (url: string) => {
    setError("");
    try {
      const res = await apiFetch(`/api/sqs?queueUrl=${encodeURIComponent(url)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setDeleteModal(false);
      setDeleteQueueUrl("");
      setDeleteQueueName("");
      setDeleteConfirmText("");
      fetchQueues();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete queue");
    }
  };

  const deleteMessage = async (receiptHandle: string) => {
    setError("");
    try {
      const res = await apiFetch("/api/sqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deleteMessage", queueUrl: selectedQueue, receiptHandle }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setReceivedMessages((prev) => prev.filter((m) => m.ReceiptHandle !== receiptHandle));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete message");
    }
  };

  const openPurgeModal = (q: QueueInfo) => {
    setPurgeQueueUrl(q.url);
    setPurgeQueueName(q.name);
    setPurgeModal(true);
  };

  const openDeleteModal = (q: QueueInfo) => {
    setDeleteQueueUrl(q.url);
    setDeleteQueueName(q.name);
    setDeleteConfirmText("");
    setDeleteModal(true);
  };

  return (
    <div style={{ padding: 0 }}>
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

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Table
          header={<Header variant="h2">Queues ({queues.length})</Header>}
          items={queues}
          columnDefinitions={[
            {
              header: "Queue Name",
              cell: (item: QueueInfo) => (
                <Button
                  formAction="none"
                  variant="link"
                  onClick={() => {
                    setSelectedQueue(item.url);
                    setSelectedQueueName(item.name);
                    setReceiveModal(true);
                    receiveMessages();
                  }}
                >
                  {item.name}
                </Button>
              ),
            },
            {
              header: "Approximate Number of Messages",
              cell: (item: QueueInfo) => String(item.approximateNumberOfMessages),
            },
            {
              header: "Actions",
              cell: (item: QueueInfo) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    onClick={() => {
                      setSelectedQueue(item.url);
                      setSelectedQueueName(item.name);
                      setSendModal(true);
                    }}
                    formAction="none"
                    ariaLabel={`Send message to ${item.name}`}
                  >
                    Send
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedQueue(item.url);
                      setSelectedQueueName(item.name);
                      setBatchModal(true);
                    }}
                    formAction="none"
                    ariaLabel={`Batch send to ${item.name}`}
                  >
                    Batch
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedQueue(item.url);
                      setSelectedQueueName(item.name);
                      setReceiveModal(true);
                      receiveMessages();
                    }}
                    formAction="none"
                    ariaLabel={`Receive from ${item.name}`}
                  >
                    Receive
                  </Button>
                  <Button
                    onClick={() => openPurgeModal(item)}
                    formAction="none"
                    ariaLabel={`Purge ${item.name}`}
                  >
                    Purge
                  </Button>
                  <Button
                    onClick={() => openDeleteModal(item)}
                    formAction="none"
                    ariaLabel={`Delete ${item.name}`}
                  >
                    Delete
                  </Button>
                </SpaceBetween>
              ),
            },
          ]}
          loading={loading}
          empty={<Box textAlign="center">No queues found.</Box>}
        />

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create SQS Queue"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)} ariaLabel="Cancel create queue">
                Cancel
              </Button>
              <Button variant="primary" onClick={createQueue} ariaLabel="Create queue">
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Queue Name">
            <Input
              value={newQueue}
              onChange={(e: any) => setNewQueue(e.detail.value)}
              ariaLabel="Queue name input"
            />
          </FormField>
        </Modal>

        <Modal
          visible={sendModal}
          onDismiss={() => setSendModal(false)}
          header="Send Message"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setSendModal(false)} ariaLabel="Cancel send message">
                Cancel
              </Button>
              <Button variant="primary" onClick={sendMessage} ariaLabel="Send message">
                Send
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Message Body">
            <Input
              value={messageBody}
              onChange={(e: any) => setMessageBody(e.detail.value)}
              ariaLabel="Message body input"
            />
          </FormField>
          <FormField label="Message Attributes (JSON)">
            <Input
              value={messageAttributesText}
              onChange={(e: any) => setMessageAttributesText(e.detail.value)}
              ariaLabel="Message attributes JSON"
            />
          </FormField>
        </Modal>

        <Modal
          visible={batchModal}
          onDismiss={() => setBatchModal(false)}
          header="Batch Send Messages"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setBatchModal(false)} ariaLabel="Cancel batch send">
                Cancel
              </Button>
              <Button variant="primary" onClick={sendBatch} ariaLabel="Send batch">
                Send Batch
              </Button>
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
            <Button
              onClick={() =>
                setBatchEntries([
                  ...batchEntries,
                  { id: String(batchEntries.length + 1), body: "" },
                ])
              }
              ariaLabel="Add batch entry"
            >
              + Add Entry
            </Button>
          </SpaceBetween>
        </Modal>

        <Modal
          visible={receiveModal}
          onDismiss={() => {
            setReceiveModal(false);
            setReceivedMessages([]);
          }}
          header="Receive Messages"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setReceiveModal(false);
                  setReceivedMessages([]);
                }}
                ariaLabel="Close receive"
              >
                Close
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Max Number of Messages">
            <Input
              value={maxMessages}
              onChange={(e: any) => setMaxMessages(e.detail.value)}
              ariaLabel="Max messages input"
            />
          </FormField>
          <Button onClick={receiveMessages} ariaLabel="Refresh received messages">
            Refresh
          </Button>
          <Table
            header={<Header variant="h3">Received Messages</Header>}
            items={receivedMessages.map((m: any, i: number) => ({ ...m, index: i }))}
            columnDefinitions={[
              { header: "Body", cell: (item: any) => item.Body || item.MessageBody || "" },
              { header: "Receipt Handle", cell: (item: any) => item.ReceiptHandle || "" },
              {
                header: "Actions",
                cell: (item: any) => (
                  <Button
                    onClick={() => deleteMessage(item.ReceiptHandle)}
                    formAction="none"
                    ariaLabel={`Delete message ${item.index}`}
                  >
                    Delete
                  </Button>
                ),
              },
            ]}
            empty={<Box textAlign="center">No messages received.</Box>}
          />
        </Modal>

        <Modal
          visible={purgeModal}
          onDismiss={() => {
            setPurgeModal(false);
            setPurgeQueueUrl("");
            setPurgeQueueName("");
          }}
          header="Purge Queue"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setPurgeModal(false);
                  setPurgeQueueUrl("");
                  setPurgeQueueName("");
                }}
                ariaLabel="Cancel purge"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => purgeQueue(purgeQueueUrl)}
                disabled={purgeQueueName === ""}
                ariaLabel="Confirm purge"
              >
                Purge
              </Button>
            </SpaceBetween>
          }
        >
          <Box variant="p">
            Are you sure you want to purge all messages in queue <b>{purgeQueueName}</b>?
          </Box>
          <Box variant="p" color="text-status-error">
            This action cannot be undone.
          </Box>
        </Modal>

        <Modal
          visible={deleteModal}
          onDismiss={() => {
            setDeleteModal(false);
            setDeleteQueueUrl("");
            setDeleteQueueName("");
            setDeleteConfirmText("");
          }}
          header="Delete Queue"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setDeleteModal(false);
                  setDeleteQueueUrl("");
                  setDeleteQueueName("");
                  setDeleteConfirmText("");
                }}
                ariaLabel="Cancel delete"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => deleteQueue(deleteQueueUrl)}
                disabled={deleteConfirmText !== deleteQueueName}
                ariaLabel="Confirm delete"
              >
                Delete
              </Button>
            </SpaceBetween>
          }
        >
          <Box variant="p">
            To confirm deletion, type the queue name <b>{deleteQueueName}</b> below.
          </Box>
          <FormField label="Queue Name">
            <Input
              value={deleteConfirmText}
              onChange={(e: any) => setDeleteConfirmText(e.detail.value)}
              ariaLabel="Delete confirmation input"
            />
          </FormField>
        </Modal>
      </SpaceBetween>

      <CrossServiceLinks links={CROSS_SERVICE_LINKS["/sqs"] || []} />
    </div>
  );
}
