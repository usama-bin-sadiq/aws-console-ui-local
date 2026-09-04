"use client";

/**
 * S3 Buckets — Card-based layout matching original AWS Console (3 cards per row)
 * PRD §9.2.2, §15.2 — AWS design: cards, not tables
 */

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Cards from "@cloudscape-design/components/cards";
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
            <Cards
              cardDefinition={{
                header: (item: S3BucketItem) => (
                  <Header variant="h3">
                    <a
                      href={`/s3/${encodeURIComponent(item.Name)}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                      aria-label={`Open bucket ${item.Name}`}
                    >
                      {item.Name}
                    </a>
                  </Header>
                ),
                sections: [
                  {
                    id: "region",
                    header: "Region",
                    content: (item: S3BucketItem) => item.Region || "us-east-1",
                  },
                  {
                    id: "date",
                    header: "Created",
                    content: (item: S3BucketItem) => item.CreationDate || "—",
                  },
                ],
              }}
              items={buckets}
              selectionType="multi"
              visibleSections={["region", "date"]}
              ariaLabels={{
                selectionGroupLabel: "Selected buckets",
                itemSelectionLabel: (_selection, item) => `Select ${item.Name || "bucket"}`,
              }}
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
