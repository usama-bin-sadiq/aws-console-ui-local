"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Tabs from "@cloudscape-design/components/tabs";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Button from "@cloudscape-design/components/button";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Alert from "@cloudscape-design/components/alert";
import Spinner from "@cloudscape-design/components/spinner";
import Table from "@cloudscape-design/components/table";
import Textarea from "@cloudscape-design/components/textarea";
import Link from "@cloudscape-design/components/link";
import { LambdaFunctionConfig, LambdaAliasConfig, LambdaVersionConfig, LambdaTriggerConfig } from "@/types/lambda";

export default function LambdaFunctionDetailPage({
  params,
}: {
  params: { functionName: string };
}) {
  const router = useRouter();
  const [functionConfig, setFunctionConfig] = useState<LambdaFunctionConfig | null>(null);
  const [aliases, setAliases] = useState<LambdaAliasConfig[]>([]);
  const [versions, setVersions] = useState<LambdaVersionConfig[]>([]);
  const [triggers, setTriggers] = useState<LambdaTriggerConfig[]>([]);
  const [tags, setTags] = useState<Array<{ Key?: string; Value?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const functionName = decodeURIComponent(params.functionName || "");

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Get function config
      const res = await fetch(`/api/lambda?action=getFunction&functionName=${encodeURIComponent(functionName)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFunctionConfig(data.function || data);
      setTags(data.function?.Tags || []);
      setCode(data.function?.Code?.Code || "// Function code\nexports.handler = async (event) => {\n  return { statusCode: 200, body: 'Hello' };\n};");

      // Aliases
      const aliasRes = await fetch(`/api/lambda?action=listAliases&functionName=${encodeURIComponent(functionName)}`);
      const aliasData = await aliasRes.json();
      setAliases(aliasData.aliases || []);

      // Versions
      const verRes = await fetch(`/api/lambda?action=listVersions&functionName=${encodeURIComponent(functionName)}`);
      const verData = await verRes.json();
      setVersions(verData.versions || []);

      // Triggers (mocked based on common Lambda triggers)
      setTriggers([
        { TriggerType: "api-gateway", SourceArn: `arn:aws:execute-api:us-east-1:123456789012:abcd1234/prod/*/*`, SourceAccount: "123456789012" },
      ]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load function details");
    }
    setLoading(false);
  }, [functionName]);

  useEffect(() => {
    if (functionName) fetchDetails();
  }, [functionName, fetchDetails]);

  if (loading) {
    return (
      <div style={{ padding: "16px" }}>
        <SpaceBetween size="l">
          <Header variant="h1">Function {functionName}</Header>
          <Box textAlign="center">
            <Spinner size="large" />
            <Box variant="p" padding={{ top: "s" }}>Loading function details...</Box>
          </Box>
        </SpaceBetween>
      </div>
    );
  }

  if (error || !functionConfig) {
    return (
      <div style={{ padding: "16px" }}>
        <SpaceBetween size="l">
          <Header variant="h1">Function {functionName}</Header>
          <Alert type="error">{error || "Function not found"}</Alert>
          <Button onClick={() => router.push("/lambda")}>Back to Lambda</Button>
        </SpaceBetween>
      </div>
    );
  }

  const isActive = functionConfig.State === "Active" || functionConfig.State === undefined;

  // Tabs content
  const codeContent = (
    <Container header={<Header variant="h2">Code</Header>}>
      <SpaceBetween size="m">
        <Box variant="small" color="text-body-secondary">
          Edit the function code below. For production workflows, deploy via CI/CD or the AWS CLI.
        </Box>
        <Textarea
          value={code}
          onChange={(e) => setCode(e.detail.value)}
          rows={20}
          readOnly={false}
        />
      </SpaceBetween>
    </Container>
  );

  const configContent = (
    <Container header={<Header variant="h2">Configuration</Header>}>
      <ColumnLayout columns={3} variant="default">
        <div>
          <Box variant="small" color="text-label">Function name</Box>
          <Box>{functionConfig.FunctionName || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Runtime</Box>
          <Box>{functionConfig.Runtime || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Handler</Box>
          <Box>{functionConfig.Handler || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Architecture</Box>
          <Box>{functionConfig.Architecture || "x86_64"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Memory size</Box>
          <Box>{functionConfig.MemorySize ? `${functionConfig.MemorySize} MB` : "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Timeout</Box>
          <Box>{functionConfig.Timeout ? `${functionConfig.Timeout} s` : "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">State</Box>
          <StatusIndicator type={isActive ? "success" : "warning"}>
            {functionConfig.State || "Active"}
          </StatusIndicator>
        </div>
        <div>
          <Box variant="small" color="text-label">Role</Box>
          <Box>{functionConfig.Role || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">Description</Box>
          <Box>{functionConfig.Description || "—"}</Box>
        </div>
      </ColumnLayout>
      <SpaceBetween size="m" direction="vertical" />
      <Container header={<Header variant="h3">Environment variables</Header>}>
        {functionConfig.Environment && Object.keys(functionConfig.Environment).length > 0 ? (
          <Table
            columnDefinitions={[
              { header: "Key", cell: (item: any) => item.Key },
              { header: "Value", cell: (item: any) => item.Value },
            ]}
            items={Object.entries(functionConfig.Environment || {}).map(([Key, Value]) => ({ Key, Value }))}
          />
        ) : (
          <Box>No environment variables configured.</Box>
        )}
      </Container>
    </Container>
  );

  const tagsContent = (
    <Container header={<Header variant="h2">Tags</Header>}>
      {tags && tags.length > 0 ? (
        <Table
          columnDefinitions={[
            { header: "Key", cell: (item) => item.Key || "—" },
            { header: "Value", cell: (item) => item.Value || "—" },
          ]}
          items={tags}
          header={<Header variant="h3">Tags ({tags.length})</Header>}
        />
      ) : (
        <Box>No tags assigned.</Box>
      )}
    </Container>
  );

  const aliasesContent = (
    <Container header={<Header variant="h2">Aliases</Header>}>
      {aliases.length > 0 ? (
        <Table
          columnDefinitions={[
            { header: "Alias name", cell: (item: LambdaAliasConfig) => item.AliasName || "—" },
            { header: "Version", cell: (item: LambdaAliasConfig) => item.FunctionVersion || "—" },
            { header: "Description", cell: (item: LambdaAliasConfig) => item.Description || "—" },
          ]}
          items={aliases}
          header={<Header variant="h3">Aliases ({aliases.length})</Header>}
        />
      ) : (
        <Box>No aliases configured.</Box>
      )}
    </Container>
  );

  const versionsContent = (
    <Container header={<Header variant="h2">Versions</Header>}>
      {versions.length > 0 ? (
        <Table
          columnDefinitions={[
            { header: "Version", cell: (item: LambdaVersionConfig) => item.Version || "—" },
            { header: "Runtime", cell: (item: LambdaVersionConfig) => item.Runtime || "—" },
            { header: "Memory", cell: (item: LambdaVersionConfig) => (item.MemorySize ? `${item.MemorySize} MB` : "—") },
            { header: "Code size", cell: (item: LambdaVersionConfig) => (item.CodeSize ? `${item.CodeSize} bytes` : "—") },
            { header: "Description", cell: (item: LambdaVersionConfig) => item.Description || "—" },
          ]}
          items={versions}
          header={<Header variant="h3">Versions ({versions.length})</Header>}
        />
      ) : (
        <Box>No versions published.</Box>
      )}
    </Container>
  );

  const triggersContent = (
    <Container header={<Header variant="h2">Triggers</Header>}>
      {triggers.length > 0 ? (
        <Table
          columnDefinitions={[
            { header: "Trigger type", cell: (item: LambdaTriggerConfig) => item.TriggerType || "—" },
            { header: "Source ARN", cell: (item: LambdaTriggerConfig) => item.SourceArn || "—" },
            { header: "Source account", cell: (item: LambdaTriggerConfig) => item.SourceAccount || "—" },
          ]}
          items={triggers}
          header={<Header variant="h3">Triggers ({triggers.length})</Header>}
        />
      ) : (
        <Box>No triggers configured.</Box>
      )}
    </Container>
  );

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => router.push("/lambda")} formAction="none">
                Back to Lambda
              </Button>
            </SpaceBetween>
          }
        >
          {functionConfig.FunctionName || functionName}
        </Header>

        {error && <Alert type="error">{error}</Alert>}

        <Tabs
          tabs={[
            { label: "Code", id: "code", content: codeContent },
            { label: "Configuration", id: "configuration", content: configContent },
            { label: "Tags", id: "tags", content: tagsContent },
            { label: "Aliases", id: "aliases", content: aliasesContent },
            { label: "Versions", id: "versions", content: versionsContent },
            { label: "Triggers", id: "triggers", content: triggersContent },
          ]}
        />
      </SpaceBetween>
    </div>
  );
}
