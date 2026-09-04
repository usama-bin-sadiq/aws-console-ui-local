"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";

interface Image {
  ImageId: string;
  Name?: string;
  State?: string;
  Architecture?: string;
  CreationDate?: string;
}

export default function AMIPage() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchImages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ami");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch AMIs");
      setImages(data.images || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch AMIs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const deregisterImage = async (imageId: string) => {
    try {
      const res = await fetch(`/api/ami?imageId=${encodeURIComponent(imageId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to deregister AMI");
      }
      fetchImages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deregister AMI");
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">AMIs (Amazon Machine Images)</Header>

        {error && (
          <Alert type="error" onDismiss={() => setError("")}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            header={
              <Header variant="h2">
                AMIs ({images.length})
              </Header>
            }
            items={images}
            columnDefinitions={[
              { header: "AMI ID", cell: (item) => item.ImageId },
              { header: "Name", cell: (item) => item.Name || "-" },
              { header: "State", cell: (item) => item.State || "-" },
              { header: "Architecture", cell: (item) => item.Architecture || "-" },
              {
                header: "Actions",
                cell: (item) => (
                  <Button onClick={() => deregisterImage(item.ImageId)} formAction="none">
                    Deregister
                  </Button>
                ),
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No AMIs found.</Box>}
          />
        </Container>
      </SpaceBetween>
    </div>
  );
}
