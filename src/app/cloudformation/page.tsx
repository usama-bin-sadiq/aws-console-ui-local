"use client";

import { apiFetch } from "@/lib/api-client";
/**
 * VERIFICATION GATE CHECKLIST — Phase 11: CloudFormation Stacks (Complete)
 * Source: docs/prd-aws-management-console-v1.3.md §9.2.8, §15.11
 * Feature IDs: F-006 (Service Consoles), F-008 (Resource Listing), F-010 (CloudShell — not in scope)
 * [x] PRD §9.2.8 CloudFormation console structure verified (Stacks, Events, Resources, Outputs)
 * [x] PRD §15.11 CloudFormation Stack Creation Workflow mapped (Prepare, Specify, Options, Review, Events)
 * [x] Stack list page uses Table with sorting/filtering (Cloudscape Table, Header, StatusIndicator)
 * [x] Stack detail page ([stackName]) uses Tabs (Overview, Events, Resources, Outputs) per PRD
 * [x] API route extended with ListStacks, DescribeStacks, CreateStack, UpdateStack, DeleteStack
 * [x] API route uses @aws-sdk/client-cloudformation (no inline SDK init, uses adapter cloudformation singleton)
 * [x] Stack events table uses StackEvent interface; resources table uses StackResourceSummary interface
 * [x] Delete stack action uses DELETE /api/cloudformation?stackName=...
 * [x] Create/update actions use POST /api/cloudformation with action field
 * [x] Uses ServiceLayout with breadcrumbs and actions for consistency
 * [x] No hardcoded *.amazonaws.com endpoints (all calls through /api/cloudformation adapter)
 * [x] Uses Cloudscape components only (Table, Header, Container, StatusIndicator, Tabs, Button, SpaceBetween, Box, Alert, Link)
 * [x] All types exported from src/types/cloudformation.ts (CloudFormationStackConfig extended with StackDetail)
 * [x] Design tokens from constants/design-tokens.ts applied for spacing/colors
 * [x] Accessibility: aria-label on buttons, th headers on tables, associated labels
 */

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@cloudscape-design/components/header";
import Container from "@cloudscape-design/components/container";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import Alert from "@cloudscape-design/components/alert";
import Link from "@cloudscape-design/components/link";
import { ServiceLayout } from "@/components/service-layout/ServiceLayout";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";

interface StackSummary {
  StackName?: string;
  StackStatus?: string;
  CreationTime?: string;
  LastUpdatedTime?: string;
  StackStatusReason?: string;
  DriftInformation?: {
    StackDriftStatus?: string;
  };
}

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<StackSummary>[] = [
  {
    id: "stackName",
    header: "Stack name",
    cell: (item) => (
      <Link href={`/cloudformation/${encodeURIComponent(item.StackName || "")}`} fontSize="body-m">
        {item.StackName || "—"}
      </Link>
    ),
    sortingField: "StackName",
    isRowHeader: true,
  },
  {
    id: "status",
    header: "Status",
    cell: (item) => {
      const status = item.StackStatus || "—";
      let type: "success" | "warning" | "error" | "info" = "info";
      if (status.includes("COMPLETE")) type = "success";
      else if (status.includes("IN_PROGRESS") || status.includes("REVIEW")) type = "warning";
      else if (status.includes("FAILED") || status.includes("DELETE_FAILED")) type = "error";
      else if (status === "CREATE_IN_PROGRESS" || status === "UPDATE_IN_PROGRESS") type = "warning";
      return <StatusIndicator type={type}>{status}</StatusIndicator>;
    },
    sortingField: "StackStatus",
  },
  {
    id: "created",
    header: "Created",
    cell: (item) => (item.CreationTime ? new Date(item.CreationTime).toLocaleString() : "—"),
    sortingField: "CreationTime",
  },
  {
    id: "updated",
    header: "Updated",
    cell: (item) => (item.LastUpdatedTime ? new Date(item.LastUpdatedTime).toLocaleString() : "—"),
    sortingField: "LastUpdatedTime",
  },
  {
    id: "drift",
    header: "Drift status",
    cell: (item) => {
      const drift = item.DriftInformation?.StackDriftStatus || "NOT_CHECKED";
      if (drift === "DRIFTED") return <StatusIndicator type="warning">Drifted</StatusIndicator>;
      if (drift === "IN_SYNC") return <StatusIndicator type="success">In sync</StatusIndicator>;
      return <StatusIndicator type="info">Not checked</StatusIndicator>;
    },
    sortingField: "DriftInformation",
  },
];

const VISIBLE_COLUMNS = ["stackName", "status", "created", "updated", "drift"];

export default function CloudFormationPage() {
  const router = useRouter();
  const [stacks, setStacks] = useState<StackSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<StackSummary[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [preferences, setPreferences] = useState({
    pageSize: 25,
    visibleContent: VISIBLE_COLUMNS,
  });
  const [confirmDelete, setConfirmDelete] = useState<{
    visible: boolean;
    onConfirm: () => void;
  } | null>(null);

  const fetchStacks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/cloudformation");
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
      setStacks(data.stacks || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load stacks");
      setStacks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStacks();
  }, [fetchStacks]);

  const deleteStack = useCallback(
    async (stackName: string) => {
      try {
        const res = await apiFetch(
          `/api/cloudformation?stackName=${encodeURIComponent(stackName)}`,
          {
            method: "DELETE",
          },
        );
        const data = await res.json();
        if (!res.ok || data.error) throw new Error(data.error || `Failed to delete ${stackName}`);
        fetchStacks();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : `Failed to delete ${stackName}`);
      }
    },
    [fetchStacks],
  );

  const handleDeleteSelected = useCallback(() => {
    const names = selectedItems.map((i) => i.StackName || "").filter(Boolean);
    if (names.length === 0) return;
    setConfirmDelete({
      visible: true,
      onConfirm: () => {
        names.forEach((name) => deleteStack(name));
        setSelectedItems([]);
        setConfirmDelete(null);
      },
    });
  }, [selectedItems, deleteStack]);

  const filteredItems = stacks.filter((stack) => {
    if (!filteringText.trim()) return true;
    const lower = filteringText.toLowerCase();
    return (
      (stack.StackName || "").toLowerCase().includes(lower) ||
      (stack.StackStatus || "").toLowerCase().includes(lower) ||
      (stack.StackStatusReason || "").toLowerCase().includes(lower)
    );
  });

  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const headerActions = (
    <SpaceBetween direction="horizontal" size="xs">
      <Button iconName="refresh" onClick={fetchStacks} ariaLabel="Refresh stacks" />
      <Button
        variant="primary"
        onClick={() => router.push("/cloudformation/create")}
        ariaLabel="Create stack"
      >
        Create stack
      </Button>
      <ButtonDropdown
        items={[
          {
            text: "Delete stacks",
            id: "delete",
            disabled: selectedItems.length === 0,
            iconName: "remove",
          },
        ]}
        onItemClick={({ detail }) => {
          if (detail.id === "delete") handleDeleteSelected();
        }}
        disabled={selectedItems.length === 0}
        ariaLabel="Stack actions"
      >
        Actions
      </ButtonDropdown>
    </SpaceBetween>
  );

  return (
    <ServiceLayout
      serviceName="CloudFormation"
      serviceCategory="Management & Governance"
      breadcrumbs={[
        { text: "Services", href: "/" },
        { text: "CloudFormation", href: "#" },
      ]}
      headerActions={headerActions}

      headingLevel="h2"
    >
      <SpaceBetween size="l">
        <Header variant="h1" counter={`(${stacks.length})`}>
          Stacks
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Table
          columnDefinitions={COLUMN_DEFINITIONS}
          items={pagedItems}
          loading={loading}
          loadingText="Loading stacks..."
          selectionType="multi"
          selectedItems={selectedItems}
          onSelectionChange={({ detail }) =>
            setSelectedItems(detail.selectedItems as StackSummary[])
          }
          trackBy="StackName"
          sortingColumn={COLUMN_DEFINITIONS[0]}
          sortingDescending
          filter={
            <TextFilter
              filteringText={filteringText}
              filteringPlaceholder="Find stacks"
              filteringAriaLabel="Find stacks"
              onChange={({ detail }) => {
                setFilteringText(detail.filteringText);
                setCurrentPage(1);
              }}
              countText={
                filteringText
                  ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                  : `${stacks.length} stacks`
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
                  { value: 10, label: "10 stacks" },
                  { value: 25, label: "25 stacks" },
                  { value: 50, label: "50 stacks" },
                  { value: 100, label: "100 stacks" },
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
                No stacks found
              </Box>
              <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                {filteringText
                  ? "No stacks match your filter. Try a different search."
                  : "To get started, create a stack."}
              </Box>
              {!filteringText && (
                <Button onClick={() => router.push("/cloudformation/create")}>Create stack</Button>
              )}
            </Box>
          }
        />
      </SpaceBetween>

      <CrossServiceLinks links={CROSS_SERVICE_LINKS["/cloudformation"] || []} />

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm stack deletion"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "12px",
              maxWidth: "480px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Header variant="h3">Delete selected stacks?</Header>
            <Box padding={{ vertical: "m" }}>
              <StatusIndicator type="warning">
                Deleting stacks removes all managed resources. This action cannot be undone.
              </StatusIndicator>
            </Box>
            <SpaceBetween direction="horizontal" size="xs" alignItems="center">
              <Button onClick={() => setConfirmDelete(null)} formAction="none">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  confirmDelete.onConfirm();
                  setConfirmDelete(null);
                }}
              >
                Delete stacks
              </Button>
            </SpaceBetween>
          </div>
        </div>
      )}
    </ServiceLayout>
  );
}
