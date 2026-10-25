"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Header from "@cloudscape-design/components/header";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";
import { apiFetch } from "@/lib/api-client";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";

interface KMSKey {
  KeyId: string;
  KeyAlias?: string;
  CreationDate?: string;
  KeyState: string;
  KeySpec: string;
  KeyUsage: string;
  Origin: string;
  Description?: string;
}

export default function KMSKeyDetailPage({ params }: { params: Promise<{ keyId: string }> }) {
  const router = useRouter();
  const [key, setKey] = useState<KMSKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyId, setKeyId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setKeyId(p.keyId));
  }, [params]);

  const fetchKey = useCallback(async () => {
    if (!keyId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/kms?action=getKey&KeyId=${encodeURIComponent(keyId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setKey(data.key);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load KMS key");
    } finally {
      setLoading(false);
    }
  }, [keyId]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchKey();
    });
  }, [fetchKey]);

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">KMS Key {keyId || "Loading..."}</Header>
          <Box textAlign="center">Loading key details...</Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !key) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">KMS Key {keyId || "Loading..."}</Header>
          <Alert type="error">{error || "Key not found"}</Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={fetchKey}>Refresh</Button>
            <Button onClick={() => router.push("/kms")}>Back to KMS Keys</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="KMS"
          serviceIcon={SERVICE_ICONS["/kms"]?.small}
          counter={1}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/kms/create")}
            >
              Create Key
            </button>
          }
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container header={<Header variant="h2">Details</Header>}>
          <SpaceBetween size="l">
            <Box padding="m">
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Key ID
                </Box>
                <Box>{key.KeyId}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Alias
                </Box>
                <Box>{key.KeyAlias || "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  State
                </Box>
                <StatusIndicator type={key.KeyState === "Enabled" ? "success" : "warning"}>
                  {key.KeyState}
                </StatusIndicator>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Key Spec
                </Box>
                <Box>{key.KeySpec}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Key Usage
                </Box>
                <Box>{key.KeyUsage}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Origin
                </Box>
                <Box>{key.Origin}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Description
                </Box>
                <Box>{key.Description || "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Creation Date
                </Box>
                <Box>{key.CreationDate || "—"}</Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>

        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/kms"] || []} />
      </SpaceBetween>
    </div>
  );
}
