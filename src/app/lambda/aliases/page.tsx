"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Select from "@cloudscape-design/components/select";
import type { SelectProps } from "@cloudscape-design/components/select";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import Alert from "@cloudscape-design/components/alert";
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";
import Link from "@cloudscape-design/components/link";
import TruncatedText from "@/components/TruncatedText";
import { apiFetch } from "@/lib/api-client";
import { LambdaAliasConfig, LambdaFunctionConfig, LambdaVersionConfig } from "@/types/lambda";
import { AwsServiceHeader } from "@/components/ui/AwsServiceHeader";
import { SERVICE_ICONS } from "@/constants/service-icons";

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<LambdaAliasConfig>[] = [
  {
    id: "function",
    header: "Function name",
    cell: (item) => (
      <Link href={`/lambda/${encodeURIComponent(item.FunctionName || "")}`}>
        {item.FunctionName || "—"}
      </Link>
    ),
    sortingField: "FunctionName",
    isRowHeader: true,
  },
  {
    id: "alias",
    header: "Alias name",
    cell: (item) => item.AliasName || "—",
    sortingField: "AliasName",
  },
  {
    id: "version",
    header: "Version",
    cell: (item) => item.FunctionVersion || "—",
    sortingField: "FunctionVersion",
  },
  {
    id: "description",
    header: "Description",
    cell: (item) => <TruncatedText>{item.Description || "—"}</TruncatedText>,
    sortingField: "Description",
  },
  {
    id: "arn",
    header: "Alias ARN",
    cell: (item) => <TruncatedText>{item.AliasArn || "—"}</TruncatedText>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: (item) => (
      <ButtonDropdown
        variant="icon"
        ariaLabel={`Actions for alias ${item.AliasName}`}
        items={[
          { text: "View function", id: "view" },
          { text: "Delete", id: "delete" },
        ]}
        onItemClick={({ detail }) => {
          const event = new CustomEvent("alias-row-action", {
            detail: { action: detail.id, alias: item },
          });
          window.dispatchEvent(event);
        }}
      >
        Actions
      </ButtonDropdown>
    ),
  },
];

const VISIBLE_COLUMNS = ["function", "alias", "version", "description", "arn", "actions"];

export default function LambdaAliasesPage() {
  const router = useRouter();
  const [aliases, setAliases] = useState<LambdaAliasConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partialWarning, setPartialWarning] = useState<string | null>(null);
  const [successItem, setSuccessItem] = useState<FlashbarProps.MessageDefinition | null>(null);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [preferences, setPreferences] = useState({ pageSize: 25, visibleContent: VISIBLE_COLUMNS });

  // Create alias state
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [functions, setFunctions] = useState<LambdaFunctionConfig[]>([]);
  const [selectedFunction, setSelectedFunction] = useState<SelectProps.Option | null>(null);
  const [versions, setVersions] = useState<LambdaVersionConfig[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<SelectProps.Option | null>(null);
  const [aliasName, setAliasName] = useState("");
  const [aliasDescription, setAliasDescription] = useState("");
  const [versionsLoading, setVersionsLoading] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<LambdaAliasConfig | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const fetchAliases = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPartialWarning(null);
    try {
      const res = await apiFetch("/api/lambda?action=listAllAliases");
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setAliases(data.aliases || []);
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        setPartialWarning(`Some functions could not be listed: ${data.errors.join("; ")}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch aliases");
      setAliases([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAliases();
  }, [fetchAliases]);

  const openCreate = useCallback(async () => {
    setCreateModal(true);
    setError(null);
    try {
      const res = await apiFetch("/api/lambda");
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setFunctions(data.functions || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch functions");
    }
  }, []);

  const onFunctionChange = async (option: SelectProps.Option | null) => {
    setSelectedFunction(option);
    setSelectedVersion(null);
    setVersions([]);
    const fn = option?.value?.toString();
    if (!fn) return;
    setVersionsLoading(true);
    try {
      const res = await apiFetch(
        `/api/lambda?action=listVersions&functionName=${encodeURIComponent(fn)}`,
      );
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setVersions(
        (data.versions || []).filter((v: LambdaVersionConfig) => v.Version !== "$LATEST"),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch versions");
    }
    setVersionsLoading(false);
  };

  const createAlias = async () => {
    const fn = selectedFunction?.value?.toString();
    const version = selectedVersion?.value?.toString();
    if (!fn || !version || !aliasName) return;
    setCreating(true);
    setError(null);
    try {
      const res = await apiFetch("/api/lambda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createAlias",
          functionName: fn,
          aliasName,
          functionVersion: version,
          description: aliasDescription,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setCreateModal(false);
      setSelectedFunction(null);
      setSelectedVersion(null);
      setVersions([]);
      setAliasName("");
      setAliasDescription("");
      showSuccess(`Created alias ${aliasName} → ${fn}:${version}`);
      await fetchAliases();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create alias");
    }
    setCreating(false);
  };

  const deleteAlias = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/lambda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteAlias",
          functionName: deleteTarget.FunctionName,
          aliasName: deleteTarget.AliasName,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setDeleteTarget(null);
      showSuccess(`Deleted alias ${deleteTarget.AliasName}`);
      await fetchAliases();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete alias");
    }
    setDeleteLoading(false);
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        action: string;
        alias: LambdaAliasConfig;
      };
      if (detail.action === "view" && detail.alias.FunctionName) {
        router.push(`/lambda/${encodeURIComponent(detail.alias.FunctionName)}`);
      } else if (detail.action === "delete") {
        setDeleteTarget(detail.alias);
      }
    };
    window.addEventListener("alias-row-action", handler);
    return () => window.removeEventListener("alias-row-action", handler);
  }, [router]);

  const filteredItems = aliases.filter((alias) => {
    if (!filteringText.trim()) return true;
    const lower = filteringText.toLowerCase();
    return (
      alias.FunctionName?.toLowerCase().includes(lower) ||
      alias.AliasName?.toLowerCase().includes(lower) ||
      alias.Description?.toLowerCase().includes(lower) ||
      false
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / preferences.pageSize));
  const pagedItems = filteredItems.slice(
    (currentPage - 1) * preferences.pageSize,
    currentPage * preferences.pageSize,
  );

  return (
    <SpaceBetween size="l">
      <AwsServiceHeader
        serviceName="Lambda Aliases"
        serviceIcon={SERVICE_ICONS["/lambda"]?.small}
        counter={aliases.length}
        primaryAction={
          <button
            type="button"
            className="aws-service-page__create"
            onClick={openCreate}
          >
            Create alias
          </button>
        }
      />

      {successItem && <Flashbar items={[successItem]} />}

      {partialWarning && (
        <Alert type="warning" dismissible onDismiss={() => setPartialWarning(null)}>
          {partialWarning}
        </Alert>
      )}

      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Table
        columnDefinitions={COLUMN_DEFINITIONS}
        items={pagedItems}
        loading={loading}
        loadingText="Loading aliases..."
        trackBy={(item) => `${item.FunctionName}:${item.AliasName}`}
        filter={
          <TextFilter
            filteringText={filteringText}
            filteringPlaceholder="Filter aliases"
            filteringAriaLabel="Filter aliases"
            onChange={({ detail }) => {
              setFilteringText(detail.filteringText);
              setCurrentPage(1);
            }}
            countText={
              filteringText
                ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                : `${aliases.length} aliases`
            }
          />
        }
        pagination={
          <Pagination
            currentPageIndex={currentPage}
            pagesCount={totalPages}
            onChange={({ detail }) => setCurrentPage(detail.currentPageIndex)}
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
                { value: 10, label: "10 aliases" },
                { value: 25, label: "25 aliases" },
                { value: 50, label: "50 aliases" },
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
              No aliases found
            </Box>
            <Box variant="p" padding={{ bottom: "s" }} color="inherit">
              {filteringText
                ? "No aliases match your filter."
                : "An alias is a pointer to a published version of a function. Create one to shift traffic gradually."}
            </Box>
            {!filteringText && <Button onClick={openCreate}>Create alias</Button>}
          </Box>
        }
      />

      <Modal
        visible={createModal}
        onDismiss={() => setCreateModal(false)}
        header="Create alias"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setCreateModal(false)} formAction="none">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={createAlias}
              loading={creating}
              disabled={creating || !selectedFunction || !selectedVersion || !aliasName}
            >
              Create
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField label="Function" constraintText="Required.">
            <Select
              selectedOption={selectedFunction}
              onChange={(e) =>
                void onFunctionChange(e.detail.selectedOption as SelectProps.Option | null)
              }
              options={functions.map((fn) => ({
                value: fn.FunctionName ?? "",
                label: fn.FunctionName ?? "",
              }))}
              filteringType="auto"
              ariaLabel="Function"
            />
          </FormField>
          <FormField
            label="Version"
            constraintText={
              selectedFunction && !versionsLoading && versions.length === 0
                ? "No published versions. Publish a version first."
                : "Aliases can only point to published versions."
            }
          >
            <Select
              selectedOption={selectedVersion}
              onChange={(e) =>
                setSelectedVersion(e.detail.selectedOption as SelectProps.Option | null)
              }
              options={versions.map((v) => ({
                value: v.Version ?? "",
                label: `Version ${v.Version}`,
              }))}
              disabled={!selectedFunction || versions.length === 0}
              ariaLabel="Version"
            />
          </FormField>
          <FormField label="Alias name" constraintText="Required. Unique within the function.">
            <Input
              value={aliasName}
              onChange={(e) => setAliasName(e.detail.value)}
              ariaLabel="Alias name"
            />
          </FormField>
          <FormField label="Description (optional)">
            <Input
              value={aliasDescription}
              onChange={(e) => setAliasDescription(e.detail.value)}
              ariaLabel="Description"
            />
          </FormField>
        </SpaceBetween>
      </Modal>

      <Modal
        visible={deleteTarget !== null}
        onDismiss={() => setDeleteTarget(null)}
        header="Delete alias"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setDeleteTarget(null)} formAction="none">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={deleteAlias}
              loading={deleteLoading}
              disabled={deleteLoading}
            >
              Delete
            </Button>
          </SpaceBetween>
        }
      >
        <Box>
          Delete alias <Box variant="strong">{deleteTarget?.AliasName}</Box> of function{" "}
          <Box variant="strong">{deleteTarget?.FunctionName}</Box>? Requests using this alias ARN
          will fail after deletion.
        </Box>
      </Modal>
    </SpaceBetween>
  );
}
