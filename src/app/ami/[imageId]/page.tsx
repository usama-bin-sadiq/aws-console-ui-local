"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Tabs from "@cloudscape-design/components/tabs";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator, {
  StatusIndicatorProps,
} from "@cloudscape-design/components/status-indicator";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown, { ButtonDropdownProps } from "@cloudscape-design/components/button-dropdown";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import Alert from "@cloudscape-design/components/alert";
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";
import Spinner from "@cloudscape-design/components/spinner";
import Table, { TableProps } from "@cloudscape-design/components/table";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Checkbox from "@cloudscape-design/components/checkbox";
import TagEditor, { Tag } from "@/components/TagEditor";
import TruncatedText from "@/components/TruncatedText";
import {
  AMI,
  AMISnapshot,
  LaunchPermission,
  formatDate,
  getSourceLabel,
  getStateType,
  getVisibilityLabel,
  platformLabel,
} from "@/types/ami";
import { amiDelete, amiGet, amiPost, useQueryParam } from "../ami-api";
import { CreateSnapshotModal, DeregisterImageModal } from "../image-modals";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const VALID_TABS = ["details", "launch-permissions", "usage", "tags"];
const ACCOUNT_ID_PATTERN = /^\d{12}$/;

type TagPair = { Key?: string; Value?: string };

const toEditorTags = (tags: TagPair[]): Tag[] =>
  tags
    .filter((t) => t.Key !== undefined)
    .map((t) => ({ key: t.Key as string, value: t.Value ?? "" }));

const serializeTags = (list: Tag[]): string =>
  JSON.stringify([...list].sort((a, b) => a.key.localeCompare(b.key)));

function snapshotStateType(state?: string): StatusIndicatorProps.Type {
  switch (state) {
    case "completed":
      return "success";
    case "pending":
    case "recoverable":
    case "recovery":
      return "in-progress";
    case "error":
    case "error_plus_perm":
      return "error";
    default:
      return "info";
  }
}

function yesNo(value?: boolean): string {
  return value ? "Yes" : "No";
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Box variant="small" color="text-label">
        {label}
      </Box>
      <Box>{children}</Box>
    </div>
  );
}

const BLOCK_DEVICE_COLUMNS: TableProps.ColumnDefinition<
  NonNullable<AMI["BlockDeviceMappings"]>[number]
>[] = [
  {
    id: "deviceName",
    header: "Device name",
    isRowHeader: true,
    sortingField: "DeviceName",
    cell: (item) => item.DeviceName || "—",
  },
  {
    id: "snapshotId",
    header: "Snapshot ID",
    sortingField: "SnapshotId",
    cell: (item) => <TruncatedText>{item.Ebs?.SnapshotId || "—"}</TruncatedText>,
  },
  {
    id: "volumeSize",
    header: "Volume size (GB)",
    sortingField: "VolumeSize",
    cell: (item) => item.Ebs?.VolumeSize ?? "—",
  },
  {
    id: "volumeType",
    header: "Volume type",
    cell: (item) => item.Ebs?.VolumeType || "—",
  },
  {
    id: "deleteOnTermination",
    header: "Delete on termination",
    cell: (item) => yesNo(item.Ebs?.DeleteOnTermination),
  },
  {
    id: "encrypted",
    header: "Encrypted",
    cell: (item) => yesNo(item.Ebs?.Encrypted),
  },
  {
    id: "kmsKey",
    header: "KMS key",
    cell: (item) => <TruncatedText>{item.Ebs?.KmsKeyId || "—"}</TruncatedText>,
  },
];

const SNAPSHOT_COLUMNS: TableProps.ColumnDefinition<AMISnapshot>[] = [
  {
    id: "snapshotId",
    header: "Snapshot ID",
    isRowHeader: true,
    sortingField: "SnapshotId",
    cell: (item) => item.SnapshotId,
  },
  {
    id: "status",
    header: "Status",
    sortingField: "State",
    cell: (item) => (
      <StatusIndicator type={snapshotStateType(item.State)}>{item.State || "—"}</StatusIndicator>
    ),
  },
  {
    id: "description",
    header: "Description",
    cell: (item) => <TruncatedText>{item.Description || "—"}</TruncatedText>,
  },
  {
    id: "volumeSize",
    header: "Volume size (GB)",
    sortingField: "VolumeSize",
    cell: (item) => item.VolumeSize ?? "—",
  },
  {
    id: "volumeType",
    header: "Volume type",
    cell: (item) => item.VolumeType || "—",
  },
  {
    id: "encrypted",
    header: "Encrypted",
    cell: (item) => yesNo(item.Encrypted),
  },
  {
    id: "created",
    header: "Creation date",
    sortingField: "StartTime",
    cell: (item) => formatDate(item.StartTime),
  },
];

const DETAIL_ACTIONS: ButtonDropdownProps.Item[] = [
  { id: "copy", text: "Copy image" },
  { id: "modify-permissions", text: "Modify launch permissions" },
  { id: "create-snapshot", text: "Create snapshot" },
  { id: "deregister", text: "Deregister" },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AMIImageDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawImageId = params.imageId;
  const imageId = decodeURIComponent(typeof rawImageId === "string" ? rawImageId : "");

  const [image, setImage] = useState<AMI | null>(null);
  const [launchPerms, setLaunchPerms] = useState<LaunchPermission[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successItem, setSuccessItem] = useState<FlashbarProps.MessageDefinition | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const tabParam = useQueryParam("tab");

  // Snapshots (Usage tab)
  const [snapshots, setSnapshots] = useState<AMISnapshot[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [snapshotsLoaded, setSnapshotsLoaded] = useState(false);
  const [snapshotsError, setSnapshotsError] = useState<string | null>(null);

  // Launch permission draft
  const [draftAccounts, setDraftAccounts] = useState<string[]>([]);
  const [draftPublic, setDraftPublic] = useState(false);
  const [accountInput, setAccountInput] = useState("");
  const [accountError, setAccountError] = useState<string | undefined>();
  const [savingPerms, setSavingPerms] = useState(false);

  // Tags draft
  const [tagDraft, setTagDraft] = useState<Tag[] | null>(null);
  const [tagSaving, setTagSaving] = useState(false);

  // Modals
  const [deregisterOpen, setDeregisterOpen] = useState(false);
  const [deregistering, setDeregistering] = useState(false);
  const [snapshotModalOpen, setSnapshotModalOpen] = useState(false);

  const showSuccess = useCallback((content: string) => {
    setSuccessItem({
      id: "ami-detail-success",
      type: "success",
      content,
      dismissible: true,
      onDismiss: () => setSuccessItem(null),
    });
  }, []);

  useEffect(() => {
    if (!successItem) return;
    const timer = setTimeout(() => setSuccessItem(null), 6000);
    return () => clearTimeout(timer);
  }, [successItem]);

  // Deep link (?tab=…) selects the initial tab.
  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) setActiveTab(tabParam);
  }, [tabParam]);

  // ── Data loading ─────────────────────────────────────────────────────────

  const fetchImage = useCallback(
    async (options?: { quiet?: boolean }) => {
      if (!options?.quiet) setLoading(true);
      setError(null);
      try {
        const data = await amiGet({ action: "getImage", imageId });
        if (!data.image) throw new Error(`Image ${imageId} not found`);
        setImage(data.image);
        // Launch permissions load separately; failures leave the section in an
        // explicit "unavailable" state instead of hiding it.
        const attribute = await amiGet({
          action: "describeAttribute",
          imageId,
          attribute: "launchPermission",
        }).catch(() => null);
        setLaunchPerms(attribute?.attribute?.LaunchPermissions ?? null);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load image");
        setImage(null);
      } finally {
        if (!options?.quiet) setLoading(false);
      }
    },
    [imageId],
  );

  const refreshPermissions = useCallback(async () => {
    try {
      const attribute = await amiGet({
        action: "describeAttribute",
        imageId,
        attribute: "launchPermission",
      });
      setLaunchPerms(attribute.attribute?.LaunchPermissions ?? null);
    } catch {
      setLaunchPerms(null);
    }
  }, [imageId]);

  const loadSnapshots = useCallback(async () => {
    setSnapshotsLoading(true);
    setSnapshotsError(null);
    try {
      const data = await amiGet({ action: "describeSnapshots", imageId });
      setSnapshots(data.snapshots ?? []);
      setSnapshotsLoaded(true);
    } catch (err: unknown) {
      setSnapshotsError(err instanceof Error ? err.message : "Failed to load snapshots");
    } finally {
      setSnapshotsLoading(false);
    }
  }, [imageId]);

  useEffect(() => {
    if (imageId) void fetchImage();
  }, [imageId, fetchImage]);

  // Lazy-load snapshots the first time the Usage tab is opened.
  useEffect(() => {
    if (activeTab === "usage" && !snapshotsLoaded && !snapshotsLoading && !snapshotsError) {
      void loadSnapshots();
    }
  }, [activeTab, snapshotsLoaded, snapshotsLoading, snapshotsError, loadSnapshots]);

  // ── Launch permission draft ──────────────────────────────────────────────

  const origAccounts = useMemo(() => {
    const ids: string[] = [];
    for (const perm of launchPerms ?? []) {
      if (perm.UserId) ids.push(perm.UserId);
    }
    return ids.sort();
  }, [launchPerms]);

  const origPublic = useMemo(
    () => (launchPerms ?? []).some((perm) => perm.Group === "all"),
    [launchPerms],
  );

  const resetPermDrafts = useCallback(() => {
    setDraftAccounts(origAccounts);
    setDraftPublic(origPublic);
    setAccountInput("");
    setAccountError(undefined);
  }, [origAccounts, origPublic]);

  // Server-side permissions changed (initial load or after save) → reset draft.
  useEffect(() => {
    resetPermDrafts();
  }, [resetPermDrafts]);

  const permsDirty =
    launchPerms !== null &&
    (draftPublic !== origPublic ||
      draftAccounts.length !== origAccounts.length ||
      draftAccounts.some((account, index) => account !== origAccounts[index]));

  const handleAddAccount = () => {
    const account = accountInput.trim();
    if (!ACCOUNT_ID_PATTERN.test(account)) {
      setAccountError("Enter a 12-digit AWS account ID");
      return;
    }
    if (draftAccounts.includes(account)) {
      setAccountError("This account already has launch permission");
      return;
    }
    setDraftAccounts([...draftAccounts, account].sort());
    setAccountInput("");
    setAccountError(undefined);
  };

  const savePermissions = async () => {
    if (!permsDirty) return;
    setSavingPerms(true);
    setError(null);
    try {
      const add: LaunchPermission[] = draftAccounts
        .filter((account) => !origAccounts.includes(account))
        .map((UserId) => ({ UserId }));
      const remove: LaunchPermission[] = origAccounts
        .filter((account) => !draftAccounts.includes(account))
        .map((UserId) => ({ UserId }));
      if (draftPublic && !origPublic) add.push({ Group: "all" });
      if (!draftPublic && origPublic) remove.push({ Group: "all" });

      if (add.length > 0 || remove.length > 0) {
        await amiPost({
          action: "modifyLaunchPermissions",
          ImageId: imageId,
          Add: add.length > 0 ? add : undefined,
          Remove: remove.length > 0 ? remove : undefined,
        });
      }
      await refreshPermissions();
      showSuccess("Launch permissions saved");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save launch permissions");
    } finally {
      setSavingPerms(false);
    }
  };

  // ── Tags ─────────────────────────────────────────────────────────────────

  const serverTags = image?.Tags ?? [];
  const tagsDirty =
    tagDraft !== null && serializeTags(toEditorTags(serverTags)) !== serializeTags(tagDraft);

  const saveTags = async () => {
    if (!image || !tagDraft) return;
    setTagSaving(true);
    setError(null);
    try {
      const original = new Map(
        serverTags.filter((t) => t.Key).map((t) => [t.Key as string, t.Value ?? ""]),
      );
      const next = new Map(tagDraft.map((tag) => [tag.key, tag.value]));
      const removed = [...original.keys()].filter((key) => !next.has(key));
      const changed = [...next.entries()].filter(([key, value]) => original.get(key) !== value);

      if (removed.length > 0) {
        await amiPost({ action: "deleteTags", Resources: [imageId], Keys: removed });
      }
      if (changed.length > 0) {
        await amiPost({
          action: "createTags",
          Resources: [imageId],
          Tags: changed.map(([Key, Value]) => ({ Key, Value })),
        });
      }
      setTagDraft(null);
      showSuccess("Tags saved");
      await fetchImage({ quiet: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save tags");
    } finally {
      setTagSaving(false);
    }
  };

  // ── Deregister ───────────────────────────────────────────────────────────

  const handleDeregister = async () => {
    setDeregistering(true);
    setError(null);
    try {
      await amiDelete({ imageId });
      router.push(`/ami?deregistered=${encodeURIComponent(imageId)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to deregister image");
      setDeregistering(false);
      setDeregisterOpen(false);
    }
  };

  // ── Early returns ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <SpaceBetween size="l">
        <Header variant="h1">Image {imageId}</Header>
        <Box textAlign="center">
          <Spinner size="large" />
          <Box variant="p" padding={{ top: "s" }}>
            Loading image details...
          </Box>
        </Box>
      </SpaceBetween>
    );
  }

  if (error && !image) {
    return (
      <SpaceBetween size="l">
        <Header variant="h2">Image {imageId}</Header>
        <Alert type="error">{error}</Alert>
        <Button onClick={() => router.push("/ami")}>Back to AMIs</Button>
      </SpaceBetween>
    );
  }

  if (!image) return null;

  const blockDeviceMappings = image.BlockDeviceMappings ?? [];
  const productCodes = image.ProductCodes ?? [];
  const billingProducts = image.BillingProducts ?? [];
  const launchSummary =
    launchPerms === null
      ? "—"
      : origPublic
        ? "Public"
        : origAccounts.length > 0
          ? `Shared with ${origAccounts.length} AWS account${origAccounts.length === 1 ? "" : "s"}`
          : "Private";

  // ── Tab contents ─────────────────────────────────────────────────────────

  const detailsContent = (
    <SpaceBetween size="m">
      <Container header={<Header variant="h2">Image details</Header>}>
        <ColumnLayout columns={3} variant="default">
          <DetailField label="Image ID">
            <TruncatedText>{image.ImageId}</TruncatedText>
          </DetailField>
          <DetailField label="Name">
            <TruncatedText>{image.Name || "—"}</TruncatedText>
          </DetailField>
          <DetailField label="Source">{getSourceLabel(image)}</DetailField>
          <DetailField label="Status">
            <StatusIndicator type={getStateType(image.State)}>{image.State || "—"}</StatusIndicator>
          </DetailField>
          <DetailField label="Visibility">
            <StatusIndicator type={getVisibilityLabel(image.Public).type}>
              {getVisibilityLabel(image.Public).label}
            </StatusIndicator>
          </DetailField>
          <DetailField label="Launch permissions">{launchSummary}</DetailField>
          <DetailField label="Platform">{platformLabel(image)}</DetailField>
          <DetailField label="Architecture">{image.Architecture || "—"}</DetailField>
          <DetailField label="Root device">{image.RootDeviceType || "—"}</DetailField>
          <DetailField label="Root device name">{image.RootDeviceName || "—"}</DetailField>
          <DetailField label="Virtualization">{image.VirtualizationType || "—"}</DetailField>
          <DetailField label="ENA support">
            {image.EnaSupport ? "Enabled" : "Not enabled"}
          </DetailField>
          <DetailField label="SR-IOV">
            {image.SriovNetSupport === "enable" ? "Enabled" : "Not enabled"}
          </DetailField>
          <DetailField label="Hypervisor">{image.Hypervisor || "—"}</DetailField>
          <DetailField label="Boot mode">{image.BootMode || "—"}</DetailField>
          <DetailField label="TPM support">{image.TpmSupport || "—"}</DetailField>
          <DetailField label="IMDS support">{image.ImdsSupport || "—"}</DetailField>
          <DetailField label="Owner ID">{image.OwnerId || "—"}</DetailField>
          <DetailField label="Creation date">{formatDate(image.CreationDate)}</DetailField>
          <DetailField label="Description">
            <TruncatedText>{image.Description || "—"}</TruncatedText>
          </DetailField>
        </ColumnLayout>
      </Container>

      <Container
        header={
          <Header
            variant="h3"
            counter={blockDeviceMappings.length > 0 ? `(${blockDeviceMappings.length})` : undefined}
          >
            Block device mappings
          </Header>
        }
        className="aws-table-card"
      >
        {blockDeviceMappings.length > 0 ? (
          <Table
            columnDefinitions={BLOCK_DEVICE_COLUMNS}
            items={blockDeviceMappings}
            trackBy="DeviceName"
          />
        ) : (
          <Box>No block device mappings reported for this image.</Box>
        )}
      </Container>

      <ColumnLayout columns={2} variant="default">
        <Container header={<Header variant="h3">Product codes</Header>} className="aws-table-card">
          {productCodes.length > 0 ? (
            <Table
              columnDefinitions={[
                {
                  header: "Product code",
                  isRowHeader: true,
                  cell: (item: NonNullable<AMI["ProductCodes"]>[number]) =>
                    item.ProductCodeId || "—",
                },
                {
                  header: "Type",
                  cell: (item: NonNullable<AMI["ProductCodes"]>[number]) =>
                    item.ProductCodeType || "—",
                },
              ]}
              items={productCodes}
              trackBy="ProductCodeId"
            />
          ) : (
            <Box>No product codes.</Box>
          )}
        </Container>
        <Container header={<Header variant="h3">Billing products</Header>}>
          {billingProducts.length > 0 ? (
            <Box>{billingProducts.join(", ")}</Box>
          ) : (
            <Box>No billing products.</Box>
          )}
        </Container>
      </ColumnLayout>
    </SpaceBetween>
  );

  const launchPermissionsContent = (
    <Container
      header={
        <Header
          variant="h2"
          actions={
            permsDirty ? (
              <SpaceBetween direction="horizontal" size="xs">
                <Button onClick={resetPermDrafts} disabled={savingPerms} formAction="none">
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => void savePermissions()}
                  loading={savingPerms}
                  disabled={savingPerms}
                >
                  Save changes
                </Button>
              </SpaceBetween>
            ) : (
              <Button
                variant="primary"
                onClick={() => void savePermissions()}
                disabled={!permsDirty || savingPerms}
                loading={savingPerms}
                formAction="none"
              >
                Save changes
              </Button>
            )
          }
        >
          Launch permissions
        </Header>
      }
      className="aws-table-card"
    >
      <SpaceBetween size="m">
        {launchPerms === null ? (
          <Alert
            type="error"
            action={
              <Button formAction="none" onClick={() => void refreshPermissions()}>
                Retry
              </Button>
            }
          >
            Launch permissions could not be loaded from the emulator.
          </Alert>
        ) : (
          <>
            <Alert type="info" statusIconAriaLabel="Information">
              Accounts with launch permission can create instances from this image in the current
              Region. Making the image public shares it with all AWS accounts.
            </Alert>

            <Checkbox
              checked={draftPublic}
              onChange={({ detail }) => setDraftPublic(detail.checked)}
              description="Anyone on AWS can launch this image without being granted access."
              disabled={savingPerms}
            >
              Make image public
            </Checkbox>

            <FormField
              label="AWS account IDs"
              constraintText="Required: a 12-digit AWS account ID."
              errorText={accountError}
            >
              <SpaceBetween direction="horizontal" size="xs">
                <Input
                  value={accountInput}
                  onChange={({ detail }) => {
                    setAccountInput(detail.value);
                    setAccountError(undefined);
                  }}
                  placeholder="123456789012"
                  ariaLabel="AWS account ID"
                  disabled={savingPerms}
                />
                <Button
                  onClick={handleAddAccount}
                  disabled={savingPerms || !accountInput.trim()}
                  iconName="add-plus"
                  formAction="none"
                >
                  Add
                </Button>
              </SpaceBetween>
            </FormField>

            <Table
              header={
                <Header variant="h3" counter={`(${draftAccounts.length})`}>
                  AWS account IDs
                </Header>
              }
              columnDefinitions={[
                {
                  id: "accountId",
                  header: "AWS account ID",
                  isRowHeader: true,
                  cell: (item: { accountId: string }) => item.accountId,
                },
                {
                  id: "actions",
                  header: "Actions",
                  cell: (item: { accountId: string }) => (
                    <Button
                      variant="icon"
                      iconName="remove"
                      ariaLabel={`Remove launch permission for ${item.accountId}`}
                      disabled={savingPerms}
                      onClick={() =>
                        setDraftAccounts((accounts) =>
                          accounts.filter((account) => account !== item.accountId),
                        )
                      }
                    />
                  ),
                },
              ]}
              items={draftAccounts.map((accountId) => ({ accountId }))}
              trackBy="accountId"
              empty={
                <Box>
                  No AWS accounts have launch permission. The image is{" "}
                  {origPublic ? "public" : "private"}.
                </Box>
              }
            />
          </>
        )}
      </SpaceBetween>
    </Container>
  );

  const usageContent = (
    <Container
      header={
        <Header
          variant="h2"
          counter={snapshotsLoaded ? `(${snapshots.length})` : undefined}
          actions={
            <Button variant="primary" onClick={() => setSnapshotModalOpen(true)} formAction="none">
              Create snapshot from image
            </Button>
          }
        >
          Snapshots
        </Header>
      }
      className="aws-table-card"
    >
      <SpaceBetween size="s">
        <Box variant="small" color="text-body-secondary">
          Snapshots that back this image&apos;s block device mappings. Deregistering the image does
          not delete them.
        </Box>

        {snapshotsError ? (
          <Alert
            type="error"
            dismissible
            onDismiss={() => setSnapshotsError(null)}
            action={
              <Button formAction="none" onClick={() => void loadSnapshots()}>
                Retry
              </Button>
            }
          >
            {snapshotsError}
          </Alert>
        ) : (
          <Table
            columnDefinitions={SNAPSHOT_COLUMNS}
            items={snapshots}
            loading={snapshotsLoading}
            loadingText="Loading snapshots..."
            trackBy="SnapshotId"
            empty={
              <Box textAlign="center" color="inherit">
                <Box variant="strong" textAlign="center" color="inherit">
                  No snapshots found
                </Box>
                <Box variant="p" color="inherit">
                  This image has no associated snapshots, or they were deleted.
                </Box>
              </Box>
            }
          />
        )}
      </SpaceBetween>
    </Container>
  );

  const tagsContent = (
    <Container
      header={
        <Header
          variant="h2"
          counter={`(${serverTags.length})`}
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              {tagDraft !== null ? (
                <>
                  <Button onClick={() => setTagDraft(null)} disabled={tagSaving} formAction="none">
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
                <Button onClick={() => setTagDraft(toEditorTags(serverTags))} formAction="none">
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
      ) : serverTags.length > 0 ? (
        <Table
          columnDefinitions={[
            { header: "Key", cell: (item: TagPair) => item.Key || "—" },
            { header: "Value", cell: (item: TagPair) => item.Value || "—" },
          ]}
          items={serverTags}
          trackBy="Key"
          empty={<Box>No tags assigned.</Box>}
        />
      ) : (
        <Box textAlign="center" color="inherit">
          <Box variant="strong" textAlign="center" color="inherit">
            No tags assigned
          </Box>
          <Box variant="p" color="inherit">
            Use “Manage tags” to add key/value metadata to this image.
          </Box>
        </Box>
      )}
    </Container>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Box padding="m">
      <SpaceBetween size="l">
        <Header
          variant="h2"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                iconName="refresh"
                onClick={() => void fetchImage({ quiet: true })}
                ariaLabel="Refresh"
                formAction="none"
              >
                Refresh
              </Button>
              <ButtonDropdown
                ariaLabel="Image actions"
                onItemClick={({ detail }) => {
                  const action = String(detail.id);
                  if (action === "modify-permissions") setActiveTab("launch-permissions");
                  else if (action === "create-snapshot") setSnapshotModalOpen(true);
                  else if (action === "deregister") setDeregisterOpen(true);
                  else if (action === "copy")
                    router.push(`/ami/copy?imageId=${encodeURIComponent(imageId)}`);
                }}
                items={DETAIL_ACTIONS}
              >
                Actions
              </ButtonDropdown>
              <Button onClick={() => router.push("/ami")} formAction="none">
                Back to AMIs
              </Button>
            </SpaceBetween>
          }
        >
          {image.Name || image.ImageId}
        </Header>

        {successItem && <Flashbar items={[successItem]} />}

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs
          activeTabId={activeTab}
          onChange={({ detail }) => setActiveTab(String(detail.activeTabId))}
          tabs={[
            { label: "Details", id: "details", content: detailsContent },
            {
              label: "Launch permissions",
              id: "launch-permissions",
              content: launchPermissionsContent,
            },
            { label: "Usage", id: "usage", content: usageContent },
            { label: "Tags", id: "tags", content: tagsContent },
          ]}
        />
      </SpaceBetween>

      <DeregisterImageModal
        visible={deregisterOpen}
        imageId={imageId}
        onConfirm={() => void handleDeregister()}
        onDismiss={() => setDeregisterOpen(false)}
        loading={deregistering}
      />

      <CreateSnapshotModal
        visible={snapshotModalOpen}
        imageId={imageId}
        onDismiss={() => setSnapshotModalOpen(false)}
        onCreated={(snapshotId) => {
          setSnapshotModalOpen(false);
          showSuccess(`Snapshot ${snapshotId} created from image ${imageId}.`);
          if (snapshotsLoaded) void loadSnapshots();
        }}
      />
    </Box>
  );
}
