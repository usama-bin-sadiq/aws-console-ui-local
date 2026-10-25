"use client";
import React, { useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Header from "@cloudscape-design/components/header";
import { useRouter } from 'next/navigation';
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

interface CloudControlResource {
  Identifier: string;
  Properties?: string;
}

export default function CloudControlPage() {
  const [typeName, setTypeName] = useState("AWS::S3::Bucket");

  const router = useRouter();  const [resources, setResources] = useState<CloudControlResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cloudcontrol?typeName=${encodeURIComponent(typeName)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResources(data.resources || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Cloud Control API"
          serviceIcon={SERVICE_ICONS["/cloudcontrol"]?.small}
          counter={0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/cloudcontrol/create")}>
            Create resource
        </button>

        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Container header={<Header variant="h2">Resource type selector</Header>}>
          <SpaceBetween size="m">
            <FormField label="Resource type name">
              <Input
                value={typeName}
                onChange={(e) => setTypeName(e.detail.value)}
                placeholder="AWS::S3::Bucket"
              />
            </FormField>
            <Button variant="primary" onClick={listResources} loading={loading}>
              List resources
            </Button>
          </SpaceBetween>
        </Container>

        <Table
          header={<Header variant="h2">Resources ({resources.length})</Header>}
          items={resources}
          loading={loading}
          columnDefinitions={[
            { header: "Identifier", cell: (item) => item.Identifier },
            {
              header: "Properties",
              cell: (item) =>
                item.Properties ? (
                  <Box variant="code">
                    {item.Properties.slice(0, 120)}
                    {item.Properties.length > 120 ? "…" : ""}
                  </Box>
                ) : (
                  "—"
                ),
            },
          ]}
          empty={
            <Box textAlign="center">
              Enter a resource type and click &quot;List resources&quot; to browse resources.
            </Box>
          }
        />
      </SpaceBetween>
    </div>
  );
}
