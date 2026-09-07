/**
 * LambdaFunctionWizard — Multi-step Lambda creation wizard.
 * PRD §15.3 (Workflows — Lambda function creation)
 */

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Wizard from "@cloudscape-design/components/wizard";
import Header from "@cloudscape-design/components/header";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import RadioGroup from "@cloudscape-design/components/radio-group";
import Checkbox from "@cloudscape-design/components/checkbox";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import AwsCodeEditor from "@/components/AwsCodeEditor";
import {
  LAMBDA_RUNTIMES,
  LAMBDA_DEFAULT_RUNTIME,
  LAMBDA_MEMORY_OPTIONS,
  LAMBDA_DEFAULT_MEMORY,
  LAMBDA_TIMEOUT_OPTIONS,
  LAMBDA_DEFAULT_TIMEOUT,
  LAMBDA_AUTHOR_OPTIONS,
  LAMBDA_BLUEPRINTS,
  LAMBDA_ARCHITECTURES,
  LAMBDA_DEFAULT_ARCH,
} from "@/constants/lambda-constants";

export interface LambdaFunctionWizardConfig {
  authorType?: string;
  functionName?: string;
  runtime?: string;
  handler?: string;
  memorySize?: number;
  timeout?: number;
  architecture?: string;
  code?: string;
  role?: string;
  environment?: Record<string, string>;
  tags?: Array<{ Key: string; Value: string }>;
  blueprint?: string;
  description?: string;
}

export interface LambdaFunctionWizardProps {
  readonly visible?: boolean;
  readonly onCreate?: (config: LambdaFunctionWizardConfig) => void;
  readonly onCancel?: () => void;
}

export function LambdaFunctionWizard({ visible = false, onCreate, onCancel }: LambdaFunctionWizardProps): React.ReactElement {
  const router = useRouter();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [functionNameError, setFunctionNameError] = useState<string | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const [config, setConfig] = useState<LambdaFunctionWizardConfig>({
    authorType: "scratch",
    functionName: "",
    runtime: LAMBDA_DEFAULT_RUNTIME,
    handler: "index.handler",
    memorySize: LAMBDA_DEFAULT_MEMORY,
    timeout: LAMBDA_DEFAULT_TIMEOUT,
    architecture: LAMBDA_DEFAULT_ARCH,
    code: `exports.handler = async (event) => {\n  console.log("Event:", JSON.stringify(event));\n  return { statusCode: 200, body: JSON.stringify({ message: "Hello from Lambda!" }) };\n};`,
    role: "",
    environment: {},
    tags: [{ Key: "Environment", Value: "dev" }],
    blueprint: "hello-world",
    description: "",
  });

  const updateConfig = useCallback((updates: Partial<LambdaFunctionWizardConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setStepError(null);
  }, []);

  const validateStep = (index: number): boolean => {
    if (index === 0) return !!config.authorType;
    if (index === 1) {
      let valid = true;
      if (!config.functionName?.trim()) {
        setFunctionNameError("Function name is required");
        valid = false;
      } else {
        setFunctionNameError(null);
      }
      if (!config.runtime) {
        setStepError("Runtime is required.");
        valid = false;
      }
      return valid;
    }
    if (index === 2) {
      if (config.authorType === "scratch" && !config.code?.trim()) {
        setCodeError("Code is required for scratch authoring.");
        setStepError("Code is required for scratch authoring.");
        return false;
      }
      setCodeError(null);
      return true;
    }
    if (index === 3) {
      if (!config.role?.trim()) {
        setRoleError("Execution role ARN is required");
        setStepError("Execution role is required.");
        return false;
      }
      setRoleError(null);
      return true;
    }
    return true;
  };

  const handleCreate = useCallback(async () => {
    setCreating(true);
    setStepError(null);
    try {
      const payload = {
        action: "create",
        FunctionName: config.functionName,
        Runtime: config.runtime,
        Handler: config.handler,
        MemorySize: config.memorySize,
        Timeout: config.timeout,
        Role: config.role,
        Description: config.description,
        Architecture: config.architecture,
        Environment: config.environment ? { Variables: config.environment } : undefined,
        Tags: config.tags?.reduce(
          (acc: Record<string, string>, t) => {
            if (t.Key) acc[t.Key] = t.Value || "";
            return acc;
          },
          {}
        ),
        Code: {
          ZipFile: btoa(config.code || ""),
        },
      };
      const res = await fetch("/api/lambda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Failed to create function");
      onCreate?.(config);
      router.push("/lambda");
    } catch (err: unknown) {
      setStepError(err instanceof Error ? err.message : "Failed to create function");
    } finally {
      setCreating(false);
    }
  }, [config, onCreate, router]);

  const steps = [
    {
      title: "Author from scratch / Blueprint / Container",
      description: "Choose how you want to create your Lambda function",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">Select authoring option</Box>
          <RadioGroup
            value={config.authorType || "scratch"}
            onChange={({ detail }) => updateConfig({ authorType: detail.value })}
            items={LAMBDA_AUTHOR_OPTIONS.map((opt) => ({
              value: opt.value,
              label: opt.label,
              description:
                opt.value === "scratch"
                  ? "Write your own function code from scratch."
                  : opt.value === "blueprint"
                    ? "Start with a pre-built template for common patterns."
                    : "Deploy from a container image.",
            }))}
          />
          {config.authorType === "blueprint" && (
            <FormField label="Select blueprint">
              <Select
                selectedOption={
                  { value: config.blueprint || "hello-world", label: LAMBDA_BLUEPRINTS.find((b) => b.value === config.blueprint)?.label || "hello-world" }
                }
                options={LAMBDA_BLUEPRINTS.map((b) => ({ value: b.value, label: b.label }))}
                onChange={({ detail }) => updateConfig({ blueprint: detail.selectedOption.value as string })}
              />
            </FormField>
          )}
          {config.authorType === "container" && (
            <FormField label="Container image URI">
              <Input
                value={config.code || ""}
                onChange={({ detail }) => updateConfig({ code: detail.value })}
                placeholder="public.ecr.aws/awslambda/python:3.12"
              />
            </FormField>
          )}
        </SpaceBetween>
      ),
    },
    {
      title: "Function name / Runtime",
      description: "Name your function and select runtime settings",
      content: (
        <SpaceBetween size="l">
          <ColumnLayout columns={2} variant="default">
            <FormField label={<>Function name <span style={{ color: "red" }}>*</span></>} constraintText="Required" errorText={functionNameError}>
              <Input
                value={config.functionName || ""}
                onChange={({ detail }) => { updateConfig({ functionName: detail.value }); setFunctionNameError(null); }}
                placeholder="my-lambda-function"
              />
            </FormField>
            <FormField label="Runtime" constraintText="Required">
              <Select
                selectedOption={{ value: config.runtime || LAMBDA_DEFAULT_RUNTIME, label: LAMBDA_RUNTIMES.find((r) => r.value === config.runtime)?.label || LAMBDA_DEFAULT_RUNTIME }}
                options={LAMBDA_RUNTIMES.map((r) => ({ value: r.value, label: r.label }))}
                onChange={({ detail }) => updateConfig({ runtime: detail.selectedOption.value as string })}
              />
            </FormField>
          </ColumnLayout>
          <ColumnLayout columns={3} variant="default">
            <FormField label="Handler">
              <Input
                value={config.handler || "index.handler"}
                onChange={({ detail }) => updateConfig({ handler: detail.value })}
                placeholder="index.handler"
              />
            </FormField>
            <FormField label="Memory size (MB)">
              <Select
                selectedOption={{ value: String(config.memorySize || LAMBDA_DEFAULT_MEMORY), label: LAMBDA_MEMORY_OPTIONS.find((m) => m.value === config.memorySize)?.label || `${LAMBDA_DEFAULT_MEMORY} MB` }}
                options={LAMBDA_MEMORY_OPTIONS.map((m) => ({ value: String(m.value), label: m.label }))}
                onChange={({ detail }) => updateConfig({ memorySize: Number(detail.selectedOption.value) })}
              />
            </FormField>
            <FormField label="Timeout (seconds)">
              <Select
                selectedOption={{ value: String(config.timeout || LAMBDA_DEFAULT_TIMEOUT), label: LAMBDA_TIMEOUT_OPTIONS.find((t) => t.value === config.timeout)?.label || `${LAMBDA_DEFAULT_TIMEOUT} s` }}
                options={LAMBDA_TIMEOUT_OPTIONS.map((t) => ({ value: String(t.value), label: t.label }))}
                onChange={({ detail }) => updateConfig({ timeout: Number(detail.selectedOption.value) })}
              />
            </FormField>
          </ColumnLayout>
          <FormField label="Architecture">
            <Select
              selectedOption={{ value: config.architecture || LAMBDA_DEFAULT_ARCH, label: LAMBDA_ARCHITECTURES.find((a) => a.value === config.architecture)?.label || LAMBDA_DEFAULT_ARCH }}
              options={LAMBDA_ARCHITECTURES.map((a) => ({ value: a.value, label: a.label }))}
              onChange={({ detail }) => updateConfig({ architecture: detail.selectedOption.value as string })}
            />
          </FormField>
          <FormField label="Description (optional)">
            <Input
              value={config.description || ""}
              onChange={({ detail }) => updateConfig({ description: detail.value })}
              placeholder="Optional description"
            />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Code upload",
      description: "Upload or write your function code",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">Function code</Box>
          <FormField label={<>Source code (JavaScript / Python / TypeScript) <span style={{ color: "red" }}>*</span></>} errorText={codeError}>
            <AwsCodeEditor
              value={config.code || ""}
              onChange={(value) => { updateConfig({ code: value }); setCodeError(null); }}
              language="javascript"
              height={300}
              ariaLabel="Lambda function code editor"
            />
          </FormField>
          <Alert type="info">
            In a production environment, you would upload a .zip file or reference an S3 bucket. This emulator accepts inline code.
          </Alert>
        </SpaceBetween>
      ),
    },
    {
      title: "Permissions",
      description: "Configure execution role and permissions",
      content: (
        <SpaceBetween size="l">
          <FormField label={<>Execution role ARN <span style={{ color: "red" }}>*</span></>} constraintText="Required" errorText={roleError}>
            <Input
              value={config.role || ""}
              onChange={({ detail }) => { updateConfig({ role: detail.value }); setRoleError(null); }}
              placeholder="arn:aws:iam::123456789012:role/lambda-execution-role"
            />
          </FormField>
          <Checkbox
            checked={!!config.role?.includes("lambda")}
            onChange={() => {
              if (config.role && config.role.includes("lambda")) {
                updateConfig({ role: "" });
              } else {
                updateConfig({ role: "arn:aws:iam::123456789012:role/lambda-execution-role" });
              }
            }}
          >
            Use default Lambda execution role (simulated)
          </Checkbox>
        </SpaceBetween>
      ),
    },
    {
      title: "Environment variables",
      description: "Add environment variables for your function",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">Environment variables</Box>
          {Object.entries(config.environment || {}).map(([key, value], idx) => (
            <ColumnLayout key={idx} columns={3} variant="default">
              <FormField label="Key">
                <Input
                  value={key}
                  onChange={({ detail }) => {
                    const env = { ...config.environment };
                    delete env[key];
                    env[detail.value] = value;
                    updateConfig({ environment: env });
                  }}
                />
              </FormField>
              <FormField label="Value">
                <Input
                  value={value || ""}
                  onChange={({ detail }) => {
                    const env = { ...config.environment };
                    env[key] = detail.value;
                    updateConfig({ environment: env });
                  }}
                />
              </FormField>
              <FormField label="&nbsp;">
                <Button
                  variant="icon"
                  iconName="remove"
                  onClick={() => {
                    const env = { ...config.environment };
                    delete env[key];
                    updateConfig({ environment: env });
                  }}
                  formAction="none"
                  ariaLabel="Remove environment variable"
                />
              </FormField>
            </ColumnLayout>
          ))}
          <Button
            onClick={() => {
              const env = { ...config.environment, "": "" };
              updateConfig({ environment: env });
            }}
            formAction="none"
          >
            Add environment variable
          </Button>
        </SpaceBetween>
      ),
    },
    {
      title: "Tags",
      description: "Add tags to organize your function",
      content: (
        <SpaceBetween size="l">
          <Box variant="h3">Tags</Box>
          {(config.tags || []).map((tag, idx) => (
            <ColumnLayout key={idx} columns={3} variant="default">
              <FormField label="Key">
                <Input
                  value={tag.Key || ""}
                  onChange={({ detail }) => {
                    const tags = [...(config.tags || [])];
                    tags[idx] = { ...tags[idx], Key: detail.value };
                    updateConfig({ tags });
                  }}
                />
              </FormField>
              <FormField label="Value">
                <Input
                  value={tag.Value || ""}
                  onChange={({ detail }) => {
                    const tags = [...(config.tags || [])];
                    tags[idx] = { ...tags[idx], Value: detail.value };
                    updateConfig({ tags });
                  }}
                />
              </FormField>
              <FormField label="&nbsp;">
                <Button
                  variant="icon"
                  iconName="remove"
                  onClick={() => {
                    const tags = (config.tags || []).filter((_, i) => i !== idx);
                    updateConfig({ tags });
                  }}
                  formAction="none"
                  ariaLabel="Remove tag"
                />
              </FormField>
            </ColumnLayout>
          ))}
          <Button
            onClick={() => {
              const tags = [...(config.tags || []), { Key: "", Value: "" }];
              updateConfig({ tags });
            }}
            formAction="none"
          >
            Add tag
          </Button>
        </SpaceBetween>
      ),
    },
    {
      title: "Review",
      description: "Review your function configuration before creating",
      content: (
        <SpaceBetween size="l">
          <Container header={<Header variant="h3">Review</Header>}>
            <ColumnLayout columns={3} variant="default">
              <div>
                <Box variant="small" color="text-label">Function name</Box>
                <Box>{config.functionName}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Runtime</Box>
                <Box>{config.runtime}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Handler</Box>
                <Box>{config.handler}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Memory</Box>
                <Box>{config.memorySize} MB</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Timeout</Box>
                <Box>{config.timeout} s</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Architecture</Box>
                <Box>{config.architecture}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Author type</Box>
                <Box>{config.authorType}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Role</Box>
                <Box>{config.role || "—"}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">Tags</Box>
                <Box>{(config.tags || []).filter((t) => t.Key).length}</Box>
              </div>
            </ColumnLayout>
          </Container>
          <Container header={<Header variant="h3">Environment variables</Header>}>
            {Object.entries(config.environment || {}).filter(([k]) => k).map(([k, v]) => (
              <Box key={k}>{k}: {v}</Box>
            ))}
            {Object.keys(config.environment || {}).filter((k) => k).length === 0 && <Box>None</Box>}
          </Container>
          <Container header={<Header variant="h3">Code preview</Header>}>
            <AwsCodeEditor
              value={config.code || ""}
              language="javascript"
              height={200}
              readOnly
              ariaLabel="Lambda function code preview"
            />
          </Container>
        </SpaceBetween>
      ),
    },
  ];

  if (!visible) return <></>;

  return (
    <SpaceBetween size="l">
      {stepError && <Alert type="error" dismissible onDismiss={() => setStepError(null)}>{stepError}</Alert>}
      {creating ? (
        <Container>
          <Box textAlign="center" padding="xxl">
            <Header variant="h3">Creating function...</Header>
            <Box variant="p" color="text-body-secondary">This may take a moment.</Box>
          </Box>
        </Container>
      ) : (
        <Wizard
          steps={steps}
          activeStepIndex={activeStepIndex}
          onNavigate={({ detail }) => {
            const requested = detail.requestedStepIndex as number;
            if (requested > activeStepIndex && !validateStep(activeStepIndex)) {
              return;
            }
            setActiveStepIndex(requested);
          }}
          onSubmit={handleCreate}
          i18nStrings={{
            submitButton: "Create function",
            cancelButton: "Cancel",
            nextButton: "Next",
            previousButton: "Previous",
            navigationAriaLabel: "Wizard navigation",
            stepNumberLabel: (stepIndex: number) => `Step ${stepIndex + 1}`,
          }}
        />
      )}
      <SpaceBetween direction="horizontal" size="xs">
        <Button formAction="none" onClick={() => onCancel?.()} disabled={creating}>
          Cancel
        </Button>
      </SpaceBetween>
    </SpaceBetween>
  );
}
