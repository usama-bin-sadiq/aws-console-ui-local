"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown, { ButtonDropdownProps } from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Flashbar from "@cloudscape-design/components/flashbar";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences, {
  CollectionPreferencesProps,
} from "@cloudscape-design/components/collection-preferences";
import Icon from "@cloudscape-design/components/icon";
import { CrossServiceLinks, CrossServiceLink } from "@/components/CrossServiceLinks";
import TruncatedText from "@/components/TruncatedText";
import {
  AMI,
  formatDate,
  getSourceLabel,
  getStateType,
  getVisibilityLabel,
  platformLabel,
} from "@/types/ami";
import { amiDelete, amiGet, useQueryParam } from "./ami-api";
import { CreateSnapshotModal, DeregisterImageModal } from "./image-modals";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

// ─── Constants ───────────────────────────────────────────────────────────────

const RELATED_LINKS: CrossServiceLink[] = [
  { label: "EC2 Instances", href: "/ec2" },
  { label: "Snapshots", href: "/snapshot" },
  { label: "EBS volumes", href: "/volume" },
  { label: "KMS keys", href: "/kms" },
  { label: "Launch templates", href: "/launch-template" },
];

const COLUMN_LABELS: Record<string, string> = {
  imageId: "Image ID",
  name: "Name",
  source: "Source",
  status: "Status",
  visibility: "Visibility",
  creationDate: "Creation date",
  platform: "Platform",
  architecture: "Architecture",
  rootDevice: "Root device",
  virtualization: "Virtualization",
  actions: "Actions",
};

const ALL_COLUMN_IDS = Object.keys(COLUMN_LABELS);

const ROW_ACTIONS: ButtonDropdownProps.Item[] = [
  { id: "details", text: "View details" },
  { id: "copy", text: "Copy image" },
  { id: "modify-permissions", text: "Modify launch permissions" },
  { id: "create-snapshot", text: "Create snapshot" },
  { id: "deregister", text: "Deregister" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AMIListPage() {
  const router = useRouter();

  const [items, setItems] = useState<AMI[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<AMI[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [preferences, setPreferences] = useState<CollectionPreferencesProps.Preferences>({
    pageSize: 25,
    contentDisplay: [],
  });

  // Deregister queue (typed confirmation, one image at a time)
  const [deregisterQueue, setDeregisterQueue] = useState<AMI[]>([]);
  const [deregisterTotal, setDeregisterTotal] = useState(0);
  const [deregistering, setDeregistering] = useState(false);

  // Create snapshot modal target
  const [snapshotTarget, setSnapshotTarget] = useState<AMI | null>(null);

  // Success flash carried over from the detail page after a deregister.
  const deregisteredParam = useQueryParam("deregistered");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await amiGet();
      setItems(data.images ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch images");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  // Success messages auto-dismiss; errors persist until dismissed.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(null), 6000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (deregisteredParam)
      queueMicrotask(() => {
        setSuccess(`Image ${deregisteredParam} deregistered.`);
      });
  }, [deregisteredParam]);

  // ── Deregister (typed confirmation queue) ─────────────────────────────────

  const openDeregister = useCallback((targets: AMI[]) => {
    if (targets.length === 0) return;
    setDeregisterQueue(targets);
    setDeregisterTotal(targets.length);
  }, []);

  const handleConfirmDeregister = useCallback(async () => {
    const target = deregisterQueue[0];
    if (!target?.ImageId) return;
    setDeregistering(true);
    setError(null);
    try {
      await amiDelete({ imageId: target.ImageId });
      const remaining = deregisterQueue.slice(1);
      setDeregisterQueue(remaining);
      if (remaining.length === 0) {
        setSuccess(
          deregisterTotal === 1
            ? `Image ${target.ImageId} deregistered. Snapshots are not deleted.`
            : `${deregisterTotal} images deregistered. Snapshots are not deleted.`,
        );
        setSelectedItems([]);
        await load();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to deregister image");
      setDeregisterQueue([]);
      await load();
    } finally {
      setDeregistering(false);
    }
  }, [deregisterQueue, deregisterTotal, load]);

  // ── Row / bulk action dispatch ────────────────────────────────────────────

  const handleAction = useCallback(
    (actionId: string, image: AMI) => {
      switch (actionId) {
        case "details":
          router.push(`/ami/${encodeURIComponent(image.ImageId)}`);
          break;
        case "copy":
          router.push(`/ami/copy?imageId=${encodeURIComponent(image.ImageId)}`);
          break;
        case "modify-permissions":
          router.push(`/ami/${encodeURIComponent(image.ImageId)}?tab=launch-permissions`);
          break;
        case "create-snapshot":
          setSnapshotTarget(image);
          break;
        case "deregister":
          openDeregister([image]);
          break;
        default:
          break;
      }
    },
    [router, openDeregister],
  );

  const handleBulkAction = useCallback(
    (actionId: string) => {
      if (selectedItems.length === 0) return;
      if (actionId === "deregister") {
        openDeregister(selectedItems);
      } else if (selectedItems.length === 1 && selectedItems[0]) {
        handleAction(actionId, selectedItems[0]);
      }
    },
    [selectedItems, handleAction, openDeregister],
  );

  // ── Table data ────────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    const query = filteringText.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.ImageId.toLowerCase().includes(query) ||
        (item.Name ?? "").toLowerCase().includes(query) ||
        (item.State ?? "").toLowerCase().includes(query) ||
        (item.Architecture ?? "").toLowerCase().includes(query) ||
        platformLabel(item).toLowerCase().includes(query) ||
        getSourceLabel(item).toLowerCase().includes(query) ||
        (item.RootDeviceType ?? "").toLowerCase().includes(query),
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

  const columnDefinitions = useMemo<TableProps.ColumnDefinition<AMI>[]>(() => {
    const all: TableProps.ColumnDefinition<AMI>[] = [
      {
        id: "imageId",
        header: "Image ID",
        isRowHeader: true,
        sortingField: "ImageId",
        cell: (item) => (
          <Button
            variant="link"
            formAction="none"
            onClick={() => router.push(`/ami/${encodeURIComponent(item.ImageId)}`)}
          >
            {item.ImageId}
          </Button>
        ),
      },
      {
        id: "name",
        header: "Name",
        sortingField: "Name",
        cell: (item) => <TruncatedText>{item.Name || "—"}</TruncatedText>,
      },
      {
        id: "source",
        header: "Source",
        cell: (item) => getSourceLabel(item),
      },
      {
        id: "status",
        header: "Status",
        sortingField: "State",
        cell: (item) => (
          <StatusIndicator type={getStateType(item.State)}>{item.State || "—"}</StatusIndicator>
        ),
      },
      {
        id: "visibility",
        header: "Visibility",
        sortingField: "Public",
        cell: (item) => {
          const visibility = getVisibilityLabel(item.Public);
          return <StatusIndicator type={visibility.type}>{visibility.label}</StatusIndicator>;
        },
      },
      {
        id: "creationDate",
        header: "Creation date",
        sortingField: "CreationDate",
        cell: (item) => formatDate(item.CreationDate),
      },
      {
        id: "platform",
        header: "Platform",
        sortingField: "Platform",
        cell: (item) => platformLabel(item),
      },
      {
        id: "architecture",
        header: "Architecture",
        sortingField: "Architecture",
        cell: (item) => item.Architecture || "—",
      },
      {
        id: "rootDevice",
        header: "Root device",
        sortingField: "RootDeviceType",
        cell: (item) => item.RootDeviceType || "—",
      },
      {
        id: "virtualization",
        header: "Virtualization",
        sortingField: "VirtualizationType",
        cell: (item) => item.VirtualizationType || "—",
      },
      {
        id: "actions",
        header: "Actions",
        cell: (item) => (
          <ButtonDropdown
            variant="icon"
            ariaLabel={`Actions for image ${item.ImageId}`}
            onItemClick={({ detail }) => handleAction(String(detail.id), item)}
            items={ROW_ACTIONS}
          />
        ),
      },
    ];
    return visibleColumnIds ? all.filter((c) => c.id && visibleColumnIds.includes(c.id)) : all;
  }, [visibleColumnIds, handleAction, router]);

  const singleSelected = selectedItems.length === 1;
  const bulkActions: ButtonDropdownProps.Item[] = [
    { id: "copy", text: "Copy image", disabled: !singleSelected },
    { id: "modify-permissions", text: "Modify launch permissions", disabled: !singleSelected },
    { id: "create-snapshot", text: "Create snapshot", disabled: !singleSelected },
    { id: "deregister", text: "Deregister", disabled: selectedItems.length === 0 },
  ];

  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Box padding="m">
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="AMI"
          serviceIcon={SERVICE_ICONS["/ami"]?.small}
          counter={items?.length ?? 0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/ami/create")}
            >
              Create AMI
            </button>
          }
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
                id: "ami-success",
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
          loadingText="Loading images..."
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems as AMI[])}
          trackBy="ImageId"
          filter={
            <TextFilter
              filteringText={filteringText}
              filteringPlaceholder="Filter by image ID, name, source, or state"
              filteringAriaLabel="Filter images"
              onChange={({ detail }) => {
                setFilteringText(detail.filteringText);
                setCurrentPage(1);
              }}
              countText={
                filteringText
                  ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                  : `${items.length} image${items.length !== 1 ? "s" : ""}`
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
                  { value: 10, label: "10 images" },
                  { value: 25, label: "25 images" },
                  { value: 50, label: "50 images" },
                  { value: 100, label: "100 images" },
                ],
              }}
              contentDisplayPreference={{
                title: "Select visible columns",
                options: ALL_COLUMN_IDS.map((id) => ({ id, label: COLUMN_LABELS[id] ?? id })),
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
                No AMIs found
              </Box>
              <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                {filteringText
                  ? "No images match your filter. Try a different search."
                  : "Images are created from instances or copied — copy an existing image or register one from an S3 manifest."}
              </Box>
              {!filteringText && (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button
                    variant="primary"
                    formAction="none"
                    onClick={() => router.push("/ami/copy")}
                  >
                    Copy image
                  </Button>
                  <Button formAction="none" onClick={() => router.push("/ami/register")}>
                    Register image
                  </Button>
                </SpaceBetween>
              )}
            </Box>
          }
        />
      </SpaceBetween>

      {deregisterQueue.length > 0 && (
        <DeregisterImageModal
          visible={true}
          imageId={deregisterQueue[0].ImageId}
          onConfirm={() => void handleConfirmDeregister()}
          onDismiss={() => setDeregisterQueue([])}
          loading={deregistering}
        />
      )}

      {snapshotTarget && (
        <CreateSnapshotModal
          visible={true}
          imageId={snapshotTarget.ImageId}
          onDismiss={() => setSnapshotTarget(null)}
          onCreated={(snapshotId) => {
            const imageId = snapshotTarget.ImageId;
            setSnapshotTarget(null);
            setSuccess(`Snapshot ${snapshotId} created from image ${imageId}.`);
          }}
        />
      )}
    </Box>
  );
}
