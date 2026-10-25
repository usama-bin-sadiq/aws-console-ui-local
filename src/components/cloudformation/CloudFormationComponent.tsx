/**
 * CloudFormationComponent — Stack list.
 */

import React from "react";
import Table from "@cloudscape-design/components/table";
import Pagination from "@cloudscape-design/components/pagination";
import SpaceBetween from "@cloudscape-design/components/space-between";
import Button from "@cloudscape-design/components/button";

export interface CloudFormationComponentProps {
  readonly stacks?: Array<Record<string, unknown>>;
  readonly loading?: boolean;
  readonly onRefresh?: () => void;
}

export function CloudFormationComponent({
  stacks = [],
  loading = false,
  onRefresh,
}: CloudFormationComponentProps): React.ReactElement {
  const columnDefinitions: any[] = [
    {
      id: "name",
      header: "Stack Name",
      cell: (item: Record<string, unknown>) => String(item.StackName || item.name || "-"),
    },
    {
      id: "status",
      header: "Status",
      cell: (item: Record<string, unknown>) => String(item.StackStatus || item.status || "-"),
    },
  ];
  return (
    <SpaceBetween size="m" direction="vertical">
      <Table
        items={stacks}
        columnDefinitions={columnDefinitions}
        loading={loading}
        empty={<div>No stacks found</div>}
        header={<h2>CloudFormation Stacks</h2>}
        pagination={<Pagination currentPageIndex={1} pagesCount={1} />}
      />
      <Button onClick={onRefresh}>Refresh</Button>
    </SpaceBetween>
  );
}
