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
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";

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

  const fetchBuckets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/s3");
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
      await fetch(`/api/s3?bucket=${encodeURIComponent(name)}`, { method: "DELETE" });
      setDeleteModal(null);
      fetchBuckets();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete bucket");
    }
  }, [fetchBuckets]);

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

        <Container>
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
              items={buckets}
              selectionType="multi"
              trackBy="Name"
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
        </Container>
      </SpaceBetween>

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
    </ServiceLayout>
  );
}
