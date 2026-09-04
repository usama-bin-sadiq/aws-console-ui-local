"use client";

import React, { useEffect, useState } from "react";
import Header from "@cloudscape-design/components/header";
import Table from "@cloudscape-design/components/table";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";

interface TaggedResource {
  ResourceARN: string;
  Tags?: { Key: string; Value: string }[];
}

export default function ResourceGroupsTaggingPage() {
  const [resources, setResources] = useState<TaggedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/resource-groups-tagging")
      .then((r) => r.json())
      .then((data) => {
        setResources(data.resources || []);
        if (data.message) setMessage(data.message);
      })
      .catch((err) =>
        setMessage(err instanceof Error ? err.message : "Unknown error")
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1">Resource Groups Tagging</Header>

        {message && (
          <Alert type="info" header="Notice">
            {message}
          </Alert>
        )}

        <Container>
          <Table
            header={<Header variant="h2">Tagged Resources ({resources.length})</Header>}
            items={resources}
            columnDefinitions={[
              { header: "Resource ARN", cell: (item) => item.ResourceARN },
              {
                header: "Tags",
                cell: (item) =>
                  item.Tags && item.Tags.length > 0
                    ? `${item.Tags.length} tag${item.Tags.length !== 1 ? "s" : ""}`
                    : "No tags",
              },
            ]}
            loading={loading}
            empty={<Box textAlign="center">No tagged resources found.</Box>}
          />
        </Container>
      </SpaceBetween>
    </div>
  );
}
