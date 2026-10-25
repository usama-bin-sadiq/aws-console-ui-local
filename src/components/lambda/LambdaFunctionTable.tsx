import Header from "@cloudscape-design/components/header";
/**
 * LambdaFunctionTable — Lambda function list.
 */

import React from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface LambdaFunctionTableProps {
  readonly functions?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function LambdaFunctionTable({
  functions = [],
  loading = false,
  onRefresh,
}: LambdaFunctionTableProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "name",
      header: "Function Name",
      cell: (item: Record<string, unknown>) => String(item.FunctionName || item.name || "-"),
    },
    {
      id: "runtime",
      header: "Runtime",
      cell: (item: Record<string, unknown>) => String(item.Runtime || item.runtime || "-"),
    },
    {
      id: "handler",
      header: "Handler",
      cell: (item: Record<string, unknown>) => String(item.Handler || item.handler || "-"),
    },
    {
      id: "memory",
      header: "Memory",
      cell: (item: Record<string, unknown>) => String(item.MemorySize || item.memory || "-"),
    },
  ];

  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={functions}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No functions found</div>}
        header={<Header variant="h2">Lambda Functions</Header>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
