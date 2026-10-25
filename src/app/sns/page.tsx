"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import Alert from "@cloudscape-design/components/alert";
import TruncatedText from "@/components/TruncatedText";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface TopicInfo {
  arn: string;
  name: string;
  subscriptionCount: number;
}

interface SubscriptionDetail {
  SubscriptionArn?: string;
  Protocol?: string;
  Endpoint?: string;
  FilterPolicy?: string;
  RedrivePolicy?: string;
}

export default function SNSPage() {
  const [topics, setTopics] = useState<TopicInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [createModal, setCreateModal] = useState(false);
  const [newTopic, setNewTopic] = useState("");

  const [publishModal, setPublishModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedTopicName, setSelectedTopicName] = useState("");
  const [message, setMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [messageAttributesText, setMessageAttributesText] = useState("{}");

  const [subscribeModal, setSubscribeModal] = useState(false);
  const [subscribeProtocol, setSubscribeProtocol] = useState("https");
  const [subscribeEndpoint, setSubscribeEndpoint] = useState("");

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subLoading, setSubLoading] = useState(false);

  const [detailModal, setDetailModal] = useState(false);
  const [detailSub, setDetailSub] = useState<SubscriptionDetail | null>(null);

  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTopicArn, setDeleteTopicArn] = useState("");
  const [deleteTopicName, setDeleteTopicName] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const router = useRouter();

  const fetchTopics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/sns");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      const rawTopics: { TopicArn?: string }[] = data.topics || [];
      const topicInfos: TopicInfo[] = await Promise.all(
        rawTopics.map(async (t) => {
          const arn = t.TopicArn || "";
          const name = arn.split(":").pop() || arn;
          let subscriptionCount = 0;
          try {
            const attrRes = await apiFetch(
              `/api/sns?action=getAttributes&topicArn=${encodeURIComponent(arn)}`,
            );
            const attrData = await attrRes.json();
            subscriptionCount = parseInt(attrData.attributes?.SubscriptionsConfirmed || "0", 10);
          } catch {}
          return { arn, name, subscriptionCount };
        }),
      );
      setTopics(topicInfos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch topics");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const createTopic = async () => {
    setError("");
    try {
      const res = await apiFetch("/api/sns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTopic }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setCreateModal(false);
      setNewTopic("");
      fetchTopics();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create topic");
    }
  };

  const publishMessage = async () => {
    let attrs: Record<string, any> = {};
    try {
      attrs = JSON.parse(messageAttributesText);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid message attributes JSON");
      return;
    }
    setError("");
    try {
      const res = await apiFetch("/api/sns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          topicArn: selectedTopic,
          message,
          subject,
          messageAttributes: attrs,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setPublishModal(false);
      setMessage("");
      setSubject("");
      setMessageAttributesText("{}");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to publish message");
    }
  };

  const deleteTopic = async (arn: string) => {
    setError("");
    try {
      const res = await apiFetch(`/api/sns?topicArn=${encodeURIComponent(arn)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setDeleteModal(false);
      setDeleteTopicArn("");
      setDeleteTopicName("");
      setDeleteConfirmText("");
      fetchTopics();
      setSubscriptions([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete topic");
    }
  };

  const subscribeToTopic = async () => {
    setError("");
    try {
      const res = await apiFetch("/api/sns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "subscribe",
          topicArn: selectedTopic,
          protocol: subscribeProtocol,
          endpoint: subscribeEndpoint,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setSubscribeModal(false);
      setSubscribeProtocol("https");
      setSubscribeEndpoint("");
      loadSubscriptions();
      fetchTopics();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to subscribe");
    }
  };

  const unsubscribeSubscription = async (subArn: string) => {
    setError("");
    try {
      const res = await apiFetch(`/api/sns?subscriptionArn=${encodeURIComponent(subArn)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      loadSubscriptions();
      fetchTopics();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to unsubscribe");
    }
  };

  const loadSubscriptions = async () => {
    if (!selectedTopic) return;
    setSubLoading(true);
    setError("");
    try {
      const res = await apiFetch(
        `/api/sns?action=listSubscriptions&topicArn=${encodeURIComponent(selectedTopic)}`,
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setSubscriptions(data.subscriptions || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load subscriptions");
    }
    setSubLoading(false);
  };

  const openDeleteModal = (t: TopicInfo) => {
    setDeleteTopicArn(t.arn);
    setDeleteTopicName(t.name);
    setDeleteConfirmText("");
    setDeleteModal(true);
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="SNS"
          serviceIcon={SERVICE_ICONS["/sns"]?.small}
          counter={topics.length}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => setCreateModal(true)}
            >
              Create Topic
            </button>
          }
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Table
          header={<Header variant="h2">Topics ({topics.length})</Header>}
          items={topics}
          columnDefinitions={[
            {
              header: "Topic Name",
              cell: (item: TopicInfo) => (
                <Button
                  formAction="none"
                  variant="link"
                  onClick={() => {
                    setSelectedTopic(item.arn);
                    setSelectedTopicName(item.name);
                    loadSubscriptions();
                  }}
                >
                  {item.name}
                </Button>
              ),
            },
            { header: "Subscriptions", cell: (item: TopicInfo) => String(item.subscriptionCount) },
            {
              header: "Actions",
              cell: (item: TopicInfo) => (
                <ButtonDropdown
                  items={[
                    { id: "publish", text: "Publish" },
                    { id: "subscribe", text: "Subscribe" },
                    { id: "subscriptions", text: "View subscriptions" },
                    { id: "delete", text: "Delete topic" },
                  ]}
                  ariaLabel={`Actions for topic ${item.name}`}
                  onItemClick={({ detail }) => {
                    setSelectedTopic(item.arn);
                    setSelectedTopicName(item.name);
                    if (detail.id === "publish") setPublishModal(true);
                    if (detail.id === "subscribe") setSubscribeModal(true);
                    if (detail.id === "subscriptions") loadSubscriptions();
                    if (detail.id === "delete") openDeleteModal(item);
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

        {selectedTopic && (
          <Table
            header={
              <Header variant="h2">Subscriptions for {selectedTopicName || selectedTopic}</Header>
            }
            items={subscriptions.map((s: any) => ({
              ...s,
              SubscriptionArn: s.SubscriptionArn || s.Protocol || "pending",
            }))}
            columnDefinitions={[
              {
                header: "Subscription ARN",
                cell: (item: any) => <TruncatedText>{item.SubscriptionArn}</TruncatedText>,
              },
              { header: "Protocol", cell: (item: any) => item.Protocol || "-" },
              { header: "Endpoint", cell: (item: any) => item.Endpoint || "-" },
              {
                header: "Actions",
                cell: (item: any) => (
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      onClick={() => {
                        setDetailSub(item);
                        setDetailModal(true);
                      }}
                      formAction="none"
                      ariaLabel={`View details for ${item.SubscriptionArn}`}
                    >
                      Details
                    </Button>
                    <Button
                      onClick={() => unsubscribeSubscription(item.SubscriptionArn)}
                      formAction="none"
                      ariaLabel={`Unsubscribe ${item.SubscriptionArn}`}
                    >
                      Unsubscribe
                    </Button>
                  </SpaceBetween>
                ),
              },
            ]}
            loading={subLoading}
            empty={<Box textAlign="center">No subscriptions found.</Box>}
          />
        )}

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create SNS Topic"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)} ariaLabel="Cancel create topic">
                Cancel
              </Button>
              <Button variant="primary" onClick={createTopic} ariaLabel="Create topic">
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Topic Name">
            <Input
              value={newTopic}
              onChange={(e: any) => setNewTopic(e.detail.value)}
              ariaLabel="Topic name input"
            />
          </FormField>
        </Modal>

        <Modal
          visible={publishModal}
          onDismiss={() => setPublishModal(false)}
          header="Publish Message"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setPublishModal(false)} ariaLabel="Cancel publish">
                Cancel
              </Button>
              <Button variant="primary" onClick={publishMessage} ariaLabel="Publish message">
                Publish
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Subject">
            <Input
              value={subject}
              onChange={(e: any) => setSubject(e.detail.value)}
              ariaLabel="Publish subject input"
            />
          </FormField>
          <FormField label="Message">
            <Input
              value={message}
              onChange={(e: any) => setMessage(e.detail.value)}
              ariaLabel="Publish message input"
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
          visible={subscribeModal}
          onDismiss={() => setSubscribeModal(false)}
          header="Subscribe to Topic"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setSubscribeModal(false)} ariaLabel="Cancel subscribe">
                Cancel
              </Button>
              <Button variant="primary" onClick={subscribeToTopic} ariaLabel="Subscribe">
                Subscribe
              </Button>
            </SpaceBetween>
          }
        >
          <FormField label="Protocol">
            <Select
              selectedOption={{ value: subscribeProtocol, label: subscribeProtocol }}
              options={["email", "lambda", "https", "sqs"].map((value) => ({
                value,
                label: value,
              }))}
              onChange={({ detail }) =>
                setSubscribeProtocol(detail.selectedOption.value || "https")
              }
              ariaLabel="Subscribe protocol"
            />
          </FormField>
          <FormField label="Endpoint">
            <Input
              value={subscribeEndpoint}
              onChange={(e: any) => setSubscribeEndpoint(e.detail.value)}
              ariaLabel="Subscribe endpoint input"
            />
          </FormField>
        </Modal>

        <Modal
          visible={detailModal}
          onDismiss={() => {
            setDetailModal(false);
            setDetailSub(null);
          }}
          header="Subscription Details"
          footer={
            <Button
              onClick={() => {
                setDetailModal(false);
                setDetailSub(null);
              }}
              ariaLabel="Close details"
            >
              Close
            </Button>
          }
        >
          {detailSub && (
            <SpaceBetween size="m">
              <FormField label="Subscription ARN">
                <Box>{detailSub.SubscriptionArn || "-"}</Box>
              </FormField>
              <FormField label="Protocol">
                <Box>{detailSub.Protocol || "-"}</Box>
              </FormField>
              <FormField label="Endpoint">
                <Box>{detailSub.Endpoint || "-"}</Box>
              </FormField>
              <FormField label="Filter Policy">
                <Box>{detailSub.FilterPolicy || "-"}</Box>
              </FormField>
              <FormField label="Redrive Policy">
                <Box>{detailSub.RedrivePolicy || "-"}</Box>
              </FormField>
            </SpaceBetween>
          )}
        </Modal>

        <Modal
          visible={deleteModal}
          onDismiss={() => {
            setDeleteModal(false);
            setDeleteTopicArn("");
            setDeleteTopicName("");
            setDeleteConfirmText("");
          }}
          header="Delete Topic"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setDeleteModal(false);
                  setDeleteTopicArn("");
                  setDeleteTopicName("");
                  setDeleteConfirmText("");
                }}
                ariaLabel="Cancel delete"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => deleteTopic(deleteTopicArn)}
                disabled={deleteConfirmText !== deleteTopicName}
                ariaLabel="Confirm delete"
              >
                Delete
              </Button>
            </SpaceBetween>
          }
        >
          <Box variant="p">
            To confirm deletion, type the topic name <b>{deleteTopicName}</b> below.
          </Box>
          <FormField label="Topic Name">
            <Input
              value={deleteConfirmText}
              onChange={(e: any) => setDeleteConfirmText(e.detail.value)}
              ariaLabel="Delete confirmation input"
            />
          </FormField>
        </Modal>
      </SpaceBetween>

      <CrossServiceLinks links={CROSS_SERVICE_LINKS["/sns"] || []} />
    </div>
  );
}
