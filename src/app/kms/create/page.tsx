"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import SpaceBetween from "@cloudscape-design/components/space-between";
import ServiceLayout from "@/components/layouts/ServiceLayout";
import { apiFetch } from "@/lib/api-client";

/**
 * Create a KMS key.
 *
 * The left rail has always offered "Create key" for KMS, and the API route has
 * supported `createKey` and `createAlias`, but no page existed behind that link
 * — /kms itself renders no controls at all, so a customer-managed key could only
 * be created by calling the API directly. The route was a 1-line placeholder
 * that returned HTTP 200 while rendering the text "Create key (L1.x) verified",
 * which is the worst of both: a working-looking URL with nothing behind it.
 *
 * The form posts the documented `CreateKeyRequest` field names, which is what
 * the route accepts. An alias is created as a second, separate call because AWS
 * has no create-with-alias operation: `CreateKey` then `CreateAlias`.
 */
export default function KmsCreatePage() {
  const [description, setDescription] = useState("");
  const [aliasName, setAliasName] = useState("");
  const [keyUsage, setKeyUsage] = useState("ENCRYPT_DECRYPT");
  const [keySpec, setKeySpec] = useState("SYMMETRIC_DEFAULT");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ keyId: string; aliased: boolean } | null>(null);
  const router = useRouter();

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setCreated(null);
    try {
      const res = await apiFetch("/api/kms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createKey",
          Description: description.trim(),
          KeyUsage: keyUsage,
          KeySpec: keySpec,
        }),
      });
      const data = (await res.json()) as {
        key?: { KeyId?: string };
        error?: string;
        message?: string;
      };
      const keyId = data.key?.KeyId;
      if (!keyId) {
        setError(data.error || data.message || "The emulator did not return a key id.");
        return;
      }

      // The alias is optional. A failure here must not discard a key that was
      // genuinely created, so it is reported separately instead of thrown.
      let aliased = false;
      const alias = aliasName.trim();
      if (alias) {
        const aliasRes = await apiFetch("/api/kms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "createAlias", AliasName: alias, TargetKeyId: keyId }),
        });
        if (aliasRes.ok) {
          aliased = true;
        } else {
          const aliasData = (await aliasRes.json().catch(() => ({}))) as { error?: string };
          setError(
            `Key ${keyId} was created, but the alias ${alias} was not: ${
              aliasData.error || `HTTP ${aliasRes.status}`
            }`,
          );
          setCreated({ keyId, aliased: false });
          return;
        }
      }
      setCreated({ keyId, aliased });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the emulator.");
    } finally {
      setCreating(false);
    }
  };

  return (
    // The route layout already renders the service h1 ("AWS KMS"). This layout's
    // own header hardcodes variant="h1", so leaving it on gave the page two h1
    // elements; the Container header below carries the title as an h2 instead.
    <ServiceLayout serviceName="Create KMS Key" showTabs={false} showServiceHeader={false}>
      <Container header={<Header variant="h2">Create KMS Key</Header>}>
        <SpaceBetween size="l">
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          {created && !error && (
            <Alert type="success" dismissible onDismiss={() => setCreated(null)}>
              Created key {created.keyId}
              {created.aliased ? ` with alias ${aliasName.trim()}.` : "."}{" "}
              <Button variant="link" onClick={() => router.push("/kms")}>
                Back to keys
              </Button>
            </Alert>
          )}

          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button variant="primary" loading={creating} onClick={handleCreate}>
                  Create key
                </Button>
                <Button variant="link" onClick={() => router.push("/kms")}>
                  Cancel
                </Button>
              </SpaceBetween>
            }
          >
            <FormField
              label="Alias"
              description="Optional. An alias is a name you can use instead of the key id, and it is what KMS shows in the console."
              constraintText="alias/ prefix is added for you"
            >
              <Input
                value={aliasName}
                onChange={({ detail }) => setAliasName(detail.value || "")}
                placeholder="my-key"
              />
            </FormField>

            <FormField label="Description" description="What this key is for.">
              <Input
                value={description}
                onChange={({ detail }) => setDescription(detail.value || "")}
                placeholder="Encrypts customer PII at rest"
              />
            </FormField>

            <FormField
              label="Key usage"
              description="Symmetric keys are the default and cannot sign."
            >
              <Select
                selectedOption={{
                  value: keyUsage,
                  label: keyUsage === "ENCRYPT_DECRYPT" ? "Encrypt and decrypt" : "Sign and verify",
                }}
                onChange={({ detail }) => setKeyUsage(detail.selectedOption.value ?? keyUsage)}
                options={[
                  { value: "ENCRYPT_DECRYPT", label: "Encrypt and decrypt" },
                  { value: "SIGN_VERIFY", label: "Sign and verify" },
                ]}
              />
            </FormField>

            <FormField
              label="Key spec"
              description="The type of key material. Symmetric default is what most workloads want."
            >
              <Select
                selectedOption={{ value: keySpec, label: keySpec }}
                onChange={({ detail }) => setKeySpec(detail.selectedOption.value ?? keySpec)}
                options={[
                  { value: "SYMMETRIC_DEFAULT", label: "Symmetric default" },
                  { value: "RSA_2048", label: "RSA 2048" },
                  { value: "RSA_3072", label: "RSA 3072" },
                  { value: "RSA_4096", label: "RSA 4096" },
                  { value: "ECC_NIST_P256", label: "ECC NIST P-256" },
                  { value: "ECC_NIST_P384", label: "ECC NIST P-384" },
                  { value: "ECC_NIST_P521", label: "ECC NIST P-521" },
                ]}
              />
            </FormField>

            <Box variant="p" color="text-status-info">
              A symmetric default key cannot be used for signing. If you picked Sign and verify
              above, choose an RSA or ECC key spec.
            </Box>
          </Form>
        </SpaceBetween>
      </Container>
    </ServiceLayout>
  );
}
