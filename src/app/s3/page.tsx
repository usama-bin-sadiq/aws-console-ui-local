"use client";

import React, { useEffect, useState, useCallback } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import Modal from "@cloudscape-design/components/modal";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import FormField from "@cloudscape-design/components/form-field";
import Toggle from "@cloudscape-design/components/toggle";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Tabs from "@cloudscape-design/components/tabs";
import Badge from "@cloudscape-design/components/badge";
import Link from "@cloudscape-design/components/link";
import { S3Bucket, S3Object } from "@/types/aws";

export default function S3Page() {
  const [buckets, setBuckets] = useState<S3Bucket[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [newBucketName, setNewBucketName] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [versioning, setVersioning] = useState(false);
  const [encryption, setEncryption] = useState("AES256");
  const [publicAccess, setPublicAccess] = useState("Block all public access");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [searchBucketsValue, setSearchBucketsValue] = useState("");

  const fetchBuckets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/s3");
      const data = await res.json();
      setBuckets(data.buckets || []);
    } catch (error) {
      console.error("Failed to fetch buckets:", error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  const fetchObjects = useCallback(async (bucket: string) => {
    if (!bucket) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/s3?bucket=${encodeURIComponent(bucket)}`);
      const data = await res.json();
      setObjects(data.objects || []);
    } catch (error) {
      console.error("Failed to fetch objects:", error);
    }
    setLoading(false);
  }, []);

  const handleCreate = async () => {
    const formData = new FormData();
    formData.append("bucket", newBucketName);
    await fetch("/api/s3", { method: "POST", body: formData });
    setCreateOpen(false);
    setNewBucketName("");
    fetchBuckets();
  };

  const handleUpload = async () => {
    if (!uploadFile || !selectedBucket) return;
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("bucketName", selectedBucket);
    await fetch("/api/s3", { method: "POST", body: formData });
    setUploadOpen(false);
    setUploadFile(null);
    setUploadName("");
    fetchObjects(selectedBucket);
  };

  const handleDeleteBucket = async (name: string) => {
    await fetch(`/api/s3?bucket=${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    setSelectedBucket(null);
    fetchBuckets();
  };

  const handleDeleteObject = async (key: string) => {
    if (!selectedBucket) return;
    await fetch(
      `/api/s3?bucket=${encodeURIComponent(selectedBucket)}&key=${encodeURIComponent(key)}`,
      { method: "DELETE" }
    );
    fetchObjects(selectedBucket);
  };

  const filteredBuckets = buckets.filter((bucket) =>
    bucket.Name?.toLowerCase().includes(searchBucketsValue.toLowerCase())
  );

  return (
    <SpaceBetween size="l">
      {/* Page header */}
      <Header
        variant="h1"
        description="Simple Storage Service"
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            Create bucket
          </Button>
        }
      >
        Amazon S3
      </Header>

      {/* Main buckets table */}
      <Container
        header={
          <Header
            variant="h2"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Input
                  placeholder="Search buckets"
                  value={searchBucketsValue}
                  onChange={(e) => setSearchBucketsValue(e.detail.value)}
                  type="search"
                />
              </SpaceBetween>
            }
          >
            Buckets ({filteredBuckets.length})
          </Header>
        }
      >
        <Table
          columnDefinitions={[
            {
              header: "Name",
              cell: (item) => (
                <Link
                  href="#"
                  onClick={() => {
                    setSelectedBucket(item.Name ?? null);
                    fetchObjects(item.Name ?? "");
                  }}
                >
                  {item.Name}
                </Link>
              ),
            },
            { header: "Access", cell: () => "Bucket and objects not public" },
            { header: "Region", cell: () => region },
            {
              header: "Versioning",
              cell: () => <StatusIndicator type="info">Disabled</StatusIndicator>,
            },
            { header: "Created", cell: (item: any) => item.CreationDate || "—" },
            {
              header: "Actions",
              cell: (item: any) => (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    onClick={() => {
                      setSelectedBucket(item.Name ?? null);
                      setUploadOpen(true);
                    }}
                    formAction="none"
                  >
                    Upload
                  </Button>
                  <Button
                    onClick={() => handleDeleteBucket(item.Name!)}
                    formAction="none"
                    variant="normal"
                  >
                    Delete
                  </Button>
                </SpaceBetween>
              ),
            },
          ]}
          items={filteredBuckets}
          loading={loading}
          empty={
            <Box textAlign="center" padding="m">
              No buckets found. Create a bucket to get started.
            </Box>
          }
        />
      </Container>

      {/* Selected bucket objects panel */}
      {selectedBucket && (
        <Container
          header={<Header variant="h2">Bucket objects — {selectedBucket}</Header>}
        >
          <Tabs
            tabs={[
              {
                label: "Objects",
                id: "objects",
                content: (
                  <Table
                    columnDefinitions={[
                      { header: "Name", cell: (item: S3Object) => item.Key },
                      { header: "Type", cell: () => "Standard" },
                      {
                        header: "Size",
                        cell: (item: S3Object) =>
                          item.Size ? `${item.Size} bytes` : "—",
                      },
                      { header: "Last modified", cell: (item: S3Object) => item.LastModified },
                      {
                        header: "Actions",
                        cell: (item: S3Object) => (
                          <SpaceBetween direction="horizontal" size="xs">
                            <Button variant="normal" formAction="none">
                              Download
                            </Button>
                            <Button
                              onClick={() => handleDeleteObject(item.Key!)}
                              formAction="none"
                            >
                              Delete
                            </Button>
                          </SpaceBetween>
                        ),
                      },
                    ]}
                    items={objects}
                    loading={loading}
                    empty={<Box padding="m">No objects in this bucket.</Box>}
                  />
                ),
              },
              {
                label: "Properties",
                id: "properties",
                content: (
                  <SpaceBetween size="m">
                    <FormField label="Bucket name">
                      <Input value={selectedBucket} disabled />
                    </FormField>
                    <FormField label="Region">
                      <Input value={region} disabled />
                    </FormField>
                    <FormField label="Versioning">
                      <Toggle
                        checked={versioning}
                        onChange={() => setVersioning(!versioning)}
                      />{" "}
                      {versioning ? "Enabled" : "Disabled"}
                    </FormField>
                    <FormField label="Encryption">
                      <Select
                        selectedOption={{ value: encryption, label: encryption }}
                        options={[
                          { value: "AES256", label: "SSE-S3 (AES-256)" },
                          { value: "aws:kms", label: "SSE-KMS" },
                        ]}
                        onChange={(e) =>
                          setEncryption(e.detail.selectedOption.value || "AES256")
                        }
                      />
                    </FormField>
                  </SpaceBetween>
                ),
              },
              {
                label: "Permissions",
                id: "permissions",
                content: (
                  <Box>
                    Public access is{" "}
                    {publicAccess === "Block all public access" ? "blocked" : "allowed"}.
                  </Box>
                ),
              },
              {
                label: "Management",
                id: "management",
                content: (
                  <Box>
                    Lifecycle rules, replication, and event notifications coming soon.
                  </Box>
                ),
              },
            ]}
          />
        </Container>
      )}

      {/* Create bucket wizard */}
      <Modal
        visible={createOpen}
        onDismiss={() => setCreateOpen(false)}
        header="Create bucket"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setCreateOpen(false)} formAction="none">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Create bucket
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField
            label="Bucket name"
            description="Bucket names must be globally unique."
          >
            <Input
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.detail.value)}
              placeholder="my-bucket-name"
            />
          </FormField>
          <FormField label="AWS Region">
            <Select
              selectedOption={{ value: region, label: region }}
              options={[
                { value: "us-east-1", label: "US East (N. Virginia)" },
                { value: "us-west-2", label: "US West (Oregon)" },
                { value: "eu-west-1", label: "Europe (Ireland)" },
              ]}
              onChange={(e) => setRegion(e.detail.selectedOption.value || "us-east-1")}
            />
          </FormField>
          <FormField label="Versioning">
            <Toggle checked={versioning} onChange={() => setVersioning(!versioning)} />
          </FormField>
          <FormField label="Encryption">
            <Select
              selectedOption={{ value: encryption, label: encryption }}
              options={[
                {
                  value: "AES256",
                  label: "Server-side encryption with Amazon S3 managed keys (SSE-S3)",
                },
                {
                  value: "aws:kms",
                  label: "Server-side encryption with AWS KMS keys (SSE-KMS)",
                },
              ]}
              onChange={(e) => setEncryption(e.detail.selectedOption.value || "AES256")}
            />
          </FormField>
          <FormField label="Public access settings">
            <Select
              selectedOption={{ value: publicAccess, label: publicAccess }}
              options={[
                { value: "Block all public access", label: "Block all public access" },
                { value: "Allow public access", label: "Allow public access" },
              ]}
              onChange={(e) =>
                setPublicAccess(e.detail.selectedOption.value || "Block all public access")
              }
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* Upload modal */}
      <Modal
        visible={uploadOpen}
        onDismiss={() => setUploadOpen(false)}
        header={`Upload to ${selectedBucket}`}
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setUploadOpen(false)} formAction="none">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpload} disabled={!uploadFile}>
              Upload
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Select file">
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setUploadFile(file);
                  setUploadName(file.name);
                }
              }}
            />
          </FormField>
          {uploadName && (
            <Box>
              File: <strong>{uploadName}</strong>
            </Box>
          )}
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
}
