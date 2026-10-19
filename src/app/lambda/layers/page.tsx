"use client";

import React, { useEffect, useState, useCallback } from "react";
import Header from "@cloudscape-design/components/header";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Modal from "@cloudscape-design/components/modal";
import FormField from "@cloudscape-design/components/form-field";
import Input from "@cloudscape-design/components/input";
import Textarea from "@cloudscape-design/components/textarea";
import Multiselect from "@cloudscape-design/components/multiselect";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import Alert from "@cloudscape-design/components/alert";
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";
import Link from "@cloudscape-design/components/link";
import TruncatedText from "@/components/TruncatedText";
import { apiFetch } from "@/lib/api-client";

interface LambdaLayer {
  LayerName?: string;
  LayerArn?: string;
  LatestVersion?: number;
  CreatedDate?: string;
}

const RUNTIME_OPTIONS = [
  { value: "nodejs20.x", label: "nodejs20.x" },
  { value: "nodejs18.x", label: "nodejs18.x" },
  { value: "python3.12", label: "python3.12" },
  { value: "python3.11", label: "python3.11" },
  { value: "java21", label: "java21" },
  { value: "java17", label: "java17" },
  { value: "dotnet8", label: "dotnet8" },
  { value: "ruby3.3", label: "ruby3.3" },
  { value: "go1.x", label: "go1.x" },
  { value: "provided.al2023", label: "provided.al2023" },
];

const ARCH_OPTIONS = [
  { value: "x86_64", label: "x86_64" },
  { value: "arm64", label: "arm64" },
];

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<LambdaLayer>[] = [
  {
    id: "name",
    header: "Layer name",
    cell: (item) => (
      <Link href={`/lambda/layers/${encodeURIComponent(item.LayerName || "")}`}>
        {item.LayerName || "—"}
      </Link>
    ),
    sortingField: "LayerName",
    isRowHeader: true,
  },
  {
    id: "arn",
    header: "Layer ARN",
    cell: (item) => <TruncatedText>{item.LayerArn || "—"}</TruncatedText>,
    sortingField: "LayerArn",
  },
  {
    id: "latest",
    header: "Latest version",
    cell: (item) => item.LatestVersion ?? "—",
    sortingField: "LatestVersion",
  },
  {
    id: "created",
    header: "Creation date",
    cell: (item) => (item.CreatedDate ? new Date(item.CreatedDate).toLocaleString() : "—"),
    sortingField: "CreatedDate",
  },
  {
    id: "actions",
    header: "Actions",
    cell: (item) => (
      <ButtonDropdown
        variant="icon"
        ariaLabel={`Actions for layer ${item.LayerName}`}
        items={[{ text: "View details", id: "view" }]}
        onItemClick={({ detail }) => {
          if (detail.id === "view") {
            window.open(`/lambda/layers/${encodeURIComponent(item.LayerName || "")}`, "_self");
          }
        }}
      >
        Actions
      </ButtonDropdown>
    ),
  },
];

const VISIBLE_COLUMNS = ["name", "arn", "latest", "created", "actions"];

export default function LambdaLayersPage() {
  const [layers, setLayers] = useState<LambdaLayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successItem, setSuccessItem] = useState<FlashbarProps.MessageDefinition | null>(null);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [preferences, setPreferences] = useState({ pageSize: 25, visibleContent: VISIBLE_COLUMNS });

  // Create layer state
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [layerName, setLayerName] = useState("");
  const [description, setDescription] = useState("");
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [archSelected, setArchSelected] = useState<Array<{ value: string; label: string }>>([
    ARCH_OPTIONS[0],
  ]);
  const [runtimeSelected, setRuntimeSelected] = useState<Array<{ value: string; label: string }>>(
    [],
  );
  const [licenseInfo, setLicenseInfo] = useState("");

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

  const fetchLayers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/lambda?action=listLayers");
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setLayers(data.layers || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch layers");
      setLayers([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLayers();
  }, [fetchLayers]);

  const createLayer = async () => {
    if (!zipFile) return;
    setCreating(true);
    setError(null);
    try {
      const buf = await zipFile.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buf).reduce((data, byte) => data + String.fromCharCode(byte), ""),
      );
      const res = await apiFetch("/api/lambda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "publishLayer",
          layerName,
          description,
          zip: base64,
          compatibleArchitectures: archSelected.map((a) => a.value),
          compatibleRuntimes: runtimeSelected.map((r) => r.value),
          licenseInfo: licenseInfo || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setCreateModal(false);
      setLayerName("");
      setDescription("");
      setZipFile(null);
      setRuntimeSelected([]);
      setLicenseInfo("");
      showSuccess(`Published layer ${layerName}`);
      await fetchLayers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create layer");
    }
    setCreating(false);
  };

  const filteredItems = layers.filter((layer) => {
    if (!filteringText.trim()) return true;
    const lower = filteringText.toLowerCase();
    return (
      layer.LayerName?.toLowerCase().includes(lower) ||
      layer.LayerArn?.toLowerCase().includes(lower) ||
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
      <Header
        variant="h2"
        counter={`(${layers.length})`}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button iconName="refresh" onClick={fetchLayers} ariaLabel="Refresh" />
            <Button variant="primary" onClick={() => setCreateModal(true)}>
              Create layer
            </Button>
          </SpaceBetween>
        }
      >
        Layers
      </Header>

      {successItem && <Flashbar items={[successItem]} />}

      {error && (
        <Alert type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Table
        columnDefinitions={COLUMN_DEFINITIONS}
        items={pagedItems}
        loading={loading}
        loadingText="Loading layers..."
        trackBy="LayerArn"
        filter={
          <TextFilter
            filteringText={filteringText}
            filteringPlaceholder="Filter layers"
            filteringAriaLabel="Filter layers"
            onChange={({ detail }) => {
              setFilteringText(detail.filteringText);
              setCurrentPage(1);
            }}
            countText={
              filteringText
                ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                : `${layers.length} layers`
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
                { value: 10, label: "10 layers" },
                { value: 25, label: "25 layers" },
                { value: 50, label: "50 layers" },
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
              No layers found
            </Box>
            <Box variant="p" padding={{ bottom: "s" }} color="inherit">
              {filteringText
                ? "No layers match your filter."
                : "A layer is a .zip file archive that contains libraries, custom runtimes, or other dependencies."}
            </Box>
            {!filteringText && <Button onClick={() => setCreateModal(true)}>Create layer</Button>}
          </Box>
        }
      />

      <Modal
        visible={createModal}
        onDismiss={() => setCreateModal(false)}
        header="Create layer"
        size="large"
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button onClick={() => setCreateModal(false)} formAction="none">
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={createLayer}
              loading={creating}
              disabled={creating || !layerName || !zipFile}
            >
              Create layer
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField
            label="Layer name"
            constraintText="Required. Unique in the account and Region."
          >
            <Input
              value={layerName}
              onChange={(e) => setLayerName(e.detail.value)}
              ariaLabel="Layer name"
            />
          </FormField>
          <FormField label="Description" constraintText="Optional.">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.detail.value)}
              rows={3}
            />
          </FormField>
          <FormField
            label="Layer file (.zip)"
            constraintText="Required. The archive contents become the layer content."
          >
            <input
              type="file"
              accept=".zip,application/zip"
              onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
              aria-label="Layer zip file"
            />
          </FormField>
          <FormField label="Compatible architectures">
            <Multiselect
              selectedOptions={archSelected}
              onChange={(e) =>
                setArchSelected(e.detail.selectedOptions as Array<{ value: string; label: string }>)
              }
              options={ARCH_OPTIONS}
              ariaLabel="Compatible architectures"
            />
          </FormField>
          <FormField
            label="Compatible runtimes"
            constraintText="Optional. Choose at least one runtime this layer supports."
          >
            <Multiselect
              selectedOptions={runtimeSelected}
              onChange={(e) =>
                setRuntimeSelected(
                  e.detail.selectedOptions as Array<{ value: string; label: string }>,
                )
              }
              options={RUNTIME_OPTIONS}
              filteringType="auto"
              ariaLabel="Compatible runtimes"
            />
          </FormField>
          <FormField label="License information" constraintText="Optional.">
            <Input
              value={licenseInfo}
              onChange={(e) => setLicenseInfo(e.detail.value)}
              ariaLabel="License information"
            />
          </FormField>
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
}
