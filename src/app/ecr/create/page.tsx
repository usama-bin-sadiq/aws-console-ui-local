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

interface RepositoryForm {
  repositoryName: string;
  imageTagMutability: string;
  imageScanOnPush: boolean;
}

export default function CreateECRRepoPage() {
  const router = useRouter();
  const [form, setForm] = useState<RepositoryForm>({
    repositoryName: "",
    imageTagMutability: "MUTABLE",
    imageScanOnPush: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRepository = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/ecr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repositoryName: form.repositoryName,
          imageTagMutability: form.imageTagMutability,
          imageScanOnPush: form.imageScanOnPush,
        }),
      });
      if (!res.ok) throw new Error("Failed to create repository");
      router.push("/ecr");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create repository");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="ECR"
          serviceIcon={SERVICE_ICONS["/ecr-repo"]?.small}
          counter={0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/ecr/create")}
            >
              Create Repository
            </button>
          }
        />

        <Container>
          <Header variant="h2">Create Repository</Header>
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Repository Name">
              <Input
                value={form.repositoryName || ""}
                onChange={(e) => setForm({ ...form, repositoryName: e.detail.value })}
                placeholder="my-repo"
              />
            </FormField>
            <FormField label="Image Tag Mutability">
              <Select
                selectedOption={{ label: form.imageTagMutability, value: form.imageTagMutability }}
                options={[
                  { label: "Mutable", value: "MUTABLE" },
                  { label: "Immutable", value: "IMMUTABLE" },
                ]}
                onChange={(e) => setForm({ ...form, imageTagMutability: e.detail.selectedOption.value || "" })}
              />
            </FormField>
            <FormField label="Image Scanning on Push">
              <Select
                selectedOption={{ label: form.imageScanOnPush ? "Enabled" : "Disabled", value: String(form.imageScanOnPush) }}
                options={[
                  { label: "Enabled", value: String(true) },
                  { label: "Disabled", value: String(false) },
                ]}
                onChange={(e) => setForm({ ...form, imageScanOnPush: e.detail.selectedOption.value === "true" })}
              />
            </FormField>
          </SpaceBetween>
          <SpaceBetween size="xs" direction="horizontal">
            <Button variant="primary" onClick={() => router.push("/ecr")}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createRepository} disabled={loading}>
              {loading ? "Creating..." : "Create Repository"}
            </Button>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
