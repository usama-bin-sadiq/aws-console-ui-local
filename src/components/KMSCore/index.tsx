"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useCallback, useEffect, useState } from "react";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Select, { SelectProps } from "@cloudscape-design/components/select";
import Input from "@cloudscape-design/components/input";
import Button from "@cloudscape-design/components/button";
import Header from "@cloudscape-design/components/header";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import Spinner from "@cloudscape-design/components/spinner";

type KmsKey = {
  KeyId?: string;
  Arn?: string;
  KeyUsage?: string;
  KeyState?: string;
  Description?: string;
  KeySpec?: string;
  CreationDate?: string;
  Alias?: string;
};

// Option values are real AWS KMS KeySpec strings; SYMMETRIC_DEFAULT is the AES-256 (GCM) key.
const KEY_SPEC_OPTIONS: SelectProps.Option[] = [
  { label: "AES-256", value: "SYMMETRIC_DEFAULT" },
  { label: "ECC_NIST_P256", value: "ECC_NIST_P256" },
];

const toOption = (key: KmsKey): SelectProps.Option => {
  const id = key.KeyId ?? "";
  const alias = key.Alias && key.Alias !== "—" ? key.Alias : null;
  return {
    label: alias ? `${alias} (${id})` : id,
    description: key.KeyState ? `State: ${key.KeyState}` : undefined,
    value: id,
  };
};

const postKms = async (payload: Record<string, unknown>) => {
  const res = await apiFetch("/api/kms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "KMS request failed");
  return data;
};

const formatPolicy = (policy: string) => {
  try {
    return JSON.stringify(JSON.parse(policy), null, 2);
  } catch {
    return policy;
  }
};

export default function KMSCore() {
  const [alias, setAlias] = useState("");
  const [keySpec, setKeySpec] = useState<SelectProps.Option | null>(KEY_SPEC_OPTIONS[0]);
  const [keys, setKeys] = useState<KmsKey[]>([]);
  const [selectedKey, setSelectedKey] = useState<SelectProps.Option | null>(null);
  const [keysLoading, setKeysLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [policyVisible, setPolicyVisible] = useState(false);
  const [policyText, setPolicyText] = useState<string | null>(null);
  const [policyError, setPolicyError] = useState<string | null>(null);

  const loadKeys = useCallback(async (preferKeyId?: string) => {
    setKeysLoading(true);
    try {
      const res = await apiFetch("/api/kms");
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to fetch KMS keys");
      const list: KmsKey[] = Array.isArray(data.keys) ? data.keys : [];
      setKeys(list);
      setSelectedKey((prev) => {
        const preferred = preferKeyId ? list.find((k) => k.KeyId === preferKeyId) : undefined;
        if (preferred) return toOption(preferred);
        if (prev?.value && list.some((k) => k.KeyId === prev.value)) return prev;
        return list.length > 0 ? toOption(list[0]) : null;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch KMS keys");
    } finally {
      setKeysLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKeys();
  }, [loadKeys]);

  const run = async (op: string, fn: () => Promise<void>) => {
    setBusy(op);
    setSuccess(null);
    setError(null);
    try {
      await fn();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "KMS request failed");
    } finally {
      setBusy(null);
    }
  };

  const handleCreate = () =>
    run("create", async () => {
      const data = await postKms({
        action: "createKey",
        keySpec: keySpec?.value ?? "SYMMETRIC_DEFAULT",
      });
      const newKeyId = typeof data.key?.KeyId === "string" ? data.key.KeyId : undefined;
      const trimmedAlias = alias.trim();
      let message = newKeyId ? `Key created: ${newKeyId}` : "Key created.";
      try {
        if (trimmedAlias && newKeyId) {
          const aliasName = trimmedAlias.startsWith("alias/")
            ? trimmedAlias
            : `alias/${trimmedAlias}`;
          await postKms({ action: "createAlias", aliasName, keyId: newKeyId });
          setAlias("");
          message = `Key created: ${newKeyId} with alias ${aliasName}.`;
        }
      } finally {
        await loadKeys(newKeyId);
      }
      setSuccess(message);
    });

  const handleEnableRotation = () =>
    run("rotate", async () => {
      const keyId = selectedKey?.value;
      if (!keyId) throw new Error("Select a KMS key first.");
      await postKms({ action: "enableRotation", keyId });
      setSuccess(`Automatic rotation enabled for ${keyId}.`);
    });

  const handleScheduleDeletion = () =>
    run("delete", async () => {
      const keyId = selectedKey?.value;
      if (!keyId) throw new Error("Select a KMS key first.");
      await postKms({ action: "scheduleDeletion", keyId, pendingWindowInDays: 7 });
      setSuccess(`Deletion scheduled for ${keyId} in 7 days.`);
      await loadKeys();
    });

  const handleOpenPolicy = async () => {
    const keyId = selectedKey?.value;
    if (!keyId) {
      setError("Select a KMS key first.");
      return;
    }
    setBusy("policy");
    setSuccess(null);
    setError(null);
    setPolicyError(null);
    setPolicyText(null);
    setPolicyVisible(true);
    try {
      const data = await postKms({ action: "getKeyPolicy", keyId });
      setPolicyText(
        typeof data.policy === "string"
          ? formatPolicy(data.policy)
          : "No policy document returned.",
      );
    } catch (err: unknown) {
      setPolicyError(err instanceof Error ? err.message : "Failed to fetch key policy");
    } finally {
      setBusy(null);
    }
  };

  const noKeySelected = !selectedKey?.value;

  return (
    <SpaceBetween size="l">
      <Header variant="h2">KMS Key Management</Header>
      {success && (
        <Alert type="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Form
        actions={
          <Button
            variant="primary"
            loading={busy === "create"}
            disabled={busy !== null}
            onClick={handleCreate}
          >
            Create Symmetric Key (AES-256)
          </Button>
        }
      >
        <SpaceBetween direction="vertical" size="m">
          <FormField label="Key ID / ARN">
            <Select
              selectedOption={selectedKey}
              onChange={(e) => setSelectedKey(e.detail.selectedOption)}
              options={keys.map(toOption)}
              placeholder={keysLoading ? "Loading keys…" : "No KMS keys available"}
              disabled={keysLoading || busy !== null}
            />
          </FormField>
          <FormField label="Key Spec">
            <Select
              selectedOption={keySpec}
              onChange={(e) => setKeySpec(e.detail.selectedOption)}
              options={KEY_SPEC_OPTIONS}
            />
          </FormField>
          <FormField label="Alias">
            <Input
              value={alias}
              onChange={(e) => setAlias(e.detail.value)}
              placeholder="alias/my-key"
            />
          </FormField>
          <FormField label="Rotation">
            <Button
              loading={busy === "rotate"}
              disabled={noKeySelected || busy !== null}
              onClick={handleEnableRotation}
            >
              Enable Automatic Rotation
            </Button>
          </FormField>
          <FormField label="Pending Deletion">
            <Button
              loading={busy === "delete"}
              disabled={noKeySelected || busy !== null}
              onClick={handleScheduleDeletion}
            >
              Schedule Deletion (7 days)
            </Button>
          </FormField>
          <FormField label="Policy (L1.1)">
            <Button
              loading={busy === "policy"}
              disabled={noKeySelected || busy !== null}
              onClick={handleOpenPolicy}
            >
              Open Policy Editor
            </Button>
          </FormField>
        </SpaceBetween>
      </Form>
      <Modal
        visible={policyVisible}
        onDismiss={() => setPolicyVisible(false)}
        header={`Key policy — ${selectedKey?.value ?? ""}`}
        closeAriaLabel="Close"
        footer={<Button onClick={() => setPolicyVisible(false)}>Close</Button>}
      >
        {policyError ? (
          <Alert type="error" dismissible onDismiss={() => setPolicyError(null)}>
            {policyError}
          </Alert>
        ) : policyText === null ? (
          <Spinner />
        ) : (
          <pre style={{ margin: 0, overflowX: "auto", fontSize: "12px", lineHeight: "1.5" }}>
            {policyText}
          </pre>
        )}
      </Modal>
    </SpaceBetween>
  );
}
