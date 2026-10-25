"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Flashbar from "@cloudscape-design/components/flashbar";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences, {
  CollectionPreferencesProps,
} from "@cloudscape-design/components/collection-preferences";
import Icon from "@cloudscape-design/components/icon";
import Link from "@cloudscape-design/components/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import LaunchTemplateDeleteModal from "./LaunchTemplateDeleteModal";
import TruncatedText from "@/components/TruncatedText";
import { CrossServiceLinks, CrossServiceLink } from "@/components/CrossServiceLinks";
import { LaunchTemplate, DescribeLaunchTemplatesResponse } from "@/types/launch-template";
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const COLUMN_LABELS: Record<string, string> = {
  name: "Template name",
  id: "Template ID",
  latestVersion: "Latest version",
  defaultVersion: "Default version",
  createdDate: "Created date",
  actions: "Actions",
};

const RELATED_LINKS: CrossServiceLink[] = [
  { label: "EC2 Instances", href: "/ec2" },
  { label: "Launch instances", href: "/ec2/launch" },
  { label: "Spot requests", href: "/ec2-spot-instance" },
  { label: "Auto Scaling groups", href: "/auto-scaling" },
];

async function postLaunchTemplate(payload: Record<string, unknown>) {
  const res = await apiFetch("/api/launch-template", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { error?: string; [key: string]: unknown };
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

async function getLaunchTemplates(): Promise<LaunchTemplate[]> {
  const res = await apiFetch("/api/launch-template", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const data = (await res.json()) as DescribeLaunchTemplatesResponse;
  if (!res.ok || data.error) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data.templates || [];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LaunchTemplateListPage() {
  const router = useRouter();
  const [items, setItems] = useState<LaunchTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<LaunchTemplate[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    pageSize: 25,
    contentDisplay: [],
  });

  // Delete queue (typed confirmation, one resource at a time)
  const [deleteQueue, setDeleteQueue] = useState<LaunchTemplate[]>([]);
  const [deleteTotal, setDeleteTotal] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getLaunchTemplates();
      setItems(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch launch templates");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 6000);
    return () => clearTimeout(timer);
  }, [success]);

  // ── Delete ────────────────────────────────────────────────────────────────

  const openDelete = useCallback((targets: LaunchTemplate[]) => {
    if (targets.length === 0) return;
    setDeleteQueue(targets);
    setDeleteTotal(targets.length);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = deleteQueue[0];
    if (!target?.LaunchTemplateName) return;
    setDeleting(true);
    setError(null);
    try {
      await postLaunchTemplate({
        action: "deleteTemplate",
        templateName: target.LaunchTemplateName,
      });
      const remaining = deleteQueue.slice(1);
      setDeleteQueue(remaining);
      if (remaining.length === 0) {
        setSuccess(
          deleteTotal === 1
            ? `Launch template "${target.LaunchTemplateName}" deleted.`
            : `${deleteTotal} launch templates deleted.`,
        );
        setSelectedItems([]);
        await load();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete launch template");
      setDeleteQueue([]);
      await load();
    } finally {
      setDeleting(false);
    }
  }, [deleteQueue, deleteTotal, load]);

  // ── Table data ────────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    if (!filteringText.trim()) return items;
    const lower = filteringText.toLowerCase();
    return items.filter(
      (item) =>
        item.LaunchTemplateName?.toLowerCase().includes(lower) ||
        item.LaunchTemplateId?.toLowerCase().includes(lower) ||
        item.CreatedBy?.toLowerCase().includes(lower),
    );
  }, [items, filteringText]);

  const pageSize = preferences.pageSize ?? 25;
  const visibleColumnIds = useMemo(() => {
    const cd = preferences.contentDisplay;
    if (!cd || cd.length === 0) return null;
    return cd.flatMap((entry) =>
      entry.type === "group" ? entry.children.map((c) => c.id) : entry.visible ? [entry.id] : [],
    );
  }, [preferences.contentDisplay]);

  const columnDefinitions = useMemo<TableProps.ColumnDefinition<LaunchTemplate>[]>(() => {
    const all: TableProps.ColumnDefinition<LaunchTemplate>[] = [
      {
        id: "name",
        header: "Template name",
        isRowHeader: true,
        sortingField: "name",
        cell: (item) => (
          <Link href={`/launch-template/detail/${item.LaunchTemplateId}`}>
            {item.LaunchTemplateName || "—"}
          </Link>
        ),
      },
      {
        id: "id",
        header: "Template ID",
        sortingField: "id",
        cell: (item) => <TruncatedText>{item.LaunchTemplateId || "—"}</TruncatedText>,
      },
      {
        id: "latestVersion",
        header: "Latest version",
        sortingField: "latestVersion",
        cell: (item) => String(item.LatestVersionNumber ?? "—"),
      },
      {
        id: "defaultVersion",
        header: "Default version",
        sortingField: "defaultVersion",
        cell: (item) => String(item.DefaultVersionNumber ?? "—"),
      },
      {
        id: "createdDate",
        header: "Created date",
        sortingField: "createdDate",
        cell: (item) => (item.CreateTime ? new Date(item.CreateTime).toLocaleString() : "—"),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (item) => (
          <ButtonDropdown
            variant="icon"
            ariaLabel={`Actions for ${item.LaunchTemplateName || "launch template"}`}
            onItemClick={({ detail }) => {
              if (detail.id === "details") {
                router.push(`/launch-template/detail/${item.LaunchTemplateId}`);
              } else if (detail.id === "create-version") {
                router.push(`/launch-template/create?fromTemplate=${item.LaunchTemplateId}`);
              } else if (detail.id === "delete") {
                openDelete([item]);
              }
            }}
            items={[
              { id: "details", text: "View details" },
              { id: "create-version", text: "Create new version" },
              { id: "delete", text: "Delete" },
            ]}
          />
        ),
      },
    ];
    return visibleColumnIds ? all.filter((c) => c.id && visibleColumnIds.includes(c.id)) : all;
  }, [visibleColumnIds, openDelete, router]);

  const allColumnIds = ["name", "id", "latestVersion", "defaultVersion", "createdDate", "actions"];

  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Box padding="m">
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Refresh openDelete(selectedItems)} > Delete router"
          serviceIcon={SERVICE_ICONS["/launch-template"]?.small}
          counter={items?.length ?? 0}
          primaryAction=<button type="button" className="aws-service-page__create" onClick={() => router.push("/launch-template/create")}>
            Create template
        </button>
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={load} iconName="refresh" formAction="none">
              Refresh
            </Button>
          </SpaceBetween>
        }
        />

        <CrossServiceLinks links={RELATED_LINKS} />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Flashbar
            items={[
              {
                id: "create-success",
                type: "success",
                content: success,
                dismissible: true,
                onDismiss: () => setSuccess(null),
              },
            ]}
          />
        )}

        <Table
          columnDefinitions={columnDefinitions}
          items={pagedItems}
          loading={loading}
          loadingText="Loading launch templates..."
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) =>
            setSelectedItems(detail.selectedItems as LaunchTemplate[])
          }
          trackBy="LaunchTemplateId"
          filter={
            <TextFilter
              filteringText={filteringText}
              filteringPlaceholder="Filter launch templates"
              filteringAriaLabel="Filter launch templates"
              onChange={({ detail }) => {
                setFilteringText(detail.filteringText);
                setCurrentPage(1);
              }}
              countText={
                filteringText
                  ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                  : `${items.length} launch templates`
              }
            />
          }
          pagination={
            <Pagination
              currentPageIndex={currentPage}
              pagesCount={Math.max(1, Math.ceil(filteredItems.length / pageSize))}
              onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
              ariaLabels={{
                nextPageLabel: "Next page",
                previousPageLabel: "Previous page",
                pageLabel: (n) => `Page ${n}`,
              }}
            />
          }
          preferences={
            <CollectionPreferences
              title="Preferences"
              confirmLabel="Confirm"
              cancelLabel="Cancel"
              preferences={preferences}
              pageSizePreference={{
                title: "Page size",
                options: [
                  { value: 10, label: "10 launch templates" },
                  { value: 25, label: "25 launch templates" },
                  { value: 50, label: "50 launch templates" },
                  { value: 100, label: "100 launch templates" },
                ],
              }}
              contentDisplayPreference={{
                title: "Select visible columns",
                options: allColumnIds.map((id) => ({ id, label: COLUMN_LABELS[id] ?? id })),
              }}
              onConfirm={({ detail }) => {
                setPreferences({
                  pageSize: detail.pageSize ?? 25,
                  contentDisplay: detail.contentDisplay,
                });
                setCurrentPage(1);
              }}
            />
          }
          empty={
            <Box textAlign="center" color="inherit">
              <Box margin={{ bottom: "s" }}>
                <Icon name="folder" size="large" />
              </Box>
              <Box variant="strong" textAlign="center" color="inherit">
                No launch templates found
              </Box>
              <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                {filteringText
                  ? "No launch templates match your filter. Try a different search."
                  : "To get started, create a launch template."}
              </Box>
              {!filteringText && (
                <Button formAction="none" onClick={() => router.push("/launch-template/create")}>
                  Create launch template
                </Button>
              )}
            </Box>
          }
        />
      </SpaceBetween>

      {deleteQueue.length > 0 && (
        <LaunchTemplateDeleteModal
          visible={true}
          templateName={deleteQueue[0].LaunchTemplateName || ""}
          versionCount={deleteQueue[0].LatestVersionNumber ?? 1}
          onConfirm={handleConfirmDelete}
          onDismiss={() => setDeleteQueue([])}
          loading={deleting}
        />
      )}
    </Box>
  );
}
