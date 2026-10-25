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

interface NotebookForm {
  name: string;
  instanceType: string;
  roleArn: string;
  subnetId: string;
  securityGroupIds: string;
}

export default function CreateNotebookPage() {
  const router = useRouter();
  const [form, setForm] = useState<NotebookForm>({
    name: "",
    instanceType: "ml.t2.medium",
    roleArn: "",
    subnetId: "",
    securityGroupIds: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createNotebook = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/sagemaker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          NotebookInstanceName: form.name,
          InstanceType: form.instanceType,
          RoleArn: form.roleArn,
          SubnetId: form.subnetId,
          SecurityGroupIds: form.securityGroupIds.split(",").map((s) => s.trim()),
        }),
      });
      if (!res.ok) throw new Error("Failed to create notebook");
      router.push("/sagemaker");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create notebook");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="SageMaker"
          serviceIcon={SERVICE_ICONS["/sagemaker"]?.small}
          counter={0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/sagemaker/create")}
            >
              Create Notebook
            </button>
          }
        />

        <Container>
          <Header variant="h2">Create Notebook</Header>
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
                placeholder="my-notebook"
              />
            </FormField>
            <FormField label="Instance Type">
              <Select
                selectedOption={{ label: form.instanceType, value: form.instanceType }}
                options={[
                  { label: "ml.t2.medium", value: "ml.t2.medium" },
                  { label: "ml.t2.large", value: "ml.t2.large" },
                  { label: "ml.t2.xlarge", value: "ml.t2.xlarge" },
                  { label: "ml.t3.medium", value: "ml.t3.medium" },
                  { label: "ml.t3.large", value: "ml.t3.large" },
                  { label: "ml.m5.large", value: "ml.m5.large" },
                  { label: "ml.m5.xlarge", value: "ml.m5.xlarge" },
                ]}
                onChange={(e) => setForm({ ...form, instanceType: e.detail.selectedOption.value || "" })}
              />
            </FormField>
            <FormField label="Role ARN">
              <Input
                value={form.roleArn || ""}
                onChange={(e) => setForm({ ...form, roleArn: e.detail.value })}
                placeholder="arn:aws:iam::123456789012:role/my-role"
              />
            </FormField>
            <FormField label="Subnet ID">
              <Input
                value={form.subnetId || ""}
                onChange={(e) => setForm({ ...form, subnetId: e.detail.value })}
                placeholder="subnet-12345"
              />
            </FormField>
            <FormField label="Security Group IDs (comma-separated)">
              <Input
                value={form.securityGroupIds || ""}
                onChange={(e) => setForm({ ...form, securityGroupIds: e.detail.value })}
                placeholder="sg-12345,sg-67890"
              />
            </FormField>
          </SpaceBetween>
          <SpaceBetween size="xs" direction="horizontal">
            <Button variant="primary" onClick={() => router.push("/sagemaker")}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createNotebook} disabled={loading}>
              {loading ? "Creating..." : "Create Notebook"}
            </Button>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
