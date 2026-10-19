"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CodeView } from "@cloudscape-design/code-view";
import Button from "@cloudscape-design/components/button";
import ButtonDropdown from "@cloudscape-design/components/button-dropdown";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Modal from "@cloudscape-design/components/modal";
import Textarea from "@cloudscape-design/components/textarea";
import FormField from "@cloudscape-design/components/form-field";
import Alert from "@cloudscape-design/components/alert";
import Flashbar, { FlashbarProps } from "@cloudscape-design/components/flashbar";
import Link from "@cloudscape-design/components/link";
import TruncatedText from "@/components/TruncatedText";
import ConfirmModal from "@/components/ConfirmModal";
import { CrossServiceLinks, CROSS_SERVICE_LINKS } from "@/components/CrossServiceLinks";
import { ResourceTable } from "@/features/resource-table";
import type { ActionDefinition } from "@/features/resource-table";
import { StatusBadge, type StatusType } from "@/components/ui/StatusBadge";
import { CopyableText } from "@/components/ui/CopyableText";
import { apiFetch } from "@/lib/api-client";
import { LambdaFunctionConfig } from "@/types/lambda";

const stateToStatusType = (state: LambdaFunctionConfig["State"]): StatusType => {
  switch (state) {
    case "Active":
      return "success";
    case "Failed":
      return "error";
    case "Inactive":
      return "warning";
    default:
      return "in-progress";
  }
};

import type { TableProps } from "@cloudscape-design/components/table";

const COLUMN_DEFINITIONS: TableProps.ColumnDefinition<Record<string, unknown>>[] = [
  {
    id: "name",
    header: "Function name",
    cell: (item: LambdaFunctionConfig) => (
      <Link href={`/lambda/${encodeURIComponent(item.FunctionName || "")}`}>
        <CopyableText value={item.FunctionName || "—"} truncateLength={40} />
      </Link>
    ),
    sortingField: "FunctionName" as const,
    isRowHeader: true,
  },
  {
    id: "runtime",
    header: "Runtime",
    cell: (item: LambdaFunctionConfig) => item.Runtime || "—",
    sortingField: "Runtime" as const,
  },
  {
    id: "handler",
    header: "Handler",
    cell: (item: LambdaFunctionConfig) => item.Handler || "—",
    sortingField: "Handler" as const,
  },
  {
    id: "memory",
    header: "Memory",
    cell: (item: LambdaFunctionConfig) => (item.MemorySize ? `${item.MemorySize} MB` : "—"),
    sortingField: "MemorySize" as const,
  },
  {
    id: "state",
    header: "State",
    cell: (item: LambdaFunctionConfig) => {
      const state = item.State || "Active";
      return <StatusBadge status={stateToStatusType(state)} label={state} />;
    },
    sortingField: "State" as const,
  },
  {
    id: "modified",
    header: "Last modified",
    cell: (item: LambdaFunctionConfig) =>
      item.LastModified ? new Date(item.LastModified).toLocaleString() : "—",
    sortingField: "LastModified" as const,
  },
  {
    id: "description",
    header: "Description",
    cell: (item: LambdaFunctionConfig) => <TruncatedText>{item.Description || "—"}</TruncatedText>,
    sortingField: "Description" as const,
  },
  {
    id: "actions",
    header: "Actions",
    cell: (item: LambdaFunctionConfig) => (
      <ButtonDropdown
        variant="icon"
        ariaLabel={`Actions for ${item.FunctionName}`}
        items={[
          { text: "View details", id: "view" },
          { text: "Invoke", id: "invoke" },
          { text: "Delete", id: "delete" },
        ]}
        onItemClick={({ detail }) => {
          const event = new CustomEvent("lambda-row-action", {
            detail: { action: detail.id, functionName: item.FunctionName },
          });
          window.dispatchEvent(event);
        }}
      >
        Actions
      </ButtonDropdown>
    ),
  },
];

const VISIBLE_COLUMNS = [
  "name",
  "runtime",
  "handler",
  "memory",
  "state",
  "modified",
  "description",
  "actions",
];

export default function LambdaPage() {
  const router = useRouter();
  const [functions, setFunctions] = useState<LambdaFunctionConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successItem, setSuccessItem] = useState<FlashbarProps.MessageDefinition | null>(null);
  const [selectedItems, setSelectedItems] = useState<LambdaFunctionConfig[]>([]);

  // Invoke state
  const [invokeModal, setInvokeModal] = useState(false);
  const [selectedFn, setSelectedFn] = useState("");
  const [payload, setPayload] = useState("{}");
  const [invokeResult, setInvokeResult] = useState("");
  const [invokeLoading, setInvokeLoading] = useState(false);

  // Delete confirmation state
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);
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

  const fetchFunctions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/lambda");
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

  const deleteFunction = useCallback(async (functionName: string) => {
    const res = await apiFetch(`/api/lambda?functionName=${encodeURIComponent(functionName)}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
  }, []);

  useEffect(() => {
    const handleRowAction = async (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        action: string;
        functionName?: string;
      };
      const fn = detail.functionName || "";
      if (!fn) return;
      if (detail.action === "view") {
        router.push(`/lambda/${encodeURIComponent(fn)}`);
      } else if (detail.action === "invoke") {
        setSelectedFn(fn);
        setPayload("{}");
        setInvokeResult("");
        setInvokeModal(true);
      } else if (detail.action === "delete") {
        setPendingDelete(fn);
      }
    };
    window.addEventListener("lambda-row-action", handleRowAction);
    return () => window.removeEventListener("lambda-row-action", handleRowAction);
  }, [router]);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleteLoading(true);
    setError(null);
    try {
      await deleteFunction(pendingDelete);
      showSuccess(`Deleted function ${pendingDelete}`);
      setPendingDelete(null);
      setSelectedItems((prev) => prev.filter((i) => i.FunctionName !== pendingDelete));
      await fetchFunctions();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete function");
    }
    setDeleteLoading(false);
  }, [pendingDelete, deleteFunction, fetchFunctions, showSuccess]);

  const handleConfirmBulkDelete = useCallback(async () => {
    setDeleteLoading(true);
    setError(null);
    const failures: string[] = [];
    for (const item of selectedItems) {
      if (!item.FunctionName) continue;
      try {
        await deleteFunction(item.FunctionName);
      } catch (err: unknown) {
        failures.push(`${item.FunctionName}: ${err instanceof Error ? err.message : "failed"}`);
      }
    }
    setPendingBulkDelete(false);
    setDeleteLoading(false);
    setSelectedItems([]);
    await fetchFunctions();
    if (failures.length > 0) {
      setError(
        `Failed to delete ${failures.length} of ${selectedItems.length} functions:\n${failures.join("\n")}`,
      );
    } else {
      showSuccess(`Deleted ${selectedItems.length} functions`);
    }
  }, [selectedItems, deleteFunction, fetchFunctions, showSuccess]);

  const invokeFunction = useCallback(async () => {
    setInvokeLoading(true);
    setInvokeResult("");
    try {
      const res = await apiFetch("/api/lambda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invoke",
          functionName: selectedFn,
          payload,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || `HTTP ${res.status}`);
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

  const actions: ActionDefinition<LambdaFunctionConfig>[] = [
    {
      id: "invoke",
      label: "Invoke",
      disabled: (items) => items.length === 0,
      onClick: () => handleBulkInvoke(),
    },
    {
      id: "delete",
      label: "Delete",
      disabled: (items) => items.length === 0,
      onClick: () => setPendingBulkDelete(true),
    },
  ];

  return (
    <SpaceBetween size="l">
      {successItem && <Flashbar key="success" items={[successItem]} />}

      {error && (
        <Alert key="error" type="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      <ResourceTable
        key="resource-table"
        config={{
          serviceKey: "lambda",
          resourceName: "Functions",
          columnDefinitions: COLUMN_DEFINITIONS,
          defaultVisibleColumns: VISIBLE_COLUMNS,
          trackBy: "FunctionName",
          createLabel: "Create function",
          createHref: "/lambda/create",
          filterPlaceholder: "Filter functions",
        }}
        items={functions as unknown as Record<string, unknown>[]}
        loading={loading}
        selectedItems={selectedItems as unknown as Record<string, unknown>[]}
        onSelectionChange={(items) => setSelectedItems(items as unknown as LambdaFunctionConfig[])}
        onRefresh={fetchFunctions}
        actions={actions as any}
      />

      <Modal
        key="invoke-modal"
        visible={invokeModal}
        onDismiss={() => {
          setInvokeModal(false);
          setInvokeResult("");
        }}
        header={`Invoke — ${selectedFn}`}
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              key="cancel-invoke"
              onClick={() => {
                setInvokeModal(false);
                setInvokeResult("");
              }}
              formAction="none"
            >
              Cancel
            </Button>
            <Button
              key="confirm-invoke"
              variant="primary"
              onClick={invokeFunction}
              disabled={invokeLoading}
            >
              {invokeLoading ? "Invoking..." : "Invoke"}
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <FormField key="payload-field" label="Payload (JSON)">
            <Textarea value={payload} onChange={(e) => setPayload(e.detail.value)} rows={8} />
          </FormField>
          {invokeResult ? (
            <FormField key="result-field" label="Result">
              <CodeView content={invokeResult} lineNumbers wrapLines />
            </FormField>
          ) : null}
        </SpaceBetween>
      </Modal>

      <ConfirmModal
        key="delete-modal"
        visible={pendingDelete !== null}
        resourceName={pendingDelete || ""}
        resourceType="function"
        onConfirm={handleConfirmDelete}
        onDismiss={() => setPendingDelete(null)}
        loading={deleteLoading}
      />

      <ConfirmModal
        key="bulk-delete-modal"
        visible={pendingBulkDelete}
        resourceName="delete"
        resourceType={`${selectedItems.length} functions`}
        onConfirm={handleConfirmBulkDelete}
        onDismiss={() => setPendingBulkDelete(false)}
        loading={deleteLoading}
      />

      <CrossServiceLinks key="related-services" links={CROSS_SERVICE_LINKS["/lambda"] || []} />
    </SpaceBetween>
  );
}
