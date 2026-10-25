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

interface SecretForm {
  name: string;
  secretString: string;
  description: string;
}

export default function CreateSecretPage() {
  const router = useRouter();
  const [form, setForm] = useState<SecretForm>({
    name: "",
    secretString: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSecret = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/secrets-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          secretString: form.secretString,
          description: form.description,
        }),
      });
      if (!res.ok) throw new Error("Failed to create secret");
      router.push("/secrets-manager");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create secret");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Secrets Manager"
          serviceIcon={SERVICE_ICONS["/secrets-manager"]?.small}
          counter={0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/secrets-manager/create")}
            >
              Store Secret
            </button>
          }
        />

        <Container>
          <Header variant="h2">Create Secret</Header>
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
                placeholder="my-secret-name"
              />
            </FormField>
            <FormField label="Secret Value">
              <Input
                value={form.secretString || ""}
                onChange={(e) => setForm({ ...form, secretString: e.detail.value })}
                placeholder="my-secret-value"
              />
            </FormField>
            <FormField label="Description (optional)">
              <Input
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.detail.value })}
                placeholder="Optional description"
              />
            </FormField>
          </SpaceBetween>
          <SpaceBetween size="xs" direction="horizontal">
            <Button variant="primary" onClick={() => router.push("/secrets-manager")}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createSecret} disabled={loading}>
              {loading ? "Creating..." : "Create Secret"}
            </Button>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
