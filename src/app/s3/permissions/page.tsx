"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Alert from "@cloudscape-design/components/alert";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import { CodeView } from "@cloudscape-design/code-view";
import Container from "@cloudscape-design/components/container";
import Header from "@cloudscape-design/components/header";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Table from "@cloudscape-design/components/table";
import type { TableProps } from "@cloudscape-design/components/table";
import { apiFetch } from "@/lib/api-client";

/**
 * S3 permissions.
 *
 * Reads the bucket policy, public-access-block configuration and canned ACL for
 * every bucket straight from the emulator, so the access posture shown here is
 * the emulator's actual state rather than an assumption.
 */
interface BucketName {
  Name?: string;
  CreationDate?: string;
}

interface PermissionRow {
  bucket: string;
  policy: unknown;
  publicAccessBlock: Record<string, unknown> | undefined;
  acl: unknown;
  public: boolean;
  policyError?: string;
}

const PUBLIC_ACCESS_FIELDS = [
  "BlockPublicAcls",
  "IgnorePublicAcls",
  "BlockPublicPolicy",
  "RestrictPublicBuckets",
] as const;

/** A bucket counts as publicly accessible unless every public-access field blocks. */
function isPubliclyExposed(
  policy: unknown,
  publicAccessBlock: Record<string, unknown> | undefined,
): boolean {
  if (!publicAccessBlock) return true;
  return !PUBLIC_ACCESS_FIELDS.every((field) => publicAccessBlock[field] === true);
}

export default function S3PermissionsPage() {
  const [rows, setRows] = useState<PermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PermissionRow[]>([]);

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bucketsRes = await apiFetch("/api/s3");
      if (!bucketsRes.ok) throw new Error(`HTTP ${bucketsRes.status}`);
      const bucketsData = await bucketsRes.json();
      if (bucketsData.error) throw new Error(bucketsData.error);
      const buckets: BucketName[] = bucketsData.buckets || [];

      const results = await Promise.all(
        buckets.map(async (entry) => {
          const bucket = entry.Name ?? "";
          const encoded = encodeURIComponent(bucket);
          const [policyRes, blockRes, aclRes] = await Promise.all([
            apiFetch(`/api/s3?bucket=${encoded}&action=policy`),
            apiFetch(`/api/s3?bucket=${encoded}&action=public-access-block`),
            apiFetch(`/api/s3?bucket=${encoded}&action=acl`),
          ]);

          let policy: unknown = null;
          let policyError: string | undefined;
          if (policyRes.ok) {
            policy = (await policyRes.json()).policy ?? null;
          } else if (policyRes.status === 404) {
            // S3 answers GetBucketPolicy with 404 NoSuchBucketPolicy when no
            // policy is attached, which is the common case, not a failure.
            policy = null;
          } else {
            policyError = `policy unavailable (HTTP ${policyRes.status})`;
          }

          let publicAccessBlock: Record<string, unknown> | undefined;
          if (blockRes.ok) {
            publicAccessBlock = (await blockRes.json()).publicAccessBlock ?? undefined;
          }

          let acl: unknown;
          if (aclRes.ok) {
            acl = (await aclRes.json()).acl ?? null;
          }

          return {
            bucket,
            policy,
            publicAccessBlock,
            acl,
            public: isPubliclyExposed(policy, publicAccessBlock),
            policyError,
          } satisfies PermissionRow;
        }),
      );

      setRows(results);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch bucket permissions");
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const columnDefinitions: TableProps.ColumnDefinition<PermissionRow>[] = [
    {
      id: "bucket",
      header: "Bucket",
      cell: (item) => <Link href={`/s3/${encodeURIComponent(item.bucket)}`}>{item.bucket}</Link>,
      sortingField: "bucket",
    },
    {
      id: "policy",
      header: "Bucket policy",
      cell: (item) =>
        item.policyError ? (
          <Box variant="small" color="text-status-warning">
            {item.policyError}
          </Box>
        ) : item.policy ? (
          "Attached"
        ) : (
          "None"
        ),
    },
    {
      id: "block",
      header: "Public access block",
      cell: (item) =>
        item.publicAccessBlock ? (
          <Box variant="small">
            {PUBLIC_ACCESS_FIELDS.map(
              (field) => `${field}=${String(item.publicAccessBlock?.[field])}`,
            ).join("  ")}
          </Box>
        ) : (
          "Not configured"
        ),
    },
    {
      id: "exposure",
      header: "Public exposure",
      cell: (item) => (
        <Box color={item.public ? "text-status-error" : "text-status-success"}>
          {item.public ? "Publicly accessible" : "Blocked"}
        </Box>
      ),
    },
  ];

  const selectedRow = selected[0];

  return (
    <SpaceBetween size="l">
      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Container
        header={
          <Header
            variant="h2"
            description="Bucket policies, public access blocks and ACLs for every bucket"
            actions={
              <SpaceBetween size="s" direction="horizontal">
                <Button onClick={fetchPermissions} loading={loading} loadingText="Loading">
                  Refresh
                </Button>
                <Button href="/s3" variant="link">
                  Back to buckets
                </Button>
              </SpaceBetween>
            }
          >
            Permissions
          </Header>
        }
        className="aws-table-card"
      >
        <Table
          items={rows}
          columnDefinitions={columnDefinitions}
          loading={loading}
          loadingText="Reading bucket permissions"
          header={<Header variant="h3">Access posture</Header>}
          empty={<Box variant="p">No buckets to inspect yet.</Box>}
          selectionType="single"
          selectedItems={selected}
          onSelectionChange={(event) => setSelected(event.detail.selectedItems as PermissionRow[])}
          sortingColumn={{ sortingField: "bucket" }}
          wrapLines
        />
      </Container>

      {selectedRow && (
        <Container header={<Header variant="h2">{selectedRow.bucket} policy</Header>}>
          {selectedRow.policy ? (
            <CodeView content={JSON.stringify(selectedRow.policy, null, 2)} lineNumbers wrapLines />
          ) : (
            <Box variant="p" color="text-body-secondary">
              {selectedRow.policyError ??
                "This bucket has no bucket policy attached, so access is governed by ACLs and IAM only."}
            </Box>
          )}
        </Container>
      )}
    </SpaceBetween>
  );
}
