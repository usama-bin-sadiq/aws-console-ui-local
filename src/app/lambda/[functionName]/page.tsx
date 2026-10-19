"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Tabs from "@cloudscape-design/components/tabs";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator, {
  StatusIndicatorProps,
} from "@cloudscape-design/components/status-indicator";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Alert from "@cloudscape-design/components/alert";
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";
import Spinner from "@cloudscape-design/components/spinner";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Textarea from "@cloudscape-design/components/textarea";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import type { SelectProps } from "@cloudscape-design/components/select";
import Checkbox from "@cloudscape-design/components/checkbox";
import Link from "@cloudscape-design/components/link";
import { CodeView } from "@cloudscape-design/code-view";
import TruncatedText from "@/components/TruncatedText";
import TagEditor, { Tag } from "@/components/TagEditor";
import {
  LambdaFunctionConfig,
  LambdaAliasConfig,
  LambdaVersionConfig,
  LambdaEventSourceMappingConfig,
} from "@/types/lambda";
import { apiFetch } from "@/lib/api-client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type TagPair = { Key?: string; Value?: string };

/** Lambda returns Tags as a record; the console shows key/value rows. */
const normalizeTags = (raw: unknown): TagPair[] => {
  if (Array.isArray(raw)) return raw as TagPair[];
  if (raw && typeof raw === "object") {
    return Object.entries(raw as Record<string, string>).map(([Key, Value]) => ({ Key, Value }));
  }
  return [];
};

const toEditorTags = (tags: TagPair[]): Tag[] =>
  tags
    .filter((t) => t.Key !== undefined)
    .map((t) => ({ key: t.Key as string, value: t.Value ?? "" }));

const serializeTags = (list: Tag[]): string =>
  JSON.stringify([...list].sort((a, b) => a.key.localeCompare(b.key)));

/** The Lambda API returns Environment as { Variables: {...} }; older code treated
 *  it as a flat map. Normalize either shape so the console never renders garbage. */
const normalizeEnv = (env: LambdaFunctionConfig["Environment"]): Record<string, string> => {
  if (!env || typeof env !== "object") return {};
  if ("Variables" in env) {
    const vars = (env as unknown as { Variables?: Record<string, string> }).Variables;
    return vars ?? {};
  }
  return env as Record<string, string>;
};

const RUNTIMES: SelectProps.Option[] = [
  { value: "nodejs20.x", label: "nodejs20.x" },
  { value: "nodejs18.x", label: "nodejs18.x" },
  { value: "python3.12", label: "python3.12" },
  { value: "python3.11", label: "python3.11" },
  { value: "java21", label: "java21" },
  { value: "java17", label: "java17" },
  { value: "dotnet8", label: "dotnet8" },
  { value: "ruby3.3", label: "ruby3.3" },
  { value: "go1.x", label: "go1.x" },
  { value: "provided.al2023", label: "provided.al2023 (custom)" },
];

const TRIGGER_TYPES: SelectProps.Option[] = [
  { value: "sqs", label: "Amazon SQS queue" },
  { value: "sns", label: "Amazon SNS topic" },
  { value: "dynamodb", label: "Amazon DynamoDB stream" },
  { value: "kinesis", label: "Amazon Kinesis data stream" },
  { value: "s3", label: "Amazon S3 bucket" },
  { value: "events", label: "EventBridge (CloudWatch Events)" },
  { value: "apigateway", label: "API Gateway" },
];

const triggerTypeFromArn = (arn: string): string => {
  if (arn.includes(":sqs/")) return "Amazon SQS";
  if (arn.includes(":sns/")) return "Amazon SNS";
  if (arn.includes(":dynamodb/")) return "DynamoDB";
  if (arn.includes(":kinesis/")) return "Kinesis";
  if (arn.includes(":s3::")) return "S3";
  if (arn.includes(":events/")) return "EventBridge";
  if (arn.includes("apigateway")) return "API Gateway";
  if (arn.includes(":lambda/")) return "Lambda";
  return "Event source";
};

const mappingStateType = (state?: string): StatusIndicatorProps["type"] => {
  switch (state) {
    case "Enabled":
    case "Creating":
      return state === "Creating" ? "in-progress" : "success";
    case "Enabling":
    case "Disabling":
      return "in-progress";
    case "Disabled":
      return "stopped";
    default:
      return "pending";
  }
};

const MAPPING_COLUMNS: TableProps.ColumnDefinition<LambdaEventSourceMappingConfig>[] = [
  {
    id: "type",
    header: "Trigger",
    cell: (item) => triggerTypeFromArn(item.EventSourceArn || ""),
    isRowHeader: true,
    sortingField: "EventSourceArn",
  },
  {
    id: "state",
    header: "State",
    cell: (item) => (
      <StatusIndicator type={mappingStateType(item.State)}>{item.State || "—"}</StatusIndicator>
    ),
    sortingField: "State",
  },
  {
    id: "source",
    header: "Source",
    cell: (item) => <TruncatedText>{item.EventSourceArn || "—"}</TruncatedText>,
    sortingField: "EventSourceArn",
  },
  {
    id: "batch",
    header: "Batch size",
    cell: (item) => item.BatchSize ?? "—",
    sortingField: "BatchSize",
  },
  {
    id: "uuid",
    header: "UUID",
    cell: (item) => <TruncatedText>{item.UUID || "—"}</TruncatedText>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: (item) => (
      <ButtonDropdown
        variant="icon"
        ariaLabel={`Actions for trigger ${item.UUID}`}
        items={[
          { text: item.State === "Enabled" ? "Disable" : "Enable", id: "toggle" },
          { text: "Delete", id: "delete" },
        ]}
        onItemClick={({ detail }) => {
          const event = new CustomEvent("lambda-trigger-action", {
            detail: { action: detail.id, mapping: item },
          });
          window.dispatchEvent(event);
        }}
      >
        Actions
      </ButtonDropdown>
    ),
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LambdaFunctionDetailPage({ params }: { params: { functionName: string } }) {
  const router = useRouter();
  const [functionConfig, setFunctionConfig] = useState<LambdaFunctionConfig | null>(null);
  const [aliases, setAliases] = useState<LambdaAliasConfig[]>([]);
  const [versions, setVersions] = useState<LambdaVersionConfig[]>([]);
  const [mappings, setMappings] = useState<LambdaEventSourceMappingConfig[]>([]);
  const [tags, setTags] = useState<TagPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successItem, setSuccessItem] = useState<FlashbarProps.MessageDefinition | null>(null);
  const [code, setCode] = useState("");

  // Test tab state
  const [testEvent, setTestEvent] = useState("{}");
  const [testResult, setTestResult] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  // Config edit state
  const [editModal, setEditModal] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    description: "",
    runtime: "",
    handler: "",
    memorySize: "",
    timeout: "",
    role: "",
    environment: [] as Array<{ key: string; value: string }>,
  });

  // Alias state
  const [aliasModal, setAliasModal] = useState(false);
  const [aliasSaving, setAliasSaving] = useState(false);
  const [aliasName, setAliasName] = useState("");
  const [aliasVersion, setAliasVersion] = useState("");
  const [aliasDescription, setAliasDescription] = useState("");
  const [aliasDeleteTarget, setAliasDeleteTarget] = useState<LambdaAliasConfig | null>(null);
  const [aliasDeleteLoading, setAliasDeleteLoading] = useState(false);

  // Publish version state
  const [publishModal, setPublishModal] = useState(false);
  const [publishSaving, setPublishSaving] = useState(false);
  const [publishDescription, setPublishDescription] = useState("");

  // Trigger state
  const [triggerModal, setTriggerModal] = useState(false);
  const [triggerSaving, setTriggerSaving] = useState(false);
  const [triggerType, setTriggerType] = useState<SelectProps.Option | null>(TRIGGER_TYPES[0]);
  const [triggerArn, setTriggerArn] = useState("");
  const [triggerBatchSize, setTriggerBatchSize] = useState("10");
  const [triggerEnabled, setTriggerEnabled] = useState(true);
  const [triggerDeleteTarget, setTriggerDeleteTarget] =
    useState<LambdaEventSourceMappingConfig | null>(null);
  const [triggerDeleteLoading, setTriggerDeleteLoading] = useState(false);

  // Tag save state
  const [tagDraft, setTagDraft] = useState<Tag[] | null>(null);
  const [tagSaving, setTagSaving] = useState(false);

  // Zip upload state
  const [uploading, setUploading] = useState(false);

  const functionName = decodeURIComponent(params.functionName || "");

  const showSuccess = useCallback((content: string) => {
    setSuccessItem({
      type: "success",
      content,
      dismissible: true,
      onDismiss: () => setSuccessItem(null),
    });
  }, []);

  useEffect(() => {
    if (!successItem) return;
    const timer = setTimeout(() => setSuccessItem(null), 5000);
    return () => clearTimeout(timer);
  }, [successItem]);

  const post = useCallback(async (payload: Record<string, unknown>) => {
    const res = await apiFetch("/api/lambda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return data;
  }, []);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Function configuration + tags
      const res = await apiFetch(
        `/api/lambda?action=getFunction&functionName=${encodeURIComponent(functionName)}`,
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const cfg: LambdaFunctionConfig = data.function || data;
      setFunctionConfig(cfg);
      setTags(normalizeTags(cfg.Tags));
      // Only show code the emulator actually returned — never fabricate source.
      setCode(
        typeof cfg.Code === "object" && cfg.Code !== null && "ZipFile" in cfg.Code
          ? String((cfg.Code as { ZipFile?: unknown }).ZipFile ?? "")
          : "",
      );

      // Aliases
      const aliasRes = await apiFetch(
        `/api/lambda?action=listAliases&functionName=${encodeURIComponent(functionName)}`,
      );
      const aliasData = await aliasRes.json();
      setAliases(aliasData.aliases || []);

      // Versions
      const verRes = await apiFetch(
        `/api/lambda?action=listVersions&functionName=${encodeURIComponent(functionName)}`,
      );
      const verData = await verRes.json();
      setVersions(verData.versions || []);

      // Event source mappings (triggers)
      const mapRes = await apiFetch(
        `/api/lambda?action=listEventSourceMappings&functionName=${encodeURIComponent(functionName)}`,
      );
      const mapData = await mapRes.json();
      if (mapData.error) throw new Error(mapData.error);
      setMappings(mapData.mappings || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load function details");
    }
    setLoading(false);
  }, [functionName]);

  useEffect(() => {
    if (functionName) fetchDetails();
  }, [functionName, fetchDetails]);

  // Row-action events for the triggers table
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        action: string;
        mapping: LambdaEventSourceMappingConfig;
      };
      if (detail.action === "toggle") {
        void (async () => {
          try {
            await post({
              action: "updateEventSourceMapping",
              uuid: detail.mapping.UUID,
              enabled: detail.mapping.State !== "Enabled",
            });
            showSuccess(
              `${detail.mapping.State === "Enabled" ? "Disabled" : "Enabled"} trigger ${detail.mapping.UUID}`,
            );
            await fetchDetails();
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to update trigger");
          }
        })();
      } else if (detail.action === "delete") {
        setTriggerDeleteTarget(detail.mapping);
      }
    };
    window.addEventListener("lambda-trigger-action", handler);
    return () => window.removeEventListener("lambda-trigger-action", handler);
  }, [post, fetchDetails, showSuccess]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const openEdit = () => {
    if (!functionConfig) return;
    setEditForm({
      description: functionConfig.Description || "",
      runtime: functionConfig.Runtime || "",
      handler: functionConfig.Handler || "",
      memorySize: functionConfig.MemorySize ? String(functionConfig.MemorySize) : "",
      timeout: functionConfig.Timeout ? String(functionConfig.Timeout) : "",
      role: functionConfig.Role || "",
      environment: Object.entries(normalizeEnv(functionConfig.Environment)).map(([key, value]) => ({
        key,
        value,
      })),
    });
    setEditModal(true);
  };

  const saveConfiguration = async () => {
    setEditSaving(true);
    setError(null);
    try {
      await post({
        action: "updateConfiguration",
        functionName,
        description: editForm.description,
        runtime: editForm.runtime || undefined,
        handler: editForm.handler,
        memorySize: editForm.memorySize ? Number(editForm.memorySize) : undefined,
        timeout: editForm.timeout ? Number(editForm.timeout) : undefined,
        role: editForm.role,
        environment: Object.fromEntries(
          editForm.environment.filter((e) => e.key.trim() !== "").map((e) => [e.key, e.value]),
        ),
      });
      setEditModal(false);
      showSuccess("Function configuration saved");
      await fetchDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    }
    setEditSaving(false);
  };

  const runTest = async () => {
    setTestLoading(true);
    setTestResult("");
    try {
      const data = await post({ action: "invoke", functionName, payload: testEvent });
      setTestResult(JSON.stringify(data.result ?? data, null, 2));
    } catch (err: unknown) {
      setTestResult(err instanceof Error ? err.message : "Invoke failed");
    }
    setTestLoading(false);
  };

  const createAlias = async () => {
    setAliasSaving(true);
    setError(null);
    try {
      await post({
        action: "createAlias",
        functionName,
        aliasName,
        functionVersion: aliasVersion,
        description: aliasDescription,
      });
      setAliasModal(false);
      setAliasName("");
      setAliasVersion("");
      setAliasDescription("");
      showSuccess(`Created alias ${aliasName}`);
      await fetchDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create alias");
    }
    setAliasSaving(false);
  };

  const deleteAlias = async () => {
    if (!aliasDeleteTarget) return;
    setAliasDeleteLoading(true);
    setError(null);
    try {
      await post({
        action: "deleteAlias",
        functionName,
        aliasName: aliasDeleteTarget.AliasName,
      });
      setAliasDeleteTarget(null);
      showSuccess(`Deleted alias ${aliasDeleteTarget.AliasName}`);
      await fetchDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete alias");
    }
    setAliasDeleteLoading(false);
  };

  const publishVersion = async () => {
    setPublishSaving(true);
    setError(null);
    try {
      const data = await post({
        action: "publishVersion",
        functionName,
        description: publishDescription,
      });
      setPublishModal(false);
      setPublishDescription("");
      showSuccess(`Published version ${data.version}`);
      await fetchDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to publish version");
    }
    setPublishSaving(false);
  };

  const createTrigger = async () => {
    setTriggerSaving(true);
    setError(null);
    try {
      await post({
        action: "createEventSourceMapping",
        eventSourceArn: triggerArn,
        functionName,
        batchSize: triggerBatchSize ? Number(triggerBatchSize) : undefined,
        enabled: triggerEnabled,
      });
      setTriggerModal(false);
      setTriggerArn("");
      showSuccess("Trigger added");
      await fetchDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add trigger");
    }
    setTriggerSaving(false);
  };

  const deleteTrigger = async () => {
    if (!triggerDeleteTarget) return;
    setTriggerDeleteLoading(true);
    setError(null);
    try {
      await post({
        action: "deleteEventSourceMapping",
        uuid: triggerDeleteTarget.UUID,
      });
      setTriggerDeleteTarget(null);
      showSuccess("Trigger deleted");
      await fetchDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete trigger");
    }
    setTriggerDeleteLoading(false);
  };

  const saveTags = async () => {
    if (!functionConfig?.FunctionArn || !tagDraft) return;
    setTagSaving(true);
    setError(null);
    try {
      const arn = functionConfig.FunctionArn;
      const original = new Map(
        tags.filter((t) => t.Key).map((t) => [t.Key as string, t.Value ?? ""]),
      );
      const next = new Map(tagDraft.map((t) => [t.key, t.value]));
      const removed = [...original.keys()].filter((k) => !next.has(k));
      const changed = [...next.entries()].filter(([k, v]) => original.get(k) !== v);
      if (removed.length > 0) {
        await post({ action: "untagResource", arn, keys: removed });
      }
      if (changed.length > 0) {
        await post({
          action: "tagResource",
          arn,
          tags: changed.map(([Key, Value]) => ({ Key, Value })),
        });
      }
      setTagDraft(null);
      showSuccess("Tags saved");
      await fetchDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save tags");
    }
    setTagSaving(false);
  };

  const uploadZip = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const buf = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), ""),
      );
      await post({ action: "updateCode", functionName, zipFile: base64 });
      showSuccess("Function code updated");
      await fetchDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload code");
    }
    setUploading(false);
  };

  // ─── Early returns ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SpaceBetween size="l">
        <Header variant="h2">Function {functionName}</Header>
        <Box textAlign="center">
          <Spinner size="large" />
          <Box variant="p" padding={{ top: "s" }}>
            Loading function details...
          </Box>
        </Box>
      </SpaceBetween>
    );
  }

  if (error && !functionConfig) {
    return (
      <SpaceBetween size="l">
        <Header variant="h2">Function {functionName}</Header>
        <Alert type="error">{error || "Function not found"}</Alert>
        <Button onClick={() => router.push("/lambda")}>Back to Lambda</Button>
      </SpaceBetween>
    );
  }

  if (!functionConfig) return null;

  const isActive = functionConfig.State === "Active" || functionConfig.State === undefined;
  const envEntries = Object.entries(normalizeEnv(functionConfig.Environment));
  const publishedVersions = versions.filter((v) => v.Version && v.Version !== "$LATEST");
  const tagsDirty =
    tagDraft !== null && serializeTags(toEditorTags(tags)) !== serializeTags(tagDraft);

  // ─── Tab contents ──────────────────────────────────────────────────────────

  const codeContent = (
    <Container header={<Header variant="h2">Code</Header>}>
      <SpaceBetween size="m">
        <Box variant="small" color="text-body-secondary">
          Deploy your function package as a .zip archive, or view the source returned by the
          emulator.
        </Box>
        <SpaceBetween direction="horizontal" size="xs">
          <label htmlFor="lambda-zip-upload">
            <Button
              variant="primary"
              loading={uploading}
              disabled={uploading}
              formAction="none"
              onClick={() => document.getElementById("lambda-zip-upload")?.click()}
            >
              Upload from .zip file
            </Button>
          </label>
          <input
            id="lambda-zip-upload"
            type="file"
            accept=".zip,application/zip"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadZip(file);
              e.target.value = "";
            }}
          />
        </SpaceBetween>
        {code ? (
          <CodeView content={code} lineNumbers wrapLines />
        ) : (
          <Alert type="info">
            The emulator did not return inline source for this function. Upload a .zip package to
            deploy code, or use the AWS CLI against the emulator endpoint.
          </Alert>
        )}
      </SpaceBetween>
    </Container>
  );

  const testContent = (
    <Container header={<Header variant="h2">Test event</Header>}>
      <SpaceBetween size="m">
        <Box variant="small" color="text-body-secondary">
          Configure a JSON event and invoke the function. Invocations run against the active
          emulator backend.
        </Box>
        <FormField label="Event JSON">
          <Textarea
            value={testEvent}
            onChange={(e) => setTestEvent(e.detail.value)}
            rows={10}
            ariaLabel="Test event JSON"
          />
        </FormField>
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="primary" onClick={runTest} loading={testLoading} disabled={testLoading}>
            {testLoading ? "Invoking..." : "Test"}
          </Button>
          <Button onClick={() => setTestEvent("{}")} formAction="none">
            Reset
          </Button>
        </SpaceBetween>
        {testResult && (
          <FormField label="Invocation result">
            <CodeView content={testResult} lineNumbers wrapLines />
          </FormField>
        )}
      </SpaceBetween>
    </Container>
  );

  const configContent = (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            <Button onClick={openEdit} formAction="none">
              Edit
            </Button>
          }
        >
          Configuration
        </Header>
      }
      className="aws-table-card"
    >
      <ColumnLayout columns={3} variant="default">
        <div>
          <Box variant="small" color="text-label">
            Function name
          </Box>
          <Box>{functionConfig.FunctionName || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Runtime
          </Box>
          <Box>{functionConfig.Runtime || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Handler
          </Box>
          <Box>{functionConfig.Handler || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Architecture
          </Box>
          <Box>{functionConfig.Architecture || "x86_64"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Memory size
          </Box>
          <Box>{functionConfig.MemorySize ? `${functionConfig.MemorySize} MB` : "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Timeout
          </Box>
          <Box>{functionConfig.Timeout ? `${functionConfig.Timeout} s` : "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            State
          </Box>
          <StatusIndicator type={isActive ? "success" : "warning"}>
            {functionConfig.State || "Active"}
          </StatusIndicator>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Role
          </Box>
          <TruncatedText>{functionConfig.Role || "—"}</TruncatedText>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Description
          </Box>
          <TruncatedText>{functionConfig.Description || "—"}</TruncatedText>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Function ARN
          </Box>
          <TruncatedText>{functionConfig.FunctionArn || "—"}</TruncatedText>
        </div>
      </ColumnLayout>
      <SpaceBetween size="m" direction="vertical">
        <Container
          header={<Header variant="h3">Environment variables ({envEntries.length})</Header>}
          className="aws-table-card"
        >
          {envEntries.length > 0 ? (
            <Table
              columnDefinitions={[
                { header: "Key", cell: (item: { key: string; value: string }) => item.key },
                { header: "Value", cell: (item: { key: string; value: string }) => item.value },
              ]}
              items={envEntries.map(([key, value]) => ({ key, value }))}
            />
          ) : (
            <Box>No environment variables configured.</Box>
          )}
        </Container>
      </SpaceBetween>
    </Container>
  );

  const monitorContent = (
    <Container header={<Header variant="h2">Monitor</Header>}>
      <SpaceBetween size="m">
        <Box variant="small" color="text-body-secondary">
          Metrics and logs for this function are published to Amazon CloudWatch. Log group:{" "}
          <Box variant="code">/aws/lambda/{functionName}</Box>
        </Box>
        <SpaceBetween direction="horizontal" size="xs">
          <Link href="/cloudwatch">View CloudWatch metrics</Link>
          <Link href="/cloudwatch-logs">View CloudWatch log groups</Link>
          <Link href="/x-ray">X-Ray traces</Link>
        </SpaceBetween>
        <Alert type="info">
          Metric data points appear in CloudWatch after the function is invoked.
        </Alert>
      </SpaceBetween>
    </Container>
  );

  const aliasesContent = (
    <Container
      header={
        <Header
          variant="h2"
          counter={`(${aliases.length})`}
          actions={
            <Button
              variant="primary"
              onClick={() => setAliasModal(true)}
              disabled={publishedVersions.length === 0}
              formAction="none"
            >
              Create alias
            </Button>
          }
        >
          Aliases
        </Header>
      }
      className="aws-table-card"
    >
      {publishedVersions.length === 0 && aliases.length === 0 && (
        <Alert type="info">
          Publish a version first — aliases can only point to published versions, not $LATEST.
        </Alert>
      )}
      {aliases.length > 0 ? (
        <Table
          columnDefinitions={[
            {
              header: "Alias name",
              cell: (item: LambdaAliasConfig) => item.AliasName || "—",
              isRowHeader: true,
            },
            { header: "Version", cell: (item: LambdaAliasConfig) => item.FunctionVersion || "—" },
            {
              header: "Description",
              cell: (item: LambdaAliasConfig) => (
                <TruncatedText>{item.Description || "—"}</TruncatedText>
              ),
            },
            {
              header: "Actions",
              cell: (item: LambdaAliasConfig) => (
                <ButtonDropdown
                  variant="icon"
                  ariaLabel={`Actions for alias ${item.AliasName}`}
                  items={[{ text: "Delete", id: "delete" }]}
                  onItemClick={({ detail }) => {
                    if (detail.id === "delete") setAliasDeleteTarget(item);
                  }}
                >
                  Actions
                </ButtonDropdown>
              ),
            },
          ]}
          items={aliases}
        />
      ) : (
        <Box>No aliases configured.</Box>
      )}
    </Container>
  );

  const versionsContent = (
    <Container
      header={
        <Header
          variant="h2"
          counter={`(${versions.length})`}
          actions={
            <Button variant="primary" onClick={() => setPublishModal(true)} formAction="none">
              Publish new version
            </Button>
          }
        >
          Versions
        </Header>
      }
      className="aws-table-card"
    >
      {versions.length > 0 ? (
        <Table
          columnDefinitions={[
            {
              header: "Version",
              cell: (item: LambdaVersionConfig) => item.Version || "—",
              isRowHeader: true,
              sortingField: "Version",
            },
            {
              header: "Description",
              cell: (item: LambdaVersionConfig) => (
                <TruncatedText>{item.Description || "—"}</TruncatedText>
              ),
              sortingField: "Description",
            },
            {
              header: "Last modified",
              cell: (item: LambdaVersionConfig) =>
                item.LastModified ? new Date(item.LastModified).toLocaleString() : "—",
              sortingField: "LastModified",
            },
            {
              header: "Code size",
              cell: (item: LambdaVersionConfig) =>
                item.CodeSize !== undefined ? `${item.CodeSize} bytes` : "—",
              sortingField: "CodeSize",
            },
            {
              header: "SHA-256",
              cell: (item: LambdaVersionConfig) =>
                item.CodeSha256 ? <TruncatedText>{item.CodeSha256}</TruncatedText> : "—",
            },
            {
              header: "Actions",
              cell: (item: LambdaVersionConfig) => (
                <ButtonDropdown
                  variant="icon"
                  ariaLabel={`Actions for version ${item.Version}`}
                  items={[{ text: "Copy ARN", id: "copy-arn" }]}
                  onItemClick={({ detail }) => {
                    if (detail.id === "copy-arn" && functionConfig.FunctionArn) {
                      void navigator.clipboard.writeText(
                        `${functionConfig.FunctionArn}:${item.Version}`,
                      );
                      showSuccess("Copied version ARN");
                    }
                  }}
                >
                  Actions
                </ButtonDropdown>
              ),
            },
          ]}
          items={versions}
        />
      ) : (
        <Box>No versions published.</Box>
      )}
    </Container>
  );

  const triggersContent = (
    <Container
      header={
        <Header
          variant="h2"
          counter={`(${mappings.length})`}
          actions={
            <Button variant="primary" onClick={() => setTriggerModal(true)} formAction="none">
              Add trigger
            </Button>
          }
        >
          Triggers
        </Header>
      }
      className="aws-table-card"
    >
      {mappings.length > 0 ? (
        <Table columnDefinitions={MAPPING_COLUMNS} items={mappings} />
      ) : (
        <Box textAlign="center" color="inherit">
          <Box variant="strong" textAlign="center" color="inherit">
            No triggers configured
          </Box>
          <Box variant="p" padding={{ bottom: "s" }} color="inherit">
            Add a trigger to invoke this function from another service.
          </Box>
          <Button onClick={() => setTriggerModal(true)}>Add trigger</Button>
        </Box>
      )}
    </Container>
  );

  const tagsContent = (
    <Container
      header={
        <Header
          variant="h2"
          counter={`(${tags.length})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              {tagDraft !== null ? (
                <>
                  <Button onClick={() => setTagDraft(null)} formAction="none">
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={saveTags}
                    loading={tagSaving}
                    disabled={tagSaving || !tagsDirty || !functionConfig.FunctionArn}
                  >
                    Save changes
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setTagDraft(toEditorTags(tags))}
                  disabled={!functionConfig.FunctionArn}
                  formAction="none"
                >
                  Manage tags
                </Button>
              )}
            </SpaceBetween>
          }
        >
          Tags
        </Header>
      }
      className="aws-table-card"
    >
      {!functionConfig.FunctionArn && (
        <Alert type="info">Tags can be managed once the emulator reports a function ARN.</Alert>
      )}
      {tagDraft !== null ? (
        <TagEditor tags={tagDraft} onChange={setTagDraft} readOnly={!functionConfig.FunctionArn} />
      ) : tags.length > 0 ? (
        <Table
          columnDefinitions={[
            { header: "Key", cell: (item: TagPair) => item.Key || "—" },
            { header: "Value", cell: (item: TagPair) => item.Value || "—" },
          ]}
          items={tags}
        />
      ) : (
        <Box>No tags assigned.</Box>
      )}
    </Container>
  );

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <SpaceBetween size="l">
      <Header
        variant="h2"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button iconName="refresh" onClick={fetchDetails} ariaLabel="Refresh" formAction="none">
              Refresh
            </Button>
            <Button onClick={() => router.push("/lambda")} formAction="none">
              Back to Lambda
            </Button>
          </SpaceBetween>
        }
      >
        {functionConfig.FunctionName || functionName}
      </Header>

      {successItem && <Flashbar items={[successItem]} />}

      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs
        tabs={[
          { label: "Code", id: "code", content: codeContent },
          { label: "Test", id: "test", content: testContent },
          { label: "Configuration", id: "configuration", content: configContent },
          { label: "Monitor", id: "monitor", content: monitorContent },
          { label: "Aliases", id: "aliases", content: aliasesContent },
          { label: "Versions", id: "versions", content: versionsContent },
          { label: "Triggers", id: "triggers", content: triggersContent },
          { label: "Tags", id: "tags", content: tagsContent },
        ]}
      />

      {/* Edit configuration modal */}
      <Modal
        visible={editModal}
        onDismiss={() => setEditModal(false)}
        header="Edit configuration"
        size="large"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setEditModal(false)} formAction="none">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={saveConfiguration}
              loading={editSaving}
              disabled={editSaving}
            >
              Save
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Description">
            <Input
              value={editForm.description}
              onChange={(e) => setEditForm((f) => ({ ...f, description: e.detail.value }))}
            />
          </FormField>
          <FormField label="Runtime">
            <Select
              selectedOption={RUNTIMES.find((r) => r.value === editForm.runtime) ?? null}
              onChange={(e) =>
                setEditForm((f) => ({
                  ...f,
                  runtime:
                    (e.detail.selectedOption as SelectProps.Option | null)?.value?.toString() ?? "",
                }))
              }
              options={RUNTIMES}
            />
          </FormField>
          <FormField label="Handler">
            <Input
              value={editForm.handler}
              onChange={(e) => setEditForm((f) => ({ ...f, handler: e.detail.value }))}
            />
          </FormField>
          <ColumnLayout columns={2}>
            <FormField label="Memory size (MB)" constraintText="128 – 10240">
              <Input
                type="number"
                value={editForm.memorySize}
                onChange={(e) => setEditForm((f) => ({ ...f, memorySize: e.detail.value }))}
              />
            </FormField>
            <FormField label="Timeout (seconds)" constraintText="1 – 900">
              <Input
                type="number"
                value={editForm.timeout}
                onChange={(e) => setEditForm((f) => ({ ...f, timeout: e.detail.value }))}
              />
            </FormField>
          </ColumnLayout>
          <FormField label="Execution role ARN">
            <Input
              value={editForm.role}
              onChange={(e) => setEditForm((f) => ({ ...f, role: e.detail.value }))}
            />
          </FormField>
          <Container header={<Header variant="h3">Environment variables</Header>}>
            <SpaceBetween size="xs">
              {editForm.environment.map((row, idx) => (
                <SpaceBetween key={idx} direction="horizontal" size="xs">
                  <FormField label={idx === 0 ? "Key" : ""}>
                    <Input
                      value={row.key}
                      onChange={(e) =>
                        setEditForm((f) => {
                          const environment = [...f.environment];
                          environment[idx] = { ...environment[idx], key: e.detail.value };
                          return { ...f, environment };
                        })
                      }
                    />
                  </FormField>
                  <FormField label={idx === 0 ? "Value" : ""}>
                    <Input
                      value={row.value}
                      onChange={(e) =>
                        setEditForm((f) => {
                          const environment = [...f.environment];
                          environment[idx] = { ...environment[idx], value: e.detail.value };
                          return { ...f, environment };
                        })
                      }
                    />
                  </FormField>
                  <Button
                    iconName="remove"
                    ariaLabel={`Remove environment variable ${row.key || idx}`}
                    variant="icon"
                    onClick={() =>
                      setEditForm((f) => ({
                        ...f,
                        environment: f.environment.filter((_, i) => i !== idx),
                      }))
                    }
                    formAction="none"
                  />
                </SpaceBetween>
              ))}
              <Button
                iconName="add-plus"
                onClick={() =>
                  setEditForm((f) => ({
                    ...f,
                    environment: [...f.environment, { key: "", value: "" }],
                  }))
                }
                formAction="none"
              >
                Add variable
              </Button>
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      </Modal>

      {/* Create alias modal */}
      <Modal
        visible={aliasModal}
        onDismiss={() => setAliasModal(false)}
        header="Create alias"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setAliasModal(false)} formAction="none">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={createAlias}
              loading={aliasSaving}
              disabled={aliasSaving || !aliasName || !aliasVersion}
            >
              Create
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Alias name" constraintText="Unique within the function">
            <Input
              value={aliasName}
              onChange={(e) => setAliasName(e.detail.value)}
              ariaLabel="Alias name"
            />
          </FormField>
          <FormField label="Version">
            <Select
              selectedOption={
                aliasVersion ? { value: aliasVersion, label: `Version ${aliasVersion}` } : null
              }
              onChange={(e) =>
                setAliasVersion(
                  (e.detail.selectedOption as SelectProps.Option | null)?.value?.toString() ?? "",
                )
              }
              options={publishedVersions.map((v) => ({
                value: v.Version as string,
                label: `Version ${v.Version}`,
              }))}
              filteringType="auto"
            />
          </FormField>
          <FormField label="Description (optional)">
            <Input value={aliasDescription} onChange={(e) => setAliasDescription(e.detail.value)} />
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* Publish version modal */}
      <Modal
        visible={publishModal}
        onDismiss={() => setPublishModal(false)}
        header="Publish new version"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setPublishModal(false)} formAction="none">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={publishVersion}
              loading={publishSaving}
              disabled={publishSaving}
            >
              Publish
            </Button>
          </SpaceBetween>
        }
      >
        <FormField label="Description (optional)">
          <Input
            value={publishDescription}
            onChange={(e) => setPublishDescription(e.detail.value)}
            ariaLabel="Version description"
          />
        </FormField>
      </Modal>

      {/* Add trigger modal */}
      <Modal
        visible={triggerModal}
        onDismiss={() => setTriggerModal(false)}
        header="Add trigger"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setTriggerModal(false)} formAction="none">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={createTrigger}
              loading={triggerSaving}
              disabled={triggerSaving || !triggerArn}
            >
              Add
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Trigger">
            <Select
              selectedOption={triggerType}
              onChange={(e) => setTriggerType(e.detail.selectedOption as SelectProps.Option | null)}
              options={TRIGGER_TYPES}
            />
          </FormField>
          <FormField
            label="Event source ARN"
            constraintText="ARN of the queue, topic, stream, or bucket to subscribe"
          >
            <Input
              value={triggerArn}
              onChange={(e) => setTriggerArn(e.detail.value)}
              ariaLabel="Event source ARN"
            />
          </FormField>
          <FormField label="Batch size" constraintText="1 – 10000">
            <Input
              type="number"
              value={triggerBatchSize}
              onChange={(e) => setTriggerBatchSize(e.detail.value)}
            />
          </FormField>
          <Checkbox
            checked={triggerEnabled}
            onChange={(e) => setTriggerEnabled(e.detail.checked)}
            description="Triggers invoke the function immediately after creation when enabled."
          >
            Enable trigger
          </Checkbox>
        </SpaceBetween>
      </Modal>

      {/* Delete alias confirm (reversible — plain confirm per AWS) */}
      <Modal
        visible={aliasDeleteTarget !== null}
        onDismiss={() => setAliasDeleteTarget(null)}
        header="Delete alias"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setAliasDeleteTarget(null)} formAction="none">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={deleteAlias}
              loading={aliasDeleteLoading}
              disabled={aliasDeleteLoading}
            >
              Delete
            </Button>
          </SpaceBetween>
        }
      >
        <Box>
          Delete alias <Box variant="strong">{aliasDeleteTarget?.AliasName}</Box>? Requests using
          this alias ARN will fail after deletion.
        </Box>
      </Modal>

      {/* Delete trigger confirm */}
      <Modal
        visible={triggerDeleteTarget !== null}
        onDismiss={() => setTriggerDeleteTarget(null)}
        header="Delete trigger"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setTriggerDeleteTarget(null)} formAction="none">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={deleteTrigger}
              loading={triggerDeleteLoading}
              disabled={triggerDeleteLoading}
            >
              Delete
            </Button>
          </SpaceBetween>
        }
      >
        <Box>
          Delete the{" "}
          {triggerDeleteTarget ? triggerTypeFromArn(triggerDeleteTarget.EventSourceArn || "") : ""}{" "}
          trigger ({triggerDeleteTarget?.UUID})? The event source will stop invoking this function.
        </Box>
      </Modal>
    </SpaceBetween>
  );
}
