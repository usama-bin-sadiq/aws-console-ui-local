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

interface ElastiCacheForm {
  name: string;
  engine: string;
  engineVersion: string;
  cacheNodeType: string;
  numCacheNodes: string;
  availabilityZone: string;
}

export default function CreateElastiCachePage() {
  const router = useRouter();
  const [form, setForm] = useState<ElastiCacheForm>({
    name: "",
    engine: "redis",
    engineVersion: "6.x",
    cacheNodeType: "cache.t2.micro",
    numCacheNodes: "1",
    availabilityZone: "us-east-1a",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCluster = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/elasticache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clusterName: form.name,
          engine: form.engine,
          engineVersion: form.engineVersion,
          cacheNodeType: form.cacheNodeType,
          numCacheNodes: parseInt(form.numCacheNodes),
          availabilityZone: form.availabilityZone,
        }),
      });
      if (!res.ok) throw new Error("Failed to create cluster");
      router.push("/elasticache");
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
          serviceName="ElastiCache"
          serviceIcon={SERVICE_ICONS["/elasticache"]?.small}
          counter={0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/elasticache/create")}
            >
              Create Cluster
            </button>
          }
        />

        <Container>
          <Header variant="h2">Create ElastiCache Cluster</Header>
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Cache Cluster Name">
              <Input
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.detail.value })}
                placeholder="my-cluster"
              />
            </FormField>
            <FormField label="Engine">
              <Select
                selectedOption={{ label: form.engine, value: form.engine }}
                options={[
                  { label: "Redis", value: "redis" },
                  { label: "Memcached", value: "memcached" },
                ]}
                onChange={(e) => setForm({ ...form, engine: e.detail.selectedOption.value || "" })}
              />
            </FormField>
            <FormField label="Engine Version">
              <Input
                value={form.engineVersion || ""}
                onChange={(e) => setForm({ ...form, engineVersion: e.detail.value })}
                placeholder="6.x"
              />
            </FormField>
            <FormField label="Node Type">
              <Select
                selectedOption={{ label: form.cacheNodeType, value: form.cacheNodeType }}
                options={[
                  { label: "cache.t2.micro", value: "cache.t2.micro" },
                  { label: "cache.t2.small", value: "cache.t2.small" },
                  { label: "cache.t2.medium", value: "cache.t2.medium" },
                  { label: "cache.t3.micro", value: "cache.t3.micro" },
                  { label: "cache.t3.small", value: "cache.t3.small" },
                  { label: "cache.t3.medium", value: "cache.t3.medium" },
                ]}
                onChange={(e) =>
                  setForm({ ...form, cacheNodeType: e.detail.selectedOption.value || "" })
                }
              />
            </FormField>
            <FormField label="Number of Nodes">
              <Input
                value={form.numCacheNodes || ""}
                onChange={(e) => setForm({ ...form, numCacheNodes: e.detail.value })}
                placeholder="1"
              />
            </FormField>
            <FormField label="Availability Zone">
              <Input
                value={form.availabilityZone || ""}
                onChange={(e) => setForm({ ...form, availabilityZone: e.detail.value })}
                placeholder="us-east-1a"
              />
            </FormField>
          </SpaceBetween>
          <SpaceBetween size="xs" direction="horizontal">
            <Button variant="primary" onClick={() => router.push("/elasticache")}>
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
