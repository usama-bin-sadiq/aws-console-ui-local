"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Alert from "@cloudscape-design/components/alert";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Button from "@cloudscape-design/components/button";
import { apiFetch } from "@/lib/api-client";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface TopicForm {
  name: string;
  displayName: string;
}

export default function CreateSNSTopicPage() {
  const router = useRouter();
  const [form, setForm] = useState<TopicForm>({
    name: "",
    displayName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTopic = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/sns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Name: form.name,
          DisplayName: form.displayName,
        }),
      });
      if (!res.ok) throw new Error("Failed to create topic");
      router.push("/sns");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create topic");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="SNS"
          serviceIcon={SERVICE_ICONS["/sns"]?.small}
          counter={0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/sns")}
            >
              Create Topic
            </button>
          }
        />

        <Container>
          <Header variant="h2">Create Topic</Header>
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
                placeholder="my-topic"
              />
            </FormField>
            <FormField label="Display Name (optional)">
              <Input
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.detail.value })}
                placeholder="Optional display name"
              />
            </FormField>
          </SpaceBetween>
          <SpaceBetween size="xs" direction="horizontal">
            <Button variant="primary" onClick={() => router.push("/sns")}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createTopic} disabled={loading}>
              {loading ? "Creating..." : "Create Topic"}
            </Button>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
