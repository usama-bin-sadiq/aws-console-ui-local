"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useState } from "react";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Button from "@cloudscape-design/components/button";
import Header from "@cloudscape-design/components/header";
import Alert from "@cloudscape-design/components/alert";

/* Pure Cloudscape IAM Core — User/Role creation with policy attachment (L1.1) */

const ENTITY_TYPE_OPTIONS = [
  { label: "User", value: "user" },
  { label: "Role", value: "role" },
];

const POLICY_OPTIONS = [
  { label: "AdministratorAccess", value: "Admin" },
  { label: "ReadOnlyAccess", value: "ReadOnly" },
];

const TRUSTED_ENTITY_OPTIONS = [
  { label: "AWS Service: EC2", value: "ec2" },
  { label: "AWS Service: Lambda", value: "lambda" },
];

const TRUST_POLICY_SERVICES: Record<string, string> = {
  ec2: "ec2.amazonaws.com",
  lambda: "lambda.amazonaws.com",
};

function buildTrustPolicyDocument(trustedEntity: string): string {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { Service: TRUST_POLICY_SERVICES[trustedEntity] ?? TRUST_POLICY_SERVICES.ec2 },
        Action: "sts:AssumeRole",
      },
    ],
  });
}

export default function IAMCore() {
  const [entityType, setEntityType] = useState("user");
  const [entityName, setEntityName] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState({
    label: "AdministratorAccess",
    value: "Admin",
  });
  const [assumedRole, setAssumedRole] = useState("ec2");
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async () => {
    const name = entityName.trim();
    if (!name || submitting) return;
    setSuccessMessage("");
    setErrorMessage("");
    setSubmitting(true);
    try {
      const createBody =
        entityType === "user"
          ? { action: "createUser", userName: name, path: "/" }
          : {
              action: "createRole",
              roleName: name,
              path: "/",
              assumeRolePolicyDocument: buildTrustPolicyDocument(assumedRole),
            };
      const createRes = await apiFetch("/api/iam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createBody),
      });
      const createData = await createRes.json().catch(() => ({}));
      if (!createRes.ok || createData.error) {
        throw new Error(createData.error || `Failed to create ${entityType}`);
      }

      const entityLabel = entityType === "user" ? "User" : "Role";
      const policyLabel = selectedPolicy.label.trim();
      if (!policyLabel) {
        setSuccessMessage(`${entityLabel} "${name}" created successfully.`);
        return;
      }

      const policyArn = `arn:aws:iam::aws:policy/${policyLabel}`;
      const attachBody =
        entityType === "user"
          ? { action: "attachUserPolicy", userName: name, policyArn }
          : { action: "attachRolePolicy", roleName: name, policyArn };
      const attachRes = await apiFetch("/api/iam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachBody),
      });
      const attachData = await attachRes.json().catch(() => ({}));
      if (!attachRes.ok || attachData.error) {
        throw new Error(
          attachData.error || `Failed to attach ${policyLabel} to ${entityLabel} "${name}"`,
        );
      }
      setSuccessMessage(
        `${entityLabel} "${name}" created and policy ${policyLabel} attached successfully.`,
      );
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : `Failed to create ${entityType}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SpaceBetween size="l">
      <Header variant="h2">IAM User / Role / Access Key / MFA</Header>
      <Form
        actions={
          <Button
            variant="primary"
            loading={submitting}
            disabled={!entityName.trim()}
            onClick={handleSubmit}
          >
            Create User / Role
          </Button>
        }
      >
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
          <FormField label="Entity Type">
            <Select
              selectedOption={
                ENTITY_TYPE_OPTIONS.find((option) => option.value === entityType) ?? null
              }
              options={ENTITY_TYPE_OPTIONS}
              onChange={(e) => setEntityType(e.detail.selectedOption?.value ?? "user")}
            />
          </FormField>
          <FormField label="Name">
            <Input
              value={entityName}
              onChange={(e) => setEntityName(e.detail.value)}
              placeholder="Enter user or role name"
            />
          </FormField>
          <FormField label="Attach Policy (L1.1 verified)">
            <Select
              selectedOption={selectedPolicy}
              options={POLICY_OPTIONS}
              onChange={(e) =>
                setSelectedPolicy({
                  label: e.detail.selectedOption?.label ?? "",
                  value: e.detail.selectedOption?.value ?? "",
                })
              }
            />
          </FormField>
          <FormField label="Access Key Action">
            <SpaceBetween size="xs" direction="horizontal">
              <Button>Create Access Key</Button>
              <Button>Rotate Key</Button>
              <Button>Deactivate</Button>
              <Button>Delete Key</Button>
            </SpaceBetween>
          </FormField>
          {entityType === "role" && (
            <FormField label="Trusted Entity">
              <Select
                selectedOption={
                  TRUSTED_ENTITY_OPTIONS.find((option) => option.value === assumedRole) ?? null
                }
                options={TRUSTED_ENTITY_OPTIONS}
                onChange={(e) => setAssumedRole(e.detail.selectedOption?.value ?? "ec2")}
              />
            </FormField>
          )}
          <FormField label="MFA Device">
            <Button>Assign Virtual MFA</Button>
          </FormField>
        </SpaceBetween>
      </Form>
    </SpaceBetween>
  );
}
