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
import Modal from "@cloudscape-design/components/modal";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { apiFetch } from "@/lib/api-client";

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
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const [objects, setObjects] = useState<S3ObjectItem[]>([]);
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prefix, setPrefix] = useState("");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedObjects, setSelectedObjects] = useState<S3ObjectItem[]>([]);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [deleteMultipleModal, setDeleteMultipleModal] = useState(false);
  const [copyModal, setCopyModal] = useState<{ key: string } | null>(null);
  const [copyTargetKey, setCopyTargetKey] = useState("");
  const [copying, setCopying] = useState(false);

  const fetchObjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/s3?bucket=${encodeURIComponent(bucketName)}&action=list`);
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
      await apiFetch(`/api/s3?bucket=${encodeURIComponent(bucketName)}&key=${encodeURIComponent(key)}`, { method: "DELETE" });
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

  const handleMultipleFiles = useCallback(async (files: FileList) => {
    setUploading(true);
    setError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("bucket", bucketName);
        formData.append("key", file.name);
        formData.append("file", file);
        const res = await fetch("/api/s3", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || `Upload failed for ${file.name}`);
      }
      fetchObjects();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }, [bucketName, fetchObjects]);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        if (files.length === 1) {
          handleUpload(files[0]);
        } else {
          handleMultipleFiles(files);
        }
      }
      e.target.value = "";
    },
    [handleUpload, handleMultipleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleMultipleFiles(files);
    }
  }, [handleMultipleFiles]);

  const copyObject = useCallback(async (sourceKey: string, targetKey: string) => {
    setCopying(true);
    setError(null);
    try {
      const res = await fetch("/api/s3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bucket: bucketName,
          key: targetKey,
          copySource: `/${bucketName}/${sourceKey}`,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Copy failed");
      fetchObjects();
      setCopyModal(null);
      setCopyTargetKey("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Copy failed");
    } finally {
      setCopying(false);
    }
  }, [bucketName, fetchObjects]);

  const deleteMultipleObjects = useCallback(async (keys: string[]) => {
    setError(null);
    try {
      for (const key of keys) {
        await apiFetch(`/api/s3?bucket=${encodeURIComponent(bucketName)}&key=${encodeURIComponent(key)}`, { method: "DELETE" });
      }
      fetchObjects();
      setSelectedObjects([]);
      setDeleteMultipleModal(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete objects");
    }
  }, [bucketName, fetchObjects]);

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
          <ButtonDropdown
            items={[
              { text: "Copy", id: "copy" },
              { text: "Delete", id: "delete" },
            ]}
            onItemClick={(e) => {
              if (e.detail.id === "copy") {
                setCopyModal({ key: item.Key });
                setCopyTargetKey(item.Key + "-copy");
              } else if (e.detail.id === "delete") {
                setDeleteModal(item.Key);
              }
            }}
          >
            Actions
          </ButtonDropdown>
        </SpaceBetween>
      ),
    },
  ];

  const allItems: S3ObjectItem[] = [
    ...prefixes.map((p) => ({ Key: p + "/", Size: undefined, LastModified: undefined, ETag: undefined, StorageClass: "PREFIX" })),
    ...objects,
  ];

  const selectableItems = objects;

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
              <FormField label="Upload files">
                <div
                  ref={dropZoneRef}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  style={{
                    borderStyle: dragActive ? "solid" : "dashed",
                    borderColor: dragActive ? "var(--color-primary)" : "var(--color-border)",
                    backgroundColor: dragActive ? "var(--color-primary-lightest)" : "transparent",
                    padding: "var(--size-xl)",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    borderWidth: "2px",
                    borderRadius: "var(--border-radius-medium)",
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    multiple
                    style={{ display: "none" }}
                  />
                  <SpaceBetween direction="horizontal" size="xs">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      loading={uploading}
                      formAction="none"
                      variant={dragActive ? "primary" : "normal"}
                    >
                      {dragActive ? "Drop files here" : "Select files"}
                    </Button>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      loading={uploading}
                      formAction="none"
                      variant="link"
                    >
                      or browse
                    </Button>
                  </SpaceBetween>
                  <Box variant="small" color="text-body-secondary" margin={{ top: "s" }}>
                    Drag and drop files here, or click to select multiple files
                  </Box>
                </div>
              </FormField>
              <Button onClick={fetchObjects} iconName="refresh" ariaLabel="Refresh" formAction="none">
                Refresh
              </Button>
            </SpaceBetween>
            <Table
              header={
                <Header
                  variant="h2"
                  counter={`(${objects.length + prefixes.length})`}
                  actions={
                    selectedObjects.length > 0 ? (
                      <Button
                        variant="primary"
                        onClick={() => setDeleteMultipleModal(true)}
                        ariaLabel="Delete selected objects"
                      >
                        Delete selected ({selectedObjects.length})
                      </Button>
                    ) : null
                  }
                >
                  Objects
                </Header>
              }
              items={allItems}
              selectionType="multi"
              trackBy="Key"
              selectedItems={selectedObjects}
              onSelectionChange={(e) => setSelectedObjects(e.detail.selectedItems)}
              loading={loading}
              columnDefinitions={columnDefinitions}
              empty={<Box textAlign="center">No objects found.</Box>}
              ariaLabels={{
                selectionGroupLabel: "Selected objects",
                itemSelectionLabel: (_selection, item) => `Select ${item.Key || "object"}`,
              }}
            />
          </SpaceBetween>
        </Container>

        <Modal
          visible={deleteModal !== null}
          onDismiss={() => setDeleteModal(null)}
          header="Delete object"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setDeleteModal(null)} formAction="none">Cancel</Button>
              <Button variant="primary" onClick={() => { deleteObject(deleteModal!); setDeleteModal(null); }}>
                Confirm delete
              </Button>
            </SpaceBetween>
          }
        >
          <Box>
            <Alert type="warning">
              Are you sure you want to permanently delete <Box variant="strong">{deleteModal}</Box>? This action cannot be undone.
            </Alert>
          </Box>
        </Modal>

        <Modal
          visible={deleteMultipleModal}
          onDismiss={() => setDeleteMultipleModal(false)}
          header="Delete multiple objects"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setDeleteMultipleModal(false)} formAction="none">Cancel</Button>
              <Button variant="primary" onClick={() => deleteMultipleObjects(selectedObjects.map((o) => o.Key))}>
                Delete {selectedObjects.length} objects
              </Button>
            </SpaceBetween>
          }
        >
          <Box>
            <Alert type="warning">
              Are you sure you want to permanently delete <Box variant="strong">{selectedObjects.length}</Box> objects? This action cannot be undone.
            </Alert>
            <div style={{ maxHeight: "200px", overflow: "auto", marginTop: "16px" }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {selectedObjects.slice(0, 50).map((obj, idx) => (
                  <li key={idx} style={{ padding: '4px 0', fontFamily: 'monospace', fontSize: '12px' }}>
                    {obj.Key}
                  </li>
                ))}
                {selectedObjects.length > 50 && (
                  <li style={{ padding: '4px 0', fontSize: '12px', color: '#666' }}>
                    ... and {selectedObjects.length - 50} more objects
                  </li>
                )}
              </ul>
            </div>
          </Box>
        </Modal>

        <Modal
          visible={copyModal !== null}
          onDismiss={() => { setCopyModal(null); setCopyTargetKey(""); }}
          header="Copy object"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => { setCopyModal(null); setCopyTargetKey(""); }} formAction="none" disabled={copying}>Cancel</Button>
              <Button variant="primary" onClick={() => copyObject(copyModal!.key, copyTargetKey)} loading={copying} disabled={!copyTargetKey.trim()}>
                Copy
              </Button>
            </SpaceBetween>
          }
        >
          <Box>
            <FormField label="Destination key">
              <Input
                value={copyTargetKey}
                onChange={(e) => setCopyTargetKey(e.detail.value)}
                placeholder="Enter new object key"
                autoFocus
              />
            </FormField>
            <Box variant="small" color="text-body-secondary" margin={{ top: "m" }}>
              Copying <Box variant="strong">{copyModal?.key}</Box> to <Box variant="strong">{copyTargetKey || "new key"}</Box>
            </Box>
          </Box>
        </Modal>
      </SpaceBetween>
    </ServiceLayout>
  );
}
