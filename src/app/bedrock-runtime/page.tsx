"use client";

import { apiFetch } from "@/lib/api-client";
import React, { useState } from "react";
import { CodeView } from "@cloudscape-design/code-view";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Textarea from "@cloudscape-design/components/textarea";
import Alert from "@cloudscape-design/components/alert";

export default function BedrockRuntimePage() {
  const [modelId, setModelId] = useState("anthropic.claude-v2");
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invokeModel = async () => {
    if (!modelId.trim() || !prompt.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await apiFetch("/api/bedrock-runtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invoke",
          modelId,
          body: { prompt, max_tokens: 500 },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to invoke model");
      setResponse(
        typeof data.response === "string" ? data.response : JSON.stringify(data.response, null, 2),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <Header variant="h1">Amazon Bedrock Runtime</Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container header={<Header variant="h2">Invoke Model</Header>}>
          <SpaceBetween size="m">
            <FormField
              label="Model ID"
              description="e.g. anthropic.claude-v2, amazon.titan-text-express-v1"
            >
              <Input
                value={modelId}
                onChange={(e) => setModelId(e.detail.value)}
                placeholder="anthropic.claude-v2"
              />
            </FormField>

            <FormField label="Prompt">
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.detail.value)}
                rows={6}
                placeholder="Enter your prompt here..."
              />
            </FormField>

            <Button
              variant="primary"
              onClick={invokeModel}
              loading={loading}
              disabled={!modelId.trim() || !prompt.trim()}
            >
              Invoke
            </Button>

            {response !== null && (
              <FormField label="Response">
                <CodeView content={response} lineNumbers wrapLines />
              </FormField>
            )}

            {response === null && !loading && (
              <Box color="text-status-inactive">Response will appear here after invocation.</Box>
            )}
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </div>
  );
}
