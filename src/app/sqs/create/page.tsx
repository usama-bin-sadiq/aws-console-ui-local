"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Button from "@cloudscape-design/components/button";
import { apiFetch } from "@/lib/api-client";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface QueueForm {
  name: string;
  visibilityTimeout: string;
  messageRetentionPeriod: string;
  maxMessageSize: string;
  delaySeconds: string;
}

export default function CreateSQSQueuePage() {
  const router = useRouter();
  const [form, setForm] = useState<QueueForm>({
    name: "",
    visibilityTimeout: "30",
    messageRetentionPeriod: "345600",
    maxMessageSize: "262144",
    delaySeconds: "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createQueue = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/sqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          QueueName: form.name,
          Attributes: {
            VisibilityTimeout: form.visibilityTimeout,
            MessageRetentionPeriod: form.messageRetentionPeriod,
            MaximumMessageSize: form.maxMessageSize,
            DelaySeconds: form.delaySeconds,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to create queue");
      router.push("/sqs");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create queue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="SQS"
          serviceIcon={SERVICE_ICONS["/sqs"]?.small}
          counter={0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/sqs")}
            >
              Create Queue
            </button>
          }
        />

        <Container>
          <Header variant="h2">Create Queue</Header>
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Name">
              <Input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.detail.value })}
                placeholder="my-queue"
              />
            </FormField>
            <FormField label="Visibility Timeout (seconds)">
              <Input
                value={form.visibilityTimeout}
                onChange={(e) => setForm({ ...form, visibilityTimeout: e.detail.value })}
                placeholder="30"
              />
            </FormField>
            <FormField label="Message Retention Period (seconds)">
              <Input
                value={form.messageRetentionPeriod}
                onChange={(e) => setForm({ ...form, messageRetentionPeriod: e.detail.value })}
                placeholder="345600"
              />
            </FormField>
            <FormField label="Maximum Message Size (bytes)">
              <Input
                value={form.maxMessageSize}
                onChange={(e) => setForm({ ...form, maxMessageSize: e.detail.value })}
                placeholder="262144"
              />
            </FormField>
            <FormField label="Delay Seconds">
              <Input
                value={form.delaySeconds}
                onChange={(e) => setForm({ ...form, delaySeconds: e.detail.value })}
                placeholder="0"
              />
            </FormField>
          </SpaceBetween>
          <SpaceBetween size="xs" direction="horizontal">
            <Button variant="primary" onClick={() => router.push("/sqs")}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createQueue} disabled={loading}>
              {loading ? "Creating..." : "Create Queue"}
            </Button>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
