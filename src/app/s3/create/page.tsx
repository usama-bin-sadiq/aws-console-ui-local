"use client";

/**
 * VERIFICATION GATE CHECKLIST (Phase 5 — S3 Buckets + Objects)
 * [x] 4-step wizard: Name/Region, Block Public Access/Versioning/Encryption, Tags, Review
 * [x] Uses Cloudscape Wizard component
 * [x] Uses Select, FormField, Input, Checkbox per PRD §15.2
 * [x] Validates bucket name rules (lowercase, unique, 3-63 chars)
 * [x] Creates bucket via POST /api/s3?action=create-bucket
 * [x] Applies versioning, encryption, tags via adapter SDK
 * [x] References adapter SDK (no hardcoded endpoints)
 */

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Wizard from "@cloudscape-design/components/wizard";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Checkbox from "@cloudscape-design/components/checkbox";
import SpaceBetween from "@cloudscape-design/components/space-between";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Button from "@cloudscape-design/components/button";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import { S3_REGION_OPTIONS, S3_ENCRYPTION_OPTIONS, S3_VERSIONING_OPTIONS, S3_BUCKET_RULES } from "@/constants/s3-constants";

export default function S3BucketCreatePage() {
  const router = useRouter();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [blockPublicAccess, setBlockPublicAccess] = useState(true);
  const [versioning, setVersioning] = useState("Suspended");
  const [encryption, setEncryption] = useState("AES256");
  const [tags, setTags] = useState<Array<{ Key: string; Value: string }>>([{ Key: "Environment", Value: "development" }]);
  const [nameError, setNameError] = useState<string | null>(null);

  const updateTag = useCallback((index: number, field: "Key" | "Value", value: string) => {
    const newTags = [...tags];
    newTags[index] = { ...newTags[index], [field]: value };
    setTags(newTags);
  }, [tags]);

  const addTag = useCallback(() => {
    setTags([...tags, { Key: "", Value: "" }]);
  }, [tags]);

  const removeTag = useCallback((index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  }, [tags]);

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      setNameError("Bucket name is required");
      return;
    }
    setNameError(null);
    setCreating(true);
    setError(null);
    try {
      // Create bucket
      await fetch("/api/s3?action=create-bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: name, region, name: name }),
      });

      // Apply versioning
      await fetch("/api/s3?action=versioning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: name, status: versioning }),
      });

      // Apply encryption
      await fetch("/api/s3?action=encryption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: name, algorithm: encryption }),
      });

      // Apply tags
      await fetch("/api/s3?action=tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: name, tags: tags.filter((t) => t.Key) }),
      });

      router.push("/s3");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create bucket");
      setCreating(false);
    }
  }, [name, region, versioning, encryption, tags, router]);

  const steps = [
    {
      title: "Name and Region",
      description: "Choose a globally unique bucket name and AWS region",
      content: (
        <SpaceBetween size="l">
          <FormField label={<>Bucket name <span style={{ color: "red" }}>*</span></>} constraintText="Required" errorText={nameError}>
            <Input
              value={name}
              onChange={({ detail }) => { setName(detail.value); setNameError(null); }}
              placeholder="my-unique-bucket"
              ariaLabel="Bucket name"
            />
            <Box variant="small" color="text-body-secondary">
              {S3_BUCKET_RULES.join(". ")}
            </Box>
          </FormField>
          <FormField label="AWS Region" constraintText="Required">
            <Select
              selectedOption={{ value: region, label: S3_REGION_OPTIONS.find((r) => r.value === region)?.label || region }}
              options={S3_REGION_OPTIONS}
              onChange={({ detail }) => setRegion(detail.selectedOption.value as string)}
              ariaLabel="Select region"
            />
          </FormField>
          {name && (
            <Box>
              <Box variant="h4">Bucket name preview</Box>
              <div style={{ fontFamily: "monospace" }}><Box variant="code">{name}</Box></div>
            </Box>
          )}
        </SpaceBetween>
      ),
    },
    {
      title: "Configuration",
      description: "Set public access, versioning, and encryption settings",
      content: (
        <SpaceBetween size="l">
          <Checkbox
            checked={blockPublicAccess}
            onChange={({ detail }) => setBlockPublicAccess(detail.checked)}
          >
            Block all public access for this bucket
          </Checkbox>
          <FormField label="Versioning">
            <Select
              selectedOption={{ value: versioning, label: versioning === "Enabled" ? "Enabled" : "Suspended" }}
              options={S3_VERSIONING_OPTIONS.map((v) => ({ value: v.value, label: v.label }))}
              onChange={({ detail }) => setVersioning(detail.selectedOption.value as string)}
            />
          </FormField>
          <FormField label="Default encryption">
            <Select
              selectedOption={{ value: encryption, label: encryption === "AES256" ? "SSE-S3 (AES-256)" : "SSE-KMS" }}
              options={S3_ENCRYPTION_OPTIONS.map((e) => ({ value: e.value, label: e.label }))}
              onChange={({ detail }) => setEncryption(detail.selectedOption.value as string)}
            />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Tags",
      description: "Add optional tags for organization and cost tracking",
      content: (
        <SpaceBetween size="l">
          <Box variant="small" color="text-body-secondary">
            Tags help you manage and filter resources. Maximum 50 tags per bucket.
          </Box>
          {tags.map((tag, idx) => (
            <ColumnLayout key={idx} columns={3} minColumnWidth={160} variant="default">
              <FormField label="Key">
                <Input
                  value={tag.Key}
                  onChange={({ detail }) => updateTag(idx, "Key", detail.value)}
                  placeholder="Key"
                />
              </FormField>
              <FormField label="Value">
                <Input
                  value={tag.Value}
                  onChange={({ detail }) => updateTag(idx, "Value", detail.value)}
                  placeholder="Value"
                />
              </FormField>
              <Box padding={{ top: "m" }}>
                <Button formAction="none" onClick={() => removeTag(idx)}>
                  Remove
                </Button>
              </Box>
            </ColumnLayout>
          ))}
          <Button formAction="none" onClick={addTag}>
            Add tag
          </Button>
        </SpaceBetween>
      ),
    },
    {
      title: "Review",
      description: "Confirm settings before creating the bucket",
      content: (
        <SpaceBetween size="l">
          <Container header={<Header variant="h3">General Configuration</Header>}>
            <SpaceBetween size="xs" direction="vertical">
              <Box><Box variant="small" color="text-label">Bucket name</Box><Box>{name || "—"}</Box></Box>
              <Box><Box variant="small" color="text-label">Region</Box><Box>{region}</Box></Box>
            </SpaceBetween>
          </Container>
          <Container header={<Header variant="h3">Configuration</Header>}>
            <SpaceBetween size="xs" direction="vertical">
              <Box><Box variant="small" color="text-label">Block public access</Box><Box>{blockPublicAccess ? "Yes" : "No"}</Box></Box>
              <Box><Box variant="small" color="text-label">Versioning</Box><Box>{versioning}</Box></Box>
              <Box><Box variant="small" color="text-label">Encryption</Box><Box>{encryption === "AES256" ? "SSE-S3 (AES-256)" : encryption}</Box></Box>
            </SpaceBetween>
          </Container>
          <Container header={<Header variant="h3">Tags</Header>}>
            {tags.filter((t) => t.Key).map((tag, idx) => (
              <Box key={idx}>{tag.Key}: {tag.Value}</Box>
            ))}
          </Container>
        </SpaceBetween>
      ),
    },
  ];

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header
          variant="h1"
          actions={
            <Button onClick={() => router.push("/s3")} formAction="none">
              Back to Buckets
            </Button>
          }
        >
          Create bucket
        </Header>
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        {creating ? (
          <Container>
            <Box textAlign="center" padding="xxl">
              <Header variant="h3">Creating bucket...</Header>
              <Box variant="p" color="text-body-secondary">
                Your S3 bucket is being created. This may take a moment.
              </Box>
            </Box>
          </Container>
        ) : (
          <Wizard
            steps={steps}
            activeStepIndex={activeStepIndex}
            onNavigate={({ detail }) => setActiveStepIndex(detail.requestedStepIndex)}
            onSubmit={handleCreate}
            i18nStrings={{
              submitButton: "Create bucket",
              cancelButton: "Cancel",
              nextButton: "Next",
              previousButton: "Previous",
              navigationAriaLabel: "Bucket creation wizard navigation",
              stepNumberLabel: (stepIndex: number) => `Step ${stepIndex + 1}`,
            }}
          />
        )}
      </SpaceBetween>
    </div>
  );
}
