/**
 * DynamoDBTableComponent — DynamoDB table list.
 */

import React, { useState } from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface DynamoDBTableComponentProps {
  readonly tables?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function DynamoDBTableComponent({
  tables = [],
  loading = false,
  onRefresh,
}: DynamoDBTableComponentProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "name",
      header: "Table Name",
      cell: (item: Record<string, unknown>) => String(item.TableName || item.name || "-"),
    },
    {
      id: "status",
      header: "Status",
      cell: (item: Record<string, unknown>) => String(item.TableStatus || item.status || "-"),
    },
  ];
  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={tables}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No DynamoDB tables found</div>}
        header={<h2>DynamoDB Tables</h2>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
