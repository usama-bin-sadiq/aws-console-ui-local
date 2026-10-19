"use client";

import { apiFetch } from "@/lib/api-client";
/**
 * LambdaFunctionCreateForm — Single-page Create function form matching AWS console.
 * Replaces the multi-step LambdaFunctionWizard.
 * PRD §15.3 (Workflows — Lambda function creation)
 */

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import RadioGroup from "@cloudscape-design/components/radio-group";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import ExpandableSection from "@cloudscape-design/components/expandable-section";
import AwsCodeEditor from "@/components/AwsCodeEditor";
import TagEditor from "@/components/TagEditor";
import {
  LAMBDA_RUNTIMES,
  LAMBDA_DEFAULT_RUNTIME,
  LAMBDA_DEFAULT_MEMORY,
  LAMBDA_DEFAULT_TIMEOUT,
  LAMBDA_ARCHITECTURES,
  LAMBDA_DEFAULT_ARCH,
} from "@/constants/lambda-constants";
import JSZip from "jszip";

export interface LambdaFunctionCreateFormProps {
  readonly onCancel?: () => void;
}

interface RoleOption {
  value: string;
  label: string;
  description?: string;
}

interface PolicyTemplate {
  name: string;
  label: string;
  description: string;
}

const DEFAULT_CODE = `exports.handler = async (event) => {
  console.log("Event:", JSON.stringify(event));
  return { statusCode: 200, body: JSON.stringify({ message: "Hello from Lambda!" }) };
};`;

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: "create-new-basic",
    label: "Create a new role with basic Lambda permissions",
    description: "Creates a role with AWSLambdaBasicExecutionRole policy",
  },
  {
    value: "create-new-template",
    label: "Create a new role from AWS policy templates",
    description: "Choose from predefined policy templates (e.g., Simple microservice permissions)",
  },
  { value: "existing", label: "Use an existing role", description: "Select an existing IAM role" },
];

const POLICY_TEMPLATES: PolicyTemplate[] = [
  {
    name: "Simple microservice permissions",
    label: "Simple microservice permissions",
    description: "Grants permissions for DynamoDB, S3, and other common services",
  },
  {
    name: "AWSLambdaBasicExecutionRole",
    label: "Basic Lambda permissions",
    description: "Grants permissions to write logs to CloudWatch Logs",
  },
  {
    name: "AWSLambdaVPCAccessExecutionRole",
    label: "VPC access",
    description: "Grants permissions to manage elastic network interfaces",
  },
];

export function LambdaFunctionCreateForm({ onCancel }: LambdaFunctionCreateFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Basic information
  const [functionName, setFunctionName] = useState("");
  const [functionNameError, setFunctionNameError] = useState<string | null>(null);
  const [runtime, setRuntime] = useState(LAMBDA_DEFAULT_RUNTIME);
  const [architecture, setArchitecture] = useState(LAMBDA_DEFAULT_ARCH);
  const [description, setDescription] = useState("");

  // Code source
  const [codeSource, setCodeSource] = useState<"zip" | "inline">("inline");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [zipFileName, setZipFileName] = useState("");
  const [inlineCode, setInlineCode] = useState(DEFAULT_CODE);
  const [codeError, setCodeError] = useState<string | null>(null);

  // Execution role
  const [roleOption, setRoleOption] = useState<RoleOption["value"]>("create-new-basic");
  const [existingRoleArn, setExistingRoleArn] = useState("");
  const [existingRoleError, setExistingRoleError] = useState<string | null>(null);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleNameError, setNewRoleNameError] = useState<string | null>(null);
  const [policyTemplate, setPolicyTemplate] = useState(POLICY_TEMPLATES[0].name);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Array<{ RoleName: string; Arn: string }>>(
    [],
  );

  // Environment variables
  const [environment, setEnvironment] = useState<Record<string, string>>({});

  // Tags
  const [tags, setTags] = useState<Array<{ Key: string; Value: string }>>([
    { Key: "Environment", Value: "dev" },
  ]);

  // Load existing roles when "Use an existing role" is selected
  const loadRoles = useCallback(async () => {
    if (roleOption !== "existing") return;
    setLoadingRoles(true);
    try {
      const res = await apiFetch("/api/iam");
      const data = await res.json();
      if (res.ok && data.roles) {
        setAvailableRoles(
          data.roles.map((r: { RoleName: string; Arn: string }) => ({
            RoleName: r.RoleName,
            Arn: r.Arn,
          })),
        );
      }
    } catch {
      // Ignore - roles list is optional
    } finally {
      setLoadingRoles(false);
    }
  }, [roleOption]);

  React.useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const validateForm = useCallback((): boolean => {
    let valid = true;

    if (!functionName.trim()) {
      setFunctionNameError("Function name is required");
      valid = false;
    } else if (!/^[a-zA-Z0-9-_]{1,64}$/.test(functionName.trim())) {
      setFunctionNameError(
        "Function name must be 1-64 characters: letters, numbers, hyphens, underscores",
      );
      valid = false;
    } else {
      setFunctionNameError(null);
    }

    if (codeSource === "inline" && !inlineCode.trim()) {
      setCodeError("Code is required");
      valid = false;
    } else if (codeSource === "zip" && !zipFile) {
      setCodeError("A .zip file is required");
      valid = false;
    } else {
      setCodeError(null);
    }

    if (roleOption === "existing" && !existingRoleArn.trim()) {
      setExistingRoleError("Execution role is required");
      valid = false;
    } else if (roleOption === "create-new-template" && !newRoleName.trim()) {
      setNewRoleNameError("Role name is required");
      valid = false;
    } else {
      setExistingRoleError(null);
      setNewRoleNameError(null);
    }

    return valid;
  }, [functionName, codeSource, inlineCode, zipFile, roleOption, existingRoleArn, newRoleName]);

  const createRoleAndAttachPolicy = useCallback(
    async (roleName: string, policyName: string): Promise<string> => {
      // Create role with Lambda trust policy
      const trustPolicy = JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "lambda.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      });

      const createRoleRes = await apiFetch("/api/iam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createRole",
          roleName,
          assumeRolePolicyDocument: trustPolicy,
          description: "Lambda execution role created from console",
        }),
      });

      const createRoleData = await createRoleRes.json();
      if (!createRoleRes.ok || createRoleData.error) {
        throw new Error(createRoleData.error || "Failed to create role");
      }

      // Attach the selected policy template
      const policyArn = `arn:aws:iam::aws:policy/service-role/${policyName}`;
      const attachRes = await apiFetch("/api/iam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "attachRolePolicy",
          roleName,
          policyArn,
        }),
      });

      const attachData = await attachRes.json();
      if (!attachRes.ok || attachData.error) {
        throw new Error(attachData.error || "Failed to attach policy to role");
      }

      return `arn:aws:iam::123456789012:role/${roleName}`;
    },
    [],
  );

  const zipInlineCode = useCallback(
    async (code: string): Promise<string> => {
      const zip = new JSZip();
      // Determine filename from handler - default to index.js for Node.js
      const isPython = runtime.startsWith("python");
      const isJava = runtime.startsWith("java");
      const filename = isPython
        ? "lambda_function.py"
        : isJava
          ? "LambdaFunction.java"
          : "index.js";
      zip.file(filename, code);
      const blob = await zip.generateAsync({ type: "base64" });
      return blob;
    },
    [runtime],
  );

  const handleCreate = useCallback(async () => {
    if (!validateForm()) return;

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      let roleArn: string;

      if (roleOption === "existing") {
        roleArn = existingRoleArn;
      } else if (roleOption === "create-new-basic") {
        roleArn = await createRoleAndAttachPolicy(
          newRoleName || `${functionName}-role-${Date.now()}`,
          "AWSLambdaBasicExecutionRole",
        );
      } else {
        // create-new-template
        roleArn = await createRoleAndAttachPolicy(newRoleName, policyTemplate);
      }

      let zipBase64: string;
      if (codeSource === "zip" && zipFile) {
        const buf = await zipFile.arrayBuffer();
        zipBase64 = btoa(
          new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), ""),
        );
      } else {
        zipBase64 = await zipInlineCode(inlineCode);
      }

      const payload = {
        action: "create",
        FunctionName: functionName.trim(),
        Runtime: runtime,
        Handler: runtime.startsWith("python") ? "lambda_function.lambda_handler" : "index.handler",
        MemorySize: LAMBDA_DEFAULT_MEMORY,
        Timeout: LAMBDA_DEFAULT_TIMEOUT,
        Role: roleArn,
        Description: description.trim() || undefined,
        Architecture: architecture,
        Environment: Object.keys(environment).length > 0 ? { Variables: environment } : undefined,
        Tags: tags
          .filter((t) => t.Key.trim())
          .reduce((acc: Record<string, string>, t) => {
            acc[t.Key.trim()] = t.Value || "";
            return acc;
          }, {}),
        Code: { ZipFile: zipBase64 },
      };

      const res = await apiFetch("/api/lambda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to create function");

      setSuccess("Function created successfully");
      setTimeout(() => {
        router.push("/lambda");
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create function");
    } finally {
      setCreating(false);
    }
  }, [
    functionName,
    runtime,
    architecture,
    description,
    codeSource,
    zipFile,
    inlineCode,
    roleOption,
    existingRoleArn,
    newRoleName,
    policyTemplate,
    environment,
    tags,
    router,
    validateForm,
    createRoleAndAttachPolicy,
    zipInlineCode,
  ]);

  const handleZipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".zip") && file.type !== "application/zip") {
        setCodeError("File must be a .zip archive");
        setZipFile(null);
        setZipFileName("");
        return;
      }
      setZipFile(file);
      setZipFileName(file.name);
      setCodeError(null);
    }
  };

  const handleTagChange = (newTags: Array<{ key: string; value: string }>) => {
    setTags(newTags.map((t) => ({ Key: t.key, Value: t.value })));
  };

  return (
    <SpaceBetween size="l">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert type="success" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Container header={<Header variant="h2">Basic information</Header>}>
        <SpaceBetween size="l">
          <ColumnLayout columns={2} variant="default">
            <FormField
              label="Function name"
              constraintText="Required. 1-64 characters: letters, numbers, hyphens, underscores"
              errorText={functionNameError}
            >
              <Input
                value={functionName}
                onChange={({ detail }) => {
                  setFunctionName(detail.value);
                  setFunctionNameError(null);
                }}
                placeholder="my-lambda-function"
                disabled={creating}
              />
            </FormField>

            <FormField label="Runtime" constraintText="Required">
              <Select
                selectedOption={{
                  value: runtime,
                  label: LAMBDA_RUNTIMES.find((r) => r.value === runtime)?.label || runtime,
                }}
                options={LAMBDA_RUNTIMES.map((r) => ({ value: r.value, label: r.label }))}
                onChange={({ detail }) => setRuntime(detail.selectedOption.value as string)}
                disabled={creating}
              />
            </FormField>
          </ColumnLayout>

          <FormField label="Architecture">
            <Select
              selectedOption={{
                value: architecture,
                label:
                  LAMBDA_ARCHITECTURES.find((a) => a.value === architecture)?.label || architecture,
              }}
              options={LAMBDA_ARCHITECTURES.map((a) => ({ value: a.value, label: a.label }))}
              onChange={({ detail }) => setArchitecture(detail.selectedOption.value as string)}
              disabled={creating}
            />
          </FormField>

          <FormField label="Description (optional)">
            <Input
              value={description}
              onChange={({ detail }) => setDescription(detail.value)}
              placeholder="Optional description"
              disabled={creating}
            />
          </FormField>
        </SpaceBetween>
      </Container>

      <Container header={<Header variant="h2">Code source</Header>}>
        <SpaceBetween size="l">
          <RadioGroup
            value={codeSource}
            onChange={({ detail }) => setCodeSource(detail.value as "zip" | "inline")}
            items={[
              {
                value: "zip",
                label: "Upload a .zip file",
                description: "Upload your deployment package as a .zip file (max 50 MB)",
              },
              {
                value: "inline",
                label: "Edit code inline",
                description: "Write your function code in the integrated code editor",
              },
            ]}
          />

          {codeSource === "zip" && (
            <FormField label="Upload .zip file" constraintText="Max 50 MB" errorText={codeError}>
              <SpaceBetween direction="horizontal" size="xs">
                <label htmlFor="lambda-create-zip-upload">
                  <Button
                    variant="primary"
                    formAction="none"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={creating}
                  >
                    Upload
                  </Button>
                </label>
                <input
                  ref={fileInputRef}
                  id="lambda-create-zip-upload"
                  type="file"
                  accept=".zip,application/zip"
                  style={{ display: "none" }}
                  onChange={handleZipFileChange}
                  disabled={creating}
                />
                {zipFileName && (
                  <Box variant="p" color="text-body-secondary">
                    {zipFileName}
                  </Box>
                )}
              </SpaceBetween>
            </FormField>
          )}

          {codeSource === "inline" && (
            <FormField label="Source code" errorText={codeError}>
              <AwsCodeEditor
                value={inlineCode}
                onChange={
                  creating
                    ? undefined
                    : (value) => {
                        setInlineCode(value);
                        setCodeError(null);
                      }
                }
                language={
                  runtime.startsWith("python")
                    ? "python"
                    : runtime.startsWith("java")
                      ? "java"
                      : "javascript"
                }
                height={300}
                ariaLabel="Lambda function code editor"
                readOnly={creating}
              />
            </FormField>
          )}
        </SpaceBetween>
      </Container>

      <Container header={<Header variant="h2">Execution role</Header>}>
        <SpaceBetween size="l">
          <RadioGroup
            value={roleOption}
            onChange={({ detail }) => setRoleOption(detail.value as RoleOption["value"])}
            items={ROLE_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
              description: opt.description,
            }))}
          />

          {roleOption === "existing" && (
            <FormField
              label="Existing role"
              constraintText="Required"
              errorText={existingRoleError}
            >
              {loadingRoles ? (
                <Box color="text-body-secondary">Loading roles...</Box>
              ) : availableRoles.length > 0 ? (
                <Select
                  selectedOption={
                    existingRoleArn
                      ? {
                          value: existingRoleArn,
                          label:
                            availableRoles.find((r) => r.Arn === existingRoleArn)?.RoleName ||
                            existingRoleArn,
                        }
                      : null
                  }
                  options={availableRoles.map((r) => ({
                    value: r.Arn,
                    label: `${r.RoleName} (${r.Arn})`,
                  }))}
                  onChange={({ detail }) => {
                    setExistingRoleArn(detail.selectedOption.value as string);
                    setExistingRoleError(null);
                  }}
                  placeholder="Select an existing role"
                  disabled={creating}
                />
              ) : (
                <Box color="text-body-secondary">No roles found. Create a role in IAM first.</Box>
              )}
            </FormField>
          )}

          {(roleOption === "create-new-basic" || roleOption === "create-new-template") && (
            <FormField label="Role name" constraintText="Required" errorText={newRoleNameError}>
              <Input
                value={newRoleName}
                onChange={({ detail }) => {
                  setNewRoleName(detail.value);
                  setNewRoleNameError(null);
                }}
                placeholder={
                  roleOption === "create-new-basic" ? `${functionName}-role` : "my-lambda-role"
                }
                disabled={creating}
              />
            </FormField>
          )}

          {roleOption === "create-new-template" && (
            <FormField label="Policy templates">
              <Select
                selectedOption={{ value: policyTemplate, label: policyTemplate }}
                options={POLICY_TEMPLATES.map((p) => ({ value: p.name, label: p.label }))}
                onChange={({ detail }) => setPolicyTemplate(detail.selectedOption.value as string)}
                disabled={creating}
              />
            </FormField>
          )}
        </SpaceBetween>
      </Container>

      <ExpandableSection header="Advanced settings">
        <Container header={<Header variant="h2">Environment variables</Header>}>
          <TagEditor
            tags={Object.entries(environment).map(([key, value]) => ({ key, value }))}
            onChange={(newTags) => {
              const env: Record<string, string> = {};
              newTags.forEach((t) => {
                if (t.key) env[t.key] = t.value;
              });
              setEnvironment(env);
            }}
            readOnly={creating}
          />
        </Container>

        <Container header={<Header variant="h2">Tags</Header>}>
          <TagEditor
            tags={tags.map((t) => ({ key: t.Key, value: t.Value }))}
            onChange={handleTagChange}
            readOnly={creating}
          />
        </Container>
      </ExpandableSection>

      <SpaceBetween direction="horizontal" size="xs">
        <Button formAction="none" onClick={onCancel} disabled={creating}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleCreate} disabled={creating} loading={creating}>
          Create function
        </Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}
