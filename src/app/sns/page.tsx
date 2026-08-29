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

interface Topic { TopicArn?: string; }

export default function SNSPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [publishModal, setPublishModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [message, setMessage] = useState("");

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sns");
      const data = await res.json();
      setTopics(data.topics || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchTopics(); }, []);

  const createTopic = async () => {
    await fetch("/api/sns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTopic }),
    });
    setCreateModal(false);
    setNewTopic("");
    fetchTopics();
  };

  const publishMessage = async () => {
    await fetch("/api/sns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", topicArn: selectedTopic, message }),
    });
    setPublishModal(false);
    setMessage("");
  };

  const deleteTopic = async (arn: string) => {
    await fetch(`/api/sns?topicArn=${encodeURIComponent(arn)}`, { method: "DELETE" });
    fetchTopics();
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <Button variant="primary" onClick={() => setCreateModal(true)}>
              Create Topic
            </Button>
          }
        >
          SNS - Simple Notification Service
        </Header>

        <Container>
          <Table
            header={<Header variant="h2">Topics ({topics.length})</Header>}
            items={topics}
            columnDefinitions={[
              { header: "ARN", cell: (item) => item.TopicArn },
              {
                header: "Actions",
                cell: (item) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button onClick={() => { setSelectedTopic(item.TopicArn!); setPublishModal(true); }} formAction="none">
                      Publish
                    </Button>
                    <Button onClick={() => deleteTopic(item.TopicArn!)} formAction="none">
                      Delete
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No topics found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create SNS Topic"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createTopic}>Create</Button>
            </SpaceBetween>
          }
        >
          <FormField label="Topic Name">
            <Input value={newTopic} onChange={(e) => setNewTopic(e.detail.value)} />
          </FormField>
        </Modal>

        <Modal
          visible={publishModal}
          onDismiss={() => setPublishModal(false)}
          header="Publish Message"
          footer={
            <Button variant="primary" onClick={publishMessage}>Publish</Button>
          }
        >
          <FormField label="Message">
            <Input value={message} onChange={(e) => setMessage(e.detail.value)} />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
