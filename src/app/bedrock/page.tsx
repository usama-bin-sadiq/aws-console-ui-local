"use client";
import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Tabs from "@cloudscape-design/components/tabs";
import TruncatedText from "@/components/TruncatedText";


interface FoundationModel {
  modelId?: string;
  modelName?: string;
  providerName?: string;
  modelArn?: string;
}

interface CustomModel {
  modelArn?: string;
  modelName?: string;
  modelId?: string;
}

export default function BedrockPage() {
  const [foundationModels, setFoundationModels] = useState<FoundationModel[]>([]);
  const [customModels, setCustomModels] = useState<CustomModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [foundationRes, customRes] = await Promise.all([
        fetch("/api/bedrock"),
        fetch("/api/bedrock", { method: "POST", headers: { "Content-Type": "application/json" } }),
      ]);
      const foundationData = await foundationRes.json();
      const customData = await customRes.json();
      if (foundationData.error) throw new Error(foundationData.error);
      if (customData.error) throw new Error(customData.error);
      setFoundationModels(foundationData.modelSummaries || []);
      setCustomModels(customData.customModels || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Amazon Bedrock</Header>
        {error && <Alert type="error" header="Error">{error}</Alert>}
        <Container>
          <Tabs tabs={[
            {
              id: "foundation",
              label: `Foundation Models (${foundationModels.length})`,
              content: (
                <Table
                  header={<Header variant="h2">Foundation Models</Header>}
                  items={foundationModels}
                  loading={loading}
                  columnDefinitions={[
                    { header: "Model ID", cell: (i) => i.modelId || "—" },
                    { header: "Name", cell: (i) => i.modelName || "—" },
                    { header: "Provider", cell: (i) => i.providerName || "—" },
                    { header: "ARN", cell: (i) => <TruncatedText>{i.modelArn || "—"}</TruncatedText> },
                  ]}
                  empty={<Box textAlign="center">No foundation models found.</Box>}
                />
              ),
            },
            {
              id: "custom",
              label: `Custom Models (${customModels.length})`,
              content: (
                <Table
                  header={<Header variant="h2">Custom Models</Header>}
                  items={customModels}
                  loading={loading}
                  columnDefinitions={[
                    { header: "Model ID", cell: (i) => i.modelId || "—" },
                    { header: "Name", cell: (i) => i.modelName || "—" },
                    { header: "ARN", cell: (i) => <TruncatedText>{i.modelArn || "—"}</TruncatedText> },
                  ]}
                  empty={<Box textAlign="center">No custom models found.</Box>}
                />
              ),
            },
          ]} />
        </Container>
      </SpaceBetween>
    </div>
  );
}
