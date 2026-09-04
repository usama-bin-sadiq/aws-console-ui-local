"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";

interface Trail {
  Name: string;
  S3BucketName?: string;
  HomeRegion?: string;
  IsMultiRegionTrail?: boolean;
}

export default function CloudTrailPage() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createModal, setCreateModal] = useState(false);
  const [trailName, setTrailName] = useState("");
  const [s3BucketName, setS3BucketName] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchTrails = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/cloudtrail");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch trails");
      setTrails(data.trails || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trails");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrails();
  }, []);

  const createTrail = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/cloudtrail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trailName, s3BucketName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create trail");
      }
      setCreateModal(false);
      setTrailName("");
      setS3BucketName("");
      fetchTrails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create trail");
    } finally {
      setCreating(false);
    }
  };

  const deleteTrail = async (name: string) => {
    try {
      const res = await fetch(`/api/cloudtrail?name=${encodeURIComponent(name)}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete trail");
      }
      fetchTrails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete trail");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AWS CloudTrail</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            header={
              <Header
                variant="h2"
                actions={
                  <Button variant="primary" onClick={() => setCreateModal(true)}>
                    Create trail
                  </Button>
                }
              >
                Trails ({trails.length})
              </Header>
            }
            items={trails}
            columnDefinitions={[
              { header: "Name", cell: (item) => item.Name },
              { header: "S3 bucket", cell: (item) => item.S3BucketName || "—" },
              { header: "Home region", cell: (item) => item.HomeRegion || "—" },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deleteTrail(item.Name)} formAction="none">
                    Delete
                  </Button>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No trails found.</Box>}
          />
        </Container>

        <Modal
          visible={createModal}
          onDismiss={() => setCreateModal(false)}
          header="Create trail"
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={createTrail} loading={creating}>
                Create
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Trail name" constraintText="Required">
              <Input
                value={trailName}
                onChange={(e) => setTrailName(e.detail.value)}
                placeholder="my-trail"
              />
            </FormField>
            <FormField label="S3 bucket name">
              <Input
                value={s3BucketName}
                onChange={(e) => setS3BucketName(e.detail.value)}
                placeholder="cloudtrail-logs"
              />
            </FormField>
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
