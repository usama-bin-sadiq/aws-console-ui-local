"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Tabs from "@cloudscape-design/components/tabs";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Alert from "@cloudscape-design/components/alert";
import Spinner from "@cloudscape-design/components/spinner";
import Table, { TableProps } from "@cloudscape-design/components/table";
import TruncatedText from "@/components/TruncatedText";
import { KeyPair, KeyPairApiResponse } from "@/types/key-pair";
import { apiFetch } from "@/lib/api-client";
import DeleteKeyPairModal from "../DeleteKeyPairModal";

type TagPair = { Key?: string; Value?: string };

const FLASH_STORAGE_KEY = "aws-console:key-pair:flash";

async function postKeyPair(payload: Record<string, unknown>): Promise<KeyPairApiResponse> {
  const res = await apiFetch("/api/ec2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as KeyPairApiResponse;
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

const TAG_COLUMNS: TableProps.ColumnDefinition<TagPair>[] = [
  { id: "key", header: "Key", isRowHeader: true, cell: (item) => item.Key || "—" },
  { id: "value", header: "Value", cell: (item) => item.Value || "—" },
];

export default function KeyPairDetailPage() {
  const router = useRouter();
  const params = useParams();
  const keyName = decodeURIComponent((params.keyName as string) || "");

  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Delete confirmation (typed, AWS copy)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchKeyPair = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await postKeyPair({ action: "describeKeyPairs", keyNames: [keyName] });
      const kp = data.keyPairs?.[0];
      if (!kp) throw new Error("Key pair not found");
      setKeyPair(kp);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load key pair");
      setKeyPair(null);
    } finally {
      setLoading(false);
    }
  }, [keyName]);

  useEffect(() => {
    if (keyName)
      queueMicrotask(() => {
        fetchKeyPair();
      });
  }, [keyName, fetchKeyPair]);

  const handleDelete = useCallback(async () => {
    if (!keyPair?.KeyName) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await postKeyPair({ action: "deleteKeyPair", keyName: keyPair.KeyName });
      try {
        sessionStorage.setItem(FLASH_STORAGE_KEY, `Key pair "${keyPair.KeyName}" deleted.`);
      } catch {
        // sessionStorage unavailable — the list still refreshes normally
      }
      router.push("/key-pair");
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete key pair");
      setDeleteModalVisible(false);
    } finally {
      setDeleting(false);
    }
  }, [keyPair, router]);

  // ── Early returns ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SpaceBetween size="l">
        <Header variant="h1">Key pair {keyName}</Header>
        <Box textAlign="center">
          <Spinner size="large" />
          <Box variant="p" padding={{ top: "s" }}>
            Loading key pair details...
          </Box>
        </Box>
      </SpaceBetween>
    );
  }

  if (error && !keyPair) {
    return (
      <SpaceBetween size="l">
        <Header variant="h2">Key pair {keyName}</Header>
        <Alert type="error">{error || "Key pair not found"}</Alert>
        <Box>
          <Button onClick={() => router.push("/key-pair")} formAction="none">
            Back to key pairs
          </Button>
        </Box>
      </SpaceBetween>
    );
  }

  if (!keyPair) return null;

  const overviewContent = (
    <Container header={<Header variant="h2">Overview</Header>}>
      <ColumnLayout columns={3} variant="default">
        <div>
          <Box variant="small" color="text-label">
            Key pair name
          </Box>
          <Box>{keyPair.KeyName || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Key pair ID
          </Box>
          <Box>
            <TruncatedText>{keyPair.KeyPairId || "—"}</TruncatedText>
          </Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Type
          </Box>
          <Box>{keyPair.KeyType || "rsa"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Fingerprint
          </Box>
          <Box variant="code">
            <TruncatedText>{keyPair.KeyFingerprint || "—"}</TruncatedText>
          </Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Created
          </Box>
          <Box>{keyPair.CreateTime ? new Date(keyPair.CreateTime).toLocaleString() : "—"}</Box>
        </div>
      </ColumnLayout>
    </Container>
  );

  const tagsContent = (
    <Container
      header={
        <Header variant="h2" counter={`(${keyPair.Tags?.length ?? 0})`}>
          Tags
        </Header>
      }
      className="aws-table-card"
    >
      {keyPair.Tags && keyPair.Tags.length > 0 ? (
        <Table columnDefinitions={TAG_COLUMNS} items={keyPair.Tags} />
      ) : (
        <Box>No tags assigned.</Box>
      )}
    </Container>
  );

  return (
    <SpaceBetween size="l">
      <Header
        variant="h2"
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              iconName="refresh"
              onClick={fetchKeyPair}
              ariaLabel="Refresh"
              formAction="none"
              loading={loading}
            >
              Refresh
            </Button>
            <Button onClick={() => router.push("/key-pair")} formAction="none">
              Back to key pairs
            </Button>
            <ButtonDropdown
              variant="icon"
              ariaLabel={`Actions for key pair ${keyPair.KeyName || ""}`}
              items={[{ text: "Delete", id: "delete" }]}
              onItemClick={({ detail }) => {
                if (detail.id === "delete") {
                  setDeleteError(null);
                  setDeleteModalVisible(true);
                }
              }}
            >
              Actions
            </ButtonDropdown>
          </SpaceBetween>
        }
      >
        {keyPair.KeyName}
      </Header>

      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs
        tabs={[
          { label: "Overview", id: "overview", content: overviewContent },
          { label: "Tags", id: "tags", content: tagsContent },
        ]}
      />

      <DeleteKeyPairModal
        visible={deleteModalVisible}
        keyName={keyPair.KeyName || ""}
        onConfirm={handleDelete}
        onDismiss={() => {
          setDeleteModalVisible(false);
          setDeleteError(null);
        }}
        loading={deleting}
        error={deleteError}
      />
    </SpaceBetween>
  );
}
