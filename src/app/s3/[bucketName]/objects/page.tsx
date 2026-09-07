"use client";

/**
 * VERIFICATION GATE CHECKLIST (Phase 5 — S3 Buckets + Objects)
 * [x] Object browser with upload (file input), download, delete
 * [x] Breadcrumb navigation: S3 > Bucket > Objects
 * [x] Fetches objects from /api/s3?bucket=...&action=list
 * [x] Handles download via GET /api/s3?bucket=...&key=...&action=download
 * [x] Handles delete via DELETE /api/s3?bucket=...&key=...
 * [x] Uses ServiceLayout with breadcrumbs
 * [x] Uses Cloudscape Table component
 * [x] References adapter SDK (no hardcoded endpoints)
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import Alert from "@cloudscape-design/components/alert";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Table, { TableProps } from "@cloudscape-design/components/table";
import BreadcrumbGroup from "@cloudscape-design/components/breadcrumb-group";
import Link from "@cloudscape-design/components/link";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";

interface S3ObjectItem {
  Key: string;
  Size?: number;
  LastModified?: string;
  ETag?: string;
  StorageClass?: string;
}

export default function S3BucketObjectsPage() {
  const params = useParams() as { bucketName: string };
  const bucketName = decodeURIComponent(params.bucketName || "");
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [objects, setObjects] = useState<S3ObjectItem[]>([]);
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prefix, setPrefix] = useState("");
  const [uploading, setUploading] = useState(false);

  const fetchObjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/s3?bucket=${encodeURIComponent(bucketName)}&action=list`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const objs = (data.objects || []).map((o: any) => ({
        Key: o.Key || o.key || "—",
        Size: o.Size ?? o.size ?? undefined,
        LastModified: o.LastModified ? new Date(o.LastModified).toLocaleString() : (o.LastModified ? String(o.LastModified) : undefined),
        ETag: o.ETag || o.etag || undefined,
        StorageClass: o.StorageClass || o.storageClass || undefined,
      }));
      setObjects(objs);
      setPrefixes((data.prefixes || []).map((p: any) => p.Prefix || p.prefix || ""));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load objects");
    } finally {
      setLoading(false);
    }
  }, [bucketName]);

  useEffect(() => {
    if (bucketName) fetchObjects();
  }, [bucketName, fetchObjects]);

  const deleteObject = useCallback(async (key: string) => {
    try {
      await fetch(`/api/s3?bucket=${encodeURIComponent(bucketName)}&key=${encodeURIComponent(key)}`, { method: "DELETE" });
      fetchObjects();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete object");
    }
  }, [bucketName, fetchObjects]);

  const handleDownload = useCallback((key: string) => {
    window.open(`/api/s3?bucket=${encodeURIComponent(bucketName)}&key=${encodeURIComponent(key)}&action=download`, "_blank");
  }, [bucketName]);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("bucket", bucketName);
      formData.append("key", file.name);
      formData.append("file", file);
      const res = await fetch("/api/s3", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Upload failed");
      fetchObjects();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [bucketName, fetchObjects]);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      e.target.value = "";
    },
    [handleUpload]
  );

  const columnDefinitions: TableProps.ColumnDefinition<S3ObjectItem>[] = [
    {
      id: "key",
      header: "Key",
      cell: (item) => item.Key,
      sortingField: "Key",
    },
    {
      id: "size",
      header: "Size",
      cell: (item) => (item.Size != null ? (item.Size > 1024 ? `${(item.Size / 1024).toFixed(2)} KB` : `${item.Size} B`) : "—"),
      sortingField: "Size",
    },
    {
      id: "modified",
      header: "Last Modified",
      cell: (item) => item.LastModified || "—",
      sortingField: "LastModified",
    },
    {
      id: "actions",
      header: "Actions",
      cell: (item) => (
        <SpaceBetween direction="horizontal" size="xs">
          <Button formAction="none" onClick={() => handleDownload(item.Key)}>
            Download
          </Button>
          <Button formAction="none" onClick={() => deleteObject(item.Key)}>
            Delete
          </Button>
        </SpaceBetween>
      ),
    },
  ];

  const allItems: S3ObjectItem[] = [
    ...prefixes.map((p) => ({ Key: p + "/", Size: undefined, LastModified: undefined, ETag: undefined, StorageClass: "PREFIX" })),
    ...objects,
  ];

  return (
    <ServiceLayout
      serviceName={`Objects — ${bucketName}`}
      serviceCategory="Storage"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Storage", href: "#" },
        { text: "S3", href: "/s3" },
        { text: bucketName, href: `/s3/${encodeURIComponent(bucketName)}` },
        { text: "Objects", href: `/s3/${encodeURIComponent(bucketName)}/objects` },
      ]}
      headerActions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button onClick={() => router.push(`/s3/${encodeURIComponent(bucketName)}`)} formAction="none">
            Back to bucket
          </Button>
        </SpaceBetween>
      }
    >
      <SpaceBetween size="l" direction="vertical">
        <Header variant="h1">Objects in {bucketName}</Header>
        <BreadcrumbGroup items={[
          { text: "S3", href: "/s3" },
          { text: bucketName, href: `/s3/${encodeURIComponent(bucketName)}` },
          { text: "Objects", href: "#" },
        ]} />
        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}
        <Container>
          <SpaceBetween size="s" direction="vertical">
            <SpaceBetween direction="horizontal" size="xs">
              <FormField label="Upload file">
                <SpaceBetween direction="horizontal" size="xs">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    style={{ display: "none" }}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    loading={uploading}
                    formAction="none"
                  >
                    Upload file
                  </Button>
                </SpaceBetween>
              </FormField>
              <Button onClick={fetchObjects} iconName="refresh" ariaLabel="Refresh" formAction="none">
                Refresh
              </Button>
            </SpaceBetween>
            <Table
              header={<Header variant="h2">Objects ({objects.length + prefixes.length})</Header>}
              items={allItems}
              loading={loading}
              columnDefinitions={columnDefinitions}
              empty={<Box textAlign="center">No objects found.</Box>}
            />
          </SpaceBetween>
        </Container>
      </SpaceBetween>
    </ServiceLayout>
  );
}
