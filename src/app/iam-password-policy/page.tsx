"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useEffect, useState } from "react";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Input from "@cloudscape-design/components/input";
import Checkbox from "@cloudscape-design/components/checkbox";
import FormField from "@cloudscape-design/components/form-field";
import Alert from "@cloudscape-design/components/alert";
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

export default function IAMPasswordPolicyPage() {
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [minLength, setMinLength] = useState("8");
  const [requireUppercase, setRequireUppercase] = useState(false);
  const [requireLowercase, setRequireLowercase] = useState(false);
  const [requireNumbers, setRequireNumbers] = useState(false);
  const [requireSymbols, setRequireSymbols] = useState(false);

  useEffect(() => {
    apiFetch("/api/iam-password-policy")
      .then((r) => r.json())
      .then((data) => {
        if (data.passwordPolicy) {
          const p = data.passwordPolicy;
          setMinLength(String(p.MinimumPasswordLength ?? 8));
          setRequireUppercase(p.RequireUppercaseCharacters ?? false);
          setRequireLowercase(p.RequireLowercaseCharacters ?? false);
          setRequireNumbers(p.RequireNumbers ?? false);
          setRequireSymbols(p.RequireSymbols ?? false);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const savePolicy = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await apiFetch("/api/iam-password-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minLength: parseInt(minLength, 10) || 8,
          requireUppercase,
          requireLowercase,
          requireNumbers,
          requireSymbols,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="IAM Password Policy"
          serviceIcon={SERVICE_ICONS["/iam-password-policy"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/iam-password-policy/create")}>
            Create policy
        </button>

        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        {success && (
          <Alert type="success" header="Saved">
            Password policy updated successfully.
          </Alert>
        )}
        <Container header={<Header variant="h2">Account Password Policy</Header>}>
          {loading ? (
            <Box>Loading...</Box>
          ) : (
            <SpaceBetween size="m">
              <FormField label="Minimum Password Length">
                <Input
                  type="number"
                  value={minLength}
                  onChange={(e) => setMinLength(e.detail.value)}
                />
              </FormField>
              <Checkbox
                checked={requireUppercase}
                onChange={(e) => setRequireUppercase(e.detail.checked)}
              >
                Require uppercase characters
              </Checkbox>
              <Checkbox
                checked={requireLowercase}
                onChange={(e) => setRequireLowercase(e.detail.checked)}
              >
                Require lowercase characters
              </Checkbox>
              <Checkbox
                checked={requireNumbers}
                onChange={(e) => setRequireNumbers(e.detail.checked)}
              >
                Require numbers
              </Checkbox>
              <Checkbox
                checked={requireSymbols}
                onChange={(e) => setRequireSymbols(e.detail.checked)}
              >
                Require symbols
              </Checkbox>
              <Button variant="primary" onClick={savePolicy} loading={saving}>
                Save Policy
              </Button>
            </SpaceBetween>
          )}
        </Container>
      </SpaceBetween>
    </div>
  );
}
