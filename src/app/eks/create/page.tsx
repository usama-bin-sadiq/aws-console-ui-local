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

interface EKSClusterForm {
  name: string;
  version: string;
  roleArn: string;
  subnetId: string;
  securityGroupIds: string;
}

export default function CreateEKSClusterPage() {
  const router = useRouter();
  const [form, setForm] = useState<EKSClusterForm>({
    name: "",
    version: "1.28",
    roleArn: "",
    subnetId: "",
    securityGroupIds: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCluster = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/eks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clusterName: form.name,
          version: form.version,
          roleArn: form.roleArn,
          subnetIds: form.subnetId.split(",").map((s) => s.trim()),
          securityGroupIds: form.securityGroupIds.split(",").map((s) => s.trim()),
        }),
      });
      if (!res.ok) throw new Error("Failed to create cluster");
      router.push("/eks");
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
          serviceName="EKS"
          serviceIcon={SERVICE_ICONS["/eks"]?.small}
          counter={0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/eks/create")}
            >
              Create Cluster
            </button>
          }
        />

        <Container>
          <Header variant="h2">Create EKS Cluster</Header>
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Cluster Name">
              <Input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.detail.value })}
                placeholder="my-cluster"
              />
            </FormField>
            <FormField label="Version">
              <Select
                selectedOption={{ label: form.version, value: form.version }}
                options={[
                  { label: "1.28", value: "1.28" },
                  { label: "1.27", value: "1.27" },
                  { label: "1.26", value: "1.26" },
                  { label: "1.25", value: "1.25" },
                ]}
                onChange={(e) => setForm({ ...form, version: e.detail.selectedOption.value || "" })}
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
            <Button variant="primary" onClick={() => router.push("/eks")}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createCluster} disabled={loading}>
              {loading ? "Creating..." : "Create Cluster"}
            </Button>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
