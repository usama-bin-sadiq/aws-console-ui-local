"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CodeView } from "@cloudscape-design/code-view";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import Alert from "@cloudscape-design/components/alert";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import RadioGroup from "@cloudscape-design/components/radio-group";
import Textarea from "@cloudscape-design/components/textarea";
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";
import Icon from "@cloudscape-design/components/icon";
import Header from "@cloudscape-design/components/header";
import TruncatedText from "@/components/TruncatedText";
import { KeyPair, KeyPairType, KeyPairFormat, KeyPairApiResponse } from "@/types/key-pair";
import { apiFetch } from "@/lib/api-client";
import DeleteKeyPairModal from "./DeleteKeyPairModal";
import { AwsServiceHeader } from '@/components/ui/AwsServiceHeader';
import { SERVICE_ICONS } from '@/constants/service-icons';

// ─── Constants & helpers ─────────────────────────────────────────────────────

const TYPE_OPTIONS: ReadonlyArray<{ value: KeyPairType; label: string }> = [
  { value: "rsa", label: "RSA (recommended)" },
  { value: "ed25519", label: "ED25519" },
];

const FORMAT_OPTIONS: ReadonlyArray<{ value: KeyPairFormat; label: string }> = [
  { value: "pem", label: ".pem (OpenSSH)" },
  { value: "ppk", label: ".ppk (PuTTY)" },
];

const NAME_PATTERN = /^[A-Za-z0-9_\-.]+$/;
const PAGE_SIZE = 25;

/** Rough shape check for pasted public key material (OpenSSH or PEM). */
function looksLikePublicKey(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.startsWith("-----BEGIN")) return true;
  return /^(ssh-(rsa|ed25519|dss)|ecdsa-sha2-nistp\d+|sk-(ssh-ed25519|ecdsa-sha2-nistp\d+)@openssh\.com)\s+\S+/.test(
    trimmed,
  );
}

function nameError(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return "Key pair name is required";
  if (trimmed.length > 255) return "Must be 255 characters or fewer";
  if (!NAME_PATTERN.test(trimmed)) {
    return "Use only letters, numbers, hyphens, underscores, or periods (no spaces)";
  }
  return undefined;
}

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

const FLASH_STORAGE_KEY = "aws-console:key-pair:flash";

// ─── Page ────────────────────────────────────────────────────────────────────

export default function KeyPairPage() {
  const router = useRouter();
  const [keyPairs, setKeyPairs] = useState<KeyPair[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [successItem, setSuccessItem] = useState<FlashbarProps.MessageDefinition | null>(null);
  const [selectedItems, setSelectedItems] = useState<KeyPair[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Create modal state
  const [createModal, setCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyType, setNewKeyType] = useState<KeyPairType>("rsa");
  const [newKeyFormat, setNewKeyFormat] = useState<KeyPairFormat>("pem");
  const [createSubmitted, setCreateSubmitted] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  // Private key material — held only in memory, shown once, never re-fetchable.
  const [createdKey, setCreatedKey] = useState<{
    name: string;
    format: KeyPairFormat;
    material: string;
  } | null>(null);

  // Import modal state
  const [importModal, setImportModal] = useState(false);
  const [importKeyName, setImportKeyName] = useState("");
  const [importPublicKey, setImportPublicKey] = useState("");
  const [importFormat, setImportFormat] = useState<KeyPairFormat>("pem");
  const [importSubmitted, setImportSubmitted] = useState(false);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedKey, setImportedKey] = useState<{ name: string; fingerprint: string } | null>(
    null,
  );

  // Delete confirmation (typed, one at a time)
  const [deleteQueue, setDeleteQueue] = useState<KeyPair[]>([]);
  const [deleteTotal, setDeleteTotal] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const showSuccess = useCallback((content: string) => {
    setSuccessItem({
      id: "success",
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

  // Success message handed over by the detail page after a delete
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(FLASH_STORAGE_KEY);
      if (pending) {
        sessionStorage.removeItem(FLASH_STORAGE_KEY);
        showSuccess(pending);
      }
    } catch {
      // sessionStorage unavailable — nothing to show
    }
  }, [showSuccess]);

  const fetchKeyPairs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await postKeyPair({ action: "describeKeyPairs" });
      setKeyPairs(data.keyPairs || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch key pairs");
      setKeyPairs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeyPairs();
  }, [fetchKeyPairs]);

  // ── Create key pair ─────────────────────────────────────────────────────────

  const createNameError = createSubmitted ? nameError(newKeyName) : undefined;

  const validateCreateForm = useCallback((): boolean => {
    setCreateSubmitted(true);
    return nameError(newKeyName) === undefined;
  }, [newKeyName]);

  const handleCreate = useCallback(async () => {
    if (!validateCreateForm()) return;
    setCreateSubmitting(true);
    setCreateError(null);
    try {
      const data = await postKeyPair({
        action: "createKeyPair",
        keyName: newKeyName.trim(),
        keyType: newKeyType,
        keyFormat: newKeyFormat,
      });
      const material = data.keyPair?.KeyMaterial;
      if (!material) throw new Error("The emulator did not return the private key material");
      setCreatedKey({ name: newKeyName.trim(), format: newKeyFormat, material });
      await fetchKeyPairs();
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create key pair");
    } finally {
      setCreateSubmitting(false);
    }
  }, [validateCreateForm, newKeyName, newKeyType, newKeyFormat, fetchKeyPairs]);

  const closeCreateModal = useCallback(() => {
    setCreateModal(false);
    setNewKeyName("");
    setNewKeyType("rsa");
    setNewKeyFormat("pem");
    setCreateSubmitted(false);
    setCreateError(null);
    setCreateSubmitting(false);
    setCreatedKey(null);
  }, []);

  // ── Import key pair ─────────────────────────────────────────────────────────

  const importNameError = importSubmitted ? nameError(importKeyName) : undefined;
  const importKeyError =
    importPublicKey.trim().length > 0 && !looksLikePublicKey(importPublicKey)
      ? "Enter a valid public key (for example, ssh-rsa AAAAB3NzaC1yc2E...)"
      : importSubmitted && importPublicKey.trim().length === 0
        ? "Public key is required"
        : undefined;

  const validateImportForm = useCallback((): boolean => {
    setImportSubmitted(true);
    return nameError(importKeyName) === undefined && looksLikePublicKey(importPublicKey);
  }, [importKeyName, importPublicKey]);

  const handleImport = useCallback(async () => {
    if (!validateImportForm()) return;
    setImportSubmitting(true);
    setImportError(null);
    try {
      const data = await postKeyPair({
        action: "importKeyPair",
        keyName: importKeyName.trim(),
        publicKeyMaterial: btoa(importPublicKey.trim()),
        keyFormat: importFormat,
      });
      setImportedKey({
        name: importKeyName.trim(),
        fingerprint: data.keyPair?.KeyFingerprint || "—",
      });
      await fetchKeyPairs();
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : "Failed to import key pair");
    } finally {
      setImportSubmitting(false);
    }
  }, [validateImportForm, importKeyName, importPublicKey, importFormat, fetchKeyPairs]);

  const closeImportModal = useCallback(() => {
    setImportModal(false);
    setImportKeyName("");
    setImportPublicKey("");
    setImportFormat("pem");
    setImportSubmitted(false);
    setImportSubmitting(false);
    setImportError(null);
    setImportedKey(null);
  }, []);

  // ── Delete key pair (typed confirmation) ────────────────────────────────────

  const openDelete = useCallback((targets: KeyPair[]) => {
    if (targets.length === 0) return;
    setDeleteError(null);
    setDeleteQueue(targets);
    setDeleteTotal(targets.length);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = deleteQueue[0];
    if (!target?.KeyName) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await postKeyPair({ action: "deleteKeyPair", keyName: target.KeyName });
      const remaining = deleteQueue.slice(1);
      setDeleteQueue(remaining);
      if (remaining.length === 0) {
        showSuccess(
          deleteTotal === 1
            ? `Key pair "${target.KeyName}" deleted.`
            : `${deleteTotal} key pairs deleted.`,
        );
        setSelectedItems([]);
        await fetchKeyPairs();
      }
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete key pair");
      setDeleteQueue([]);
      await fetchKeyPairs();
    } finally {
      setDeleting(false);
    }
  }, [deleteQueue, deleteTotal, fetchKeyPairs, showSuccess]);

  // ── Table data ──────────────────────────────────────────────────────────────

  const filteredItems = useMemo(() => {
    if (!filteringText.trim()) return keyPairs;
    const lower = filteringText.toLowerCase();
    return keyPairs.filter(
      (kp) =>
        kp.KeyName?.toLowerCase().includes(lower) ||
        kp.KeyPairId?.toLowerCase().includes(lower) ||
        kp.KeyFingerprint?.toLowerCase().includes(lower) ||
        kp.KeyType?.toLowerCase().includes(lower),
    );
  }, [keyPairs, filteringText]);

  const columnDefinitions = useMemo<TableProps.ColumnDefinition<KeyPair>[]>(
    () => [
      {
        id: "name",
        header: "Key pair name",
        isRowHeader: true,
        sortingField: "KeyName",
        cell: (item) => (
          <Button
            variant="link"
            formAction="none"
            onClick={() => router.push(`/key-pair/${encodeURIComponent(item.KeyName || "")}`)}
          >
            {item.KeyName || "—"}
          </Button>
        ),
      },
      {
        id: "id",
        header: "Key pair ID",
        sortingField: "KeyPairId",
        cell: (item) => <TruncatedText>{item.KeyPairId || "—"}</TruncatedText>,
      },
      {
        id: "type",
        header: "Type",
        sortingField: "KeyType",
        cell: (item) => item.KeyType || "rsa",
      },
      {
        id: "fingerprint",
        header: "Fingerprint",
        cell: (item) => (
          <Box variant="code">
            <TruncatedText>{item.KeyFingerprint || "—"}</TruncatedText>
          </Box>
        ),
      },
      {
        id: "created",
        header: "Created",
        sortingField: "CreateTime",
        cell: (item) => (item.CreateTime ? new Date(item.CreateTime).toLocaleString() : "—"),
      },
      {
        id: "actions",
        header: "Actions",
        cell: (item) => (
          <ButtonDropdown
            variant="icon"
            ariaLabel={`Actions for key pair ${item.KeyName || ""}`}
            items={[
              { id: "details", text: "View details" },
              { id: "delete", text: "Delete" },
            ]}
            onItemClick={({ detail }) => {
              if (detail.id === "details") {
                router.push(`/key-pair/${encodeURIComponent(item.KeyName || "")}`);
              } else if (detail.id === "delete") {
                openDelete([item]);
              }
            }}
          />
        ),
      },
    ],
    [router, openDelete],
  );

  const pagedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // ── Download private key ────────────────────────────────────────────────────

  const downloadKey = useCallback(() => {
    if (!createdKey) return;
    const extension = createdKey.format === "ppk" ? ".ppk" : ".pem";
    const blob = new Blob([createdKey.material], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${createdKey.name}${extension}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [createdKey]);

  const openCreateModal = () => {
    closeImportModal();
    setCreateModal(true);
  };

  const openImportModal = () => {
    closeCreateModal();
    setImportModal(true);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Box padding="m">
      <SpaceBetween size="l">
        <AwsServiceHeader
          serviceName="Key Pair"
          serviceIcon={SERVICE_ICONS["/key-pair"]?.small}
          counter={keyPairs?.length ?? 0}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/key-pair/create")}
            >
              Create key pair
            </button>
          }
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successItem && <Flashbar items={[successItem]} />}

        <Table
          columnDefinitions={columnDefinitions}
          items={pagedItems}
          loading={loading}
          loadingText="Loading key pairs..."
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems as KeyPair[])}
          trackBy="KeyName"
          filter={
            <TextFilter
              filteringText={filteringText}
              filteringPlaceholder="Filter key pairs"
              filteringAriaLabel="Filter key pairs"
              onChange={({ detail }) => {
                setFilteringText(detail.filteringText);
                setCurrentPage(1);
              }}
              countText={
                filteringText
                  ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                  : `${keyPairs.length} key pairs`
              }
            />
          }
          pagination={
            <Pagination
              currentPageIndex={currentPage}
              pagesCount={Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))}
              onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
              ariaLabels={{
                nextPageLabel: "Next page",
                previousPageLabel: "Previous page",
                pageLabel: (n) => `Page ${n}`,
              }}
            />
          }
          empty={
            <Box textAlign="center" color="inherit">
              <Box margin={{ bottom: "s" }}>
                <Icon name="key" size="large" />
              </Box>
              <Box variant="strong" textAlign="center" color="inherit">
                {filteringText ? "No key pairs match your filter" : "No key pairs found"}
              </Box>
              <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                {filteringText
                  ? "No key pairs match your filter. Try a different search."
                  : "Create a key pair to connect to your EC2 instances."}
              </Box>
              {!filteringText && (
                <SpaceBetween direction="horizontal" size="xs">
                  <Button variant="primary" onClick={openCreateModal}>
                    Create key pair
                  </Button>
                  <Button onClick={openImportModal}>Import key pair</Button>
                </SpaceBetween>
              )}
            </Box>
          }
        />
      </SpaceBetween>

      {/* Create Key Pair Modal */}
      <Modal
        visible={createModal}
        onDismiss={closeCreateModal}
        header="Create key pair"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={closeCreateModal} formAction="none" disabled={createSubmitting}>
              {createdKey ? "Close" : "Cancel"}
            </Button>
            {createdKey ? (
              <Button variant="primary" onClick={downloadKey}>
                Download {createdKey.format === "ppk" ? ".ppk" : ".pem"} file
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={createSubmitting}
                loading={createSubmitting}
              >
                Create key pair
              </Button>
            )}
          </SpaceBetween>
        }
      >
        {createdKey ? (
          <SpaceBetween size="m">
            <Alert type="warning" statusIconAriaLabel="Warning">
              <Box variant="strong">Private key file</Box>
              <Box>
                You won&apos;t be able to download this again. Store the private key in a secure
                location.
              </Box>
            </Alert>
            <Container
              header={
                <Header variant="h3">
                  {createdKey.name}.{createdKey.format}
                </Header>
              }
            >
              <CodeView content={createdKey.material} lineNumbers wrapLines />
            </Container>
          </SpaceBetween>
        ) : (
          <SpaceBetween size="m">
            {createError && <Alert type="error">{createError}</Alert>}
            <FormField
              label="Name"
              constraintText="Required. Up to 255 characters; letters, numbers, hyphens, underscores, and periods only."
              errorText={createNameError}
            >
              <Input
                value={newKeyName}
                onChange={({ detail }) => {
                  setNewKeyName(detail.value);
                  setCreateSubmitted(true);
                }}
                placeholder="Enter key pair name"
                invalid={createNameError !== undefined}
                ariaLabel="Key pair name"
              />
            </FormField>
            <FormField
              label="Key pair type"
              constraintText="RSA is recommended for most use cases. ED25519 provides better security with smaller keys."
            >
              <RadioGroup
                value={newKeyType}
                onChange={({ detail }) => setNewKeyType(detail.value as KeyPairType)}
                items={TYPE_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
              />
            </FormField>
            <FormField
              label="Private key file format"
              constraintText="Choose .pem for OpenSSH (Linux/macOS) or .ppk for PuTTY (Windows)."
            >
              <Select
                selectedOption={
                  FORMAT_OPTIONS.find((opt) => opt.value === newKeyFormat) ?? FORMAT_OPTIONS[0]
                }
                onChange={({ detail }) =>
                  setNewKeyFormat(detail.selectedOption.value as KeyPairFormat)
                }
                options={FORMAT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                ariaLabel="Private key file format"
              />
            </FormField>
          </SpaceBetween>
        )}
      </Modal>

      {/* Import Key Pair Modal */}
      <Modal
        visible={importModal}
        onDismiss={closeImportModal}
        header="Import key pair"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={closeImportModal} formAction="none" disabled={importSubmitting}>
              {importedKey ? "Close" : "Cancel"}
            </Button>
            {!importedKey && (
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={importSubmitting}
                loading={importSubmitting}
              >
                Import key pair
              </Button>
            )}
          </SpaceBetween>
        }
      >
        {importedKey ? (
          <SpaceBetween size="m">
            <Alert type="success">Key pair imported successfully.</Alert>
            <Container header={<Header variant="h3">Fingerprint</Header>}>
              <Box variant="code">{importedKey.fingerprint}</Box>
            </Container>
            <Box>
              Key pair{" "}
              <Box variant="span" fontWeight="bold">
                {importedKey.name}
              </Box>{" "}
              is ready to use.
            </Box>
          </SpaceBetween>
        ) : (
          <SpaceBetween size="m">
            {importError && <Alert type="error">{importError}</Alert>}
            <FormField
              label="Name"
              constraintText="Required. Up to 255 characters; letters, numbers, hyphens, underscores, and periods only."
              errorText={importNameError}
            >
              <Input
                value={importKeyName}
                onChange={({ detail }) => {
                  setImportKeyName(detail.value);
                  setImportSubmitted(true);
                }}
                placeholder="Enter key pair name"
                invalid={importNameError !== undefined}
                ariaLabel="Key pair name"
              />
            </FormField>
            <FormField
              label="Public key"
              description="Paste the contents of your public key file (.pub)."
              constraintText="Required. For example: ssh-rsa AAAAB3NzaC1yc2E... user@example.com"
              errorText={importKeyError}
            >
              <Textarea
                value={importPublicKey}
                onChange={({ detail }) => setImportPublicKey(detail.value)}
                placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC..."
                rows={6}
                ariaLabel="Public key material"
                invalid={importKeyError !== undefined}
              />
            </FormField>
            <FormField
              label="Private key file format"
              constraintText="The format of the private key file you hold for this key pair."
            >
              <Select
                selectedOption={
                  FORMAT_OPTIONS.find((opt) => opt.value === importFormat) ?? FORMAT_OPTIONS[0]
                }
                onChange={({ detail }) =>
                  setImportFormat(detail.selectedOption.value as KeyPairFormat)
                }
                options={FORMAT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                ariaLabel="Private key file format"
              />
            </FormField>
          </SpaceBetween>
        )}
      </Modal>

      {/* Delete Confirmation Modal (typed, AWS copy) */}
      {deleteQueue.length > 0 && (
        <DeleteKeyPairModal
          visible
          keyName={deleteQueue[0].KeyName || ""}
          onConfirm={handleConfirmDelete}
          onDismiss={() => {
            setDeleteQueue([]);
            setDeleteError(null);
          }}
          loading={deleting}
          error={deleteError}
        />
      )}
    </Box>
  );
}
