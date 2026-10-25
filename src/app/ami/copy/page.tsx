"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Wizard from "@cloudscape-design/components/wizard";
import Container from "@cloudscape-design/components/container";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Alert from "@cloudscape-design/components/alert";
import Button from "@cloudscape-design/components/button";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select, { SelectProps } from "@cloudscape-design/components/select";
import Checkbox from "@cloudscape-design/components/checkbox";
import Table, { TableProps } from "@cloudscape-design/components/table";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import ColumnLayout from "@cloudscape-design/components/column-layout";
import TagEditor, { Tag } from "@/components/TagEditor";
import TruncatedText from "@/components/TruncatedText";
import { AMI, KmsKeyInfo, RegionInfo, formatDate, getSourceLabel, getStateType } from "@/types/ami";
import { amiGet, amiPost, CURRENT_REGION, useQueryParam } from "../ami-api";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_KMS_VALUE = "aws/ebs";
const DEFAULT_KMS_OPTION: SelectProps.Option = {
  value: DEFAULT_KMS_VALUE,
  label: "aws/ebs (default)",
};

const OWNER_OPTIONS: SelectProps.Option[] = [
  { value: "self", label: "Owned by me" },
  { value: "amazon", label: "Amazon" },
  { value: "aws-marketplace", label: "AWS Marketplace" },
  { value: "all", label: "All visible images" },
];

const SOURCE_COLUMNS: TableProps.ColumnDefinition<AMI>[] = [
  {
    id: "imageId",
    header: "Image ID",
    isRowHeader: true,
    sortingField: "ImageId",
    cell: (item) => item.ImageId,
  },
  {
    id: "name",
    header: "Name",
    sortingField: "Name",
    cell: (item) => <TruncatedText>{item.Name || "—"}</TruncatedText>,
  },
  {
    id: "status",
    header: "Status",
    sortingField: "State",
    cell: (item) => (
      <StatusIndicator type={getStateType(item.State)}>{item.State || "—"}</StatusIndicator>
    ),
  },
  { id: "source", header: "Source", cell: (item) => getSourceLabel(item) },
  {
    id: "architecture",
    header: "Architecture",
    sortingField: "Architecture",
    cell: (item) => item.Architecture || "—",
  },
  {
    id: "creationDate",
    header: "Creation date",
    sortingField: "CreationDate",
    cell: (item) => formatDate(item.CreationDate),
  },
];

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AMICopyPage() {
  const router = useRouter();
  const prefillImageId = useQueryParam("imageId");

  const [stepIndex, setStepIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdImageId, setCreatedImageId] = useState<string | null>(null);

  // Step 1 — source selection
  const [regions, setRegions] = useState<RegionInfo[]>([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [regionsError, setRegionsError] = useState<string | null>(null);
  const [regionsRetry, setRegionsRetry] = useState(0);
  const [sourceRegion, setSourceRegion] = useState<SelectProps.Option | null>({
    value: CURRENT_REGION,
    label: `${CURRENT_REGION} (current region)`,
  });
  const [owner, setOwner] = useState<SelectProps.Option | null>(OWNER_OPTIONS[0]);
  const [images, setImages] = useState<AMI[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [imagesRetry, setImagesRetry] = useState(0);
  const [selectedImages, setSelectedImages] = useState<AMI[]>([]);
  const [sourceError, setSourceError] = useState<string | null>(null);

  // Step 2 — configure
  const [encrypted, setEncrypted] = useState(false);
  const [kmsKeys, setKmsKeys] = useState<KmsKeyInfo[]>([]);
  const [kmsLoading, setKmsLoading] = useState(false);
  const [kmsError, setKmsError] = useState<string | null>(null);
  const [kmsRetry, setKmsRetry] = useState(0);
  const [kmsChoice, setKmsChoice] = useState<SelectProps.Option | null>(DEFAULT_KMS_OPTION);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [description, setDescription] = useState("");

  // Step 3 — tags
  const [tags, setTags] = useState<Tag[]>([]);

  // ── Data loading ─────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      setRegionsLoading(true);
    });
    queueMicrotask(() => {
      setRegionsError(null);
    });
    amiGet({ action: "listRegions" })
      .then((data) => {
        if (!cancelled) setRegions(data.regions ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setRegionsError(err instanceof Error ? err.message : "Failed to fetch regions");
      })
      .finally(() => {
        if (!cancelled) setRegionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [regionsRetry]);

  const regionValue = sourceRegion?.value;
  const ownerValue = owner?.value;

  useEffect(() => {
    if (!regionValue) return;
    let cancelled = false;
    queueMicrotask(() => {
      setImagesLoading(true);
    });
    queueMicrotask(() => {
      setImagesError(null);
    });
    amiGet({ action: "describeImages", region: regionValue, owners: ownerValue })
      .then((data) => {
        if (!cancelled) {
          setImages(data.images ?? []);
          setImagesLoaded(true);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setImagesError(err instanceof Error ? err.message : "Failed to fetch images");
      })
      .finally(() => {
        if (!cancelled) setImagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [regionValue, ownerValue, imagesRetry]);

  // Load KMS keys the first time encryption is enabled.
  useEffect(() => {
    if (!encrypted || kmsKeys.length > 0) return;
    let cancelled = false;
    queueMicrotask(() => {
      setKmsLoading(true);
    });
    queueMicrotask(() => {
      setKmsError(null);
    });
    amiGet({ action: "listKmsKeys" })
      .then((data) => {
        if (!cancelled) setKmsKeys(data.keys ?? []);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setKmsError(err instanceof Error ? err.message : "Failed to fetch KMS keys");
      })
      .finally(() => {
        if (!cancelled) setKmsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [encrypted, kmsKeys.length, kmsRetry]);

  // Apply the preselected image (?imageId=…) once its row is available.
  useEffect(() => {
    if (!prefillImageId || selectedImages.length > 0) return;
    const match = images.find((image) => image.ImageId === prefillImageId);
    if (match) {
      queueMicrotask(() => {
        setSelectedImages([match]);
      });
      queueMicrotask(() => {
        setNewName((prev) => prev || `${match.Name ?? match.ImageId}-copy`);
      });
    }
  }, [prefillImageId, images, selectedImages.length]);

  const prefillMissing =
    Boolean(prefillImageId) &&
    imagesLoaded &&
    images.length > 0 &&
    selectedImages.length === 0 &&
    !images.some((image) => image.ImageId === prefillImageId);

  const regionOptions = useMemo<SelectProps.Options>(() => {
    const current: SelectProps.Option = {
      value: CURRENT_REGION,
      label: `${CURRENT_REGION} (current region)`,
    };
    const others = regions
      .map((region) => region.RegionName)
      .filter((name): name is string => Boolean(name) && name !== CURRENT_REGION)
      .sort()
      .map((name) => ({ value: name, label: name }));
    return [current, ...others];
  }, [regions]);

  const kmsOptions = useMemo<SelectProps.Options>(
    () => [
      DEFAULT_KMS_OPTION,
      ...kmsKeys
        .filter((key) => Boolean(key.KeyId))
        .map((key) => ({
          value: key.KeyId as string,
          label: key.KeyId as string,
          description: key.Description,
        })),
    ],
    [kmsKeys],
  );

  // ── Validation ───────────────────────────────────────────────────────────

  const validateStep = useCallback(
    (step: number): boolean => {
      if (step === 0) {
        if (selectedImages.length !== 1) {
          setSourceError("Select one source image to copy.");
          return false;
        }
        return true;
      }
      if (step === 1) {
        if (!newName.trim()) {
          setNameError("Image name is required");
          return false;
        }
        return true;
      }
      return true;
    },
    [selectedImages.length, newName],
  );

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    const source = selectedImages[0];
    if (!source || !regionValue) return;
    setSubmitting(true);
    setError(null);
    try {
      const mappedTags = tags
        .filter((tag) => tag.key.trim())
        .map((tag) => ({ Key: tag.key.trim(), Value: tag.value }));
      const data = await amiPost({
        action: "copyImage",
        SourceRegion: regionValue,
        SourceImageId: source.ImageId,
        Name: newName.trim(),
        Description: description.trim() || undefined,
        Encrypted: encrypted ? true : undefined,
        KmsKeyId:
          encrypted && kmsChoice?.value && kmsChoice.value !== DEFAULT_KMS_VALUE
            ? kmsChoice.value
            : undefined,
        Tags: mappedTags.length > 0 ? mappedTags : undefined,
      });
      if (!data.imageId) throw new Error("The emulator did not return an image ID");
      setCreatedImageId(data.imageId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to copy image");
    } finally {
      setSubmitting(false);
    }
  }, [selectedImages, regionValue, newName, description, tags, encrypted, kmsChoice]);

  // ── Success screen ───────────────────────────────────────────────────────

  if (createdImageId) {
    return (
      <Box padding="m">
        <SpaceBetween size="l">
          <Header variant="h1">Copy image</Header>
          <Alert type="success" statusIconAriaLabel="Success">
            Image copy started. The new image{" "}
            <Box variant="span" fontWeight="bold">
              {createdImageId}
            </Box>{" "}
            is being created and will be available once its state is “available”.
          </Alert>
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="primary"
              formAction="none"
              onClick={() => router.push(`/ami/${createdImageId}`)}
            >
              View new image
            </Button>
            <Button formAction="none" onClick={() => router.push("/ami")}>
              Back to AMIs
            </Button>
          </SpaceBetween>
        </SpaceBetween>
      </Box>
    );
  }

  // ── Wizard steps ─────────────────────────────────────────────────────────

  const selected = selectedImages[0];
  const encryptionLabel = !encrypted
    ? "No (unencrypted copy)"
    : kmsChoice?.value && kmsChoice.value !== DEFAULT_KMS_VALUE
      ? `Yes — ${kmsChoice.label}`
      : "Yes — aws/ebs (default)";

  const wizardSteps = [
    {
      title: "Select source image",
      description: "Choose the source region and the image to copy.",
      content: (
        <SpaceBetween size="l">
          <FormField
            label="Source region"
            constraintText="The region the source image lives in. The copy is created in your current region."
          >
            <Select
              selectedOption={sourceRegion}
              onChange={({ detail }) => {
                setSourceRegion(detail.selectedOption as SelectProps.Option | null);
                setSelectedImages([]);
                setSourceError(null);
              }}
              options={regionOptions}
              filteringType="auto"
              disabled={regionsLoading && regions.length === 0}
              ariaLabel="Source region"
            />
          </FormField>

          {regionsError && (
            <Alert
              type="error"
              dismissible
              onDismiss={() => setRegionsError(null)}
              action={
                <Button formAction="none" onClick={() => setRegionsRetry((n) => n + 1)}>
                  Retry
                </Button>
              }
            >
              {regionsError} — only the current region is available for selection.
            </Alert>
          )}

          <FormField
            label="Owner"
            description="Filters which images are listed from the source region."
          >
            <Select
              selectedOption={owner}
              onChange={({ detail }) => {
                setOwner(detail.selectedOption as SelectProps.Option | null);
                setSelectedImages([]);
                setSourceError(null);
              }}
              options={OWNER_OPTIONS}
              disabled={imagesLoading}
              ariaLabel="Image owner"
            />
          </FormField>

          <Container
            header={
              <Header variant="h3" counter={images.length > 0 ? `(${images.length})` : undefined}>
                Select source image
              </Header>
            }
            className="aws-table-card"
          >
            <SpaceBetween size="s">
              {prefillMissing && (
                <Alert type="info" statusIconAriaLabel="Information">
                  The preselected image {prefillImageId} is not part of the listed images — pick the
                  source image manually.
                </Alert>
              )}

              {imagesError ? (
                <SpaceBetween size="s">
                  <Alert
                    type="error"
                    dismissible
                    onDismiss={() => setImagesError(null)}
                    action={
                      <Button formAction="none" onClick={() => setImagesRetry((n) => n + 1)}>
                        Retry
                      </Button>
                    }
                  >
                    {imagesError}
                  </Alert>
                </SpaceBetween>
              ) : (
                <Table
                  columnDefinitions={SOURCE_COLUMNS}
                  items={images}
                  loading={imagesLoading}
                  loadingText="Loading images..."
                  selectionType="single"
                  selectedItems={selectedImages}
                  onSelectionChange={({ detail }) => {
                    const selection = detail.selectedItems as AMI[];
                    setSelectedImages(selection);
                    setSourceError(null);
                    const match = selection[0];
                    if (match) {
                      setNewName((prev) => prev || `${match.Name ?? match.ImageId}-copy`);
                    }
                  }}
                  trackBy="ImageId"
                  ariaLabels={{ selectionGroupLabel: "Source images" }}
                  empty={
                    <Box textAlign="center" color="inherit">
                      <Box variant="strong" textAlign="center" color="inherit">
                        No images found
                      </Box>
                      <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                        No images match this owner in {regionValue ?? "the source region"}.
                      </Box>
                    </Box>
                  }
                />
              )}
            </SpaceBetween>
          </Container>

          {sourceError && (
            <Alert type="error" dismissible onDismiss={() => setSourceError(null)}>
              {sourceError}
            </Alert>
          )}
        </SpaceBetween>
      ),
    },
    {
      title: "Configure image",
      description: "Set encryption, name, and description for the new image.",
      content: (
        <SpaceBetween size="l">
          <Checkbox
            checked={encrypted}
            onChange={({ detail }) => setEncrypted(detail.checked)}
            description="Encrypt the copied image with AWS KMS. Leave disabled to copy without encryption."
          >
            Encrypt this image
          </Checkbox>

          {encrypted && (
            <FormField
              label="KMS key"
              constraintText="Customer managed key used to encrypt the copy."
            >
              <SpaceBetween size="xs">
                {kmsError ? (
                  <Alert
                    type="error"
                    dismissible
                    onDismiss={() => setKmsError(null)}
                    action={
                      <Button formAction="none" onClick={() => setKmsRetry((n) => n + 1)}>
                        Retry
                      </Button>
                    }
                  >
                    {kmsError}
                  </Alert>
                ) : (
                  <Select
                    selectedOption={kmsChoice}
                    onChange={({ detail }) =>
                      setKmsChoice(detail.selectedOption as SelectProps.Option | null)
                    }
                    options={kmsOptions}
                    filteringType="auto"
                    disabled={kmsLoading}
                    ariaLabel="KMS key"
                  />
                )}
                {kmsLoading && (
                  <Box variant="small" color="text-body-secondary">
                    Loading KMS keys…
                  </Box>
                )}
                {!kmsLoading && !kmsError && kmsKeys.length === 0 && (
                  <Box variant="small" color="text-body-secondary">
                    No customer managed keys found — the AWS managed aws/ebs key is used.
                  </Box>
                )}
              </SpaceBetween>
            </FormField>
          )}

          <FormField
            label="Name"
            constraintText="Required. The name of the new image."
            errorText={nameError}
          >
            <Input
              value={newName}
              onChange={({ detail }) => {
                setNewName(detail.value);
                setNameError(undefined);
              }}
              placeholder="my-image-copy"
              ariaLabel="New image name"
            />
          </FormField>

          <FormField label="Description" description="Optional. Stored with the new image.">
            <Input
              value={description}
              onChange={({ detail }) => setDescription(detail.value)}
              ariaLabel="Image description"
            />
          </FormField>
        </SpaceBetween>
      ),
    },
    {
      title: "Tags",
      description: "Optional tags to apply to the new image.",
      content: (
        <FormField label="Tags" description="Add metadata to the new image.">
          <TagEditor tags={tags} onChange={setTags} />
        </FormField>
      ),
    },
    {
      title: "Review",
      description: "Review the copy configuration before creating the image.",
      content: (
        <Container header={<Header variant="h3">Review summary</Header>}>
          <ColumnLayout columns={3} variant="default">
            <div>
              <Box variant="small" color="text-label">
                Source region
              </Box>
              <Box>{regionValue || "—"}</Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Source image
              </Box>
              <Box>
                {selected ? (
                  <>
                    <Box variant="span" fontWeight="bold">
                      {selected.ImageId}
                    </Box>
                    <br />
                    <TruncatedText>{selected.Name || "—"}</TruncatedText>
                  </>
                ) : (
                  "—"
                )}
              </Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Owner
              </Box>
              <Box>{owner?.label ?? "—"}</Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Encryption
              </Box>
              <Box>{encryptionLabel}</Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                New name
              </Box>
              <Box>{newName.trim() || "—"}</Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Description
              </Box>
              <Box>
                <TruncatedText>{description.trim() || "—"}</TruncatedText>
              </Box>
            </div>
            <div>
              <Box variant="small" color="text-label">
                Tags
              </Box>
              <Box>
                {tags.filter((tag) => tag.key.trim()).length > 0
                  ? tags
                      .filter((tag) => tag.key.trim())
                      .map((tag) => `${tag.key}=${tag.value}`)
                      .join(", ")
                  : "None"}
              </Box>
            </div>
          </ColumnLayout>
        </Container>
      ),
    },
  ];

  return (
    <Box padding="m">
      <SpaceBetween size="l">
        <Header
          variant="h2"
          actions={
            <Button formAction="none" onClick={() => router.push("/ami")}>
              Back to AMIs
            </Button>
          }
        >
          Copy image
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container>
          <Wizard
            steps={wizardSteps}
            activeStepIndex={stepIndex}
            onNavigate={({ detail }) => {
              if (detail.requestedStepIndex > stepIndex && !validateStep(stepIndex)) return;
              setStepIndex(detail.requestedStepIndex);
            }}
            onCancel={() => router.push("/ami")}
            onSubmit={() => void handleCopy()}
            submitButtonText={submitting ? "Copying…" : "Copy image"}
            i18nStrings={{
              stepNumberLabel: (stepNumber: number) => `Step ${stepNumber}`,
              navigationAriaLabel: "Copy image wizard navigation",
              nextButton: "Next",
              previousButton: "Previous",
              cancelButton: "Cancel",
            }}
          />
        </Container>
      </SpaceBetween>
    </Box>
  );
}
