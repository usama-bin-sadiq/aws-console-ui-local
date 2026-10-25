"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Alert from "@cloudscape-design/components/alert";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Button from "@cloudscape-design/components/button";
import { apiFetch } from "@/lib/api-client";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface ClusterForm {
  name: string;
  capacityProviders: string[];
}

export default function CreateECSClusterPage() {
  const router = useRouter();
  const [form, setForm] = useState<ClusterForm>({
    name: "",
    capacityProviders: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCluster = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/ecs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clusterName: form.name,
          capacityProviders: form.capacityProviders,
        }),
      });
      if (!res.ok) throw new Error("Failed to create cluster");
      router.push("/ecs");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create cluster");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="ECS"
          serviceIcon={SERVICE_ICONS["/ecs"]?.small}
          counter={0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/ecs")}
            >
              Create Cluster
            </button>
          }
        />

        <Container>
          <Header variant="h2">Create Cluster</Header>
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
                placeholder="my-cluster"
              />
            </FormField>
            <FormField label="Capacity Providers">
              <Select
                selectedOption={{
                  label: form.capacityProviders.join(", ") || "Select",
                  value: form.capacityProviders.join(","),
                }}
                options={[
                  { label: "FARGATE", value: "FARGATE" },
                  { label: "FARGATE_SPOT", value: "FARGATE_SPOT" },
                  { label: "EC2", value: "EC2" },
                  { label: "EXTERNAL", value: "EXTERNAL" },
                ]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    capacityProviders: e.detail.selectedOption.value
                      ? [e.detail.selectedOption.value]
                      : [],
                  })
                }
              />
            </FormField>
          </SpaceBetween>
          <SpaceBetween size="xs" direction="horizontal">
            <Button variant="primary" onClick={() => router.push("/ecs")}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createCluster} disabled={loading || !form.name}>
              {loading ? "Creating..." : "Create Cluster"}
            </Button>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
