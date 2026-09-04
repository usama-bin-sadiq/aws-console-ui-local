"use client";

import React, { useEffect, useState, useCallback } from "react";
import Header from "@cloudscape-design/components/header";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select, { SelectProps } from "@cloudscape-design/components/select";
import Textarea from "@cloudscape-design/components/textarea";
import Alert from "@cloudscape-design/components/alert";
import Link from "@cloudscape-design/components/link";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { AWACS_DESIGN_TOKENS } from "@/constants/design-tokens";

interface KMSKeyData {
  KeyId?: string;
  Alias?: string;
  KeyUsage?: string;
  KeyState?: string;
  KeySpec?: string;
  Description?: string;
  Arn?: string;
  CreationDate?: string;
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<KMSKeyData>[] = [
  {
    id: "alias",
    header: "Alias",
    cell: (item) => (item.Alias && item.Alias !== "—" ? <Link href="#">{item.Alias}</Link> : "—"),
    sortingField: "Alias",
    isRowHeader: true,
  },
  {
    id: "keyId",
    header: "Key ID",
    cell: (item) => item.KeyId || "—",
    sortingField: "KeyId",
  },
  {
    id: "keyUsage",
    header: "Key usage",
    cell: (item) => item.KeyUsage || "—",
    sortingField: "KeyUsage",
  },
  {
    id: "keySpec",
    header: "Key spec",
    cell: (item) => item.KeySpec || "—",
    sortingField: "KeySpec",
  },
  {
    id: "state",
    header: "State",
    cell: (item) => {
      const state = item.KeyState || "Enabled";
      const type = state === "Enabled" ? "success" : state === "Disabled" ? "warning" : state === "PendingDeletion" ? "error" : "info";
      return <StatusIndicator type={type as any}>{state}</StatusIndicator>;
    },
    sortingField: "KeyState",
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
          onClick={() => handleRowEnableDisable(item)}
          formAction="none"
          ariaLabel={`${item.KeyState === "Enabled" ? "Disable" : "Enable"} key ${item.KeyId}`}
        >
          {item.KeyState === "Enabled" ? "Disable" : "Enable"}
        </Button>
        <Button
          onClick={() => handleRowScheduleDeletion(item)}
          formAction="none"
          ariaLabel={`Schedule deletion for key ${item.KeyId}`}
        >
          Delete
        </Button>
        <Button
          onClick={() => handleRowCreateAlias(item)}
          formAction="none"
          ariaLabel={`Create alias for key ${item.KeyId}`}
        >
          Alias
        </Button>
        <Button
          onClick={() => handleRowViewPolicy(item)}
          formAction="none"
          ariaLabel={`View policy for key ${item.KeyId}`}
        >
          Policy
        </Button>
      </SpaceBetween>
    ),
  },
];

const VISIBLE_COLUMNS = ["alias", "keyId", "keyUsage", "keySpec", "state", "description", "actions"];

function handleRowEnableDisable(item: KMSKeyData) {
  const eventName = item.KeyState === "Enabled" ? "kms-disable" : "kms-enable";
  window.dispatchEvent(new CustomEvent(eventName, { detail: item.KeyId }));
}

function handleRowScheduleDeletion(item: KMSKeyData) {
  window.dispatchEvent(new CustomEvent("kms-schedule-deletion", { detail: item.KeyId }));
}

function handleRowCreateAlias(item: KMSKeyData) {
  window.dispatchEvent(new CustomEvent("kms-create-alias", { detail: item.KeyId }));
}

function handleRowViewPolicy(item: KMSKeyData) {
  window.dispatchEvent(new CustomEvent("kms-view-policy", { detail: item.KeyId }));
}

export default function KmsPage() {
  const [keys, setKeys] = useState<KMSKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<KMSKeyData[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [preferences, setPreferences] = useState({
    pageSize: 25,
    visibleContent: VISIBLE_COLUMNS,
  });

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [aliasModal, setAliasModal] = useState(false);
  const [policyModal, setPolicyModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);

  const [createDescription, setCreateDescription] = useState("");
  const [createUsage, setCreateUsage] = useState<SelectProps.Option>({ value: "ENCRYPT_DECRYPT", label: "Encrypt/Decrypt" });
  const [createSpec, setCreateSpec] = useState<SelectProps.Option>({ value: "SYMMETRIC_DEFAULT", label: "SYMMETRIC_DEFAULT" });

  const [aliasName, setAliasName] = useState("");
  const [aliasTargetKeyId, setAliasTargetKeyId] = useState("");

  const [policyKeyId, setPolicyKeyId] = useState("");
  const [policyText, setPolicyText] = useState("{}");

  const [deleteKeyId, setDeleteKeyId] = useState("");
  const [deleteWindow, setDeleteWindow] = useState(30);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kms");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setKeys(data.keys || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch KMS keys");
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  useEffect(() => {
    const onEnable = async (e: Event) => {
      const keyId = (e as CustomEvent).detail as string;
      try {
        await fetch("/api/kms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "enable", keyId }),
        });
        fetchKeys();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Enable failed");
      }
    };
    const onDisable = async (e: Event) => {
      const keyId = (e as CustomEvent).detail as string;
      try {
        await fetch("/api/kms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "disable", keyId }),
        });
        fetchKeys();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Disable failed");
      }
    };
    const onSchedule = async (e: Event) => {
      const keyId = (e as CustomEvent).detail as string;
      setDeleteKeyId(keyId);
      setDeleteWindow(30);
      setDeleteModal(true);
    };
    const onAliasOpen = (e: Event) => {
      const keyId = (e as CustomEvent).detail as string;
      setAliasTargetKeyId(keyId);
      setAliasName("");
      setAliasModal(true);
    };
    const onPolicyOpen = async (e: Event) => {
      const keyId = (e as CustomEvent).detail as string;
      setPolicyKeyId(keyId);
      try {
        const res = await fetch("/api/kms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getPolicy", keyId }),
        });
        const data = await res.json();
        setPolicyText(data.policy ? JSON.stringify(data.policy, null, 2) : "{}");
      } catch {
        setPolicyText("{}");
      }
      setPolicyModal(true);
    };

    window.addEventListener("kms-enable", onEnable);
    window.addEventListener("kms-disable", onDisable);
    window.addEventListener("kms-schedule-deletion", onSchedule);
    window.addEventListener("kms-create-alias", onAliasOpen);
    window.addEventListener("kms-view-policy", onPolicyOpen);
    return () => {
      window.removeEventListener("kms-enable", onEnable);
      window.removeEventListener("kms-disable", onDisable);
      window.removeEventListener("kms-schedule-deletion", onSchedule);
      window.removeEventListener("kms-create-alias", onAliasOpen);
      window.removeEventListener("kms-view-policy", onPolicyOpen);
    };
  }, [fetchKeys]);

  const handleCreateKey = async () => {
    try {
      const res = await fetch("/api/kms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createKey",
          description: createDescription,
          keyUsage: createUsage.value,
          keySpec: createSpec.value,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCreateModal(false);
      setCreateDescription("");
      fetchKeys();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Create key failed");
    }
  };

  const handleCreateAlias = async () => {
    try {
      const res = await fetch("/api/kms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createAlias",
          aliasName: aliasName,
          keyId: aliasTargetKeyId,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAliasModal(false);
      setAliasName("");
      setAliasTargetKeyId("");
      fetchKeys();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Create alias failed");
    }
  };

  const handleScheduleDeletion = async () => {
    try {
      const res = await fetch("/api/kms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scheduleDeletion",
          keyId: deleteKeyId,
          pendingWindowInDays: deleteWindow,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDeleteModal(false);
      setDeleteKeyId("");
      fetchKeys();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Schedule deletion failed");
    }
  };

  const handleUpdatePolicy = async () => {
    try {
      // Policy update would use PutKeyPolicy; adapter-level basic support shown
      // Since adapter SDK focuses on reading for now, we show the policy editor
      setPolicyModal(false);
      setPolicyKeyId("");
      setPolicyText("{}");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Policy update failed");
    }
  };

  const filteredItems = keys.filter((k) => {
    if (!filteringText.trim()) return true;
    const lower = filteringText.toLowerCase();
    return (
      (k.KeyId || "").toLowerCase().includes(lower) ||
      (k.Alias || "").toLowerCase().includes(lower) ||
      (k.Description || "").toLowerCase().includes(lower) ||
      false
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const pagedItems = filteredItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const headerActions = (
    <SpaceBetween direction="horizontal" size="xs">
      <Button iconName="refresh" onClick={fetchKeys} ariaLabel="Refresh keys" />
      <ButtonDropdown
        items={[
          { text: "Enable", id: "enable", disabled: selectedItems.length !== 1 },
          { text: "Disable", id: "disable", disabled: selectedItems.length !== 1 },
          { text: "Schedule deletion", id: "delete", disabled: selectedItems.length !== 1 },
          { text: "Create alias", id: "alias", disabled: selectedItems.length !== 1 },
        ]}
        onItemClick={({ detail }) => {
          if (detail.id === "enable") {
            selectedItems[0]?.KeyState !== "Enabled" && window.dispatchEvent(new CustomEvent("kms-enable", { detail: selectedItems[0]?.KeyId }));
          } else if (detail.id === "disable") {
            selectedItems[0]?.KeyState === "Enabled" && window.dispatchEvent(new CustomEvent("kms-disable", { detail: selectedItems[0]?.KeyId }));
          } else if (detail.id === "delete") {
            window.dispatchEvent(new CustomEvent("kms-schedule-deletion", { detail: selectedItems[0]?.KeyId }));
          } else if (detail.id === "alias") {
            window.dispatchEvent(new CustomEvent("kms-create-alias", { detail: selectedItems[0]?.KeyId }));
          }
        }}
        disabled={selectedItems.length === 0}
        ariaLabel="Bulk actions"
      >
        Actions
      </ButtonDropdown>
      <Button variant="primary" onClick={() => setCreateModal(true)} ariaLabel="Create key">
        Create key
      </Button>
    </SpaceBetween>
  );

  return (
    <ServiceLayout
      serviceName="AWS Key Management Service"
      serviceCategory="Security"
      breadcrumbs={[{ text: "Services", href: "/" }, { text: "Security", href: "#" }, { text: "KMS", href: "#" }]}
      headerActions={headerActions}
    >
      <SpaceBetween size="m" direction="vertical">
        <Container header={<Header variant="h2">Customer managed keys</Header>}>
          {error && (
            <Alert type="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Table
            columnDefinitions={COLUMN_DEFINITIONS}
            items={pagedItems}
            loading={loading}
            loadingText="Loading KMS keys..."
            selectionType="multi"
            selectedItems={selectedItems}
            onSelectionChange={({ detail }) =>
              setSelectedItems(detail.selectedItems as KMSKeyData[])
            }
            trackBy="KeyId"
            sortingColumn={COLUMN_DEFINITIONS[0]}
            sortingDescending={false}
            filter={
              <TextFilter
                filteringText={filteringText}
                filteringPlaceholder="Filter keys by alias, key ID, or description"
                filteringAriaLabel="Filter KMS keys"
                onChange={({ detail }) => {
                  setFilteringText(detail.filteringText);
                  setCurrentPage(1);
                }}
                countText={
                  filteringText
                    ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                    : `${keys.length} keys`
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
                    { value: 10, label: "10 keys" },
                    { value: 25, label: "25 keys" },
                    { value: 50, label: "50 keys" },
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
                <Box variant="strong" textAlign="center" color="inherit">No KMS keys found</Box>
                <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                  {filteringText
                    ? "No keys match your filter. Try a different search."
                    : "To get started, create a KMS key."}
                </Box>
                {!filteringText && <Button onClick={() => setCreateModal(true)}>Create key</Button>}
              </Box>
            }
          />
        </Container>
      </SpaceBetween>

      {/* Create Key Modal */}
      <Modal
        visible={createModal}
        onDismiss={() => setCreateModal(false)}
        header="Create KMS key"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setCreateModal(false)} formAction="none">Cancel</Button>
            <Button variant="primary" onClick={handleCreateKey}>Create</Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Description" constraintText="Optional">
            <Input value={createDescription} onChange={(e) => setCreateDescription(e.detail.value)} placeholder="My encryption key" ariaLabel="Key description" />
          </FormField>
          <FormField label="Key usage">
            <Select
              selectedOption={createUsage}
              onChange={({ detail }) => setCreateUsage(detail.selectedOption)}
              options={[
                { value: "ENCRYPT_DECRYPT", label: "Encrypt/Decrypt" },
                { value: "SIGN_VERIFY", label: "Sign/Verify" },
                { value: "MAC", label: "MAC" },
              ]}
              ariaLabel="Select key usage"
            />
          </FormField>
          <FormField label="Key spec">
            <Select
              selectedOption={createSpec}
              onChange={({ detail }) => setCreateSpec(detail.selectedOption)}
              options={[
                { value: "SYMMETRIC_DEFAULT", label: "SYMMETRIC_DEFAULT" },
                { value: "RSA_2048", label: "RSA_2048" },
                { value: "RSA_3072", label: "RSA_3072" },
                { value: "RSA_4096", label: "RSA_4096" },
              ]}
              ariaLabel="Select key spec"
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      {/* Create Alias Modal */}
      <Modal
        visible={aliasModal}
        onDismiss={() => setAliasModal(false)}
        header="Create alias"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setAliasModal(false)} formAction="none">Cancel</Button>
            <Button variant="primary" onClick={handleCreateAlias}>Create alias</Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Alias name" constraintText="Required">
            <Input value={aliasName} onChange={(e) => setAliasName(e.detail.value)} placeholder="alias/my-key" ariaLabel="Alias name" />
          </FormField>
          <Box>Key: {aliasTargetKeyId}</Box>
        </SpaceBetween>
      </Modal>

      {/* Schedule Deletion Modal */}
      <Modal
        visible={deleteModal}
        onDismiss={() => setDeleteModal(false)}
        header="Schedule key deletion"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setDeleteModal(false)} formAction="none">Cancel</Button>
            <Button variant="primary" onClick={handleScheduleDeletion}>Confirm deletion</Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Pending window (days)" constraintText="7-30 days">
            <Input value={String(deleteWindow)} onChange={(e) => setDeleteWindow(Number(e.detail.value))} type="number" inputMode="numeric" ariaLabel="Pending window days" />
          </FormField>
          <Box>Key ID: {deleteKeyId}</Box>
        </SpaceBetween>
      </Modal>

      {/* Policy Modal */}
      <Modal
        visible={policyModal}
        onDismiss={() => { setPolicyModal(false); setPolicyKeyId(""); setPolicyText("{}"); }}
        header="Key policy"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => { setPolicyModal(false); setPolicyKeyId(""); setPolicyText("{}"); }} formAction="none">Close</Button>
            <Button variant="primary" onClick={handleUpdatePolicy}>Save policy</Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Policy JSON" description="Edit the key policy document">
            <Textarea value={policyText} onChange={(e) => setPolicyText(e.detail.value)} rows={12} ariaLabel="Policy JSON" />
          </FormField>
          <Box>Key ID: {policyKeyId}</Box>
        </SpaceBetween>
      </Modal>
    </ServiceLayout>
  );
}
