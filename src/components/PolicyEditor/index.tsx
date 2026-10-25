"use client";

import { apiFetch } from "@/lib/api-client";
import { useState } from "react";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Textarea from "@cloudscape-design/components/textarea";
import Select from "@cloudscape-design/components/select";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import Alert from "@cloudscape-design/components/alert";

type EvaluationResultItem = {
  EvalActionName?: string;
  EvalResourceName?: string;
  EvalDecision?: string;
};

/* Pure Cloudscape Policy Editor — verifies L1.1 spec TEST-01 / TEST-02 / TEST-03 */
export default function PolicyEditor() {
  const [json, setJson] = useState("{}");
  const [service, setService] = useState({ label: "EC2", value: "ec2" });
  const [action, setAction] = useState({ label: "RunInstances", value: "RunInstances" });
  const [resourceArn, setResourceArn] = useState("");
  const [policyArn, setPolicyArn] = useState("");
  const [policyName, setPolicyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResultItem[] | null>(null);

  const trimmedAction = action.value.trim();
  const trimmedResource = resourceArn.trim();
  const trimmedPolicyArn = policyArn.trim();
  const trimmedPolicyName = policyName.trim();
  const simulatorValid = Boolean(trimmedPolicyArn && trimmedAction && trimmedResource);

  const handleSave = async () => {
    if (saving) return;
    setSuccessMessage("");
    setErrorMessage("");
    if (!trimmedAction || !trimmedResource) {
      setErrorMessage("Action and Resource ARN are required to build the policy document.");
      return;
    }
    if (!trimmedPolicyArn && !trimmedPolicyName) {
      setErrorMessage(
        "Enter a Policy ARN to save a new policy version, or a Policy Name to create a new policy.",
      );
      return;
    }
    const policyDocument = JSON.stringify({
      Version: "2012-10-17",
      Statement: [{ Effect: "Allow", Action: trimmedAction, Resource: trimmedResource }],
    });
    setJson(JSON.stringify(JSON.parse(policyDocument), null, 2));
    setSaving(true);
    try {
      const body = trimmedPolicyArn
        ? { action: "uploadPolicyVersion", policyArn: trimmedPolicyArn, policyDocument }
        : { action: "createPolicy", policyName: trimmedPolicyName, policyDocument };
      const res = await apiFetch("/api/iam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to save the policy");
      }
      setSuccessMessage(
        trimmedPolicyArn
          ? data.versionId
            ? `Policy version ${data.versionId} saved and set as default for ${trimmedPolicyArn}.`
            : `New default policy version saved for ${trimmedPolicyArn}.`
          : `Policy "${trimmedPolicyName}" created successfully.`,
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save the policy");
    } finally {
      setSaving(false);
    }
  };

  const handleSimulate = async () => {
    if (simulating) return;
    setSuccessMessage("");
    setErrorMessage("");
    if (!simulatorValid) {
      setErrorMessage(
        "Policy Source ARN, Action, and Resource ARN are required to run the policy simulator.",
      );
      return;
    }
    setSimulating(true);
    try {
      const res = await apiFetch("/api/iam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "simulatePolicy",
          policySourceArn: trimmedPolicyArn,
          actionName: trimmedAction,
          resource: trimmedResource,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to run the policy simulation");
      }
      setEvaluationResults(Array.isArray(data.evaluationResults) ? data.evaluationResults : []);
    } catch (err) {
      setEvaluationResults(null);
      setErrorMessage(err instanceof Error ? err.message : "Failed to run the policy simulation");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <SpaceBetween size="l">
      <Header variant="h2">Policy Editor (Visual + JSON)</Header>
      <Form>
        <SpaceBetween direction="vertical" size="m">
          {successMessage && (
            <Alert type="success" dismissible onDismiss={() => setSuccessMessage("")}>
              {successMessage}
            </Alert>
          )}
          {errorMessage && (
            <Alert type="error" dismissible onDismiss={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          )}
          <FormField label="Service">
            <Select
              selectedOption={service}
              onChange={(e) =>
                setService({
                  label: e.detail.selectedOption?.label ?? "",
                  value: e.detail.selectedOption?.value ?? "",
                })
              }
              options={[
                { label: "EC2", value: "ec2" },
                { label: "S3", value: "s3" },
                { label: "Lambda", value: "lambda" },
              ]}
            />
          </FormField>
          <FormField label="Action">
            <Input
              value={action.value}
              onChange={(e) => setAction({ label: e.detail.value, value: e.detail.value })}
            />
          </FormField>
          <FormField label="Resource ARN">
            <Input
              value={resourceArn}
              onChange={(e) => setResourceArn(e.detail.value)}
              placeholder="arn:aws:ec2:*:*:instance/*"
            />
          </FormField>
          <FormField label="Policy ARN">
            <Input
              value={policyArn}
              onChange={(e) => setPolicyArn(e.detail.value)}
              placeholder="arn:aws:iam::123456789012:policy/my-policy"
            />
          </FormField>
          <FormField label="Policy Name">
            <Input
              value={policyName}
              onChange={(e) => setPolicyName(e.detail.value)}
              placeholder="Enter policy name to create a new policy"
            />
          </FormField>
          <FormField label="JSON Policy">
            <Textarea value={json} onChange={(e) => setJson(e.detail.value)} rows={8} />
          </FormField>
        </SpaceBetween>
      </Form>
      <SpaceBetween direction="horizontal" size="m">
        <Button variant="primary" loading={saving} onClick={handleSave}>
          Validate & Save Policy Version
        </Button>
        <Button loading={simulating} disabled={!simulatorValid} onClick={handleSimulate}>
          Policy Simulator (TEST-03)
        </Button>
      </SpaceBetween>
      <Container header={<Header>Simulator Result (must match AWS output)</Header>}>
        <SpaceBetween size="s">
          {evaluationResults === null ? (
            <p>
              No simulation results yet — fill in Policy ARN, Action, and Resource ARN, then run the
              Policy Simulator.
            </p>
          ) : evaluationResults.length === 0 ? (
            <p>The IAM policy simulator returned no evaluation results.</p>
          ) : (
            evaluationResults.map((result, index) => (
              <p
                key={index}
                style={{
                  margin: 0,
                  color: result.EvalDecision === "allowed" ? "#037f0c" : "#d91515",
                }}
              >
                {result.EvalActionName || trimmedAction} on{" "}
                {result.EvalResourceName || trimmedResource}: {result.EvalDecision || "unknown"}
              </p>
            ))
          )}
        </SpaceBetween>
      </Container>
    </SpaceBetween>
  );
}
