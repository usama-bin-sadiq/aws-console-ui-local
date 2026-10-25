"use client";

import React, { useEffect, useState } from "react";
import Table from "@cloudscape-design/components/table";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface TaggedResource {
  ResourceARN: string;
  Tags?: { Key: string; Value: string }[];
}

export default function ResourceGroupsTaggingPage() {
  const [resources, setResources] = useState<TaggedResource[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/resource-groups-tagging")
      .then((r) => r.json())
      .then((data) => {
        setResources(data.resources || []);
        if (data.message) setMessage(data.message);
      })
      .catch((err) => setMessage(err instanceof Error ? err.message : "Unknown error"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Resource Groups Tagging"
          serviceIcon={SERVICE_ICONS["/resource-groups-tagging"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/resource-groups-tagging/create")}>
            Create tag
        </button>

        />

        {message && (
          <Alert type="info" header="Notice">
            {message}
          </Alert>
        )}

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
      </SpaceBetween>
    </div>
  );
}
