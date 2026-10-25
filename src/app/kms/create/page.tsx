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

interface KMSKeyForm {
  alias: string;
  keySpec: string;
  keyUsage: string;
  description: string;
}

export default function CreateKMSKeyPage() {
  const router = useRouter();
  const [form, setForm] = useState<KMSKeyForm>({
    alias: "",
    keySpec: "SYMMETRIC_DEFAULT",
    keyUsage: "ENCRYPT_DECRYPT",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createKey = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/kms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createKey",
          keyAlias: form.alias,
          keySpec: form.keySpec,
          keyUsage: form.keyUsage,
          description: form.description,
        }),
      });
      if (!res.ok) throw new Error("Failed to create key");
      router.push("/kms");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="KMS"
          serviceIcon={SERVICE_ICONS["/kms"]?.small}
          counter={0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/kms")}
            >
              Create Key
            </button>
          }
        />

        <Container>
          <Header variant="h2">Create KMS Key</Header>
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          <SpaceBetween size="m">
            <FormField label="Alias">
              <Input
                value={form.alias || ""}
                onChange={(e) => setForm({ ...form, alias: e.detail.value })}
                placeholder="my-key"
              />
            </FormField>
            <FormField label="Key Spec">
              <Select
                selectedOption={{ label: form.keySpec, value: form.keySpec }}
                options={[
                  { label: "Symmetric Default", value: "SYMMETRIC_DEFAULT" },
                  { label: "RSA 2048", value: "RSA_2048" },
                  { label: "RSA 3072", value: "RSA_3072" },
                  { label: "RSA 4096", value: "RSA_4096" },
                  { label: "ECC NIST P256", value: "ECC_NIST_P256" },
                  { label: "ECC NIST P384", value: "ECC_NIST_P384" },
                  { label: "ECC NIST P521", value: "ECC_NIST_P521" },
                  { label: "ECC SECG P256K1", value: "ECC_SECG_P256K1" },
                ]}
                onChange={(e) => setForm({ ...form, keySpec: e.detail.selectedOption.value || "" })}
              />
            </FormField>
            <FormField label="Key Usage">
              <Select
                selectedOption={{ label: form.keyUsage, value: form.keyUsage }}
                options={[
                  { label: "Encrypt/Decrypt", value: "ENCRYPT_DECRYPT" },
                  { label: "Sign/Verify", value: "SIGN_VERIFY" },
                ]}
                onChange={(e) => setForm({ ...form, keyUsage: e.detail.selectedOption.value || "" })}
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
            <Button variant="primary" onClick={() => router.push("/kms")}>
              Cancel
            </Button>
            <Button variant="primary" onClick={createKey} disabled={loading}>
              {loading ? "Creating..." : "Create Key"}
            </Button>
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
