"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Box from "@cloudscape-design/components/box";
import SpaceBetween from "@cloudscape-design/components/space-between";
import type { TableProps } from "@cloudscape-design/components/table";
import { ResourceTable, type ActionDefinition } from "@/features/resource-table";
import { CopyableText } from "@/components/ui/CopyableText";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";
import { apiFetch } from "@/lib/api-client";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

// ── Types ──────────────────────────────────────────────────────────────────

interface S3BucketItem {
  Name: string;
  Region?: string;
  CreationDate?: string;
}

// Normalize list payloads: a bare array or a wrapper object with an array under
// a known key. Anything else (including `{ buckets: undefined }`) renders [].
function toArray<T = Record<string, unknown>>(d: unknown): T[] {
  if (Array.isArray(d)) return d as T[];
  if (d && typeof d === "object") {
    const o = d as Record<string, unknown>;
    for (const k of ["buckets", "items", "data", "results"]) {
      if (Array.isArray(o[k])) return o[k] as T[];
    }
  }
  return [];
}

// ── Table Configuration ────────────────────────────────────────────────────

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Record<string, unknown>>[] = [
  {
    id: "name",
    header: "Bucket name",
    cell: (item) => (
      <a
        href={`/s3/${encodeURIComponent(String(item.Name))}`}
        aria-label={`Open bucket ${item.Name}`}
      >
        <CopyableText value={String(item.Name)} truncate={false} />
      </a>
    ),
    sortingField: "Name",
    isRowHeader: true,
  },
  {
    id: "region",
    header: "Region",
    cell: (item) => {
      const region = String(item.Region || "us-east-1");
      return <CopyableText value={region} truncate={false} />;
    },
    sortingField: "Region",
  },
  {
    id: "created",
    header: "Creation date",
    cell: (item) => String(item.CreationDate || "—"),
    sortingField: "CreationDate",
  },
];

const DEFAULT_VISIBLE_COLUMNS = ["name", "region", "created"];

// ── Page Component ─────────────────────────────────────────────────────────

export default function S3BucketsPage() {
  const [buckets, setBuckets] = useState<S3BucketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<S3BucketItem[]>([]);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [emptyModal, setEmptyModal] = useState<string | null>(null);
  const [emptying, setEmptying] = useState(false);
  const [emptyBucketObjects, setEmptyBucketObjects] = useState<string[]>([]);
  const [emptyBucketLoading, setEmptyBucketLoading] = useState(false);
  const router = useRouter();

  // ── Data Fetching ───────────────────────────────────────────────────────

  const fetchBuckets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/s3");
      const data = await res.json().catch(() => null);
      if (data === null) throw new Error(`Invalid response (HTTP ${res.status})`);
      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }
      const list = toArray(data).map((b: any) => ({
        Name: b.Name || b.name || "—",
        Region: b.Region || b.region || "us-east-1",
        CreationDate: b.CreationDate
          ? new Date(b.CreationDate).toLocaleDateString()
          : b.creationDate
            ? new Date(b.creationDate).toLocaleDateString()
            : "—",
      }));
      setBuckets(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load buckets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchBuckets();
    });
  }, [fetchBuckets]);

  // ── Bucket Actions ──────────────────────────────────────────────────────

  const deleteBucket = useCallback(
    async (name: string) => {
      try {
        await apiFetch(`/api/s3?bucket=${encodeURIComponent(name)}`, { method: "DELETE" });
        setDeleteModal(null);
        fetchBuckets();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to delete bucket");
      }
    },
    [fetchBuckets],
  );

  const emptyBucket = useCallback(async (name: string) => {
    setEmptyBucketLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/s3?bucket=${encodeURIComponent(name)}&action=list`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const objects = data.objects || [];
      const prefixes = data.prefixes || [];
      const allKeys = [
        ...objects.map((o: any) => o.Key || o.key),
        ...prefixes.map((p: any) => (p.Prefix || p.prefix || "").replace(/\/$/, "")),
      ];
      if (allKeys.length === 0) {
        setEmptyModal(name);
        setEmptyBucketObjects([]);
        setEmptyBucketLoading(false);
        return;
      }
      setEmptyBucketObjects(allKeys);
      setEmptyModal(name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load bucket objects");
    } finally {
      setEmptyBucketLoading(false);
    }
  }, []);

  const confirmEmptyBucket = useCallback(
    async (name: string) => {
      setEmptying(true);
      setError(null);
      try {
        for (const key of emptyBucketObjects) {
          await apiFetch(
            `/api/s3?bucket=${encodeURIComponent(name)}&key=${encodeURIComponent(key)}`,
            { method: "DELETE" },
          );
        }
        setEmptyModal(null);
        setEmptyBucketObjects([]);
        fetchBuckets();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to empty bucket");
      } finally {
        setEmptying(false);
      }
    },
    [emptyBucketObjects, fetchBuckets],
  );

  // ── Action Definitions ──────────────────────────────────────────────────

  const handleEmpty = useCallback(() => {
    if (selectedItems.length === 1) {
      emptyBucket(selectedItems[0].Name);
    }
  }, [selectedItems, emptyBucket]);

  const handleDelete = useCallback(() => {
    if (selectedItems.length === 1) {
      setDeleteModal(selectedItems[0].Name);
    } else if (selectedItems.length > 1) {
      selectedItems.forEach((b) => deleteBucket(b.Name));
    }
  }, [selectedItems, deleteBucket]);

  const actions: ActionDefinition<Record<string, unknown>>[] = [
    {
      id: "empty",
      label: "Empty bucket",
      disabled: (items: Record<string, unknown>[]) => items.length !== 1,
      onClick: handleEmpty,
    },
    {
      id: "delete",
      label: "Delete bucket",
      onClick: handleDelete,
    },
  ];

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="aws-service-page">
      <AwsServiceHeader
        serviceName="Amazon S3"
        serviceIcon={SERVICE_ICONS["/s3"]?.small}
        counter={buckets.length}
        primaryAction={
          <button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/s3/create")}
          >
            Create bucket
          </button>
        }
      />

      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <ResourceTable
        config={{
          serviceKey: "s3",
          resourceName: "Buckets",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: DEFAULT_VISIBLE_COLUMNS,
          trackBy: "Name",
          createLabel: "Create bucket",
          createHref: "/s3/create",
          filterPlaceholder: "Filter buckets",
        }}
        items={buckets as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as S3BucketItem[])}
        onRefresh={fetchBuckets}
        actions={actions}
      />

      <CrossServiceLinks links={CROSS_SERVICE_LINKS["/s3"] || []} />

      {/* Delete Modal */}
      <Modal
        visible={deleteModal !== null}
        onDismiss={() => setDeleteModal(null)}
        header="Delete bucket"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setDeleteModal(null)} formAction="none">
              Cancel
            </Button>
            <Button variant="primary" onClick={() => deleteBucket(deleteModal!)}>
              Confirm delete
            </Button>
          </SpaceBetween>
        }
      >
        <Box>
          <Alert type="warning">
            Deleting bucket <Box variant="strong">{deleteModal}</Box> will permanently remove it and
            all its objects.
          </Alert>
        </Box>
      </Modal>

      {/* Empty Modal */}
      <Modal
        visible={emptyModal !== null}
        onDismiss={() => {
          setEmptyModal(null);
          setEmptyBucketObjects([]);
        }}
        header="Empty bucket"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              onClick={() => {
                setEmptyModal(null);
                setEmptyBucketObjects([]);
              }}
              formAction="none"
              disabled={emptying || emptyBucketLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => confirmEmptyBucket(emptyModal!)}
              loading={emptying}
              disabled={emptyBucketLoading}
            >
              Empty bucket
            </Button>
          </SpaceBetween>
        }
      >
        <Box>
          <Alert type="warning">
            This will delete all objects in bucket <Box variant="strong">{emptyModal}</Box>. This
            action cannot be undone.
          </Alert>
          {emptyBucketLoading ? (
            <Box textAlign="center" padding="m">
              Loading objects...
            </Box>
          ) : emptyBucketObjects.length > 0 ? (
            <div style={{ maxHeight: "300px", overflow: "auto", marginTop: "16px" }}>
              <div style={{ marginBottom: "8px" }}>
                <Box variant="small" color="text-label">
                  Objects to be deleted ({emptyBucketObjects.length}):
                </Box>
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {emptyBucketObjects.slice(0, 100).map((key, idx) => (
                  <li
                    key={idx}
                    style={{ padding: "4px 0", fontFamily: "monospace", fontSize: "12px" }}
                  >
                    <CopyableText value={key} truncate={false} />
                  </li>
                ))}
                {emptyBucketObjects.length > 100 && (
                  <li style={{ padding: "4px 0", fontSize: "12px", color: "#666" }}>
                    ... and {emptyBucketObjects.length - 100} more objects
                  </li>
                )}
              </ul>
            </div>
          ) : (
            <Box textAlign="center" padding="m" color="text-body-secondary">
              This bucket is already empty.
            </Box>
          )}
        </Box>
      </Modal>
    </div>
  );
}
