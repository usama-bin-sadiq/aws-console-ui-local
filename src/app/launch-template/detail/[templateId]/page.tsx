"use client";

/**
 * Launch template detail — Versions and Tags tabs, matching the AWS Console
 * launch template details page.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Tabs from "@cloudscape-design/components/tabs";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Alert from "@cloudscape-design/components/alert";
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";
import Spinner from "@cloudscape-design/components/spinner";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Modal from "@cloudscape-design/components/modal";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import { CodeView } from "@cloudscape-design/code-view";
import TruncatedText from "@/components/TruncatedText";
import TagEditor, { Tag } from "@/components/TagEditor";
import LaunchTemplateDeleteModal from "../../LaunchTemplateDeleteModal";
import { apiFetch } from "@/lib/api-client";
import {
  LaunchTemplate,
  LaunchTemplateVersion,
  DescribeLaunchTemplateVersionsResponse,
  GetLaunchTemplateResponse,
} from "@/types/launch-template";

// ─── Helpers ─────────────────────────────────────────────────────────────────

type TagPair = { Key?: string; Value?: string };

interface Ec2TagResponse {
  success?: boolean;
  error?: string;
}

interface LaunchTemplatePostResponse {
  template?: LaunchTemplate;
  successfullyDeleted?: Array<{ VersionNumber?: number }>;
  unsuccessfullyDeleted?: Array<{
    VersionNumber?: number;
    ResponseError?: { Code?: string; Message?: string };
  }>;
  error?: string;
}

function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleString() : "—";
}

async function postLaunchTemplate(
  payload: Record<string, unknown>,
): Promise<LaunchTemplatePostResponse> {
  const res = await apiFetch("/api/launch-template", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as LaunchTemplatePostResponse;
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  if (data.unsuccessfullyDeleted && data.unsuccessfullyDeleted.length > 0) {
    const first = data.unsuccessfullyDeleted[0];
    throw new Error(
      first.ResponseError?.Message || `Version ${String(first.VersionNumber)} could not be deleted`,
    );
  }
  return data;
}

async function postEc2Tags(
  action: "createTags" | "deleteTags",
  resourceId: string,
  tags: TagPair[],
): Promise<void> {
  const res = await apiFetch("/api/ec2", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, resources: [resourceId], tags }),
  });
  const data = (await res.json()) as Ec2TagResponse;
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function LaunchTemplateDetailPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState("");

  const [template, setTemplate] = useState<LaunchTemplate | null>(null);
  const [versions, setVersions] = useState<LaunchTemplateVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successItem, setSuccessItem] = useState<FlashbarProps.MessageDefinition | null>(null);

  const [selectedVersionNumber, setSelectedVersionNumber] = useState<number | null>(null);
  const [setDefaultLoading, setSetDefaultLoading] = useState<number | null>(null);
  const [deleteVersionTarget, setDeleteVersionTarget] = useState<LaunchTemplateVersion | null>(
    null,
  );
  const [deletingVersion, setDeletingVersion] = useState(false);
  const [deleteTemplateOpen, setDeleteTemplateOpen] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  const [tagDraft, setTagDraft] = useState<Tag[] | null>(null);
  const [tagSaving, setTagSaving] = useState(false);

  useEffect(() => {
    params.then((p) => setTemplateId(p.templateId));
  }, [params]);

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

  const fetchDetails = useCallback(async () => {
    if (!templateId) return;
    setLoading(true);
    setError(null);
    try {
      const [templateRes, versionsRes] = await Promise.all([
        apiFetch(
          `/api/launch-template?action=describeTemplate&templateId=${encodeURIComponent(templateId)}`,
        ),
        apiFetch(
          `/api/launch-template?action=describeVersions&templateId=${encodeURIComponent(templateId)}`,
        ),
      ]);
      const templateData = (await templateRes.json()) as GetLaunchTemplateResponse;
      if (!templateRes.ok || templateData.error) {
        throw new Error(templateData.error || "Failed to load the launch template");
      }
      const versionsData = (await versionsRes.json()) as DescribeLaunchTemplateVersionsResponse;
      if (!versionsRes.ok || versionsData.error) {
        throw new Error(versionsData.error || "Failed to load launch template versions");
      }

      const loadedTemplate = templateData.template ?? null;
      const loadedVersions = (versionsData.versions ?? []).sort(
        (a, b) => (b.VersionNumber ?? 0) - (a.VersionNumber ?? 0),
      );
      setTemplate(loadedTemplate);
      setVersions(loadedVersions);
      setSelectedVersionNumber((prev) => {
        if (prev !== null && loadedVersions.some((v) => v.VersionNumber === prev)) return prev;
        const defaultVersion = loadedTemplate?.DefaultVersionNumber;
        if (
          defaultVersion !== undefined &&
          loadedVersions.some((v) => v.VersionNumber === defaultVersion)
        ) {
          return defaultVersion;
        }
        return loadedVersions.length > 0 ? (loadedVersions[0].VersionNumber ?? null) : null;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load the launch template");
      setTemplate(null);
      setVersions([]);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    if (templateId) void fetchDetails();
  }, [templateId, fetchDetails]);

  // ── Version actions ───────────────────────────────────────────────────────

  const handleSetDefault = useCallback(
    async (versionNumber: number) => {
      setSetDefaultLoading(versionNumber);
      setError(null);
      try {
        await postLaunchTemplate({
          action: "setDefaultVersion",
          templateId,
          defaultVersion: String(versionNumber),
        });
        showSuccess(`Version ${versionNumber} is now the default version`);
        await fetchDetails();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to set the default version");
      } finally {
        setSetDefaultLoading(null);
      }
    },
    [templateId, fetchDetails, showSuccess],
  );

  const handleDeleteVersion = useCallback(async () => {
    const target = deleteVersionTarget;
    if (!target?.VersionNumber) return;
    setDeletingVersion(true);
    setError(null);
    try {
      await postLaunchTemplate({
        action: "deleteVersions",
        templateId,
        versions: [target.VersionNumber],
      });
      setDeleteVersionTarget(null);
      setSelectedVersionNumber((prev) => (prev === target.VersionNumber ? null : prev));
      showSuccess(`Version ${target.VersionNumber} deleted`);
      await fetchDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete the version");
      setDeleteVersionTarget(null);
    } finally {
      setDeletingVersion(false);
    }
  }, [deleteVersionTarget, templateId, fetchDetails, showSuccess]);

  const handleDeleteTemplate = useCallback(async () => {
    setDeletingTemplate(true);
    setError(null);
    try {
      await postLaunchTemplate({ action: "deleteTemplate", templateId });
      router.push("/launch-template");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete the launch template");
      setDeletingTemplate(false);
      setDeleteTemplateOpen(false);
    }
  }, [templateId, router]);

  // ── Tags ──────────────────────────────────────────────────────────────────

  const tags: TagPair[] = useMemo(() => template?.Tags ?? [], [template]);

  const toEditorTags = (list: TagPair[]): Tag[] =>
    list
      .filter((tag) => typeof tag.Key === "string")
      .map((tag) => ({ key: tag.Key as string, value: tag.Value ?? "" }));

  const tagsDirty = useMemo(() => {
    if (tagDraft === null) return false;
    const original = toEditorTags(tags)
      .map((tag) => `${tag.key}=${tag.value}`)
      .sort()
      .join("\n");
    const next = [...tagDraft]
      .map((tag) => `${tag.key}=${tag.value}`)
      .sort()
      .join("\n");
    return original !== next;
  }, [tagDraft, tags]);

  const saveTags = useCallback(async () => {
    if (!tagDraft) return;
    setTagSaving(true);
    setError(null);
    try {
      const original = new Map<string, string>();
      for (const tag of tags) {
        if (tag.Key) original.set(tag.Key, tag.Value ?? "");
      }
      const next = new Map<string, string>();
      for (const tag of tagDraft) {
        const key = tag.key.trim();
        if (key) next.set(key, tag.value);
      }
      const removed = [...original.keys()].filter((key) => !next.has(key));
      const changed = [...next.entries()].filter(([key, value]) => original.get(key) !== value);

      if (removed.length > 0) {
        await postEc2Tags(
          "deleteTags",
          templateId,
          removed.map((Key) => ({ Key })),
        );
      }
      if (changed.length > 0) {
        await postEc2Tags(
          "createTags",
          templateId,
          changed.map(([Key, Value]) => ({ Key, Value })),
        );
      }
      setTagDraft(null);
      showSuccess("Tags saved");
      await fetchDetails();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save tags");
    } finally {
      setTagSaving(false);
    }
  }, [tagDraft, tags, templateId, fetchDetails, showSuccess]);

  // ── Derived data ──────────────────────────────────────────────────────────

  const selectedVersion = useMemo(
    () => versions.find((version) => version.VersionNumber === selectedVersionNumber) ?? null,
    [versions, selectedVersionNumber],
  );

  const versionColumns: TableProps.ColumnDefinition<LaunchTemplateVersion>[] = useMemo(
    () => [
      {
        id: "version",
        header: "Version #",
        isRowHeader: true,
        cell: (item) => (
          <SpaceBetween size="xs" direction="horizontal">
            <Button
              variant="link"
              formAction="none"
              onClick={() => setSelectedVersionNumber(item.VersionNumber ?? null)}
            >
              {item.VersionNumber !== undefined ? String(item.VersionNumber) : "—"}
            </Button>
            {item.VersionNumber !== undefined &&
              item.VersionNumber === template?.DefaultVersionNumber && (
                <StatusIndicator type="success">Default</StatusIndicator>
              )}
          </SpaceBetween>
        ),
      },
      {
        id: "date",
        header: "Date",
        cell: (item) => formatDate(item.CreateTime),
      },
      {
        id: "createdBy",
        header: "Created by",
        cell: (item) => <TruncatedText>{item.CreatedBy || "—"}</TruncatedText>,
      },
      {
        id: "description",
        header: "Description",
        cell: (item) => <TruncatedText>{item.VersionDescription || "—"}</TruncatedText>,
      },
      {
        id: "actions",
        header: "Actions",
        cell: (item) => (
          <ButtonDropdown
            variant="icon"
            ariaLabel={`Actions for version ${String(item.VersionNumber)}`}
            onItemClick={({ detail }) => {
              if (detail.id === "setDefault" && item.VersionNumber !== undefined) {
                void handleSetDefault(item.VersionNumber);
              } else if (detail.id === "view") {
                setSelectedVersionNumber(item.VersionNumber ?? null);
              } else if (detail.id === "delete") {
                setDeleteVersionTarget(item);
              }
            }}
            items={[
              {
                id: "setDefault",
                text: "Set as default version",
                disabled:
                  item.VersionNumber === undefined ||
                  item.VersionNumber === template?.DefaultVersionNumber ||
                  setDefaultLoading !== null,
              },
              { id: "view", text: "View template content" },
              {
                id: "delete",
                text: "Delete version",
                disabled: item.VersionNumber === undefined || versions.length <= 1,
              },
            ]}
          />
        ),
      },
    ],
    [template?.DefaultVersionNumber, versions.length, setDefaultLoading, handleSetDefault],
  );

  // ── Early returns ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SpaceBetween size="l">
        <Header variant="h1">Launch template</Header>
        <Box textAlign="center">
          <Spinner size="large" />
          <Box variant="p" padding={{ top: "s" }}>
            Loading launch template details...
          </Box>
        </Box>
      </SpaceBetween>
    );
  }

  if (error && !template) {
    return (
      <SpaceBetween size="l">
        <Header variant="h2">Launch template</Header>
        <Alert type="error">{error}</Alert>
        <Button onClick={() => router.push("/launch-template")} formAction="none">
          Back to launch templates
        </Button>
      </SpaceBetween>
    );
  }

  if (!template) return null;

  // ── Tab contents ──────────────────────────────────────────────────────────

  const versionsContent = (
    <SpaceBetween size="l">
      <Container
        header={
          <Header variant="h2" counter={`(${versions.length})`}>
            Versions
          </Header>
        }
        className="aws-table-card"
      >
        <Table
          columnDefinitions={versionColumns}
          items={versions}
          trackBy="VersionNumber"
          loading={loading}
          loadingText="Loading versions..."
          empty={
            <Box textAlign="center" color="inherit">
              <Box variant="strong" textAlign="center" color="inherit">
                No versions found
              </Box>
              <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                Create a new version to store changes to this template.
              </Box>
            </Box>
          }
        />
      </Container>

      <Container
        header={
          <Header variant="h2">
            Template content{selectedVersion ? ` (version ${selectedVersion.VersionNumber})` : ""}
          </Header>
        }
      >
        {selectedVersion ? (
          <SpaceBetween size="m">
            <ColumnLayout columns={3} variant="default">
              <div>
                <Box variant="small" color="text-label">
                  Version
                </Box>
                <Box>{String(selectedVersion.VersionNumber ?? "—")}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Date
                </Box>
                <Box>{formatDate(selectedVersion.CreateTime)}</Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Created by
                </Box>
                <Box>
                  <TruncatedText>{selectedVersion.CreatedBy || "—"}</TruncatedText>
                </Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Description
                </Box>
                <Box>
                  <TruncatedText>{selectedVersion.VersionDescription || "—"}</TruncatedText>
                </Box>
              </div>
              <div>
                <Box variant="small" color="text-label">
                  Default version
                </Box>
                <Box>
                  {selectedVersion.VersionNumber === template.DefaultVersionNumber ? (
                    <StatusIndicator type="success">Yes</StatusIndicator>
                  ) : (
                    <StatusIndicator type="pending">No</StatusIndicator>
                  )}
                </Box>
              </div>
            </ColumnLayout>
            <CodeView
              content={JSON.stringify(selectedVersion.LaunchTemplateData ?? {}, null, 2)}
              lineNumbers
              wrapLines
            />
          </SpaceBetween>
        ) : (
          <Box color="text-body-secondary">Select a version to view its template content.</Box>
        )}
      </Container>
    </SpaceBetween>
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
                  <Button onClick={() => setTagDraft(null)} formAction="none" disabled={tagSaving}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => void saveTags()}
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
        <TagEditor tags={tagDraft} onChange={setTagDraft} readOnly={tagSaving} />
      ) : tags.length > 0 ? (
        <Table
          columnDefinitions={[
            { header: "Key", cell: (item: TagPair) => item.Key || "—" },
            { header: "Value", cell: (item: TagPair) => item.Value || "—" },
          ]}
          items={tags}
          trackBy="Key"
          empty={<Box>No tags</Box>}
        />
      ) : (
        <Box textAlign="center" color="inherit">
          <Box variant="strong" textAlign="center" color="inherit">
            No tags
          </Box>
          <Box variant="p" padding={{ bottom: "s" }} color="inherit">
            Add tags to identify this launch template.
          </Box>
          <Button onClick={() => setTagDraft([])}>Manage tags</Button>
        </Box>
      )}
    </Container>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box padding="m">
      <SpaceBetween size="l">
        <Header
          variant="h2"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                iconName="refresh"
                onClick={() => void fetchDetails()}
                ariaLabel="Refresh"
                formAction="none"
              >
                Refresh
              </Button>
              <Button onClick={() => setDeleteTemplateOpen(true)} formAction="none">
                Delete template
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  router.push(
                    `/launch-template/create?fromTemplate=${encodeURIComponent(templateId)}`,
                  )
                }
                formAction="none"
              >
                Create new version
              </Button>
            </SpaceBetween>
          }
        >
          {template.LaunchTemplateName || templateId}
        </Header>

        {successItem && <Flashbar items={[successItem]} />}

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container header={<Header variant="h2">Launch template details</Header>}>
          <ColumnLayout columns={3} variant="default">
            <div>
              <Box variant="small" color="text-label">
                Template ID
              </Box>
              <Box>
                <TruncatedText>{template.LaunchTemplateId || "—"}</TruncatedText>
              </Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Default version
              </Box>
              <Box>{String(template.DefaultVersionNumber ?? "—")}</Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Latest version
              </Box>
              <Box>{String(template.LatestVersionNumber ?? "—")}</Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Created by
              </Box>
              <Box>
                <TruncatedText>{template.CreatedBy || "—"}</TruncatedText>
              </Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Created date
              </Box>
              <Box>{formatDate(template.CreateTime)}</Box>
            </div>
          </ColumnLayout>
        </Container>

        <Tabs
          tabs={[
            { label: "Versions", id: "versions", content: versionsContent },
            { label: "Tags", id: "tags", content: tagsContent },
          ]}
        />
      </SpaceBetween>

      {/* Delete one version — explicit confirmation */}
      <Modal
        visible={deleteVersionTarget !== null}
        onDismiss={() => setDeleteVersionTarget(null)}
        header={`Delete version ${deleteVersionTarget?.VersionNumber ?? ""}`}
        closeAriaLabel="Close modal"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => setDeleteVersionTarget(null)}
                formAction="none"
                disabled={deletingVersion}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => void handleDeleteVersion()}
                loading={deletingVersion}
                disabled={deletingVersion}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Alert type="warning" statusIconAriaLabel="Warning">
            Deleting version {deleteVersionTarget?.VersionNumber} is permanent. Instances already
            launched keep running, but this version can no longer be used to launch new instances.
          </Alert>
          {deleteVersionTarget?.VersionNumber === template.DefaultVersionNumber && (
            <Alert type="info" statusIconAriaLabel="Information">
              This is the default version. Set another version as the default before deleting it,
              otherwise the request will fail.
            </Alert>
          )}
        </SpaceBetween>
      </Modal>

      {/* Delete the whole template — typed confirmation */}
      <LaunchTemplateDeleteModal
        visible={deleteTemplateOpen}
        templateName={template.LaunchTemplateName || templateId}
        versionCount={template.LatestVersionNumber ?? versions.length}
        onConfirm={() => void handleDeleteTemplate()}
        onDismiss={() => setDeleteTemplateOpen(false)}
        loading={deletingTemplate}
      />
    </Box>
  );
}
