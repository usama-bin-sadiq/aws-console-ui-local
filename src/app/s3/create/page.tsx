"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import Container from "@cloudscape-design/components/container";
import Form from "@cloudscape-design/components/form";
import FormField from "@cloudscape-design/components/form-field";
import Header from "@cloudscape-design/components/header";
import Input from "@cloudscape-design/components/input";
import SpaceBetween from "@cloudscape-design/components/space-between";
import ServiceLayout from "@/components/layouts/ServiceLayout";
import { apiFetch } from "@/lib/api-client";

/**
 * Create bucket.
 *
 * The S3 API route exposes bucket creation as `POST /api/s3` with
 * `action=create-bucket`; there is no `/api/s3/buckets` endpoint, so the form
 * posts to the real action and reports the emulator's own error text.
 */
export default function S3CreatePage() {
  const [bucketName, setBucketName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const router = useRouter();

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    setCreated(null);
    try {
      const res = await apiFetch("/api/s3?action=create-bucket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: bucketName.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setCreated(String(data.bucket || bucketName.trim()));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create bucket");
    } finally {
      setCreating(false);
    }
  };

  return (
    // The route layout already renders the service h1 ("S3"). This layout's own
    // header hardcodes variant="h1", so leaving it on gave the page two h1
    // elements; the Container header below carries the title as an h2 instead.
    <ServiceLayout serviceName="Create S3 Bucket" showTabs={false} showServiceHeader={false}>
      <Container header={<Header variant="h2">Create S3 Bucket</Header>}>
        <SpaceBetween size="l">
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}
          {created && (
            <Alert type="success" dismissible onDismiss={() => setCreated(null)}>
              Created bucket {created}.{" "}
              <Button
                variant="link"
                onClick={() => router.push(`/s3/${encodeURIComponent(created)}`)}
              >
                Open it
              </Button>
            </Alert>
          )}

          <Form
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  variant="primary"
                  loading={creating}
                  disabled={!bucketName.trim()}
                  onClick={handleCreate}
                >
                  Create bucket
                </Button>
                <Button variant="link" onClick={() => router.push("/s3")}>
                  Cancel
                </Button>
              </SpaceBetween>
            }
          >
            <FormField
              label="Bucket name"
              description="Bucket names must be globally unique and use lowercase letters, numbers and hyphens."
              constraintText="3-63 characters, lowercase letters, numbers, hyphens"
            >
              <Input
                value={bucketName}
                onChange={({ detail }) => setBucketName(detail.value || "")}
                placeholder="my-unique-bucket-name"
              />
            </FormField>
          </Form>
        </SpaceBetween>
      </Container>
    </ServiceLayout>
  );
}
