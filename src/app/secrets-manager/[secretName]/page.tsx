"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Header from "@cloudscape-design/components/header";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";
import { apiFetch } from "@/lib/api-client";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";

interface Secret {
  Name: string;
  ARN: string;
  Description?: string;
  LastChangedDate?: string;
  RotationEnabled?: boolean;
}

export default function SecretDetailPage({ params }: { params: Promise<{ secretName: string }> }) {
  const router = useRouter();
  const [secret, setSecret] = useState<Secret | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secretName, setSecretName] = useState<string>("");
  const [secretValue, setSecretValue] = useState<string>("");
  const [showValue, setShowValue] = useState<boolean>(false);

  useEffect(() => {
    params.then((p) => setSecretName(p.secretName));
  }, [params]);

  const fetchSecret = useCallback(async () => {
    if (!secretName) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/secrets-manager");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const found = (data.secrets || []).find((s: any) => s.Name === secretName);
      if (!found) throw new Error(`Secret "${secretName}" not found`);
      setSecret(found);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load secret");
    } finally {
      setLoading(false);
    }
  }, [secretName]);

  const getSecretValue = useCallback(async () => {
    if (!secretName) return;
    try {
      const res = await apiFetch("/api/secrets-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getValue", secretId: secretName }),
      });
      if (!res.ok) throw new Error("Failed to get secret value");
      const data = await res.json();
      setSecretValue(data.secret?.SecretString || "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to get secret value");
    }
  }, [secretName]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchSecret();
    });
  }, [fetchSecret]);

  if (loading) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Secret {secretName || "Loading..."}</Header>
          <Box textAlign="center">
            <Box
              nativeAttributes={{
                style: { fontSize: "18px", color: "#545b64", marginBottom: "12px" },
              }}
            >
              Loading secret details...
            </Box>
          </Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !secret) {
    return (
      <div style={{ padding: 0 }}>
        <SpaceBetween size="l">
          <Header variant="h2">Secret {secretName || "Loading..."}</Header>
          <Alert type="error">{error || "Secret not found"}</Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={fetchSecret}>Refresh</Button>
            <Button onClick={() => router.push("/secrets-manager")}>Back to Secrets Manager</Button>
          </SpaceBetween>
        </SpaceBetween>
      </div>
    );
  }

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Secrets Manager"
          serviceIcon={SERVICE_ICONS["/secrets-manager"]?.small}
          counter={1}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/secrets-manager/create")}
            >
              Store Secret
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
                  Name
                </Box>
                <Box>{secret.Name}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  ARN
                </Box>
                <Box>{secret.ARN}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Description
                </Box>
                <Box>{secret.Description || "—"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Rotation Enabled
                </Box>
                <Box>{secret.RotationEnabled ? "Yes" : "No"}</Box>
              </SpaceBetween>
              <SpaceBetween direction="vertical" size="s">
                <Box variant="small" color="text-label">
                  Last Changed Date
                </Box>
                <Box>{secret.LastChangedDate || "—"}</Box>
              </SpaceBetween>
            </Box>
          </SpaceBetween>
        </Container>

        <Container header={<Header variant="h2">Secret Value</Header>}>
          <SpaceBetween size="m">
            <SpaceBetween direction="vertical" size="xs">
              <Box variant="small" color="text-label">
                Secret Value
              </Box>
              {showValue ? (
                <Box padding="s">
                  <Box variant="small">{secretValue}</Box>
                </Box>
              ) : (
                <Box variant="small">••••••••••••••••</Box>
              )}
              <Button
                variant="inline-link"
                onClick={() => {
                  setShowValue(!showValue);
                  if (showValue) setSecretValue("");
                  else getSecretValue();
                }}
                formAction="none"
              >
                {showValue ? "Hide" : "Show"}
              </Button>
            </SpaceBetween>
          </SpaceBetween>
        </Container>

        <CrossServiceLinks links={CROSS_SERVICE_LINKS["/secrets-manager"] || []} />
      </SpaceBetween>
    </div>
  );
}
