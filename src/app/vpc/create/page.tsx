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

interface VPCForm {
  cidrBlock: string;
  tenancy: string;
  description: string;
  tags: string;
}

export default function CreateVPCPage() {
  const router = useRouter();
  const [form, setForm] = useState<VPCForm>({
    cidrBlock: "10.0.0.0/16",
    tenancy: "default",
    description: "",
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createVPC = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/vpc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          CidrBlock: form.cidrBlock,
          InstanceTenancy: form.tenancy,
          tags: form.tags
            ? form.tags.split(",").map((t: string) => {
                const [key, value] = t.split("=");
                return { Key: key.trim(), Value: value.trim() };
              })
            : [],
        }),
      });
      if (!res.ok) throw new Error("Failed to create VPC");
      router.push("/vpc");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create VPC");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="VPC"
          serviceIcon={SERVICE_ICONS["/vpc"]?.small}
          counter={0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/vpc/create")}
            >
              Create VPC
            </button>
          }
        />

        <Container>
          <Header variant="h2">Create VPC</Header>
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="IPv4 CIDR block">
              <Input
                value={form.cidrBlock || ""}
                onChange={(e) => setForm({ ...form, cidrBlock: e.detail.value })}
                placeholder="10.0.0.0/16"
              />
            </FormField>
            <FormField label="Tenancy">
              <Select
                selectedOption={{ label: form.tenancy, value: form.tenancy }}
                options={[
                  { label: "Default", value: "default" },
                  { label: "Dedicated", value: "dedicated" },
                ]}
                onChange={(e) => setForm({ ...form, tenancy: e.detail.selectedOption.value || "" })}
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
            <Button variant="primary" onClick={() => router.push("/vpc")}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createVPC} disabled={loading}>
              {loading ? "Creating..." : "Create VPC"}
            </Button>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
