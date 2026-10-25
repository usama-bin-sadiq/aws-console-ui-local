"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Tabs from "@cloudscape-design/components/tabs";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Modal from "@cloudscape-design/components/modal";
import Alert from "@cloudscape-design/components/alert";
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";
import Spinner from "@cloudscape-design/components/spinner";
import TruncatedText from "@/components/TruncatedText";
import TagEditor, { Tag } from "@/components/TagEditor";
import { apiFetch } from "@/lib/api-client";

interface LayerVersion {
  LayerVersionArn?: string;
  Version?: number;
  Description?: string;
  CreatedDate?: string;
  CompatibleRuntimes?: string[];
  CompatibleArchitectures?: string[];
  LicenseInfo?: string;
}

interface LayerMeta {
  LayerName?: string;
  LayerArn?: string;
  LatestVersion?: number;
  CreatedDate?: string;
}

const VERSION_COLUMNS: TableProps.ColumnDefinition<LayerVersion>[] = [
  {
    id: "version",
    header: "Version",
    cell: (item) => item.Version ?? "—",
    sortingField: "Version",
    isRowHeader: true,
  },
  {
    id: "description",
    header: "Description",
    cell: (item) => <TruncatedText>{item.Description || "—"}</TruncatedText>,
    sortingField: "Description",
  },
  {
    id: "created",
    header: "Created",
    cell: (item) => (item.CreatedDate ? new Date(item.CreatedDate).toLocaleString() : "—"),
    sortingField: "CreatedDate",
  },
  {
    id: "runtimes",
    header: "Compatible runtimes",
    cell: (item) =>
      item.CompatibleRuntimes && item.CompatibleRuntimes.length > 0
        ? item.CompatibleRuntimes.join(", ")
        : "All runtimes",
  },
  {
    id: "arch",
    header: "Compatible architectures",
    cell: (item) =>
      item.CompatibleArchitectures && item.CompatibleArchitectures.length > 0
        ? item.CompatibleArchitectures.join(", ")
        : "—",
  },
  {
    id: "license",
    header: "License",
    cell: (item) => <TruncatedText>{item.LicenseInfo || "—"}</TruncatedText>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: (item) => (
      <ButtonDropdown
        variant="icon"
        ariaLabel={`Actions for layer version ${item.Version}`}
        items={[
          { text: "Copy ARN", id: "copy-arn" },
          { text: "Delete layer version", id: "delete" },
        ]}
        onItemClick={({ detail }) => {
          const event = new CustomEvent("layer-version-action", {
            detail: { action: detail.id, version: item },
          });
          window.dispatchEvent(event);
        }}
      >
        Actions
      </ButtonDropdown>
    ),
  },
];

export default function LambdaLayerDetailPage({ params }: { params: { layerName: string } }) {
  const router = useRouter();
  const layerName = decodeURIComponent(params.layerName || "");

  const [layer, setLayer] = useState<LayerMeta | null>(null);
  const [versions, setVersions] = useState<LayerVersion[]>([]);
  const [tags, setTags] = useState<Array<{ Key?: string; Value?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successItem, setSuccessItem] = useState<FlashbarProps.MessageDefinition | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<LayerVersion | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [tagDraft, setTagDraft] = useState<Tag[] | null>(null);
  const [tagSaving, setTagSaving] = useState(false);

  const showSuccess = useCallback((content: string) => {
    setSuccessItem({
      type: "success",
      content,
      dismissible: true,
      onDismiss: () => setSuccessItem(null),
    });
  }, []);

  useEffect(() => {
    if (!successItem) return;
    const timer = setTimeout(() => setSuccessItem(null), 5000);
    return () => clearTimeout(timer);
  }, [successItem]);

  const post = useCallback(async (payload: Record<string, unknown>) => {
    const res = await apiFetch("/api/lambda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  }, []);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const layerRes = await apiFetch(
        `/api/lambda?action=listLayer&layerName=${encodeURIComponent(layerName)}`,
      );
      const layerData = await layerRes.json();
      if (!layerRes.ok || layerData.error)
        throw new Error(layerData.error || `HTTP ${layerRes.status}`);
      setLayer(layerData.layer);

      const verRes = await apiFetch(
        `/api/lambda?action=listLayerVersions&layerName=${encodeURIComponent(layerName)}`,
      );
      const verData = await verRes.json();
      if (!verRes.ok || verData.error) throw new Error(verData.error || `HTTP ${verRes.status}`);
      setVersions(verData.versions || []);

      if (layerData.layer?.LayerArn) {
        const tagRes = await apiFetch(
          `/api/lambda?action=listTags&arn=${encodeURIComponent(layerData.layer.LayerArn)}`,
        );
        const tagData = await tagRes.json();
        const raw = tagData.tags || {};
        setTags(
          Array.isArray(raw)
            ? raw
            : Object.entries(raw as Record<string, string>).map(([Key, Value]) => ({ Key, Value })),
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load layer details");
    }
    setLoading(false);
  }, [layerName]);

  useEffect(() => {
    if (layerName)
      queueMicrotask(() => {
        fetchDetails();
      });
  }, [layerName, fetchDetails]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        action: string;
        version: LayerVersion;
      };
      if (detail.action === "copy-arn" && detail.version.LayerVersionArn) {
        void navigator.clipboard.writeText(detail.version.LayerVersionArn);
        showSuccess("Copied layer version ARN");
      } else if (detail.action === "delete") {
        setDeleteTarget(detail.version);
      }
    };
    window.addEventListener("layer-version-action", handler);
    return () => window.removeEventListener("layer-version-action", handler);
  }, [showSuccess]);

  const deleteVersion = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await post({
        action: "deleteLayerVersion",
        layerName,
        version: deleteTarget.Version,
      });
      setDeleteTarget(null);
      showSuccess(`Deleted layer version ${deleteTarget.Version}`);
      await fetchDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete layer version");
    }
    setDeleteLoading(false);
  };

  const saveTags = async () => {
    if (!layer?.LayerArn || !tagDraft) return;
    setTagSaving(true);
    setError(null);
    try {
      const arn = layer.LayerArn;
      const original = new Map(
        tags.filter((t) => t.Key).map((t) => [t.Key as string, t.Value ?? ""]),
      );
      const next = new Map(tagDraft.map((t) => [t.key, t.value]));
      const removed = [...original.keys()].filter((k) => !next.has(k));
      const changed = [...next.entries()].filter(([k, v]) => original.get(k) !== v);
      if (removed.length > 0) await post({ action: "untagResource", arn, keys: removed });
      if (changed.length > 0) {
        await post({
          action: "tagResource",
          arn,
          tags: changed.map(([Key, Value]) => ({ Key, Value })),
        });
      }
      setTagDraft(null);
      showSuccess("Tags saved");
      await fetchDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save tags");
    }
    setTagSaving(false);
  };

  const toEditorTags = (list: Array<{ Key?: string; Value?: string }>): Tag[] =>
    list
      .filter((t) => t.Key !== undefined)
      .map((t) => ({ key: t.Key as string, value: t.Value ?? "" }));

  const serializeTags = (list: Tag[]): string =>
    JSON.stringify([...list].sort((a, b) => a.key.localeCompare(b.key)));

  const tagsDirty =
    tagDraft !== null && serializeTags(toEditorTags(tags)) !== serializeTags(tagDraft);

  if (loading) {
    return (
      <SpaceBetween size="l">
        <Header variant="h2">Layer {layerName}</Header>
        <Box textAlign="center">
          <Spinner size="large" />
          <Box variant="p" padding={{ top: "s" }}>
            Loading layer details...
          </Box>
        </Box>
      </SpaceBetween>
    );
  }

  if (error && !layer) {
    return (
      <SpaceBetween size="l">
        <Header variant="h2">Layer {layerName}</Header>
        <Alert type="error">{error}</Alert>
        <Button onClick={() => router.push("/lambda/layers")}>Back to Layers</Button>
      </SpaceBetween>
    );
  }

  if (!layer) return null;

  const latest = versions.find((v) => v.Version === layer.LatestVersion) ?? versions[0];

  const descriptionContent = (
    <Container header={<Header variant="h2">Description</Header>}>
      <ColumnLayout columns={3} variant="default">
        <div>
          <Box variant="small" color="text-label">
            Layer name
          </Box>
          <Box>{layer.LayerName || "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Layer ARN
          </Box>
          <TruncatedText>{layer.LayerArn || "—"}</TruncatedText>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Latest version
          </Box>
          <Box>{layer.LatestVersion ?? "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Creation date
          </Box>
          <Box>{layer.CreatedDate ? new Date(layer.CreatedDate).toLocaleString() : "—"}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Versions
          </Box>
          <Box>{versions.length}</Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Compatible architectures
          </Box>
          <Box>
            {latest?.CompatibleArchitectures && latest.CompatibleArchitectures.length > 0
              ? latest.CompatibleArchitectures.join(", ")
              : "—"}
          </Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Compatible runtimes (latest)
          </Box>
          <Box>
            {latest?.CompatibleRuntimes && latest.CompatibleRuntimes.length > 0
              ? latest.CompatibleRuntimes.join(", ")
              : "All runtimes"}
          </Box>
        </div>
        <div>
          <Box variant="small" color="text-label">
            Description (latest version)
          </Box>
          <TruncatedText>{latest?.Description || "—"}</TruncatedText>
        </div>
        <div>
          <Box variant="small" color="text-label">
            License information
          </Box>
          <TruncatedText>{latest?.LicenseInfo || "—"}</TruncatedText>
        </div>
      </ColumnLayout>
    </Container>
  );

  const versionsContent = (
    <Container
      header={
        <Header variant="h2" counter={`(${versions.length})`}>
          Versions
        </Header>
      }
      className="aws-table-card"
    >
      {versions.length > 0 ? (
        <Table columnDefinitions={VERSION_COLUMNS} items={versions} trackBy="LayerVersionArn" />
      ) : (
        <Box>No versions published for this layer.</Box>
      )}
    </Container>
  );

  const tagsContent = (
    <Container
      header={
        <Header
          variant="h2"
          counter={`(${tags.length})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              {tagDraft !== null ? (
                <>
                  <Button onClick={() => setTagDraft(null)} formAction="none">
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={saveTags}
                    loading={tagSaving}
                    disabled={tagSaving || !tagsDirty}
                  >
                    Save changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setTagDraft(toEditorTags(tags))} formAction="none">
                  Manage tags
                </Button>
              )}
            </SpaceBetween>
          }
        >
          Tags
        </Header>
      }
      className="aws-table-card"
    >
      {tagDraft !== null ? (
        <TagEditor tags={tagDraft} onChange={setTagDraft} />
      ) : tags.length > 0 ? (
        <Table
          columnDefinitions={[
            { header: "Key", cell: (item: { Key?: string; Value?: string }) => item.Key || "—" },
            {
              header: "Value",
              cell: (item: { Key?: string; Value?: string }) => item.Value || "—",
            },
          ]}
          items={tags}
        />
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
            <Button iconName="refresh" onClick={fetchDetails} ariaLabel="Refresh" formAction="none">
              Refresh
            </Button>
            <Button onClick={() => router.push("/lambda/layers")} formAction="none">
              Back to Layers
            </Button>
          </SpaceBetween>
        }
      >
        {layer.LayerName || layerName}
      </Header>

      {successItem && <Flashbar items={[successItem]} />}

      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs
        tabs={[
          { label: "Description", id: "description", content: descriptionContent },
          { label: "Versions", id: "versions", content: versionsContent },
          { label: "Tags", id: "tags", content: tagsContent },
        ]}
      />

      <Modal
        visible={deleteTarget !== null}
        onDismiss={() => setDeleteTarget(null)}
        header="Delete layer version"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setDeleteTarget(null)} formAction="none">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={deleteVersion}
              loading={deleteLoading}
              disabled={deleteLoading}
            >
              Delete
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <Box>
            Delete layer version <Box variant="strong">{deleteTarget?.Version}</Box> of{" "}
            <Box variant="strong">{layerName}</Box>?
          </Box>
          <Alert type="warning">
            After deletion, functions using this layer version with ARN{" "}
            <TruncatedText>{deleteTarget?.LayerVersionArn}</TruncatedText> will fail to load the
            layer. This cannot be undone.
          </Alert>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
}
