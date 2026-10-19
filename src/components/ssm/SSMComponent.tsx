/**
 * SSMComponent — Parameter store table.
 */

import React, { useState } from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface SSMComponentProps {
  readonly parameters?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function SSMComponent({
  parameters = [],
  loading = false,
  onRefresh,
}: SSMComponentProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "name",
      header: "Name",
      cell: (item: Record<string, unknown>) => String(item.Name || item.name || "-"),
    },
    {
      id: "type",
      header: "Type",
      cell: (item: Record<string, unknown>) => String(item.Type || item.type || "-"),
    },
  ];
  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={parameters}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No parameters found</div>}
        header={<h2>SSM Parameters</h2>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
