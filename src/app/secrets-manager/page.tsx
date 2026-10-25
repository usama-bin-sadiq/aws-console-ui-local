"use client";

import { apiFetch } from "@/lib/api-client";
import { useEffect, useState, useCallback } from "react";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select, { SelectProps } from "@cloudscape-design/components/select";
import Textarea from "@cloudscape-design/components/textarea";
import Alert from "@cloudscape-design/components/alert";
import { useRouter } from "next/navigation";
import Link from "@cloudscape-design/components/link";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

interface SecretData {
  SecretName?: string;
  KmsKeyId?: string;
  SecretString?: string;
  Description?: string;
  RotationEnabled?: boolean;
  LastRotated?: string;
  ARN?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<SecretData>[] = [
  {
    id: "name",
    header: "Secret name",
    cell: (item) => (item.SecretName ? <Link href="#">{item.SecretName}</Link> : "—"),
    sortingField: "SecretName",
    isRowHeader: true,
  },
  {
    id: "kmsKey",
    header: "KMS key",
    cell: (item) => item.KmsKeyId || "—",
    sortingField: "KmsKeyId",
  },
  {
    id: "rotation",
    header: "Rotation",
    cell: (item) => {
      const enabled = item.RotationEnabled ?? false;
      return (
        <StatusIndicator type={enabled ? "success" : "info"}>
          {enabled ? "Enabled" : "Disabled"}
        </StatusIndicator>
      );
    },
    sortingField: "RotationEnabled",
  },
  {
    id: "description",
    header: "Description",
    cell: (item) => item.Description || "—",
    sortingField: "Description",
  },
  {
    id: "actions",
    header: "Actions",
    cell: (item) => (
      <SpaceBetween direction="horizontal" size="xs">
        <Button
          onClick={() => handleRowView(item)}
          formAction="none"
          ariaLabel={`View value of ${item.SecretName}`}
        >
          View
        </Button>
        <Button
          onClick={() => handleRowRotate(item)}
          formAction="none"
          ariaLabel={`Rotate secret ${item.SecretName}`}
        >
          Rotate
        </Button>
        <Button
          onClick={() => handleRowDelete(item)}
          formAction="none"
          ariaLabel={`Delete secret ${item.SecretName}`}
        >
          Delete
        </Button>
      </SpaceBetween>
    ),
  },
];

const VISIBLE_COLUMNS = ["name", "kmsKey", "rotation", "description", "actions"];

function handleRowView(item: SecretData) {
  window.dispatchEvent(new CustomEvent("secrets-view", { detail: item.SecretName }));
}

function handleRowRotate(item: SecretData) {
  window.dispatchEvent(new CustomEvent("secrets-rotate", { detail: item.SecretName }));
}

function handleRowDelete(item: SecretData) {
  window.dispatchEvent(new CustomEvent("secrets-delete", { detail: item.SecretName }));
}

// Normalize list payloads: a bare array or a wrapper object with an array under
// a known key. Anything else renders [].
function toArray<T = Record<string, unknown>>(d: unknown): T[] {
  if (Array.isArray(d)) return d as T[];
  if (d && typeof d === "object") {
    const o = d as Record<string, unknown>;
    for (const k of ["secrets", "items", "data", "results"]) {
      if (Array.isArray(o[k])) return o[k] as T[];
    }
  }
  return [];
}

export default function SecretsManagerPage() {
  const [secrets, setSecrets] = useState<SecretData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<SecretData[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const router = useRouter();
  const [preferences, setPreferences] = useState({
    pageSize: 25,
    visibleContent: VISIBLE_COLUMNS,
  });

  const [createModal, setCreateModal] = useState(false);
  const [viewModal, setViewModal] = useState(false);
  const [rotateModal, setRotateModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createString, setCreateString] = useState("");
  const [createKmsKey, setCreateKmsKey] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createNameError, setCreateNameError] = useState<string | null>(null);
  const [createStringError, setCreateStringError] = useState<string | null>(null);

  const [viewName, setViewName] = useState("");
  const [viewValue, setViewValue] = useState("");
  const [viewLoading, setViewLoading] = useState(false);

  const [rotateName, setRotateName] = useState("");
  const [rotateLoading, setRotateLoading] = useState(false);

  const [deleteName, setDeleteName] = useState("");

  const fetchSecrets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/secrets-manager");
      const data = await res.json().catch(() => null);
      if (data === null) throw new Error(`Invalid response (HTTP ${res.status})`);
      if (!res.ok || data.error) {
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }
      setSecrets(toArray<SecretData>(data));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch secrets");
      setSecrets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchSecrets();
    });
  }, [fetchSecrets]);

  useEffect(() => {
    const onView = async (e: Event) => {
      const name = (e as CustomEvent).detail as string;
      setViewName(name || "");
      setViewValue("");
      setViewLoading(true);
      setViewModal(true);
      try {
        const res = await apiFetch("/api/secrets-manager", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getValue", secretId: name }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setViewValue(
          data.secret?.SecretString || data.secret?.SecretBinary
            ? "***"
            : JSON.stringify(data.secret || {}, null, 2),
        );
      } catch (err: unknown) {
        setViewValue(err instanceof Error ? err.message : "Failed to retrieve secret value");
      } finally {
        setViewLoading(false);
      }
    };
    const onRotate = async (e: Event) => {
      const name = (e as CustomEvent).detail as string;
      setRotateName(name || "");
      setRotateLoading(true);
      setRotateModal(true);
      try {
        const res = await apiFetch("/api/secrets-manager", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "rotateSecret", secretId: name }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        fetchSecrets();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Rotation failed");
      } finally {
        setRotateLoading(false);
        setRotateModal(false);
      }
    };
    const onDelete = (e: Event) => {
      const name = (e as CustomEvent).detail as string;
      setDeleteName(name || "");
      setDeleteConfirm(true);
    };

    window.addEventListener("secrets-view", onView);
    window.addEventListener("secrets-rotate", onRotate);
    window.addEventListener("secrets-delete", onDelete);
    return () => {
      window.removeEventListener("secrets-view", onView);
      window.removeEventListener("secrets-rotate", onRotate);
      window.removeEventListener("secrets-delete", onDelete);
    };
  }, [fetchSecrets]);

  const handleCreateSecret = async () => {
    let hasError = false;
    if (!createName.trim()) {
      setCreateNameError("Secret name is required");
      hasError = true;
    } else {
      setCreateNameError(null);
    }
    if (!createString.trim()) {
      setCreateStringError("Secret value is required");
      hasError = true;
    } else {
      setCreateStringError(null);
    }
    if (hasError) return;
    try {
      const res = await apiFetch("/api/secrets-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createSecret",
          name: createName,
          secretString: createString,
          kmsKeyId: createKmsKey || undefined,
          description: createDescription || undefined,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCreateModal(false);
      setCreateName("");
      setCreateString("");
      setCreateKmsKey("");
      setCreateDescription("");
      fetchSecrets();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Create secret failed");
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await apiFetch(
        `/api/secrets-manager?secretId=${encodeURIComponent(deleteName)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDeleteConfirm(false);
      setDeleteName("");
      fetchSecrets();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Delete secret failed");
    }
  };

  const filteredItems = secrets.filter((s) => {
    if (!filteringText.trim()) return true;
    const lower = filteringText.toLowerCase();
    return (
      (s.SecretName || "").toLowerCase().includes(lower) ||
      (s.KmsKeyId || "").toLowerCase().includes(lower) ||
      (s.Description || "").toLowerCase().includes(lower) ||
      false
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const headerActions = (
    <SpaceBetween direction="horizontal" size="xs">
      <Button iconName="refresh" onClick={fetchSecrets} ariaLabel="Refresh secrets" />
      <ButtonDropdown
        items={[
          { text: "View value", id: "view", disabled: selectedItems.length === 0 },
          { text: "Rotate", id: "rotate", disabled: selectedItems.length === 0 },
          { text: "Delete", id: "delete", disabled: selectedItems.length === 0 },
        ]}
        onItemClick={({ detail }) => {
          if (selectedItems[0]) {
            if (detail.id === "view") {
              window.dispatchEvent(
                new CustomEvent("secrets-view", { detail: selectedItems[0].SecretName }),
              );
            } else if (detail.id === "rotate") {
              window.dispatchEvent(
                new CustomEvent("secrets-rotate", { detail: selectedItems[0].SecretName }),
              );
            } else if (detail.id === "delete") {
              window.dispatchEvent(
                new CustomEvent("secrets-delete", { detail: selectedItems[0].SecretName }),
              );
            }
          }
        }}
        disabled={selectedItems.length === 0}
        ariaLabel="Bulk actions"
      >
        Actions
      </ButtonDropdown>
      <Button variant="primary" onClick={() => setCreateModal(true)} ariaLabel="Create secret">
        Store new secret
      </Button>
    </SpaceBetween>
  );

  return (
    <ServiceLayout
      serviceName="AWS Secrets Manager"
      showServiceHeader={false}
      serviceCategory="Security"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "Security", href: "#" },
        { text: "Secrets Manager", href: "#" },
      ]}
      headerActions={headerActions}
    >
      <SpaceBetween size="m" direction="vertical">
        <AwsServiceHeader
          serviceName="Secrets Manager"
          serviceIcon={SERVICE_ICONS["/secrets-manager"]?.small}
          counter={secrets.length}
          primaryAction={
            <button
              type="button"
              className="aws-service-page__create"
              onClick={() => router.push("/secrets-manager/create")}
            >
              Store secret
            </button>
          }
          actions={headerActions}
        />

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Table
          columnDefinitions={COLUMN_DEFINITIONS}
          items={pagedItems}
          loading={loading}
          loadingText="Loading secrets..."
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) => setSelectedItems(detail.selectedItems as SecretData[])}
          trackBy="SecretName"
          sortingColumn={COLUMN_DEFINITIONS[0]}
          sortingDescending={false}
          filter={
            <TextFilter
              filteringText={filteringText}
              filteringPlaceholder="Filter secrets"
              filteringAriaLabel="Filter secrets"
              onChange={({ detail }) => {
                setFilteringText(detail.filteringText);
                setCurrentPage(1);
              }}
              countText={
                filteringText
                  ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                  : `${secrets.length} secrets`
              }
            />
          }
          pagination={
            <Pagination
              currentPageIndex={currentPage}
              pagesCount={totalPages}
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
                  { value: 10, label: "10 secrets" },
                  { value: 25, label: "25 secrets" },
                  { value: 50, label: "50 secrets" },
                ],
              }}
              visibleContentPreference={{
                title: "Select visible columns",
                options: [
                  {
                    label: "Columns",
                    options: COLUMN_DEFINITIONS.map((col) => ({
                      id: col.id!,
                      label: (col.header?.toString() ?? col.id!) as string,
                      editable: true,
                    })),
                  },
                ],
              }}
              onConfirm={({ detail }) => {
                setPageSize(detail.pageSize ?? 25);
                setPreferences({
                  pageSize: detail.pageSize ?? 25,
                  visibleContent: (detail.visibleContent as string[]) ?? VISIBLE_COLUMNS,
                });
              }}
            />
          }
          empty={
            <Box textAlign="center" color="inherit">
              <Box variant="strong" textAlign="center" color="inherit">
                No secrets found
              </Box>
              <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                {filteringText
                  ? "No secrets match your filter."
                  : "To get started, create a secret."}
              </Box>
              {!filteringText && (
                <Button onClick={() => setCreateModal(true)}>Store new secret</Button>
              )}
            </Box>
          }
        />
      </SpaceBetween>

      {/* Create Secret Modal */}
      <Modal
        visible={createModal}
        onDismiss={() => setCreateModal(false)}
        header="Store a new secret"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setCreateModal(false)} formAction="none">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateSecret}>
              Store secret
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField
            label={
              <>
                Secret name <span style={{ color: "red" }}>*</span>
              </>
            }
            constraintText="Required"
            errorText={createNameError}
          >
            <Input
              value={createName}
              onChange={(e) => {
                setCreateName(e.detail.value);
                setCreateNameError(null);
              }}
              placeholder="my-secret"
              ariaLabel="Secret name"
            />
          </FormField>
          <FormField
            label={
              <>
                Secret value <span style={{ color: "red" }}>*</span>
              </>
            }
            constraintText="Required"
            errorText={createStringError}
          >
            <Textarea
              value={createString}
              onChange={(e) => {
                setCreateString(e.detail.value);
                setCreateStringError(null);
              }}
              rows={6}
              placeholder="key=value"
              ariaLabel="Secret value"
            />
          </FormField>
          <FormField label="KMS key ID" constraintText="Optional">
            <Input
              value={createKmsKey}
              onChange={(e) => setCreateKmsKey(e.detail.value)}
              placeholder="alias/aws/secretsmanager"
              ariaLabel="KMS key ID"
            />
          </FormField>
          <FormField label="Description" constraintText="Optional">
            <Input
              value={createDescription}
              onChange={(e) => setCreateDescription(e.detail.value)}
              placeholder="My application secret"
              ariaLabel="Secret description"
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* View Value Modal */}
      <Modal
        visible={viewModal}
        onDismiss={() => {
          setViewModal(false);
          setViewName("");
          setViewValue("");
        }}
        header={`Secret value — ${viewName}`}
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              onClick={() => {
                setViewModal(false);
                setViewName("");
                setViewValue("");
              }}
              formAction="none"
            >
              Close
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Secret value">
            {viewLoading ? (
              <Box>Loading...</Box>
            ) : (
              <Textarea
                value={viewValue}
                onChange={(e) => setViewValue(e.detail.value)}
                rows={8}
                readOnly
                ariaLabel="Secret value read-only"
              />
            )}
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* Rotate Modal */}
      <Modal
        visible={rotateModal}
        onDismiss={() => setRotateModal(false)}
        header={`Rotate secret — ${rotateName}`}
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setRotateModal(false)} formAction="none">
              Cancel
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Rotation status">
            <StatusIndicator type={rotateLoading ? "info" : "success"}>
              {rotateLoading ? "Rotating..." : "Rotation triggered"}
            </StatusIndicator>
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        visible={deleteConfirm}
        onDismiss={() => {
          setDeleteConfirm(false);
          setDeleteName("");
        }}
        header="Delete secret"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              onClick={() => {
                setDeleteConfirm(false);
                setDeleteName("");
              }}
              formAction="none"
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmDelete}>
              Confirm delete
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <Box>
            Are you sure you want to delete <strong>{deleteName}</strong>? This action is
            irreversible.
          </Box>
        </SpaceBetween>
      </Modal>
    </ServiceLayout>
  );
}
