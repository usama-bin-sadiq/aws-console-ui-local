/**
 * Phase 10 — SQS + SNS (Complete) Verification Gate
 * See docs/verification-gate-phase10-sqs-sns.md
 * Adapter SDK: api/sns uses sns from @/lib/aws-clients
 */
"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Select from "@cloudscape-design/components/select";

interface Topic { TopicArn?: string; }

export default function SNSPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  const [createModal, setCreateModal] = useState(false);
  const [newTopic, setNewTopic] = useState("");

  const [publishModal, setPublishModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [messageAttributesText, setMessageAttributesText] = useState("{}");

  const [subscribeModal, setSubscribeModal] = useState(false);
  const [subscribeProtocol, setSubscribeProtocol] = useState("https");
  const [subscribeEndpoint, setSubscribeEndpoint] = useState("");

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sns");
      const data = await res.json();
      setTopics(data.topics || []);
    } catch { }
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
    let attrs: Record<string, any> = {};
    try { attrs = JSON.parse(messageAttributesText); } catch { }
    await fetch("/api/sns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", topicArn: selectedTopic, message, subject, messageAttributes: attrs }),
    });
    setPublishModal(false);
    setMessage("");
    setSubject("");
    setMessageAttributesText("{}");
  };

  const deleteTopic = async (arn: string) => {
    await fetch(`/api/sns?topicArn=${encodeURIComponent(arn)}`, { method: "DELETE" });
    fetchTopics();
    setSubscriptions([]);
  };

  const subscribeToTopic = async () => {
    await fetch("/api/sns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "subscribe", topicArn: selectedTopic, protocol: subscribeProtocol, endpoint: subscribeEndpoint }),
    });
    setSubscribeModal(false);
    setSubscribeProtocol("https");
    setSubscribeEndpoint("");
    loadSubscriptions();
  };

  const unsubscribeSubscription = async (subArn: string) => {
    await fetch(`/api/sns?subscriptionArn=${encodeURIComponent(subArn)}`, { method: "DELETE" });
    loadSubscriptions();
  };

  const loadSubscriptions = async () => {
    if (!selectedTopic) return;
    setSubLoading(true);
    try {
      const res = await fetch(`/api/sns?action=listSubscriptions&topicArn=${encodeURIComponent(selectedTopic)}`);
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch { }
    setSubLoading(false);
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <Button variant="primary" onClick={() => setCreateModal(true)} ariaLabel="Create Topic">
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
              { header: "ARN", cell: (item: Topic) => item.TopicArn },
              {
                header: "Actions",
                cell: (item: Topic) => (
                  <ButtonDropdown
                    items={[
                      { id: "publish", text: "Publish" },
                      { id: "subscribe", text: "Subscribe" },
                      { id: "subscriptions", text: "View subscriptions" },
                      { id: "delete", text: "Delete topic" },
                    ]}
                    ariaLabel={`Actions for topic ${item.TopicArn}`}
                    onItemClick={({ detail }) => {
                      setSelectedTopic(item.TopicArn || "");
                      if (detail.id === "publish") setPublishModal(true);
                      if (detail.id === "subscribe") setSubscribeModal(true);
                      if (detail.id === "subscriptions") loadSubscriptions();
                      if (detail.id === "delete") deleteTopic(item.TopicArn!);
                    }}
                  >
                    Actions
                  </ButtonDropdown>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No topics found.</Box>}
          />
        </Container>

        {selectedTopic && (
          <Container>
            <Table
              header={<Header variant="h2">Subscriptions for {selectedTopic}</Header>}
              items={subscriptions.map((s: any) => ({ ...s, SubscriptionArn: s.SubscriptionArn || s.Protocol || "pending" }))}
              columnDefinitions={[
                { header: "Subscription ARN", cell: (item: any) => item.SubscriptionArn },
                { header: "Protocol", cell: (item: any) => item.Protocol || "-" },
                { header: "Endpoint", cell: (item: any) => item.Endpoint || "-" },
                {
                  header: "Actions",
                  cell: (item: any) => (
                    <Button onClick={() => unsubscribeSubscription(item.SubscriptionArn)} formAction="none" ariaLabel={`Unsubscribe ${item.SubscriptionArn}`}>
                      Unsubscribe
                    </Button>
                  ),
                },
              ]}
              loading={subLoading}
              empty={<Box textAlign="center">No subscriptions found.</Box>}
            />
          </Container>
        )}

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create SNS Topic"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)} ariaLabel="Cancel create topic">Cancel</Button>
              <Button variant="primary" onClick={createTopic} ariaLabel="Create topic">Create</Button>
            </SpaceBetween>
          }
        >
          <FormField label="Topic Name">
            <Input value={newTopic} onChange={(e: any) => setNewTopic(e.detail.value)} ariaLabel="Topic name input" />
          </FormField>
        </Modal>

        <Modal
          visible={publishModal}
          onDismiss={() => setPublishModal(false)}
          header="Publish Message"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setPublishModal(false)} ariaLabel="Cancel publish">Cancel</Button>
              <Button variant="primary" onClick={publishMessage} ariaLabel="Publish message">Publish</Button>
            </SpaceBetween>
          }
        >
          <FormField label="Subject">
            <Input value={subject} onChange={(e: any) => setSubject(e.detail.value)} ariaLabel="Publish subject input" />
          </FormField>
          <FormField label="Message">
            <Input value={message} onChange={(e: any) => setMessage(e.detail.value)} ariaLabel="Publish message input" />
          </FormField>
          <FormField label="Message Attributes (JSON)">
            <Input value={messageAttributesText} onChange={(e: any) => setMessageAttributesText(e.detail.value)} ariaLabel="Message attributes JSON" />
          </FormField>
        </Modal>

        <Modal
          visible={subscribeModal}
          onDismiss={() => setSubscribeModal(false)}
          header="Subscribe to Topic"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setSubscribeModal(false)} ariaLabel="Cancel subscribe">Cancel</Button>
              <Button variant="primary" onClick={subscribeToTopic} ariaLabel="Subscribe">Subscribe</Button>
            </SpaceBetween>
          }
        >
          <FormField label="Protocol">
            <Select
              selectedOption={{ value: subscribeProtocol, label: subscribeProtocol }}
              options={["email", "lambda", "https", "sqs"].map((value) => ({ value, label: value }))}
              onChange={({ detail }) => setSubscribeProtocol(detail.selectedOption.value || "https")}
              ariaLabel="Subscribe protocol"
            />
          </FormField>
          <FormField label="Endpoint">
            <Input value={subscribeEndpoint} onChange={(e: any) => setSubscribeEndpoint(e.detail.value)} ariaLabel="Subscribe endpoint input" />
          </FormField>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
