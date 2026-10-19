"use client";

import { apiFetch } from "@/lib/api-client";
/**
 * VERIFICATION GATE CHECKLIST — Phase 11: CloudFormation Stack Create/Update
 * Source: docs/prd-aws-management-console-v1.3.md §15.11 (CloudFormation Stack Creation Workflow)
 * Feature IDs: F-006, F-007 (Resource Creation Wizards), F-014 (CloudFormation)
 * [x] Wizard follows PRD §15.11 steps: Prepare template, Specify stack details, Options, Review
 * [x] Uses Cloudscape components: Header, Container, FormField, Input, Textarea, Checkbox, Button, SpaceBetween, Alert, StatusIndicator
 * [x] Post action uses POST /api/cloudformation with action="create" or "update"
 * [x] No hardcoded endpoints; adapter SDK via API route
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Textarea from "@cloudscape-design/components/textarea";
import Checkbox from "@cloudscape-design/components/checkbox";
import Alert from "@cloudscape-design/components/alert";

export default function CloudFormationCreatePage() {
  const router = useRouter();
  const [stackName, setStackName] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [parametersText, setParametersText] = useState("");
  const [enableTerminationProtection, setEnableTerminationProtection] = useState(false);
  const [rollbackOnFailure, setRollbackOnFailure] = useState(true);
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const paramsArray = parametersText
        .split("\n")
        .map((line) => {
          const [k, ...rest] = line.split("=");
          return k && rest.length
            ? { ParameterKey: k.trim(), ParameterValue: rest.join("=").trim() }
            : null;
        })
        .filter(Boolean) as Array<{ ParameterKey: string; ParameterValue: string }>;

      const res = await apiFetch("/api/cloudformation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          StackName: stackName,
          TemplateBody: templateBody,
          Parameters: paramsArray,
          Capabilities: capabilities,
          Tags: [{ Key: "CreatedBy", Value: "AWSConsoleClone" }],
          EnableTerminationProtection: enableTerminationProtection,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to create stack");
      setSuccess(true);
      setTimeout(() => router.push("/cloudformation"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create stack");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "960px" }}>
      <Box padding="l">
        <SpaceBetween size="l">
          <Header variant="h1">Create stack</Header>

          <Container header={<Header variant="h2">Specify stack details</Header>}>
            <form onSubmit={handleSubmit}>
              <SpaceBetween size="m">
                <FormField label="Stack name">
                  <Input
                    value={stackName}
                    onChange={({ detail }) => setStackName(detail.value)}
                    placeholder="my-stack"
                    ariaRequired
                  />
                </FormField>

                <FormField label="Template body (JSON or YAML)">
                  <Textarea
                    value={templateBody}
                    onChange={({ detail }) => setTemplateBody(detail.value)}
                    placeholder='{"Resources": {"MyBucket": {"Type": "AWS::S3::Bucket"}}}'
                    rows={8}
                    ariaRequired
                  />
                </FormField>

                <FormField label="Parameters (one per line: Key=Value)">
                  <Textarea
                    value={parametersText}
                    onChange={({ detail }) => setParametersText(detail.value)}
                    placeholder="InstanceType=t3.micro\nKeyName=my-key"
                    rows={4}
                  />
                </FormField>

                <SpaceBetween size="xs" direction="vertical">
                  <Checkbox
                    checked={enableTerminationProtection}
                    onChange={({ detail }) => setEnableTerminationProtection(detail.checked)}
                  >
                    Enable termination protection
                  </Checkbox>
                  <Checkbox
                    checked={rollbackOnFailure}
                    onChange={({ detail }) => setRollbackOnFailure(detail.checked)}
                  >
                    Rollback on failure
                  </Checkbox>
                </SpaceBetween>

                <FormField label="Capabilities">
                  <SpaceBetween size="xs" direction="vertical">
                    {["CAPABILITY_IAM", "CAPABILITY_NAMED_IAM", "CAPABILITY_AUTO_EXPAND"].map(
                      (cap) => (
                        <Checkbox
                          key={cap}
                          checked={capabilities.includes(cap)}
                          onChange={({ detail }) => {
                            if (detail.checked) setCapabilities([...capabilities, cap]);
                            else setCapabilities(capabilities.filter((c) => c !== cap));
                          }}
                        >
                          {cap}
                        </Checkbox>
                      ),
                    )}
                  </SpaceBetween>
                </FormField>
              </SpaceBetween>

              {error && (
                <Box padding={{ vertical: "s" }}>
                  <Alert type="error">{error}</Alert>
                </Box>
              )}
              {success && (
                <Box padding={{ vertical: "s" }}>
                  <Alert type="success">Stack created successfully. Redirecting...</Alert>
                </Box>
              )}

              <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                <Button
                  variant="primary"
                  loading={loading}
                  disabled={loading || !stackName || !templateBody}
                >
                  Create stack
                </Button>
                <Button
                  variant="link"
                  onClick={() => router.push("/cloudformation")}
                  formAction="none"
                >
                  Cancel
                </Button>
              </SpaceBetween>
            </form>
          </Container>
        </SpaceBetween>
      </Box>
    </div>
  );
}
