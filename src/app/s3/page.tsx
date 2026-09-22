"use client";

/**
 * S3 Buckets — Card-based layout matching original AWS Console (3 cards per row)
 * PRD §9.2.2, §15.2 — AWS design: cards, not tables
 */

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import TextFilter from "@cloudscape-design/components/text-filter";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";
import { apiFetch } from "@/lib/api-client";

interface S3BucketItem {
  Name: string;
  Region?: string;
  CreationDate?: string;
}

export default function S3BucketsPage() {
  const router = useRouter();
  const [buckets, setBuckets] = useState<S3BucketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [emptyModal, setEmptyModal] = useState<string | null>(null);
  const [emptying, setEmptying] = useState(false);
  const [filteringText, setFilteringText] = useState("");
  const [selectedBuckets, setSelectedBuckets] = useState<S3BucketItem[]>([]);
  const [emptyBucketObjects, setEmptyBucketObjects] = useState<string[]>([]);
  const [emptyBucketLoading, setEmptyBucketLoading] = useState(false);

  const filteredBuckets = buckets.filter((b) =>
    b.Name.toLowerCase().includes(filteringText.toLowerCase())
  );

  const fetchBuckets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/s3");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const list = (data.buckets || []).map((b: any) => ({
        Name: b.Name || b.name || "—",
        Region: b.Region || b.region || "us-east-1",
        CreationDate: b.CreationDate ? new Date(b.CreationDate).toLocaleDateString() : (b.creationDate ? new Date(b.creationDate).toLocaleDateString() : "—"),
      }));
      setBuckets(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load buckets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  const deleteBucket = useCallback(async (name: string) => {
    try {
      await apiFetch(`/api/s3?bucket=${encodeURIComponent(name)}`, { method: "DELETE" });
      setDeleteModal(null);
      fetchBuckets();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete bucket");
    }
  }, [fetchBuckets]);

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

  const confirmEmptyBucket = useCallback(async (name: string) => {
    setEmptying(true);
    setError(null);
    try {
      for (const key of emptyBucketObjects) {
        await apiFetch(`/api/s3?bucket=${encodeURIComponent(name)}&key=${encodeURIComponent(key)}`, { method: "DELETE" });
      }
      setEmptyModal(null);
      setEmptyBucketObjects([]);
      fetchBuckets();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to empty bucket");
    } finally {
      setEmptying(false);
    }
  }, [emptyBucketObjects, fetchBuckets]);

  return (
    <ServiceLayout
      serviceName="S3"
      serviceCategory="Storage"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Storage", href: "/" },
        { text: "S3", href: "/s3" },
      ]}
      headerActions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={() => router.push("/s3/create")} variant="primary" ariaLabel="Create S3 bucket">
            Create bucket
          </Button>
          <Button onClick={fetchBuckets} iconName="refresh" ariaLabel="Refresh buckets" />
        </SpaceBetween>
      }
    >
      <SpaceBetween size="l" direction="vertical">
        <Header variant="h1" counter={`(${buckets.length})`}>
          Amazon S3 — Buckets
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

          {loading ? (
            <Box textAlign="center" padding="xxl">Loading buckets...</Box>
          ) : buckets.length === 0 ? (
            <Box textAlign="center" padding="xxl">
              <Box variant="h2">No buckets found</Box>
              <Box variant="p" padding={{ top: "m" }}>
                Get started by creating your first bucket.
              </Box>
              <Button variant="primary" onClick={() => router.push("/s3/create")}>
                Create bucket
              </Button>
            </Box>
          ) : (
            <Table
              items={filteredBuckets}
              selectionType="multi"
              trackBy="Name"
              selectedItems={selectedBuckets}
              onSelectionChange={(e) => setSelectedBuckets(e.detail.selectedItems)}
              filter={
                <TextFilter
                  filteringText={filteringText}
                  filteringPlaceholder="Filter buckets by name"
                  filteringAriaLabel="Filter buckets"
                  onChange={(e) => setFilteringText(e.detail.filteringText)}
                />
              }
              header={
                <Header
                  variant="h2"
                  counter={`(${filteredBuckets.length})`}
                  actions={
                    selectedBuckets.length === 1 ? (
                      <ButtonDropdown
                        items={[
                          { text: "Empty bucket", id: "empty" },
                          { text: "Delete bucket", id: "delete" },
                        ]}
                        onItemClick={(e) => {
                          const name = selectedBuckets[0].Name;
                          if (e.detail.id === "empty") setEmptyModal(name);
                          else if (e.detail.id === "delete") setDeleteModal(name);
                        }}
                      >
                        Bucket actions
                      </ButtonDropdown>
                    ) : selectedBuckets.length > 1 ? (
                      <Button
                        onClick={() => {
                          selectedBuckets.forEach((b) => deleteBucket(b.Name));
                        }}
                      >
                        Delete selected
                      </Button>
                    ) : null
                  }
                >
                  Buckets
                </Header>
              }
              columnDefinitions={[
                {
                  id: "name",
                  header: "Bucket name",
                  cell: (item) => (
                    <a href={`/s3/${encodeURIComponent(item.Name)}`} aria-label={`Open bucket ${item.Name}`}>
                      {item.Name}
                    </a>
                  ),
                  sortingField: "Name",
                },
                { id: "region", header: "Region", cell: (item) => item.Region || "us-east-1", sortingField: "Region" },
                { id: "created", header: "Creation date", cell: (item) => item.CreationDate || "—", sortingField: "CreationDate" },
              ]}
              ariaLabels={{
                selectionGroupLabel: "Selected buckets",
                itemSelectionLabel: (_selection, item) => `Select ${item.Name || "bucket"}`,
              }}
              empty={<Box textAlign="center" padding="l">No buckets found.</Box>}
            />
          )}
      </SpaceBetween>

      <CrossServiceLinks links={CROSS_SERVICE_LINKS["/s3"] || []} />

      <Modal
        visible={deleteModal !== null}
        onDismiss={() => setDeleteModal(null)}
        header="Delete bucket"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setDeleteModal(null)} formAction="none">Cancel</Button>
            <Button variant="primary" onClick={() => deleteBucket(deleteModal!)}>
              Confirm delete
            </Button>
          </SpaceBetween>
        }
      >
        <Box>
          <Alert type="warning">
            Deleting bucket <Box variant="strong">{deleteModal}</Box> will permanently remove it and all its objects.
          </Alert>
        </Box>
      </Modal>

      <Modal
        visible={emptyModal !== null}
        onDismiss={() => { setEmptyModal(null); setEmptyBucketObjects([]); }}
        header="Empty bucket"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => { setEmptyModal(null); setEmptyBucketObjects([]); }} formAction="none" disabled={emptying || emptyBucketLoading}>Cancel</Button>
            <Button variant="primary" onClick={() => confirmEmptyBucket(emptyModal!)} loading={emptying} disabled={emptyBucketLoading}>
              Empty bucket
            </Button>
          </SpaceBetween>
        }
      >
        <Box>
          <Alert type="warning">
            This will delete all objects in bucket <Box variant="strong">{emptyModal}</Box>. This action cannot be undone.
          </Alert>
          {emptyBucketLoading ? (
            <Box textAlign="center" padding="m">Loading objects...</Box>
          ) : emptyBucketObjects.length > 0 ? (
            <div style={{ maxHeight: "300px", overflow: "auto", marginTop: "16px" }}>
              <div style={{ marginBottom: "8px" }}>
                <Box variant="small" color="text-label">
                  Objects to be deleted ({emptyBucketObjects.length}):
                </Box>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {emptyBucketObjects.slice(0, 100).map((key, idx) => (
                  <li key={idx} style={{ padding: '4px 0', fontFamily: 'monospace', fontSize: '12px' }}>
                    {key}
                  </li>
                ))}
                {emptyBucketObjects.length > 100 && (
                  <li style={{ padding: '4px 0', fontSize: '12px', color: '#666' }}>
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
    </ServiceLayout>
  );
}
