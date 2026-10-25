"use client";
import { apiFetch } from "@/lib/api-client";
import { useState } from "react";
import Table from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Alert from "@cloudscape-design/components/alert";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Header from "@cloudscape-design/components/header";
import { useRouter } from "next/navigation";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface S3Object {
  Key: string;
  Size?: number;
  LastModified?: string;
}

interface S3Prefix {
  Prefix: string;
}

interface S3Item {
  Key: string;
  Size?: number;
  LastModified?: string;
  isPrefix: boolean;
}

export default function S3FilesPage() {
  const [bucketInput, setBucketInput] = useState("");

  const router = useRouter();
  const [bucket, setBucket] = useState<string | null>(null);
  const [prefix, setPrefix] = useState("");
  const [objects, setObjects] = useState<S3Object[]>([]);
  const [prefixes, setPrefixes] = useState<S3Prefix[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listObjects = async (b: string, p: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/api/s3-files?bucket=${encodeURIComponent(b)}&prefix=${encodeURIComponent(p)}`,
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setObjects(data.objects || []);
      setPrefixes(data.prefixes || []);
      setBucket(b);
      setPrefix(p);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const deleteObject = async (key: string) => {
    if (!bucket) return;
    await apiFetch(
      `/api/s3-files?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`,
      { method: "DELETE" },
    );
    listObjects(bucket, prefix);
  };

  const items: S3Item[] = [
    ...prefixes.map((p) => ({
      Key: p.Prefix,
      Size: undefined,
      LastModified: undefined,
      isPrefix: true,
    })),
    ...objects.map((o) => ({ ...o, isPrefix: false })),
  ];

  return (
    <div style={{ padding: 0 }}>
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="S3 — Object Browser"
          serviceIcon={SERVICE_ICONS["/s3-files"]?.small}
          counter={0}
          primaryAction=<button
            type="button"
            className="aws-service-page__create"
            onClick={() => router.push("/s3-files/create")}
          >
            Create file
          </button>
        />
        {error && (
          <Alert type="error" header="Error">
            {error}
          </Alert>
        )}
        <Container>
          <SpaceBetween size="s">
            <FormField label="Bucket name">
              <SpaceBetween direction="horizontal" size="xs">
                <Input
                  value={bucketInput}
                  onChange={(e) => setBucketInput(e.detail.value)}
                  placeholder="my-bucket"
                />
                <Button onClick={() => listObjects(bucketInput, "")} loading={loading}>
                  Browse
                </Button>
              </SpaceBetween>
            </FormField>
          </SpaceBetween>
        </Container>
        {bucket && (
          <Table
            header={
              <Header variant="h2">
                Objects in {bucket}/{prefix} ({objects.length + prefixes.length})
              </Header>
            }
            items={items}
            loading={loading}
            columnDefinitions={[
              {
                header: "Key",
                cell: (i) => (i.isPrefix ? `📁 ${i.Key}` : i.Key),
              },
              {
                header: "Size",
                cell: (i) => (i.Size != null ? i.Size.toLocaleString() + " B" : "—"),
              },
              {
                header: "Last modified",
                cell: (i) => (i.LastModified ? new Date(i.LastModified).toLocaleDateString() : "—"),
              },
              {
                header: "Actions",
                cell: (i) =>
                  !i.isPrefix ? (
                    <Button onClick={() => deleteObject(i.Key)} formAction="none">
                      Delete
                    </Button>
                  ) : null,
              },
            ]}
            empty={<Box textAlign="center">No objects found.</Box>}
          />
        )}
      </SpaceBetween>
    </div>
  );
}
