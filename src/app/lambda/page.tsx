"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CodeView } from "@cloudscape-design/code-view";
import Header from "@cloudscape-design/components/header";
import Table, { TableProps } from "@cloudscape-design/components/table";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Box from "@cloudscape-design/components/box";
import Container from "@cloudscape-design/components/container";
import StatusIndicator from "@cloudscape-design/components/status-indicator";
import Modal from "@cloudscape-design/components/modal";
import Textarea from "@cloudscape-design/components/textarea";
import FormField from "@cloudscape-design/components/form-field";
import TextFilter from "@cloudscape-design/components/text-filter";
import Pagination from "@cloudscape-design/components/pagination";
import CollectionPreferences from "@cloudscape-design/components/collection-preferences";
import Alert from "@cloudscape-design/components/alert";
import Link from "@cloudscape-design/components/link";
import TruncatedText from "@/components/TruncatedText";
import { LambdaFunctionConfig } from "@/types/lambda";

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<LambdaFunctionConfig>[] = [
  {
    id: "name",
    header: "Function name",
    cell: (item) => (
      <Link href={`/lambda/${encodeURIComponent(item.FunctionName || "")}`}>{item.FunctionName || "—"}</Link>
    ),
    sortingField: "FunctionName",
    isRowHeader: true,
  },
  {
    id: "runtime",
    header: "Runtime",
    cell: (item) => item.Runtime || "—",
    sortingField: "Runtime",
  },
  {
    id: "handler",
    header: "Handler",
    cell: (item) => item.Handler || "—",
    sortingField: "Handler",
  },
  {
    id: "memory",
    header: "Memory",
    cell: (item) => (item.MemorySize ? `${item.MemorySize} MB` : "—"),
    sortingField: "MemorySize",
  },
  {
    id: "state",
    header: "State",
    cell: (item) => {
      const state = item.State || "Active";
      const type = state === "Active" ? "success" : state === "Failed" ? "error" : state === "Inactive" ? "warning" : "info";
      return <StatusIndicator type={type as any}>{state}</StatusIndicator>;
    },
    sortingField: "State",
  },
  {
    id: "modified",
    header: "Last modified",
    cell: (item) => (item.LastModified ? new Date(item.LastModified).toLocaleString() : "—"),
    sortingField: "LastModified",
  },
  {
    id: "description",
    header: "Description",
    cell: (item) => <TruncatedText>{item.Description || "—"}</TruncatedText>,
    sortingField: "Description",
  },
  {
    id: "actions",
    header: "Actions",
    cell: (item) => (
      <SpaceBetween direction="horizontal" size="xs">
        <Button
          onClick={() => {
            window.open(`/lambda/${encodeURIComponent(item.FunctionName || "")}`, "_self");
          }}
          formAction="none"
          variant="icon"
          iconName="search"
          ariaLabel={`View details for ${item.FunctionName}`}
        />
        <Button
          onClick={() => {
            // Invoke handled by parent selection
            const event = new CustomEvent("lambda-invoke", {
              detail: item.FunctionName,
            });
            window.dispatchEvent(event);
          }}
          formAction="none"
          variant="icon"
          iconName="play"
          ariaLabel={`Invoke ${item.FunctionName}`}
        />
        <Button
          onClick={() => {
            const event = new CustomEvent("lambda-delete", {
              detail: item.FunctionName,
            });
            window.dispatchEvent(event);
          }}
          formAction="none"
          variant="icon"
          iconName="remove"
          ariaLabel={`Delete ${item.FunctionName}`}
        />
      </SpaceBetween>
    ),
  },
];

const VISIBLE_COLUMNS = ["name", "runtime", "handler", "memory", "state", "modified", "description", "actions"];

export default function LambdaPage() {
  const router = useRouter();
  const [functions, setFunctions] = useState<LambdaFunctionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<LambdaFunctionConfig[]>([]);
  const [filteringText, setFilteringText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [preferences, setPreferences] = useState({
    pageSize: 25,
    visibleContent: VISIBLE_COLUMNS,
  });

  // Invoke state
  const [invokeModal, setInvokeModal] = useState(false);
  const [selectedFn, setSelectedFn] = useState("");
  const [payload, setPayload] = useState("{}");
  const [invokeResult, setInvokeResult] = useState("");
  const [invokeLoading, setInvokeLoading] = useState(false);

  // Create wizard state

  const fetchFunctions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/lambda");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setFunctions(data.functions || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch functions");
      setFunctions([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFunctions();
  }, [fetchFunctions]);

  useEffect(() => {
    const handleInvoke = (e: Event) => {
      const fn = (e as CustomEvent).detail as string;
      setSelectedFn(fn || selectedItems[0]?.FunctionName || "");
      setPayload("{}");
      setInvokeResult("");
      setInvokeModal(true);
    };
    const handleDelete = async (e: Event) => {
      const fn = (e as CustomEvent).detail as string;
      if (!fn) return;
      try {
        await fetch(`/api/lambda?functionName=${encodeURIComponent(fn)}`, {
          method: "DELETE",
        });
        fetchFunctions();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to delete function");
      }
    };
    window.addEventListener("lambda-invoke", handleInvoke);
    window.addEventListener("lambda-delete", handleDelete);
    return () => {
      window.removeEventListener("lambda-invoke", handleInvoke);
      window.removeEventListener("lambda-delete", handleDelete);
    };
  }, [fetchFunctions, selectedItems]);

  const invokeFunction = useCallback(async () => {
    setInvokeLoading(true);
    setInvokeResult("");
    try {
      const res = await fetch("/api/lambda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invoke", functionName: selectedFn, payload }),
      });
      const data = await res.json();
      setInvokeResult(JSON.stringify(data.result || data, null, 2));
    } catch (err: unknown) {
      setInvokeResult(err instanceof Error ? err.message : "Invoke failed");
    }
    setInvokeLoading(false);
  }, [selectedFn, payload]);

  const handleBulkInvoke = useCallback(() => {
    if (selectedItems.length === 0) return;
    setSelectedFn(selectedItems[0].FunctionName || "");
    setPayload("{}");
    setInvokeResult("");
    setInvokeModal(true);
  }, [selectedItems]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedItems.length === 0) return;
    for (const item of selectedItems) {
      if (!item.FunctionName) continue;
      try {
        await fetch(`/api/lambda?functionName=${encodeURIComponent(item.FunctionName)}`, {
          method: "DELETE",
        });
      } catch {
        // continue
      }
    }
    setSelectedItems([]);
    fetchFunctions();
  }, [selectedItems, fetchFunctions]);

  const filteredItems = functions.filter((fn) => {
    if (!filteringText.trim()) return true;
    const lower = filteringText.toLowerCase();
    return (
      fn.FunctionName?.toLowerCase().includes(lower) ||
      fn.Runtime?.toLowerCase().includes(lower) ||
      fn.Handler?.toLowerCase().includes(lower) ||
      fn.Description?.toLowerCase().includes(lower) ||
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
      <Button iconName="refresh" onClick={fetchFunctions} ariaLabel="Refresh" />
      <ButtonDropdown
        items={[
          {
            text: "Invoke",
            id: "invoke",
            disabled: selectedItems.length === 0,
          },
          {
            text: "Delete",
            id: "delete",
            disabled: selectedItems.length === 0,
          },
        ]}
        onItemClick={({ detail }) => {
          if (detail.id === "invoke") handleBulkInvoke();
          else if (detail.id === "delete") handleBulkDelete();
        }}
        disabled={selectedItems.length === 0}
        ariaLabel="Bulk actions"
      >
        Actions
      </ButtonDropdown>
      <Button variant="primary" onClick={() => router.push("/lambda/create")} ariaLabel="Create Lambda function">
        Create function
      </Button>
    </SpaceBetween>
  );

  return (
    <div style={{ padding: "16px" }}>
      <SpaceBetween size="l">
        <Header variant="h1" counter={`(${functions.length})`} actions={headerActions}>
          Lambda
        </Header>

        {error && (
          <Alert type="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Container>
          <Table
            columnDefinitions={COLUMN_DEFINITIONS}
            items={pagedItems}
            loading={loading}
            loadingText="Loading functions..."
            selectionType="multi"
            selectedItems={selectedItems}
            onSelectionChange={({ detail }) =>
              setSelectedItems(detail.selectedItems as LambdaFunctionConfig[])
            }
            trackBy="FunctionName"
            sortingColumn={COLUMN_DEFINITIONS[0]}
            sortingDescending={false}
            filter={
              <TextFilter
                filteringText={filteringText}
                filteringPlaceholder="Filter functions"
                filteringAriaLabel="Filter functions"
                onChange={({ detail }) => {
                  setFilteringText(detail.filteringText);
                  setCurrentPage(1);
                }}
                countText={
                  filteringText
                    ? `${filteredItems.length} match${filteredItems.length !== 1 ? "es" : ""}`
                    : `${functions.length} functions`
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
                    { value: 10, label: "10 functions" },
                    { value: 25, label: "25 functions" },
                    { value: 50, label: "50 functions" },
                    { value: 100, label: "100 functions" },
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
                  No functions found
                </Box>
                <Box variant="p" padding={{ bottom: "s" }} color="inherit">
                  {filteringText
                    ? "No functions match your filter. Try a different search."
                    : "To get started, create a Lambda function."}
                </Box>
                {!filteringText && (
                  <Button onClick={() => router.push("/lambda/create")}>
                    Create function
                  </Button>
                )}
              </Box>
            }
          />
        </Container>

        <Modal
          visible={invokeModal}
          onDismiss={() => {
            setInvokeModal(false);
            setInvokeResult("");
          }}
          header={`Invoke — ${selectedFn}`}
          footer={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setInvokeModal(false);
                  setInvokeResult("");
                }}
                formAction="none"
              >
                Cancel
              </Button>
              <Button variant="primary" onClick={invokeFunction} disabled={invokeLoading}>
                {invokeLoading ? "Invoking..." : "Invoke"}
              </Button>
            </SpaceBetween>
          }
        >
          <SpaceBetween size="m">
            <FormField label="Payload (JSON)">
              <Textarea
                value={payload}
                onChange={(e) => setPayload(e.detail.value)}
                rows={8}
              />
            </FormField>
            {invokeResult && (
              <FormField label="Result">
                <CodeView content={invokeResult} lineNumbers wrapLines />
              </FormField>
            )}
          </SpaceBetween>
        </Modal>
      </SpaceBetween>
    </div>
  );
}
